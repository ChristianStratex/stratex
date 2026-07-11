"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { type Role, ROLE_LABELS, ALL_ROLES } from "@/lib/rbac-shared";
import type { Locale } from "@/lib/enums";

const ROLES = ALL_ROLES;

export function RoleSwitcher({ role, locale }: { role: Role; locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const from = encodeURIComponent(pathname || "/");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-left text-xs hover:bg-slate-50"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
          {ROLE_LABELS[role][locale].slice(0, 1)}
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-slate-700">{ROLE_LABELS[role][locale]}</span>
          <span className="block text-[10px] text-slate-400">{locale === "nl" ? "Rol wisselen" : "Switch role"}</span>
        </span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {ROLES.map((r) => (
            <a
              key={r}
              href={`/api/role?role=${r}&from=${from}`}
              className={`block px-3 py-1.5 text-xs hover:bg-slate-50 ${r === role ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-600"}`}
            >
              {ROLE_LABELS[r][locale]}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
