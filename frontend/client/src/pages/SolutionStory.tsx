/* KisanSetu — Our Story. Concise single-page narrative: hero, problem, solution, about. */
import React from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  Route,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Mail,
  MapPin,
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

  return (
    <PublicLayout>
      {/* 1 · HERO */}
      <section className="relative overflow-hidden">
        <div className="container grid min-h-[70vh] items-center gap-10 py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Badge variant="secondary" className="w-fit gap-1.5 text-xs font-medium">
              <Sprout className="size-3.5" />
              {t("story.section")}
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

      {/* 2 · PROBLEM — 3 cards, compact */}
      <section className="bg-card py-14">
        <div className="container">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <Badge variant="outline" className="mb-3">{t("story.problem.label")}</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("story.problem.h2a")}{" "}
              <span className="text-primary">{t("story.problem.h2c")}</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Sprout, title: t("solutions.problem.p1Title"), desc: t("solutions.problem.p1"), color: "primary" },
              { icon: Handshake, title: t("solutions.problem.p2Title"), desc: t("solutions.problem.p2"), color: "accent" },
              { icon: Route, title: t("solutions.problem.p3Title"), desc: t("solutions.problem.p3"), color: "muted" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className="border-border/60">
                <CardHeader className="pb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${color}/10 text-${color}`}>
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-sm">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · SOLUTION PILLARS + IMPACT */}
      <section className="py-14">
        <div className="container">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <Badge variant="outline" className="mb-3">{t("solutions.solution.label")}</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("solutions.solution.h2")}</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mb-12">
            {[
              { icon: Handshake, title: t("solutions.connect.title"), desc: t("solutions.connect.desc"), pts: [t("solutions.connect.p1"), t("solutions.connect.p2"), t("solutions.connect.p3")] },
              { icon: Truck, title: t("solutions.logistics.title"), desc: t("solutions.logistics.desc"), pts: [t("solutions.logistics.p1"), t("solutions.logistics.p2"), t("solutions.logistics.p3")] },
              { icon: Sparkles, title: t("solutions.ai.title"), desc: t("solutions.ai.desc"), pts: [t("solutions.ai.p1"), t("solutions.ai.p2"), t("solutions.ai.p3")] },
            ].map(({ icon: Icon, title, desc, pts }) => (
              <Card key={title} className="border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-sm">{title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1.5">
                  {pts.map((p) => (
                    <div key={p} className="flex items-start gap-1.5 text-xs">
                      <BadgeCheck className="mt-0.5 size-3 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{t(p)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Impact strip — compact */}
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { icon: TrendingUp, label: t("solutions.impact.farmer"), value: t("solutions.impact.farmerValue"), pct: 82 },
              { icon: TrendingDown, label: t("solutions.impact.consumer"), value: t("solutions.impact.consumerValue"), pct: 45 },
              { icon: Route, label: t("solutions.impact.chains"), value: t("solutions.impact.chainsValue"), pct: 30 },
            ].map(({ icon: Icon, label, value, pct }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{t(label)}</p>
                  <p className="text-lg font-bold leading-none">{value}</p>
                  <Progress value={pct} className="mt-1.5 h-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* 4 · ABOUT / MISSION / CONTACT */}
      <section className="py-14">
        <div className="container max-w-3xl">
          <div className="mx-auto mb-8 text-center">
            <Badge variant="outline" className="mb-3">{t("about.eyebrow")}</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("about.h1")}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground font-medium">{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("about.mission")}
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {t("about.mission.p")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 text-primary shrink-0" />
              <span>hello@kisansetu.in</span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3" />
                {t("footer.contact.locations")}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/marketplace">
                  {t("story.exploreMarketplace")} <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t("solutions.ctaSignup")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 5 · CLOSING CTA */}
      <section className="bg-primary py-14 text-primary-foreground">
        <div className="container mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("story.sec8.h2")}
          </h2>
          <p className="mt-3 text-primary-foreground/80">{t("story.sec8.p")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
