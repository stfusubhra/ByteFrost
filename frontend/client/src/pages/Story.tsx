import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  ArrowRight, Sprout, Truck, Store, MapPin, 
  Activity, Package, Route, CheckCircle, 
  TrendingUp, Users, Box, Cpu, ArrowDownRight, RefreshCw
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";

// --- Utility Components ---

const FadeIn = ({ children, delay = 0, className = "" }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// --- Sections ---

const Section01Problem = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="py-32 bg-[var(--bg)] min-h-screen flex items-center">
      <div className="container">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="eyebrow">01 / The Problem</span>
          <h2 className="h2 mt-4">Fragmented supply chains waste value.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">Traditional models rely on multiple disconnected intermediaries, resulting in unnecessary movement, lost time, and unclear pricing.</p>
        </div>

        <motion.div style={{ opacity }} className="relative max-w-4xl mx-auto h-[400px] border border-red-100 rounded-3xl bg-[var(--surface)] shadow-sm overflow-hidden p-8 flex items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at center, #000 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
          
          <div className="flex w-full justify-between items-center relative z-10 opacity-70">
            <div className="text-center"><Sprout className="mx-auto mb-3 text-red-400" size={32} /> <span className="text-sm font-medium">Farmer</span></div>
            
            <div className="flex-1 flex flex-col items-center justify-center relative px-4">
              <svg className="absolute w-full h-24 top-1/2 -translate-y-1/2 overflow-visible">
                <motion.path d="M 0 48 Q 50 0, 100 48 T 200 48 T 300 48 T 400 48" stroke="red" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.3" />
                <motion.path d="M 0 48 Q 50 96, 100 48 T 200 48 T 300 48 T 400 48" stroke="orange" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.3" />
                <motion.path d="M 0 48 L 400 48" stroke="red" strokeWidth="2" fill="none" opacity="0.1" />
              </svg>
              <div className="flex gap-12 relative z-10">
                <div className="w-10 h-10 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-400 text-xs shadow-sm">Agent</div>
                <div className="w-10 h-10 rounded bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-400 text-xs shadow-sm">Mandi</div>
                <div className="w-10 h-10 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-400 text-xs shadow-sm">Trans</div>
              </div>
            </div>

            <div className="text-center"><Store className="mx-auto mb-3 text-gray-400" size={32} /> <span className="text-sm font-medium">Buyer</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Section02Network = () => {
  return (
    <section className="py-32 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container max-w-5xl">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="eyebrow">02 / The KisanSetu Network</span>
          <h2 className="h2 mt-4">A living, connected ecosystem.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">Farmers, buyers, and logistics are no longer isolated. They operate within a single intelligent network.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Sprout, title: "Farmers", desc: "Available produce, quantity, and precise locations are mapped in real-time." },
            { icon: Store, title: "Buyers", desc: "Order requirements, quality standards, and destinations are broadcasted." },
            { icon: Box, title: "Smart Hubs", desc: "Optional consolidation points activated only when they improve efficiency." },
            { icon: Truck, title: "Logistics", desc: "Optimized routes and vehicle matching to minimize empty trips." }
          ].map((node, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="card p-6 h-full eco-node-hover cursor-default group relative overflow-hidden bg-[var(--bg)] border border-[var(--line)]">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface)] border border-[var(--line-strong)] flex items-center justify-center mb-6 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors duration-300">
                  <node.icon size={24} />
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
  return (
    <section className="py-32 bg-[var(--bg)]">
      <div className="container">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="eyebrow">03 / Supply Meets Demand</span>
          <h2 className="h2 mt-4">Fulfilling large orders through aggregation.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">When a buyer places an order, the system identifies the best combination of nearby farmers to fulfill it.</p>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 p-8 lg:p-16 card glass-panel">
           <div className="flex flex-col gap-6 w-full md:w-1/3">
              {[
                { name: "Farmer A", qty: "400 kg" },
                { name: "Farmer B", qty: "300 kg" },
                { name: "Farmer C", qty: "300 kg" }
              ].map((f, i) => (
                <FadeIn key={i} delay={i * 0.2} className="bg-[var(--surface)] border border-[var(--line-strong)] p-4 rounded-xl shadow-sm flex items-center justify-between z-10 relative">
                  <div className="flex items-center gap-3">
                    <Sprout size={18} className="text-[var(--success)]" />
                    <span className="font-medium text-[var(--ink)] text-sm">{f.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--ink-soft)] bg-[var(--bg-subtle)] px-2 py-1 rounded-md">{f.qty}</span>
                </FadeIn>
              ))}
           </div>
           
           <div className="flex-1 w-full h-32 md:h-64 relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                 <motion.path d="M 0 20 C 150 20, 150 120, 300 120" stroke="var(--primary)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1 }} />
                 <motion.path d="M 0 120 C 150 120, 150 120, 300 120" stroke="var(--primary)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }} />
                 <motion.path d="M 0 220 C 150 220, 150 120, 300 120" stroke="var(--primary)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.4 }} />
              </svg>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.8 }} className="z-10 w-24 h-24 rounded-full bg-[var(--primary-strong)] text-white flex flex-col items-center justify-center shadow-lg border-4 border-white">
                <CheckCircle size={24} className="mb-1 text-[var(--accent)]" />
                <span className="text-[10px] uppercase tracking-wider opacity-80">Matched</span>
                <span className="font-bold text-lg">1000 kg</span>
              </motion.div>
           </div>
           
           <div className="w-full md:w-1/3 text-center md:text-right z-10">
              <FadeIn delay={1}>
                <div className="bg-[var(--info-soft)] border border-[var(--info)] p-6 rounded-2xl shadow-sm inline-block w-full">
                  <Store size={32} className="text-[var(--info)] mb-3 mx-auto md:ml-auto md:mr-0" />
                  <div className="text-sm font-bold text-[var(--ink)]">Buyer Request</div>
                  <div className="text-xl font-black text-[var(--info)] mt-1 mb-2">1,000 kg Tomatoes</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Illustrative demo scenario</div>
                </div>
              </FadeIn>
           </div>
        </div>
      </div>
    </section>
  );
};

const Section0405LogisticsEngine = () => {
  const [scenario, setScenario] = useState<"direct" | "hub">("direct");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Trigger analysis effect when switching scenarios
  const handleScenarioChange = (s: "direct" | "hub") => {
    if (s === scenario) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setScenario(s);
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <section className="py-32 bg-[var(--surface)] border-y border-[var(--line)] relative overflow-hidden">
      <div className="container">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="eyebrow">04 & 05 / KisanSetu Thinks & Routes</span>
          <h2 className="h2 mt-4">Intelligent logistics optimization.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">KisanSetu evaluates quantity, distance, capacity, and cost to determine the most efficient fulfillment path. Hubs are an optional strategic tool, not a mandatory step.</p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-[var(--bg-subtle)] p-1.5 rounded-xl inline-flex shadow-inner">
            <button 
              onClick={() => handleScenarioChange("direct")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${scenario === "direct" && !isAnalyzing ? 'bg-white shadow-sm text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`}
            >
              Scenario A: Direct Pickup
            </button>
            <button 
              onClick={() => handleScenarioChange("hub")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${scenario === "hub" && !isAnalyzing ? 'bg-white shadow-sm text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`}
            >
              Scenario B: Hub Consolidation
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Logistics Engine Panel */}
          <div className="w-full lg:w-[320px] shrink-0 card bg-[var(--bg)] p-6 relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--line)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center">
                <Cpu size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--ink)]">Logistics Engine</div>
                <div className="text-xs text-[var(--ink-muted)]">Simulation active</div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)] mb-2 flex items-center gap-2">
                {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                {isAnalyzing ? "Analyzing variables..." : "Optimization complete"}
              </div>
              
              <div className="space-y-3">
                {[
                  { label: "Available quantity", direct: "Sufficient (1 Farm)", hub: "Scattered (3 Farms)" },
                  { label: "Farmer proximity", direct: "Close to buyer", hub: "Close to Hub" },
                  { label: "Vehicle capacity", direct: "Matches order", hub: "Requires consolidation" },
                  { label: "Consolidation opportunity", direct: "Not needed", hub: "High cost savings" }
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs ${isAnalyzing ? 'opacity-40' : 'opacity-100'} transition-opacity delay-${i*100}`}>
                    <span className="text-[var(--ink-muted)] flex items-center gap-2">
                      <CheckCircle size={12} className="text-[var(--success)]" /> {item.label}
                    </span>
                    <span className="font-medium text-[var(--ink)] text-right">{scenario === "direct" ? item.direct : item.hub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`mt-8 pt-4 border-t border-[var(--line)] transition-all ${isAnalyzing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="text-xs text-[var(--ink-muted)] mb-1">Recommended Route</div>
              <div className="text-lg font-bold text-[var(--primary)] flex items-center gap-2">
                <Route size={18} /> {scenario === "direct" ? "Direct Pickup" : "Hub Consolidation"}
              </div>
            </div>
          </div>

          {/* Interactive Map/Simulation Area */}
          <div className="flex-1 card bg-[var(--surface)] min-h-[400px] relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at center, var(--ink) 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
            
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
               
               {/* --- DIRECT PATH --- */}
               <g className={`transition-opacity duration-500 ${scenario === "direct" ? 'opacity-100' : 'opacity-20'}`}>
                 <path d="M 150 200 Q 400 350 650 200" stroke="var(--line-strong)" strokeWidth="6" strokeDasharray="10 10" fill="none" />
                 {!isAnalyzing && scenario === "direct" && (
                   <motion.path 
                     d="M 150 200 Q 400 350 650 200" 
                     stroke="var(--success)" strokeWidth="6" fill="none"
                     initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
                   />
                 )}
               </g>

               {/* --- HUB PATHS --- */}
               <g className={`transition-opacity duration-500 ${scenario === "hub" ? 'opacity-100' : 'opacity-20'}`}>
                 <path d="M 150 100 Q 250 150 400 200" stroke="var(--line-strong)" strokeWidth="3" fill="none" />
                 <path d="M 150 200 L 400 200" stroke="var(--line-strong)" strokeWidth="3" fill="none" />
                 <path d="M 150 300 Q 250 250 400 200" stroke="var(--line-strong)" strokeWidth="3" fill="none" />
                 <path d="M 400 200 C 500 200, 550 200, 650 200" stroke="var(--line-strong)" strokeWidth="6" strokeDasharray="10 10" fill="none" />
                 
                 {!isAnalyzing && scenario === "hub" && (
                   <>
                     <motion.path d="M 150 100 Q 250 150 400 200" stroke="var(--primary)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                     <motion.path d="M 150 200 L 400 200" stroke="var(--primary)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }} />
                     <motion.path d="M 150 300 Q 250 250 400 200" stroke="var(--primary)" strokeWidth="3" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.4 }} />
                     <motion.path 
                       d="M 400 200 C 500 200, 550 200, 650 200" 
                       stroke="var(--primary)" strokeWidth="6" fill="none"
                       initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 1.5 }}
                     />
                   </>
                 )}
               </g>
            </svg>

            {/* Nodes */}
            <div className="absolute left-[15%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-white border border-[var(--line-strong)] rounded-full flex items-center justify-center shadow-sm z-10">
                 <Sprout className="text-[var(--success)]" size={24} />
              </div>
              <span className="text-xs font-semibold mt-2 text-[var(--ink)] bg-white/80 px-2 py-0.5 rounded">Farmer(s)</span>
            </div>

            {/* Conditional Hub Node */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 ${scenario === "hub" ? 'opacity-100 scale-100' : 'opacity-40 scale-90 grayscale'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg z-10 relative ${scenario === "hub" ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-500'}`}>
                 <Box size={32} />
                 {scenario === "hub" && !isAnalyzing && <div className="pulse-ring w-full h-full top-0 left-0" />}
              </div>
              <span className="text-xs font-bold mt-2 text-[var(--ink)] bg-white/80 px-2 py-0.5 rounded">Optional Hub</span>
            </div>

            <div className="absolute left-[85%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-14 h-14 bg-white border border-[var(--line-strong)] rounded-full flex items-center justify-center shadow-sm z-10">
                 <Store className="text-[var(--info)]" size={28} />
              </div>
              <span className="text-xs font-semibold mt-2 text-[var(--ink)] bg-white/80 px-2 py-0.5 rounded">Buyer</span>
            </div>

            <div className="absolute bottom-4 right-4 text-[10px] bg-[var(--bg-subtle)] text-[var(--ink-muted)] px-3 py-1.5 rounded-full font-medium">
              Demo Simulation
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-[var(--ink)]">Not every shipment needs a hub.</h3>
          <p className="text-lg text-[var(--ink-soft)] mt-3">KisanSetu chooses the route that makes the most sense. Direct pickup when it's efficient. Hub-based consolidation when it saves resources.</p>
        </div>
      </div>
    </section>
  );
};

const Section06SmartHub = () => {
  return (
    <section className="py-32 bg-[var(--bg)]">
      <div className="container max-w-4xl">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="eyebrow">06 / Strategic Consolidation</span>
          <h2 className="h2 mt-4">Hubs multiply efficiency.</h2>
          <p className="body mt-4 max-w-2xl mx-auto">When activated by the logistics engine, hubs combine small local supplies into a single, optimized long-distance shipment.</p>
        </div>

        <div className="flex flex-col items-center gap-6 glass-panel p-10 rounded-3xl border border-[var(--line)]">
           <div className="flex justify-between w-full max-w-lg mb-8 relative">
              <div className="w-full absolute top-1/2 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30" />
              <div className="flex flex-col items-center z-10"><Sprout className="text-[var(--success)] bg-[var(--bg)] rounded-full p-1" size={32} /><span className="text-xs font-bold mt-1 text-[var(--ink-soft)]">400 kg</span></div>
              <div className="flex flex-col items-center z-10"><Sprout className="text-[var(--success)] bg-[var(--bg)] rounded-full p-1" size={32} /><span className="text-xs font-bold mt-1 text-[var(--ink-soft)]">300 kg</span></div>
              <div className="flex flex-col items-center z-10"><Sprout className="text-[var(--success)] bg-[var(--bg)] rounded-full p-1" size={32} /><span className="text-xs font-bold mt-1 text-[var(--ink-soft)]">300 kg</span></div>
           </div>

           <ArrowDownRight size={24} className="text-[var(--ink-muted)] mb-2" />

           <div className="bg-[var(--primary-strong)] text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-4">
              <Box size={32} className="text-[var(--accent)]" />
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-80">Smart Hub</div>
                <div className="text-xl font-bold">1,000 kg consolidated</div>
              </div>
           </div>

           <div className="w-1 h-8 bg-gradient-to-b from-[var(--primary-strong)] to-transparent my-2" />

           <div className="bg-[var(--success-soft)] border border-[var(--success)] text-[var(--success)] px-6 py-3 rounded-full font-bold flex items-center gap-2">
              <Truck size={18} /> 1 Optimized Shipment
           </div>

           <div className="mt-8 text-xs text-[var(--ink-muted)] bg-[var(--bg-subtle)] px-3 py-1 rounded">Illustrative demo scenario</div>
        </div>
      </div>
    </section>
  );
};

const Section07DataStory = () => {
  return (
    <section className="py-32 bg-[var(--surface)] border-y border-[var(--line)]">
      <div className="container">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="eyebrow">07 / Data Story</span>
          <h2 className="h2 mt-4">The value of a direct connection.</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Chart 1 */}
          <FadeIn className="card card-pad relative overflow-hidden">
            <h3 className="h3 mb-1">Value Retention</h3>
            <p className="meta mb-8">Farmer returns via traditional vs direct models</p>
            
            <div className="flex h-40 items-end gap-6 justify-center">
              <div className="w-24 flex flex-col justify-end items-center gap-2">
                <motion.div initial={{ height: 0 }} whileInView={{ height: '40%' }} transition={{ duration: 1 }} className="w-full bg-[var(--line-strong)] rounded-t-lg" />
                <span className="text-xs text-[var(--ink-soft)] text-center leading-tight font-medium">Traditional<br/>Return</span>
              </div>
              <div className="w-24 flex flex-col justify-end items-center gap-2">
                <motion.div initial={{ height: 0 }} whileInView={{ height: '85%' }} transition={{ duration: 1, delay: 0.3 }} className="w-full bg-[var(--primary)] rounded-t-lg shadow-lg relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--primary-strong)] text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Higher</div>
                </motion.div>
                <span className="text-xs font-bold text-[var(--ink)] text-center leading-tight">KisanSetu<br/>Return</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 text-[10px] text-[var(--ink-muted)] bg-[var(--bg-subtle)] px-2 py-1 rounded">Illustrative example</div>
          </FadeIn>

          {/* Chart 2 */}
          <FadeIn delay={0.2} className="card card-pad relative overflow-hidden">
            <h3 className="h3 mb-1">Logistics Efficiency</h3>
            <p className="meta mb-8">Empty trips and redundant mileage</p>
            
            <div className="space-y-6 mt-4">
              <div>
                <div className="flex justify-between text-xs mb-2 text-[var(--ink-soft)]"><span>Unoptimized Transport</span></div>
                <div className="h-4 bg-[var(--line)] rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1 }} className="h-full bg-[var(--error)] opacity-60" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2 font-semibold text-[var(--ink)]"><span>KisanSetu Engine</span> <span className="text-[var(--success)]">Reduced</span></div>
                <div className="h-4 bg-[var(--line)] rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} whileInView={{ width: '35%' }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-[var(--primary)]" />
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 text-[10px] text-[var(--ink-muted)] bg-[var(--bg-subtle)] px-2 py-1 rounded">Demo simulation</div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default function Story() {
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll();
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <PublicLayout eyebrow={t("story.eyebrow")}>
      {/* Global Scroll Progress */}
      <div className="hidden lg:block story-scroll-progress left-4 rounded-full">
        <motion.div className="story-scroll-indicator rounded-full" style={{ scaleY }} />
      </div>

      <Hero3D t={t} />
      <Section01Problem />
      <Section02Network />
      <Section03SupplyMeet />
      <Section0405LogisticsEngine />
      <Section06SmartHub />
      <Section07DataStory />
      
      {/* 08 / Final CTA */}
      <section className="py-40 bg-[var(--primary-strong)] text-white relative overflow-hidden text-center z-10">
        {/* Animated Network Background */}
        <div className="absolute inset-0 opacity-10">
           <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
             <motion.path d="M 0 500 Q 250 200, 500 500 T 1000 500" stroke="white" strokeWidth="1" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 3, repeat: Infinity }} />
             <motion.path d="M 0 800 Q 300 400, 600 800 T 1000 200" stroke="white" strokeWidth="1" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 4, repeat: Infinity }} />
           </svg>
        </div>
        
        <FadeIn className="relative z-10 max-w-3xl mx-auto px-6">
          <span className="eyebrow text-[var(--accent)] mb-6 justify-center">The Bigger Picture</span>
          <h2 className="text-4xl md:text-5xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>From Farm to Market, Connected.</h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">KisanSetu brings farmers, buyers, and intelligent logistics together in one connected ecosystem.</p>
          <Link href="/market-match" className="btn btn-lg bg-white text-[var(--primary-strong)] hover:bg-[var(--bg-subtle)] border-none">
            Find your market match <ArrowRight size={18} className="ml-2" />
          </Link>
        </FadeIn>
      </section>
    </PublicLayout>
  );
}

// Hero3D (Preserved from previous step but cleaned up)
const Hero3D = ({ t }: { t: any }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative h-[90vh] min-h-[800px] flex flex-col items-center pt-32 overflow-hidden bg-[var(--bg)] perspective-container">
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(var(--line-strong) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <motion.div style={{ opacity }} className="relative z-20 text-center px-6 max-w-4xl mx-auto mt-10">
        <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="eyebrow mb-6 justify-center">
          {t("story.section")}
        </motion.span>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl md:text-7xl font-semibold tracking-tight text-[var(--ink)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {t("story.h1a")} <em className="text-[var(--primary)] not-italic">{t("story.h1b")}</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg md:text-xl text-[var(--ink-soft)] max-w-2xl mx-auto">
          Connecting Farmers, Markets & Smarter Logistics.
        </motion.p>
      </motion.div>

      <div className="relative flex-1 w-full z-10 pointer-events-none preserve-3d flex items-center justify-center mt-12 md:mt-0">
        <motion.div style={{ y: y1, rotateX: 60, rotateZ: -45, scale: 1.1 }} className="relative w-[500px] h-[500px] preserve-3d opacity-30 md:opacity-100">
          <div className="absolute inset-0 border border-[var(--primary-soft)] bg-[var(--surface)] shadow-2xl rounded-3xl" />
          <motion.div className="absolute top-1/4 left-1/4 w-16 h-16 bg-[var(--success-soft)] rounded-2xl border border-[var(--success)] shadow-lg flex items-center justify-center" style={{ transform: 'translateZ(40px) rotateX(-90deg)' }}><Sprout className="text-[var(--success)]" /></motion.div>
          <motion.div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-[var(--info-soft)] rounded-2xl border border-[var(--info)] shadow-lg flex items-center justify-center" style={{ transform: 'translateZ(60px) rotateX(-90deg)' }}><Store className="text-[var(--info)]" size={32} /></motion.div>
          <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[var(--primary-soft)] rounded-full border-2 border-[var(--primary)] shadow-xl flex items-center justify-center" style={{ transform: 'translateZ(80px) rotateX(-90deg)' }}><Package className="text-[var(--primary)]" size={40} /></motion.div>
          <svg className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(10px)' }}>
            <motion.path d="M 150 150 L 300 300" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.path d="M 300 300 L 450 450" stroke="var(--info)" strokeWidth="2" strokeDasharray="5,5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};
