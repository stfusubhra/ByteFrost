/* KisanSetu Marketplace: public discovery surface for available produce.
 *
 * This page wires to the real FastAPI backend:
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
 * ListingImage renders the listing photo with a clean KisanSetu-styled
 * placeholder fallback. If the image fails to load (missing asset, network
 * error, etc.) we swap to a colored placeholder showing the crop initial
 * instead of leaving a raw broken-image icon or ugly alt text on screen.
 */
function ListingImage({
  src,
  alt,
  crop,
  className,
}: {
  src: string;
  alt: string;
  crop: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`market-image-fallback ${className || ""}`} aria-label={alt}>
        <span>{crop ? crop.charAt(0).toUpperCase() : "P"}</span>
      </div>
    );
  }

  return (
    <img
      className={className || ""}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}

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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [active, setActive] = useState("All produce");
  const [sort, setSort] = useState("Recommended");
  const [selected, setSelected] = useState<MarketListing | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState("");

  // Data fetching state
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Debounce the search query so typing does not fire an API request per
  // keystroke. The client-side filter below still uses the live `query` for
  // instant feedback while the backend call waits for the user to pause.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch listings from backend on mount and when the debounced search changes
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const backendListings = await fetchListings({
          crop_name: debouncedQuery || undefined,
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
  }, [debouncedQuery]); // Re-fetch when the debounced search query changes

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
        return a.route.localeCompare(b.route);
      }
      if (sort === "Highest match") {
        const matchA = parseInt(a.match) || 0;
        const matchB = parseInt(b.match) || 0;
        return matchB - matchA;
      }
      return 0;
    });

  const action = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <PublicLayout eyebrow="Marketplace / KisanSetu">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Marketplace</span>
          <h1>Produce with a buyer in view.</h1>
          <p>
            Browse available supply with market context attached — location,
            freshness, price, route, and match.
          </p>
          <div className="row" style={{ marginTop: 28 }}>
            <button
              className="btn btn-primary"
              onClick={() =>
                action("Listing creation is ready for the connected farmer flow.")
              }
            >
              List your produce <ArrowRight size={15} />
            </button>
            <Link className="btn btn-secondary" href="/market-match">
              Find your market match <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Data source notice */}
      {usingDemoData && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="badge badge-warning">
            Showing demo data — backend connection failed
          </div>
          <p className="state-body" style={{ marginTop: 8 }}>
            {error}
          </p>
        </div>
      )}
      {!usingDemoData && error && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="badge badge-error">Backend error</div>
          <p className="state-body" style={{ marginTop: 8 }}>{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <section className="container">
        <div className="market-toolbar">
          <div className="search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crop, grade, or location"
              aria-label="Search listings"
            />
          </div>
          <div className="market-toolbar-actions">
            <label className="row" style={{ gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              Sort by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort listings"
              >
                <option>Recommended</option>
                <option>Highest match</option>
                <option>Closest route</option>
              </select>
            </label>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={15} /> Filters
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="card" style={{ padding: 20, marginBottom: 8 }}>
            <div className="row-between">
              <span className="eyebrow">Filters</span>
              <button
                className="text-link"
                onClick={() => {
                  setActive("All produce");
                  setFiltersOpen(false);
                }}
              >
                Reset filters
              </button>
            </div>
            <p className="state-body" style={{ marginTop: 12 }}>
              Current view is optimized for available supply and buyer matching.
              {usingDemoData
                ? " Connect live inventory to add crop, region, quantity, and freshness filters."
                : " Live inventory connected via ByteFrost backend."}
            </p>
          </div>
        )}
      </section>

      {/* Content */}
      <section className="container">
        <div className="tabs" role="tablist" aria-label="Filter listings">
          {["All produce", "Tomatoes", "Ready to move", "Matched supply", "Awaiting buyer"].map(
            (tab) => (
              <button
                className={active === tab ? "active" : ""}
                key={tab}
                onClick={() => setActive(tab)}
                role="tab"
                aria-selected={active === tab}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="market-grid">
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div className="card" key={i} style={{ padding: 0, overflow: "hidden" }}>
                  <div className="skeleton" style={{ aspectRatio: "4 / 3" }} />
                  <div style={{ padding: 18 }}>
                    <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 13, width: "80%" }} />
                  </div>
                </div>
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className="state" style={{ gridColumn: "1 / -1" }}>
              <div className="state-icon"><Search size={20} /></div>
              <div className="state-title">No matching produce yet</div>
              <div className="state-body">
                Try another crop or location, or reset your filters.
              </div>
            </div>
          ) : (
            filtered.map((item) => (
              <article
                className="card market-card"
                key={item.id}
                onClick={() => setSelected(item)}
                style={{ cursor: "pointer", padding: 0, overflow: "hidden" }}
              >
                <div className="market-card-image">
                  <ListingImage
                    src={item.image}
                    alt={`${item.crop} listing`}
                    crop={item.crop}
                  />
                  <span className="badge badge-neutral" style={{ position: "absolute", top: 12, left: 12 }}>
                    {item.status}
                  </span>
                </div>
                <div className="market-card-body">
                  <div className="market-card-top">
                    <h3>{item.crop}</h3>
                    <span className="badge badge-primary">{item.match} match</span>
                  </div>
                  <div className="market-card-meta">
                    <span><MapPin size={12} /> {item.place}</span>
                    <span>{item.grade} · {item.freshness}</span>
                    <span>{item.quantity}</span>
                  </div>
                  <div className="market-card-bottom">
                    <span className="market-card-price">{item.price}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      aria-label={`View ${item.crop}`}
                      onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Detail modal */}
      {selected && (
        <div className="detail-backdrop" onClick={() => setSelected(null)}>
          <aside
            className="detail"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.crop} listing details`}
          >
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelected(null)}
              aria-label="Close listing"
              style={{ position: "absolute", top: 12, right: 12, zIndex: 2, background: "var(--surface)" }}
            >
              <X size={18} />
            </button>
            <div className="detail-image">
              <ListingImage
                src={selected.image}
                alt={`${selected.crop} detail`}
                crop={selected.crop}
              />
            </div>
            <div className="detail-content">
              <div className="row" style={{ gap: 8 }}>
                <span className="badge badge-neutral">{selected.status}</span>
                <span className="badge badge-primary">{selected.match} buyer match</span>
              </div>
              <h2>{selected.crop}</h2>
              <p className="row" style={{ color: "var(--ink-soft)", fontSize: 14 }}>
                <MapPin size={14} /> {selected.place}
              </p>
              <div className="detail-stats">
                <div className="detail-stat">
                  <small>Quantity</small><strong>{selected.quantity}</strong>
                </div>
                <div className="detail-stat">
                  <small>Indicative price</small><strong>{selected.price}</strong>
                </div>
                <div className="detail-stat">
                  <small>Route</small><strong>{selected.route}</strong>
                </div>
              </div>
              <p className="state-body">
                This listing is shown with a connected market context so buyers
                can understand the supply before making an inquiry.
              </p>
              <div className="detail-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => action("Buyer inquiry captured for the connected flow.")}
                >
                  Contact about this listing <ArrowRight size={15} />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => action("Listing saved for later in the connected flow.")}
                >
                  Save listing
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {toast && <div className="public-toast">{toast}</div>}
    </PublicLayout>
  );
}
