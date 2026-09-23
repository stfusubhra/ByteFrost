/* KisanSetu account menu — the one clickable profile control.
 *
 * Shared by the public header (PublicLayout) and by both signed-in workspaces
 * (farmer dashboard top bar, buyer portal header) so the top-right corner
 * behaves identically everywhere.
 *
 * Contents are role-aware and every entry resolves to a real destination —
 * no dead links:
 *   - Farmer / FPO → the workspace sections, which the farmer dashboard
 *     switches in place via `onSelectSection`; elsewhere they deep-link to
 *     /dashboard. Plus "New listing" and the marketplace.
 *   - Buyer        → the buyer portal routes.
 *   - Any other role → its workspace + the marketplace.
 * Signing out clears the session and returns to the public site.
 */
import React from "react";
import { Link } from "wouter";
import {
  BadgeCheck,
  ChevronDown,
  LayoutDashboard,
  LineChart,
  LogOut,
  MapPinned,
  PackageCheck,
  PlusCircle,
  ShoppingCart,
  Sprout,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isBuyerRole, isFarmerRole, workspaceForRole } from "@/lib/roles";
import type { LocaleKeys } from "@/locales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** In-page sections of the farmer workspace, as exposed by the dashboard nav. */
export type WorkspaceSection = "overview" | "mylistings" | "orders" | "routes";

interface ProfileMenuProps {
  /** Show the user's name next to the avatar on wide viewports. */
  showName?: boolean;
  /** Extra classes for the trigger (e.g. compact sizes in a dashboard top bar). */
  className?: string;
  /** The farmer dashboard renders its sections as in-page tabs. When this is
   *  provided the menu switches sections instead of navigating away. */
  onSelectSection?: (section: WorkspaceSection) => void;
}

const ROLE_LABEL_KEYS: Record<string, LocaleKeys> = {
  farmer: "profile.role.farmer",
  fpo_manager: "profile.role.fpo_manager",
  buyer_bulk: "profile.role.buyer_bulk",
  buyer_retailer: "profile.role.buyer_retailer",
  consumer: "profile.role.consumer",
  logistics: "profile.role.logistics",
  admin: "profile.role.admin",
};

const FARMER_SECTIONS: { id: WorkspaceSection; label: LocaleKeys; icon: LucideIcon }[] = [
  { id: "overview", label: "profile.overview", icon: LayoutDashboard },
  { id: "mylistings", label: "profile.myListings", icon: Sprout },
  { id: "orders", label: "profile.orders", icon: PackageCheck },
  { id: "routes", label: "profile.routes", icon: MapPinned },
];

function initialsOf(name?: string | null, email?: string | null): string {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }
  return (email?.[0] || "U").toUpperCase();
}

export default function ProfileMenu({
  showName = false,
  className,
  onSelectSection,
}: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const buyer = isBuyerRole(user.role);
  const farmer = isFarmerRole(user.role);
  const roleLabelKey = ROLE_LABEL_KEYS[user.role];
  const initials = initialsOf(user.full_name, user.email);

  const handleSignOut = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-9 gap-2 px-2", className)}
          aria-label={t("profile.menu")}
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {showName && (
            <>
              <span className="hidden max-w-28 truncate text-sm font-medium xl:inline">
                {user.full_name || t("nav.welcome")}
              </span>
              <ChevronDown className="hidden size-3.5 opacity-60 xl:inline" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Who is signed in */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-start gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-sm font-semibold leading-tight">
                {user.full_name || t("nav.welcome")}
              </p>
              {user.phone && (
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {user.phone}
                </p>
              )}
              {user.email && (
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-medium">
              {roleLabelKey ? t(roleLabelKey) : user.role}
            </Badge>
            {user.is_verified ? (
              <Badge className="gap-1">
                <BadgeCheck className="size-3" />
                {t("profile.verified")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {t("profile.unverified")}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Role-aware destinations */}
        {farmer &&
          FARMER_SECTIONS.map(({ id, label, icon: Icon }) =>
            onSelectSection ? (
              <DropdownMenuItem
                key={id}
                className="cursor-pointer"
                onSelect={() => {
                  onSelectSection(id);
                }}
              >
                <Icon className="size-4" />
                {t(label)}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={id} asChild className="cursor-pointer">
                <Link href="/dashboard">
                  <Icon className="size-4" />
                  {t(label)}
                </Link>
              </DropdownMenuItem>
            )
          )}

        {farmer && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/create-listing">
              <PlusCircle className="size-4" />
              {t("profile.newListing")}
            </Link>
          </DropdownMenuItem>
        )}

        {buyer && (
          <>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/buyer-dashboard">
                <LayoutDashboard className="size-4" />
                {t("profile.buyerDashboard")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/buyer/procurement">
                <ShoppingCart className="size-4" />
                {t("profile.procurement")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/buyer/orders">
                <PackageCheck className="size-4" />
                {t("profile.buyerOrders")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/buyer/insights">
                <LineChart className="size-4" />
                {t("profile.insights")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/buyer/onboarding">
                <UserRound className="size-4" />
                {t("profile.buyerSetup")}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {!farmer && !buyer && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={workspaceForRole(user.role)}>
              <LayoutDashboard className="size-4" />
              {t("nav.dashboard")}
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/marketplace">
            <Store className="size-4" />
            {t("profile.marketplace")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={handleSignOut}
        >
          <LogOut className="size-4" />
          {t("profile.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
