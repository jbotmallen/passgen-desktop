import { useEffect, useRef } from 'react';

export default function GoldSmoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Smoke blob definition
    interface Blob {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      driftX: number;
      driftY: number;
      pulseSpeed: number;
      pulseOffset: number;
    }

    const blobs: Blob[] = [];
    const blobCount = 28;

    const initBlobs = () => {
      blobs.length = 0;
      const w = canvas.width;
      const h = canvas.height;

      for (let i = 0; i < blobCount; i++) {
        // Cluster blobs in the bottom-center area
        blobs.push({
          x: w * (0.2 + Math.random() * 0.6),
          y: h * (0.55 + Math.random() * 0.5),
          radius: 40 + Math.random() * 120,
          opacity: 0.02 + Math.random() * 0.06,
          driftX: (Math.random() - 0.5) * 0.15,
          driftY: (Math.random() - 0.5) * 0.08 - 0.05,
          pulseSpeed: 0.2 + Math.random() * 0.4,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    initBlobs();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      for (const blob of blobs) {
        // Gentle drift
        blob.x += blob.driftX;
        blob.y += blob.driftY;

        // Wrap
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius;
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius;
        if (blob.y < canvas.height * 0.3) blob.y = canvas.height + blob.radius * 0.5;
        if (blob.y > canvas.height + blob.radius) blob.y = canvas.height * 0.5;

        // Pulsing opacity
        const pulse = Math.sin(time * blob.pulseSpeed + blob.pulseOffset) * 0.5 + 0.5;
        const currentOpacity = blob.opacity * (0.5 + pulse * 0.5);

        // Draw soft radial blob — warm gold
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );
        gradient.addColorStop(0, `rgba(245, 185, 60, ${currentOpacity * 1.5})`);
        gradient.addColorStop(0.3, `rgba(230, 170, 45, ${currentOpacity})`);
        gradient.addColorStop(0.6, `rgba(200, 145, 30, ${currentOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(180, 120, 20, 0)`);

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Add a hot core glow at the very bottom center
      const coreX = canvas.width * 0.5;
      const coreY = canvas.height * 0.95;
      const coreGrad = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, canvas.width * 0.35);
      coreGrad.addColorStop(0, `rgba(255, 200, 60, 0.18)`);
      coreGrad.addColorStop(0.4, `rgba(245, 180, 40, 0.06)`);
      coreGrad.addColorStop(1, `rgba(200, 140, 20, 0)`);
      ctx.beginPath();
      ctx.ellipse(coreX, coreY, canvas.width * 0.35, 80, 0, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
