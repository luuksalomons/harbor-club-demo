import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { createCareRequest, updateCareRequestStatus } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  afgerond: "Afgerond",
};

export default async function ZorgPage() {
  const profile = await requireProfile();
  await requireFeatureEnabled("zorg");
  const supabase = await createClient();
  const canManage = profile.role === "admin" || profile.is_zorgcoach;

  const { data: ownRequests } = await supabase
    .from("care_requests")
    .select("id, note, status, created_at")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: allRequests } = canManage
    ? await supabase
        .from("care_requests")
        .select("id, note, status, created_at, student_id, profiles(full_name, email)")
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-primary">Zorggesprek aanvragen</h1>
        <p className="mb-4 text-sm text-foreground/60">
          Met één klik ontvangt de zorgcoach een melding. Een toelichting is optioneel.
        </p>
        <form
          action={createCareRequest}
          className="max-w-lg space-y-3 rounded-lg border border-border bg-background p-4"
        >
          <textarea
            name="note"
            rows={2}
            placeholder="Toelichting (optioneel)"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <SubmitButton
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary-foreground"
            pendingText="Bezig..."
          >
            Zorggesprek aanvragen
          </SubmitButton>
        </form>
      </div>

      <div>
        <h2 className="mb-3 font-medium">Jouw aanvragen</h2>
        <div className="space-y-2">
          {ownRequests?.length ? (
            ownRequests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words">{r.note || <em className="text-foreground/50">Geen toelichting</em>}</p>
                  <p className="text-xs text-foreground/50">
                    {new Date(r.created_at).toLocaleString("nl-NL")}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-surface px-2 py-1 text-xs">
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground/60">Je hebt nog geen aanvragen gedaan.</p>
          )}
        </div>
      </div>

      {canManage && (
        <div>
          <h2 className="mb-3 font-medium">Alle aanvragen (zorgcoach)</h2>
          <div className="space-y-2">
            {allRequests?.length ? (
              allRequests.map((r) => {
                const student = r.profiles as unknown as { full_name: string; email: string } | null;
                return (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{student?.full_name ?? student?.email}</p>
                      <p className="break-words">{r.note || <em className="text-foreground/50">Geen toelichting</em>}</p>
                      <p className="text-xs text-foreground/50">
                        {new Date(r.created_at).toLocaleString("nl-NL")}
                      </p>
                    </div>
                    <form action={updateCareRequestStatus} className="flex shrink-0 items-center gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <select
                        name="status"
                        defaultValue={r.status}
                        className="rounded-md border border-border px-2 py-1 text-xs"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <SubmitButton
                        className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                        pendingText="Bezig..."
                      >
                        Opslaan
                      </SubmitButton>
                    </form>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-foreground/60">Geen aanvragen.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
