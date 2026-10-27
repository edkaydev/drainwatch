import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DrainWatch AI",
    short_name: "DrainWatch",
    description:
      "AI-assisted drainage hazard reporting and hotspot intelligence for a flood-resilient Kampala.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#0d211e",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
