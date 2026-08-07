import Image from "next/image";

// Shared hero for the standalone auth screens (login, set password): a flat
// navy band with the white logo.
export function AuthHero() {
  return (
    <div className="flex flex-col items-center justify-center bg-primary px-4 pb-10 pt-12 sm:pb-14 sm:pt-16">
      <Image
        src="/brand/harbor-logo-white.svg"
        alt="Harbor Club"
        width={200}
        height={24}
        className="h-6 w-auto sm:h-7"
        priority
      />
    </div>
  );
}
