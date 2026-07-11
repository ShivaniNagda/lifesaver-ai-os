import React, { useState, useRef, useEffect } from "react";

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (isLoading || !data || data.length === 0 || !isVisible) {
    return (
      <div ref={containerRef} className="w-full h-full flex flex-col justify-end animate-pulse" id="sparkline-skeleton">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`skeleton-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
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

  // Calculate SVG paths
  const N = data.length;
  const dx = 100 / (N - 1);
  const values = data.map((d) => Number(d[dataKey] || 0));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Map each value to a y-coordinate between 3 and 37
  const yCoords = values.map((val) => 37 - ((val - minVal) / range) * 34);

  // Build crisp straight-line path
  const linePath = yCoords
    .map((y, i) => `${i === 0 ? "M" : "L"} ${(i * dx).toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L 100 40 L 0 40 Z`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Determine which point is closest horizontally
    const pct = mouseX / rect.width;
    const index = Math.max(0, Math.min(N - 1, Math.round(pct * (N - 1))));
    
    setHoveredIndex(index);
    setTooltipPos({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox="0 0 100 40"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Hover vertical line guide */}
        {hoveredIndex !== null && (
          <line
            x1={(hoveredIndex * dx).toFixed(2)}
            y1="0"
            x2={(hoveredIndex * dx).toFixed(2)}
            y2="40"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
        )}

        {/* Shaded Area */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Stroke Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glowing Interactive Dot on Hover */}
        {hoveredIndex !== null && (
          <>
            <circle
              cx={(hoveredIndex * dx).toFixed(2)}
              cy={yCoords[hoveredIndex].toFixed(2)}
              r="2.5"
              fill="#ffffff"
              stroke={color}
              strokeWidth="1.5"
            />
            <circle
              cx={(hoveredIndex * dx).toFixed(2)}
              cy={yCoords[hoveredIndex].toFixed(2)}
              r="5"
              fill={color}
              fillOpacity="0.25"
              className="animate-ping"
            />
          </>
        )}
      </svg>

      {/* Custom HTML Tooltip positioned dynamically relative to the container */}
      {hoveredIndex !== null && activePoint && tooltipPos && (
        <div
          className="absolute z-30 bg-zinc-950/95 border border-zinc-800 px-2 py-1 rounded shadow-xl text-[9px] font-mono text-zinc-300 pointer-events-none transition-all duration-75 whitespace-nowrap"
          style={{
            left: `${Math.min(
              Math.max(4, tooltipPos.x - 45),
              (containerRef.current?.clientWidth || 100) - 95
            )}px`,
            bottom: "100%",
            marginBottom: "6px",
          }}
        >
          <div className="font-semibold text-zinc-400">{activePoint.day}</div>
          <div className="font-bold mt-0.5" style={{ color }}>
            {activePoint[dataKey]}
            {unit}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(DashboardSparkline);
