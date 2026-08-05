"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendNewMessageEmail } from "@/lib/email";

export async function sendMessage(formData: FormData) {
  const profile = await requireProfile();
  const recipient_id = String(formData.get("recipient_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!recipient_id || !body) return;

  const supabase = await createClient();
  await supabase.from("messages").insert({
    sender_id: profile.id,
    recipient_id,
    body,
  });

  const { data: recipient } = await supabase
    .from("profiles")
    .select("email, role, full_name")
    .eq("id", recipient_id)
    .single();

  if (recipient?.role === "docent" || recipient?.role === "admin") {
    await sendNewMessageEmail({
      to: recipient.email,
      senderName: profile.full_name || profile.email,
      preview: body.slice(0, 200),
    });
  }

  revalidatePath("/berichten");
}
