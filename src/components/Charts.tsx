"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

const PALETTE = ["#1b5df5", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#64748b"];

export interface Slice {
  name: string;
  value: number;
}

export function DonutChart({ data, valuePrefix = "" }: { data: Slice[]; valuePrefix?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => `${valuePrefix}${new Intl.NumberFormat("nl-NL").format(v)}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export interface TrendPoint {
  label: string;
  value: number;
}

export function ValuationChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="valFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b5df5" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#1b5df5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#94a3b8"
          tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip formatter={(v: number) => `€ ${new Intl.NumberFormat("nl-NL").format(v)}`} />
        <Area type="monotone" dataKey="value" stroke="#1b5df5" strokeWidth={2} fill="url(#valFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComparisonChart({
  data,
  personalLabel,
  bvLabel,
}: {
  data: { year: number; personal: number; bv: number }[];
  personalLabel: string;
  bvLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#94a3b8"
          tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip formatter={(v: number) => `€ ${new Intl.NumberFormat("nl-NL").format(Math.round(v))}`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="personal" name={personalLabel} stroke="#8b5cf6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="bv" name={bvLabel} stroke="#1b5df5" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CollectionChart({
  data,
  expectedLabel,
  collectedLabel,
}: {
  data: { periodYm: string; expected: number; collected: number }[];
  expectedLabel: string;
  collectedLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="periodYm" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} width={48} />
        <Tooltip formatter={(v: number) => `€ ${new Intl.NumberFormat("nl-NL").format(v)}`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="expected" name={expectedLabel} fill="#cbd5e1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="collected" name={collectedLabel} fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
