"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[60] h-0.5 bg-emerald-500 transition-opacity duration-200 ${
        loading ? "opacity-100 [animation:progress_0.7s_ease-out]" : "opacity-0"
      }`}
    />
  );
}
