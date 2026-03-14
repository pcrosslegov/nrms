import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { api } from './client';

interface AuthConfig {
  azureAd: { enabled: boolean; tenantId?: string; clientId?: string; redirectUri?: string };
  localAuth: { enabled: boolean };
}

interface AuthCtx {
  token: string | null;
  authConfig: AuthConfig | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithAzure: () => Promise<void>;
  logout: () => void;
}

const defaultConfig: AuthConfig = {
  azureAd: { enabled: false },
  localAuth: { enabled: true },
};

const AuthContext = createContext<AuthCtx>({
  token: null,
  authConfig: null,
  login: async () => {},
  loginWithAzure: async () => {},
  logout: () => {},
});

let msalInstance: PublicClientApplication | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('nrms_token'),
  );
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);

  // Fetch auth config on mount
  useEffect(() => {
    fetch('/api/auth/config')
      .then((r) => r.json())
      .then((config: AuthConfig) => {
        setAuthConfig(config);
        if (config.azureAd.enabled && config.azureAd.clientId) {
          msalInstance = new PublicClientApplication({
            auth: {
              clientId: config.azureAd.clientId,
              authority: `https://login.microsoftonline.com/${config.azureAd.tenantId}`,
              redirectUri: config.azureAd.redirectUri || window.location.origin,
            },
            cache: { cacheLocation: 'localStorage' },
          });
          msalInstance.initialize().then(() => {
            // Handle redirect response if returning from Azure login
            msalInstance!.handleRedirectPromise().then((response) => {
              if (response?.accessToken) {
                localStorage.setItem('nrms_token', response.accessToken);
                setToken(response.accessToken);
              }
            });
          });
        }
      })
      .catch(() => setAuthConfig(defaultConfig));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ accessToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('nrms_token', res.accessToken);
    setToken(res.accessToken);
  }, []);

  const loginWithAzure = useCallback(async () => {
    if (!msalInstance || !authConfig?.azureAd.clientId) return;

    try {
      const response = await msalInstance.loginPopup({
        scopes: [`api://${authConfig.azureAd.clientId}/access_as_user`],
      });

      if (response.accessToken) {
        localStorage.setItem('nrms_token', response.accessToken);
        setToken(response.accessToken);
      }
    } catch (err) {
      console.error('Azure AD login failed', err);
      throw err;
    }
  }, [authConfig]);

  const logout = useCallback(() => {
    localStorage.removeItem('nrms_token');
    setToken(null);

    if (msalInstance) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.logoutPopup({ account: accounts[0] }).catch(() => {});
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, authConfig, login, loginWithAzure, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
