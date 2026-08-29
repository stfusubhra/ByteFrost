/* KisanSetu Story: concise public explanation of the farmer-to-market problem and connected approach. */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

export default function Story() {
  return (
    <PublicLayout eyebrow="Our story / KisanSetu">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Our story</span>
          <h1>Less distance between harvest and home.</h1>
          <p>
            Every harvest begins with a farmer. The right buyer should not feel
            like another long journey.
          </p>
        </div>
      </section>

      <div className="container">
        <section className="story-flow">
          <div>
            <span className="eyebrow">The problem</span>
            <h2>
              Supply exists. Demand exists. <em>They should meet.</em>
            </h2>
          </div>
          <div className="story-copy">
            <p>
              Farmers, buyers, price signals, timing, and transport often sit in
              different places. That makes a good harvest harder to move than it
              should be.
            </p>
            <p>
              KisanSetu brings those signals into one shared market view. The
              result is a simpler connection from what is ready to sell to who is
              ready to buy.
            </p>
            <Link className="text-link" href="/market-match">
              Find your market match <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <section className="section-tight">
          <span className="eyebrow">The KisanSetu approach</span>
          <div className="steps" style={{ marginTop: 28 }}>
            <div className="step">
              <b>01</b>
              <h3>See demand.</h3>
              <p>Know what the market needs next.</p>
            </div>
            <div className="step">
              <b>02</b>
              <h3>Match supply.</h3>
              <p>Find the right buyer for what is ready.</p>
            </div>
            <div className="step">
              <b>03</b>
              <h3>Move smarter.</h3>
              <p>Coordinate the route, load, and timing.</p>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
