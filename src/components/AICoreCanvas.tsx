import { useEffect, useRef, useState } from "react";

export default function AICoreCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(true);

  // Sync state and ref for hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    isHoveredRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false }); // Optimize canvas rendering context
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    // Viewport Intersection Observer to pause drawing when offscreen
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isVisibleRef.current = entry.isIntersecting;
      }
    }, { threshold: 0.05 });

    if (containerRef.current) {
      intersectionObserver.observe(containerRef.current);
    }

    // Handle container resizing securely
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        width = entryWidth;
        height = entryHeight;
        canvas.width = entryWidth * window.devicePixelRatio;
        canvas.height = entryHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 3D Neural nodes definition
    interface Node3D {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
    }

    const nodes: Node3D[] = [];
    const nodeCount = 30; // Slightly reduced from 36 for optimized mobile math performance
    const radius = 110;

    // Distribute nodes evenly on a sphere using Fibonacci lattice
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(1 - (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      nodes.push({ x, y, z, baseX: x, baseY: y, baseZ: z });
    }

    // Particle field around the sphere
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    const particleCount = 25; // Slightly reduced from 40 for optimal CPU rendering

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.2,
      });
    }

    const angleY = 0.003;
    const angleX = 0.002;

    const animate = () => {
      // Loop request at start
      animationId = requestAnimationFrame(animate);

      // If offscreen, completely skip any rendering/math to save CPU
      if (!isVisibleRef.current) return;

      // Draw dark background explicitly since alpha: false is set for speed
      ctx.fillStyle = "#030712"; // Match background color exactly for higher performance
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw subtle background radial glow
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.8);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.025)");
      gradient.addColorStop(0.5, "rgba(100, 100, 100, 0.005)");
      gradient.addColorStop(1, "rgba(3, 7, 18, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);

      // Adjust rotation speed based on hover state ref (avoids state teardown)
      const hoverActive = isHoveredRef.current;
      const speedMultiplier = hoverActive ? 2.5 : 1;
      const currentAngleY = angleY * speedMultiplier;
      const currentAngleX = angleX * speedMultiplier;

      // Project and rotate 3D nodes
      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);
      const cosX = Math.cos(currentAngleX);
      const sinX = Math.sin(currentAngleX);

      nodes.forEach((node) => {
        // Rotate around Y axis
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        // Rotate around X axis
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        node.x = x1;
        node.y = y2;
        node.z = z2;
      });

      // Sort nodes by depth for correct 3D rendering
      const sortedNodes = [...nodes].sort((a, b) => b.z - a.z);

      // Draw connection lines between nearby nodes
      ctx.lineWidth = 0.4;
      const len = sortedNodes.length;
      for (let i = 0; i < len; i++) {
        const n1 = sortedNodes[i];
        for (let j = i + 1; j < len; j++) {
          const n2 = sortedNodes[j];

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dz = n1.z - n2.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          // Connect nodes closer than threshold (90px => 8100 distSq)
          if (distSq < 8100) {
            const dist = Math.sqrt(distSq);
            const opacity = ((90 - dist) / 90) * 0.12 * ((n1.z + radius) / (2 * radius));
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(cx + n1.x, cy + n1.y);
            ctx.lineTo(cx + n2.x, cy + n2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      sortedNodes.forEach((node) => {
        const scale = (node.z + radius * 1.5) / (radius * 2.5);
        const drawSize = Math.max(1, (hoverActive ? 3.5 : 2.5) * scale);
        const opacity = Math.min(1, Math.max(0.1, 0.5 * scale));

        ctx.beginPath();
        ctx.arc(cx + node.x, cy + node.y, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();

        // Core central pulse for active nodes
        if (hoverActive && Math.random() > 0.98) {
          ctx.beginPath();
          ctx.arc(cx + node.x, cy + node.y, drawSize * 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      });

      // Draw outer ambient floating particles
      particles.forEach((p) => {
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Boundary loop
        if (Math.abs(p.x) > 220) p.x = -p.x;
        if (Math.abs(p.y) > 220) p.y = -p.y;

        const pScale = hoverActive ? 1.4 : 1;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.size * pScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 200, ${p.alpha})`;
        ctx.fill();

        // Connect some particles back to the core nodes
        if (hoverActive && Math.random() > 0.99) {
          const nearestNode = nodes[Math.floor(Math.random() * nodes.length)];
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.moveTo(cx + p.x, cy + p.y);
          ctx.lineTo(cx + nearestNode.x, cy + nearestNode.y);
          ctx.stroke();
        }
      });

      // Draw holographic HUD rings
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      if (hoverActive) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.setLineDash([4, 15]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.5, angleY * 5, angleY * 5 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []); // Run absolutely once on mount to maximize performance and avoid effect recreation

  return (
    <div
      ref={containerRef}
      id="ai-core-container"
      className="relative w-full h-80 md:h-96 flex items-center justify-center cursor-pointer overflow-hidden rounded-3xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="w-full h-full block absolute inset-0 bg-[#030712]" />
      <div className="absolute bottom-6 flex flex-col items-center pointer-events-none select-none">
        <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          AI Core Status
        </span>
        <span className="text-xs text-zinc-300 font-light font-sans mt-1">
          {isHovered ? "Optimizing Schedule..." : "Hover to interact"}
        </span>
      </div>
    </div>
  );
}
