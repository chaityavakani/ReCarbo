import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Company } from '../types';
import { authService, LoginPayload, RegisterPayload } from '../services/authService';
import { companyService } from '../services/companyService';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateCompanyProfile: (data: Partial<Company>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('recarbo_token');
    if (!token) {
      setUser(null);
      setCompany(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser.company) {
        setCompany(currentUser.company);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      authService.logout();
      setUser(null);
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      if (response.user.company) {
        setCompany(response.user.company);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      setUser(response.user);
      if (response.user.company) {
        setCompany(response.user.company);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setCompany(null);
  };

  const updateCompanyProfile = async (data: Partial<Company>) => {
    if (!company?.id) return;
    const updated = await companyService.updateCompany(company.id, data);
    setCompany(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateCompanyProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
