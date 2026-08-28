/* KisanSetu Story: concise public explanation of the farmer-to-market problem and connected approach. */
import PublicLayout from "@/components/PublicLayout";

export default function Story() {
  return (
    <PublicLayout eyebrow="Our story / KisanSetu">
      <section className="public-hero story-hero">
        <span>03 / OUR STORY</span>
        <h1>
          Less distance
          <br />
          <em>between harvest and home.</em>
        </h1>
        <p>
          Every harvest begins with a farmer. The right buyer should not feel
          like another long journey.
        </p>
      </section>

      <section className="story-flow public-reveal">
        <div>
          <span>THE PROBLEM</span>
          <h2>
            Supply exists.
            <br />
            Demand exists.
            <br />
            <em>They should meet.</em>
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
          <a className="public-text-link" href="/market-match">
            Find your market match →
          </a>
        </div>
      </section>

      <section className="story-steps public-reveal">
        <span>THE KISANSETU APPROACH</span>
        <div>
          <article>
            <b>01</b>
            <h3>See demand.</h3>
            <p>Know what the market needs next.</p>
          </article>
          <article>
            <b>02</b>
            <h3>Match supply.</h3>
            <p>Find the right buyer for what is ready.</p>
          </article>
          <article>
            <b>03</b>
            <h3>Move smarter.</h3>
            <p>Coordinate the route, load, and timing.</p>
          </article>
        </div>
      </section>
    </PublicLayout>
  );
}
