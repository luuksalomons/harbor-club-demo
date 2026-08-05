import Image from "next/image";

// Herbruikbare huisstijl-hero voor de losse auth-schermen (login,
// wachtwoord instellen): getextureerde Ruby-band met wit logo, afgesloten
// door de "Royal Arch"-golf uit de huisstijlgids (Huisstijl/Royal Arch).
export function AuthHero() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden bg-primary px-4 pb-14 pt-12 sm:pb-20 sm:pt-16">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: "url(/brand/rm-texture.webp)" }}
        aria-hidden="true"
      />
      <Image
        src="/brand/rm-logo-wit.svg"
        alt="Royal Mission"
        width={200}
        height={21}
        className="relative h-6 w-auto sm:h-7"
        priority
      />
      <img
        src="/brand/rm-arch-inverse.png"
        alt=""
        aria-hidden="true"
        className="brand-wave absolute inset-x-0 bottom-0 h-8 w-full sm:h-12"
        style={{ objectFit: "fill" }}
      />
    </div>
  );
}
