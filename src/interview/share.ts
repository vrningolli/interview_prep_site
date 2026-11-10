/* Shareable scorecard image (1200×630, the LinkedIn/Twitter card size), drawn on a
   canvas — no server involved. Shared via the Web Share API where available
   (phones), otherwise downloaded as a PNG. */
import { average, problemTitle, type Scorecard, type Setup } from "./prompts";

const SITE = "interview-prep-site.vrningolli.workers.dev";
const FONT = `"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;

const verdictColor = (v: string) => (/strong hire|^hire/i.test(v) ? ["#dcfce7", "#15803d"] : /lean/i.test(v) ? ["#fef3c7", "#b45309"] : ["#fee2e2", "#b91c1c"]);
const scoreColor = (n: number) => (n >= 4 ? "#059669" : n === 3 ? "#4f46e5" : n === 2 ? "#d97706" : "#dc2626");

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function drawScorecard(setup: Setup, sc: Scorecard): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 630;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 1200, 630);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#eef2ff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1200, 630);

  // brand
  ctx.fillStyle = "#4f46e5";
  roundRect(ctx, 60, 52, 44, 44, 11);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText("P", 74, 84);
  ctx.fillStyle = "#0f172a";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText("Prep Hub · AI mock interview", 120, 83);

  // title
  ctx.fillStyle = "#64748b";
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(setup.mode === "coding" ? "CODING ROUND" : setup.mode === "sd" ? "SYSTEM DESIGN ROUND" : "BEHAVIORAL ROUND", 60, 160);
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 50px ${FONT}`;
  const title = problemTitle(setup.mode, setup.problemKey).replace(/^(Design|Behavioral): /, "");
  ctx.fillText(title.length > 34 ? title.slice(0, 33) + "…" : title, 60, 220);

  // verdict pill
  const [bg, fg] = verdictColor(sc.verdict);
  ctx.font = `800 40px ${FONT}`;
  const vw = ctx.measureText(sc.verdict).width + 64;
  ctx.fillStyle = bg;
  roundRect(ctx, 60, 258, vw, 74, 37);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.fillText(sc.verdict, 92, 309);
  ctx.fillStyle = "#334155";
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText(`${average(sc).toFixed(1)} / 4 average`, 60 + vw + 24, 306);

  // score bars
  sc.scores.forEach((s, i) => {
    const y = 380 + i * 42;
    ctx.fillStyle = "#334155";
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(s.dimension, 60, y + 18);
    ctx.fillStyle = "#e2e8f0";
    roundRect(ctx, 380, y + 2, 600, 18, 9);
    ctx.fill();
    ctx.fillStyle = scoreColor(s.score);
    roundRect(ctx, 380, y + 2, (600 * s.score) / 4, 18, 9);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(`${s.score}/4`, 1000, y + 19);
  });

  ctx.fillStyle = "#64748b";
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(`Practise with an AI interviewer → ${SITE}`, 60, 600);
  return c;
}

/** Shares (phones) or downloads (desktop) the card. Returns what happened. */
export async function shareScorecard(setup: Setup, sc: Scorecard): Promise<"shared" | "downloaded" | "cancelled"> {
  await document.fonts?.ready;
  const canvas = drawScorecard(setup, sc);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Couldn't create the image.");
  const file = new File([blob], "prep-hub-scorecard.png", { type: "image/png" });
  const text = `I just did a ${problemTitle(setup.mode, setup.problemKey)} mock interview with an AI interviewer — ${sc.verdict} (${average(sc).toFixed(1)}/4). Practise free at https://${SITE}/#prep/mock`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}
