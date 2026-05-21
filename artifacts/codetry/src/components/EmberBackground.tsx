import React, { useEffect, useRef } from "react";

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
}

export default function EmberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const embersRef = useRef<Ember[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnEmber = (): Ember => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 10,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.3 + Math.random() * 0.5),
      size: 1 + Math.random() * 2,
      opacity: 0,
      life: 0,
      maxLife: 180 + Math.random() * 120,
      hue: Math.random() > 0.6 ? 30 : 100,
    });

    for (let i = 0; i < 12; i++) {
      const e = spawnEmber();
      e.y = Math.random() * window.innerHeight;
      e.life = Math.random() * e.maxLife;
      embersRef.current.push(e);
    }

    let lastSpawn = 0;
    const animate = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (now - lastSpawn > 1200) {
        embersRef.current.push(spawnEmber());
        lastSpawn = now;
      }

      embersRef.current = embersRef.current.filter(e => e.life < e.maxLife);

      for (const e of embersRef.current) {
        e.life += 1;
        e.x += e.vx + Math.sin(e.life * 0.03) * 0.2;
        e.y += e.vy;

        const progress = e.life / e.maxLife;
        e.opacity = progress < 0.2
          ? (progress / 0.2) * 0.6
          : progress > 0.75
            ? ((1 - progress) / 0.25) * 0.6
            : 0.6;

        const lightness = e.hue === 30 ? 65 : 45;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${e.hue}, 70%, ${lightness}%, ${e.opacity * 0.35})`;
        ctx.fill();

        if (e.size > 1.5) {
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${e.hue}, 90%, 85%, ${e.opacity * 0.25})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}
