import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeSupabaseAuthStorage } from "@/lib/browserStorage";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  /** True only while the initial session check is in-flight on protected routes. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSessionValid = (candidate: Session | null) => {
  if (!candidate) return true;
  return Boolean(candidate.user?.id && candidate.access_token);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const markReady = (s: Session | null) => {
      if (!active || initializedRef.current) return;
      initializedRef.current = true;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    // Set up auth state listener FIRST (per Supabase best practices)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      if (!isSessionValid(nextSession)) {
        sanitizeSupabaseAuthStorage();
        setSession(null);
        setUser(null);
        if (initializedRef.current) setLoading(false);
        void supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      // If initial check already completed, any state change immediately reflects
      if (initializedRef.current) setLoading(false);
    });

    // Then get the current session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        if (!isSessionValid(data.session)) {
          sanitizeSupabaseAuthStorage();
          void supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
          markReady(null);
          return;
        }
        markReady(data.session);
      })
      .catch((err) => {
        // Auth failed (network error, etc.) — still mark as ready with no session.
        // User will need to log in again on protected routes.
        // This does NOT skip auth — it correctly reflects "no valid session".
        console.error("[Auth] getSession failed:", err);
        if (!active) return;
        markReady(null);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading]
  );

  // ALWAYS render children immediately.
  // The `loading` flag is ONLY consumed by ProtectedRoute to gate access to
  // authenticated pages. Public pages (homepage, pricing, legal, etc.)
  // render instantly without waiting for auth.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
