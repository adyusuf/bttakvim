import { useState } from 'react';
import { adminApi, clearToken, getToken, setToken } from './api';
import { AdminAuthContext } from './auth-context';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [name, setName] = useState(() => localStorage.getItem('btw_admin_name') ?? 'Yönetici');

  const login = async (email: string, password: string) => {
    const res = await adminApi.login(email, password);
    setToken(res.token);
    localStorage.setItem('btw_admin_name', res.name);
    setName(res.name);
    setAuthed(true);
  };

  const logout = () => {
    clearToken();
    setAuthed(false);
  };

  return <AdminAuthContext.Provider value={{ authed, name, login, logout }}>{children}</AdminAuthContext.Provider>;
}
