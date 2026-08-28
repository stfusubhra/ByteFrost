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
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { fetchListings, fetchMatches, ApiError } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";
import React from "react";

/**
 * Shape of a listing for the matching UI (simplified from backend).
 */
type MatchListing = {
  id: string;
  crop_name: string;
  quantity_kg: number;
  price_per_kg: number | null;
  pickup_location: string;
};

/**
 * Shape of a match result from the backend.
 */
type MatchResult = {
  buyer_id: string;
  score: number;
  explanation: {
    quantity_fit: number;
    price_score: number;
    distance_score: number;
    reliability: number;
    distance_km: number | null;
    order_history: number;
  };
};

export default function MarketMatch() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<MatchListing[]>([]);

  // Demo flow data (clearly labeled as such)
  const demoSteps = [
    "What are you growing?",
    "How much is ready?",
    "Where is it?",
    "When can it move?",
  ];
  const demoAnswers = [
    ["Tomatoes", "Onions", "Potatoes"],
    ["Under 250 kg", "250–500 kg", "Over 500 kg"],
    ["Nashik, MH", "Pune, MH", "Satara, MH"],
    ["This week", "Next 7 days", "Next month"],
  ];

  // Check if we have an auth token
  const hasToken = !!localStorage.getItem("kisansetu_token");

  // Fetch listings for real matching (public endpoint)
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
              pickup_location: l.pickup_location || "Location TBA",
            }))
          );
        } catch (err) {
          if (err instanceof ApiError) {
            setError(
              `Failed to load listings: ${err.message} (status ${err.status})`
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
  }, [hasToken]);

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
      setStep(2); // Move to results step
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
      <PublicLayout eyebrow="Market match / KisanSetu">
        <section className="match-page">
          <div className="match-intro">
            <span>02 / FIND YOUR MARKET MATCH</span>
            <h1>
              The right market<br />
              <em>is closer than it feels.</em>
            </h1>
            <p>
              Answer a few simple questions. Get a clearer next move for what
              you grow.
            </p>
            {/* Demo flow disclaimer */}
            <div className="match-demo-disclaimer">
              <strong>DEMO FLOW</strong>: This is a demonstration. Real matching
              requires authentication and uses live data from the ByteFrost
              backend.
            </div>
          </div>
          {done ? (
            <div className="match-result">
              <div className="match-result-mark">
                <Check size={24} />
              </div>
              <span>YOUR DEMO MATCH</span>
              <h2>Tomatoes · Nashik, MH</h2>
              <div className="match-result-grid">
                <div>
                  <strong>92%</strong>
                  <small>buyer match</small>
                </div>
                <div>
                  <strong>28 km</strong>
                  <small>efficient route</small>
                </div>
                <div>
                  <strong>700 kg</strong>
                  <small>demo load</small>
                </div>
              </div>
              <p>
                We found a clearer route from your produce to a nearby buyer.
                <em>This is demo data.</em> Connect the live marketplace when
                you are ready.
              </p>
              <a className="public-pill" href="/marketplace">
                Explore matching buyers <ArrowRight size={15} />
              </a>
              <button className="text-button" onClick={resetFlow}>
                Start again
              </button>
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
              <span className="match-count">
                0{step + 1} <em>/ 04</em>
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
                  className="back-button"
                  onClick={() => setStep((current) => current - 1)}
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              )}
            </div>
          )}
        </section>
      </PublicLayout>
    );
  }

  // --- REAL FLOW (has auth) ---
  return (
    <PublicLayout eyebrow="Market match / KisanSetu">
      <section className="match-page">
        <div className="match-intro">
          <span>02 / FIND YOUR MARKET MATCH</span>
          <h1>
            Find real buyers<br />
            <em>for your produce.</em>
          </h1>
          <p>
            Select an active listing to see real, explainable matches based on
            quantity fit, price, distance, and buyer reliability.
          </p>
          {/* Auth status */}
          <div className="match-auth-status">
            <span>✅ Authenticated</span> <span>Real data flow</span>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="match-error public-reveal">
            ⚠️ {error}
          </div>
        )}

        {/* Loading state for listings */}
        {loading && !listings.length && (
          <div className="match-loading public-reveal">
            Loading your listings…
          </div>
        )}

        {/* Step 1: Select listing */}
        {step === 0 && (
          <form className="match-listing-select" onSubmit={handleRealSubmit}>
            <div className="match-question">
              <h2>Select a listing to match</h2>
              <p>
                Choose from your active produce listings. The matching engine
                will score real buyers based on their order history, location,
                and preferences.
              </p>
              {listings.length === 0 ? (
                <p>
                  No active listings found. <a href="/marketplace">Create a
                  listing first</a> to enable real matching.
                </p>
              ) : (
                <div>
                  <label>
                    Listing
                    <select
                      required
                      value={listingId || ""}
                      onChange={(e) => setListingId(e.target.value)}
                    >
                      <option value="" disabled>
                        Select a listing
                      </option>
                      {listings.map((listing) => (
                        <option key={listing.id} value={listing.id}>
                          {listing.crop_name} — {listing.quantity_kg} kg@{listing.price_per_kg !== null ? `₹${listing.price_per_kg.toFixed(2)}/kg` : "Price TBA"} ({listing.pickup_location})
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="public-pill" type="submit">
                    Find matches <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Step 2: Loading matches */}
        {step === 1 && loading && (
          <div className="match-question">
            <h2>Finding your matches…</h2>
            <p>
              The matching engine is scoring real buyers based on:<br />
              • Quantity fit: How well buyer order sizes match your listing<br />
              • Price score: Attractiveness of your price point<br />
              • Distance score: Geographic proximity to buyer locations<br />
              • Reliability: Buyer’s order completion history
            </p>
          </div>
        )}

        {/* Step 3: Show results */}
        {step === 2 && (
          <div className="match-result">
            {matches.length === 0 ? (
              <>
              <div className="match-result-mark">
                <Check size={24} />
              </div>
              <span>NO MATCHES FOUND</span>
              <h2>Try adjusting your listing or broadening criteria</h2>
              <p>
                No real buyers matched your selected listing. This could be
                because:
              </p>
              <ul className="match-result-list">
                <li>No active buyers in the system yet</li>
                <li>Your listing’s price/quantity/location doesn’t align with
                  current buyer demand</li>
                <li>Try creating a different listing or waiting for more buyers
                  to join</li>
              </ul>
              <a className="public-pill" href="/marketplace">
                Explore other listings <ArrowRight size={15} />
              </a>
              <button className="text-button" onClick={resetFlow}>
Try another listing
               </button>
               </>
              ) : (
                <React.Fragment>
                 <div className="match-result-mark">
                  <Check size={24} />
                </div>
                <span>REAL MATCHES</span>
                <h2>Top matches for your produce</h2>
                <div className="match-results-list">
                  {matches.map((match, index) => (
                    <div key={match.buyer_id} className="match-result-card">
                      <div className="match-result-rank">
                        #{index + 1}
                      </div>
                      <div className="match-result-content">
                        <div className="match-result-score">
                          <strong>{Math.round(match.score * 100)}%</strong>
                          <small>match score</small>
                        </div>
                        <div className="match-result-details">
                          <div>
                            <strong>Buyer ID:</strong> {match.buyer_id.substring(
                              0,
                              8
                            )}…
                          </div>
                          <div>
                            <strong>Explanation:</strong>
                          </div>
                          <ul className="match-explanation">
                            <li>
                              Quantity fit:{" "}
                              {Math.round(match.explanation.quantity_fit * 100)}%
                            </li>
                            <li>
                              Price score:{" "}
                              {Math.round(match.explanation.price_score * 100)}%
                            </li>
                            <li>
                              Distance:{" "}
                              {match.explanation.distance_km !== null
                                ? `${match.explanation.distance_km} km`
                                : "Location TBA"}
                              {" "}
                              ({Math.round(
                                match.explanation.distance_score * 100
                              )}% score)
                            </li>
                            <li>
                              Reliability:{" "}
                              {Math.round(
                                match.explanation.reliability * 100
                              )}% ({match.explanation.order_history} orders)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="match-result-note">
                  These scores are derived from real data in the ByteFrost
                  backend. Each component is explainable and based on actual
                  buyer behavior, location, and order history.
                </p>
                <div className="match-result-actions">
                  <a
                    className="public-pill"
                    href="/marketplace"
                    ><ArrowLeft size={15} /> Back to marketplace</a
                  >
                  <button
                    className="text-button"
                    onClick={resetFlow}
                  >
                    Match another listing
                  </button>
</div>
               </React.Fragment>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}