/* KisanSetu Field Ledger direction: asymmetrical operations canvas, warm editorial surfaces, explainable intelligence embedded in the workflow. */
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudSun,
  FilePlus2,
  LayoutDashboard,
  MapPinned,
  Menu,
  PackageCheck,
  Search,
  Settings2,
  ShieldCheck,
  Sprout,
  Truck,
  UsersRound,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Marketplace", icon: Boxes },
  { label: "My listings", icon: Sprout },
  { label: "Orders", icon: PackageCheck },
  { label: "Routes", icon: MapPinned },
];

const matches = [
  { buyer: "GreenBasket Retail", location: "Bengaluru · 8.4 km", volume: "1,200 kg", price: "₹31/kg", match: "94%", tone: "high" },
  { buyer: "Sahaja Foods Co.", location: "Mysuru · 42 km", volume: "860 kg", price: "₹32/kg", match: "89%", tone: "mid" },
  { buyer: "Namma Kitchens", location: "Bengaluru · 12 km", volume: "540 kg", price: "₹33/kg", match: "84%", tone: "low" },
];

function SignalBars({ value, tone = "green" }: { value: number; tone?: string }) {
  return <div className={`signal-bars ${tone}`} aria-label={`${value}% match`}><span style={{ height: `${Math.max(28, value * 0.62)}%` }} /><span style={{ height: `${Math.max(35, value * 0.74)}%` }} /><span style={{ height: `${Math.max(45, value * 0.86)}%` }} /><span style={{ height: `${value}%` }} /></div>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const action = (message: string) => toast(message);

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <button className="btn btn-ghost btn-sm dash-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
        </div>
        <div className="dash-topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => action("You are all caught up.")} aria-label="Notifications"><Bell size={18} /></button>
          <div className="dash-avatar">RK</div>
        </div>
      </header>

      <div className="dash-body">
        <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="dash-nav-label">Workspace</div>
          <nav className="dash-nav" aria-label="Primary navigation">
            {navItems.map(({ label, icon: Icon }) => (
              <button key={label} className={`dash-nav-item ${activeNav === label ? "active" : ""}`} onClick={() => { setActiveNav(label); setSidebarOpen(false); }}>
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="dash-nav-label">Manage</div>
          <nav className="dash-nav" aria-label="Manage navigation">
            <button className="dash-nav-item" onClick={() => action("Team management is coming next.")}><UsersRound size={18} /><span>Team</span></button>
            <button className="dash-nav-item" onClick={() => action("Settings are ready for the next release.")}><Settings2 size={18} /><span>Settings</span></button>
          </nav>
          <div className="dash-sidebar-foot">
            <div className="season-note"><CloudSun size={18} /><div><strong>Rabi season</strong><span>Day 42 of 120</span></div></div>
            <div className="season-progress"><span /></div>
            <button className="text-link" onClick={() => action("Help is on the way.")}><CircleHelp size={16} /> Need a hand?</button>
          </div>
        </aside>

        <main className="dash-main">
          <div className="dash-head">
            <div>
              <p className="eyebrow">Thursday, 28 August 2026 · Live market</p>
              <h1>Good morning, Ravi.</h1>
              <p className="state-body" style={{ marginTop: 6 }}>Here’s where your supply can move next.</p>
            </div>
            <button className="btn btn-primary" onClick={() => action("Listing flow opened — intelligence will appear as you add produce.")}><FilePlus2 size={17} /> New listing</button>
          </div>

          {/* Market intelligence — first in the farmer hierarchy */}
          <section className="intel">
            <div className="card intel-card">
              <h3>Tomato · Grade A</h3>
              <div className="intel-current"><strong>₹31–34</strong><span>/kg recommended</span></div>
              <p className="intel-recommended">Current market <strong>₹28/kg</strong> · demand trending up</p>
              <div className="intel-factors">
                <span className="badge badge-primary">Demand high</span>
                <span className="badge badge-neutral">Supply limited</span>
                <span className="badge badge-neutral">7-day window</span>
              </div>
            </div>
            <div className="card intel-card">
              <h3>Onion · Grade B</h3>
              <div className="intel-current"><strong>₹18–21</strong><span>/kg recommended</span></div>
              <p className="intel-recommended">Current market <strong>₹16/kg</strong> · demand picking up</p>
              <div className="intel-factors">
                <span className="badge badge-primary">Demand +24%</span>
                <span className="badge badge-neutral">Harvest in 5 days</span>
              </div>
            </div>
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
            <div className="card">
              <div className="recommendation-top">
                <div className="crop-badge">TM</div>
                <div className="recommendation-title">
                  <div className="card-label">Recommended listing</div>
                  <h3>Tomatoes <span>· Grade A</span></h3>
                  <p>From Chikkaballapur · Harvest in 3 days</p>
                </div>
                <span className="badge badge-primary">High opportunity</span>
              </div>
              <div className="recommendation-metrics">
                <div><span>Available</span><strong>2,000 kg</strong></div>
                <div><span>Recommended price</span><strong>₹31–34/kg</strong></div>
                <div><span>Expected demand</span><strong>4,320 kg <em>↑ 18%</em></strong></div>
              </div>
              <div className="recommendation-bottom">
                <div className="reason-copy"><ShieldCheck size={16} /><span><b>Why this price?</b> Demand is trending upward and local supply is limited.</span><button className="why-button" onClick={() => setShowWhy(!showWhy)}>{showWhy ? "Hide" : "See why"}</button></div>
                <button className="btn btn-secondary" onClick={() => action("Tomato listing draft created.")}>Create listing <ArrowUpRight size={15} /></button>
              </div>
              {showWhy && (
                <div className="why-panel">
                  <div><strong>Demand trend</strong><span>High / rising</span></div>
                  <div><strong>Local supply</strong><span>Limited within 25 km</span></div>
                  <div><strong>Forecast window</strong><span>Next 7 days</span></div>
                  <div><strong>Current market</strong><span>₹28/kg</span></div>
                </div>
              )}
            </div>
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
              {matches.map((item) => (
                <div className="match-row" key={item.buyer}>
                  <div className="match-avatar">{item.buyer.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                  <div className="match-main"><strong>{item.buyer}</strong><span>{item.location}</span></div>
                  <div className="match-cell"><span>Needs</span><strong>{item.volume}</strong></div>
                  <div className="match-cell"><span>Offer</span><strong>{item.price}</strong></div>
                  <div className="match-score"><SignalBars value={Number(item.match.replace("%", ""))} tone={item.tone} /><strong>{item.match}</strong></div>
                  <button className="btn btn-ghost btn-sm" onClick={() => action(`${item.buyer} details opened.`)} aria-label={`Open ${item.buyer}`}><ArrowUpRight size={16} /></button>
                </div>
              ))}
              <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
                <button className="btn btn-secondary btn-block" onClick={() => action("Marketplace opened with 12 ranked matches.")}>Explore marketplace <ArrowUpRight size={15} /></button>
              </div>
            </div>
          </section>

          {/* Live operations */}
          <section className="dash-section">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">In motion</span>
                <h2>Live operations</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => action("Operations view refreshed.")} aria-label="Refresh operations"><BarChart3 size={17} /></button>
            </div>
            <div className="card">
              <div className="route-card-header">
                <div>
                  <div className="card-label">Order #KS-1048</div>
                  <h3>On the road to Bengaluru</h3>
                </div>
                <span className="badge badge-info">In transit</span>
              </div>
              <div className="route-meta">
                <div><span>Load</span><strong>700 kg tomatoes</strong></div>
                <div><span>ETA</span><strong>Today, 4:20 PM</strong></div>
              </div>
              <button className="btn btn-secondary btn-block" onClick={() => action("Shipment tracking opened.")}>Track shipment <MapPinned size={15} /></button>
            </div>
          </section>

          <footer className="footer-note">
            <span><Sprout size={14} /> Built for the people who grow with the people who need.</span>
            <span>Demo data shown for illustration · Data updates every 15 min · <button className="text-link" onClick={() => action("System status: all services operational.")}>System status</button></span>
          </footer>
        </main>
      </div>
    </div>
  );
}
