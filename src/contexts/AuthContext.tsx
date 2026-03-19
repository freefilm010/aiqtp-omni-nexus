import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  /** True only while the initial session check is in-flight. */
  loading: boolean;
  /** True once the initial session check has completed (success or failure). */
  ready: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const markReady = () => {
      if (!active || initializedRef.current) return;
      initializedRef.current = true;
      setLoading(false);
    };

    // CRITICAL: Never block the UI longer than 3 seconds.
    // If Supabase is unreachable (DNS, network, outage), the site still renders.
    const timeout = setTimeout(() => {
      if (!initializedRef.current) {
        console.warn("[Auth] Session check timed out after 3s – rendering without auth");
        markReady();
      }
    }, 3000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (initializedRef.current) setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        markReady();
      })
      .catch((err) => {
        console.error("[Auth] getSession failed:", err);
        markReady();
      });

    return () => {
      active = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      ready: !loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading]
  );

  // IMPORTANT: Always render children immediately.
  // Auth loading state is consumed only by ProtectedRoute, never blocks public pages.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
