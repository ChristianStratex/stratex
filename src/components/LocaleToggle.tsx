"use client";

import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { Locale } from "@/lib/enums";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const from = encodeURIComponent(pathname || "/");
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold">
      {(["nl", "en"] as const).map((l) => (
        <a
          key={l}
          href={`/api/locale?locale=${l}&from=${from}`}
          className={clsx(
            "px-2.5 py-1 transition",
            locale === l ? "bg-brand-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50",
          )}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
