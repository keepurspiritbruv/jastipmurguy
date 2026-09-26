import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jastip Tracker",
    short_name: "Jastip",
    description: "Catat pesanan, modal, dan margin jastip langsung dari toko.",
    start_url: "/dasbor",
    display: "standalone",
    background_color: "#f5f5f4",
    theme_color: "#059669",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
