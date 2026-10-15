import { CalendarDate, ChevronLeft, ChevronRight, Flag05, MarkerPin01, Plus, Trash01, User01 } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { requireFeatureEnabled } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { startOfWeek, addDays, toDateParam, dayKey, WEEKDAY_NAMES, CLUB_TIMEZONE } from "@/lib/dates";
import { getSchoolYearsForProfile } from "@/lib/school-years";
import { createScheduleItem, deleteScheduleItem } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Reveal } from "@/components/reveal";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ButtonGroupLinks } from "@/components/button-group-links";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: CLUB_TIMEZONE });

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Activities for your group, week by week."
        actions={
          schoolYears.length > 1 && (
            <ButtonGroupLinks
              items={schoolYears.map((y) => ({
                href: `/schedule?jaar=${y.id}`,
                label: y.name,
                current: selectedYear?.id === y.id,
              }))}
            />
          )
        }
      />

      {!selectedYear && (
        <Card>
          <EmptyState
            icon={CalendarDate}
            title="No group yet"
            description={
              canEdit
                ? "No group has been created yet. Go to Admin to add one."
                : "You haven't been added to a group yet. Contact the admin."
            }
          />
        </Card>
      )}

      {selectedYear && (
        <div className={canEdit ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start" : ""}>
          <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
            <Card className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3">
              <Button
                href={`/schedule?${yearQuery}week=${toDateParam(prevWeek)}`}
                color="tertiary"
                size="sm"
                aria-label="Previous week"
                iconLeading={<ChevronLeft data-icon className="size-5" />}
              >
                <span className="max-sm:hidden">Previous</span>
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
                <span className="text-sm font-semibold text-primary max-sm:hidden">{weekLabel}</span>
                <span className="text-sm font-semibold text-primary sm:hidden">{weekLabelShort}</span>
                <Button
                  href={`/schedule?${yearQuery}week=${toDateParam(startOfWeek(new Date()))}`}
                  color="secondary"
                  size="sm"
                >
                  Today
                </Button>
              </div>
              <Button
                href={`/schedule?${yearQuery}week=${toDateParam(nextWeek)}`}
                color="tertiary"
                size="sm"
                aria-label="Next week"
                iconTrailing={<ChevronRight data-icon className="size-5" />}
              >
                <span className="max-sm:hidden">Next</span>
              </Button>
            </Card>

            {weekMarkers.length > 0 && (
              <div className="space-y-2">
                {weekMarkers.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-primary px-4 py-3 ring-1 ring-brand ring-inset"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FeaturedIcon icon={Flag05} color="brand" theme="light" size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-secondary">{item.title}</p>
                        <p className="text-sm text-brand-tertiary">
                          {formatDay(item.starts_at)} – {formatDay(item.ends_at)}
                        </p>
                      </div>
                    </div>
                    {canDelete(item) && (
                      <form action={deleteScheduleItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton color="link-destructive" size="sm" pendingText="Deleting...">
                          Delete
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}

            {sortedDayKeys.length ? (
              sortedDayKeys.map((key, dayIndex) => {
                const date = new Date(key);
                const dayLabel = `${WEEKDAY_NAMES[date.getUTCDay()]} ${date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}`;
                return (
                  <Reveal key={key} as="section" delayMs={Math.min(dayIndex, 5) * 60}>
                    <h2 className="mb-3 text-sm font-semibold text-tertiary">{dayLabel}</h2>
                    <Card>
                      <ul className="divide-y divide-secondary">
                        {byDay.get(key)!.map((item) => {
                          const organizer = item.profiles;
                          return (
                            <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
                              <div className="flex min-w-0 gap-4">
                                <div className="w-12 shrink-0 text-sm">
                                  <p className="font-semibold text-brand-secondary">{formatTime(item.starts_at)}</p>
                                  <p className="text-quaternary">{formatTime(item.ends_at)}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-primary">{item.title}</p>
                                  <p className="mt-1 flex flex-wrap empty:hidden items-center gap-x-3 gap-y-1 text-sm text-tertiary">
                                    {item.location && (
                                      <span className="inline-flex items-center gap-1">
                                        <MarkerPin01 className="size-4 text-fg-quaternary" aria-hidden="true" />
                                        {item.location}
                                      </span>
                                    )}
                                    {organizer && (
                                      <span className="inline-flex items-center gap-1">
                                        <User01 className="size-4 text-fg-quaternary" aria-hidden="true" />
                                        {organizer.full_name}
                                      </span>
                                    )}
                                  </p>
                                  {item.description && (
                                    <p className="mt-2 text-sm whitespace-pre-wrap text-tertiary">{item.description}</p>
                                  )}
                                </div>
                              </div>
                              {canDelete(item) && (
                                <form action={deleteScheduleItem} className="shrink-0">
                                  <input type="hidden" name="id" value={item.id} />
                                  <SubmitButton
                                    color="tertiary"
                                    size="sm"
                                    aria-label={`Delete ${item.title}`}
                                    iconLeading={<Trash01 data-icon className="size-5" />}
                                  />
                                </form>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  </Reveal>
                );
              })
            ) : (
              <Card>
                <EmptyState icon={CalendarDate} title="Nothing scheduled" description="No activities scheduled this week." />
              </Card>
            )}
          </div>
          {canEdit && (
            <Reveal className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
              <Card as="section">
                <CardHeader title="Add activity" description={`For ${selectedYear.name}.`} />
                <form action={createScheduleItem} className="space-y-4 p-4 sm:p-6">
                  <input type="hidden" name="school_year_id" value={selectedYear.id} />
                  <Input name="title" label="Title" isRequired placeholder="e.g. Board meeting" />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Input name="starts_at" label="Start" type="datetime-local" isRequired defaultValue={defaultStart} />
                    <Input name="ends_at" label="End" type="datetime-local" isRequired defaultValue={defaultEnd} />
                  </div>
                  <Input name="location" label="Location" placeholder="e.g. Clubhouse" />
                  <NativeSelect
                    name="teacher_id"
                    label="Organizer"
                    options={[
                      { value: "", label: "No organizer" },
                      ...organizers.map((t) => ({ value: t.id, label: t.full_name })),
                    ]}
                  />
                  <SubmitButton size="md" className="w-full" pendingText="Adding..." iconLeading={<Plus data-icon className="size-5" />}>
                    Add to schedule
                  </SubmitButton>
                </form>
              </Card>
            </Reveal>
          )}

        </div>
      )}
    </div>
  );
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: CLUB_TIMEZONE });
}
