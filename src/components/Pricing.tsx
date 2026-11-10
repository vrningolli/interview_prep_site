/* Pricing + "Pro is coming soon" demand test.

   Payments aren't switched on yet. The Upgrade buttons are real and the price is real,
   but clicking one opens a clear "payments unlock soon — you won't be charged" dialog.
   Each click (plan, billing period, currency, where it came from) and the optional
   "is this price fair?" answer are recorded as anonymous analytics events, so we can
   measure genuine willingness to pay before building billing. */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Sparkles, X } from "lucide-react";
import { track } from "../analytics";
import "../pricing.css";

export type Billing = "monthly" | "yearly";
type Currency = "INR" | "USD";

/** Visitors in India see rupee pricing (purchasing-power adjusted); everyone else USD. */
export function localCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/^Asia\/(Kolkata|Calcutta)$/.test(tz)) return "INR";
  } catch {
    /* fall through */
  }
  return /-IN$/i.test(navigator.language || "") ? "INR" : "USD";
}

const PRICES: Record<Currency, Record<Billing, { amount: string; per: string; note: string }>> = {
  USD: {
    monthly: { amount: "$9", per: "/month", note: "Cancel any time" },
    yearly: { amount: "$69", per: "/year", note: "$5.75/month — save 36%" },
  },
  INR: {
    monthly: { amount: "₹299", per: "/month", note: "Cancel any time" },
    yearly: { amount: "₹2,499", per: "/year", note: "₹208/month — save 30%" },
  },
};

const FREE_FEATURES = [
  "All lessons, visualizers & cheat sheets",
  "System design track with 8 walkthroughs",
  "Mock interviews on the free AI model",
  "Python & JavaScript hidden tests",
  "Today plan, streaks & spaced review",
];

const PRO_FEATURES = [
  "Veeru powered by Claude — a much sharper interviewer and grader, no API key needed",
  "Unlimited mock interviews: coding, system design & behavioral",
  "Company question packs (Google, Meta, Amazon, Microsoft)",
  "Progress analytics across every interview",
  "Sync your progress across devices",
];

const INTEREST_KEY = "prep-pro-interest";

export const hasProInterest = () => {
  try {
    return !!localStorage.getItem(INTEREST_KEY);
  } catch {
    return false;
  }
};

/** Open the upgrade dialog from anywhere (sidebar, mock interview, landing page). */
export function openUpgrade(source: string, billing: Billing = "yearly") {
  window.dispatchEvent(new CustomEvent("prep-open-upgrade", { detail: { source, billing } }));
}

export function PricingCards({ source }: { source: string }) {
  const [billing, setBilling] = useState<Billing>("yearly");
  const currency = localCurrency();
  const price = PRICES[currency][billing];
  const ref = useRef<HTMLDivElement>(null);

  // Count how many visitors actually see the prices (once per page view).
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    let sent = false;
    const io = new IntersectionObserver((entries) => {
      if (!sent && entries.some((e) => e.isIntersecting)) {
        sent = true;
        track("pricing_viewed", `${source}:${currency}`);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [source, currency]);

  return (
    <div className="pricing" ref={ref}>
      <div className="billing-toggle" role="radiogroup" aria-label="Billing period">
        {(["monthly", "yearly"] as Billing[]).map((b) => (
          <button key={b} role="radio" aria-checked={billing === b} className={billing === b ? "on" : ""} onClick={() => setBilling(b)}>
            {b === "monthly" ? "Monthly" : "Yearly"}
            {b === "yearly" && <span className="save">save {currency === "INR" ? "30" : "36"}%</span>}
          </button>
        ))}
      </div>
      <div className="plans">
        <div className="plan">
          <h3>Free</h3>
          <div className="plan-price">
            <b>{currency === "INR" ? "₹0" : "$0"}</b>
            <span>forever</span>
          </div>
          <ul>
            {FREE_FEATURES.map((f) => (
              <li key={f}>
                <Check size={16} /> {f}
              </li>
            ))}
          </ul>
          <a className="btn plan-btn" href="#prep">
            Start free
          </a>
        </div>
        <div className="plan plan-pro">
          <span className="plan-badge">
            <Sparkles size={13} /> Most popular
          </span>
          <h3>Pro</h3>
          <div className="plan-price">
            <b>{price.amount}</b>
            <span>{price.per}</span>
          </div>
          <p className="plan-note">{price.note}</p>
          <ul>
            <li className="plan-everything">Everything in Free, plus:</li>
            {PRO_FEATURES.map((f) => (
              <li key={f}>
                <Check size={16} /> {f}
              </li>
            ))}
          </ul>
          <button className="btn-primary plan-btn" onClick={() => openUpgrade(source, billing)}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}

/** Mounted once (App). Listens for openUpgrade() calls. */
export function UpgradeModal() {
  const [open, setOpen] = useState<{ source: string; billing: Billing } | null>(null);
  const [billing, setBilling] = useState<Billing>("yearly");
  const [answered, setAnswered] = useState("");
  const currency = localCurrency();

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ source: string; billing: Billing }>).detail;
      setOpen(d);
      setBilling(d.billing);
      setAnswered("");
      track("upgrade_clicked", `${d.billing}:${currency}:${d.source}`);
      try {
        localStorage.setItem(INTEREST_KEY, JSON.stringify({ at: new Date().toISOString(), billing: d.billing, currency }));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("prep-open-upgrade", on);
    return () => window.removeEventListener("prep-open-upgrade", on);
  }, [currency]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  const price = PRICES[currency][billing];
  const answer = (choice: string) => {
    setAnswered(choice);
    track("price_feedback", `${choice}:${billing}:${currency}`);
  };

  // Portal to <body> so no page container's stacking or transforms can sit above it.
  return createPortal(
    <div className="modal-scrim" onClick={() => setOpen(null)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setOpen(null)} aria-label="Close">
          <X size={18} />
        </button>
        <span className="modal-icon">
          <Sparkles size={22} />
        </span>
        <h2 id="upgrade-title">Pro unlocks soon — you're early!</h2>
        <p>
          Thanks for choosing <b>Pro ({price.amount}{price.per})</b>. Our payment option will be unlocked soon, so you
          haven't been charged anything. We've noted your interest — when Pro launches it'll show up right here.
        </p>
        <p className="modal-meanwhile">Meanwhile, everything in Free keeps working, including mock interviews with Veeru.</p>

        <div className="modal-q">
          <b>One quick question: is {price.amount}{price.per} a fair price for you?</b>
          {answered ? (
            <p className="ok">Thank you — that really helps us set the right price.</p>
          ) : (
            <div className="modal-choices">
              {[
                ["too_expensive", "Too expensive"],
                ["fair", "About right"],
                ["cheap", "A bargain"],
                ["would_not_pay", "I'd only use free"],
              ].map(([k, label]) => (
                <button key={k} className="btn" onClick={() => answer(k)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn-primary modal-done" onClick={() => setOpen(null)}>
          Got it
        </button>
      </div>
    </div>,
    document.body
  );
}
