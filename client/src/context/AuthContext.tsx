import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string | { name: string };
  permissions?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginAt?: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loginAt, setLoginAt] = useState<string | null>(localStorage.getItem('loginAt'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Quick client-side expiry check to avoid 401 from getProfile when token is expired
        try {
          const payload = JSON.parse(atob(token.split('.')[1] || '{}'));
          const exp = payload.exp ? payload.exp * 1000 : 0;
          if (exp && Date.now() >= exp) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (_) {
          /* ignore invalid token format */
        }
        try {
          const userData = await authService.getProfile();
          setUser(userData);
          const stored = localStorage.getItem('loginAt');
          if (stored) setLoginAt(stored);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    localStorage.setItem('token', data.accessToken);
    setToken(data.accessToken);

    // Fetch full profile immediately after login to get the latest permissions
    const userData = await authService.getProfile();
    setUser(userData);
    const at = new Date().toISOString();
    localStorage.setItem('loginAt', at);
    setLoginAt(at);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('loginAt');
    setToken(null);
    setUser(null);
  }, []);

  // Auto-logout after session duration (default: 1 hour)
  useEffect(() => {
    const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
    let to: ReturnType<typeof setTimeout> | null = null;
    if (loginAt) {
      const start = new Date(loginAt).getTime();
      const expireAt = start + SESSION_TIMEOUT_MS;
      const remaining = expireAt - Date.now();
      if (remaining <= 0) {
        logout();
      } else {
        to = setTimeout(() => {
          // automatic logout when session expires
          logout();
        }, remaining);
      }
    }
    return () => {
      if (to) clearTimeout(to);
    };
  }, [loginAt, logout]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!user) return false;
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    if (roleName === 'Admin' || roleName === 'SuperAdmin') return true;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return user.permissions.some((p: any) =>
      p.resource === resource && (p.action === action || p.action === '*')
    );
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    loginAt,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
    hasPermission,
  }), [user, token, loginAt, login, logout, loading, hasPermission]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
