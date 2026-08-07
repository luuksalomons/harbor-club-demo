import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Harbor Club Portal (Demo)",
    short_name: "Harbor Club",
    description: "Live demo of a self-service member portal for schools, clubs, and organizations.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1b4965",
    lang: "en",
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
