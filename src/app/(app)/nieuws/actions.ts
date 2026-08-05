"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createNewsPost(formData: FormData) {
  const profile = await requireRole("docent", "admin");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) return;

  const supabase = await createClient();
  await supabase.from("news_posts").insert({
    author_id: profile.id,
    title,
    body,
  });

  revalidatePath("/nieuws");
}

export async function deleteNewsPost(formData: FormData) {
  await requireRole("docent", "admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("news_posts").delete().eq("id", id);

  revalidatePath("/nieuws");
}
