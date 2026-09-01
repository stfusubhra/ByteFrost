import { useState, useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Sprout, Store, Truck, MapPin, CheckCircle, Box, Route } from "lucide-react";
import { motion, useInView } from "framer-motion";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

// --- Utility Components ---

const FadeIn = ({ children, delay = 0, className = "" }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// --- Sections ---

const Section01Problem = () => {
  return (
    <section className="py-24 bg-[var(--bg)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">01 / The Problem</span>
          <h2 className="h2 mt-4">Fragmented supply chains waste value.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            Traditional models rely on multiple disconnected intermediaries,
            resulting in unnecessary movement, lost time, and unclear pricing.
          </p>
        </div>

        <div className="max-w-3xl mx-auto border border-[var(--line)] rounded-2xl bg-[var(--surface)] p-8 md:p-10">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center">
              <Sprout className="mx-auto mb-3 text-[var(--primary)]" size={28} />
              <span className="text-sm font-medium text-[var(--ink)]">Farmer</span>
              <p className="meta mt-1">Grows the produce</p>
            </div>

            <div className="hidden md:flex flex-col items-center gap-2 text-[var(--ink-muted)]">
              <div className="w-full h-px bg-[var(--line-strong)]" />
              <span className="text-xs">3–4 intermediaries</span>
              <div className="w-full h-px bg-[var(--line-strong)]" />
            </div>

            <div className="text-center">
              <Store className="mx-auto mb-3 text-[var(--ink-soft)]" size={28} />
              <span className="text-sm font-medium text-[var(--ink)]">Buyer</span>
              <p className="meta mt-1">Pays the markup</p>
            </div>
          </div>
          <p className="state-body text-center mt-8 max-w-md mx-auto">
            Each hand-off adds distance, delay, and cost — most of which never
            reaches the farmer who grew the crop.
          </p>
        </div>
      </div>
    </section>
  );
};

const Section02Network = () => {
  const nodes = [
    { icon: Sprout, title: "Farmers", desc: "Available produce, quantity, and precise locations are mapped in real time." },
    { icon: Store, title: "Buyers", desc: "Order requirements, quality standards, and destinations are broadcast." },
    { icon: Box, title: "Smart Hubs", desc: "Optional consolidation points activated only when they improve efficiency." },
    { icon: Truck, title: "Logistics", desc: "Optimized routes and vehicle matching to minimize empty trips." },
  ];
  return (
    <section className="py-24 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container max-w-5xl">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">02 / The KisanSetu Network</span>
          <h2 className="h2 mt-4">A living, connected ecosystem.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            Farmers, buyers, and logistics are no longer isolated. They operate
            within a single intelligent network.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-2xl overflow-hidden">
          {nodes.map((node, i) => (
            <FadeIn key={i} delay={i * 0.08} className="bg-[var(--surface)]">
              <div className="p-6 h-full">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-4">
                  <node.icon size={20} />
                </div>
                <h3 className="h3 mb-2">{node.title}</h3>
                <p className="body text-sm">{node.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

const Section03SupplyMeet = () => {
  // Real, existing marketplace data (from the live demo listings) grounds the
  // aggregation story in actual produce, prices, and locations.
  const farmers = [
    { name: "GreenValley Farms", place: "Nashik, MH", qty: "500 kg", price: "₹32/kg" },
    { name: "Sahaja Agro Co-op", place: "Pune, MH", qty: "700 kg", price: "₹30/kg" },
    { name: "Satara Fresh Collective", place: "Satara, MH", qty: "320 kg", price: "₹25/kg" },
  ];
  return (
    <section className="py-24 bg-[var(--bg)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">03 / Supply Meets Demand</span>
          <h2 className="h2 mt-4">Fulfilling large orders through aggregation.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            When a buyer places an order, the system identifies the best
            combination of nearby farmers to fulfill it.
          </p>
        </div>

        <div className="max-w-4xl mx-auto border border-[var(--line)] rounded-2xl bg-[var(--surface)] p-6 md:p-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="eyebrow mb-3">Available supply</span>
              <div className="divide-y divide-[var(--line)]">
                {farmers.map((f, i) => (
                  <FadeIn key={i} delay={i * 0.08}>
                    <div className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Sprout size={16} className="text-[var(--primary)] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--ink)] truncate">{f.name}</div>
                          <div className="meta flex items-center gap-1">
                            <MapPin size={11} /> {f.place}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[var(--ink)]">{f.qty}</div>
                        <div className="meta">{f.price}</div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            <div className="border border-[var(--line)] rounded-2xl bg-[var(--bg-subtle)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary-strong)] text-white flex items-center justify-center">
                  <Store size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)]">Buyer request</div>
                  <div className="meta">Consolidated order</div>
                </div>
              </div>
              <div className="text-2xl font-black text-[var(--ink)]">1,520 kg Tomatoes</div>
              <p className="state-body mt-2">
                Combined from three nearby farms into a single, efficient
                shipment — one route, one delivery.
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <span className="meta">Combined value</span>
                <span className="text-lg font-bold text-[var(--primary)]">₹46,400</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Section0405LogisticsEngine = () => {
  const [scenario, setScenario] = useState<"direct" | "hub">("direct");

  const rows = [
    { label: "Available quantity", direct: "Sufficient (1 farm)", hub: "Scattered (3 farms)" },
    { label: "Farmer proximity", direct: "Close to buyer", hub: "Close to hub" },
    { label: "Vehicle capacity", direct: "Matches order", hub: "Requires consolidation" },
    { label: "Consolidation opportunity", direct: "Not needed", hub: "High cost savings" },
  ];

  return (
    <section className="py-24 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">04 & 05 / KisanSetu Thinks & Routes</span>
          <h2 className="h2 mt-4">Intelligent logistics optimization.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            KisanSetu evaluates quantity, distance, capacity, and cost to
            determine the most efficient fulfillment path. Hubs are an optional
            strategic tool, not a mandatory step.
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-[var(--bg-subtle)] p-1 rounded-xl inline-flex">
            <button
              onClick={() => setScenario("direct")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${scenario === "direct" ? "bg-white shadow-sm text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
            >
              Scenario A: Direct Pickup
            </button>
            <button
              onClick={() => setScenario("hub")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${scenario === "hub" ? "bg-white shadow-sm text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
            >
              Scenario B: Hub Consolidation
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Route summary */}
          <div className="border border-[var(--line)] rounded-2xl bg-[var(--bg)] p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--line)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center">
                <Route size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--ink)]">Recommended route</div>
                <div className="meta">Based on current supply and demand</div>
              </div>
            </div>
            <div className="text-xl font-bold text-[var(--primary)] mb-4">
              {scenario === "direct" ? "Direct Pickup" : "Hub Consolidation"}
            </div>
            <div className="space-y-3">
              {rows.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-[var(--ink-muted)] flex items-center gap-2">
                    <CheckCircle size={14} className="text-[var(--primary)] shrink-0" /> {item.label}
                  </span>
                  <span className="font-medium text-[var(--ink)] text-right">
                    {scenario === "direct" ? item.direct : item.hub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Route visual */}
          <div className="border border-[var(--line)] rounded-2xl bg-[var(--surface)] p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 bg-[var(--primary-soft)] border border-[var(--line-strong)] rounded-full flex items-center justify-center">
                  <Sprout className="text-[var(--primary)]" size={20} />
                </div>
                <span className="text-xs font-semibold text-[var(--ink)]">Farm</span>
              </div>

              <div className="flex-1 mx-4 flex flex-col items-center gap-1">
                <div className="w-full h-px bg-[var(--line-strong)]" />
                <span className="meta">
                  {scenario === "direct" ? "1 route" : "3 routes → 1 hub"}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 bg-[var(--primary-soft)] border border-[var(--line-strong)] rounded-full flex items-center justify-center">
                  <Store className="text-[var(--primary)]" size={20} />
                </div>
                <span className="text-xs font-semibold text-[var(--ink)]">Buyer</span>
              </div>
            </div>

            {scenario === "hub" && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-12 h-12 bg-[var(--primary-strong)] text-white rounded-xl flex items-center justify-center">
                  <Box size={22} />
                </div>
                <span className="text-sm font-semibold text-[var(--ink)]">Optional Hub</span>
              </div>
            )}

            <p className="state-body text-center">
              {scenario === "direct"
                ? "Direct pickup when it is efficient — one farm, one buyer, one trip."
                : "Hub consolidation when it saves resources — combine small loads into one optimized shipment."}
            </p>
          </div>
        </div>

        <div className="mt-14 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">
            Not every shipment needs a hub.
          </h3>
          <p className="text-lg text-[var(--ink-soft)] mt-3 max-w-2xl mx-auto">
            KisanSetu chooses the route that makes the most sense. Direct pickup
            when it is efficient. Hub-based consolidation when it saves resources.
          </p>
        </div>
      </div>
    </section>
  );
};

const Section06SmartHub = () => {
  return (
    <section className="py-24 bg-[var(--bg)]">
      <div className="container max-w-4xl">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">06 / Strategic Consolidation</span>
          <h2 className="h2 mt-4">Hubs multiply efficiency.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            When activated by the logistics engine, hubs combine small local
            supplies into a single, optimized long-distance shipment.
          </p>
        </div>

        <div className="border border-[var(--line)] rounded-2xl bg-[var(--surface)] p-8 md:p-10">
          <div className="flex items-center justify-between max-w-lg mx-auto mb-8">
            <div className="flex flex-col items-center gap-2">
              <Sprout className="text-[var(--primary)]" size={24} />
              <span className="text-xs font-bold text-[var(--ink-soft)]">400 kg</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sprout className="text-[var(--primary)]" size={24} />
              <span className="text-xs font-bold text-[var(--ink-soft)]">300 kg</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sprout className="text-[var(--primary)]" size={24} />
              <span className="text-xs font-bold text-[var(--ink-soft)]">300 kg</span>
            </div>
          </div>

          <div className="bg-[var(--primary-strong)] text-white px-8 py-4 rounded-xl flex items-center justify-center gap-4 max-w-md mx-auto">
            <Box size={26} className="text-[var(--accent)]" />
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">Smart Hub</div>
              <div className="text-xl font-bold">1,000 kg consolidated</div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center">
            <div className="bg-[var(--primary-soft)] border border-[var(--primary)] text-[var(--primary)] px-6 py-3 rounded-full font-bold flex items-center gap-2">
              <Truck size={18} /> 1 Optimized Shipment
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Section07DataStory = () => {
  return (
    <section className="py-24 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">07 / Data Story</span>
          <h2 className="h2 mt-4">The value of a direct connection.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            Fewer intermediaries means more of the market price reaches the
            farmer who grew the crop.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Chart 1 */}
          <FadeIn className="border border-[var(--line)] rounded-2xl bg-[var(--bg)] p-6">
            <h3 className="h3 mb-1">Value Retention</h3>
            <p className="meta mb-6">Share of market price reaching the farmer</p>
            <div className="flex h-40 items-end gap-8 justify-center">
              <div className="w-24 flex flex-col justify-end items-center gap-2">
                <div className="w-full bg-[var(--line-strong)] rounded-t-lg" style={{ height: "40%" }} />
                <span className="text-xs text-[var(--ink-soft)] text-center leading-tight font-medium">Traditional<br />model</span>
              </div>
              <div className="w-24 flex flex-col justify-end items-center gap-2">
                <div className="w-full bg-[var(--primary)] rounded-t-lg" style={{ height: "85%" }} />
                <span className="text-xs font-bold text-[var(--ink)] text-center leading-tight">KisanSetu<br />direct</span>
              </div>
            </div>
            <p className="meta mt-6 text-center">Illustrative comparison of typical margin distribution</p>
          </FadeIn>

          {/* Chart 2 */}
          <FadeIn delay={0.1} className="border border-[var(--line)] rounded-2xl bg-[var(--bg)] p-6">
            <h3 className="h3 mb-1">Logistics Efficiency</h3>
            <p className="meta mb-6">Empty trips and redundant mileage</p>
            <div className="space-y-6 mt-4">
              <div>
                <div className="flex justify-between text-xs mb-2 text-[var(--ink-soft)]">
                  <span>Unoptimized transport</span>
                </div>
                <div className="h-4 bg-[var(--line)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--error)] opacity-60" style={{ width: "85%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold text-[var(--ink)]">
                  <span>KisanSetu engine</span> <span className="text-[var(--primary)]">Reduced</span>
                </div>
                <div className="h-4 bg-[var(--line)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--primary)]" style={{ width: "35%" }} />
                </div>
              </div>
            </div>
            <p className="meta mt-6 text-center">Illustrative comparison of route efficiency</p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default function Story() {
  const { t } = useLanguage();

  return (
    <PublicLayout eyebrow={t("story.eyebrow")}>
      {/* Hero */}
      <section className="py-24 md:py-32 bg-[var(--bg)] border-b border-[var(--line)]">
        <div className="container max-w-4xl text-center">
          <span className="eyebrow mb-6 justify-center">{t("story.section")}</span>
          <h1
            className="display text-4xl md:text-6xl mb-6"
          >
            {t("story.h1a")} <em className="text-[var(--primary)] not-italic">{t("story.h1b")}</em>
          </h1>
          <p className="text-lg md:text-xl text-[var(--ink-soft)] max-w-2xl mx-auto">
            Connecting farmers, markets & smarter logistics.
          </p>
          <div className="row justify-center" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" href="/marketplace">
              Explore the marketplace <ArrowRight size={15} />
            </Link>
            <Link className="btn btn-secondary" href="/market-match">
              Find your market match
            </Link>
          </div>
        </div>
      </section>

      <Section01Problem />
      <Section02Network />
      <Section03SupplyMeet />
      <Section0405LogisticsEngine />
      <Section06SmartHub />
      <Section07DataStory />

      {/* 08 / Final CTA */}
      <section className="py-24 bg-[var(--primary-strong)] text-white text-center">
        <FadeIn className="max-w-3xl mx-auto px-6">
          <span className="eyebrow text-[var(--accent)] mb-6 justify-center">The Bigger Picture</span>
          <h2
            className="display text-3xl md:text-4xl mb-6"
          >
            From Farm to Market, Connected.
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            KisanSetu brings farmers, buyers, and intelligent logistics together
            in one connected ecosystem.
          </p>
          <Link
            href="/market-match"
            className="btn btn-lg bg-white text-[var(--primary-strong)] hover:bg-[var(--bg-subtle)] border-none"
          >
            Find your market match <ArrowRight size={18} className="ml-2" />
          </Link>
        </FadeIn>
      </section>
    </PublicLayout>
  );
}
