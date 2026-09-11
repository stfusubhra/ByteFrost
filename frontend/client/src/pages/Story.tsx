import { Link } from "wouter";
import { ArrowRight, Sprout } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

export default function Story() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="story-hero" style={{ padding: "clamp(48px,7vw,96px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="story-hero-grid">
          <div className="story-hero-copy">
            <span className="eyebrow">OUR STORY</span>
            <h1 className="story-hero-h1">Every harvest begins with a farmer.</h1>
            <p className="story-hero-lead">
              KisanSetu is a direct farm-to-market platform built for SIH 2026 — connecting farmers and FPOs
              directly with bulk buyers, with AI-powered matching, fair prices, and optimized logistics.
            </p>
            <div className="story-hero-cta">
              <Link className="btn btn-primary" href="/marketplace">
                Explore Marketplace <ArrowRight size={15} />
              </Link>
              <Link className="btn btn-secondary" href="/market-match">
                Find your market match
              </Link>
            </div>
          </div>
          <div className="story-hero-media">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80"
              alt="Indian farmland at harvest time – tomato fields"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="story-problem" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <span className="eyebrow">THE PROBLEM</span>
          <h2 className="story-problem-h2">Finding the right buyer is another story.</h2>
          <p className="story-problem-copy">
            Between the farm and the buyer, the journey gets longer – more steps, less visibility.
            The traditional chain stacks margins across four layers of intermediaries:
          </p>
          <ul className="story-list">
            <li>Farmer → Aggregator → Wholesaler → Retailer → Consumer</li>
            <li>Each layer takes a cut — margin stacking</li>
            <li>Price opacity — farmers sell without knowing the true market price</li>
            <li>15–20% of produce lost in transit</li>
          </ul>
          <p className="story-problem-copy" style={{ marginTop: "1rem" }}>
            Every ₹100 a consumer pays for vegetables, the farmer gets less than ₹35.
          </p>
          <div className="story-relationship">
            <div className="story-node">Farmer</div>
            <div className="story-connector" />
            <div className="story-node">KisanSetu</div>
            <div className="story-connector" />
            <div className="story-node">Buyer</div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="story-mission" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <span className="eyebrow">OUR MISSION</span>
          <h2 className="story-connection-h2">A direct line from farm to market.</h2>
          <p className="story-connection-copy">
            Give every farmer a direct line to the market — better prices, verified buyers,
            and logistics that actually arrive.
          </p>
          <p className="story-connection-copy">
            We started with a simple observation: the produce is there, the demand is there,
            and the distance between them is mostly paperwork, middlemen, and guesswork.
            KisanSetu removes the guesswork.
          </p>
          <h3 className="story-mission-h3">How we deliver it</h3>
          <p className="story-connection-copy">
            Through a direct marketplace with real-time listings, quality grades, and verified
            locations; explainable AI matching that shows why every match scores the way it does;
            data-backed price recommendations drawn from live market comparables; and logistics
            and route optimization with VRP planning, hub consolidation, and landed-cost breakdowns.
          </p>
          <p className="story-connection-copy" style={{ marginTop: "1rem" }}>
            Our vision: a clearer market for everyone who grows.
          </p>
        </div>
      </section>

      {/* APPROACH */}
      <section className="story-approach" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <span className="eyebrow">THE KISANSETU APPROACH</span>
          <h2 className="story-connection-h2">See demand. Match supply. Move smarter.</h2>
          <div className="story-approach-grid">
            <div className="story-approach-step">
              <span className="story-approach-num">01</span>
              <h3 className="story-section-title">See demand.</h3>
              <p>Know what the market needs next — live price signals and demand trends for the crops you grow.</p>
            </div>
            <div className="story-approach-step">
              <span className="story-approach-num">02</span>
              <h3 className="story-section-title">Match supply.</h3>
              <p>Find the right buyer for what is ready, with explainable scores based on quantity, price, proximity, and reliability.</p>
            </div>
            <div className="story-approach-step">
              <span className="story-approach-num">03</span>
              <h3 className="story-section-title">Move smarter.</h3>
              <p>Coordinate the route, load, and timing — from match to allocation to route to delivery in one flow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="story-impact" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <span className="eyebrow">IMPACT</span>
          <h2 className="story-connection-h2">Real impact across the value chain.</h2>
          <p className="story-connection-copy">
            Farmers earn more, buyers pay less, and the ecosystem wastes less. One consolidated demo load tells the story:
          </p>
          <ul className="story-stats">
            <li>1,520 kg consolidated</li>
            <li>₹46,400 combined value</li>
            <li>3 farms → 1 shipment</li>
            <li>92% match score</li>
          </ul>
        </div>
      </section>

      {/* OUTCOME */}
      <section className="story-cta" style={{ padding: "clamp(48px,6vw,64px) 0" }}>
        <div className="container">
          <div className="story-cta-inner">
            <span className="story-cta-eyebrow">OUR STORY</span>
            <h2 className="story-cta-h2">From farm to market, directly.</h2>
            <p className="story-cta-lead">A simpler way for farmers and buyers to meet.</p>
            <div className="story-cta-cta">
              <Link className="btn btn-primary" href="/marketplace">
                Explore KisanSetu <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}