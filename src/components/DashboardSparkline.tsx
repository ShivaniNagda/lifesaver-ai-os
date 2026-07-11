import React from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface SparklineProps {
  data: any[];
  dataKey: string;
  color: string;
  gradientId: string;
  unit?: string;
  isLoading?: boolean;
}

function DashboardSparkline({
  data,
  dataKey,
  color,
  gradientId,
  unit = "",
  isLoading = false,
}: SparklineProps) {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col justify-end animate-pulse" id="sparkline-skeleton">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`skeleton-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Animated skeleton path mimicking a premium sparkline wave */}
          <path
            d="M 0,32 Q 15,18 30,26 T 60,12 T 80,22 T 100,8"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.4"
            strokeDasharray="3 3"
          />
          <path
            d="M 0,32 Q 15,18 30,26 T 60,12 T 80,22 T 100,8 L 100,40 L 0,40 Z"
            fill={`url(#skeleton-grad-${gradientId})`}
          />
        </svg>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={150}>
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

export default React.memo(DashboardSparkline, (prevProps, nextProps) => {
  // Only re-render if key prop dependencies change
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.dataKey !== nextProps.dataKey) return false;
  if (prevProps.color !== nextProps.color) return false;
  if (prevProps.gradientId !== nextProps.gradientId) return false;
  if (prevProps.unit !== nextProps.unit) return false;

  // Perform full deep/shallow array check to detect actual data updates
  if (prevProps.data === nextProps.data) return true;
  if (!prevProps.data || !nextProps.data) return false;
  if (prevProps.data.length !== nextProps.data.length) return false;

  for (let i = 0; i < prevProps.data.length; i++) {
    const p = prevProps.data[i];
    const n = nextProps.data[i];
    if (typeof p === "object" && typeof n === "object") {
      if (JSON.stringify(p) !== JSON.stringify(n)) {
        return false;
      }
    } else if (p !== n) {
      return false;
    }
  }

  return true;
});

