/* KisanSetu Market Match: public guided flow for turning crop details into a clearer next move.
 *
 * This page now handles auth honestly:
 *   - No token: clear demo flow (labeled as such) with fake data
 *   - Has token: real flow that fetches a listing and calls the real matching endpoint
 *
 * The real matching endpoint (/api/v1/matching/find-matches) requires authentication
 * and returns explainable scores based on real DB data (quantity fit, price, distance, reliability).
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { fetchListings, fetchMatches, ApiError, MatchResult } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import React from "react";

type MatchListing = {
  id: string;
  crop_name: string;
  quantity_kg: number;
  price_per_kg: number | null;
  pickup_location: string;
};

export default function MarketMatch() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<MatchListing[]>([]);

  // Demo flow data using localized strings
  const demoSteps = [
    t("match.qGrowing"),
    t("match.qReady"),
    t("match.qWhere"),
    t("match.qWhen"),
  ];

  const demoAnswers = [
    [t("match.cropTomatoes"), t("match.cropOnions"), t("match.cropPotatoes")],
    [t("match.qtyUnder250"), t("match.qty250to500"), t("match.qtyOver500")],
    ["Nashik, MH", "Pune, MH", "Satara, MH"],
    [t("match.timeThisWeek"), t("match.timeNext7Days"), t("match.timeNextMonth")],
  ];

  const hasToken = !!localStorage.getItem("kisansetu_token");

  useEffect(() => {
    if (hasToken) {
      const loadListings = async () => {
        setLoading(true);
        try {
          const data = await fetchListings({ limit: 20 });
          setListings(
            data.map((l) => ({
              id: l.id,
              crop_name: l.crop_name,
              quantity_kg: l.quantity_kg,
              price_per_kg: l.price_per_kg,
              pickup_location: l.pickup_location || t("marketplace.locationTBA"),
            }))
          );
        } catch (err) {
          if (err instanceof ApiError) {
            setError(
              `${err.message} (${err.status})`
            );
          } else {
            setError("Failed to load listings");
          }
        } finally {
          setLoading(false);
        }
      };
      loadListings();
    }
  }, [hasToken, t]);

  const handleDemoChoose = (value: string) => {
    setSelected((current) => [...current.slice(0, step), value]);
    setStep((current) => current + 1);
  };

  const handleRealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId) {
      setError("Please select a listing");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await fetchMatches(listingId, 5);
      setMatches(data);
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          `Matching failed: ${err.message} (status ${err.status})`
        );
      } else {
        setError("Matching failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setSelected([]);
    setListingId(null);
    setMatches([]);
    setError(null);
  };

  // --- DEMO FLOW (no auth) ---
  if (!hasToken) {
    const done = step >= demoSteps.length;
    return (
      <PublicLayout eyebrow={`${t("match.eyebrow")} / KisanSetu`}>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">{t("match.eyebrow")}</span>
            <h1>{t("match.h1")}</h1>
            <p>{t("match.p")}</p>
            <div className="badge badge-warning" style={{ marginTop: 20 }}>
              {t("match.demoBadge")}
            </div>
          </div>
        </section>

        <div className="container match-flow">
          {done ? (
            <div className="match-result">
              <div className="match-result-mark">
                <Check size={24} />
              </div>
              <span className="eyebrow" style={{ justifyContent: "center" }}>
                {t("match.yourDemoMatch")}
              </span>
              <h2>{selected[0] || t("match.cropTomatoes")} · {selected[2] || "Nashik, MH"}</h2>
              <div className="match-result-grid">
                <div>
                  <strong>92%</strong>
                  <small>{t("home.match.stat1.label")}</small>
                </div>
                <div>
                  <strong>28 km</strong>
                  <small>{t("home.match.stat2.label")}</small>
                </div>
                <div>
                  <strong>{selected[1] || "500 kg"}</strong>
                  <small>{t("home.match.stat3.label")}</small>
                </div>
              </div>
              <p className="state-body" style={{ margin: "0 auto 24px" }}>
                {t("home.match.p")}
              </p>
              <div className="match-result-actions">
                <Link className="btn btn-primary" href="/marketplace">
                  {t("home.collection.link")} <ArrowRight size={15} />
                </Link>
                <button className="btn btn-ghost" onClick={resetFlow}>
                  {t("match.startOver")}
                </button>
              </div>
            </div>
          ) : (
            <div className="match-question">
              <div className="match-progress">
                <span
                  style={{
                    width: `${(step / demoSteps.length) * 100}%`,
                  }}
                />
              </div>
              <span className="eyebrow">
                0{step + 1} / 04
              </span>
              <h2>{demoSteps[step]}</h2>
              <div className="match-options">
                {demoAnswers[step].map((answer) => (
                  <button
                    className={selected[step] === answer ? "selected" : ""}
                    key={answer}
                    onClick={() => handleDemoChoose(answer)}
                  >
                    {answer}
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  className="btn btn-ghost match-back"
                  onClick={() => setStep((current) => current - 1)}
                >
                  <ArrowLeft size={14} />
                  {t("match.back")}
                </button>
              )}
            </div>
          )}
        </div>
      </PublicLayout>
    );
  }

  // --- REAL FLOW (has auth) ---
  return (
    <PublicLayout eyebrow={`${t("match.eyebrow")} / KisanSetu`}>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("match.eyebrow")}</span>
          <h1>{t("match.h1")}</h1>
          <p>{t("match.p")}</p>
          <div className="row" style={{ marginTop: 20 }}>
            <span className="badge badge-success">Authenticated</span>
            <span className="badge badge-neutral">Real data flow</span>
          </div>
        </div>
      </section>

      <div className="container match-flow">
        {error && (
          <div className="card" style={{ padding: 20, marginBottom: 24, borderColor: "var(--error)" }}>
            <div className="badge badge-error">Error</div>
            <p className="state-body" style={{ marginTop: 8 }}>{error}</p>
          </div>
        )}

        {loading && !listings.length && (
          <div className="state">
            <div className="skeleton" style={{ width: 200, height: 16 }} />
            <div className="skeleton" style={{ width: 160, height: 14 }} />
          </div>
        )}

        {step === 0 && (
          <form className="match-question" onSubmit={handleRealSubmit}>
            <h2>{t("match.realSelectListing")}</h2>
            <p>
              {t("marketplace.filterSupplyDesc")}
            </p>
            {listings.length === 0 ? (
              <div className="state">
                <div className="state-title">{t("marketplace.emptyTitle")}</div>
                <div className="state-body">
                  <Link className="text-link" href="/marketplace">
                    {t("marketplace.listProduce")}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="stack">
                <label className="field">
                  <span>{t("nav.productDashboard")}</span>
                  <select
                    className="select"
                    required
                    value={listingId || ""}
                    onChange={(e) => setListingId(e.target.value)}
                  >
                    <option value="" disabled>
                      {t("match.realSelectListing")}
                    </option>
                    {listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.crop_name} — {listing.quantity_kg} kg @
                        {listing.price_per_kg !== null
                          ? `₹${listing.price_per_kg.toFixed(2)}/kg`
                          : t("marketplace.priceOnRequest")}{" "}
                        ({listing.pickup_location})
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-primary" type="submit">
                  {t("match.realFindMatches")} <ArrowRight size={15} />
                </button>
              </div>
            )}
          </form>
        )}

        {step === 1 && loading && (
          <div className="match-question">
            <h2>{t("match.realFinding")}</h2>
          </div>
        )}

        {step === 2 && (
          <div className="match-result">
            {matches.length === 0 ? (
              <>
                <div className="match-result-mark">
                  <Check size={24} />
                </div>
                <span className="eyebrow" style={{ justifyContent: "center" }}>
                  {t("marketplace.emptyTitle")}
                </span>
                <h2>{t("marketplace.emptyBody")}</h2>
                <div className="match-result-actions">
                  <Link className="btn btn-primary" href="/marketplace">
                    {t("home.collection.link")} <ArrowRight size={15} />
                  </Link>
                  <button className="btn btn-ghost" onClick={resetFlow}>
                    {t("match.startOver")}
                  </button>
                </div>
              </>
            ) : (
              <React.Fragment>
                <div className="match-result-mark">
                  <Check size={24} />
                </div>
                <span className="eyebrow" style={{ justifyContent: "center" }}>
                  {t("dash.bestMatches")}
                </span>
                <h2>{t("dash.bestMatches")}</h2>
                <div className="match-results-list">
                  {matches.map((match, index) => (
                    <div key={match.buyer_id} className="match-result-card">
                      <div className="match-result-rank">
                        #{index + 1}
                      </div>
                      <div className="match-result-score">
                        <strong>{Math.round(match.score * 100)}%</strong>
                        <small>{t("marketplace.matchBadge")}</small>
                      </div>
                      <div className="match-result-details">
                        <div>
                          <strong>{t("story.sec1.buyer")} ID:</strong> {match.buyer_id.substring(0, 8)}…
                        </div>
                        <div>
                          <strong>{t("dash.factors")}:</strong>
                        </div>
                        <ul className="match-explanation">
                          <li>
                            {t("story.sec4.availQty")}:{" "}
                            {Math.round(match.explanation.quantity_fit * 100)}%
                          </li>
                          <li>
                            {t("dash.recommendedPrice")}:{" "}
                            {Math.round(match.explanation.price_score * 100)}%
                          </li>
                          <li>
                            {t("story.sec4.farmerProx")}:{" "}
                            {match.explanation.distance_km !== null
                              ? `${match.explanation.distance_km} km`
                              : t("marketplace.locationTBA")}
                          </li>
                          <li>
                            {t("home.trust.1")}:{" "}
                            {Math.round(match.explanation.reliability * 100)}% (
                            {match.explanation.order_history} orders)
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="match-result-actions">
                  <Link className="btn btn-primary" href="/marketplace">
                    <ArrowLeft size={15} /> {t("listing.backMarketplace")}
                  </Link>
                  <button className="btn btn-ghost" onClick={resetFlow}>
                    {t("match.startOver")}
                  </button>
                </div>
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
