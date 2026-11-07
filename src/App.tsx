import { useEffect, useState } from "react";
import SiteNav, { type Route } from "./components/SiteNav";
import Landing from "./components/Landing";
import PrepCoach from "./PrepCoach";

/** Hash routing keeps the site a plain static deploy: "" = landing, "#prep" = Prep Coach. */
const routeFromHash = (): Route => (location.hash.startsWith("#prep") ? "prep" : "home");

const TITLES: Record<Route, string> = {
  home: "Prep Hub — Interview Prep Coach & AI Lab",
  prep: "Prep Coach — Interactive Interview Prep",
};

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);

  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  // The landing page follows Prep Coach's saved theme (Prep Coach applies its own on mount).
  useEffect(() => {
    let theme = "light";
    try {
      theme = JSON.parse(localStorage.getItem("dscoach-theme") || '"light"');
    } catch {
      /* default */
    }
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }, []);

  return (
    <div className={`site site-${route}`}>
      <SiteNav route={route} />
      {route === "prep" ? <PrepCoach /> : <Landing />}
    </div>
  );
}
