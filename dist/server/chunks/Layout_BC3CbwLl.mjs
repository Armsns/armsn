import { c as createComponent, e as addAttribute, b as renderScript, a as renderTemplate, d as createAstro, r as renderComponent, n as renderSlot, o as renderHead } from './astro/server_zxv3i2-L.mjs';
import 'piccolore';
/* empty css                         */
import 'clsx';
import { jsxs, jsx } from 'react/jsx-runtime';
import { Home, Gamepad2, LayoutGrid, AppWindow, MessageSquare, Settings2, Search, Globe } from 'lucide-react';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';

const $$Astro$1 = createAstro();
const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/Users/arman/Documents/GitHub/armsn/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/arman/Documents/GitHub/armsn/node_modules/astro/components/ClientRouter.astro", void 0);

function getRoute(name) {
  const routeMap = window._0;
  return routeMap?.[name] ? `/${routeMap[name]}` : `/${name}`;
}
function getObfId(name) {
  const codeMap = window._2;
  return codeMap?.[name] ?? name;
}

const staticItems = [
  {
    id: "home",
    name: "Home",
    icon: Home,
    action: () => {
      window.location.href = "/";
    }
  },
  {
    id: "games",
    name: "Games",
    icon: Gamepad2,
    action: () => {
      window.location.href = getRoute("games");
    }
  },
  {
    id: "apps",
    name: "Apps",
    icon: LayoutGrid,
    action: () => {
      window.location.href = getRoute("apps");
    }
  },
  {
    id: "tabs",
    name: "Tabs",
    icon: AppWindow,
    action: () => {
      window.location.href = getRoute("tabs");
    }
  },
  {
    id: "chat",
    name: "Chat",
    icon: MessageSquare,
    action: () => {
      window.location.href = getRoute("chat");
    }
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings2,
    action: () => {
      window.location.href = getRoute("settings");
    }
  }
];
function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const items = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return staticItems;
    const urlItems = [];
    if (/^https?:\/\//i.test(lowerQuery) || lowerQuery.includes(".")) {
      const url = lowerQuery.startsWith("http") ? lowerQuery : `https://${lowerQuery}`;
      urlItems.push({
        id: "navigate-url",
        name: `Navigate to ${url}`,
        icon: Globe,
        action: () => {
          sessionStorage.setItem("goUrl", url);
          window.location.href = getRoute("tabs");
        }
      });
    }
    const filtered = staticItems.filter((item) => item.name.toLowerCase().includes(lowerQuery));
    return [...urlItems, ...filtered];
  }, [query]);
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);
  useEffect(() => {
    const handleKeyDown2 = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown2);
    return () => window.removeEventListener("keydown", handleKeyDown2);
  }, []);
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
  }, [isOpen]);
  const handleSelect = useCallback(
    (index) => {
      const item = items[index];
      if (item) {
        item.action();
        setIsOpen(false);
      }
    },
    [items]
  );
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[99999] flex items-start justify-center pt-24", children: [
    /* @__PURE__ */ jsx("button", { type: "button", className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: () => setIsOpen(false), "aria-label": "Close command palette" }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-xl rounded-2xl border border-white/10 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden", role: "dialog", "aria-modal": "true", "aria-label": "Command palette", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-3 border-b border-white/10", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-5 h-5 text-text-secondary" }),
        /* @__PURE__ */ jsx("input", { ref: inputRef, type: "text", value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: handleKeyDown, placeholder: "Search pages or type a URL...", className: "flex-1 bg-transparent text-text placeholder:text-text-placeholder focus:outline-none text-base" }),
        /* @__PURE__ */ jsx("kbd", { className: "hidden sm:inline-block px-2 py-1 rounded bg-white/10 text-text-secondary text-xs font-mono", children: "ESC" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto p-2", children: items.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-4 py-3 text-sm text-text-muted", children: "No results found." }) : items.map((item, index) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => handleSelect(index), onMouseEnter: () => setSelectedIndex(index), className: `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${index === selectedIndex ? "bg-white/10 text-text" : "text-text-secondary hover:bg-white/5"}`, children: [
        /* @__PURE__ */ jsx(item.icon, { className: "w-5 h-5" }),
        /* @__PURE__ */ jsx("span", { className: "flex-1 text-sm font-medium", children: item.name }),
        index === selectedIndex && /* @__PURE__ */ jsx("kbd", { className: "hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-text-muted text-xs font-mono", children: "Enter" })
      ] }, item.id)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-text-muted", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          items.length,
          " result(s)"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { children: "↑↓ to navigate" }),
          /* @__PURE__ */ jsx("span", { children: "↵ to select" })
        ] })
      ] })
    ] })
  ] });
}

function cssColorToRgb(color) {
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
    b: Number.parseInt(match[3], 10)
  };
}
function getAccentColor() {
  if (typeof window === "undefined") return "#00ff80";
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00ff80";
}
function getBackgroundColor() {
  if (typeof window === "undefined") return "#0a0d0a";
  return getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "#0a0d0a";
}
function InteractiveBackground() {
  const canvasRef = useRef(null);
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
    const mouse = { x: -1e3, y: -1e3, active: false };
    let particles = [];
    const createParticles = () => {
      const count = Math.min(80, Math.floor(width * height / 15e3));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2
        });
      }
    };
    createParticles();
    const handleMouseMove = (e) => {
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
            p.vx += dx / dist * force * 0.05;
            p.vy += dy / dist * force * 0.05;
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
      const newCount = Math.min(80, Math.floor(width * height / 15e3));
      if (newCount > prevCount) {
        for (let i = prevCount; i < newCount; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2
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
  return /* @__PURE__ */ jsx("canvas", { ref: canvasRef, role: "img", "aria-label": "Animated particle background", className: "fixed inset-0 -z-10 h-full w-full", style: { pointerEvents: "none" } });
}

function colorsEqual(a, b) {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}
function getCssColor(variable) {
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
    b: Number.parseInt(match[3], 10)
  };
}
function StarfieldBackground() {
  const canvasRef = useRef(null);
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
    let stars = [];
    const meteors = [];
    let textColor = { r: 255, g: 255, b: 255 };
    let accentColor = { r: 0, g: 255, b: 128 };
    let lastTheme = null;
    const updateColors = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "";
      if (currentTheme === lastTheme) return false;
      lastTheme = currentTheme;
      textColor = getCssColor("--text");
      accentColor = getCssColor("--accent");
      return true;
    };
    const createStars = () => {
      const starCount = Math.min(200, Math.floor(width * height / 8e3));
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
          color
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
        color
      });
    };
    updateColors();
    createStars();
    const mouse = { x: -9999, y: -9999 };
    const handleMouseMove = (e) => {
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
    const draw = (time) => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);
      const parallaxX = (mouse.x - width / 2) * 0.02;
      const parallaxY = (mouse.y - height / 2) * 0.02;
      const activeStars = [];
      for (const star of stars) {
        const twinkle = Math.sin(time / 1e3 * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
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
      if (Math.random() < 5e-3) {
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
        let alpha;
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
  return /* @__PURE__ */ jsx("canvas", { ref: canvasRef, role: "img", "aria-label": "Starfield background", className: "fixed inset-0 -z-20 h-full w-full pointer-events-none motion-reduce:hidden", style: { background: "var(--background)" } });
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><meta name="generator"', '><meta name="theme-color" content="#0a0d0a"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link id="icon" rel="shortcut icon" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet"><title>ARM$N</title>', "", '<script src="/assets/js/analytics.js" defer><\/script>', "", '</head> <body class="noise"> ', " ", " ", " ", " </body></html>"])), addAttribute(Astro2.generator, "content"), renderComponent($$result, "ClientRouter", $$ClientRouter, {}), renderScript($$result, "/Users/arman/Documents/GitHub/armsn/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"), renderScript($$result, "/Users/arman/Documents/GitHub/armsn/src/layouts/Layout.astro?astro&type=script&index=1&lang.ts"), renderHead(), renderComponent($$result, "StarfieldBackground", StarfieldBackground, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/StarfieldBackground.tsx", "client:component-export": "default" }), renderComponent($$result, "InteractiveBackground", InteractiveBackground, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/InteractiveBackground.tsx", "client:component-export": "default" }), renderSlot($$result, $$slots["default"]), renderComponent($$result, "CommandPalette", CommandPalette, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/CommandPalette.tsx", "client:component-export": "default" }));
}, "/Users/arman/Documents/GitHub/armsn/src/layouts/Layout.astro", void 0);

export { $$Layout as $, getRoute as a, getObfId as g };
