import { createContext, useContext, useState } from 'react';
import { adminApi, clearToken, getToken, setToken } from './api';

interface AuthState {
  authed: boolean;
  name: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState>(null as unknown as AuthState);

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

  return <Ctx.Provider value={{ authed, name, login, logout }}>{children}</Ctx.Provider>;
}

export const useAdminAuth = () => useContext(Ctx);
