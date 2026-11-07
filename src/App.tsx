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

  // The landing page is always light; Prep Coach applies its own saved theme on mount.
  useEffect(() => {
    if (route === "home") document.documentElement.setAttribute("data-theme", "light");
  }, [route]);

  return (
    <div className={`site site-${route}`}>
      <SiteNav route={route} />
      {route === "prep" ? <PrepCoach /> : <Landing />}
    </div>
  );
}
