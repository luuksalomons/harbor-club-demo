"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendCareRequestEmail } from "@/lib/email";

export async function createCareRequest(formData: FormData) {
  const profile = await requireProfile();
  const note = String(formData.get("note") ?? "").trim();

  const supabase = await createClient();
  await supabase.from("care_requests").insert({
    student_id: profile.id,
    note,
  });

  const { data: zorgcoaches } = await supabase
    .from("profiles")
    .select("email")
    .eq("is_zorgcoach", true);

  await sendCareRequestEmail({
    to: (zorgcoaches ?? []).map((z) => z.email),
    studentName: profile.full_name || profile.email,
    note,
  });

  revalidatePath("/contact");
}

export async function updateCareRequestStatus(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase.from("care_requests").update({ status }).eq("id", id);

  revalidatePath("/contact");
}
