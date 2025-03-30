// src/contexts/UserContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UserProfile {
  id: number;
  utorid: string;
  name: string;
  email: string;
  birthday?: string;
  avatarUrl?: string;
  role?: string;
  points?: number;
  createdAt?: string;
  lastLogin?: string;
  verified?: boolean;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateUserAvatar: (avatarUrl: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const updateUserAvatar = (avatarUrl: string) => {
    if (user) {
      setUser({
        ...user,
        avatarUrl
      });
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUserAvatar }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};