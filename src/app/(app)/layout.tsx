import { requireProfile } from "@/lib/auth";
import { getFeatureFlags } from "@/lib/features";
import { Nav } from "./nav";
import { DemoBanner } from "@/components/demo-banner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const features = await getFeatureFlags();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <DemoBanner />
      <header className="bg-primary">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Nav profile={profile} features={features} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-6 pt-8 sm:pb-8 sm:pt-10">{children}</main>
    </div>
  );
}
