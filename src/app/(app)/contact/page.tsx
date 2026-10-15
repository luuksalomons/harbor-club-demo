import { LifeBuoy01 } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { createCareRequest, updateCareRequestStatus } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { initials } from "@/lib/initials";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/card";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { NativeSelect } from "@/components/base/select/select-native";
import { TextArea } from "@/components/base/textarea/textarea";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_behandeling: "In Progress",
  afgerond: "Resolved",
};

export default async function ContactPage() {
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
    <div>
      <PageHeader title="Contact Requests" description="One click notifies the board. A note is optional." />

      <div className="space-y-10">
        <Reveal className="max-w-xl">
          <Card as="section">
            <div className="flex gap-4 p-4 sm:p-6">
              <FeaturedIcon icon={LifeBuoy01} color="brand" theme="light" size="lg" className="max-sm:hidden" />
              <form action={createCareRequest} className="flex-1 space-y-4">
                <TextArea name="note" label="Note" rows={3} placeholder="Anything the board should know? (optional)" />
                <SubmitButton size="md" pendingText="Sending...">
                  Request contact
                </SubmitButton>
              </form>
            </div>
          </Card>
        </Reveal>

        <section>
          <SectionHeader title="Your requests" />
          <Card>
            {ownRequests?.length ? (
              <ul className="divide-y divide-secondary">
                {ownRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm break-words text-primary">
                        {r.note || <em className="text-quaternary">No note</em>}
                      </p>
                      <p className="mt-0.5 text-sm text-tertiary">{new Date(r.created_at).toLocaleString("en-GB")}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={LifeBuoy01} title="No requests yet" description="You haven't made any requests yet." />
            )}
          </Card>
        </section>

        {canManage && (
          <section>
            <SectionHeader title="All requests" description="Visible to the board and contact team." />
            <Card>
              {allRequests?.length ? (
                <ul className="divide-y divide-secondary">
                  {allRequests.map((r) => {
                    const member = r.profiles as unknown as { full_name: string; email: string } | null;
                    const name = member?.full_name || member?.email || "Unknown";
                    return (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <Avatar size="md" initials={initials(name)} alt={name} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-primary">{name}</p>
                              <StatusBadge status={r.status} />
                            </div>
                            <p className="mt-0.5 text-sm break-words text-tertiary">
                              {r.note || <em className="text-quaternary">No note</em>}
                            </p>
                            <p className="mt-0.5 text-xs text-quaternary">
                              {new Date(r.created_at).toLocaleString("en-GB")}
                            </p>
                          </div>
                        </div>
                        <form action={updateCareRequestStatus} className="flex shrink-0 items-center gap-2">
                          <input type="hidden" name="id" value={r.id} />
                          <NativeSelect
                            name="status"
                            size="sm"
                            aria-label="Status"
                            defaultValue={r.status}
                            className="w-36"
                            options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                          />
                          <SubmitButton color="secondary" size="sm" pendingText="Saving...">
                            Save
                          </SubmitButton>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={LifeBuoy01} title="No requests" description="Nobody has asked for contact yet." />
              )}
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "afgerond" ? "success" : status === "in_behandeling" ? "warning" : "brand";
  return (
    <BadgeWithDot type="pill-color" color={color} size="sm">
      {STATUS_LABELS[status] ?? status}
    </BadgeWithDot>
  );
}
