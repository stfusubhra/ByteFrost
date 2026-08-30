/* KisanSetu Marketplace: public discovery surface for available produce.
 *
 * This page now wires to the real FastAPI backend:
 *   GET /api/v1/listings/ (public endpoint)
 *
 * The Marketplace shows honest loading/empty/error states and falls back to
 * clearly labeled demo data only when the backend is unreachable, preserving
 * the user experience while being transparent about data provenance.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { fetchListings, ApiError } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";

/**
 * Shape of a listing as used by the Marketplace UI.
 * This is a view-model that maps from the backend Listing schema
 * to the fields needed by the card/detail rendering.
 */
type MarketListing = {
  id: string; // UUID from backend
  crop: string; // crop_name
  grade: string; // quality_grade or "N/A"
  place: string; // pickup_location
  quantity: string; // quantity_kg formatted
  price: string; // price_per_kg formatted or "Price on request"
  freshness: string; // derived from created_at or harvest_date
  route: string; // placeholder for demo; real route would need buyer location
  match: string; // placeholder for demo; real match would come from matching endpoint
  image: string; // fallback image based on crop type
  status: string; // is_active ? "Ready to move" : "Inactive"
  harvest: string; // derived or placeholder
};

/**
 * Fallback demo data used ONLY when the backend is unreachable.
 * This is clearly labeled as demo data in the UI to maintain honesty.
 */
const DEMO_LISTINGS: MarketListing[] = [
  {
    id: "demo-1",
    crop: "Tomatoes",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "500 kg",
    price: "₹32/kg",
    freshness: "Harvested today",
    route: "28 km · 1h 12m",
    match: "92%",
    image: "/manus-storage/kisan-story-tomatoes_128fdb50.jpg",
    status: "Ready to move",
    harvest: "Today",
  },
  {
    id: "demo-2",
    crop: "Harvest crates",
    grade: "Grade A",
    place: "Pune, MH",
    quantity: "700 kg",
    price: "₹30/kg",
    freshness: "Harvested yesterday",
    route: "42 km · 1h 48m",
    match: "87%",
    image: "/manus-storage/kisan-story-crates_8ebf1895.jpg",
    status: "Matched supply",
    harvest: "Yesterday",
  },
  {
    id: "demo-3",
    crop: "Fresh produce",
    grade: "Grade B",
    place: "Satara, MH",
    quantity: "320 kg",
    price: "₹25/kg",
    freshness: "Harvested 2 days ago",
    route: "61 km · 2h 18m",
    match: "81%",
    image: "/manus-storage/kisan-story-waiting_e345d9da.jpg",
    status: "Awaiting buyer",
    harvest: "2 days ago",
  },
  {
    id: "demo-4",
    crop: "Tomatoes",
    grade: "Grade A",
    place: "Ahmednagar, MH",
    quantity: "1,200 kg",
    price: "₹31/kg",
    freshness: "Harvested today",
    route: "74 km · 2h 40m",
    match: "78%",
    image: "/manus-storage/kisan-story-farmer_581c0db7.jpg",
    status: "New listing",
    harvest: "Today",
  },
];

/**
 * Maps a backend Listing to the Marketplace UI shape.
 * This keeps the UI rendering logic stable while isolating
 * backend schema changes to this adapter.
 */
function mapBackendListing(listing: any): MarketListing {
  // Determine image based on crop type (simple heuristic)
  const imageMap: Record<string, string> = {
    Tomatoes: "/manus-storage/kisan-story-tomatoes_128fdb50.jpg",
    "Harvest crates": "/manus-storage/kisan-story-crates_8ebf1895.jpg",
    "Fresh produce": "/manus-storage/kisan-story-waiting_e345d9da.jpg",
    Default: "/manus-storage/kisan-story-farmer_581c0db7.jpg",
  };
  const image =
    imageMap[listing.crop_name] || imageMap.Default;

  // Format quantity with commas
  const quantity =
    listing.quantity_kg !== null && listing.quantity_kg !== undefined
      ? `${listing.quantity_kg.toLocaleString()} kg`
      : "Quantity TBA";

  // Format price
  const price =
    listing.price_per_kg !== null && listing.price_per_kg !== undefined
      ? `₹${listing.price_per_kg.toFixed(2)}/kg`
      : "Price on request";

  // Freshness: simple heuristic based on creation time
  // In a real app, this would use harvest_date or more sophisticated logic
  const freshness =
    listing.harvest_date !== null
      ? "Harvested recently"
      : "Freshness info TBA";

  return {
    id: listing.id,
    crop: listing.crop_name,
    grade: listing.quality_grade || "N/A",
    place: listing.pickup_location || "Location TBA",
    quantity,
    price,
    freshness,
    route: "Route TBA", // Would need buyer location for real calculation
    match: "Match TBA", // Would come from matching endpoint for a specific buyer
    image,
    status: listing.is_active ? "Ready to move" : "Inactive",
    harvest: listing.harvest_date || "Harvest date TBA",
  };
}

export default function Marketplace() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All produce");
  const [sort, setSort] = useState("Recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState("");

  // Data fetching state
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Fetch listings from backend on mount and when filters change
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const backendListings = await fetchListings({
          crop_name: query || undefined,
          limit: 20, // Reasonable limit for marketplace view
        });

        if (isMounted) {
          setListings(backendListings.map(mapBackendListing));
          setUsingDemoData(false);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          // Network or backend error - fall back to demo data with clear labeling
          if (isMounted) {
            setListings(DEMO_LISTINGS);
            setUsingDemoData(true);
            setError(
              `Showing demo data. Backend error: ${err.message} (status ${err.status})`
            );
          }
        } else {
          // Unexpected error
          if (isMounted) {
            setListings([]);
            setError("Unexpected error loading marketplace data");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [query]); // Re-fetch when search query changes

  // Filter listings based on search, active tab, and sort
  const filtered = listings
    .filter((item) => {
      const text = `${item.crop} ${item.place} ${item.grade}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesTab =
        active === "All produce" ||
        item.crop === active ||
        item.status === active;
      return matchesQuery && matchesTab;
    })
    .sort((a, b) => {
      if (sort === "Closest route") {
        // Simple string comparison for demo route values
        return a.route.localeCompare(b.route);
      }
      if (sort === "Highest match") {
        // Convert match percentage strings to numbers for sorting
        const matchA = parseInt(a.match) || 0;
        const matchB = parseInt(b.match) || 0;
        return matchB - matchA; // Descending (highest first)
      }
      // Default: Recommended (no change to original order)
      return 0;
    });

  const action = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <PublicLayout eyebrow="Marketplace / KisanSetu">
      <section className="market-hero">
        <div>
          <span>01 / MARKETPLACE</span>
          <h1>
            Produce with<br />
            <em>a buyer in view.</em>
          </h1>
          <p>
            Browse available supply with market context attached — location,
            freshness, price, route, and match.
          </p>
        </div>
        <div className="market-hero-actions">
          <button
            className="public-pill"
            onClick={() =>
              action(
                "Listing creation is ready for the connected farmer flow."
              )
            }
          >
            List your produce <ArrowRight size={15} />
          </button>
          <a className="public-pill light" href="/market-match">
            Find your market match <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {/* Status bar showing data state */}
      {usingDemoData && (
        <div className="market-summary public-reveal">
          <div className="market-summary-note">
            ⚠️ Showing demo data. Backend connection failed: {error}
          </div>
        </div>
      )}
      {!usingDemoData && error && (
        <div className="market-summary public-reveal">
          <div className="market-summary-note">
            ⚠️ Backend error: {error}
          </div>
        </div>
      )}

      <section className="market-summary public-reveal">
        <div>
          <strong>{filtered.length}</strong><span>available listings</span>
        </div>
        <div>
          <strong>
            {usingDemoData ? "Demo" : "Live"} data
          </strong><span>source</span>
        </div>
        <div>
          <strong>{usingDemoData ? "92%" : "Live match"}</strong><span>top buyer
            match</span>
        </div>
        <div className="market-summary-note">
          {usingDemoData
            ? "Illustrative demo market state · live data connects here"
            : "Live data from ByteFrost backend"}
        </div>
      </section>

      <section className="market-toolbar expanded public-reveal">
        <div className="public-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crop, grade, or location"
          />
        </div>
        <div className="market-toolbar-actions">
          <label>
            Sort by{" "}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option>Recommended</option>
              <option>Highest match</option>
              <option>Closest route</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <button
            className="filter-button"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>
      </section>

      {filtersOpen && (
        <div className="market-filter-panel">
          <span>FILTERS / {usingDemoData ? "DEMO" : "LIVE"}</span>
          <button
            onClick={() => {
              setActive("All produce");
              setFiltersOpen(false);
            }}
          >
            Reset filters
          </button>
<p>
              Current view is optimized for available supply and buyer matching.
              {usingDemoData
                ? "Connect live inventory to add crop, region, quantity, and freshness filters."
                : "Live inventory connected via ByteFrost backend."}
            </p>
        </div>
      )}

      <section className="market-content expanded public-reveal">
        <div className="market-tabs">
          {["All produce", "Tomatoes", "Ready to move", "Matched supply", "Awaiting buyer"].map(
            (tab) => (
              <button
                className={active === tab ? "active" : ""}
                key={tab}
                onClick={() => setActive(tab)}
              >
                {tab}
              </button>
            )
          )}
        </div>
        <div className="market-grid expanded">
          {loading ? (
            <div className="market-loading">
              Loading marketplace data...
            </div>
          ) : filtered.length === 0 ? (
            <div className="public-empty">
              No matching produce yet. Try another crop or location.
            </div>
          ) : (
            filtered.map((item) => (
              <Link href={`/listing/${item.id}`} key={item.id}>
                <article className="market-card expanded">
                  <div className="market-card-image">
                    <img
                      src={item.image}
                      alt={`${item.crop} listing`}
                    />
                    <span className="market-status">{item.status}</span>
                    <span className="market-match">{item.match} match</span>
                  </div>
                  <div className="market-card-meta">
                    <div>
                      <strong>{item.crop}</strong>
                      <span>{item.grade} · {item.freshness}</span>
                    </div>
                    <div>
                      <span>
                        <MapPin size={11} /> {item.place}
                      </span>
                      <span>{item.quantity}</span>
                    </div>
                  </div>
                  <div className="market-card-bottom">
                    <strong>{item.price}</strong>
                    <button aria-label={`Contact about ${item.crop}`}>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      </section>

      {toast && <div className="public-toast">{toast}</div>}
    </PublicLayout>
  );
}