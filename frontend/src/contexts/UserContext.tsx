// src/contexts/UserContext.tsx
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { api } from '../lib/api/fetchWrapper';
import { User } from '../lib/api/userMe';

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  handleLogout: () => void;
  refreshUser: () => Promise<void>; // Add this to the interface
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.getCurrentUser() as User;
      setUser(data);
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const data = await api.getCurrentUser() as User;
      setUser(data);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const updateUserAvatar = (avatarUrl: string) => {
    if (user) {
      setUser({
        ...user,
        avatarUrl
      });
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      setUser, 
      updateUserAvatar, 
      handleLogout,
      refreshUser
    }}>
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