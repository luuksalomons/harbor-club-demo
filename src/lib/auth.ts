import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "docent" | "admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_zorgcoach: boolean;
  age: number | null;
  gender: string | null;
  created_at: string;
};

// Fetches the signed-in user's profile, or redirects to /login when absent.
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return profile as Profile;
}

// Like requireProfile(), but also redirects home when the role isn't allowed.
export async function requireRole(...roles: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/");
  return profile;
}
