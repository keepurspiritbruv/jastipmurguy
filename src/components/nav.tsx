"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dasbor", label: "Dasbor", icon: "📊" },
  { href: "/pesanan", label: "Pesanan", icon: "🧾" },
  { href: "/scan", label: "Scan", icon: "📷" },
  { href: "/pelanggan", label: "Pelanggan", icon: "👥" },
  { href: "/ringkasan", label: "Ringkasan", icon: "🎯" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-emerald-600" : "text-stone-500"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
