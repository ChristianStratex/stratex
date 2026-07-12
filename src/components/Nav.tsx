"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { Dictionary } from "@/i18n/dictionaries";

const icons = {
  dashboard: "▣",
  properties: "🏢",
  arrears: "⚠",
  issues: "🔧",
  projects: "🏗",
  tenants: "👤",
  bank: "🏦",
  tax: "€",
} as const;

export function Nav({
  t,
  canViewTax = true,
  canBank = true,
}: {
  t: Dictionary;
  canViewTax?: boolean;
  canBank?: boolean;
}) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: t.nav.dashboard, icon: icons.dashboard, match: (p: string) => p === "/" },
    { href: "/properties", label: t.nav.properties, icon: icons.properties, match: (p: string) => p.startsWith("/properties") },
    { href: "/arrears", label: t.nav.arrears, icon: icons.arrears, match: (p: string) => p.startsWith("/arrears") },
    { href: "/tenants", label: t.nav.tenants, icon: icons.tenants, match: (p: string) => p.startsWith("/tenants") },
    { href: "/issues", label: t.nav.issues, icon: icons.issues, match: (p: string) => p.startsWith("/issues") },
    { href: "/projects", label: t.nav.projects, icon: icons.projects, match: (p: string) => p.startsWith("/projects") },
    ...(canBank
      ? [{ href: "/bank", label: t.nav.bank, icon: icons.bank, match: (p: string) => p.startsWith("/bank") }]
      : []),
    ...(canViewTax
      ? [{ href: "/tax", label: t.nav.tax, icon: icons.tax, match: (p: string) => p.startsWith("/tax") }]
      : []),
  ];
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx("nav-link", item.match(pathname) && "nav-link-active")}
        >
          <span className="w-5 text-center text-base leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
