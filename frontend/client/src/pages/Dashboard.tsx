/* KisanSetu Field Ledger – core product dashboard.
 * This component now fetches real data from the backend:
 *   - Active listings for the logged-in farmer
 *   - Price recommendation for the selected listing
 *   - Buyer matching scores (real API)
 *   - (Live operations placeholder – can be extended with orders endpoint)
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
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchListings,
  fetchMatches,
  fetchPriceRecommendation,
  ApiError,
} from "@/lib/api";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Marketplace", icon: Boxes },
  { label: "My listings", icon: Sprout },
  { label: "Orders", icon: PackageCheck },
  { label: "Routes", icon: MapPinned },
];

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
  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [listing, setListing] = useState(null as any);
  const [priceRec, setPriceRec] = useState(null as any);
  const [matches, setMatches] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const action = (msg: string) => toast(msg);

  // Load dashboard data when authenticated
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        // 1️⃣ Get active listings (default limit 10)
        const listings = await fetchListings({ limit: 10 });
        const active = listings.find((l) => l.is_active);
        if (!active) {
          setError("No active listings found. Create a listing first.");
          return;
        }
        setListing(active);
        // 2️⃣ Price recommendation for the selected listing
        const price = await fetchPriceRecommendation(active.id);
        setPriceRec(price);
        // 3️⃣ Buyer matches (max 5)
        const matchResults = await fetchMatches(active.id, 5);
        setMatches(matchResults);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="dash-shell">
        <div className="dash-body">
          <p className="state">Loading dashboard…</p>
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

  // Helper to format buyer id for display (shortened)
  const shortBuyerId = (id: string) => id.slice(0, 6) + "…";

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <button
            className="btn btn-ghost btn-sm dash-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{activeNav}</strong>
          </div>
        </div>
        <div className="dash-topbar-right">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => action("You are all caught up.")}
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
        <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="dash-nav-label">Workspace</div>
          <nav className="dash-nav" aria-label="Primary navigation">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={`dash-nav-item ${activeNav === label ? "active" : ""}`}
                onClick={() => { setActiveNav(label); setSidebarOpen(false); }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="dash-nav-label">Manage</div>
          <nav className="dash-nav" aria-label="Manage navigation">
            <button className="dash-nav-item" onClick={() => action("Team management is coming next.")}>
              <UsersRound size={18} />
              <span>Team</span>
            </button>
            <button className="dash-nav-item" onClick={() => action("Settings are ready for the next release.")}>
              <Settings2 size={18} />
              <span>Settings</span>
            </button>
          </nav>
          <div className="dash-sidebar-foot">
            <div className="season-note">
              <CloudSun size={18} />
              <div>
                <strong>Rabi season</strong>
                <span>Day 42 of 120</span>
              </div>
            </div>
            <div className="season-progress"><span /></div>
            <button className="text-link" onClick={() => action("Help is on the way.")}>
              <CircleHelp size={16} /> Need a hand?
            </button>
          </div>
        </aside>

        <main className="dash-main">
          <div className="dash-head">
            <div>
              <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · Live market</p>
              <h1>Good morning{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.</h1>
              <p className="state-body" style={{ marginTop: 6 }}>
                Here’s where your supply can move next.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => action("Listing flow opened — intelligence will appear as you add produce.")}>
              <FilePlus2 size={17} /> New listing
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
                  <span>/kg recommended</span>
                </div>
                <p className="intel-recommended">
                  {priceRec.factors?.length ? `Based on ${priceRec.factors.join(", ")}.` : "Price band calculated from market data."}
                </p>
                <div className="intel-factors">
                  <span className="badge badge-primary">Confidence {priceRec.confidence ?? "?"}</span>
                </div>
              </div>
            ) : (
              <div className="card intel-card">
                <p>No price recommendation available.</p>
              </div>
            )}
          </section>

          {/* Recommended listing */}
          <section className="dash-section">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">Decision layer</span>
                <h2>What should move next?</h2>
              </div>
              <button className="text-link" onClick={() => action("All opportunities are already ranked by fit.")}>View all <ArrowUpRight size={15} /></button>
            </div>
            {listing && (
              <div className="card">
                <div className="recommendation-top">
                  <div className="crop-badge">{listing.crop_name?.[0] ?? "C"}</div>
                  <div className="recommendation-title">
                    <div className="card-label">Recommended listing</div>
                    <h3>{listing.crop_name} <span>· {listing.quality_grade ?? ""}</span></h3>
                    <p>{listing.pickup_location ?? "Location TBA"}</p>
                  </div>
                  <span className="badge badge-primary">High opportunity</span>
                </div>
                <div className="recommendation-metrics">
                  <div><span>Available</span><strong>{listing.quantity_kg} kg</strong></div>
                  <div><span>Recommended price</span><strong>{priceRec?.recommended_price ? `₹${priceRec.recommended_price}/kg` : "—"}</strong></div>
                </div>
                <div className="recommendation-bottom">
                  <div className="reason-copy">
                    <ShieldCheck size={16} />
                    <span><b>Why this price?</b> Real‑time market data informs the band.</span>
                    <button className="why-button" onClick={() => setShowWhy(!showWhy)}>
                      {showWhy ? "Hide" : "See why"}
                    </button>
                  </div>
                </div>
                {showWhy && (
                  <div className="why-panel">
                    <div><strong>Confidence</strong><span>{priceRec?.confidence ?? "?"}</span></div>
                    <div><strong>Factors</strong><span>{priceRec?.factors?.join(", ") ?? "—"}</span></div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Buyer matching */}
          <section className="dash-section">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">Buyer matching</span>
                <h2>Best matches for your supply</h2>
              </div>
              <button className="text-link" onClick={() => action("Matching preferences opened.")}>Tune matching <Settings2 size={14} /></button>
            </div>
            <div className="card">
              {matches.map((m) => (
                <div className="match-row" key={m.buyer_id}>
                  <div className="match-avatar">{shortBuyerId(m.buyer_id)}</div>
                  <div className="match-main"><strong>{shortBuyerId(m.buyer_id)}</strong><span>{m.explanation?.distance_km ? `${m.explanation.distance_km} km` : ""}</span></div>
                  <div className="match-cell"><span>Score</span><strong>{Math.round(m.score * 100)}%</strong></div>
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
                  Explore marketplace <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </section>

          {/* Live operations – placeholder for future order data */}
          <section className="dash-section">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">In motion</span>
                <h2>Live operations</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => action("Operations view refreshed.")} aria-label="Refresh operations">
                <BarChart3 size={17} />
              </button>
            </div>
            <div className="card">
              <p className="state-body">No active shipments at the moment.</p>
            </div>
          </section>

          <footer className="footer-note">
            <span><Sprout size={14} /> Built for the people who grow with the people who need.</span>
            <span>
              Data updates on demand. <button className="text-link" onClick={() => action("System status: all services operational.")}>System status</button>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
