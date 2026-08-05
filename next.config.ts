import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blokkeert dev-only requests (o.a. de HMR-websocket) standaard
  // voor elke origin behalve localhost — nodig om de app via het
  // Tailscale-adres van de server te kunnen openen (bv. vanaf mobiel).
  // Zonder dit faalt de HMR-websocket-handshake stilzwijgend, wat de
  // hele client-side hydratie breekt (geen enkele onClick werkt dan meer).
  allowedDevOrigins: ["100.119.79.18"],
  images: {
    // Alleen onze eigen huisstijl-SVG's in /public/brand, geen user-uploads.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
