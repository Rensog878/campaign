import type { MetadataRoute } from "next";

// Makes the portal installable, and is what PWABuilder reads to build the Android app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "WhatsApp Campaign Portal",
    short_name: "Campaigns",
    description: "Schedule WhatsApp campaigns, manage templates and track every message.",
    start_url: "/login", // signed-in users are forwarded to the dashboard
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f6f3",
    theme_color: "#0c1714",
    categories: ["business", "productivity"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
