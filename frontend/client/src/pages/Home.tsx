import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Leaf,
  ShoppingCart,
  Users,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useReveal } from "../hooks/useReveal";
import { fetchListings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const img = {
  hero: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1600&q=80",
  field: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80",
  crates: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&q=80",
};

type PreviewRow = {
  id: string;
  crop: string;
  location: string;
  quantity: string;
  price: string;
  status: string;
};

const FALLBACK_ROWS: PreviewRow[] = [
  { id: "f1", crop: "Tomato · Grade A", location: "Nashik, MH", quantity: "500 kg", price: "₹45/kg", status: "Ready to move" },
  { id: "f2", crop: "Onion · Grade A", location: "Pune, MH", quantity: "300 kg", price: "₹25/kg", status: "Ready to move" },
  { id: "f3", crop: "Potato · Grade B", location: "Satara, MH", quantity: "400 kg", price: "₹18/kg", status: "Ready to move" },
];

const STEPS = [
  { icon: Users, key: "home.how.step1" },
  { icon: ShoppingCart, key: "home.how.step2" },
  { icon: TrendingUp, key: "home.how.step3" },
  { icon: CheckCircle2, key: "home.how.step4" },
] as const;

const WHY_ITEMS = [
  { icon: TrendingUp, key: "home.why.b1" },
  { icon: Shield, key: "home.why.b2" },
  { icon: Zap, key: "home.why.b3" },
] as const;

const TRUST_ITEMS = ["home.trust.1", "home.trust.2", "home.trust.3"] as const;

export default function Home() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PreviewRow[]>(FALLBACK_ROWS);
  useReveal({ threshold: 0.16, rootMargin: "0px 0px -12% 0px" });

  useEffect(() => {
    let alive = true;
    fetchListings({ limit: 6 })
      .then((listings) => {
        if (!alive || !listings?.length) return;
        setRows(
          listings.map((l) => ({
            id: l.id,
            crop: l.variety ? `${l.crop_name} · ${l.variety}` : l.crop_name,
            location: l.pickup_location ?? "—",
            quantity: `${l.quantity_kg} kg`,
            price: l.price_per_kg != null ? `₹${l.price_per_kg}/kg` : "—",
            status: l.is_active ? "Ready to move" : "Inactive",
          }))
        );
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <PublicLayout>
      <main>
        {/* 1 · HERO */}
        <section className="relative overflow-hidden bg-[var(--bg)]">
          <div className="container grid min-h-[85vh] items-center gap-12 py-16 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col gap-6 z-10">
              <Badge variant="secondary" className="w-fit gap-1.5 text-xs font-medium">
                <Leaf size={13} />
                {t("home.hero.eyebrow")}
              </Badge>

              <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
                {t("home.hero.h1a")}
                <br />
                <span className="text-primary">{t("home.hero.h1b")}</span>
              </h1>

              <p className="max-w-lg text-base text-muted-foreground leading-relaxed sm:text-lg">
                {t("home.hero.p")}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/marketplace">
                    {t("home.hero.cta1")} <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signup">{t("home.hero.cta2")}</Link>
                </Button>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                {TRUST_ITEMS.map((key) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-primary" />
                    {t(key)}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5" />
              <img
                src={img.hero}
                alt="A farmer standing in a green field at harvest time"
                fetchPriority="high"
                className="relative rounded-2xl object-cover shadow-xl w-full aspect-[4/3]"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* 2 · HOW IT WORKS */}
        <section className="py-20 bg-[var(--surface)]">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">
                {t("home.how.label")}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("home.how.h2")}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, key }, i) => (
                <Card key={key} className="relative overflow-hidden border-border/50 transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <CardTitle className="text-base">{t(`${key}.title`)}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {t(`${key}.p`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* 3 · MARKETPLACE PREVIEW */}
        <section className="py-20">
          <div className="container">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-3">
                  {t("home.preview.label")}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t("home.preview.h2")}
                </h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href="/marketplace">
                  {t("home.preview.viewAll")} <ArrowRight size={14} />
                </Link>
              </Button>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("home.preview.colCrop")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("home.preview.colLocation")}</TableHead>
                    <TableHead>{t("home.preview.colQty")}</TableHead>
                    <TableHead>{t("home.preview.colPrice")}</TableHead>
                    <TableHead className="text-right">{t("home.preview.colStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.crop}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} />
                          {r.location}
                        </span>
                      </TableCell>
                      <TableCell>{r.quantity}</TableCell>
                      <TableCell className="font-semibold text-primary">{r.price}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>

        <Separator />

        {/* 4 · WHY KISANSETU */}
        <section className="py-20 bg-[var(--surface)]">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">
                {t("home.why.label")}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("home.why.h2")}
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={img.field}
                  alt="Green farmland stretching to the horizon"
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <div className="grid gap-6">
                {WHY_ITEMS.map(({ icon: Icon, key }) => (
                  <Card key={key} className="border-border/50 transition-shadow hover:shadow-md">
                    <CardHeader className="flex-row items-start gap-4 pb-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{t(`${key}.title`)}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pl-[72px]">
                      <CardDescription className="text-sm leading-relaxed">
                        {t(`${key}.p`)}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 5 · STATS BAND */}
        <section className="py-16">
          <div className="container">
            <div className="grid gap-6 sm:grid-cols-3">
              {([
                { icon: BarChart3, label: "home.trust.1", value: "10,000+" },
                { icon: Users, label: "home.trust.2", value: "5,000+" },
                { icon: MapPin, label: "home.trust.3", value: "200+" },
              ] as const).map(({ icon: Icon, label, value }) => (
                <Card key={label} className="border-border/50 text-center">
                  <CardContent className="pt-6">
                    <Icon size={24} className="mx-auto mb-3 text-primary" />
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(label)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 6 · FINAL CTA */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("home.closing.h2")}
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              {t("home.hero.p")}
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/signup">
                {t("home.closing.cta")} <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
