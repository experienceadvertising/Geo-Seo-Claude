import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  plan: string;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  signOut: async () => {},
  refresh: async () => {},
});

// Keep the last-known user only as a hint for the eventual authenticated state.
// Never render account-specific UI from it. The session cookie and /api/auth/me
// remain the source of truth.
const CACHE_KEY = "aeo.lastUser";

function readCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AuthUser;
    if (!data || typeof data.id !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

function writeCachedUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(CACHE_KEY);
  } catch { /* storage may be disabled */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cached = readCachedUser();
  const [user, setUser] = useState<AuthUser | null>(cached);
  // Keep the first paint neutral until the server confirms the session. A
  // cached user can be stale after logout, account switching, or expiry.
  const [isLoaded, setIsLoaded] = useState(false);
  const qc = useQueryClient();

  const fetchUser = useCallback(async () => {
    try {
      const data = await customFetch<AuthUser>("/api/auth/me");
      setUser(data);
      writeCachedUser(data);
    } catch {
      setUser(null);
      writeCachedUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signOut = useCallback(async () => {
    try {
      await customFetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    setUser(null);
    writeCachedUser(null);
    qc.clear();
  }, [qc]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        // A cached user is not an authenticated user. Consumers must wait for
        // the session check before loading account data or changing routes.
        isSignedIn: isLoaded && !!user,
        signOut,
        refresh: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
