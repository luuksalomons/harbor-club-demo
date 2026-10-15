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
    <div className="flex min-h-screen flex-col bg-secondary">
      <Nav profile={profile} features={features} />
      <div className="flex flex-1 flex-col lg:pl-72">
        <DemoBanner />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-12 sm:px-8 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
