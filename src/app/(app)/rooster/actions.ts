"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localDateTimeToUtcIso } from "@/lib/dates";

export async function createScheduleItem(formData: FormData) {
  const profile = await requireRole("docent", "admin");

  const school_year_id = String(formData.get("school_year_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const teacher_id = String(formData.get("teacher_id") ?? "") || null;
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");

  if (!school_year_id || !title || !starts_at || !ends_at) return;

  const supabase = await createClient();
  await supabase.from("schedule_items").insert({
    school_year_id,
    title,
    location,
    teacher_id,
    starts_at: localDateTimeToUtcIso(starts_at),
    ends_at: localDateTimeToUtcIso(ends_at),
    created_by: profile.id,
  });

  revalidatePath("/rooster");
}

// Docenten mogen alleen agendapunten verwijderen die zij zelf aanmaakten;
// admin mag alles. RLS (schedule_delete_own_or_admin) is de uiteindelijke
// afdwinging — deze check zorgt alleen voor een schone early-return i.p.v.
// een stille no-op delete.
export async function deleteScheduleItem(formData: FormData) {
  const profile = await requireRole("docent", "admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  if (profile.role !== "admin") {
    const { data: item } = await supabase
      .from("schedule_items")
      .select("created_by")
      .eq("id", id)
      .single();
    if (!item || item.created_by !== profile.id) return;
  }

  await supabase.from("schedule_items").delete().eq("id", id);

  revalidatePath("/rooster");
}
