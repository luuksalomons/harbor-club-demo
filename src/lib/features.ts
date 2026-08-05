import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Moet gelijk lopen met de keys geïnsert in supabase/migrations/0005_page_toggles.sql.
export type FeatureKey = "nieuws" | "rooster" | "berichten" | "zorg" | "info";

export type FeatureFlags = Record<FeatureKey, boolean>;

export async function getFeatureFlags(
  supabase?: SupabaseClient,
): Promise<FeatureFlags> {
  const client = supabase ?? (await createClient());
  const { data } = await client.from("app_features").select("key, enabled");

  const flags = {} as FeatureFlags;
  for (const row of data ?? []) {
    flags[row.key as FeatureKey] = row.enabled;
  }
  return flags;
}

// Zoals requireRole(): stuurt niet-admins naar / zodra een pagina door de
// admin is uitgeschakeld. Ontbreekt de rij (bv. vóór migratie), dan blijft
// de pagina toegankelijk — fail-open, want een ontbrekende instelling is
// geen bewuste keuze van de admin.
export async function requireFeatureEnabled(key: FeatureKey): Promise<void> {
  const flags = await getFeatureFlags();
  if (flags[key] === false) redirect("/");
}
