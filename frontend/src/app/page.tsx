export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
      <div className="space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-green-800">
          Direct Farm to Market
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          An AI-powered supply-chain platform connecting farmers and FPOs
          directly with buyers and consumers. Reduce intermediaries, improve
          farmer earnings, and lower consumer prices.
        </p>
      </div>

      <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="mb-3 text-3xl">🌾</div>
          <h3 className="mb-2 font-semibold text-green-800">For Farmers</h3>
          <p className="text-sm text-gray-500">
            List your produce, get fair prices, and connect directly with
            buyers. No more intermediaries eating your margins.
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="mb-3 text-3xl">🏪</div>
          <h3 className="mb-2 font-semibold text-green-800">For Buyers</h3>
          <p className="text-sm text-gray-500">
            Browse fresh produce, get AI-powered matching, and optimize your
            procurement with transparent pricing.
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="mb-3 text-3xl">🚛</div>
          <h3 className="mb-2 font-semibold text-green-800">For Logistics</h3>
          <p className="text-sm text-gray-500">
            Optimized routes, consolidated shipments, and reduced empty
            trips. AI-powered logistics planning.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <a
          href="/register"
          className="rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
        >
          Get Started
        </a>
        <a
          href="/marketplace"
          className="rounded-lg border border-green-600 px-6 py-3 text-sm font-medium text-green-600 hover:bg-green-50"
        >
          Browse Marketplace
        </a>
      </div>
    </div>
  );
}
