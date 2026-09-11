import React from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Sprout,
  Handshake,
  Network,
  Radar,
  Truck,
  MapPin,
  ShieldCheck,
  LineChart,
  PackageCheck,
  Building2,
  Ship,
} from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";
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

export default function Story() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      {/* Chapter 1 — The Farmer */}
      <section className="relative overflow-hidden bg-[var(--bg)]">
        <div className="container grid min-h-[80vh] items-center gap-12 py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-6 z-10">
            <Badge variant="secondary" className="w-fit gap-1.5">
              <Sprout size={13} />
              {t("story.section")}
            </Badge>
            <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight leading-[1.1] sm:text-5xl lg:text-6xl">
              {t("story.h1a")}
              <br />
              <span className="text-primary">{t("story.h1b")}</span>
            </h1>
            <p className="max-w-lg text-base text-muted-foreground leading-relaxed sm:text-lg">
              {t("story.p")}
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5" />
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80"
              alt="Indian farmer harvesting tomatoes"
              loading="eager"
              fetchPriority="high"
              className="relative w-full rounded-2xl object-cover shadow-xl aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Chapter 2 — The Gap */}
      <section className="py-20 bg-[var(--surface)]">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("story.problem.label")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
              {t("story.problem.h2a")} <br />
              {t("story.problem.h2b")} <br />
              <span className="text-primary">{t("story.problem.h2c")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {t("story.problem.p1")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sprout size={20} />
                </div>
                <CardTitle className="text-base">FARMER</CardTitle>
                <CardDescription>{t("story.sec1.grows")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["SUPPLY", "PRICE", "LOCATION"].map((signal) => (
                  <Badge key={signal} variant="secondary">{signal}</Badge>
                ))}
              </CardContent>
            </Card>

            <div className="hidden md:flex flex-col items-center justify-center gap-2 px-4">
              <div className="h-full w-px border-l-2 border-dashed border-muted-foreground/40" />
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-foreground">GAP</span>
              <div className="h-full w-px border-l-2 border-dashed border-muted-foreground/40" />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                  <Building2 size={20} />
                </div>
                <CardTitle className="text-base">BUYER</CardTitle>
                <CardDescription>{t("story.sec1.pays")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["DEMAND", "TIMING", "QUALITY"].map((signal) => (
                  <Badge key={signal} variant="secondary">{signal}</Badge>
                ))}
              </CardContent>
            </Card>
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
            {t("story.problem.p2")}
          </p>
        </div>
      </section>

      <Separator />

      {/* Chapter 3 — KisanSetu Network */}
      <section className="py-20">
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
              <div className="relative flex-1 bg-[var(--bg)] p-8">
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
              <div className="w-full border-t border-border/50 lg:w-80 lg:border-l lg:border-t-0 bg-[var(--surface)]">
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

      {/* Chapter 4 — Intelligence */}
      <section className="py-20 bg-[var(--surface)]">
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
                  <Radar size={14} className="text-primary" />
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

      {/* Chapter 5 — Movement */}
      <section className="py-20">
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
              <div className="relative flex-1 bg-[var(--bg)] p-8">
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
                      <Building2 size={20} />
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
              <div className="w-full border-t border-border/50 lg:w-80 lg:border-l lg:border-t-0 bg-[var(--surface)]">
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
        </div>
      </section>

      <Separator />

      {/* Chapter 6 — Data story */}
      <section className="py-20 bg-[var(--surface)]">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("story.sec7.eyebrow")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("story.sec7.h2")}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {t("story.sec7.p")}
            </p>
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

      {/* Ending */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-primary-foreground/30 text-primary-foreground">
            {t("story.sec8.eyebrow")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {t("story.sec8.h2")}
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            {t("story.sec8.p")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/marketplace">
                {t("home.hero.cta1")} <ArrowRight size={16} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link href="/signup">{t("home.hero.cta2")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}