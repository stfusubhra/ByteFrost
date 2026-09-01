/* KisanSetu Field Ledger – core product dashboard.
 * This component now fetches real data from the backend:
 *   - Active listings for the logged-in farmer
 *   - Price recommendation for the selected listing
 *   - Buyer matching scores (real API)
 * The UI falls back to a friendly empty state when no data is available.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import LanguageSelector from "@/components/LanguageSelector";
import {
  fetchListings,
  fetchMatches,
  fetchPriceRecommendation,
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

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const listings = await fetchListings({ limit: 10 });
        const active = listings.find((l) => l.is_active);
        if (!active) {
          setError(t("dash.noListings"));
          return;
        }
        setListing(active);
        const price = await fetchPriceRecommendation(active.id);
        setPriceRec(price);
        const matchResults = await fetchMatches(active.id, 5);
        setMatches(matchResults);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError(t("dash.failed"));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated, t]);

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
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
              title={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
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
          <div className="dash-head">
            <div>
              <p className="eyebrow">{new Date().toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {t("dash.liveMarket")}</p>
              <h1>{t("dash.goodMorning")}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.</h1>
              <p className="state-body" style={{ marginTop: 6 }}>
                {t("dash.supplyNext")}
              </p>
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
                    {priceRec.recommended_price ? `₹${priceRec.recommended_price}/kg` : "—"}
                  </strong>
                  <span>/kg {t("dash.recPrice")}</span>
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

          {/* Live operations – placeholder for future order data */}
          <section className="dash-section">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">{t("dash.inMotion")}</span>
                <h2>{t("dash.liveOps")}</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => action("Operations view refreshed.")} aria-label="Refresh operations">
                <BarChart3 size={17} />
              </button>
            </div>
            <div className="card">
              <p className="state-body">{t("dash.noActiveShipments")}</p>
            </div>
          </section>

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
