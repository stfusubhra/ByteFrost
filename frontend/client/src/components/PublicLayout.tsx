/* KisanSetu public shell.
   Header + footer rebuilt with shadcn/ui components:
   - Desktop nav: NavigationMenu; Mobile nav: Sheet drawer.
   - User menu: DropdownMenu + Avatar.
   - Theme + language controls.
   Aligned to the DPI-era problem statement: marketplace, solutions with
   logistics and AI forecast surface as first-class destinations. */
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Handshake,
  LineChart,
  LogOut,
  MapPin,
  Menu,
  Sprout,
  Truck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useReveal } from "../hooks/useReveal";
import LanguageSelector from "./LanguageSelector";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [pathname] = useLocation();
  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hasToken = isAuthenticated || !!(
    typeof window !== "undefined" && localStorage.getItem("kisansetu_token")
  );

  const dashboardHref =
    isAuthenticated && user?.role === "buyer" ? "/buyer-dashboard" : "/dashboard";

  const handleLogout = () => {
    localStorage.removeItem("kisansetu_token");
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/marketplace", label: t("nav.marketplace") },
    { href: "/solution-story", label: t("nav.solutionStory") },
    { href: "/faq", label: t("nav.faq") },
  ];

  const initials = (user?.full_name || "KS")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      {/* ───────────────── Header ───────────────── */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
          scrolled && "shadow-sm"
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="KisanSetu home"
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sprout className="size-4" />
            </span>
            <span className="font-[var(--font-display)] text-lg font-bold tracking-tight">
              KisanSetu
            </span>
          </Link>

          {/* Desktop nav */}
          <NavigationMenu viewport={false} className="hidden lg:flex">
            <NavigationMenuList>
              {navLinks.map((l) => (
                <NavigationMenuItem key={l.href}>
                  <NavigationMenuLink
                    asChild
                    active={pathname === l.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent",
                      pathname === l.href &&
                        "data-[active]:bg-accent/60 data-[active]:text-accent-foreground"
                    )}
                  >
                    <Link href={l.href}>{l.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden items-center gap-1.5 lg:flex">
            <LanguageSelector variant="dark" />

            {hasToken ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Account menu">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-24 truncate text-sm font-medium xl:inline">
                      {user?.full_name || t("nav.welcome")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>{t("nav.account")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref} className="cursor-pointer">
                      <User className="size-4" />
                      {t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="size-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">{t("nav.signin")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">{t("nav.signup")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <LanguageSelector variant="dark" />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("common.openMenu")}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86%] max-w-sm p-0">
                <SheetHeader className="border-b px-4 py-3 text-left">
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Sprout className="size-3.5" />
                    </span>
                    KisanSetu
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    {t("common.openMenu")}
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-1 px-3 py-4">
                  {navLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === l.href && "bg-accent/60 text-accent-foreground"
                      )}
                    >
                      {l.label}
                    </Link>
                  ))}

                  <Separator className="my-3" />

                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("footer.account")}
                  </p>
                  {hasToken ? (
                    <>
                      <Link
                        href={dashboardHref}
                        className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        {t("nav.dashboard")}
                      </Link>
                      <Button variant="ghost" className="justify-start px-3 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                        <LogOut className="size-4" />
                        {t("nav.logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        {t("nav.signin")}
                      </Link>
                      <Button size="sm" className="mt-1 w-full justify-start" asChild>
                        <Link href="/signup">
                          {t("nav.signup")} <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </>
                  )}
                </div>

                <div className="mt-auto border-t px-5 py-4">
                  <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
                  <a href="mailto:hello@kisansetu.in" className="mt-1 inline-block text-sm font-medium text-primary">
                    hello@kisansetu.in
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">{children}</main>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="border-t border-border/70 bg-card">
        <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="flex flex-col items-start gap-3">
            <Link href="/" aria-label="KisanSetu home" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sprout className="size-4" />
              </span>
              <span className="font-[var(--font-display)] text-lg font-bold tracking-tight">
                KisanSetu
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.brand.p")}
            </p>
            <a href="mailto:hello@kisansetu.in" className="text-sm font-medium text-primary">
              hello@kisansetu.in
            </a>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">{t("footer.explore")}</p>
            <Link href="/marketplace" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.marketplace")}
            </Link>
            <Link href="/solution-story" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.solutionStory")}
            </Link>
            <Link href="/faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.faq")}
            </Link>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">{t("footer.about")}</p>
            <Link href="/solution-story" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.solutionStory")}
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.contact")}
            </Link>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {t("footer.contact.locations")}
            </span>
          </div>

          {/* Impact tagline */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Impact</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <Handshake className="size-3.5" /> {t("footer.how.farmers")}
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Truck className="size-3.5" /> {t("footer.how.logistics")}
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <LineChart className="size-3.5" /> {t("footer.how.ai")}
              </Badge>
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5">
              <Input
                id="newsletter-email"
                name="newsletter-email"
                type="email"
                className="h-9 max-w-44"
                placeholder={t("footer.newsletter.placeholder")}
                aria-label={t("footer.newsletter.placeholder")}
              />
              <Button size="sm">{t("footer.newsletter.cta")}</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60">
          <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} {t("footer.copyright")}</span>
            <span>{t("footer.built")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}