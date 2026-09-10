import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AccessLevel, PERMISSIONS } from '../types';
import { api } from '../services/api';

export interface PresetDemoAccount {
  username: string;
  email: string;
  pass: string;
  name: string;
  role: UserRole;
  accessLevel: AccessLevel;
  organization: string;
  description: string;
}

export const PRESET_ACCOUNTS: PresetDemoAccount[] = [
  {
    username: 'lead.examiner',
    email: 'examiner@satsa.gov.in',
    pass: 'examiner123',
    name: 'Dr. Arunima Sen',
    role: 'Lead Examiner',
    accessLevel: 'L3',
    organization: 'National Supervisory Audit Bureau',
    description: 'Full supervisory authority: analytics rule modification, decision confirmations, synthetic injection, executive dossiers.'
  },
  {
    username: 'soc.supervisor',
    email: 'supervisor@soc.internal',
    pass: 'supervisor123',
    name: 'Rajeev Menon',
    role: 'SOC Supervisor',
    accessLevel: 'L2',
    organization: 'Critical Sector Central SOC',
    description: 'Operational lead: investigates findings, provides operational justifications/acknowledgments, uploads raw datasets.'
  },
  {
    username: 'auditor',
    email: 'auditor@cert.gov.in',
    pass: 'auditor123',
    name: 'Sunita Rao',
    role: 'Auditor',
    accessLevel: 'L1',
    organization: 'CERT-In Supervisory Review Group',
    description: 'Independent oversight: read-only statutory audit trail verification, compliance verification, export signed records.'
  }
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  presetAccounts: PresetDemoAccount[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.authenticated && res.user) {
        setUser(res.user);
      } else {
        api.setToken(null);
        setUser(null);
      }
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (usernameOrEmail: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(usernameOrEmail, pass);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'Lead Examiner') return true; // Lead examiner has full oversight
    return user.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasRole,
        hasPermission,
        presetAccounts: PRESET_ACCOUNTS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
