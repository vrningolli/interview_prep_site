import { useEffect, useRef, useState } from "react";

/**
 * "Chirp" — Prep Hub's mascot, an original 3D cartoon bluebird. Every time the
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
 * The bird — a Pixar-style 3D cartoon look built from layered lighting:
 * key light (top-left) with a hard specular + soft bloom, cyan rim light on
 * the right, warm bounce light underneath, ambient occlusion where the form
 * turns away, cast shadows from the head/wing/beak, and glossy layered eyes.
 */
function ChirpSvg() {
  return (
    <svg className="chirp" viewBox="0 0 260 252" aria-hidden="true">
      <defs>
        {/* body: sphere shading */}
        <radialGradient id="cb-body" cx="0.34" cy="0.27" r="0.82">
          <stop offset="0" stopColor="#b9ecff" />
          <stop offset="0.18" stopColor="#4cc3ff" />
          <stop offset="0.48" stopColor="#1d8ff2" />
          <stop offset="0.8" stopColor="#1554cc" />
          <stop offset="1" stopColor="#0b2a7a" />
        </radialGradient>
        <radialGradient id="cb-belly" cx="0.42" cy="0.28" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#eef8ff" />
          <stop offset="0.85" stopColor="#c4e2ff" />
          <stop offset="1" stopColor="#8fc2f7" />
        </radialGradient>
        <linearGradient id="cb-feather" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0f2f8f" />
          <stop offset="0.55" stopColor="#1f6fe5" />
          <stop offset="1" stopColor="#6cc8ff" />
        </linearGradient>
        <linearGradient id="cb-feather-dark" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a6fe0" />
          <stop offset="1" stopColor="#0a2167" />
        </linearGradient>
        <linearGradient id="cb-crest" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0" stopColor="#1554cc" />
          <stop offset="0.6" stopColor="#2f9bff" />
          <stop offset="1" stopColor="#9be3ff" />
        </linearGradient>
        <linearGradient id="cb-beak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="0.45" stopColor="#ffab2e" />
          <stop offset="1" stopColor="#e2560c" />
        </linearGradient>
        <linearGradient id="cb-eye" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe4f0" />
          <stop offset="0.22" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef2f8" />
        </linearGradient>
        <radialGradient id="cb-iris" cx="0.45" cy="0.62" r="0.62">
          <stop offset="0" stopColor="#5ab0ff" />
          <stop offset="0.5" stopColor="#1d4fbf" />
          <stop offset="1" stopColor="#0a1745" />
        </radialGradient>
        <linearGradient id="cb-foot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc24d" />
          <stop offset="1" stopColor="#e96a0c" />
        </linearGradient>
        <radialGradient id="cb-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff7aa8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ff7aa8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cb-ground" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0f1d5c" stopOpacity="0.4" />
          <stop offset="0.6" stopColor="#0f1d5c" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0f1d5c" stopOpacity="0" />
        </radialGradient>
        <filter id="cb-b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id="cb-b5" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="cb-b10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
        <filter id="cb-drop" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#0b2a7a" floodOpacity="0.28" />
        </filter>
        <clipPath id="cb-clip-body"><circle cx="130" cy="145" r="78" /></clipPath>
        <clipPath id="cb-clip-eye-l"><ellipse cx="108" cy="120" rx="22" ry="26" /></clipPath>
        <clipPath id="cb-clip-eye-r"><ellipse cx="155" cy="120" rx="20" ry="24" /></clipPath>
      </defs>

      {/* ground contact shadow */}
      <ellipse className="chirp-ground" cx="132" cy="240" rx="70" ry="10" fill="url(#cb-ground)" />

      <g className="chirp-squash">
        <g className="chirp-bob" filter="url(#cb-drop)">
          {/* tail — layered feathers */}
          <g className="chirp-tail">
            <path d="M 72 194 Q 42 216 24 212 Q 44 196 66 182 Z" fill="url(#cb-feather-dark)" />
            <path d="M 68 182 Q 30 196 12 186 Q 36 174 62 168 Z" fill="url(#cb-feather)" />
            <path d="M 66 170 Q 26 168 12 150 Q 40 154 64 158 Z" fill="url(#cb-feather-dark)" />
            <path d="M 62 176 Q 38 182 22 184" stroke="#9be3ff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
          </g>

          {/* feet */}
          <g>
            <path d="M 112 214 q -8 14 -12 22 M 112 214 q 0 14 0 24 M 112 214 q 8 14 12 22" stroke="url(#cb-foot)" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 150 214 q -8 14 -12 22 M 150 214 q 0 14 0 24 M 150 214 q 8 14 12 22" stroke="url(#cb-foot)" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M 110 220 q -3 6 -6 11 M 148 220 q -3 6 -6 11" stroke="#ffe3a3" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>

          {/* far wing (folded) */}
          <path d="M 70 128 Q 38 150 46 190 Q 62 198 80 178 Q 90 156 84 134 Z" fill="url(#cb-feather-dark)" />
          <path d="M 60 150 Q 54 168 58 184 M 70 146 Q 66 164 70 178" stroke="#7cc4ff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />

          <g className="chirp-head">
            {/* body sphere */}
            <circle cx="130" cy="145" r="78" fill="url(#cb-body)" />

            <g clipPath="url(#cb-clip-body)">
              {/* belly */}
              <ellipse cx="142" cy="178" rx="54" ry="48" fill="url(#cb-belly)" />
              {/* chest feather texture */}
              <path d="M 116 182 q 7 5 14 0 M 136 188 q 7 5 14 0 M 156 182 q 7 5 14 0 M 126 200 q 7 5 14 0 M 146 204 q 7 5 14 0" stroke="#a9d2f7" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.45" />
              {/* head cast-shadow onto belly */}
              <ellipse cx="142" cy="132" rx="58" ry="9" fill="#0b2a7a" opacity="0.08" filter="url(#cb-b5)" />
              {/* ambient occlusion at the bottom */}
              <ellipse cx="128" cy="252" rx="96" ry="40" fill="#061a55" opacity="0.38" filter="url(#cb-b10)" />
              {/* warm bounce light from the ground */}
              <ellipse cx="160" cy="214" rx="34" ry="11" fill="#ffd9a8" opacity="0.35" filter="url(#cb-b5)" />
              {/* cyan rim light */}
              <ellipse cx="214" cy="138" rx="13" ry="66" fill="#c4f5ff" opacity="0.6" filter="url(#cb-b5)" />
              {/* eye sockets */}
              <ellipse cx="132" cy="120" rx="56" ry="30" fill="#0b3a9e" opacity="0.12" filter="url(#cb-b5)" />
              {/* wing cast-shadow on the body */}
              <ellipse cx="196" cy="166" rx="22" ry="12" fill="#06205f" opacity="0.35" filter="url(#cb-b5)" />
            </g>

            {/* crest */}
            <g className="chirp-crest">
              <path d="M 118 76 Q 100 46 116 26 Q 120 52 134 72 Z" fill="url(#cb-crest)" />
              <path d="M 128 72 Q 128 34 154 22 Q 142 48 144 74 Z" fill="url(#cb-crest)" />
              <path d="M 142 78 Q 158 52 180 50 Q 164 64 152 84 Z" fill="url(#cb-crest)" />
              <path d="M 134 66 Q 136 46 148 32" stroke="#dff6ff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>

            {/* key light: soft bloom + hard specular */}
            <ellipse cx="98" cy="98" rx="42" ry="26" fill="#ffffff" opacity="0.32" filter="url(#cb-b10)" transform="rotate(-30 98 98)" />
            <ellipse cx="88" cy="88" rx="13" ry="7" fill="#ffffff" opacity="0.9" transform="rotate(-35 88 88)" />
            <circle cx="104" cy="80" r="3" fill="#ffffff" opacity="0.8" />

            {/* brows */}
            <path d="M 92 88 Q 106 76 122 84" stroke="#0b2a7a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 142 84 Q 157 75 170 84" stroke="#0b2a7a" strokeWidth="4.6" strokeLinecap="round" fill="none" />

            {/* eyes */}
            <g className="chirp-eyes">
              <ellipse cx="108" cy="120" rx="22" ry="26" fill="url(#cb-eye)" />
              <ellipse cx="155" cy="120" rx="20" ry="24" fill="url(#cb-eye)" />
              <g className="chirp-look">
                <g clipPath="url(#cb-clip-eye-l)">
                  <circle cx="112" cy="121" r="13.5" fill="url(#cb-iris)" />
                  <circle cx="112" cy="122" r="7" fill="#020617" />
                </g>
                <g clipPath="url(#cb-clip-eye-r)">
                  <circle cx="158" cy="121" r="12.5" fill="url(#cb-iris)" />
                  <circle cx="158" cy="122" r="6.5" fill="#020617" />
                </g>
                <circle cx="117.5" cy="114" r="5.2" fill="#ffffff" />
                <circle cx="107" cy="127" r="2.2" fill="#ffffff" opacity="0.9" />
                <circle cx="163" cy="114" r="4.8" fill="#ffffff" />
                <circle cx="154" cy="127" r="2" fill="#ffffff" opacity="0.9" />
              </g>
              {/* upper-lid shading */}
              <ellipse cx="108" cy="96" rx="22" ry="6" fill="#6a85b8" opacity="0.16" filter="url(#cb-b2)" clipPath="url(#cb-clip-eye-l)" />
              <ellipse cx="155" cy="97" rx="20" ry="5" fill="#6a85b8" opacity="0.16" filter="url(#cb-b2)" clipPath="url(#cb-clip-eye-r)" />
            </g>

            {/* cheeks */}
            <ellipse cx="94" cy="154" rx="15" ry="9" fill="url(#cb-cheek)" />
            <ellipse cx="174" cy="154" rx="13" ry="8" fill="url(#cb-cheek)" />

            {/* beak: shadow, open mouth, upper beak, shine */}
            <ellipse cx="134" cy="168" rx="24" ry="7" fill="#0b2a7a" opacity="0.28" filter="url(#cb-b2)" />
            <path d="M 118 154 Q 133 178 150 154 Q 141 168 133 168 Q 125 167 118 154 Z" fill="#8a2a12" />
            <ellipse cx="134" cy="163" rx="7" ry="3.4" fill="#ff7a9a" />
            <path d="M 111 150 Q 133 134 159 148 Q 150 162 134 162 Q 118 160 111 150 Z" fill="url(#cb-beak)" />
            <path d="M 120 146 Q 132 139 147 143" stroke="#fff6d6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
            <circle cx="122" cy="149" r="1.6" fill="#b34708" opacity="0.6" />
            <circle cx="146" cy="149" r="1.6" fill="#b34708" opacity="0.6" />
          </g>

          {/* near wing — fanned feathers, waving */}
          <g className="chirp-wing">
            <path d="M 214 124 Q 242 98 258 82 Q 255 112 234 132 Z" fill="url(#cb-feather-dark)" />
            <path d="M 210 112 Q 230 76 246 50 Q 250 84 232 114 Z" fill="url(#cb-feather)" />
            <path d="M 212 138 Q 238 126 254 116 Q 248 140 226 150 Z" fill="url(#cb-feather)" />
            <path d="M 186 128 Q 212 116 228 94 Q 238 122 220 148 Q 206 162 188 160 Z" fill="url(#cb-feather)" />
            <path d="M 222 106 Q 234 86 242 64 M 228 124 Q 242 110 252 96 M 200 130 Q 214 122 224 108" stroke="#c4ecff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.65" />
            <ellipse cx="208" cy="124" rx="12" ry="6" fill="#ffffff" opacity="0.35" filter="url(#cb-b2)" transform="rotate(-35 208 124)" />
          </g>
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
          <b>Welcome!</b>
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
