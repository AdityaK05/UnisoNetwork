import { createContext, useContext, useEffect, useState } from "react";
import authService, { User } from "../services/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => Promise<void>;
};

// Create context with a default value to avoid undefined context issues
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function to set user and persist to localStorage
  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  // Logout function to clear user and remove from localStorage
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  // Check localStorage on initial load to auto-login user if token exists
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      localStorage.removeItem('token'); // Remove invalid token
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
