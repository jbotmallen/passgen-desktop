import { useEffect, useRef } from 'react';

export default function CircuitLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Define circuit path segments
    interface Segment {
      points: { x: number; y: number }[];
      baseOpacity: number;
      pulseOffset: number;
      pulseSpeed: number;
      lineWidth: number;
      hasNode: boolean[];
    }

    const generateSegments = (): Segment[] => {
      const w = canvas.width;
      const h = canvas.height;
      const segments: Segment[] = [];

      // Helper: create a path with right-angle turns (circuit style)
      const createCircuitPath = (startX: number, startY: number, steps: number): { x: number; y: number }[] => {
        const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
        let cx = startX;
        let cy = startY;
        let lastDir: 'h' | 'v' = Math.random() > 0.5 ? 'h' : 'v';

        for (let i = 0; i < steps; i++) {
          const len = 40 + Math.random() * 120;
          if (lastDir === 'h') {
            cy += (Math.random() > 0.5 ? 1 : -1) * len;
            lastDir = 'v';
          } else {
            cx += (Math.random() > 0.5 ? 1 : -1) * len;
            lastDir = 'h';
          }
          points.push({ x: cx, y: cy });
        }
        return points;
      };

      // Generate paths spread across the canvas
      const count = 18;
      for (let i = 0; i < count; i++) {
        const startX = Math.random() * w;
        const startY = Math.random() * h;
        const steps = 3 + Math.floor(Math.random() * 5);
        const points = createCircuitPath(startX, startY, steps);
        const hasNode = points.map(() => Math.random() > 0.5);

        segments.push({
          points,
          baseOpacity: 0.015 + Math.random() * 0.02,
          pulseOffset: Math.random() * Math.PI * 2,
          pulseSpeed: 0.3 + Math.random() * 0.5,
          lineWidth: 0.5 + Math.random() * 0.5,
          hasNode,
        });
      }

      return segments;
    };

    let segments = generateSegments();

    // Regenerate on resize
    const handleResize = () => {
      resize();
      segments = generateSegments();
    };
    window.addEventListener('resize', handleResize);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016; // ~60fps

      for (const seg of segments) {
        // Pulsing opacity
        const pulse = Math.sin(time * seg.pulseSpeed + seg.pulseOffset) * 0.5 + 0.5;
        const opacity = seg.baseOpacity + pulse * 0.025;

        // Draw the path
        ctx.beginPath();
        ctx.moveTo(seg.points[0].x, seg.points[0].y);
        for (let i = 1; i < seg.points.length; i++) {
          ctx.lineTo(seg.points[i].x, seg.points[i].y);
        }
        ctx.strokeStyle = `rgba(245, 197, 99, ${opacity})`;
        ctx.lineWidth = seg.lineWidth;
        ctx.stroke();

        // Draw nodes (small circles at junctions)
        for (let i = 0; i < seg.points.length; i++) {
          if (seg.hasNode[i]) {
            const nodeOpacity = opacity * 1.5;
            const p = seg.points[i];

            // Glow
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4);
            gradient.addColorStop(0, `rgba(245, 197, 99, ${nodeOpacity})`);
            gradient.addColorStop(1, `rgba(245, 197, 99, 0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 197, 99, ${nodeOpacity})`;
            ctx.fill();
          }
        }

        // Animated ping traveling along the path
        const totalLen = seg.points.length - 1;
        if (totalLen > 0) {
          const pingPos = ((time * seg.pulseSpeed * 0.3 + seg.pulseOffset) % 1);
          const segIndex = Math.floor(pingPos * totalLen);
          const segFrac = (pingPos * totalLen) - segIndex;

          if (segIndex < totalLen) {
            const p1 = seg.points[segIndex];
            const p2 = seg.points[segIndex + 1];
            const px = p1.x + (p2.x - p1.x) * segFrac;
            const py = p1.y + (p2.y - p1.y) * segFrac;

            const pingGradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
            pingGradient.addColorStop(0, `rgba(245, 197, 99, ${0.1 + pulse * 0.08})`);
            pingGradient.addColorStop(1, `rgba(245, 197, 99, 0)`);
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fillStyle = pingGradient;
            ctx.fill();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
