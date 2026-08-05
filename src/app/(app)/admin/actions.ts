"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function inviteUser(formData: FormData) {
  await requireRole("admin");

  const email = String(formData.get("email") ?? "").trim();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "student");

  if (!email) return;

  const admin = createAdminClient();
  await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role },
    redirectTo: `${APP_URL}/auth/callback`,
  });

  revalidatePath("/admin");
}

export async function updateUserRole(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!id || !role) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", id);

  revalidatePath("/admin");
}

export async function adminSetPassword(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, { password });

  revalidatePath("/admin");
}

export async function toggleZorgcoach(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const is_zorgcoach = formData.get("is_zorgcoach") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ is_zorgcoach }).eq("id", id);

  revalidatePath("/admin");
}

export async function createSchoolYear(formData: FormData) {
  await requireRole("admin");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("school_years").insert({ name });

  revalidatePath("/admin");
}

export async function setActiveSchoolYear(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("school_years").update({ is_active: false }).neq("id", id);
  await supabase.from("school_years").update({ is_active: true }).eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/rooster");
}

export async function enrollStudent(formData: FormData) {
  await requireRole("admin");
  const student_id = String(formData.get("student_id") ?? "");
  const school_year_id = String(formData.get("school_year_id") ?? "");
  if (!student_id || !school_year_id) return;

  const supabase = await createClient();
  await supabase.from("enrollments").insert({ student_id, school_year_id });

  revalidatePath("/admin");
  revalidatePath("/rooster");
}

export async function unenrollStudent(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("enrollments").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/rooster");
}

export async function setFeatureEnabled(formData: FormData) {
  await requireRole("admin");
  const key = String(formData.get("key") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!key) return;

  const supabase = await createClient();
  await supabase.from("app_features").update({ enabled }).eq("key", key);

  // Zet ook de nav en de betreffende pagina zelf terug op scherp — niet
  // alleen /admin, want /nieuws etc. hebben elk hun eigen cache-entry en
  // layout.tsx (nav) is een gedeeld segment boven alle routes.
  revalidatePath("/", "layout");
}
