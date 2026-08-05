import Link from "next/link";
import { requireRole } from "@/lib/auth";
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

const ROLES = ["student", "docent", "admin"] as const;

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

  const students = (users ?? []).filter((u) => u.role === "student");
  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const notEnrolled = students.filter((s) => !enrolledIds.has(s.id));

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-primary">Admin</h1>

      {/* Gebruikers */}
      <section>
        <h2 className="mb-3 font-medium">Gebruikers uitnodigen</h2>
        <form
          action={inviteUser}
          className="mb-6 grid max-w-2xl gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-4"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="E-mailadres"
            className="rounded-md border border-border px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="full_name"
            placeholder="Naam"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <select name="role" className="rounded-md border border-border px-3 py-2 text-sm">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <SubmitButton
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-4"
            pendingText="Bezig..."
          >
            Uitnodiging versturen
          </SubmitButton>
        </form>

        <h2 className="mb-3 font-medium">Alle gebruikers</h2>
        <div className="space-y-2">
          {users?.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm"
            >
              <div>
                <p className="font-medium">{u.full_name || "(geen naam)"}</p>
                <p className="text-xs text-foreground/50">{u.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={updateUserRole} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <select
                    name="role"
                    defaultValue={u.role}
                    className="rounded-md border border-border px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <SubmitButton
                    className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                    pendingText="Bezig..."
                  >
                    Opslaan
                  </SubmitButton>
                </form>
                <form action={toggleZorgcoach}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="is_zorgcoach" value={(!u.is_zorgcoach).toString()} />
                  <SubmitButton
                    className={`rounded-md border px-2 py-1 text-xs ${
                      u.is_zorgcoach
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-border text-foreground/60"
                    }`}
                    pendingText="Bezig..."
                  >
                    {u.is_zorgcoach ? "Is zorgcoach" : "Maak zorgcoach"}
                  </SubmitButton>
                </form>
                <form action={adminSetPassword} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input
                    type="password"
                    name="password"
                    minLength={8}
                    placeholder="Nieuw wachtwoord"
                    className="w-36 rounded-md border border-border px-2 py-1 text-xs"
                  />
                  <SubmitButton
                    className="rounded-md border border-border px-2 py-1 text-xs text-foreground/60 hover:border-primary hover:text-primary"
                    pendingText="Bezig..."
                  >
                    Wachtwoord instellen
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paginabeheer */}
      <section>
        <h2 className="mb-3 font-medium">Paginabeheer</h2>
        <p className="mb-3 text-sm text-foreground/60">
          Een uitgeschakelde pagina verdwijnt uit het menu en is niet meer bereikbaar voor
          gebruikers.
        </p>
        <div className="max-w-md space-y-2">
          {features?.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-sm"
            >
              <span>
                {f.label} {!f.enabled && <span className="ml-2 text-xs text-primary-dark">uitgeschakeld</span>}
              </span>
              <form action={setFeatureEnabled}>
                <input type="hidden" name="key" value={f.key} />
                <input type="hidden" name="enabled" value={(!f.enabled).toString()} />
                <SubmitButton
                  className={`rounded-md border px-2 py-1 text-xs ${
                    f.enabled
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-border text-foreground/60"
                  }`}
                  pendingText="Bezig..."
                >
                  {f.enabled ? "Ingeschakeld" : "Uitgeschakeld"}
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Schooljaren */}
      <section>
        <h2 className="mb-3 font-medium">Schooljaren</h2>
        <form
          action={createSchoolYear}
          className="mb-4 flex max-w-md gap-2 rounded-lg border border-border bg-background p-4"
        >
          <input
            name="name"
            required
            placeholder="Bijv. 2026-2027"
            className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
          />
          <SubmitButton
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            pendingText="Bezig..."
          >
            Toevoegen
          </SubmitButton>
        </form>

        <div className="space-y-2">
          {schoolYears?.map((y) => (
            <div
              key={y.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-sm"
            >
              <span>
                {y.name} {y.is_active && <span className="ml-2 text-xs text-accent">actief</span>}
              </span>
              {!y.is_active && (
                <form action={setActiveSchoolYear}>
                  <input type="hidden" name="id" value={y.id} />
                  <SubmitButton
                    className="rounded-md border border-border px-2 py-1 text-xs text-foreground/60"
                    pendingText="Bezig..."
                  >
                    Maak actief
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Inschrijvingen */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Studenten per schooljaar</h2>
          {schoolYears && schoolYears.length > 1 && (
            <div className="flex gap-2 text-sm">
              {schoolYears.map((y) => (
                <Link
                  key={y.id}
                  href={`/admin?jaar=${y.id}`}
                  className={`rounded-md border px-3 py-1 ${
                    selectedYearId === y.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground/70"
                  }`}
                >
                  {y.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        {!selectedYearId ? (
          <p className="text-sm text-foreground/60">Maak eerst een schooljaar aan.</p>
        ) : (
          <div className="max-w-xl space-y-4">
            <form action={enrollStudent} className="flex gap-2">
              <input type="hidden" name="school_year_id" value={selectedYearId} />
              <select
                name="student_id"
                required
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="">Kies student...</option>
                {notEnrolled.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.email}
                  </option>
                ))}
              </select>
              <SubmitButton
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                pendingText="Bezig..."
              >
                Toevoegen
              </SubmitButton>
            </form>

            <div className="space-y-2">
              {enrollments?.length ? (
                enrollments.map((e) => {
                  const student = e.profiles as unknown as { full_name: string; email: string } | null;
                  return (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-sm"
                    >
                      <span>{student?.full_name || student?.email}</span>
                      <form action={unenrollStudent}>
                        <input type="hidden" name="id" value={e.id} />
                        <SubmitButton className="text-xs text-primary-dark hover:underline" pendingText="Bezig...">
                          Verwijderen
                        </SubmitButton>
                      </form>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-foreground/60">Nog geen studenten in dit schooljaar.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
