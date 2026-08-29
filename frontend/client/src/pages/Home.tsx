/* KisanSetu landing: a concise scroll-story from farmer to market. Uses the shared public shell (header/footer) and the unified design system. */
import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

const img = {
  hero: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=80",
  tomatoes: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=1200&q=80",
  market: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=80",
  farmer: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&q=80",
  landscape: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80",
  crates: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&q=80",
};

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle("is-visible", entry.isIntersecting)
        ),
      { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function Home() {
  useReveal();

  return (
    <PublicLayout eyebrow="Direct market intelligence for everyday farming">
    <main>
      {/* HERO */}
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow">From farm to market</span>
            <h1>
              A clearer market <em>for every harvest.</em>
            </h1>
            <p>
              KisanSetu connects farmers, buyers, and logistics in one calmer way
              to move produce — from the field to the buyer who needs it.
            </p>
            <div className="home-hero-cta">
              <Link className="btn btn-primary btn-lg" href="/marketplace">
                Explore the marketplace <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-secondary btn-lg" href="/market-match">
                Find your market match
              </Link>
            </div>
          </div>
          <div className="home-hero-media">
            <img
              src={img.hero}
              alt="Farmer working in a lush green field at golden hour"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* STORY — the gap KisanSetu closes */}
      <section className="home-story">
        <div className="container section">
          <div className="home-story-grid">
            <div>
              <span className="eyebrow">The problem</span>
              <h2>
                Supply exists. Demand exists. <em>They rarely meet.</em>
              </h2>
            </div>
            <div className="home-story-copy">
              <p>
                Every harvest begins with a farmer. The right buyer should not
                feel like another long journey. Yet produce moves through a
                chain of middlemen, opaque prices, and guesswork about where
                demand actually is.
              </p>
              <p>
                KisanSetu brings the market into view: demand, price, buyer,
                location, and timing in one connected flow.
              </p>
              <Link className="text-link" href="/story">
                Our story <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE — supply chain */}
      <section className="container">
        <div className="feature-row reveal">
          <div className="feature-media">
            <img src={img.tomatoes} alt="Fresh tomatoes ready for market" loading="lazy" />
          </div>
          <div className="feature-copy">
            <span className="eyebrow">Supply</span>
            <h2>
              Produce with a buyer <em>in view.</em>
            </h2>
            <p>
              Farmers list what they grow, how much, and when it will be ready.
              No more waiting in the dark for a buyer to appear.
            </p>
            <Link className="text-link" href="/marketplace">
              Browse the marketplace <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="feature-row reverse reveal">
          <div className="feature-media">
            <img src={img.market} alt="Produce waiting at a market" loading="lazy" />
          </div>
          <div className="feature-copy">
            <span className="eyebrow">Demand</span>
            <h2>
              Buyers find what they need, <em>when they need it.</em>
            </h2>
            <p>
              Buyers see live supply, quality, and location. KisanSetu matches
              the right buyer to the right harvest — by crop, quantity, price,
              and distance.
            </p>
            <Link className="text-link" href="/market-match">
              See how matching works <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="feature-row reveal">
          <div className="feature-media">
            <img src={img.crates} alt="Harvest crates ready to move" loading="lazy" />
          </div>
          <div className="feature-copy">
            <span className="eyebrow">Movement</span>
            <h2>
              The route between them, <em>optimized.</em>
            </h2>
            <p>
              From listing to forecast to price recommendation to buyer match to
              route — every step is connected, so produce moves with less waste
              and less guesswork.
            </p>
            <Link className="text-link" href="/dashboard">
              See the product <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* STEPS — how it works */}
      <section className="container section-tight reveal">
        <span className="eyebrow">How it works</span>
        <div className="steps" style={{ marginTop: 28 }}>
          <div className="step">
            <b>01</b>
            <h3>List your harvest</h3>
            <p>Tell us what you grow, how much, and when it will be ready.</p>
          </div>
          <div className="step">
            <b>02</b>
            <h3>Get market intelligence</h3>
            <p>See current prices, demand, and a recommended range for your produce.</p>
          </div>
          <div className="step">
            <b>03</b>
            <h3>Meet your buyer</h3>
            <p>Get matched to buyers by crop, quantity, price, and distance — then move it.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="container">
          <h2>From farm to market, directly.</h2>
          <p>
            See what a clearer market looks like for your produce. Answer a few
            simple questions and get a clearer next move.
          </p>
          <Link className="btn btn-primary btn-lg" href="/market-match">
            Find your market match <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
    </PublicLayout>
  );
}
