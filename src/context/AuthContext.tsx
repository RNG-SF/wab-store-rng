import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'STORE_MANAGER'
  | 'CONTENT_MANAGER'
  | 'PARTNER'
  | 'CREATOR'
  | 'USER'
  | 'ADMIN'
  | 'STAFF';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  referralCode?: string;
  createdAt: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (perm: string) => boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  register: (data: { username: string; email: string; password: string; phone?: string; referralCode?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  rotatePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rng_token'));
  const [loading, setLoading] = useState(true);

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return permissions.includes(perm);
  };

  const refreshUser = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setPermissions(data.permissions || []);
      } else {
        setUser(null);
        setPermissions([]);
        setToken(null);
        localStorage.removeItem('rng_token');
      }
    } catch (err) {
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login gagal.' };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('rng_token', data.token);

      return {
        success: true,
        mustChangePassword: data.mustChangePassword,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal terhubung ke server.' };
    }
  };

  const register = async (data: { username: string; email: string; password: string; phone?: string; referralCode?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();

      if (!res.ok) {
        return { success: false, error: resData.error || 'Registrasi gagal.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal terhubung ke server.' };
    }
  };

  const logout = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/auth/logout', { method: 'POST', headers });
    } catch (e) {
      // Ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('rng_token');
    }
  };

  const rotatePassword = async (newPassword: string, currentPassword?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ newPassword, currentPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal mengganti password.' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi terputus.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        loading,
        hasPermission,
        login,
        register,
        logout,
        rotatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
