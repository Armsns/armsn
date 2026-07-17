import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  parallaxFactor: number;
  color: { r: number; g: number; b: number };
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  angle: number;
  speed: number;
  life: number;
  maxLife: number;
  thickness: number;
  color: { r: number; g: number; b: number };
}

function colorsEqual(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

function getCssColor(variable: string): { r: number; g: number; b: number } {
  if (typeof window === "undefined") return { r: 255, g: 255, b: 255 };
  const el = document.createElement("div");
  el.style.color = `var(${variable})`;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) return { r: 255, g: 255, b: 255 };
  return {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
  };
}

export default function StarfieldBackground() {
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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();

    let stars: Star[] = [];
    const meteors: Meteor[] = [];
    let textColor = { r: 255, g: 255, b: 255 };
    let accentColor = { r: 0, g: 255, b: 128 };
    let lastTheme: string | null = null;

    const updateColors = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "";
      if (currentTheme === lastTheme) return false;
      lastTheme = currentTheme;
      textColor = getCssColor("--text");
      accentColor = getCssColor("--accent");
      return true;
    };

    const createStars = () => {
      const starCount = Math.min(200, Math.floor((width * height) / 8000));
      stars = [];

      for (let i = 0; i < starCount; i++) {
        const isAccent = Math.random() < 0.15;
        const color = isAccent ? accentColor : textColor;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          baseAlpha: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 2 + 1,
          twinkleOffset: Math.random() * Math.PI * 2,
          parallaxFactor: Math.random() * 0.05 + 0.01,
          color,
        });
      }
    };

    const spawnMeteor = () => {
      const isAccent = Math.random() < 0.3;
      const color = isAccent ? accentColor : textColor;
      meteors.push({
        x: Math.random() * width + width * 0.2,
        y: Math.random() * height * 0.5 - height * 0.2,
        length: Math.random() * 80 + 80,
        angle: Math.PI * 0.75 + (Math.random() * 0.1 - 0.05),
        speed: Math.random() * 15 + 15,
        life: 0,
        maxLife: Math.random() * 30 + 40,
        thickness: Math.random() * 1 + 1,
        color,
      });
    };

    updateColors();
    createStars();

    const mouse = { x: -9999, y: -9999 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const MOUSE_RADIUS = 200;
    const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
    const CONNECTION_RADIUS = 120;
    const CONNECTION_RADIUS_SQ = CONNECTION_RADIUS * CONNECTION_RADIUS;

    const draw = (time: number) => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      const parallaxX = (mouse.x - width / 2) * 0.02;
      const parallaxY = (mouse.y - height / 2) * 0.02;

      const activeStars: { x: number; y: number; distToMouse: number; color: { r: number; g: number; b: number } }[] = [];

      for (const star of stars) {
        const twinkle = Math.sin((time / 1000) * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.baseAlpha * twinkle;

        const offsetX = parallaxX * star.parallaxFactor;
        const offsetY = parallaxY * star.parallaxFactor;
        const screenX = star.x + offsetX;
        const screenY = star.y + offsetY;

        ctx.beginPath();
        ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${alpha})`;
        ctx.fill();

        const dx = screenX - mouse.x;
        const dy = screenY - mouse.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < MOUSE_RADIUS_SQ) {
          activeStars.push({ x: screenX, y: screenY, distToMouse: Math.sqrt(distSq), color: star.color });
        }
      }

      activeStars.sort((a, b) => a.distToMouse - b.distToMouse);
      activeStars.splice(15);

      ctx.lineWidth = 0.6;
      for (let i = 0; i < activeStars.length; i++) {
        const a = activeStars[i];
        for (let j = i + 1; j < activeStars.length; j++) {
          const b = activeStars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < CONNECTION_RADIUS_SQ) {
            const dist = Math.sqrt(distSq);
            const connectionOpacity = 1 - dist / CONNECTION_RADIUS;
            const avgDistToMouse = (a.distToMouse + b.distToMouse) / 2;
            const mouseProximityOpacity = 1 - avgDistToMouse / MOUSE_RADIUS;
            const finalOpacity = connectionOpacity * mouseProximityOpacity * 0.6;

            const color = colorsEqual(a.color, accentColor) || colorsEqual(b.color, accentColor) ? accentColor : textColor;
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${finalOpacity})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (Math.random() < 0.005) {
        spawnMeteor();
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.life++;

        if (m.life >= m.maxLife) {
          meteors.splice(i, 1);
          continue;
        }

        let alpha: number;
        if (m.life < 5) {
          alpha = m.life / 5;
        } else {
          alpha = 1 - (m.life - 5) / (m.maxLife - 5);
        }

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(${m.color.r}, ${m.color.g}, ${m.color.b}, ${alpha})`);
        grad.addColorStop(1, `rgba(${m.color.r}, ${m.color.g}, ${m.color.b}, 0)`);

        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.thickness;
        ctx.stroke();
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
      resize();
      createStars();
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const observer = new MutationObserver(() => {
      if (updateColors()) {
        createStars();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility, { passive: true });

    return () => {
      stop();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} role="img" aria-label="Starfield background" className="fixed inset-0 -z-20 h-full w-full pointer-events-none motion-reduce:hidden" style={{ background: "var(--background)" }} />;
}
