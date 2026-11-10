import { GraduationCap } from "lucide-react";

export type Route = "home" | "prep" | "privacy";

/** Site-wide top navigation, shared by the landing page and Prep Coach (the AI Lab has a copy). */
export default function SiteNav({ route }: { route: Route }) {
  return (
    <header className="site-nav">
      <a className="site-brand" href="#" aria-label="Prep Hub home">
        <span className="site-logo">
          <GraduationCap size={18} strokeWidth={2.2} />
        </span>
        <span className="site-name">Prep Hub</span>
      </a>
      <nav className="site-links" aria-label="Site">
        <a href="#" className={route === "home" ? "active" : ""}>
          Home
        </a>
        <a href="#prep" className={route === "prep" ? "active" : ""}>
          Prep Coach
        </a>
        <a href="ai-lab/">AI Lab</a>
        <a href="#pricing">Pricing</a>
      </nav>
      <span className="made-by">
        made with <span className="heart" aria-label="love">♥</span> · Virupaksh N
      </span>
      {route === "home" && (
        <a className="site-cta" href="#prep">
          Get started
        </a>
      )}
    </header>
  );
}
