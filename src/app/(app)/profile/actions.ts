"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const GENDERS = ["man", "vrouw", "anders"];

export async function updateOwnProfile(formData: FormData) {
  const profile = await requireProfile();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const genderRaw = String(formData.get("gender") ?? "");

  const age = ageRaw ? Number(ageRaw) : null;
  const gender = GENDERS.includes(genderRaw) ? genderRaw : null;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      full_name,
      age: age !== null && Number.isFinite(age) ? age : null,
      gender,
    })
    .eq("id", profile.id);

  // Ook de layout revalidaten: die toont de naam in de navigatiebalk en
  // leest 'm los uit dezelfde profiles-rij.
  revalidatePath("/", "layout");
}

export async function updateOwnPassword(_prevState: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", success: false };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Could not change password. Try again.", success: false };
  }

  return { error: "", success: true };
}
