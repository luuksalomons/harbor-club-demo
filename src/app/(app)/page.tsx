import Image from "next/image";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSchoolYearsForProfile } from "@/lib/school-years";
import { dayKey, toDateParam, startOfWeek, DAG_NAMEN, NL_TIMEZONE } from "@/lib/dates";

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

    // Vakantie-/themaweken (items die langer dan een dag duren) tellen niet
    // als "lesdag" — sla ze over op zoek naar de eerste echte lesdag.
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
        return `${DAG_NAMEN[d.getUTCDay()]} ${d.toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        })}`;
      })()
    : null;

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Image src="/brand/rm-icon.svg" alt="" aria-hidden="true" width={32} height={32} className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Welkom, {profile.full_name || profile.email}
          </h1>
          <div className="mt-1.5 h-0.5 w-12 rounded-full bg-accent" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-background p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-primary">Eerstvolgende lesdag</h2>
            {nextDayKeyValue && (
              <Link
                href={`/rooster?${selectedYear ? `jaar=${selectedYear.id}&` : ""}week=${toDateParam(
                  startOfWeek(new Date(nextDayKeyValue)),
                )}`}
                className="text-xs text-foreground/50 hover:text-primary hover:underline"
              >
                Bekijk rooster
              </Link>
            )}
          </div>
          {!selectedYear ? (
            <p className="text-sm text-foreground/60">
              {profile.role === "student"
                ? "Je bent nog niet aan een schooljaar toegevoegd."
                : "Er is nog geen schooljaar aangemaakt."}
            </p>
          ) : !nextDayLabel ? (
            <p className="text-sm text-foreground/60">Geen geplande lesdagen gevonden.</p>
          ) : (
            <>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                {nextDayLabel}
              </p>
              <div className="space-y-2">
                {nextDayItems.map((item) => {
                  const teacher = item.profiles;
                  return (
                    <div key={item.id} className="text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-foreground/60">
                        {" · "}
                        {new Date(item.starts_at).toLocaleTimeString("nl-NL", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: NL_TIMEZONE,
                        })}
                        –
                        {new Date(item.ends_at).toLocaleTimeString("nl-NL", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: NL_TIMEZONE,
                        })}
                        {item.location ? ` · ${item.location}` : ""}
                        {teacher ? ` · ${teacher.full_name}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="rounded-lg border border-border bg-background p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-primary">Laatste nieuws</h2>
            <Link href="/nieuws" className="text-xs text-foreground/50 hover:text-primary hover:underline">
              Alle nieuws
            </Link>
          </div>
          {newsPosts?.length ? (
            <div className="space-y-4">
              {newsPosts.map((post) => (
                <div key={post.id}>
                  <p className="font-medium">{post.title}</p>
                  <p className="line-clamp-2 text-sm text-foreground/60">{post.body}</p>
                  <p className="mt-1 text-xs text-foreground/40">
                    {post.profiles?.full_name ?? "Onbekend"} ·{" "}
                    {new Date(post.created_at).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/60">Nog geen nieuws geplaatst.</p>
          )}
        </section>
      </div>
    </div>
  );
}
