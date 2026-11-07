export type Route = "home" | "prep";

/** Site-wide top navigation, shared by the landing page and Prep Coach (the AI Lab has a copy). */
export default function SiteNav({ route }: { route: Route }) {
  return (
    <header className="site-nav">
      <a className="site-brand" href="#" aria-label="Prep Hub home">
        <span className="site-logo">P</span>
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
      </nav>
      <span className="made-by">
        made with <span className="heart" aria-label="love">♥</span> · Virupaksh N
      </span>
    </header>
  );
}
