/**
 * Builds the sibling AI Features Lab app and copies it into public/ai-lab/,
 * so it ships with this site at /ai-lab/.
 *
 * The lab's source (and its curriculum sync from ../ai-features-lab) lives
 * outside this repo, so the hosting provider can't build it. Instead, run this
 * locally after changing the lab, then commit public/ai-lab/:
 *
 *   npm run build:ai-lab
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const labDir = resolve(here, "../../ai-features-lab-react");
const target = resolve(here, "../public/ai-lab");

if (!existsSync(labDir)) {
  console.error(`✗ AI Features Lab not found at ${labDir}`);
  process.exit(1);
}

console.log("→ Building AI Features Lab…");
execSync("npm run build", { cwd: labDir, stdio: "inherit" });

rmSync(target, { recursive: true, force: true });
cpSync(resolve(labDir, "dist"), target, { recursive: true });
console.log(`✓ Copied lab build to ${target}`);
