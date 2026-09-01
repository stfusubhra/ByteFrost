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
import { ArrowRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { fetchListings, ApiError } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";

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
 */
type MarketListing = {
  id: string;
  crop: string;
  grade: string;
  place: string;
  quantity: string;
  price: string;
  freshness: string;
  route: string;
  match: string;
  image: string;
  status: string;
  harvest: string;
  seller: string;
};

/**
 * Fallback demo data used ONLY when the backend is unreachable.
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
    seller: "GreenValley Farms",
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
    seller: "Sahaja Agro Co-op",
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
    seller: "Satara Fresh Collective",
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
    seller: "Ahmednagar Growers",
  },
];

function mapBackendListing(listing: any): MarketListing {
  const imageMap: Record<string, string> = {
    Tomatoes: "/manus-storage/kisan-story-tomatoes_128fdb50.jpg",
    "Harvest crates": "/manus-storage/kisan-story-crates_8ebf1895.jpg",
    "Fresh produce": "/manus-storage/kisan-story-waiting_e345d9da.jpg",
    Default: "/manus-storage/kisan-story-farmer_581c0db7.jpg",
  };
  const image = imageMap[listing.crop_name] || imageMap.Default;

  const quantity =
    listing.quantity_kg !== null && listing.quantity_kg !== undefined
      ? `${listing.quantity_kg.toLocaleString()} kg`
      : "Quantity TBA";

  const price =
    listing.price_per_kg !== null && listing.price_per_kg !== undefined
      ? `₹${listing.price_per_kg.toFixed(2)}/kg`
      : "Price on request";

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
    route: "Route TBA",
    match: "Match TBA",
    image,
    status: listing.is_active ? "Ready to move" : "Inactive",
    harvest: listing.harvest_date || "Harvest date TBA",
    seller: listing.farm_name || listing.producer_name || "Verified producer",
  };
}

export default function Marketplace() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTabKey, setActiveTabKey] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState("");

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const backendListings = await fetchListings({
          crop_name: debouncedQuery || undefined,
          limit: 20,
        });

        if (isMounted) {
          setListings(backendListings.map(mapBackendListing));
          setUsingDemoData(false);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (isMounted) {
            setListings(DEMO_LISTINGS);
            setUsingDemoData(true);
            setError(
              `${t("marketplace.demoNotice")}: ${err.message} (${err.status})`
            );
          }
        } else {
          if (isMounted) {
            setListings([]);
            setError(t("marketplace.backendError"));
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
  }, [debouncedQuery, t]);

  const tabs = [
    { key: "all", label: t("marketplace.tabAll") },
    { key: "tomatoes", label: t("marketplace.tabTomatoes"), filter: "Tomatoes" },
    { key: "ready", label: t("marketplace.tabReady"), filter: "Ready to move" },
    { key: "matched", label: t("marketplace.tabMatched"), filter: "Matched supply" },
    { key: "awaiting", label: t("marketplace.tabAwaiting"), filter: "Awaiting buyer" },
  ];

  const currentTab = tabs.find((x) => x.key === activeTabKey) || tabs[0];

  const filtered = listings
    .filter((item) => {
      const text = `${item.crop} ${item.place} ${item.grade}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesTab =
        !currentTab.filter ||
        item.crop === currentTab.filter ||
        item.status === currentTab.filter;
      return matchesQuery && matchesTab;
    })
    .sort((a, b) => {
      if (sortKey === "closest") {
        return a.route.localeCompare(b.route);
      }
      if (sortKey === "highest") {
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

  const formatStatus = (st: string) => {
    if (st === "Ready to move") return t("marketplace.tabReady");
    if (st === "Matched supply") return t("marketplace.tabMatched");
    if (st === "Awaiting buyer") return t("marketplace.tabAwaiting");
    if (st === "Inactive") return t("listing.inactive");
    return st;
  };

  const formatFreshness = (f: string) => {
    if (f === "Harvested today") return t("marketplace.harvestedToday");
    if (f === "Harvested yesterday") return t("marketplace.harvestedYesterday");
    if (f === "Harvested 2 days ago") return t("marketplace.harvested2DaysAgo");
    if (f === "Harvested recently") return t("marketplace.harvestedRecently");
    if (f === "Freshness info TBA") return t("marketplace.freshnessTBA");
    return f;
  };

  return (
    <PublicLayout eyebrow={t("marketplace.eyebrow")}>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("nav.marketplace")}</span>
          <h1>{t("marketplace.h1")}</h1>
          <p>{t("marketplace.p")}</p>
          <div className="row" style={{ marginTop: 28 }}>
            <button
              className="btn btn-primary"
              onClick={() => action(t("marketplace.toastList"))}
            >
              {t("marketplace.listProduce")} <ArrowRight size={15} />
            </button>
            <Link className="btn btn-secondary" href="/market-match">
              {t("marketplace.findMatch")} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Data source notice */}
      {usingDemoData && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="badge badge-warning">
            {t("marketplace.demoNotice")}
          </div>
          <p className="state-body" style={{ marginTop: 8 }}>
            {error}
          </p>
        </div>
      )}
      {!usingDemoData && error && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="badge badge-error">{t("marketplace.backendError")}</div>
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
              placeholder={t("marketplace.searchPlaceholder")}
              aria-label={t("marketplace.searchAria")}
            />
          </div>
          <div className="market-toolbar-actions">
            <label className="row" style={{ gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              {t("marketplace.sortBy")}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                aria-label={t("marketplace.searchAria")}
              >
                <option value="recommended">{t("marketplace.sortRecommended")}</option>
                <option value="highest">{t("marketplace.sortMatch")}</option>
                <option value="closest">{t("marketplace.sortRoute")}</option>
              </select>
            </label>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={15} /> {t("marketplace.filters")}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="card" style={{ padding: 20, marginBottom: 8 }}>
            <div className="row-between">
              <span className="eyebrow">{t("marketplace.filters")}</span>
              <button
                className="text-link"
                onClick={() => {
                  setActiveTabKey("all");
                  setFiltersOpen(false);
                }}
              >
                {t("marketplace.resetFilters")}
              </button>
            </div>
            <p className="state-body" style={{ marginTop: 12 }}>
              {t("marketplace.filterSupplyDesc")}
            </p>
          </div>
        )}
      </section>

      {/* Content */}
      <section className="container">
        <div className="tabs" role="tablist" aria-label={t("marketplace.searchAria")}>
          {tabs.map((tab) => (
            <button
              className={activeTabKey === tab.key ? "active" : ""}
              key={tab.key}
              onClick={() => setActiveTabKey(tab.key)}
              role="tab"
              aria-selected={activeTabKey === tab.key}
            >
              {tab.label}
            </button>
          ))}
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
              <div className="state-title">{t("marketplace.emptyTitle")}</div>
              <div className="state-body">
                {t("marketplace.emptyBody")}
              </div>
            </div>
          ) : (
            filtered.map((item) => (
              <Link href={`/listing/${item.id}`} key={item.id}>
                <article
                  className="card market-card"
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  <div className="market-card-image">
                    <ListingImage
                      src={item.image}
                      alt={`${item.crop} listing`}
                      crop={item.crop}
                    />
                    <span className="badge badge-neutral" style={{ position: "absolute", top: 12, left: 12 }}>
                      {formatStatus(item.status)}
                    </span>
                  </div>
                  <div className="market-card-body">
                    <div className="market-card-top">
                      <h3>{item.crop}</h3>
                      <span className="badge badge-primary">
                        {item.match.includes("%") ? `${item.match} ${t("marketplace.matchBadge")}` : item.match}
                      </span>
                    </div>
                    <div className="market-card-meta">
                      <span className="market-card-seller">
                        <span className="seller-avatar">{item.seller.charAt(0)}</span>
                        {item.seller === "Verified producer" ? t("marketplace.verifiedProducer") : item.seller}
                      </span>
                      <span><MapPin size={12} /> {item.place}</span>
                      <span className="market-card-specs">
                        <b>{item.quantity}</b>
                        <span className="dot" aria-hidden="true" />
                        {item.grade}
                        <span className="dot" aria-hidden="true" />
                        {formatFreshness(item.freshness)}
                      </span>
                    </div>
                    <div className="market-card-bottom">
                      <span className="market-card-price">{item.price}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        aria-label={`${t("marketplace.contactAria")} ${item.crop}`}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
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
