/* KisanSetu Solutions & Story — single-page experience merging solutions, story, and about.
 *
 * Consolidates the three separate pages into one flowing narrative:
 *   1. Hero — the promise
 *   2. Problem — why this exists
 *   3. Solution pillars — what we build
 *   4. Network — how it connects
 *   5. Intelligence — AI + data
 *   6. Logistics — how produce moves
 *   7. Impact — numbers that matter
 *   8. About / Mission — who we are
 *   9. CTA — get started
 */
import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  LineChart,
  Network,
  PackageCheck,
  Route,
  Ship,
  ShoppingBasket,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  ShieldCheck,
  MapPin,
  Loader2,
} from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function SolutionStory() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load for smooth transition
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Loading…</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const pillars = [
    {
      icon: Handshake,
      title: "solutions.connect.title",
      desc: "solutions.connect.desc",
      points: ["solutions.connect.p1", "solutions.connect.p2", "solutions.connect.p3"],
    },
    {
      icon: Truck,
      title: "solutions.logistics.title",
      desc: "solutions.logistics.desc",
      points: ["solutions.logistics.p1", "solutions.logistics.p2", "solutions.logistics.p3"],
    },
    {
      icon: Sparkles,
      title: "solutions.ai.title",
      desc: "solutions.ai.desc",
      points: ["solutions.ai.p1", "solutions.ai.p2", "solutions.ai.p3"],
    },
  ] as const;

  const impact = [
    {
      icon: TrendingUp,
      label: "solutions.impact.farmer",
      value: "solutions.impact.farmerValue",
      pct: 82,
      desc: "solutions.impact.farmerDesc",
    },
    {
      icon: TrendingDown,
      label: "solutions.impact.consumer",
      value: "solutions.impact.consumerValue",
      pct: 45,
      desc: "solutions.impact.consumerDesc",
    },
    {
      icon: Route,
      label: "solutions.impact.chains",
      value: "solutions.impact.chainsValue",
      pct: 30,
      desc: "solutions.impact.chainsDesc",
    },
  ] as const;

  const steps = [
    { icon: Sprout, title: "solutions.how1.title", desc: "solutions.how1.desc" },
    { icon: LineChart, title: "solutions.how2.title", desc: "solutions.how2.desc" },
    { icon: Truck, title: "solutions.how3.title", desc: "solutions.how3.desc" },
    { icon: ShoppingBasket, title: "solutions.how4.title", desc: "solutions.how4.desc" },
  ] as const;

  return (
    <PublicLayout>
      {/* 1 · HERO */}
      <section className="relative overflow-hidden bg-background">
        <div className="container grid min-h-[75vh] items-center gap-12 py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit gap-1.5 text-xs font-medium">
              <Sprout className="size-3.5" />
              {t("solutions.eyebrow")}
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t("solutions.h1a")}
              <br />
              <span className="text-primary">{t("solutions.h1b")}</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("solutions.p")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/marketplace">
                  {t("solutions.ctaMarketplace")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">{t("solutions.ctaSignup")}</Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5" />
            <img
              src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&q=80"
              alt={t("solutions.heroImgAlt")}
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* 2 · PROBLEM */}
      <section className="bg-card py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("story.problem.label")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("story.problem.h2a")} <br />
              {t("story.problem.h2b")} <br />
              <span className="text-primary">{t("story.problem.h2c")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {t("story.problem.p1")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sprout className="size-5" />
                </div>
                <CardTitle className="text-base">{t("solutions.problem.p1Title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {t("solutions.problem.p1")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                  <ShoppingBasket className="size-5" />
                </div>
                <CardTitle className="text-base">{t("solutions.problem.p2Title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {t("solutions.problem.p2")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Route className="size-5" />
                </div>
                <CardTitle className="text-base">{t("solutions.problem.p3Title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {t("solutions.problem.p3")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* 3 · SOLUTION PILLARS */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("solutions.solution.label")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("solutions.solution.h2")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("solutions.solution.p")}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {pillars.map(({ icon: Icon, title, desc, points }) => (
              <Card key={title} className="flex flex-col border-border/60 transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{t(title)}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{t(desc)}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-2.5">
                  {points.map((p) => (
                    <div key={p} className="flex items-start gap-2 text-sm">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{t(p)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* 4 · NETWORK */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("story.sec2.eyebrow")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("story.sec2.h2")}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {t("story.sec2.p")}
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="relative flex-1 bg-background p-8">
                <svg className="w-full max-h-[320px]" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
                  <line x1="300" y1="150" x2="80" y2="60" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                  <line x1="300" y1="150" x2="80" y2="240" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                  <line x1="300" y1="150" x2="520" y2="80" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                  <line x1="300" y1="150" x2="520" y2="150" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                  <line x1="300" y1="150" x2="520" y2="220" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
                  <circle cx="80" cy="60" r="6" fill="var(--primary)" opacity="0.8" />
                  <text x="80" y="40" textAnchor="middle" fill="var(--ink)" fontSize="12" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">FARMER</text>
                  <circle cx="520" cy="80" r="5" fill="var(--ink-soft)" />
                  <text x="520" y="65" textAnchor="middle" fill="var(--ink-soft)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">BUYER</text>
                  <circle cx="520" cy="150" r="5" fill="var(--ink-soft)" />
                  <text x="520" y="135" textAnchor="middle" fill="var(--ink-soft)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">BUYER</text>
                  <circle cx="520" cy="220" r="5" fill="var(--ink-soft)" />
                  <text x="520" y="205" textAnchor="middle" fill="var(--ink-soft)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">BUYER</text>
                  <circle cx="80" cy="240" r="6" fill="var(--primary)" opacity="0.8" />
                  <text x="80" y="270" textAnchor="middle" fill="var(--ink)" fontSize="12" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.05em">FARMER</text>
                  <circle cx="300" cy="150" r="12" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.5" />
                  <text x="300" y="154" textAnchor="middle" fill="var(--primary)" fontSize="10" fontFamily="var(--font-display)" fontWeight="400">KS</text>
                  <text x="300" y="190" textAnchor="middle" fill="var(--ink)" fontSize="11" fontFamily="var(--font-sans)" fontWeight="500" letterSpacing="0.08em">KISANSETU</text>
                </svg>
              </div>
              <div className="w-full border-t border-border/50 lg:w-80 lg:border-l lg:border-t-0 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Network size={16} className="text-primary" />
                    {t("story.sec2.eyebrow")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {[
                    { label: "FARMERS", desc: t("story.sec2.farmersDesc") },
                    { label: "BUYERS", desc: t("story.sec2.buyersDesc") },
                    { label: "LOGISTICS", desc: t("story.sec2.logisticsDesc") },
                  ].map((row) => (
                    <div key={row.label}>
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground">{row.label}</p>
                      <p className="text-sm text-foreground">{row.desc}</p>
                    </div>
                  ))}
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Separator />

      {/* 5 · INTELLIGENCE */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("story.sec3.eyebrow")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("story.sec3.h2")}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {t("story.sec3.p")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PackageCheck size={20} />
                </div>
                <CardTitle className="text-base">{t("story.sec3.availableSupply")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("home.preview.crop")} · 500 kg</Badge>
                <Badge variant="secondary">Onion · 320 kg</Badge>
                <Badge variant="secondary">Potato · 700 kg</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Handshake size={20} />
                </div>
                <CardTitle className="text-base">{t("story.sec3.buyerRequest")}</CardTitle>
                <CardDescription>{t("story.sec3.orderTitle")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-sm font-medium">{t("home.preview.demand")}</span>
                </div>
                <Badge variant="secondary">{t("home.preview.match")}</Badge>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground border-primary">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground">
                  <Ship size={20} />
                </div>
                <CardTitle className="text-base text-primary-foreground">{t("story.sec3.consolidatedOrder")}</CardTitle>
                <CardDescription className="text-primary-foreground/80">{t("story.sec3.orderTitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary-foreground/90 leading-relaxed">
                  {t("story.sec3.orderDesc")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: t("home.trust.1"), value: t("home.preview.badge") },
              { icon: LineChart, label: t("home.trust.2"), value: t("home.preview.price") },
              { icon: MapPin, label: t("home.trust.3"), value: "30 km" },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label} className="border-border/50 text-center">
                <CardContent className="pt-6">
                  <Icon size={22} className="mx-auto mb-3 text-primary" />
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* 6 · LOGISTICS */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("story.sec4.eyebrow")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("story.sec4.h2")}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {t("story.sec4.p")}
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="relative flex-1 bg-background p-8">
                <div className="flex items-center justify-between gap-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sprout size={20} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Farmer A</span>
                  </div>
                  <div className="flex flex-1 items-center">
                    <div className="h-0.5 flex-1 border-t-2 border-dashed border-primary" />
                    <MapPin size={18} className="text-primary" />
                    <div className="h-0.5 flex-1 border-t-2 border-dashed border-primary" />
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent-foreground">
                      <Building2Icon size={20} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">BUYER</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 border-t border-border/50 pt-6">
                  <Truck size={16} className="text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    1 route · 1 delivery · {t("story.sec4.recRouteSub")}
                  </span>
                </div>
              </div>
              <div className="w-full border-t border-border/50 lg:w-80 lg:border-l lg:border-t-0 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck size={16} className="text-primary" />
                    {t("story.sec4.recRoute")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">{t("story.sec4.directPickup")}</span>
                    <Badge variant="secondary">{t("story.sec4.oneRoute")}</Badge>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">{t("story.sec4.hubConsolidation")}</span>
                    <Badge variant="secondary">{t("story.sec4.threeRoutes")}</Badge>
                  </div>
                  <Separator />
                  <p className="text-sm text-foreground leading-relaxed">{t("story.sec4.directDesc")}</p>
                  <p className="text-sm text-foreground leading-relaxed">{t("story.sec4.hubDesc")}</p>
                </CardContent>
              </div>
            </div>
          </Card>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            {t("story.sec4.notEveryDesc")}
          </p>
        </div>
      </section>

      <Separator />

      {/* 7 · IMPACT / DATA STORY */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("story.sec7.eyebrow")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("story.sec7.h2")}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {t("story.sec7.p")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {impact.map(({ icon: Icon, label, value, pct, desc }) => (
              <Card key={label} className="border-border/60">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(label)}
                      </p>
                      <p className="text-2xl font-bold">{t(value)}</p>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-sm text-muted-foreground">{t(desc)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("story.sec7.valRet")}</CardTitle>
                <CardDescription>{t("story.sec7.valRetSub")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("story.sec7.tradModel")}</span>
                    <span className="font-semibold">~45%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[45%] rounded-full bg-muted-foreground/50" />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{t("story.sec7.directModel")}</span>
                    <span className="font-bold text-primary">~82%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[82%] rounded-full bg-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("story.sec7.marginComp")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("story.sec7.logEff")}</CardTitle>
                <CardDescription>{t("story.sec7.logEffSub")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("story.sec7.unopt")}</span>
                    <span className="font-semibold">100%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-full rounded-full bg-muted-foreground/50" />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{t("story.sec7.ksEngine")}</span>
                    <span className="font-bold text-primary">{t("story.sec7.reduced")} · 30%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[30%] rounded-full bg-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("story.sec7.routeComp")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* 8 · HOW IT WORKS */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("solutions.how.label")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("solutions.how.h2")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <Card key={title} className="relative overflow-hidden border-border/60">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <CardTitle className="text-base">{t(title)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{t(desc)}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* 9 · ABOUT / MISSION */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("about.eyebrow")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("about.h1")}
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <p className="text-lg leading-relaxed text-foreground">
                {t("about.p1")}
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t("about.p2")}
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-xl bg-card p-6 border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("about.mission")}
              </span>
              <p className="text-base font-medium text-foreground leading-relaxed">
                {t("about.mission.p")}
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-muted/40 border">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("about.contact")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("about.contact.p")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:hello@kisansetu.in"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                hello@kisansetu.in
              </a>
              <Button size="sm" variant="outline" asChild>
                <Link href="/marketplace">
                  {t("story.exploreMarketplace")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 10 · CLOSING CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary-foreground/30 text-primary-foreground"
          >
            <Users className="size-3.5" />
            Farmer · FPO · Bulk buyer · Consumer
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("story.sec8.h2")}
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            {t("story.sec8.p")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/marketplace">
                {t("home.hero.cta1")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link href="/signup">{t("home.hero.cta2")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Building2Icon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
