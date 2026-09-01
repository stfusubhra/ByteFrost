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
  const { t } = useLanguage();
  return (
    <section className="py-24 bg-[var(--bg)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">{t("story.sec1.eyebrow")}</span>
          <h2 className="h2 mt-4">{t("story.sec1.h2")}</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            {t("story.sec1.p")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto border border-[var(--line)] rounded-2xl bg-[var(--surface)] p-8 md:p-10">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center">
              <Sprout className="mx-auto mb-3 text-[var(--primary)]" size={28} />
              <span className="text-sm font-medium text-[var(--ink)]">{t("story.sec1.farmer")}</span>
              <p className="meta mt-1">{t("story.sec1.grows")}</p>
            </div>

            <div className="hidden md:flex flex-col items-center gap-2 text-[var(--ink-muted)]">
              <div className="w-full h-px bg-[var(--line-strong)]" />
              <span className="text-xs">{t("story.sec1.intermediaries")}</span>
              <div className="w-full h-px bg-[var(--line-strong)]" />
            </div>

            <div className="text-center">
              <Store className="mx-auto mb-3 text-[var(--ink-soft)]" size={28} />
              <span className="text-sm font-medium text-[var(--ink)]">{t("story.sec1.buyer")}</span>
              <p className="meta mt-1">{t("story.sec1.pays")}</p>
            </div>
          </div>
          <p className="state-body text-center mt-8 max-w-md mx-auto">
            {t("story.sec1.footer")}
          </p>
        </div>
      </div>
    </section>
  );
};

const Section02Network = () => {
  const { t } = useLanguage();
  const nodes = [
    { icon: Sprout, title: t("story.sec2.farmers"), desc: t("story.sec2.farmersDesc") },
    { icon: Store, title: t("story.sec2.buyers"), desc: t("story.sec2.buyersDesc") },
    { icon: Box, title: t("story.sec2.hubs"), desc: t("story.sec2.hubsDesc") },
    { icon: Truck, title: t("story.sec2.logistics"), desc: t("story.sec2.logisticsDesc") },
  ];
  return (
    <section className="py-24 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container max-w-5xl">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">{t("story.sec2.eyebrow")}</span>
          <h2 className="h2 mt-4">{t("story.sec2.h2")}</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            {t("story.sec2.p")}
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
  const { t } = useLanguage();
  const farmers = [
    { name: "GreenValley Farms", place: "Nashik, MH", qty: "500 kg", price: "₹32/kg" },
    { name: "Sahaja Agro Co-op", place: "Pune, MH", qty: "700 kg", price: "₹30/kg" },
    { name: "Satara Fresh Collective", place: "Satara, MH", qty: "320 kg", price: "₹25/kg" },
  ];
  return (
    <section className="py-24 bg-[var(--bg)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">{t("story.sec3.eyebrow")}</span>
          <h2 className="h2 mt-4">{t("story.sec3.h2")}</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            {t("story.sec3.p")}
          </p>
        </div>

        <div className="max-w-4xl mx-auto border border-[var(--line)] rounded-2xl bg-[var(--surface)] p-6 md:p-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="eyebrow mb-3">{t("story.sec3.availableSupply")}</span>
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
                  <div className="text-sm font-bold text-[var(--ink)]">{t("story.sec3.buyerRequest")}</div>
                  <div className="meta">{t("story.sec3.consolidatedOrder")}</div>
                </div>
              </div>
              <div className="text-2xl font-black text-[var(--ink)]">{t("story.sec3.orderTitle")}</div>
              <p className="state-body mt-2">
                {t("story.sec3.orderDesc")}
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <span className="meta">{t("story.sec3.combinedValue")}</span>
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
  const { t } = useLanguage();
  const [scenario, setScenario] = useState<"direct" | "hub">("direct");

  const rows = [
    { label: t("story.sec4.availQty"), direct: t("story.sec4.directQty"), hub: t("story.sec4.hubQty") },
    { label: t("story.sec4.farmerProx"), direct: t("story.sec4.directProx"), hub: t("story.sec4.hubProx") },
    { label: t("story.sec4.vehCap"), direct: t("story.sec4.directCap"), hub: t("story.sec4.hubCap") },
    { label: t("story.sec4.consOpp"), direct: t("story.sec4.directOpp"), hub: t("story.sec4.hubOpp") },
  ];

  return (
    <section className="py-24 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">{t("story.sec4.eyebrow")}</span>
          <h2 className="h2 mt-4">{t("story.sec4.h2")}</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            {t("story.sec4.p")}
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-[var(--bg-subtle)] p-1 rounded-xl inline-flex">
            <button
              onClick={() => setScenario("direct")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${scenario === "direct" ? "bg-white shadow-sm text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
            >
              {t("story.sec4.scenarioA")}
            </button>
            <button
              onClick={() => setScenario("hub")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${scenario === "hub" ? "bg-white shadow-sm text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
            >
              {t("story.sec4.scenarioB")}
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
                <div className="text-sm font-bold text-[var(--ink)]">{t("story.sec4.recRoute")}</div>
                <div className="meta">{t("story.sec4.recRouteSub")}</div>
              </div>
            </div>
            <div className="text-xl font-bold text-[var(--primary)] mb-4">
              {scenario === "direct" ? t("story.sec4.directPickup") : t("story.sec4.hubConsolidation")}
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
                <span className="text-xs font-semibold text-[var(--ink)]">{t("story.sec4.farm")}</span>
              </div>

              <div className="flex-1 mx-4 flex flex-col items-center gap-1">
                <div className="w-full h-px bg-[var(--line-strong)]" />
                <span className="meta">
                  {scenario === "direct" ? t("story.sec4.oneRoute") : t("story.sec4.threeRoutes")}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 bg-[var(--primary-soft)] border border-[var(--line-strong)] rounded-full flex items-center justify-center">
                  <Store className="text-[var(--primary)]" size={20} />
                </div>
                <span className="text-xs font-semibold text-[var(--ink)]">{t("story.sec4.buyer")}</span>
              </div>
            </div>

            {scenario === "hub" && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-12 h-12 bg-[var(--primary-strong)] text-white rounded-xl flex items-center justify-center">
                  <Box size={22} />
                </div>
                <span className="text-sm font-semibold text-[var(--ink)]">{t("story.sec4.optHub")}</span>
              </div>
            )}

            <p className="state-body text-center">
              {scenario === "direct"
                ? t("story.sec4.directDesc")
                : t("story.sec4.hubDesc")}
            </p>
          </div>
        </div>

        <div className="mt-14 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">
            {t("story.sec4.notEvery")}
          </h3>
          <p className="text-lg text-[var(--ink-soft)] mt-3 max-w-2xl mx-auto">
            {t("story.sec4.notEveryDesc")}
          </p>
        </div>
      </div>
    </section>
  );
};

const Section06SmartHub = () => {
  const { t } = useLanguage();
  return (
    <section className="py-24 bg-[var(--bg)]">
      <div className="container max-w-4xl">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">{t("story.sec6.eyebrow")}</span>
          <h2 className="h2 mt-4">{t("story.sec6.h2")}</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            {t("story.sec6.p")}
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
              <div className="text-[10px] uppercase tracking-wider opacity-80">{t("story.sec6.smartHub")}</div>
              <div className="text-xl font-bold">{t("story.sec6.consolidated1000")}</div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center">
            <div className="bg-[var(--primary-soft)] border border-[var(--primary)] text-[var(--primary)] px-6 py-3 rounded-full font-bold flex items-center gap-2">
              <Truck size={18} /> {t("story.sec6.optShipment")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Section07DataStory = () => {
  const { t } = useLanguage();
  return (
    <section className="py-24 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container">
        <div className="text-center mb-14 flex flex-col items-center">
          <span className="eyebrow">{t("story.sec7.eyebrow")}</span>
          <h2 className="h2 mt-4">{t("story.sec7.h2")}</h2>
          <p className="body mt-4 max-w-2xl mx-auto">
            {t("story.sec7.p")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Chart 1 */}
          <FadeIn className="border border-[var(--line)] rounded-2xl bg-[var(--bg)] p-6 flex flex-col justify-between">
            <div>
              <h3 className="h3 mb-1">{t("story.sec7.valRet")}</h3>
              <p className="meta mb-6">{t("story.sec7.valRetSub")}</p>
            </div>
            <div className="flex h-44 items-end gap-8 justify-center pt-4 pb-2">
              <div className="w-28 h-full flex flex-col justify-end items-center">
                <span className="text-xs font-bold text-[var(--ink-muted)] mb-1.5">38%</span>
                <div className="w-full bg-[var(--line-strong)] rounded-t-lg" style={{ height: "65px" }} />
                <span className="text-xs text-[var(--ink-soft)] text-center leading-tight font-medium mt-2">{t("story.sec7.tradModel")}</span>
              </div>
              <div className="w-28 h-full flex flex-col justify-end items-center">
                <span className="text-xs font-bold text-[var(--primary)] mb-1.5">82%</span>
                <div className="w-full bg-[var(--primary)] rounded-t-lg shadow-sm" style={{ height: "135px" }} />
                <span className="text-xs font-bold text-[var(--ink)] text-center leading-tight mt-2">{t("story.sec7.directModel")}</span>
              </div>
            </div>
            <p className="meta mt-4 text-center">{t("story.sec7.marginComp")}</p>
          </FadeIn>

          {/* Chart 2 */}
          <FadeIn delay={0.1} className="border border-[var(--line)] rounded-2xl bg-[var(--bg)] p-6 flex flex-col justify-between">
            <div>
              <h3 className="h3 mb-1">{t("story.sec7.logEff")}</h3>
              <p className="meta mb-6">{t("story.sec7.logEffSub")}</p>
            </div>
            <div className="space-y-6 my-auto py-4">
              <div>
                <div className="flex justify-between text-xs mb-2 text-[var(--ink-soft)] font-medium">
                  <span>{t("story.sec7.unopt")}</span>
                  <span className="font-semibold text-[var(--ink-muted)]">68%</span>
                </div>
                <div className="h-5 bg-[var(--line)] rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-[var(--error)] rounded-full opacity-80" style={{ width: "68%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold text-[var(--ink)]">
                  <span>{t("story.sec7.ksEngine")}</span>
                  <span className="text-[var(--primary)] font-bold">18% ({t("story.sec7.reduced")})</span>
                </div>
                <div className="h-5 bg-[var(--line)] rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: "18%" }} />
                </div>
              </div>
            </div>
            <p className="meta mt-4 text-center">{t("story.sec7.routeComp")}</p>
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
        <div className="container max-w-4xl text-center flex flex-col items-center mx-auto">
          <span className="eyebrow mb-6 justify-center">{t("story.section")}</span>
          <h1
            className="display text-4xl md:text-6xl mb-6 mx-auto text-center"
          >
            {t("story.h1a")} <em className="text-[var(--primary)] not-italic">{t("story.h1b")}</em>
          </h1>
          <p className="text-lg md:text-xl text-[var(--ink-soft)] max-w-2xl mx-auto text-center">
            {t("story.sub")}
          </p>
          <div className="row justify-center mx-auto" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" href="/marketplace">
              {t("story.exploreMarketplace")} <ArrowRight size={15} />
            </Link>
            <Link className="btn btn-secondary" href="/market-match">
              {t("story.findMatch")}
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
        <FadeIn className="max-w-3xl mx-auto px-6 text-center">
          <span
            className="eyebrow eyebrow-accent mb-6 justify-center"
            style={{ color: "#e0b45a" }}
          >
            {t("story.sec8.eyebrow")}
          </span>
          <h2
            className="display text-3xl md:text-4xl mb-6"
          >
            {t("story.sec8.h2")}
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            {t("story.sec8.p")}
          </p>
          <Link
            href="/market-match"
            className="btn btn-lg btn-white"
            style={{ color: "var(--primary-strong)", backgroundColor: "#ffffff" }}
          >
            {t("story.findMatch")} <ArrowRight size={18} className="ml-2" />
          </Link>
        </FadeIn>
      </section>
    </PublicLayout>
  );
}
