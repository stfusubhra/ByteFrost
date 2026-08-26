import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ByteFrost - Farm to Market",
  description:
    "AI-powered direct farm-to-market supply-chain platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-green-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
              <h1 className="text-xl font-bold text-green-700">
                ByteFrost
              </h1>
              <nav className="flex gap-4 text-sm">
                <a href="/" className="hover:text-green-600">
                  Home
                </a>
                <a href="/marketplace" className="hover:text-green-600">
                  Marketplace
                </a>
                <a href="/dashboard" className="hover:text-green-600">
                  Dashboard
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
