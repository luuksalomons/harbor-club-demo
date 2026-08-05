import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Royal Mission Portal",
    short_name: "RM Portal",
    description:
      "Interne omgeving voor studenten en docenten van Royal Mission School",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ca2127",
    lang: "nl",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
