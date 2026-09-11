import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisan Setu - Farm to Market",
  description:
    "AI-powered direct farm-to-market supply-chain platform connecting farmers directly with buyers",
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
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}