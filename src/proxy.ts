import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts`. This refreshes the
// Supabase session cookie on every request and redirects signed-out users
// away from protected routes.
//
// "/api/demo/reset" is also public here: it has its own Bearer-token check
// against CRON_SECRET (see its route.ts), and Vercel Cron never has a
// Supabase session cookie — without this exemption every nightly cron call
// (and any manual curl trigger) would get redirected to /login before that
// check ever runs, silently no-op'ing the reset.
const PUBLIC_PATHS = ["/login", "/auth", "/api/demo/reset"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Sluit ook statische assets uit (logo/icon in /public, favicon, manifest,
  // service worker, etc.) — anders redirect de auth-check die naar /login
  // voor uitgelogde bezoekers, en breekt bv. het logo op de loginpagina zelf
  // en de PWA-installatie (manifest/sw.js moeten ook uitgelogd bereikbaar zijn).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
