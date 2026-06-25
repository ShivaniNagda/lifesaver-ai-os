import { useEffect, useRef, useState } from "react";

export default function AICoreCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

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
    const nodeCount = 36;
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
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let angleY = 0.003;
    let angleX = 0.002;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background radial glow
      const cx = width / 2;
      const cy = height / 2;

      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.8);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.035)");
      gradient.addColorStop(0.5, "rgba(100, 100, 100, 0.01)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);

      // Adjust rotation speed based on hover state
      const speedMultiplier = isHovered ? 2.5 : 1;
      const currentAngleY = angleY * speedMultiplier;
      const currentAngleX = angleX * speedMultiplier;

      // Project and rotate 3D nodes
      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);
      const cosX = Math.cos(currentAngleX);
      const sinX = Math.sin(currentAngleX);

      nodes.forEach((node) => {
        // Rotate around Y axis
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;

        // Rotate around X axis
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.y * sinX;

        node.x = x1;
        node.y = y2;
        node.z = z2;
      });

      // Sort nodes by depth for correct 3D rendering
      const sortedNodes = [...nodes].sort((a, b) => b.z - a.z);

      // Draw connection lines between nearby nodes
      ctx.lineWidth = 0.4;
      for (let i = 0; i < sortedNodes.length; i++) {
        for (let j = i + 1; j < sortedNodes.length; j++) {
          const n1 = sortedNodes[i];
          const n2 = sortedNodes[j];

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dz = n1.z - n2.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Connect nodes closer than threshold
          if (dist < 90) {
            const opacity = ((90 - dist) / 90) * 0.15 * ((n1.z + radius) / (2 * radius));
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
        // Depth-based size and opacity projection
        const scale = (node.z + radius * 1.5) / (radius * 2.5);
        const drawSize = Math.max(1, (isHovered ? 3.5 : 2.5) * scale);
        const opacity = Math.min(1, Math.max(0.1, 0.6 * scale));

        ctx.beginPath();
        ctx.arc(cx + node.x, cy + node.y, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();

        // Core central pulse for active nodes
        if (isHovered && Math.random() > 0.96) {
          ctx.beginPath();
          ctx.arc(cx + node.x, cy + node.y, drawSize * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
          ctx.lineWidth = 0.5;
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

        const pScale = isHovered ? 1.5 : 1;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.size * pScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 200, ${p.alpha})`;
        ctx.fill();

        // Connect some particles back to the core nodes
        if (isHovered && Math.random() > 0.98) {
          const nearestNode = nodes[Math.floor(Math.random() * nodes.length)];
          ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.moveTo(cx + p.x, cy + p.y);
          ctx.lineTo(cx + nearestNode.x, cy + nearestNode.y);
          ctx.stroke();
        }
      });

      // Draw holographic HUD rings
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      if (isHovered) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.setLineDash([4, 15]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.5, angleY * 5, angleY * 5 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      id="ai-core-container"
      className="relative w-full h-80 md:h-96 flex items-center justify-center cursor-pointer overflow-hidden rounded-3xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas ref={canvasRef} className="w-full h-full block absolute inset-0" />
      <div className="absolute bottom-6 flex flex-col items-center pointer-events-none select-none">
        <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Autonomous Core
        </span>
        <span className="text-xs text-zinc-300 font-light font-sans mt-1">
          {isHovered ? "Accelerating Cognitive Sync..." : "Hover to sync core"}
        </span>
      </div>
    </div>
  );
}
