import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { startOfWeek, addDays, toDateParam, dayKey, WEEKDAY_NAMES, CLUB_TIMEZONE } from "@/lib/dates";
import { getSchoolYearsForProfile } from "@/lib/school-years";
import { createScheduleItem, deleteScheduleItem } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";

type ScheduleItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  teacher_id: string | null;
  created_by: string | null;
  profiles: { full_name: string } | null;
};

export default async function SchedulePage(props: {
  searchParams: Promise<{ jaar?: string; week?: string }>;
}) {
  const { jaar, week } = await props.searchParams;
  const profile = await requireProfile();
  await requireFeatureEnabled("rooster");
  const supabase = await createClient();
  const canEdit = profile.role === "docent" || profile.role === "admin";
  const canDelete = (item: { created_by: string | null }) =>
    profile.role === "admin" || item.created_by === profile.id;

  const schoolYears = await getSchoolYearsForProfile(supabase, profile);

  const selectedYear =
    schoolYears.find((y) => y.id === jaar) ??
    schoolYears.find((y) => y.is_active) ??
    schoolYears[0];

  // Default week: the next upcoming week with a scheduled item from today,
  // otherwise the earliest week with any item, otherwise the current week.
  let weekStart = week ? startOfWeek(new Date(week)) : null;
  if (!weekStart && selectedYear) {
    const now = new Date().toISOString();
    const { data: upcoming } = await supabase
      .from("schedule_items")
      .select("starts_at")
      .eq("school_year_id", selectedYear.id)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(1);
    const { data: earliest } = upcoming?.length
      ? { data: upcoming }
      : await supabase
          .from("schedule_items")
          .select("starts_at")
          .eq("school_year_id", selectedYear.id)
          .order("starts_at", { ascending: true })
          .limit(1);
    weekStart = earliest?.[0] ? startOfWeek(new Date(earliest[0].starts_at)) : startOfWeek(new Date());
  }
  weekStart = weekStart ?? startOfWeek(new Date());
  const weekEnd = addDays(weekStart, 7);
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  const { data: items } = selectedYear
    ? await supabase
        .from("schedule_items")
        .select(
          "id, title, description, location, starts_at, ends_at, teacher_id, created_by, profiles!schedule_items_teacher_id_fkey(full_name)",
        )
        .eq("school_year_id", selectedYear.id)
        .lt("starts_at", weekEnd.toISOString())
        .gt("ends_at", weekStart.toISOString())
        .order("starts_at", { ascending: true })
        .returns<ScheduleItem[]>()
    : { data: [] };

  const organizers = canEdit
    ? (
        await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("role", "docent")
          .order("full_name")
      ).data ?? []
    : [];

  // Items spanning more than a day (e.g. trips/themed weeks) get shown
  // separately from the day-by-day list.
  const weekMarkers = (items ?? []).filter(
    (item) => new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime() > 24 * 60 * 60 * 1000,
  );
  const dayItems = (items ?? []).filter((item) => !weekMarkers.includes(item));

  const byDay = new Map<string, ScheduleItem[]>();
  for (const item of dayItems) {
    const key = dayKey(item.starts_at);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(item);
  }
  const sortedDayKeys = [...byDay.keys()].sort();

  const yearQuery = selectedYear ? `jaar=${selectedYear.id}&` : "";
  const weekEndDate = addDays(weekStart, 6);
  const weekLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} – ${weekEndDate.toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  )}`;
  // Shorter variant for narrow screens, otherwise the week navigation
  // doesn't fit on one line next to the arrows.
  const weekLabelShort = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEndDate.toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short" },
  )}`;
  const defaultStart = `${toDateParam(weekStart)}T09:00`;
  const defaultEnd = `${toDateParam(weekStart)}T12:00`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-primary">Schedule</h1>
        {schoolYears.length > 1 && (
          <div className="flex gap-2 text-sm">
            {schoolYears.map((y) => (
              <Link
                key={y.id}
                href={`/schedule?jaar=${y.id}`}
                className={`rounded-md border px-3 py-1 ${
                  selectedYear?.id === y.id
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

      {!selectedYear && (
        <p className="text-foreground/60">
          {canEdit
            ? "No group has been created yet. Go to Admin to add one."
            : "You haven't been added to a group yet. Contact the admin."}
        </p>
      )}

      {selectedYear && (
        <>
          <Reveal className="mb-6">
            <TiltCard className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 sm:justify-between sm:gap-3">
              <Link
                href={`/schedule?${yearQuery}week=${toDateParam(prevWeek)}`}
                className="rounded-md px-3 py-1 text-sm text-foreground/70 hover:bg-surface"
              >
                ← <span className="hidden sm:inline">Previous week</span>
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-2 text-center sm:gap-3">
                <span className="hidden font-medium sm:inline">{weekLabel}</span>
                <span className="font-medium sm:hidden">{weekLabelShort}</span>
                <Link
                  href={`/schedule?${yearQuery}week=${toDateParam(startOfWeek(new Date()))}`}
                  className="text-xs text-foreground/50 hover:text-primary hover:underline"
                >
                  Today
                </Link>
              </div>
              <Link
                href={`/schedule?${yearQuery}week=${toDateParam(nextWeek)}`}
                className="rounded-md px-3 py-1 text-sm text-foreground/70 hover:bg-surface"
              >
                <span className="hidden sm:inline">Next week</span> →
              </Link>
            </TiltCard>
          </Reveal>

          {weekMarkers.length > 0 && (
            <div className="mb-6 space-y-2">
              {weekMarkers.map((item, i) => (
                <Reveal key={item.id} delayMs={Math.min(i, 5) * 60}>
                  <TiltCard className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                    {item.title}
                    {canDelete(item) && (
                      <form action={deleteScheduleItem} className="mt-1">
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton className="text-xs text-primary-dark hover:underline" pendingText="Deleting...">
                          Delete
                        </SubmitButton>
                      </form>
                    )}
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          )}

          {canEdit && (
            <Reveal className="mb-8">
              <TiltCard className="rounded-lg border border-border bg-background p-4">
                <form action={createScheduleItem} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="school_year_id" value={selectedYear.id} />
                  <input
                    name="title"
                    required
                    placeholder="Title (e.g. Board meeting)"
                    className="rounded-md border border-border px-3 py-2 text-sm sm:col-span-2"
                  />
                  <label className="text-xs text-foreground/60">
                    Start
                    <input
                      name="starts_at"
                      type="datetime-local"
                      required
                      defaultValue={defaultStart}
                      className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs text-foreground/60">
                    End
                    <input
                      name="ends_at"
                      type="datetime-local"
                      required
                      defaultValue={defaultEnd}
                      className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                    />
                  </label>
                  <input
                    name="location"
                    placeholder="Location"
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  />
                  <select name="teacher_id" className="rounded-md border border-border px-3 py-2 text-sm">
                    <option value="">No organizer</option>
                    {organizers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                  <SubmitButton
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-2"
                    pendingText="Adding..."
                  >
                    Add to schedule
                  </SubmitButton>
                </form>
              </TiltCard>
            </Reveal>
          )}

          <div className="space-y-6">
            {sortedDayKeys.length ? (
              sortedDayKeys.map((key) => {
                const date = new Date(key);
                const dayLabel = `${WEEKDAY_NAMES[date.getUTCDay()]} ${date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}`;
                return (
                  <div key={key}>
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                      {dayLabel}
                    </h2>
                    <div className="space-y-2">
                      {byDay.get(key)!.map((item, i) => {
                        const organizer = item.profiles;
                        return (
                          <Reveal key={item.id} delayMs={Math.min(i, 5) * 60}>
                            <TiltCard className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-foreground/60">
                                  {new Date(item.starts_at).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: CLUB_TIMEZONE,
                                  })}{" "}
                                  –{" "}
                                  {new Date(item.ends_at).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: CLUB_TIMEZONE,
                                  })}
                                  {item.location ? ` · ${item.location}` : ""}
                                  {organizer ? ` · ${organizer.full_name}` : ""}
                                </p>
                                {item.description && (
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/50">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              {canDelete(item) && (
                                <form action={deleteScheduleItem}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <SubmitButton className="text-xs text-primary-dark hover:underline" pendingText="Deleting...">
                                    Delete
                                  </SubmitButton>
                                </form>
                              )}
                            </TiltCard>
                          </Reveal>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-foreground/60">No activities scheduled this week.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
