/* KisanSetu landing: five focused sections.
   1. Hero — editorial, short, photography-led
   2. How it works — four numbered steps, thin dividers
   3. Marketplace preview — real listings as a clean table
   4. Why KisanSetu — split editorial layout with photography
   5. Final CTA — one line, one action, minimal footer
*/
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useReveal } from "../hooks/useReveal";
import { fetchListings } from "@/lib/api";

const img = {
  hero: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1600&q=80",
  field: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80",
  crates: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&q=80",
};

type PreviewRow = {
  id: string;
  crop: string;
  location: string;
  quantity: string;
  price: string;
  status: string;
};

const FALLBACK_ROWS: PreviewRow[] = [
  { id: "f1", crop: "Tomato · Grade A", location: "Nashik, MH", quantity: "500 kg", price: "₹45/kg", status: "Ready to move" },
  { id: "f2", crop: "Onion · Grade A", location: "Pune, MH", quantity: "300 kg", price: "₹25/kg", status: "Ready to move" },
  { id: "f3", crop: "Potato · Grade B", location: "Satara, MH", quantity: "400 kg", price: "₹18/kg", status: "Ready to move" },
];

export default function Home() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PreviewRow[]>(FALLBACK_ROWS);
  useReveal({ threshold: 0.16, rootMargin: "0px 0px -12% 0px" });

  useEffect(() => {
    let alive = true;
    fetchListings({ limit: 6 })
      .then((listings) => {
        if (!alive || !listings?.length) return;
        setRows(
          listings.map((l) => ({
            id: l.id,
            crop: l.variety ? `${l.crop_name} · ${l.variety}` : l.crop_name,
            location: l.pickup_location ?? "—",
            quantity: `${l.quantity_kg} kg`,
            price: l.price_per_kg != null ? `₹${l.price_per_kg}/kg` : "—",
            status: l.is_active ? "Ready to move" : "Inactive",
          }))
        );
      })
      .catch(() => {
        /* keep fallback rows */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PublicLayout>
      <main>
        {/* 1 · HERO */}
        <section className="land-hero">
          <div className="container land-hero-grid">
            <div className="land-hero-copy">
              <span className="eyebrow">{t("home.hero.eyebrow")}</span>
              <h1>
                {t("home.hero.h1a")}
                <br />
                <em>{t("home.hero.h1b")}</em>
              </h1>
              <p>{t("home.hero.p")}</p>
              <div className="land-hero-cta">
                <Link className="btn btn-primary btn-lg" href="/marketplace">
                  {t("home.hero.cta1")} <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-secondary btn-lg" href="/signup">
                  {t("home.hero.cta2")}
                </Link>
              </div>
            </div>
            <div className="land-hero-media">
              <img
                src={img.hero}
                alt="A farmer standing in a green field at harvest time"
                fetchPriority="high"
              />
            </div>
          </div>
        </section>

        {/* 2 · HOW IT WORKS */}
        <section className="land-how">
          <div className="container">
            <div className="land-section-head">
              <span className="eyebrow">{t("home.how.label")}</span>
              <h2>{t("home.how.h2")}</h2>
            </div>
            <ol className="land-steps">
              <li className="land-step">
                <span className="land-step-num">01</span>
                <div>
                  <h3>{t("home.how.step1.title")}</h3>
                  <p>{t("home.how.step1.p")}</p>
                </div>
              </li>
              <li className="land-step">
                <span className="land-step-num">02</span>
                <div>
                  <h3>{t("home.how.step2.title")}</h3>
                  <p>{t("home.how.step2.p")}</p>
                </div>
              </li>
              <li className="land-step">
                <span className="land-step-num">03</span>
                <div>
                  <h3>{t("home.how.step3.title")}</h3>
                  <p>{t("home.how.step3.p")}</p>
                </div>
              </li>
              <li className="land-step">
                <span className="land-step-num">04</span>
                <div>
                  <h3>{t("home.how.step4.title")}</h3>
                  <p>{t("home.how.step4.p")}</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* 3 · MARKETPLACE PREVIEW */}
        <section className="land-market">
          <div className="container">
            <div className="land-section-head land-section-head-row">
              <div>
                <span className="eyebrow">{t("home.preview.label")}</span>
                <h2>{t("home.preview.h2")}</h2>
              </div>
              <Link className="text-link" href="/marketplace">
                {t("home.preview.viewAll")} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="land-table-wrap">
              <table className="land-table">
                <thead>
                  <tr>
                    <th>{t("home.preview.colCrop")}</th>
                    <th>{t("home.preview.colLocation")}</th>
                    <th>{t("home.preview.colQty")}</th>
                    <th>{t("home.preview.colPrice")}</th>
                    <th>{t("home.preview.colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="land-table-crop">{r.crop}</td>
                      <td>{r.location}</td>
                      <td>{r.quantity}</td>
                      <td className="land-table-price">{r.price}</td>
                      <td>
                        <span className="land-table-status">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4 · WHY KISANSETU */}
        <section className="land-why">
          <div className="container">
            <div className="land-section-head">
              <span className="eyebrow">{t("home.why.label")}</span>
              <h2>{t("home.why.h2")}</h2>
            </div>
            <div className="land-why-grid">
              <div className="land-why-media">
                <img src={img.field} alt="Green farmland stretching to the horizon" loading="lazy" />
              </div>
              <div className="land-why-list">
                <div className="land-why-item">
                  <h3>{t("home.why.b1.title")}</h3>
                  <p>{t("home.why.b1.p")}</p>
                </div>
                <div className="land-why-item">
                  <h3>{t("home.why.b2.title")}</h3>
                  <p>{t("home.why.b2.p")}</p>
                </div>
                <div className="land-why-item">
                  <h3>{t("home.why.b3.title")}</h3>
                  <p>{t("home.why.b3.p")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 · FINAL CTA */}
        <section className="land-cta">
          <div className="container land-cta-inner">
            <h2>{t("home.closing.h2")}</h2>
            <Link className="btn btn-primary btn-lg" href="/signup">
              {t("home.closing.cta")} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}