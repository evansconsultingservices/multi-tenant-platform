import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { UserService } from '@/services/user.service';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load theme from user profile when user changes
  useEffect(() => {
    if (user?.theme) {
      setThemeState(user.theme);
    }
  }, [user]);

  const setTheme = async (newTheme: Theme) => {
    if (isUpdating || newTheme === theme) return;

    try {
      setIsUpdating(true);
      setThemeState(newTheme);

      // Persist to database if user is logged in
      if (user) {
        await UserService.updateUser(user.id, { theme: newTheme });
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      // Revert on error
      setThemeState(theme);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
