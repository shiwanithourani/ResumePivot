import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    console.log('AuthContext - Initializing, stored token:', storedToken ? 'EXISTS' : 'NONE');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('AuthContext - Attempting login for:', email);
      const response = await apiClient.post("/auth/login", { email, password });
      const { token: newToken } = response.data;
      
      console.log('AuthContext - Login successful, token received');
      setToken(newToken);
      localStorage.setItem("authToken", newToken);
      toast.success("Logged in successfully!");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      console.error('AuthContext - Login error:', axiosError.response?.data || axiosError.message);
      toast.error(axiosError.response?.data?.error || "Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('AuthContext - Attempting signup for:', email);
      await apiClient.post("/auth/signup", { email, password });
      toast.success("Signup successful! Please log in.");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      console.error('AuthContext - Signup error:', axiosError.response?.data || axiosError.message);
      toast.error(axiosError.response?.data?.error || "Signup failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('AuthContext - Logging out');
    setToken(null);
    localStorage.removeItem("authToken");
    toast.info("You have been logged out.");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};