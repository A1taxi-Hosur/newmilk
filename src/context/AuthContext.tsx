import React, { createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'delivery_partner' | 'customer' | 'farmer';
  supplierId?: string; // For delivery partners, customers, and farmers
  phone?: string;
  address?: string;
}

interface AuthContextType {
  // Add any auth methods here if needed in the future
}

const AuthContext = createContext<AuthContextType>({});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};