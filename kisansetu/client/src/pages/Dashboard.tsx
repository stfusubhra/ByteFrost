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
  Compass,
  FilePlus2,
  LayoutDashboard,
  MapPinned,
  Menu,
  MoreHorizontal,
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
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><img src="/manus-storage/kisansetu-mark_d9c5b84c.png" alt="" /></div>
          <div><div className="brand-name">KisanSetu</div><div className="brand-caption">Market, made clearer.</div></div>
          <button className="icon-btn close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="workspace-switcher"><div className="avatar avatar-amber">RK</div><div><div className="workspace-name">Ravi Kumar</div><div className="workspace-role">Farmer account</div></div><MoreHorizontal size={16} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => { setActiveNav(label); setSidebarOpen(false); }}><Icon size={18} /><span>{label}</span>{label === "Marketplace" && <span className="nav-count">12</span>}</button>)}
        </nav>
        <div className="nav-label nav-label-spaced">MANAGE</div>
        <nav className="secondary-nav"><button className="nav-item" onClick={() => action("Team management is coming next.")}><UsersRound size={18} /><span>Team</span></button><button className="nav-item" onClick={() => action("Settings are ready for the next release.")}><Settings2 size={18} /><span>Settings</span></button></nav>
        <div className="sidebar-foot"><div className="season-note"><CloudSun size={18} /><div><strong>Rabi season</strong><span>Day 42 of 120</span></div></div><div className="season-progress"><span /></div><div className="help-link"><CircleHelp size={16} /> Need a hand?</div></div>
      </aside>

      <main className="main-canvas">
        <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div><div className="topbar-actions"><button className="icon-btn" onClick={() => action("You are all caught up.")} aria-label="Notifications"><Bell size={18} /><i /></button><div className="topbar-divider" /><button className="topbar-avatar">RK</button></div></header>

        <div className="content-wrap">
          <section className="welcome-row"><div><p className="eyebrow">THURSDAY, 28 AUGUST 2026 <span className="live-dot" /> LIVE MARKET</p><h1>Good morning, Ravi.</h1><p className="subhead">Here’s where your supply can move next.</p></div><button className="primary-button" onClick={() => action("Listing flow opened — intelligence will appear as you add produce.")}><FilePlus2 size={17} /> New listing</button></section>

          <section className="summary-strip"><div className="summary-cell"><span className="summary-label">AVAILABLE TO MOVE</span><strong>2,840 <small>kg</small></strong><span className="summary-trend positive"><ArrowUpRight size={13} /> 12.4% vs last week</span></div><div className="summary-cell"><span className="summary-label">EXPECTED EARNINGS</span><strong>₹88,040</strong><span className="summary-trend positive"><ArrowUpRight size={13} /> Based on live matches</span></div><div className="summary-cell"><span className="summary-label">ACTIVE ORDERS</span><strong>04</strong><span className="summary-trend neutral"><Clock3 size={13} /> 2 need attention</span></div><div className="summary-cell summary-signal"><span className="summary-label">MARKET SIGNAL</span><strong>Favorable</strong><div className="signal-meter"><span /><span /><span /><span /><span /></div></div></section>

          <section className="main-grid">
            <div className="primary-column">
              <div className="section-heading"><div><span className="section-kicker"><Zap size={14} /> DECISION LAYER</span><h2>What should move next?</h2></div><button className="text-button" onClick={() => action("All opportunities are already ranked by fit.")}>View all <ArrowUpRight size={15} /></button></div>
              <div className="recommendation-card"><div className="recommendation-top"><div className="crop-badge">TM</div><div className="recommendation-title"><div className="card-label">RECOMMENDED LISTING</div><h3>Tomatoes <span>· Grade A</span></h3><p>From Chikkaballapur · Harvest in 3 days</p></div><div className="recommendation-tag">High opportunity</div></div><div className="recommendation-metrics"><div><span>AVAILABLE</span><strong>2,000 kg</strong></div><div><span>RECOMMENDED PRICE</span><strong>₹31–34/kg</strong></div><div><span>EXPECTED DEMAND</span><strong>4,320 kg <em>↑ 18%</em></strong></div></div><div className="recommendation-bottom"><div className="reason-copy"><ShieldCheck size={16} /><span><b>Why this price?</b> Demand is trending upward and local supply is limited.</span><button className="why-button" onClick={() => setShowWhy(!showWhy)}>{showWhy ? "Hide" : "See why"}</button></div><button className="secondary-button" onClick={() => action("Tomato listing draft created.")}>Create listing <ArrowUpRight size={15} /></button></div>{showWhy && <div className="why-panel"><div><strong>Demand trend</strong><span>High / rising</span></div><div><strong>Local supply</strong><span>Limited within 25 km</span></div><div><strong>Forecast window</strong><span>Next 7 days</span></div><div><strong>Current market</strong><span>₹28/kg</span></div></div>}</div>

              <div className="section-heading second-heading"><div><span className="section-kicker"><UsersRound size={14} /> BUYER MATCHING</span><h2>Best matches for your supply</h2></div><button className="text-button" onClick={() => action("Matching preferences opened.")}>Tune matching <Settings2 size={14} /></button></div>
              <div className="matches-card">{matches.map((item) => <div className="match-row" key={item.buyer}><div className="buyer-avatar">{item.buyer.split(" ").map((n) => n[0]).join("").slice(0,2)}</div><div className="match-main"><strong>{item.buyer}</strong><span>{item.location}</span></div><div className="match-volume"><span>NEEDS</span><strong>{item.volume}</strong></div><div className="match-price"><span>OFFER</span><strong>{item.price}</strong></div><div className="match-score"><SignalBars value={Number(item.match.replace("%", ""))} tone={item.tone} /><strong>{item.match}</strong></div><button className="row-arrow" onClick={() => action(`${item.buyer} details opened.`)} aria-label={`Open ${item.buyer}`}><ArrowUpRight size={16} /></button></div>)}<button className="full-width-button" onClick={() => action("Marketplace opened with 12 ranked matches.")}>Explore marketplace <ArrowUpRight size={15} /></button></div>
            </div>

            <aside className="right-column"><div className="section-heading"><div><span className="section-kicker"><Truck size={14} /> IN MOTION</span><h2>Live operations</h2></div><button className="icon-btn" onClick={() => action("Operations view refreshed.")} aria-label="Refresh operations"><Compass size={17} /></button></div><div className="route-card"><div className="route-card-header"><div><span className="card-label">ORDER #KS-1048</span><h3>On the road to Bengaluru</h3></div><span className="status-pill">In transit</span></div><div className="route-map"><img src="/manus-storage/kisansetu-route-ribbon_9b791a2d.jpg" alt="Stylized route map from farm to buyer" /><div className="route-line"><span className="route-node start" /><span className="route-node end" /></div><div className="route-pin-label start-label">Chikkaballapur</div><div className="route-pin-label end-label">GreenBasket</div></div><div className="route-meta"><div><span>LOAD</span><strong>700 kg tomatoes</strong></div><div><span>ETA</span><strong>Today, 4:20 PM</strong></div></div><button className="full-width-button dark" onClick={() => action("Shipment tracking opened.")}>Track shipment <MapPinned size={15} /></button></div><div className="insight-card"><div className="insight-icon"><BarChart3 size={18} /></div><div><span className="card-label">MARKET WATCH</span><h3>Onion demand is picking up</h3><p>Demand in your region is <b>24% higher</b> than this time last month.</p><button className="text-button" onClick={() => action("Onion demand report opened.")}>Open demand report <ArrowUpRight size={14} /></button></div></div><div className="field-photo"><img src="/manus-storage/kisansetu-field-texture_471010d2.jpg" alt="Aerial rows of crops" /><div className="field-photo-overlay"><span>YOUR NETWORK</span><strong>12 active buyer links</strong><small>Across 3 nearby markets</small></div></div></aside>
          </section>
          <footer className="footer-note"><span><Sprout size={14} /> Built for the people who grow with the people who need.</span><span>Data updates every 15 min · <button onClick={() => action("System status: all services operational.")}>System status</button></span></footer>
        </div>
      </main>
    </div>
  );
}
