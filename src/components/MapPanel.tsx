"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./PropertyMap";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">Kaart laden…</div>
  ),
});

export function MapPanel({ points }: { points: MapPoint[] }) {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200">
      <PropertyMap points={points} />
    </div>
  );
}
