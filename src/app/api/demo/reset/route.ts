import { NextResponse, type NextRequest } from "next/server";
import { resetDemoData } from "@/lib/demo-seed";

// Called by the Vercel Cron job (see vercel.json) every night, and once
// manually right after the first deploy to seed initial data.
export async function POST(request: NextRequest) {
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
