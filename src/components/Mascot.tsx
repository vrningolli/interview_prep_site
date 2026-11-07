import { useEffect, useRef, useState } from "react";

/**
 * "Chirp" — Prep Hub's mascot, an original 3D-styled bluebird. Every time the
 * landing page appears it rises from the bottom of the screen, flaps, throws
 * confetti (twice), says hello and flies back down (~7.2 s). Purely
 * decorative: aria-hidden, never blocks clicks, and skipped when the visitor
 * prefers reduced motion (an accessibility setting).
 */

const TOTAL_MS = 7200; // must match the .mascot exit timing in site.css (6.5s delay + 0.7s)
const BURSTS_MS = [850, 3600];
const COLORS = ["#4f46e5", "#7c3aed", "#0ea5e9", "#38bdf8", "#10b981", "#f59e0b", "#ec4899", "#a5b4fc"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; w: number; h: number;
  color: string; round: boolean; flutter: number; fs: number;
}

/** Canvas confetti from (x, y): gravity, air drag, spin and paper-like flutter, then fade. */
function burst(canvas: HTMLCanvasElement, x: number, y: number, scale = 1): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const count = Math.round((window.innerWidth < 640 ? 110 : 170) * scale);
  const parts: Particle[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.95);
    const speed = (7 + Math.random() * 11) * (0.85 + scale * 0.15);
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
  const LIFE = 3400;
  let raf = 0;
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = t > LIFE - 900 ? Math.max(0, (LIFE - t) / 900) : 1;
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.flutter += p.fs;
      p.x += p.vx + Math.sin(p.flutter) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flutter));
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

/**
 * The bird. 3D look from layered gradients: a key light from the top-left
 * (radial body gradient + soft specular bloom), a cool rim light on the right,
 * occlusion shadows under the wing and head, glossy eyes and a shaded beak.
 */
function ChirpSvg() {
  return (
    <svg className="chirp" viewBox="0 0 240 230" aria-hidden="true">
      <defs>
        <radialGradient id="ch-body" cx="0.36" cy="0.3" r="0.78">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="0.22" stopColor="#38bdf8" />
          <stop offset="0.6" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e2a78" />
        </radialGradient>
        <radialGradient id="ch-belly" cx="0.45" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#93c5fd" />
        </radialGradient>
        <linearGradient id="ch-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="ch-tail" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e2a78" />
        </linearGradient>
        <linearGradient id="ch-beak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.45" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <radialGradient id="ch-eye" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.75" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cbd5e1" />
        </radialGradient>
        <radialGradient id="ch-pupil" cx="0.4" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#334155" />
          <stop offset="1" stopColor="#020617" />
        </radialGradient>
        <radialGradient id="ch-spec" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ch-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1e1b4b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1e1b4b" stopOpacity="0" />
        </radialGradient>
        <filter id="ch-drop" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#1e3a8a" floodOpacity="0.25" />
        </filter>
        <filter id="ch-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id="ch-body-clip">
          <ellipse cx="118" cy="122" rx="70" ry="68" />
        </clipPath>
      </defs>

      {/* contact shadow */}
      <ellipse cx="118" cy="214" rx="62" ry="9" fill="url(#ch-shadow)" />

      <g className="chirp-bob" filter="url(#ch-drop)">
        {/* tail feathers */}
        <g className="chirp-tail">
          <path d="M 62 150 Q 22 150 8 128 Q 34 132 58 136 Z" fill="url(#ch-tail)" />
          <path d="M 60 140 Q 24 128 16 104 Q 40 116 62 126 Z" fill="url(#ch-tail)" opacity="0.92" />
        </g>

        {/* feet */}
        <path d="M 100 186 l -6 16 M 100 186 l 0 17 M 100 186 l 6 16" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
        <path d="M 134 186 l -6 16 M 134 186 l 0 17 M 134 186 l 6 16" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />

        <g className="chirp-head">
          {/* body + head (one round form) */}
          <ellipse cx="118" cy="122" rx="70" ry="68" fill="url(#ch-body)" />
          <g clipPath="url(#ch-body-clip)">
            {/* belly */}
            <ellipse cx="132" cy="160" rx="46" ry="42" fill="url(#ch-belly)" />
            {/* occlusion under the head / around the belly */}
            <ellipse cx="96" cy="196" rx="70" ry="22" fill="#0b1550" opacity="0.22" filter="url(#ch-blur)" />
            {/* rim light on the right edge */}
            <ellipse cx="190" cy="118" rx="16" ry="60" fill="#a5f3fc" opacity="0.28" filter="url(#ch-blur)" />
          </g>

          {/* crest */}
          <path d="M 104 58 Q 98 30 116 22 Q 112 40 122 56 Z" fill="url(#ch-wing)" />
          <path d="M 120 56 Q 124 32 142 30 Q 132 44 134 60 Z" fill="url(#ch-body)" />

          {/* specular bloom (key light, top-left) */}
          <ellipse cx="88" cy="84" rx="26" ry="16" fill="url(#ch-spec)" opacity="0.55" transform="rotate(-25 88 84)" />

          {/* cheeks */}
          <ellipse cx="90" cy="132" rx="11" ry="6" fill="#f472b6" opacity="0.35" />
          <ellipse cx="168" cy="132" rx="9" ry="5" fill="#f472b6" opacity="0.3" />

          {/* eyes */}
          <g className="chirp-eyes">
            <ellipse cx="104" cy="108" rx="17" ry="20" fill="url(#ch-eye)" />
            <ellipse cx="152" cy="108" rx="14" ry="17" fill="url(#ch-eye)" />
            <circle cx="109" cy="111" r="10" fill="url(#ch-pupil)" />
            <circle cx="155" cy="111" r="8.5" fill="url(#ch-pupil)" />
            <circle cx="113" cy="106" r="3.6" fill="#ffffff" />
            <circle cx="106" cy="116" r="1.6" fill="#ffffff" opacity="0.8" />
            <circle cx="158" cy="106" r="3" fill="#ffffff" />
          </g>

          {/* beak */}
          <path d="M 120 124 Q 132 116 152 124 Q 140 136 128 134 Z" fill="url(#ch-beak)" />
          <path d="M 124 132 Q 136 140 146 128 Q 140 144 128 140 Z" fill="#c2410c" />
          <path d="M 126 123 Q 134 119 144 122" stroke="#fff7ed" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
        </g>

        {/* far wing (resting) */}
        <path d="M 66 116 Q 40 140 52 172 Q 72 160 84 136 Z" fill="url(#ch-wing)" opacity="0.9" />

        {/* near wing (flapping / waving) */}
        <g className="chirp-wing">
          <path d="M 176 118 Q 214 92 226 52 Q 230 92 206 126 Q 194 142 178 142 Z" fill="url(#ch-wing)" />
          <path d="M 196 104 Q 212 86 220 66" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M 188 120 Q 206 106 214 90" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
}

export default function Mascot() {
  // Plays every time the landing page mounts (including reloads).
  const [show] = useState(() => !prefersReducedMotion());
  const [gone, setGone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const stops: (() => void)[] = [];
    const timers = BURSTS_MS.map((at, i) =>
      window.setTimeout(() => {
        const c = canvasRef.current;
        const o = originRef.current?.getBoundingClientRect();
        if (c && o) stops.push(burst(c, o.left + o.width / 2, o.top + o.height / 2, i === 0 ? 1 : 0.6));
      }, at)
    );
    const end = window.setTimeout(() => setGone(true), TOTAL_MS + 300);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(end);
      stops.forEach((s) => s());
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
          <ChirpSvg />
          {/* invisible marker at the wing tip: the confetti origin */}
          <div ref={originRef} className="mascot-hand" />
        </div>
      </div>
    </div>
  );
}
