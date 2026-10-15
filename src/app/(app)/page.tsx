import { Announcement02, CalendarDate } from "@untitledui/icons";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSchoolYearsForProfile } from "@/lib/school-years";
import { dayKey, toDateParam, startOfWeek, WEEKDAY_NAMES, CLUB_TIMEZONE } from "@/lib/dates";
import { Reveal } from "@/components/reveal";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

type UpcomingItem = {
  id: string;
  title: string;
  location: string;
  starts_at: string;
  ends_at: string;
  profiles: { full_name: string } | null;
};

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const schoolYears = await getSchoolYearsForProfile(supabase, profile);
  const selectedYear = schoolYears.find((y) => y.is_active) ?? schoolYears[0];

  let nextDayItems: UpcomingItem[] = [];
  let nextDayKeyValue: string | null = null;

  if (selectedYear) {
    const { data: upcoming } = await supabase
      .from("schedule_items")
      .select("id, title, location, starts_at, ends_at, profiles!schedule_items_teacher_id_fkey(full_name)")
      .eq("school_year_id", selectedYear.id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(100)
      .returns<UpcomingItem[]>();

    // Multi-day items (e.g. off-site trips) don't count as a single
    // "activity day" — skip them when looking for the next real one.
    const regular = (upcoming ?? []).filter(
      (item) => new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime() <= 24 * 60 * 60 * 1000,
    );
    if (regular.length > 0) {
      nextDayKeyValue = dayKey(regular[0].starts_at);
      nextDayItems = regular.filter((item) => dayKey(item.starts_at) === nextDayKeyValue);
    }
  }

  const { data: newsPosts } = await supabase
    .from("news_posts")
    .select("id, title, body, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(2)
    .returns<{ id: string; title: string; body: string; created_at: string; profiles: { full_name: string } | null }[]>();

  const nextDayLabel = nextDayKeyValue
    ? (() => {
        const d = new Date(nextDayKeyValue!);
        return `${WEEKDAY_NAMES[d.getUTCDay()]} ${d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        })}`;
      })()
    : null;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: CLUB_TIMEZONE });

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile.full_name || profile.email}`}
        description="Here's what's coming up at Harbor Club."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Card as="section" className="h-full">
            <CardHeader
              title="Next activity day"
              description={nextDayLabel ?? undefined}
              actions={
                nextDayKeyValue && (
                  <Button
                    color="link-color"
                    size="sm"
                    href={`/schedule?${selectedYear ? `jaar=${selectedYear.id}&` : ""}week=${toDateParam(
                      startOfWeek(new Date(nextDayKeyValue)),
                    )}`}
                  >
                    View schedule
                  </Button>
                )
              }
            />
            {!selectedYear ? (
              <EmptyState
                icon={CalendarDate}
                title="No group yet"
                description={
                  profile.role === "student"
                    ? "You haven't been added to a group yet."
                    : "No group has been created yet."
                }
              />
            ) : !nextDayLabel ? (
              <EmptyState icon={CalendarDate} title="Nothing planned" description="No upcoming activity days found." />
            ) : (
              <ul className="divide-y divide-secondary">
                {nextDayItems.map((item) => {
                  const organizer = item.profiles;
                  return (
                    <li key={item.id} className="flex gap-4 px-4 py-4 sm:px-6">
                      <FeaturedIcon icon={CalendarDate} color="brand" theme="light" size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary">{item.title}</p>
                        <p className="mt-0.5 text-sm text-tertiary">
                          {formatTime(item.starts_at)} – {formatTime(item.ends_at)}
                          {item.location ? ` · ${item.location}` : ""}
                          {organizer ? ` · ${organizer.full_name}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </Reveal>

        <Reveal delayMs={80}>
          <Card as="section" className="h-full">
            <CardHeader
              title="Latest news"
              actions={
                <Button color="link-color" size="sm" href="/news">
                  All news
                </Button>
              }
            />
            {newsPosts?.length ? (
              <ul className="divide-y divide-secondary">
                {newsPosts.map((post) => (
                  <li key={post.id} className="px-4 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-primary">{post.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-tertiary">{post.body}</p>
                    <p className="mt-2 text-xs text-quaternary">
                      {post.profiles?.full_name ?? "Unknown"} · {new Date(post.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Announcement02} title="No news yet" description="No news posted yet." />
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
