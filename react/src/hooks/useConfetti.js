import { useCallback, useEffect, useRef } from "react";

const YELLOW = "#FEE101";
const GREEN = "#0B6839";
const CREAM = "#FFFBE8";
const CONFETTI_COLORS = [YELLOW, "#F9DC01", GREEN, CREAM, "#FFFFFF"];

export function useConfetti(canvasRef, reduceMotion) {
  const particles = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [canvasRef]);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.current = particles.current.filter(p => p.life < p.maxLife);
    particles.current.forEach(p => {
      p.vy += 0.18;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life++;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    rafRef.current = particles.current.length > 0 ? requestAnimationFrame(tick) : null;
  }, [canvasRef]);

  const burst = useCallback(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.35;
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      particles.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 60 + Math.random() * 30,
      });
    }
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [canvasRef, reduceMotion, tick]);

  return burst;
}
