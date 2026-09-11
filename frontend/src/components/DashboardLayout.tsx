"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useMarketplaceStore } from "@/store/marketplace";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  Heart,
  Wallet,
  User,
  LogOut,
  Bell,
  Store,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "farmer" | "buyer";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const cart = useMarketplaceStore((s) => s.cart);
  const notifications = useMarketplaceStore((s) => s.notifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isFarmer = role === "farmer";

  const farmerNav: NavItem[] = [
    { href: "/farmer/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/farmer/listings", label: "My Listings", icon: <Package size={18} /> },
    { href: "/farmer/add-product", label: "Add Product", icon: <PlusCircle size={18} /> },
    { href: "/farmer/orders", label: "Orders", icon: <ShoppingCart size={18} /> },
    { href: "/farmer/earnings", label: "Earnings", icon: <Wallet size={18} /> },
    { href: "/profile", label: "Profile", icon: <User size={18} /> },
  ];

  const buyerNav: NavItem[] = [
    { href: "/buyer/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/marketplace", label: "Marketplace", icon: <Store size={18} /> },
    { href: "/buyer/cart", label: "Cart", icon: <ShoppingCart size={18} /> },
    { href: "/buyer/orders", label: "My Orders", icon: <Package size={18} /> },
    { href: "/buyer/favorites", label: "Favorites", icon: <Heart size={18} /> },
    { href: "/profile", label: "Profile", icon: <User size={18} /> },
  ];

  const nav = isFarmer ? farmerNav : buyerNav;
  const unreadCount = notifications.filter(
    (n) => n.user_id === user?.id && !n.read
  ).length;
  const cartCount = cart.reduce((sum, c) => sum + c.quantity_kg, 0);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-green-100 px-6 py-5">
        <Link href="/" className="text-xl font-bold text-green-700">
          Kisan Setu
        </Link>
        <button
          className="text-gray-500 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="border-b border-green-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.full_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {isFarmer ? "🌾 Farmer / Lister" : "🏪 Buyer"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.href === "/buyer/cart" && cartCount > 0 && (
                <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
              {item.href === "/farmer/orders" && unreadCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-green-100 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-green-100 bg-white md:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-green-100 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600"
          >
            <Menu size={22} />
          </button>
          <Link href="/" className="text-lg font-bold text-green-700">
            Kisan Setu
          </Link>
          <Link href={isFarmer ? "/farmer/orders" : "/buyer/orders"} className="relative text-gray-600">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
