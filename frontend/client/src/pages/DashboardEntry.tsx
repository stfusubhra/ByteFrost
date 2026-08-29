/* KisanSetu Dashboard entry: public transition page; existing application/dashboard stays untouched. */
import { Link } from "wouter";
import { ArrowRight, BarChart3, MapPin, Users } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

export default function DashboardEntry() {
  return (
    <PublicLayout eyebrow="Product / KisanSetu">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Product</span>
          <h1>See the market in one view.</h1>
          <p>
            Demand, price, buyer matching, and route coordination — brought
            together for the next decision.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" href="/">
              Open the KisanSetu experience <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="entry-grid">
          <article className="card entry-card">
            <BarChart3 size={20} />
            <span>Demand</span>
            <h2>Know what the market needs.</h2>
          </article>
          <article className="card entry-card">
            <Users size={20} />
            <span>Matching</span>
            <h2>Find the right buyer.</h2>
          </article>
          <article className="card entry-card">
            <MapPin size={20} />
            <span>Logistics</span>
            <h2>Move it smarter.</h2>
          </article>
        </section>

        <section className="entry-note">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Ready when you are
          </span>
          <h2>From farm to market, directly.</h2>
          <Link className="text-link" href="/marketplace">
            Explore the marketplace <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </PublicLayout>
  );
}
