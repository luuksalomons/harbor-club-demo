import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? "HarborDemo2026!";

const SEED_ACCOUNTS = [
  {
    email: "admin@harborclub.example",
    full_name: "Alex Morgan",
    role: "admin" as const,
    is_zorgcoach: false,
  },
  {
    email: "board@harborclub.example",
    full_name: "Jamie Rivera",
    role: "docent" as const,
    is_zorgcoach: true,
  },
  {
    email: "member@harborclub.example",
    full_name: "Sam Whitfield",
    role: "student" as const,
    is_zorgcoach: false,
  },
];

const NO_FILTER_UUID = "00000000-0000-0000-0000-000000000000";

// Idempotent: safe to call once (initial seed) and every night (reset).
// Ensures the fixed demo logins exist, removes any accounts created while
// visitors explored the admin "invite user" flow, wipes all demo content,
// and reseeds a fresh, realistic-looking dataset.
export async function resetDemoData(): Promise<void> {
  const admin = createAdminClient();

  // Assumes at most 200 total auth users (3 seed accounts + whatever
  // visitors create via the admin "invite user" flow before the nightly
  // reset runs). Only the first page is fetched — if that assumption is
  // ever exceeded, users beyond the first page won't be seen below and
  // won't get cleaned up. Fine for a demo app; loop over pages if this
  // stops being true.
  const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existingByEmail = new Map((usersPage?.users ?? []).map((u) => [u.email, u]));

  const seedIds = new Map<string, string>();
  for (const account of SEED_ACCOUNTS) {
    const existing = existingByEmail.get(account.email);
    if (existing) {
      seedIds.set(account.email, existing.id);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: account.full_name, role: account.role },
      });
      if (error || !data.user) throw new Error(`Failed to create seed account ${account.email}: ${error?.message}`);
      seedIds.set(account.email, data.user.id);
    }
  }

  const seedEmails = new Set(SEED_ACCOUNTS.map((a) => a.email));
  for (const user of usersPage?.users ?? []) {
    if (user.email && !seedEmails.has(user.email)) {
      await admin.auth.admin.deleteUser(user.id);
    }
  }

  for (const account of SEED_ACCOUNTS) {
    const id = seedIds.get(account.email)!;
    await admin
      .from("profiles")
      .update({
        full_name: account.full_name,
        role: account.role,
        is_zorgcoach: account.is_zorgcoach,
        age: null,
        gender: null,
      })
      .eq("id", id);
  }

  for (const table of ["care_requests", "messages", "schedule_items", "news_posts", "enrollments", "school_years"]) {
    await admin.from(table).delete().neq("id", NO_FILTER_UUID);
  }

  await seedDemoContent(admin, seedIds);
}

async function seedDemoContent(
  admin: ReturnType<typeof createAdminClient>,
  seedIds: Map<string, string>,
) {
  const adminId = seedIds.get("admin@harborclub.example")!;
  const boardId = seedIds.get("board@harborclub.example")!;
  const memberId = seedIds.get("member@harborclub.example")!;

  const { data: groups } = await admin
    .from("school_years")
    .insert([
      { name: "North Team", is_active: true },
      { name: "South Team", is_active: false },
    ])
    .select("id, name");
  const northTeam = groups!.find((g) => g.name === "North Team")!;
  const southTeam = groups!.find((g) => g.name === "South Team")!;

  await admin.from("enrollments").insert([
    { student_id: memberId, school_year_id: northTeam.id },
  ]);

  await admin.from("news_posts").insert([
    {
      author_id: boardId,
      title: "Welcome to Harbor Club",
      body: "This is a sample news post. Board members and admins can post updates here — everyone sees them on the home page and the News tab.",
    },
    {
      author_id: adminId,
      title: "New season starting soon",
      body: "Sign-ups for the new season open next week. Check the Schedule tab for practice times.",
    },
  ]);

  const now = new Date();
  const inDays = (days: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  await admin.from("schedule_items").insert([
    {
      school_year_id: northTeam.id,
      title: "Weekly practice",
      location: "Main hall",
      teacher_id: boardId,
      starts_at: inDays(1, 18),
      ends_at: inDays(1, 20),
      created_by: boardId,
    },
    {
      school_year_id: northTeam.id,
      title: "Board meeting",
      location: "Clubhouse office",
      teacher_id: adminId,
      starts_at: inDays(3, 19),
      ends_at: inDays(3, 20),
      created_by: adminId,
    },
    {
      school_year_id: southTeam.id,
      title: "Friendly match",
      location: "Riverside field",
      teacher_id: boardId,
      starts_at: inDays(5, 14),
      ends_at: inDays(5, 16),
      created_by: boardId,
    },
  ]);

  await admin.from("messages").insert([
    {
      sender_id: memberId,
      recipient_id: boardId,
      body: "Hi! Do I need to bring my own equipment to practice this week?",
    },
    {
      sender_id: boardId,
      recipient_id: memberId,
      body: "Good question — everything is provided, just bring water and comfortable shoes.",
    },
  ]);

  await admin.from("care_requests").insert([
    {
      student_id: memberId,
      note: "I'd like to talk about switching to the South Team schedule.",
      status: "open",
    },
  ]);
}
