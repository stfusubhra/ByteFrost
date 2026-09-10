/* KisanSetu Field Ledger – core product dashboard.
 * This component now fetches real data from the backend:
 *   - Active listings for the logged-in farmer
 *   - Price recommendation for the selected listing
 *   - Buyer matching scores (real API)
 * The UI falls back to a friendly empty state when no data is available.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleHelp,
  CloudSun,
  FilePlus2,
  LayoutDashboard,
  MapPinned,
  Menu,
  PackageCheck,
  Settings2,
  ShieldCheck,
  Sprout,
  UsersRound,
  Sun,
  Moon,
  Truck,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import LanguageSelector from "@/components/LanguageSelector";
import RouteMap from "@/components/RouteMap";
import TrackingTimeline from "@/components/TrackingTimeline";
import {
  fetchListings,
  fetchMatches,
  fetchPriceRecommendation,
  fetchShipments,
  fetchShipment,
  fetchTracking,
  fetchIncomingOrders,
  Listing,
  OrderResponse,
  ShipmentItem,
  ShipmentDetailItem,
  TrackingStatusData,
  ApiError,
} from "@/lib/api";

function SignalBars({ value, tone = "green" }: { value: number; tone?: string }) {
  return (
    <div className={`signal-bars ${tone}`} aria-label={`${value}% match`}>
      <span style={{ height: `${Math.max(28, value * 0.62)}%` }} />
      <span style={{ height: `${Math.max(35, value * 0.74)}%` }} />
      <span style={{ height: `${Math.max(45, value * 0.86)}%` }} />
      <span style={{ height: `${value}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { t, lang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [listing, setListing] = useState(null as any);
  const [priceRec, setPriceRec] = useState(null as any);
  const [matches, setMatches] = useState<Array<any>>([]);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDetailItem | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingStatusData | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navItems = [
    { id: "overview", label: t("dash.overview"), icon: LayoutDashboard },
    { id: "marketplace", label: t("dash.marketplace"), icon: Boxes },
    { id: "mylistings", label: t("dash.myListings"), icon: Sprout },
    { id: "orders", label: t("dash.orders"), icon: PackageCheck },
    { id: "routes", label: t("dash.routes"), icon: MapPinned },
  ];

  const activeNavLabel = navItems.find((n) => n.id === activeNav)?.label || t("dash.overview");

  const action = (msg: string) => toast(msg);

  const loadShipmentDetail = async (id: string) => {
    setShipmentLoading(true);
    try {
      const detail = await fetchShipment(id);
      setSelectedShipment(detail);
      const tracking = await fetchTracking(id);
      setTrackingData(tracking);
    } catch (err) {
      console.error("Failed to load shipment detail", err);
    } finally {
      setShipmentLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      // Show demo data for screenshots when not authenticated
      setListing({
        id: "demo",
        crop_name: "Tomato",
        variety: "Cherry",
        quantity_kg: 500,
        quality_grade: "A",
        price_per_kg: 45,
        pickup_location: "Village Vinchur, Nashik, MH",
        is_active: true,
      });
      setPriceRec({
        recommended_price: 42,
        confidence: 0.87,
        factors: ["comparable_active_listings", "crop_market"],
      });
      setMatches([
        { buyer_id: "priya01", score: 0.92, explanation: { quantity_fit: 0.95, price_score: 0.88, distance_score: 0.90, reliability: 0.95, distance_km: 28, order_history: 12 } },
        { buyer_id: "amit02", score: 0.85, explanation: { quantity_fit: 0.80, price_score: 0.82, distance_score: 0.75, reliability: 0.90, distance_km: 42, order_history: 8 } },
        { buyer_id: "neha03", score: 0.78, explanation: { quantity_fit: 0.70, price_score: 0.85, distance_score: 0.65, reliability: 0.85, distance_km: 61, order_history: 5 } },
      ]);
      setLoading(false);
      return;
    }
    try {
      const listings = await fetchListings({ limit: 10 });
      const active = listings.find((l) => l.is_active);
      if (active) {
        setListing(active);
        try {
          const price = await fetchPriceRecommendation(active.id);
          setPriceRec(price);
        } catch {
          // Price recommendation optional
        }
        try {
          const matchResults = await fetchMatches(active.id, 5);
          setMatches(matchResults);
        } catch {
          // Match results optional
        }
      }

      // Fetch real logistics shipments
      try {
        const shipList = await fetchShipments({ limit: 10 });
        setShipments(shipList);
        if (shipList.length > 0) {
          await loadShipmentDetail(shipList[0].id);
        }
      } catch {
        // Shipments optional
      }

      // All active listings (Marketplace section)
      try {
        const all = await fetchListings({ limit: 50 });
        setAllListings(all);
      } catch {
        // Listings optional
      }

      // Incoming orders — orders containing this farmer's listings
      try {
        const orders = await fetchIncomingOrders({ limit: 20 });
        setIncomingOrders(orders);
      } catch {
        // Orders optional
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(t("dash.failed"));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="dash-shell">
        <div className="dash-body">
          <p className="state">{t("dash.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-shell">
        <div className="dash-body">
          <div className="card" style={{ padding: 20, borderColor: "var(--error)" }}>
            <p className="state-body" style={{ color: "var(--error)" }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const shortBuyerId = (id: string) => id.slice(0, 6) + "…";

  const dateLocale = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-BD" : "en-US";

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <Link
            href="/"
            className="btn btn-ghost btn-sm dash-back-link"
            aria-label={t("dash.backToSite")}
            title={t("dash.backToSite")}
          >
            <ArrowLeft size={16} />
            <span>{t("dash.backToSite")}</span>
          </Link>
          <button
            className="btn btn-ghost btn-sm dash-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("common.openMenu")}
          >
            <Menu size={18} />
          </button>
          <div className="breadcrumb">
            <span>{t("dash.workspace")}</span>
            <ChevronRight size={14} />
            <strong>{activeNavLabel}</strong>
          </div>
        </div>
        <div className="dash-topbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LanguageSelector variant="dark" />
{toggleTheme && (
                {/* theme toggle removed */}
              )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => action(t("dash.dataUpdates"))}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <div className="dash-avatar">
            {user?.full_name?.[0] ?? user?.email?.[0] ?? "U"}
          </div>
        </div>
      </header>

      <div className="dash-body">
        {sidebarOpen && (
          <div
            className="dash-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="dash-nav-label">{t("dash.workspace")}</div>
          <nav className="dash-nav" aria-label="Primary navigation">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`dash-nav-item ${activeNav === id ? "active" : ""}`}
                onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="dash-nav-label">{t("dash.manage")}</div>
          <nav className="dash-nav" aria-label="Manage navigation">
            <button className="dash-nav-item" onClick={() => action("Team management is coming next.")}>
              <UsersRound size={18} />
              <span>{t("dash.team")}</span>
            </button>
            <button className="dash-nav-item" onClick={() => action("Settings are ready for the next release.")}>
              <Settings2 size={18} />
              <span>{t("dash.settings")}</span>
            </button>
          </nav>
          <div className="dash-sidebar-foot">
            <div className="season-note">
              <CloudSun size={18} />
              <div>
                <strong>{t("dash.rabiSeason")}</strong>
                <span>{t("dash.seasonDay")}</span>
              </div>
            </div>
            <div className="season-progress"><span /></div>
            <button className="text-link" onClick={() => action("Help is on the way.")}>
              <CircleHelp size={16} /> {t("dash.needHand")}
            </button>
          </div>
        </aside>

        <main className="dash-main">
          {activeNav === "routes" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.inMotion")} · Google OR-Tools VRP Optimization</p>
                  <h1>{t("dash.routesTitle")}</h1>
                  <p className="state-body" style={{ marginTop: 6 }}>
                    {t("dash.routesSub")}
                  </p>
                </div>
                {selectedShipment?.maps_url && (
                  <a
                    href={selectedShipment.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    <Navigation size={17} />
                    <span>{t("dash.openGps")}</span>
                  </a>
                )}
              </div>

              {/* Shipment selector tabs */}
              {shipments.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                    <span className="text-xs font-semibold text-muted-foreground mr-2">{t("dash.shipments")}</span>
                    {shipments.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => loadShipmentDetail(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          selectedShipment?.id === s.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t("dash.shipment")} #{idx + 1} ({s.status})</span>
                      </button>
                    ))}
                  </div>

                  {shipmentLoading ? (
                    <div className="p-8 text-center text-muted-foreground">{t("dash.loadingRoute")}</div>
                  ) : selectedShipment ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2 space-y-6">
                        <RouteMap
                          stops={selectedShipment.stops || []}
                          vehicle={selectedShipment.vehicle}
                          distanceKm={selectedShipment.estimated_distance_km}
                          durationMin={selectedShipment.estimated_duration_min}
                          routeMode={selectedShipment.route_mode || "direct"}
                          mapsUrl={selectedShipment.maps_url}
                        />
                      </div>
                      <div className="space-y-6">
                        <TrackingTimeline
                          shipmentId={selectedShipment.id}
                          currentStatus={selectedShipment.status}
                          events={trackingData?.events || []}
                          estimatedArrival={trackingData?.estimated_arrival || selectedShipment.delivery_time}
                          currentLat={trackingData?.current_latitude}
                          currentLng={trackingData?.current_longitude}
                          onRefresh={() => loadShipmentDetail(selectedShipment.id)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="card p-6 text-center text-muted-foreground">
                      {t("dash.selectShipment")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <Truck className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.noRoutes")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.noRoutesBody")}
                  </p>
                </div>
              )}
            </div>
          ) : activeNav === "marketplace" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.liveMarket")}</p>
                  <h1>{t("dash.marketplace")}</h1>
                  <p className="state-body" style={{ marginTop: 6 }}>
                    {t("dash.marketplaceSub")}
                  </p>
                </div>
                <Link href="/marketplace" className="btn btn-primary inline-flex items-center gap-2">
                  <ArrowUpRight size={17} /> {t("dash.openMarketplace")}
                </Link>
              </div>

              {allListings.length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>{t("dash.colCrop")}</th>
                          <th>{t("dash.colQty")}</th>
                          <th>{t("dash.colPrice")}</th>
                          <th>{t("dash.colGrade")}</th>
                          <th>{t("dash.colLocation")}</th>
                          <th className="text-right">{t("dash.colStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allListings.map((l) => (
                          <tr key={l.id}>
                            <td className="font-medium">
                              {l.crop_name}
                              {l.variety ? ` · ${l.variety}` : ""}
                            </td>
                            <td>{l.quantity_kg} kg</td>
                            <td>{l.price_per_kg ? `₹${l.price_per_kg}/kg` : "—"}</td>
                            <td>{l.quality_grade ?? "—"}</td>
                            <td>{l.pickup_location ?? "—"}</td>
                            <td className="text-right">
                              <Link href={`/listing/${l.id}`} className="text-link inline-flex items-center gap-1">
                                {t("dash.viewListing")} <ArrowUpRight size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <Boxes className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.emptyMarketplace")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.emptyMarketplaceBody")}
                  </p>
                </div>
              )}
            </div>
          ) : activeNav === "mylistings" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.liveMarket")}</p>
                  <h1>{t("dash.myListings")}</h1>
                  <p className="state-body" style={{ marginTop: 6 }}>
                    {t("dash.myListingsSub")}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => action("Listing flow opened — intelligence will appear as you add produce.")}>
                  <FilePlus2 size={17} /> {t("dash.createListing")}
                </button>
              </div>

              {allListings.filter((l) => l.seller_id === user?.id).length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>{t("dash.colCrop")}</th>
                          <th>{t("dash.colQty")}</th>
                          <th>{t("dash.colPrice")}</th>
                          <th>{t("dash.colGrade")}</th>
                          <th>{t("dash.colLocation")}</th>
                          <th className="text-right">{t("dash.colStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allListings
                          .filter((l) => l.seller_id === user?.id)
                          .map((l) => (
                            <tr key={l.id}>
                              <td className="font-medium">
                                {l.crop_name}
                                {l.variety ? ` · ${l.variety}` : ""}
                              </td>
                              <td>{l.quantity_kg} kg</td>
                              <td>{l.price_per_kg ? `₹${l.price_per_kg}/kg` : "—"}</td>
                              <td>{l.quality_grade ?? "—"}</td>
                              <td>{l.pickup_location ?? "—"}</td>
                              <td className="text-right">
                                <span className={`badge ${l.is_active ? "badge-primary" : "badge-neutral"}`}>
                                  {l.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <Sprout className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.emptyListings")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.emptyListingsBody")}
                  </p>
                </div>
              )}
            </div>
          ) : activeNav === "orders" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.liveMarket")}</p>
                  <h1>{t("dash.orders")}</h1>
                  <p className="state-body" style={{ marginTop: 6 }}>
                    {t("dash.ordersSub")}
                  </p>
                </div>
              </div>

              {incomingOrders.length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>{t("dash.colOrder")}</th>
                          <th>{t("dash.colStatus")}</th>
                          <th>{t("dash.colItems")}</th>
                          <th>{t("dash.colTotal")}</th>
                          <th>{t("dash.colPlaced")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomingOrders.map((o) => (
                          <tr key={o.id}>
                            <td className="font-mono text-xs">#{o.id.slice(0, 8)}</td>
                            <td>
                              <span className={`badge ${o.status === "PENDING" ? "badge-warning" : "badge-primary"}`}>
                                {o.status}
                              </span>
                            </td>
                            <td>
                              {o.items.map((i) => `${i.quantity_kg} kg`).join(", ")}
                            </td>
                            <td>{o.total_amount != null ? `₹${o.total_amount.toFixed(2)}` : "—"}</td>
                            <td>{new Date(o.created_at).toLocaleDateString(dateLocale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <PackageCheck className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.noOrders")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.noOrdersBody")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{new Date().toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {t("dash.liveMarket")}</p>
                  <h1>{t("dash.goodMorning")}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.</h1>
                  <p className="state-body" style={{ marginTop: 6 }}>
                    {t("dash.supplyNext")}
                  </p>
                  {!isAuthenticated && (
                    <span className="badge badge-warning" style={{ marginTop: 8, display: "inline-block" }}>Demo Data — Sign in for real data</span>
                  )}
                </div>
                <button className="btn btn-primary" onClick={() => action("Listing flow opened — intelligence will appear as you add produce.")}>
                  <FilePlus2 size={17} /> {t("dash.newListing")}
                </button>
              </div>

              {/* Market intelligence – price recommendation */}
              <section className="intel">
                {priceRec ? (
                  <div className="card intel-card">
                    <h3>{listing?.crop_name ?? "Crop"} · {listing?.variety ?? ""}</h3>
                    <div className="intel-current">
                      <strong>
                        {priceRec.recommended_price ? `₹${priceRec.recommended_price.toFixed(2)}` : "—"}
                      </strong>
                      <span>{t("dash.recPrice")}</span>
                    </div>
                    <p className="intel-recommended">
                      {priceRec.factors?.length ? `${t("dash.basedOn")} ${priceRec.factors.join(", ")}.` : t("dash.priceBand")}
                    </p>
                    <div className="intel-factors">
                      <span className="badge badge-primary">{t("dash.confidence")} {priceRec.confidence ?? "?"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="card intel-card">
                    <p>{t("dash.noPriceRec")}</p>
                  </div>
                )}
              </section>

              {/* Recommended listing */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.decisionLayer")}</span>
                    <h2>{t("dash.whatMove")}</h2>
                  </div>
                  <button className="text-link" onClick={() => action("All opportunities are already ranked by fit.")}>{t("dash.viewAll")} <ArrowUpRight size={15} /></button>
                </div>
                {listing && (
                  <div className="card">
                    <div className="recommendation-top">
                      <div className="crop-badge">{listing.crop_name?.[0] ?? "C"}</div>
                      <div className="recommendation-title">
                        <div className="card-label">{t("dash.recListing")}</div>
                        <h3>{listing.crop_name} <span>· {listing.quality_grade ?? ""}</span></h3>
                        <p>{listing.pickup_location ?? t("marketplace.locationTBA")}</p>
                      </div>
                      <span className="badge badge-primary">{t("dash.highOpp")}</span>
                    </div>
                    <div className="recommendation-metrics">
                      <div><span>{t("dash.available")}</span><strong>{listing.quantity_kg} kg</strong></div>
                      <div><span>{t("dash.recommendedPrice")}</span><strong>{priceRec?.recommended_price ? `₹${priceRec.recommended_price}/kg` : "—"}</strong></div>
                    </div>
                    <div className="recommendation-bottom">
                      <div className="reason-copy">
                        <ShieldCheck size={16} />
                        <span><b>{t("dash.whyPrice")}</b> {t("dash.whyPriceDesc")}</span>
                        <button className="why-button" onClick={() => setShowWhy(!showWhy)}>
                          {showWhy ? t("dash.hide") : t("dash.seeWhy")}
                        </button>
                      </div>
                    </div>
                    {showWhy && (
                      <div className="why-panel">
                        <div><strong>{t("dash.confidence")}</strong><span>{priceRec?.confidence ?? "?"}</span></div>
                        <div><strong>{t("dash.factors")}</strong><span>{priceRec?.factors?.join(", ") ?? "—"}</span></div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Buyer matching */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.buyerMatching")}</span>
                    <h2>{t("dash.bestMatches")}</h2>
                  </div>
                  <button className="text-link" onClick={() => action("Matching preferences opened.")}>{t("dash.tuneMatching")} <Settings2 size={14} /></button>
                </div>
                <div className="card">
                  {matches.map((m) => (
                    <div className="match-row" key={m.buyer_id}>
                      <div className="match-avatar">{shortBuyerId(m.buyer_id)}</div>
                      <div className="match-main"><strong>{shortBuyerId(m.buyer_id)}</strong><span>{m.explanation?.distance_km ? `${m.explanation.distance_km} km` : ""}</span></div>
                      <div className="match-cell"><span>{t("dash.score")}</span><strong>{Math.round(m.score * 100)}%</strong></div>
                      <div className="match-score">
                        <SignalBars value={Math.round(m.score * 100)} tone="green" />
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => action(`Match ${shortBuyerId(m.buyer_id)} opened.`)} aria-label={`Open match ${shortBuyerId(m.buyer_id)}`}>
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ))}
                  <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
                    <button className="btn btn-secondary btn-block" onClick={() => action("Marketplace opened with matches.")}>
                      {t("dash.exploreMarketplace")} <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              </section>

              {/* Live operations – real shipment status */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.inMotion")}</span>
                    <h2>{t("dash.liveOps")}</h2>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { loadData(); action("Operations refreshed."); }} aria-label="Refresh operations">
                    <BarChart3 size={17} />
                  </button>
                </div>
                {shipments.length > 0 ? (
                  <div className="card p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <Truck size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {t("dash.activeShipment")} ({shipments[0].route_mode?.toUpperCase() || "DIRECT"})
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {shipments[0].estimated_distance_km ? t("dash.totalDistance").replace("{km}", String(shipments[0].estimated_distance_km)) : t("dash.routeDispatched")}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {shipments[0].status}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        className="btn btn-secondary btn-sm flex items-center gap-1.5"
                        onClick={() => setActiveNav("routes")}
                      >
                        <span>{t("dash.viewRoute")}</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <p className="state-body">{t("dash.noActiveShipments")}</p>
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="footer-note">
            <span><Sprout size={14} /> {t("dash.footerBuilt")}</span>
            <span>
              {t("dash.dataUpdates")} <button className="text-link" onClick={() => action("System status: all services operational.")}>{t("dash.systemStatus")}</button>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
