import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api } from './client';

interface AuthCtx {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  token: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('nrms_token'),
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ accessToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('nrms_token', res.accessToken);
    setToken(res.accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nrms_token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
