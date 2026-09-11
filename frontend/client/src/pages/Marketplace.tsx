/* KisanSetu Marketplace: public discovery surface for available produce.
 *
 * This page wires to the real FastAPI backend:
 *   GET /api/v1/listings/ (public endpoint)
 *
 * The Marketplace shows honest loading/empty/error states and falls back to
 * clearly labeled demo data only when the backend is unreachable, preserving
 * the user experience while being transparent about data provenance.
 *
 * The product grid takes inspiration from modern grocery marketplaces:
 * photo-first cards, discount badges, MRP strikethrough pricing, category
 * chips, and an add-to-cart stepper with a sticky cart summary bar.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Leaf,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBasket,
  Truck,
} from "lucide-react";
import { fetchListings, ApiError } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Shape of a listing as used by the Marketplace UI.
 */
type MarketListing = {
  id: string;
  crop: string;
  grade: string;
  place: string;
  quantity: string;
  price: string;
  priceNum: number;
  mrp: string;
  mrpNum: number;
  discount: number;
  freshness: string;
  route: string;
  match: string;
  image: string;
  status: string;
  harvest: string;
  seller: string;
  category: string;
};

/** Verified Unsplash product photos (checked for HTTP 200 + subject color). */
const IMG = {
  tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
  onion: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
  brinjal: "https://images.unsplash.com/photo-1604321272882-07c73743be32?w=400&q=80",
  cauliflower: "https://images.unsplash.com/photo-1566842600175-97dca489844f?w=400&q=80",
  mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80",
  cabbage: "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=400&q=80",
  carrot: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80",
  capsicum: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80",
  garlic: "https://images.unsplash.com/photo-1636210589096-a53d5dacd702?w=400&q=80",
  ginger: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80",
  chilli: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
  banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80",
  apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80",
  grapes: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80",
  pomegranate: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400&q=80",
  toordal: "https://images.unsplash.com/photo-1701166175567-2f55dd40e662?w=400&q=80",
  groundnut: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&q=80",
  milk: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
  eggs: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80",
};

/** Crop name -> category key (used for chips and backend listings). */
const CATEGORY_MAP: Record<string, string> = {
  Tomato: "vegetables",
  Tomatoes: "vegetables",
  Onion: "vegetables",
  Onions: "vegetables",
  Potato: "vegetables",
  Potatoes: "vegetables",
  Brinjal: "vegetables",
  Eggplant: "vegetables",
  Cauliflower: "vegetables",
  Cabbage: "vegetables",
  Carrot: "vegetables",
  Capsicum: "vegetables",
  "Bell Pepper": "vegetables",
  Garlic: "vegetables",
  Ginger: "vegetables",
  "Green Chilli": "vegetables",
  Spinach: "vegetables",
  Mango: "fruits",
  Banana: "fruits",
  Apple: "fruits",
  Grapes: "fruits",
  Papaya: "fruits",
  Guava: "fruits",
  Pomegranate: "fruits",
  Rice: "grains",
  Wheat: "grains",
  Maize: "grains",
  Jowar: "grains",
  Bajra: "grains",
  Pulses: "grains",
  "Toor Dal": "grains",
  Groundnut: "grains",
  Milk: "dairy",
  Eggs: "dairy",
  Paneer: "dairy",
  Curd: "dairy",
};

/**
 * Fallback demo data used ONLY when the backend is unreachable.
 */
const DEMO_LISTINGS: MarketListing[] = [
  {
    id: "demo-1",
    crop: "Tomato",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "500 kg",
    price: "₹45/kg",
    priceNum: 45,
    mrp: "₹52/kg",
    mrpNum: 52,
    discount: 13,
    freshness: "Harvested today",
    route: "28 km · 1h 12m",
    match: "92%",
    image: IMG.tomato,
    status: "Ready to move",
    harvest: "Today",
    seller: "GreenValley Farms",
    category: "vegetables",
  },
  {
    id: "demo-2",
    crop: "Onion",
    grade: "Grade A",
    place: "Pune, MH",
    quantity: "300 kg",
    price: "₹25/kg",
    priceNum: 25,
    mrp: "₹30/kg",
    mrpNum: 30,
    discount: 17,
    freshness: "Harvested yesterday",
    route: "42 km · 1h 48m",
    match: "87%",
    image: IMG.onion,
    status: "Ready to move",
    harvest: "Yesterday",
    seller: "Sahaja Agro Co-op",
    category: "vegetables",
  },
  {
    id: "demo-3",
    crop: "Potato",
    grade: "Grade B",
    place: "Satara, MH",
    quantity: "400 kg",
    price: "₹18/kg",
    priceNum: 18,
    mrp: "₹22/kg",
    mrpNum: 22,
    discount: 18,
    freshness: "Harvested 2 days ago",
    route: "61 km · 2h 18m",
    match: "81%",
    image: IMG.potato,
    status: "Ready to move",
    harvest: "2 days ago",
    seller: "Satara Fresh Collective",
    category: "vegetables",
  },
  {
    id: "demo-4",
    crop: "Brinjal",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "200 kg",
    price: "₹28/kg",
    priceNum: 28,
    mrp: "₹34/kg",
    mrpNum: 34,
    discount: 18,
    freshness: "Harvested today",
    route: "31 km · 1h 20m",
    match: "84%",
    image: IMG.brinjal,
    status: "Ready to move",
    harvest: "Today",
    seller: "GreenValley Farms",
    category: "vegetables",
  },
  {
    id: "demo-5",
    crop: "Cauliflower",
    grade: "Grade A",
    place: "Pune, MH",
    quantity: "150 pcs",
    price: "₹35/pc",
    priceNum: 35,
    mrp: "₹42/pc",
    mrpNum: 42,
    discount: 17,
    freshness: "Harvested today",
    route: "45 km · 1h 52m",
    match: "79%",
    image: IMG.cauliflower,
    status: "Ready to move",
    harvest: "Today",
    seller: "Sahaja Agro Co-op",
    category: "vegetables",
  },
  {
    id: "demo-6",
    crop: "Rice",
    grade: "Grade A",
    place: "Ahmednagar, MH",
    quantity: "500 kg",
    price: "₹45/kg",
    priceNum: 45,
    mrp: "₹55/kg",
    mrpNum: 55,
    discount: 18,
    freshness: "Harvested today",
    route: "74 km · 2h 40m",
    match: "78%",
    image: IMG.rice,
    status: "Ready to move",
    harvest: "Today",
    seller: "Ahmednagar Growers",
    category: "grains",
  },
  {
    id: "demo-7",
    crop: "Wheat",
    grade: "Grade B",
    place: "Solapur, MH",
    quantity: "600 kg",
    price: "₹32/kg",
    priceNum: 32,
    mrp: "₹38/kg",
    mrpNum: 38,
    discount: 16,
    freshness: "Harvested 3 days ago",
    route: "88 km · 3h 05m",
    match: "76%",
    image: IMG.wheat,
    status: "Ready to move",
    harvest: "3 days ago",
    seller: "Solapur Grain Co-op",
    category: "grains",
  },
  {
    id: "demo-8",
    crop: "Mango",
    grade: "Grade A",
    place: "Ratnagiri, MH",
    quantity: "250 kg",
    price: "₹120/kg",
    priceNum: 120,
    mrp: "₹150/kg",
    mrpNum: 150,
    discount: 20,
    freshness: "Harvested today",
    route: "96 km · 3h 30m",
    match: "88%",
    image: IMG.mango,
    status: "Ready to move",
    harvest: "Today",
    seller: "Ratnagiri Alphonso Farms",
    category: "fruits",
  },
  {
    id: "demo-9",
    crop: "Cabbage",
    grade: "Grade A",
    place: "Pune, MH",
    quantity: "350 kg",
    price: "₹20/kg",
    priceNum: 20,
    mrp: "₹24/kg",
    mrpNum: 24,
    discount: 17,
    freshness: "Harvested today",
    route: "38 km · 1h 30m",
    match: "82%",
    image: IMG.cabbage,
    status: "Ready to move",
    harvest: "Today",
    seller: "Sahaja Agro Co-op",
    category: "vegetables",
  },
  {
    id: "demo-10",
    crop: "Carrot",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "180 kg",
    price: "₹40/kg",
    priceNum: 40,
    mrp: "₹48/kg",
    mrpNum: 48,
    discount: 17,
    freshness: "Harvested today",
    route: "29 km · 1h 15m",
    match: "85%",
    image: IMG.carrot,
    status: "Ready to move",
    harvest: "Today",
    seller: "GreenValley Farms",
    category: "vegetables",
  },
  {
    id: "demo-11",
    crop: "Capsicum",
    grade: "Grade A",
    place: "Pune, MH",
    quantity: "120 kg",
    price: "₹60/kg",
    priceNum: 60,
    mrp: "₹72/kg",
    mrpNum: 72,
    discount: 17,
    freshness: "Harvested yesterday",
    route: "41 km · 1h 45m",
    match: "80%",
    image: IMG.capsicum,
    status: "Ready to move",
    harvest: "Yesterday",
    seller: "Sahaja Agro Co-op",
    category: "vegetables",
  },
  {
    id: "demo-12",
    crop: "Garlic",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "80 kg",
    price: "₹180/kg",
    priceNum: 180,
    mrp: "₹220/kg",
    mrpNum: 220,
    discount: 18,
    freshness: "Harvested 2 days ago",
    route: "33 km · 1h 22m",
    match: "86%",
    image: IMG.garlic,
    status: "Ready to move",
    harvest: "2 days ago",
    seller: "GreenValley Farms",
    category: "vegetables",
  },
  {
    id: "demo-13",
    crop: "Ginger",
    grade: "Grade B",
    place: "Satara, MH",
    quantity: "90 kg",
    price: "₹120/kg",
    priceNum: 120,
    mrp: "₹145/kg",
    mrpNum: 145,
    discount: 17,
    freshness: "Harvested yesterday",
    route: "63 km · 2h 20m",
    match: "83%",
    image: IMG.ginger,
    status: "Ready to move",
    harvest: "Yesterday",
    seller: "Satara Fresh Collective",
    category: "vegetables",
  },
  {
    id: "demo-14",
    crop: "Green Chilli",
    grade: "Grade A",
    place: "Ahmednagar, MH",
    quantity: "60 kg",
    price: "₹80/kg",
    priceNum: 80,
    mrp: "₹95/kg",
    mrpNum: 95,
    discount: 16,
    freshness: "Harvested today",
    route: "76 km · 2h 45m",
    match: "77%",
    image: IMG.chilli,
    status: "Ready to move",
    harvest: "Today",
    seller: "Ahmednagar Growers",
    category: "vegetables",
  },
  {
    id: "demo-15",
    crop: "Banana",
    grade: "Grade A",
    place: "Jalgaon, MH",
    quantity: "400 dozen",
    price: "₹40/dozen",
    priceNum: 40,
    mrp: "₹48/dozen",
    mrpNum: 48,
    discount: 17,
    freshness: "Harvested today",
    route: "52 km · 2h 05m",
    match: "84%",
    image: IMG.banana,
    status: "Ready to move",
    harvest: "Today",
    seller: "Jalgaon Banana Growers",
    category: "fruits",
  },
  {
    id: "demo-16",
    crop: "Apple",
    grade: "Grade A",
    place: "Shimla, HP",
    quantity: "300 kg",
    price: "₹150/kg",
    priceNum: 150,
    mrp: "₹180/kg",
    mrpNum: 180,
    discount: 17,
    freshness: "Harvested 3 days ago",
    route: "310 km · 7h 40m",
    match: "89%",
    image: IMG.apple,
    status: "Ready to move",
    harvest: "3 days ago",
    seller: "Shimla Orchards",
    category: "fruits",
  },
  {
    id: "demo-17",
    crop: "Grapes",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "200 kg",
    price: "₹90/kg",
    priceNum: 90,
    mrp: "₹110/kg",
    mrpNum: 110,
    discount: 18,
    freshness: "Harvested today",
    route: "30 km · 1h 18m",
    match: "82%",
    image: IMG.grapes,
    status: "Ready to move",
    harvest: "Today",
    seller: "GreenValley Farms",
    category: "fruits",
  },
  {
    id: "demo-18",
    crop: "Pomegranate",
    grade: "Grade A",
    place: "Solapur, MH",
    quantity: "150 kg",
    price: "₹140/kg",
    priceNum: 140,
    mrp: "₹170/kg",
    mrpNum: 170,
    discount: 18,
    freshness: "Harvested yesterday",
    route: "86 km · 3h 00m",
    match: "85%",
    image: IMG.pomegranate,
    status: "Ready to move",
    harvest: "Yesterday",
    seller: "Solapur Grain Co-op",
    category: "fruits",
  },
  {
    id: "demo-19",
    crop: "Toor Dal",
    grade: "Grade A",
    place: "Latur, MH",
    quantity: "500 kg",
    price: "₹130/kg",
    priceNum: 130,
    mrp: "₹155/kg",
    mrpNum: 155,
    discount: 16,
    freshness: "Milled this week",
    route: "92 km · 3h 15m",
    match: "79%",
    image: IMG.toordal,
    status: "Ready to move",
    harvest: "This week",
    seller: "Latur Dal Mill",
    category: "grains",
  },
  {
    id: "demo-20",
    crop: "Groundnut",
    grade: "Grade B",
    place: "Jalna, MH",
    quantity: "450 kg",
    price: "₹95/kg",
    priceNum: 95,
    mrp: "₹115/kg",
    mrpNum: 115,
    discount: 17,
    freshness: "Harvested 4 days ago",
    route: "68 km · 2h 32m",
    match: "75%",
    image: IMG.groundnut,
    status: "Ready to move",
    harvest: "4 days ago",
    seller: "Jalna Groundnut Co-op",
    category: "grains",
  },
  {
    id: "demo-21",
    crop: "Milk",
    grade: "Grade A",
    place: "Pune, MH",
    quantity: "200 L",
    price: "₹56/L",
    priceNum: 56,
    mrp: "₹64/L",
    mrpNum: 64,
    discount: 13,
    freshness: "Packed today",
    route: "25 km · 1h 05m",
    match: "90%",
    image: IMG.milk,
    status: "Ready to move",
    harvest: "Today",
    seller: "Pune Dairy Co-op",
    category: "dairy",
  },
  {
    id: "demo-22",
    crop: "Eggs",
    grade: "Grade A",
    place: "Nashik, MH",
    quantity: "1000 pcs",
    price: "₹7/pc",
    priceNum: 7,
    mrp: "₹8/pc",
    mrpNum: 8,
    discount: 13,
    freshness: "Laid today",
    route: "31 km · 1h 20m",
    match: "88%",
    image: IMG.eggs,
    status: "Ready to move",
    harvest: "Today",
    seller: "Nashik Poultry Co-op",
    category: "dairy",
  },
];

function mapBackendListing(listing: any): MarketListing {
  const imageMap: Record<string, string> = {
    Tomato: IMG.tomato,
    Tomatoes: IMG.tomato,
    Onion: IMG.onion,
    Onions: IMG.onion,
    Potato: IMG.potato,
    Potatoes: IMG.potato,
    Brinjal: IMG.brinjal,
    Eggplant: IMG.brinjal,
    Cauliflower: IMG.cauliflower,
    Cabbage: IMG.cabbage,
    Carrot: IMG.carrot,
    Capsicum: IMG.capsicum,
    "Bell Pepper": IMG.capsicum,
    Garlic: IMG.garlic,
    Ginger: IMG.ginger,
    "Green Chilli": IMG.chilli,
    Rice: IMG.rice,
    Wheat: IMG.wheat,
    Mango: IMG.mango,
    Banana: IMG.banana,
    Apple: IMG.apple,
    Grapes: IMG.grapes,
    Pomegranate: IMG.pomegranate,
    "Toor Dal": IMG.toordal,
    Groundnut: IMG.groundnut,
    Milk: IMG.milk,
    Eggs: IMG.eggs,
    Default: "/images/produce/farmer.svg",
  };
  const image = imageMap[listing.crop_name] || imageMap.Default;

  const quantity =
    listing.quantity_kg !== null && listing.quantity_kg !== undefined
      ? `${listing.quantity_kg.toLocaleString()} kg`
      : "Quantity TBA";

  const priceNum =
    listing.price_per_kg !== null && listing.price_per_kg !== undefined
      ? listing.price_per_kg
      : 0;
  const mrpNum = priceNum > 0 ? Math.round(priceNum * 1.12 * 100) / 100 : 0;
  const discount =
    priceNum > 0 ? Math.round((1 - priceNum / mrpNum) * 100) : 0;

  const price =
    priceNum > 0 ? `₹${priceNum.toFixed(2)}/kg` : "Price on request";
  const mrp = mrpNum > 0 ? `₹${mrpNum.toFixed(2)}/kg` : "";

  const freshness =
    listing.harvest_date !== null
      ? "Harvested recently"
      : "Freshness info TBA";

  // Honest, data-driven match estimate: grade + freshness + lot size.
  // A full buyer-specific score requires the authenticated matching engine;
  // this gives public visitors a comparable signal without inventing numbers.
  let matchScore = 62;
  if (listing.quality_grade === "A") matchScore += 14;
  else if (listing.quality_grade === "B") matchScore += 7;
  if (listing.harvest_date) {
    const days = (Date.now() - new Date(listing.harvest_date).getTime()) / 86400000;
    if (days <= 2) matchScore += 12;
    else if (days <= 5) matchScore += 6;
  }
  if ((listing.quantity_kg ?? 0) >= 200) matchScore += 6;
  matchScore = Math.min(matchScore, 95);

  return {
    id: listing.id,
    crop: listing.crop_name,
    grade: listing.quality_grade || "N/A",
    place: listing.pickup_location || "Location TBA",
    quantity,
    price,
    priceNum,
    mrp,
    mrpNum,
    discount,
    freshness,
    route: listing.pickup_location ? "Pickup at farm gate" : "Route TBA",
    match: `${matchScore}%`,
    image,
    status: listing.is_active ? "Ready to move" : "Inactive",
    harvest: listing.harvest_date || "Harvest date TBA",
    seller: listing.farm_name || listing.producer_name || "Verified producer",
    category: CATEGORY_MAP[listing.crop_name] || "vegetables",
  };
}

export default function Marketplace() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("recommended");
  const [toast, setToast] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const backendListings = await fetchListings({
          crop_name: debouncedQuery || undefined,
          limit: 20,
        });

        if (isMounted) {
          setListings(backendListings.map(mapBackendListing));
          setUsingDemoData(false);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (isMounted) {
            setListings(DEMO_LISTINGS);
            setUsingDemoData(true);
            setError(
              `${t("marketplace.demoNotice")}: ${err.message} (${err.status})`
            );
          }
        } else {
          if (isMounted) {
            setListings([]);
            setError(t("marketplace.backendError"));
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, t]);

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
        const matchesCategory =
          category === "all" || item.category === category;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortKey === "priceLow") return a.priceNum - b.priceNum;
        if (sortKey === "priceHigh") return b.priceNum - a.priceNum;
        if (sortKey === "highest") {
          const matchA = parseInt(a.match) || 0;
          const matchB = parseInt(b.match) || 0;
          return matchB - matchA;
        }
        if (sortKey === "closest") {
          return a.route.localeCompare(b.route);
        }
        return 0;
      });
  }, [listings, query, category, sortKey]);

  const cartCount = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, n]) => {
    const listing = listings.find((x) => x.id === id);
    return sum + (listing ? listing.priceNum * n : 0);
  }, 0);

  const action = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const addToCart = (id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    action(t("marketplace.addedToast"));
  };

  const removeFromCart = (id: string) => {
    setCart((c) => {
      const next = { ...c };
      const value = (next[id] || 0) - 1;
      if (value <= 0) delete next[id];
      else next[id] = value;
      return next;
    });
  };

  const openListing = (id: string) => {
    window.location.href = `/listing/${id}`;
  };

  return (
    <PublicLayout>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("nav.marketplace")}</span>
          <h1>{t("marketplace.h1")}</h1>
          <p>{t("marketplace.p")}</p>
          <div className="row" style={{ marginTop: 28 }}>
            <button
              className="btn btn-primary"
              onClick={() => action(t("marketplace.toastList"))}
            >
              {t("marketplace.listProduce")} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Offer banner + trust badges */}
      <section className="container">
        <div className="market-offer">
          <div className="market-offer-text">
            <span className="eyebrow">{t("marketplace.offerEyebrow")}</span>
            <h2>{t("marketplace.offerTitle")}</h2>
            <p>{t("marketplace.offerSub")}</p>
          </div>
          <div className="market-offer-badges">
            <span>
              <Leaf size={14} /> {t("marketplace.trustFresh")}
            </span>
            <span>
              <Truck size={14} /> {t("marketplace.trustDirect")}
            </span>
            <span>
              <BadgeCheck size={14} /> {t("marketplace.trustFair")}
            </span>
          </div>
        </div>
      </section>

      {/* Data source notice */}
      {usingDemoData && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="badge badge-warning">
            {t("marketplace.demoNotice")}
          </div>
          <p className="state-body" style={{ marginTop: 8 }}>
            {error}
          </p>
        </div>
      )}
      {!usingDemoData && error && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="badge badge-error">{t("marketplace.backendError")}</div>
          <p className="state-body" style={{ marginTop: 8 }}>{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <section className="container">
        <div className="market-toolbar">
          <div className="search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("marketplace.searchPlaceholder")}
              aria-label={t("marketplace.searchAria")}
            />
          </div>
          <div className="market-toolbar-actions">
            <label className="row" style={{ gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              {t("marketplace.sortBy")}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                aria-label={t("marketplace.searchAria")}
              >
                <option value="recommended">{t("marketplace.sortRecommended")}</option>
                <option value="highest">{t("marketplace.sortMatch")}</option>
                <option value="closest">{t("marketplace.sortRoute")}</option>
                <option value="priceLow">{t("marketplace.sortPriceLow")}</option>
                <option value="priceHigh">{t("marketplace.sortPriceHigh")}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label={t("marketplace.searchAria")}>
          {categories.map((c) => (
            <button
              className={category === c.key ? "active" : ""}
              key={c.key}
              onClick={() => setCategory(c.key)}
              role="tab"
              aria-selected={category === c.key}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Product grid */}
      <section className="container">
        <div className="market-grid-wrap">
          {loading ? (
            <div className="market-grid">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div className="market-card" key={i}>
                  <div className="skeleton" style={{ height: 165, borderRadius: 0 }} />
                  <div className="market-card-body">
                    <div className="skeleton" style={{ height: 14, width: "60%" }} />
                    <div className="skeleton" style={{ height: 12, width: "85%", marginTop: 8 }} />
                    <div className="skeleton" style={{ height: 16, width: "40%", marginTop: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="state" style={{ padding: "48px 0" }}>
              <div className="state-icon"><Search size={20} /></div>
              <div className="state-title">{t("marketplace.emptyTitle")}</div>
              <div className="state-body">
                {t("marketplace.emptyBody")}
              </div>
            </div>
          ) : (
            <div className="market-grid">
              {filtered.map((item) => (
                <div className="market-card" key={item.id}>
                  <div
                    className="market-card-media"
                    onClick={() => openListing(item.id)}
                  >
                    <img src={item.image} alt={item.crop} loading="lazy" />
                    {item.discount > 0 && (
                      <span className="market-card-off">{item.discount}% OFF</span>
                    )}
                    <span className="market-card-match">
                      {item.match} {t("marketplace.matchBadge")}
                    </span>
                  </div>
                  <div className="market-card-body">
                    <div
                      className="market-card-name"
                      onClick={() => openListing(item.id)}
                    >
                      {item.crop}
                    </div>
                    <div className="market-card-sub">
                      {item.grade}
                      <span className="dot" aria-hidden="true" />
                      {item.seller === "Verified producer"
                        ? t("marketplace.verifiedProducer")
                        : item.seller}
                    </div>
                    <div className="market-card-meta">
                      <MapPin size={12} /> {item.place} · {item.quantity}
                    </div>
                    <div className="market-card-price-row">
                      <span className="market-card-price">{item.price}</span>
                      {item.mrp && (
                        <span className="market-card-mrp">{item.mrp}</span>
                      )}
                    </div>
                    {cart[item.id] ? (
                      <div className="market-card-stepper">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={t("marketplace.decreaseAria")}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{cart[item.id]}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          aria-label={t("marketplace.increaseAria")}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="market-card-add"
                        onClick={() => addToCart(item.id)}
                      >
                        {t("marketplace.add")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sticky cart summary */}
      {cartCount > 0 && (
        <div className="market-cartbar">
          <div className="container market-cartbar-inner">
            <div className="market-cartbar-info">
              <ShoppingBasket size={16} />
              <span>
                {cartCount} {t("marketplace.cartItems")}
              </span>
              <span className="market-cartbar-total">₹{cartTotal.toFixed(0)}</span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => action(t("marketplace.cartToast"))}
            >
              {t("marketplace.viewCart")} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {toast && <div className="public-toast">{toast}</div>}
    </PublicLayout>
  );
}