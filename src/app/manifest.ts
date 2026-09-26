import type { MetadataRoute } from "next";

// Lets the portal be added to a phone's home screen and open like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhatsApp Campaign Portal",
    short_name: "Campaigns",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f6f3",
    theme_color: "#0c1714",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
