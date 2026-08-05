import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/auth";

export type SchoolYear = { id: string; name: string; is_active: boolean };

// Docent/admin zien alle schooljaren; studenten alleen het schooljaar
// (de schooljaren) waar ze in Admin aan zijn toegevoegd.
export async function getSchoolYearsForProfile(
  supabase: SupabaseClient,
  profile: Profile,
): Promise<SchoolYear[]> {
  if (profile.role === "docent" || profile.role === "admin") {
    const { data } = await supabase
      .from("school_years")
      .select("id, name, is_active")
      .order("name", { ascending: false });
    return data ?? [];
  }

  const { data } = await supabase
    .from("enrollments")
    .select("school_years(id, name, is_active)")
    .eq("student_id", profile.id);
  return (data ?? [])
    .map((row) => row.school_years as unknown as SchoolYear)
    .filter(Boolean);
}
