import { Plus, UserPlus01, Users01 } from "@untitledui/icons";
import { requireRole, ROLE_LABELS, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  inviteUser,
  updateUserRole,
  adminSetPassword,
  toggleZorgcoach,
  createSchoolYear,
  setActiveSchoolYear,
  enrollStudent,
  unenrollStudent,
  setFeatureEnabled,
} from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { initials } from "@/lib/initials";
import { Reveal } from "@/components/reveal";
import { Card, CardHeader } from "@/components/card";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ButtonGroupLinks } from "@/components/button-group-links";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";

const ROLES: Role[] = ["student", "docent", "admin"];

export default async function AdminPage(props: {
  searchParams: Promise<{ jaar?: string }>;
}) {
  const { jaar } = await props.searchParams;
  await requireRole("admin");
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_zorgcoach")
    .order("full_name");

  const { data: features } = await supabase
    .from("app_features")
    .select("key, label, enabled")
    .order("label");

  const { data: schoolYears } = await supabase
    .from("school_years")
    .select("id, name, is_active")
    .order("name", { ascending: false });

  const selectedYearId =
    jaar ?? schoolYears?.find((y) => y.is_active)?.id ?? schoolYears?.[0]?.id;

  const { data: enrollments } = selectedYearId
    ? await supabase
        .from("enrollments")
        .select("id, student_id, profiles(full_name, email)")
        .eq("school_year_id", selectedYearId)
    : { data: [] };

  const members = (users ?? []).filter((u) => u.role === "student");
  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const notEnrolled = members.filter((s) => !enrolledIds.has(s.id));

  const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

  return (
    <div>
      <PageHeader title="Admin" description="Manage users, pages and groups." />

      <div className="space-y-12">
        {/* Users */}
        <section>
          <SectionHeader title="Users" description="Invite people and manage their role and access." />
          <Reveal className="mb-6">
            <Card as="section">
              <CardHeader title="Invite user" description="They'll receive an email to set their password." />
              <form action={inviteUser} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[2fr_1.5fr_1fr_auto] lg:items-end">
                <Input
                  name="email"
                  type="email"
                  label="Email address"
                  isRequired
                  placeholder="name@example.com"
                />
                <Input name="full_name" label="Name" placeholder="Full name" />
                <NativeSelect name="role" label="Role" options={roleOptions} />
                <SubmitButton size="md" pendingText="Sending..." iconLeading={<UserPlus01 data-icon className="size-5" />}>
                  Send invite
                </SubmitButton>
              </form>
            </Card>
          </Reveal>

          <Card>
            <ul className="divide-y divide-secondary">
              {users?.map((u) => {
                const name = u.full_name || u.email;
                return (
                  <li key={u.id} className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="md" initials={initials(name)} alt={name} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-primary">{u.full_name || "(no name)"}</p>
                          {u.is_zorgcoach && (
                            <Badge type="pill-color" color="success" size="sm">
                              Contact team
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-sm text-tertiary">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <NativeSelect
                          name="role"
                          size="sm"
                          aria-label={`Role for ${name}`}
                          defaultValue={u.role}
                          className="w-28"
                          options={roleOptions}
                        />
                        <SubmitButton color="secondary" size="sm" pendingText="Saving...">
                          Save
                        </SubmitButton>
                      </form>
                      <form action={toggleZorgcoach}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="is_zorgcoach" value={(!u.is_zorgcoach).toString()} />
                        <SubmitButton color="secondary" size="sm" pendingText="Saving...">
                          {u.is_zorgcoach ? "Remove from contact team" : "Add to contact team"}
                        </SubmitButton>
                      </form>
                      <form action={adminSetPassword} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <Input
                          name="password"
                          type="password"
                          size="sm"
                          minLength={8}
                          aria-label={`New password for ${name}`}
                          placeholder="New password"
                          className="w-40"
                        />
                        <SubmitButton color="secondary" size="sm" pendingText="Saving...">
                          Set password
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>

        {/* Page management */}
        <section>
          <SectionHeader
            title="Page management"
            description="A disabled page disappears from the menu and is no longer reachable by users."
          />
          <Card className="max-w-2xl">
            <ul className="divide-y divide-secondary">
              {features?.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-primary">{f.label}</span>
                    <BadgeWithDot type="pill-color" color={f.enabled ? "success" : "gray"} size="sm">
                      {f.enabled ? "Enabled" : "Disabled"}
                    </BadgeWithDot>
                  </div>
                  <form action={setFeatureEnabled}>
                    <input type="hidden" name="key" value={f.key} />
                    <input type="hidden" name="enabled" value={(!f.enabled).toString()} />
                    <SubmitButton color={f.enabled ? "secondary-destructive" : "secondary"} size="sm" pendingText="Saving...">
                      {f.enabled ? "Disable" : "Enable"}
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Groups */}
        <section>
          <SectionHeader title="Groups" description="The active group is shown by default on the schedule." />
          <div className="grid max-w-2xl gap-4">
            <Card className="p-4 sm:p-6">
              <form action={createSchoolYear} className="flex items-start gap-3">
                <Input name="name" isRequired aria-label="Group name" placeholder="e.g. North Team" className="flex-1" />
                <SubmitButton size="md" pendingText="Adding..." iconLeading={<Plus data-icon className="size-5" />}>
                  Add
                </SubmitButton>
              </form>
            </Card>

            {!!schoolYears?.length && (
              <Card>
                <ul className="divide-y divide-secondary">
                  {schoolYears.map((y) => (
                    <li key={y.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-primary">{y.name}</span>
                        {y.is_active && (
                          <BadgeWithDot type="pill-color" color="success" size="sm">
                            Active
                          </BadgeWithDot>
                        )}
                      </div>
                      {!y.is_active && (
                        <form action={setActiveSchoolYear}>
                          <input type="hidden" name="id" value={y.id} />
                          <SubmitButton color="secondary" size="sm" pendingText="Saving...">
                            Make active
                          </SubmitButton>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </section>

        {/* Enrollments */}
        <section className="max-w-2xl">
          <SectionHeader
            title="Members per group"
            actions={
              schoolYears &&
              schoolYears.length > 1 && (
                <ButtonGroupLinks
                  items={schoolYears.map((y) => ({
                    href: `/admin?jaar=${y.id}`,
                    label: y.name,
                    current: selectedYearId === y.id,
                  }))}
                />
              )
            }
          />
          {!selectedYearId ? (
            <Card>
              <EmptyState icon={Users01} title="No groups yet" description="Create a group first." />
            </Card>
          ) : (
            <Card>
              <form action={enrollStudent} className="flex items-start gap-3 border-b border-secondary p-4 sm:px-6">
                <input type="hidden" name="school_year_id" value={selectedYearId} />
                <NativeSelect
                  name="student_id"
                  required
                  aria-label="Member"
                  className="flex-1"
                  options={[
                    { value: "", label: "Choose member..." },
                    ...notEnrolled.map((m) => ({ value: m.id, label: m.full_name || m.email })),
                  ]}
                />
                <SubmitButton size="md" pendingText="Adding..." iconLeading={<Plus data-icon className="size-5" />}>
                  Add
                </SubmitButton>
              </form>

              {enrollments?.length ? (
                <ul className="divide-y divide-secondary">
                  {enrollments.map((e) => {
                    const member = e.profiles as unknown as { full_name: string; email: string } | null;
                    const name = member?.full_name || member?.email || "Unknown";
                    return (
                      <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar size="sm" initials={initials(name)} alt={name} />
                          <span className="truncate text-sm font-medium text-primary">{name}</span>
                        </div>
                        <form action={unenrollStudent}>
                          <input type="hidden" name="id" value={e.id} />
                          <SubmitButton color="link-destructive" size="sm" pendingText="Removing...">
                            Remove
                          </SubmitButton>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={Users01} title="No members yet" description="No members in this group yet." />
              )}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
