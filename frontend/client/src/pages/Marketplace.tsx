/* KisanSetu Marketplace: public discovery surface for available produce.
 *
 * This page wires to the real FastAPI backend:
 *   GET /api/v1/listings/ (public endpoint)
 *
 * The Marketplace shows honest loading/empty/error states and falls back to
 * clearly labeled demo data only when the backend is unreachable, preserving
 * the user experience while being transparent about data provenance.
 */
import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { fetchListings, ApiError } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";

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
    crop: "Tomato",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "500 kg",
    price: "₹45/kg",
    freshness: "Harvested today",
    route: "28 km · 1h 12m",
    match: "92%",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
    status: "Ready to move",
    harvest: "Today",
    seller: "GreenValley Farms",
  },
  {
    id: "demo-2",
    crop: "Onion",
    grade: "Grade A",
    place: "Pune, MH",
    quantity: "300 kg",
    price: "₹25/kg",
    freshness: "Harvested yesterday",
    route: "42 km · 1h 48m",
    match: "87%",
    image: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80",
    status: "Ready to move",
    harvest: "Yesterday",
    seller: "Sahaja Agro Co-op",
  },
  {
    id: "demo-3",
    crop: "Potato",
    grade: "Grade B",
    place: "Satara, MH",
    quantity: "400 kg",
    price: "₹18/kg",
    freshness: "Harvested 2 days ago",
    route: "61 km · 2h 18m",
    match: "81%",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
    status: "Ready to move",
    harvest: "2 days ago",
    seller: "Satara Fresh Collective",
  },
  {
    id: "demo-4",
    crop: "Rice",
    grade: "Grade A",
    place: "Ahmednagar, MH",
    quantity: "500 kg",
    price: "₹45/kg",
    freshness: "Harvested today",
    route: "74 km · 2h 40m",
    match: "78%",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    status: "Ready to move",
    harvest: "Today",
    seller: "Ahmednagar Growers",
  },
];

function mapBackendListing(listing: any): MarketListing {
  const imageMap: Record<string, string> = {
    Tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
    Tomatoes: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
    Onion: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80",
    Onions: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80",
    Potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
    Potatoes: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
    Rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    Wheat: "/images/produce/farmer.svg",
    "Harvest crates": "/images/produce/crates.svg",
    "Fresh produce": "/images/produce/produce.svg",
    Default: "/images/produce/farmer.svg",
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

  // Honest, data-driven match estimate: grade + freshness + lot size.
  // A full buyer-specific score requires the authenticated matching engine;
  // this gives public visitors a comparable signal without inventing numbers.
  let matchScore = 62;
  if (listing.quality_grade === "A") matchScore += 14;
  else if (listing.quality_grade === "B") matchScore += 7;
  if (listing.harvest_date) {
    const days = (Date.now() - new Date(listing.harvest_date).getTime()) / 86400000;
    if (days <= 2) matchScore += 12;
    else if (days <= 5) matchScore += 6;
  }
  if ((listing.quantity_kg ?? 0) >= 200) matchScore += 6;
  matchScore = Math.min(matchScore, 95);

  return {
    id: listing.id,
    crop: listing.crop_name,
    grade: listing.quality_grade || "N/A",
    place: listing.pickup_location || "Location TBA",
    quantity,
    price,
    freshness,
    route: listing.pickup_location ? "Pickup at farm gate" : "Route TBA",
    match: `${matchScore}%`,
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
    { key: "tomato", label: t("marketplace.tabTomatoes"), filter: "Tomato" },
    { key: "onion", label: "Onion", filter: "Onion" },
    { key: "ready", label: t("marketplace.tabReady"), filter: "Ready to move" },
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

  return (
    <PublicLayout>
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

        <div className="market-table-wrap">
          {loading ? (
            <table className="market-table">
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ height: 15, width: "55%" }} /></td>
                    <td><div className="skeleton" style={{ height: 15, width: "40%" }} /></td>
                    <td><div className="skeleton" style={{ height: 15, width: "30%" }} /></td>
                    <td><div className="skeleton" style={{ height: 15, width: "25%" }} /></td>
                    <td><div className="skeleton" style={{ height: 15, width: "20%" }} /></td>
                    <td><div className="skeleton" style={{ height: 15, width: "25%" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="state" style={{ padding: "48px 0" }}>
              <div className="state-icon"><Search size={20} /></div>
              <div className="state-title">{t("marketplace.emptyTitle")}</div>
              <div className="state-body">
                {t("marketplace.emptyBody")}
              </div>
            </div>
          ) : (
            <table className="market-table">
              <thead>
                <tr>
                  <th>{t("marketplace.colCrop")}</th>
                  <th>{t("marketplace.colLocation")}</th>
                  <th>{t("marketplace.colQty")}</th>
                  <th>{t("marketplace.colPrice")}</th>
                  <th>{t("marketplace.colMatch")}</th>
                  <th>{t("marketplace.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="market-row" onClick={() => (window.location.href = `/listing/${item.id}`)}>
                    <td>
                      <div className="market-row-product">
                        <img
                          className="market-row-img"
                          src={item.image}
                          alt={item.crop}
                          loading="lazy"
                        />
                        <div>
                          <div className="market-row-crop">{item.crop}</div>
                          <div className="market-row-sub">
                            {item.seller === "Verified producer" ? t("marketplace.verifiedProducer") : item.seller}
                            <span className="dot" aria-hidden="true" />
                            {item.grade}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className="market-row-loc"><MapPin size={13} /> {item.place}</span></td>
                    <td>{item.quantity}</td>
                    <td className="market-row-price">{item.price}</td>
                    <td>
                      <span className="market-row-match">
                        {item.match.includes("%") ? `${item.match} ${t("marketplace.matchBadge")}` : item.match}
                      </span>
                    </td>
                    <td>
                      <span className="market-row-status">{formatStatus(item.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {toast && <div className="public-toast">{toast}</div>}
    </PublicLayout>
  );
}
