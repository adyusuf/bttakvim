import { createContext, useContext } from 'react';

export interface AuthState {
  authed: boolean;
  name: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AdminAuthContext = createContext<AuthState>(null as unknown as AuthState);

export const useAdminAuth = () => useContext(AdminAuthContext);
