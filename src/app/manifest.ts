import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Runwal Realty",
    short_name: "Runwal",
    description: "Homes, offices and city landmarks across Mumbai, Thane and Pune since 1978.",
    start_url: "/",
    display: "standalone",
    background_color: "#eeebe5",
    theme_color: "#16181b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
