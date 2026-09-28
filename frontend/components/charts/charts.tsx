"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = "#8b97a7";
const GRID = "hsl(217 33% 20%)";

const tooltipStyle = {
  backgroundColor: "hsl(220 38% 15%)",
  border: "1px solid hsl(217 33% 24%)",
  borderRadius: 8,
  fontSize: 12,
  color: "#e6edf5",
};

export function TrendChart({
  data,
}: {
  data: { date: string; score: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ba3ec" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#1ba3ec" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={AXIS} fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#1ba3ec"
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 220,
}: {
  data: { name: string; value: number; hex: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.hex} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HBarChart({
  data,
  height = 240,
}: {
  data: { name: string; value: number; hex?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
      >
        <XAxis type="number" domain={[0, 100]} stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          stroke={AXIS}
          fontSize={11}
          width={110}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(217 33% 20% / 0.4)" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hex ?? "#1ba3ec"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBarChart({
  data,
  height = 240,
}: {
  data: { name: string; value: number; hex?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(217 33% 20% / 0.4)" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hex ?? "#1ba3ec"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FrameworkRadar({
  data,
}: {
  data: { framework: string; score: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="framework" tick={{ fill: AXIS, fontSize: 11 }} />
        <Radar
          dataKey="score"
          stroke="#22d3ee"
          fill="#22d3ee"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
