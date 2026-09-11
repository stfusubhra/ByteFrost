/* KisanSetu Solutions — maps the DPI-era problem statement to what we build.
 *
 * Problem: farmers/FPOs lose margin to middlemen, consumers overpay, and
 * supply-chain logistics is fragmented.
 * Solution: one platform that (1) connects farmers/FPOs directly with
 * consumers and bulk buyers, (2) provides logistics support, and (3) uses AI
 * for demand forecasting and route optimization.
 */
import React from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  LineChart,
  Route,
  ShoppingBasket,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
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

export default function Solutions() {
  const { t } = useLanguage();

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
        <div className="container grid min-h-[70vh] items-center gap-12 py-16 lg:grid-cols-2">
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
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* 2 · PROBLEM */}
      <section className="bg-card py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("solutions.problem.label")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("solutions.problem.h2")}
            </h2>
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

      {/* 4 · IMPACT */}
      <section className="bg-card py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("solutions.impact.label")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("solutions.impact.h2")}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
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
        </div>
      </section>

      <Separator />

      {/* 5 · HOW IT WORKS */}
      <section className="py-20">
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

      {/* 6 · CLOSING CTA */}
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
            {t("solutions.closing.h2")}
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">{t("solutions.closing.p")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/marketplace">
                {t("solutions.ctaMarketplace")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link href="/story">{t("nav.story")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}