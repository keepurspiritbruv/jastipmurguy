import type { Metadata, Viewport } from "next";
import TopLoader from "@/components/top-loader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jastip Tracker",
  description: "Catat pesanan, modal, dan margin jastip langsung dari toko.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jastip" },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <TopLoader />
        {children}
      </body>
    </html>
  );
}
