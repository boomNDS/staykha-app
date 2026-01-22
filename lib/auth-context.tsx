/**
 * Auth context using Jotai for state management
 * Provides a React Context interface while using Jotai atoms under the hood
 * This allows gradual migration - components can use useAuth() hook as before
 */

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { authApi } from "./api-client";
import { isLoadingAuthAtom, userAtom } from "./atoms";
import type { User } from "./types";

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
  // Using useRef to store the latest loadUser function to avoid dependency issues
  const loadUserRef = React.useRef<(() => Promise<void>) | undefined>(undefined);

  const loadUser = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoading(false); // Set loading to false immediately with cached data
        
        // Fetch fresh user data from /auth/me in the background
        try {
          const meResponse = await authApi.getMe(token);
          if (meResponse.user) {
            setUser(meResponse.user);
            localStorage.setItem("user", JSON.stringify(meResponse.user));
            
            // Update token if a new one was returned
            if (meResponse.token && meResponse.token !== token) {
              localStorage.setItem("token", meResponse.token);
              
              if (import.meta.env.DEV) {
                console.log("[Auth Context] Token refreshed");
              }
            }
            
            if (import.meta.env.DEV) {
              console.log("[Auth Context] Refreshed user data from /auth/me:", meResponse.user);
            }
          }
        } catch (error) {
          // If fetching fails (e.g., token expired), clear auth data
          console.warn("[Auth Context] Failed to fetch fresh user data:", error);
          // Don't clear immediately - let the user try to use the app
          // The API will return 401 and they'll be redirected
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsLoading(false);
      }
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [setUser, setIsLoading]);

  // Keep ref updated
  loadUserRef.current = loadUser;

  React.useEffect(() => {
    void loadUser();

    // Listen for storage changes (when user is updated in other tabs/components)
    const handleStorageChange = () => {
      void loadUserRef.current?.();
    };

    // Listen to both storage events (cross-tab) and custom events (same-tab)
    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab updates
    const handleCustomStorage = () => {
      void loadUserRef.current?.();
    };
    window.addEventListener("userUpdated", handleCustomStorage);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleCustomStorage);
    };
    // Only run on mount - event handlers use ref to get latest function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    console.log("[Auth Context] Login attempt:", { email });
    try {
      const data = await authApi.login(email, password);
      console.log("[Auth Context] Login successful:", {
        user: data.user,
        hasToken: !!data.token,
        hasRefreshToken: !!data.refreshToken,
        hasTeamId: !!data.user.teamId,
      });
      
      // Login response already includes complete user info with teamId
      // No need to call /me API - use the data directly
      localStorage.setItem("token", data.token);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error("[Auth Context] Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
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
