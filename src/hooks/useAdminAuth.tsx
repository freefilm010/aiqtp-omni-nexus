import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const adminRoleCache = new Map<string, boolean>();
const pendingAdminRoleChecks = new Map<string, Promise<boolean>>();

const resolveAdminRole = async (userId: string) => {
  const cached = adminRoleCache.get(userId);
  if (cached !== undefined) return cached;

  const pending = pendingAdminRoleChecks.get(userId);
  if (pending) return pending;

  const request = (async () => {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (error) throw error;

      const isAdmin = Boolean(data);
      adminRoleCache.set(userId, isAdmin);
      return isAdmin;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    } finally {
      pendingAdminRoleChecks.delete(userId);
    }
  })();

  pendingAdminRoleChecks.set(userId, request);
  return request;
};

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (authLoading) {
      setLoading(true);
      return () => {
        active = false;
      };
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const cached = adminRoleCache.get(user.id);
    if (cached !== undefined) {
      setIsAdmin(cached);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);

    resolveAdminRole(user.id).then((value) => {
      if (!active) return;
      setIsAdmin(value);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user?.id, authLoading]);

  return { isAdmin, loading: loading || authLoading, user };
};

