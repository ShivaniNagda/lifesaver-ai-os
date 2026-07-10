import React from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface SparklineProps {
  data: any[];
  dataKey: string;
  color: string;
  gradientId: string;
  unit?: string;
}

export default function DashboardSparkline({
  data,
  dataKey,
  color,
  gradientId,
  unit = "",
}: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded shadow-lg text-[9px] font-mono text-zinc-300">
                  <div className="font-semibold text-zinc-400">{payload[0].payload.day}</div>
                  <div className="font-bold mt-0.5" style={{ color }}>
                    {payload[0].value}
                    {unit}
                  </div>
                </div>
              );
            }
            return null;
          }}
          cursor={{ stroke: "rgba(255, 255, 255, 0.05)" }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
