import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = "admin" | "moderator" | "user";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Failed to fetch user role:", error);
        setRole("user");
      } else {
        setRole(data.role as UserRole);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || role === "admin";

  return { role, isAdmin, isModerator, loading };
};
