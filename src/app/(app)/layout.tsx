import { requireProfile } from "@/lib/auth";
import { getFeatureFlags } from "@/lib/features";
import { Nav } from "./nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const features = await getFeatureFlags();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="brand-header relative bg-primary">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Nav profile={profile} features={features} />
        </div>
        <img
          src="/brand/rm-arch-inverse.png"
          alt=""
          aria-hidden="true"
          className="brand-wave pointer-events-none absolute inset-x-0 w-full"
          style={{ bottom: "-40px", height: "60px", objectFit: "fill" }}
        />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-6 pt-12 sm:pb-8 sm:pt-16">{children}</main>
    </div>
  );
}
