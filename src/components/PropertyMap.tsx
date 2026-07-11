"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";

export interface MapPoint {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  health: "good" | "warning" | "critical";
  income: string;
  woz: string;
}

const HEALTH_HEX: Record<string, string> = {
  good: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export default function PropertyMap({ points }: { points: MapPoint[] }) {
  const valid = points.filter((p) => p.lat && p.lng);
  const center: [number, number] = valid.length
    ? [
        valid.reduce((s, p) => s + p.lat, 0) / valid.length,
        valid.reduce((s, p) => s + p.lng, 0) / valid.length,
      ]
    : [53.2, 5.79];

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {valid.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={9}
          pathOptions={{
            color: HEALTH_HEX[p.health],
            fillColor: HEALTH_HEX[p.health],
            fillOpacity: 0.75,
            weight: 2,
          }}
        >
          <Popup>
            <div className="space-y-0.5">
              <div className="font-semibold">{p.name}</div>
              <div className="text-slate-500">{p.city}</div>
              <div className="text-slate-600">WOZ: {p.woz}</div>
              <div className="text-slate-600">Huur/mnd: {p.income}</div>
              <Link href={`/properties/${p.id}`} className="text-brand-600 underline">
                Details →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
