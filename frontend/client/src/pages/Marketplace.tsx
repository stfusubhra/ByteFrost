/* KisanSetu Marketplace — rebuilt with shadcn/ui components.
 *
 * Aligned with the problem statement's expected solution:
 *   1. Direct connect — consumers and bulk buyers shop the same grid fed
 *      straight from farmers/FPOs (real backend listings only).
 *   2. Logistics support — every lot carries location/quantity context and
 *      the listing detail powers the real order flow.
 *   3. AI demand forecasting — honest pointer to the live buyer insights
 *      dashboard (no fabricated chart numbers here).
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Info,
  Leaf,
  MapPin,
  PackageCheck,
  Route,
  Search,
  SlidersHorizontal,
  Sparkles,
  Truck,
} from "lucide-react";

import { fetchListings, ApiError } from "@/lib/api";
import {
  type MarketListing,
  mapBackendListing,
} from "@/lib/marketplace-data";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Marketplace() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const isDemoMode = location.startsWith("/demo");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("recommended");
  const [readyOnly, setReadyOnly] = useState(false);
  const [freshOnly, setFreshOnly] = useState(false);

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendListings = await fetchListings({
        crop_name: debouncedQuery || undefined,
        limit: 20,
      });
      setListings(backendListings.map(mapBackendListing));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${t("marketplace.backendError")}: ${err.message} (${err.status})`);
      } else {
        setError(t("marketplace.backendError"));
      }
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const categories = [
    { key: "all", label: t("marketplace.categoryAll") },
    { key: "vegetables", label: t("marketplace.categoryVegetables") },
    { key: "fruits", label: t("marketplace.categoryFruits") },
    { key: "grains", label: t("marketplace.categoryGrains") },
    { key: "dairy", label: t("marketplace.categoryDairy") },
  ];

  const filtered = useMemo(() => {
    return listings
      .filter((item) => {
        const text = `${item.crop} ${item.place} ${item.grade} ${item.seller}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesCategory = category === "all" || item.category === category;
        const days =
          item.harvest && item.harvest !== "Harvest date TBA"
            ? Math.floor((Date.now() - new Date(item.harvest).getTime()) / 86400000)
            : 99;
        const readyMatch = !readyOnly || item.status === "Ready to move";
        const freshMatch = !freshOnly || days <= 3;
        return matchesQuery && matchesCategory && readyMatch && freshMatch;
      })
      .sort((a, b) => {
        if (sortKey === "priceLow") return a.priceNum - b.priceNum;
        if (sortKey === "priceHigh") return b.priceNum - a.priceNum;
        return 0;
      });
  }, [listings, query, category, sortKey, readyOnly, freshOnly]);

  const openListing = (id: string) => {
    window.location.href = `/listing/${id}`;
  };

  return (
    <PublicLayout>
      {/* 1 · HERO */}
      <section className="relative overflow-hidden bg-background">
        <div className="container grid gap-10 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="flex flex-col items-start gap-5">
            <Badge variant="secondary" className="w-fit gap-1.5 text-xs font-medium">
              <Leaf className="size-3.5" />
              {t("marketplace.eyebrow")}
            </Badge>
            <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl lg:text-6xl leading-[1.1] font-bold tracking-tight">
              {t("marketplace.h1a")}{" "}
              <span className="text-primary">{t("marketplace.h1b")}</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("marketplace.p")}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => { window.location.href = "/create-listing"; }}>
                {t("marketplace.listProduce")} <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/buyer-dashboard">
                  <PackageCheck className="size-4" />
                  {t("marketplace.bulkBuyers")}
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Leaf className="size-3.5 text-primary" /> {t("marketplace.trustFresh")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-3.5 text-primary" /> {t("marketplace.trustDirect")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> {t("marketplace.trustFair")}
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10" />
            <img
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80"
              alt="Fresh vegetables straight from the farm"
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {isDemoMode && (
        <section className="border-b bg-primary/5">
          <div className="container flex items-start gap-3 py-4">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-foreground">{t("marketplace.demoModeTitle")}</p>
              <p className="text-muted-foreground">{t("marketplace.demoModeBody")}</p>
            </div>
          </div>
        </section>
      )}

      <Separator />

      {/* 2 · OFFER + BULK BAND */}
      <section className="bg-card py-12">
        <div className="container grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="mb-2 w-fit">
                {t("marketplace.offerEyebrow")}
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">
                {t("marketplace.offerTitle")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("marketplace.offerSub")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <Leaf className="size-3.5" /> {t("marketplace.trustFresh")}
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Truck className="size-3.5" /> {t("marketplace.trustDirect")}
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <PackageCheck className="size-3.5" /> {t("marketplace.trustFair")}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageCheck className="size-4 text-primary" />
                {t("marketplace.bulkCardTitle")}
              </CardTitle>
              <CardDescription>{t("marketplace.bulkCardP")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{t("marketplace.bulkTag1")}</Badge>
                <Badge variant="outline">{t("marketplace.bulkTag2")}</Badge>
                <Badge variant="outline">{t("marketplace.bulkTag3")}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3 · DATA-SOURCE NOTICE */}
      {error && (
        <section className="container pt-6">
          <div className="flex flex-col items-start gap-3 rounded-md border border-error/40 bg-error/5 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              <span className="font-medium text-foreground">{t("marketplace.backendError")}</span>
              {" — "}
              {error}
            </span>
            <Button variant="outline" size="sm" onClick={loadListings}>
              {t("marketplace.retry")}
            </Button>
          </div>
        </section>
      )}

      {/* 4 · TOOLBAR */}
      <section className="container py-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center md:justify-end md:gap-4">
              {/* Search */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="mp-search"
                  name="mp-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("marketplace.searchPlaceholder")}
                  aria-label={t("marketplace.searchAria")}
                  className="pl-9"
                />
              </div>

              {/* Sort */}
              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="w-full sm:w-48" name="mp-sort" aria-label={t("marketplace.sortBy")}>
                  <SelectValue placeholder={t("marketplace.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">{t("marketplace.sortRecommended")}</SelectItem>
                  <SelectItem value="priceLow">{t("marketplace.sortPriceLow")}</SelectItem>
                  <SelectItem value="priceHigh">{t("marketplace.sortPriceHigh")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Filters */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="size-4" />
                    {t("marketplace.filters")}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>{t("marketplace.filters")}</SheetTitle>
                    <SheetDescription>{t("marketplace.filterSupplyDesc")}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{t("marketplace.fReady")}</p>
                        <p className="text-xs text-muted-foreground">{t("marketplace.fReadyDesc")}</p>
                      </div>
                      <Switch checked={readyOnly} onCheckedChange={setReadyOnly} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{t("marketplace.fFresh")}</p>
                        <p className="text-xs text-muted-foreground">{t("marketplace.fFreshDesc")}</p>
                      </div>
                      <Switch checked={freshOnly} onCheckedChange={setFreshOnly} />
                    </div>
                    <Separator />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReadyOnly(false);
                        setFreshOnly(false);
                      }}
                    >
                      {t("marketplace.resetFilters")}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Category tabs */}
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/60">
              {categories.map((c) => (
                <TabsTrigger key={c.key} value={c.key} className="data-[state=active]:bg-background">
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* 5 · PRODUCT GRID */}
      <section className="container pb-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none" />
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-2/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">{t("marketplace.emptyTitle")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t("marketplace.emptyBody")}</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden border-border/60 transition-shadow hover:shadow-md"
              >
                <div className="relative cursor-pointer" onClick={() => openListing(item.id)}>
                  <img
                    src={item.image}
                    alt={item.crop}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <Badge variant="secondary" className="absolute right-3 top-3 bg-background/90 backdrop-blur">
                    {item.status}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="cursor-pointer" onClick={() => openListing(item.id)}>
                    <p className="font-semibold">{item.crop}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.grade}
                      <span className="mx-1.5">·</span>
                      {item.seller}
                    </p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {item.place}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <PackageCheck className="size-3" />
                      {item.quantity}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Route className="size-3" />
                    {item.route}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-primary">{item.price}</span>
                    <Button size="sm" onClick={() => openListing(item.id)}>
                      {t("marketplace.view")} <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 6 · AI DEMAND FORECAST */}
      <section className="border-y border-border/60 bg-card py-16">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="outline" className="mb-4 gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                {t("marketplace.aiEyebrow")}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("marketplace.aiH2")}
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
                {t("marketplace.aiP")}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-md border px-4 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t("marketplace.aiQuoteTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("marketplace.aiQuoteDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border px-4 py-3">
                  <Route className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t("marketplace.aiRouteTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("marketplace.aiRouteDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("marketplace.forecastCardTitle")}</CardTitle>
                <CardDescription className="text-xs">{t("marketplace.forecastCardDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4 text-primary" />
                  {t("marketplace.aiBadge")}
                </div>
                <Button asChild>
                  <Link href="/buyer/insights">
                    {t("marketplace.forecastCta")} <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 7 · LOGISTICS BAND */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">{t("marketplace.logEyebrow")}</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("marketplace.logH2")}</h2>
            <p className="mt-3 text-muted-foreground">{t("marketplace.logP")}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="border-border/60 text-center">
              <CardContent className="pt-8">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Route className="size-5" />
                </div>
                <p className="text-3xl font-bold">Optimized</p>
                <p className="mt-1 text-sm font-medium">{t("marketplace.logStat1Title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("marketplace.logStat1Desc")}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 text-center">
              <CardContent className="pt-8">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Truck className="size-5" />
                </div>
                <p className="text-3xl font-bold">1 route</p>
                <p className="mt-1 text-sm font-medium">{t("marketplace.logStat2Title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("marketplace.logStat2Desc")}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 text-center">
              <CardContent className="pt-8">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PackageCheck className="size-5" />
                </div>
                <p className="text-3xl font-bold">FPO→Buyer</p>
                <p className="mt-1 text-sm font-medium">{t("marketplace.logStat3Title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("marketplace.logStat3Desc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}