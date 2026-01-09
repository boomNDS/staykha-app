/**
 * Auth context using Jotai for state management
 * Provides a React Context interface while using Jotai atoms under the hood
 * This allows gradual migration - components can use useAuth() hook as before
 */
import * as React from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { authApi } from "./api-client";
import type { User } from "./types";
import { userAtom, isLoadingAuthAtom } from "./atoms";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAuthAtom);

  // Check authentication on mount and listen for storage changes
  const loadUser = React.useCallback(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [setUser, setIsLoading]);

  React.useEffect(() => {
    loadUser();
    
    // Listen for storage changes (when user is updated in other tabs/components)
    const handleStorageChange = () => {
      loadUser();
    };
    
    // Listen to both storage events (cross-tab) and custom events (same-tab)
    window.addEventListener("storage", handleStorageChange);
    
    // Custom event for same-tab updates
    const handleCustomStorage = () => {
      loadUser();
    };
    window.addEventListener("userUpdated", handleCustomStorage);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleCustomStorage);
    };
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    console.log("[Auth Context] Login attempt:", { email });
    try {
      const data = await authApi.login(email, password);
      console.log("[Auth Context] Login successful:", { user: data.user, hasToken: !!data.token });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error("[Auth Context] Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.assign("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Direct Jotai hooks for components that want to use atoms directly
 * These can be used instead of useAuth() for better performance in some cases
 */
export function useUser() {
  return useAtomValue(userAtom);
}

export function useSetUser() {
  return useSetAtom(userAtom);
}

export function useIsLoadingAuth() {
  return useAtomValue(isLoadingAuthAtom);
}
