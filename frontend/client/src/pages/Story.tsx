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
            <p className="story-hero-lead">500 kg of tomatoes, ready to sell.</p>
            <div className="story-hero-cta">
              <Link className="btn btn-primary" href="/marketplace">
                Explore Marketplace <ArrowRight size={15} />
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
          <h2 className="story-problem-h2">Finding the right buyer is another story.</h2>
          <p className="story-problem-copy">
            Between the farm and the buyer, the journey gets longer – more steps, less visibility.
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

      {/* DISCONNECT */}
      <section className="story-disconnect" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="story-disconnect-grid">
            <div className="story-supply">
              <h3 className="story-section-title">Supply</h3>
              <ul className="story-list">
                <li>400 kg – Tomatoes · Nashik</li>
                <li>300 kg – Tomatoes · Pune</li>
                <li>300 kg – Tomatoes · Satara</li>
              </ul>
            </div>
            <div className="story-demand">
              <h3 className="story-section-title">Demand</h3>
              <p>Buyer needs 1,000 kg – one shipment, one route.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECTION */}
      <section className="story-connection" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <h2 className="story-connection-h2">What if they could see the same market?</h2>
          <p className="story-connection-copy">KisanSetu brings supply, demand, information and logistics together.</p>
          <div className="story-connection-visual">
            <div className="story-visual-grid">
              <div className="story-circle">Supply</div>
              <div className="story-connector-vertical" />
              <div className="story-circle">KisanSetu</div>
              <div className="story-connector-vertical" />
              <div className="story-circle">Demand</div>
            </div>
          </div>
        </div>
      </section>

      {/* INTELLIGENCE */}
      <section className="story-intelligence" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <h3 className="story-section-title">Intelligence</h3>
          <ul className="story-stats">
            <li>Demand ↑ 12%</li>
            <li>Recommended price ₹31–34 /kg</li>
            <li>Match 92%</li>
          </ul>
        </div>
      </section>

      {/* MOVEMENT */}
      <section className="story-movement" style={{ padding: "clamp(40px,5vw,64px) 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <h3 className="story-section-title">Movement</h3>
          <p>Pickup → Consolidation → Buyer</p>
          <p>Recommended route 1 h 30 min – estimated logistics saving ₹1,200</p>
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
