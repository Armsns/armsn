import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

function cssColorToRgb(color: string): { r: number; g: number; b: number } | null {
  if (typeof window === "undefined") return null;
  const el = document.createElement("div");
  el.style.color = color;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) return null;
  return {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
  };
}

function getAccentColor(): string {
  if (typeof window === "undefined") return "#00ff80";
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00ff80";
}

function getBackgroundColor(): string {
  if (typeof window === "undefined") return "#0a0d0a";
  return getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "#0a0d0a";
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let isRunning = false;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();

    const mouse = { x: -1000, y: -1000, active: false };
    let particles: Particle[] = [];

    const createParticles = () => {
      const count = Math.min(80, Math.floor((width * height) / 15000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
    };

    createParticles();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let accentRgb = { r: 0, g: 255, b: 128 };
    let bgRgb = { r: 10, g: 13, b: 10 };
    let lastAccent = "";
    let lastBg = "";

    const updateColors = () => {
      const accent = getAccentColor();
      const bg = getBackgroundColor();
      if (accent === lastAccent && bg === lastBg) return;
      lastAccent = accent;
      lastBg = bg;
      const parsedAccent = cssColorToRgb(accent);
      const parsedBg = cssColorToRgb(bg);
      if (parsedAccent) accentRgb = parsedAccent;
      if (parsedBg) bgRgb = parsedBg;
    };

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });

    const draw = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      // Subtle gradient based on background
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
      gradient.addColorStop(0, `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0)`);
      gradient.addColorStop(1, `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.03)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            p.vx += (dx / dist) * force * 0.05;
            p.vy += (dy / dist) * force * 0.05;
          }
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (isRunning) return;
      isRunning = true;
      animationFrameId = requestAnimationFrame(draw);
    };

    const stop = () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };

    start();

    const handleResize = () => {
      const prevCount = particles.length;
      resize();
      const newCount = Math.min(80, Math.floor((width * height) / 15000));
      if (newCount > prevCount) {
        for (let i = prevCount; i < newCount; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2,
          });
        }
      } else if (newCount < prevCount) {
        particles.splice(newCount);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility, { passive: true });

    const handleBlur = () => stop();
    const handleFocus = () => start();

    window.addEventListener("blur", handleBlur, { passive: true });
    window.addEventListener("focus", handleFocus, { passive: true });

    return () => {
      stop();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} role="img" aria-label="Animated particle background" className="fixed inset-0 -z-10 h-full w-full" style={{ pointerEvents: "none" }} />;
}
