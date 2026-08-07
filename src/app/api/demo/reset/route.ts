import { NextResponse, type NextRequest } from "next/server";
import { resetDemoData } from "@/lib/demo-seed";

// Vercel Cron sends a GET request with an `Authorization: Bearer $CRON_SECRET`
// header (see vercel.json) every night. POST is also supported so the same
// endpoint can be triggered manually via curl right after the first deploy
// (see the plan's Task 16 Step 4).
async function handleReset(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  // Also reject when CRON_SECRET itself is unset — otherwise the expected
  // value collapses to the literal string "Bearer undefined" and anyone who
  // sends that exact header could trigger a destructive data wipe/reseed.
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await resetDemoData();
  return NextResponse.json({ ok: true });
}

export const GET = handleReset;
export const POST = handleReset;
