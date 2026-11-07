import { useEffect, useRef, useState } from "react";

/**
 * "Byte" — Prep Hub's mascot. On the first landing-page visit of a session it
 * rises from the bottom of the screen, waves, throws confetti, says hello and
 * glides away (~4.3 s). Purely decorative: aria-hidden, never blocks clicks,
 * skipped entirely when the visitor prefers reduced motion.
 */

const SESSION_KEY = "prephub.mascot.shown";
const TOTAL_MS = 4300; // must match the .mascot animation timings in site.css
const CONFETTI_AT_MS = 750;
const COLORS = ["#4f46e5", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#a5b4fc"];

function shouldShow(): boolean {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* storage blocked — still show once for this page view */
  }
  return true;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; w: number; h: number;
  color: string; round: boolean; flutter: number; fs: number;
}

/** Canvas confetti burst from (x, y): gravity, air drag, spin and flutter, then fade. */
function burst(canvas: HTMLCanvasElement, x: number, y: number): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const count = window.innerWidth < 640 ? 110 : 170;
  const parts: Particle[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.95);
    const speed = 7 + Math.random() * 11;
    const round = Math.random() < 0.22;
    const size = 5 + Math.random() * 6;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      w: round ? size * 0.75 : size,
      h: round ? size * 0.75 : size * (0.45 + Math.random() * 0.35),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      round,
      flutter: Math.random() * Math.PI * 2,
      fs: 0.08 + Math.random() * 0.12,
    };
  });

  const start = performance.now();
  const LIFE = 3200;
  let raf = 0;
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = t > LIFE - 900 ? Math.max(0, (LIFE - t) / 900) : 1;
    for (const p of parts) {
      p.vy += 0.32;            // gravity
      p.vx *= 0.985;           // air drag
      p.vy *= 0.985;
      p.flutter += p.fs;
      p.x += p.vx + Math.sin(p.flutter) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flutter)); // paper-like tumbling
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (t < LIFE) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
  raf = requestAnimationFrame(frame);
  window.addEventListener("resize", resize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

/** The robot itself — layered gradients, glossy visor, glowing eyes. */
function ByteSvg() {
  return (
    <svg className="byte" viewBox="0 0 200 230" aria-hidden="true">
      <defs>
        <linearGradient id="byte-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe3fb" />
        </linearGradient>
        <linearGradient id="byte-shell-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c7cdf6" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#b9c0f2" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="byte-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#312e81" />
          <stop offset="1" stopColor="#0f0b2e" />
        </linearGradient>
        <linearGradient id="byte-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="byte-eye" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset="0.45" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#0891b2" />
        </radialGradient>
        <radialGradient id="byte-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c4b5fd" stopOpacity="0.9" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
        <filter id="byte-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#312e81" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy="222" rx="54" ry="7" fill="#312e81" opacity="0.14" />

      <g filter="url(#byte-soft)">
        {/* left arm (resting) */}
        <g className="byte-arm-left">
          <rect x="34" y="138" width="20" height="46" rx="10" fill="url(#byte-shell)" stroke="#c7cdf6" />
          <circle cx="44" cy="186" r="9" fill="url(#byte-accent)" />
        </g>

        {/* body */}
        <rect x="52" y="128" width="96" height="78" rx="26" fill="url(#byte-shell)" stroke="#c7cdf6" />
        <rect x="52" y="128" width="96" height="78" rx="26" fill="url(#byte-shell-side)" />
        {/* chest panel */}
        <rect x="74" y="146" width="52" height="34" rx="11" fill="url(#byte-visor)" />
        <circle className="byte-core" cx="100" cy="163" r="7" fill="#a78bfa" />
        <circle cx="100" cy="163" r="13" fill="url(#byte-glow)" />
        <rect x="82" y="186" width="36" height="5" rx="2.5" fill="#c7cdf6" />

        {/* neck */}
        <rect x="88" y="118" width="24" height="14" rx="5" fill="#c7cdf6" />

        {/* waving arm (raised) */}
        <g className="byte-arm-wave">
          <rect x="146" y="98" width="20" height="50" rx="10" fill="url(#byte-shell)" stroke="#c7cdf6" />
          <circle cx="156" cy="96" r="10" fill="url(#byte-accent)" />
        </g>

        {/* antenna */}
        <rect x="97" y="18" width="6" height="22" rx="3" fill="#a5b4fc" />
        <circle cx="100" cy="16" r="14" fill="url(#byte-glow)" className="byte-antenna-glow" />
        <circle cx="100" cy="16" r="7" fill="url(#byte-accent)" />

        {/* ears */}
        <rect x="26" y="68" width="16" height="36" rx="8" fill="url(#byte-accent)" />
        <rect x="158" y="68" width="16" height="36" rx="8" fill="url(#byte-accent)" />

        {/* head */}
        <rect x="36" y="36" width="128" height="92" rx="34" fill="url(#byte-shell)" stroke="#c7cdf6" />
        <rect x="36" y="36" width="128" height="92" rx="34" fill="url(#byte-shell-side)" />
        {/* visor */}
        <rect x="52" y="54" width="96" height="56" rx="24" fill="url(#byte-visor)" />
        {/* eyes */}
        <g className="byte-eyes">
          <rect x="72" y="70" width="16" height="22" rx="8" fill="url(#byte-eye)" />
          <rect x="112" y="70" width="16" height="22" rx="8" fill="url(#byte-eye)" />
        </g>
        {/* smile */}
        <path d="M 90 99 Q 100 106 110 99" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
        {/* visor gloss */}
        <path d="M 62 64 Q 80 56 104 57" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.22" />
        {/* head highlight */}
        <ellipse cx="72" cy="46" rx="20" ry="5" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );
}

export default function Mascot() {
  const [show] = useState(shouldShow);
  const [gone, setGone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    let stop = () => {};
    const confetti = window.setTimeout(() => {
      const c = canvasRef.current;
      const hand = handRef.current?.getBoundingClientRect();
      if (c && hand) stop = burst(c, hand.left + hand.width / 2, hand.top + hand.height / 2);
    }, CONFETTI_AT_MS);
    const end = window.setTimeout(() => setGone(true), TOTAL_MS + 400);
    return () => {
      window.clearTimeout(confetti);
      window.clearTimeout(end);
      stop();
    };
  }, [show]);

  if (!show || gone) return null;
  return (
    <div className="mascot-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="mascot-confetti" />
      <div className="mascot">
        <div className="mascot-bubble">
          <b>Welcome to Prep Insights!</b>
          <span>Let's crack that interview.</span>
        </div>
        <div className="mascot-figure">
          <ByteSvg />
          {/* invisible marker over the waving hand: the confetti origin */}
          <div ref={handRef} className="mascot-hand" />
        </div>
      </div>
    </div>
  );
}
