"use client";

// Shared demo data layer for Kisan Setu / ByteFrost.
// This is the single source of truth for demo listings, orders, and
// notifications so that the Buyer and Farmer dashboards stay in sync.
// When the real backend is reachable, it can be swapped in via api.ts.

export interface DemoUser {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: "farmer" | "buyer";
  address?: string;
}

export interface DemoListing {
  id: string;
  seller_id: string;
  seller_name: string;
  crop_name: string;
  category: string;
  variety?: string;
  quantity_kg: number;
  unit: string;
  min_order_quantity: number;
  price_per_kg: number;
  quality_grade?: string;
  pickup_location: string;
  description?: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  rating?: number;
}

export interface DemoOrderItem {
  listing_id: string;
  crop_name: string;
  seller_id: string;
  seller_name: string;
  quantity_kg: number;
  price_per_kg: number;
  image?: string;
}

export interface DemoOrder {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  items: DemoOrderItem[];
  total_amount: number;
  delivery_address: string;
  status: string; // pending, confirmed, processing, shipped, delivered, cancelled
  created_at: string;
}

export interface DemoNotification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface DemoTransaction {
  id: string;
  farmer_id: string;
  order_id: string;
  amount: number;
  status: string; // completed, pending
  created_at: string;
  description: string;
}

// ---------- Demo users ----------
export const DEMO_FARMER_ID = "demo-farmer-1";
export const DEMO_BUYER_ID = "demo-buyer-1";

export const demoUsers: DemoUser[] = [
  {
    id: DEMO_FARMER_ID,
    full_name: "Ramesh Kumar",
    phone: "+919999999999",
    email: "phone_919999999999@bytefrost.local",
    role: "farmer",
    address: "Village Nandgaon, Nashik, Maharashtra",
  },
  {
    id: DEMO_BUYER_ID,
    full_name: "Priya Sharma",
    phone: "+918888888888",
    email: "phone_918888888888@bytefrost.local",
    role: "buyer",
    address: "Shop 12, Azad Market, Pune, Maharashtra",
  },
  {
    id: "demo-farmer-2",
    full_name: "Suresh Patil",
    phone: "+917777777777",
    email: "phone_917777777777@bytefrost.local",
    role: "farmer",
    address: "Village Khed, Satara, Maharashtra",
  },
  {
    id: "demo-farmer-3",
    full_name: "Anita Deshmukh",
    phone: "+916666666666",
    email: "phone_916666666666@bytefrost.local",
    role: "farmer",
    address: "Village Baramati, Pune, Maharashtra",
  },
  {
    id: "demo-farmer-4",
    full_name: "Vikram Singh",
    phone: "+915555555555",
    email: "phone_915555555555@bytefrost.local",
    role: "farmer",
    address: "Village Sangrur, Punjab",
  },
  {
    id: "demo-buyer-2",
    full_name: "Rahul Verma",
    phone: "+914444444444",
    email: "phone_914444444444@bytefrost.local",
    role: "buyer",
    address: "GreenMart Superstore, Mumbai",
  },
  {
    id: "demo-buyer-3",
    full_name: "Kavita Joshi",
    phone: "+913333333333",
    email: "phone_913333333333@bytefrost.local",
    role: "buyer",
    address: "FreshBasket Retail, Nashik",
  },
];

export const DEMO_PASSWORD = "demo1234";

// ---------- Demo listings ----------
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const demoListings: DemoListing[] = [
  {
    id: "listing-1",
    seller_id: DEMO_FARMER_ID,
    seller_name: "Ramesh Kumar",
    crop_name: "Rice",
    category: "Grains",
    variety: "Basmati",
    quantity_kg: 5000,
    unit: "kg",
    min_order_quantity: 50,
    price_per_kg: 45,
    quality_grade: "A",
    pickup_location: "Nandgaon, Nashik",
    description: "Premium basmati rice, freshly harvested from our farm.",
    images: ["🌾"],
    is_active: true,
    created_at: daysAgo(12),
    rating: 4.8,
  },
  {
    id: "listing-2",
    seller_id: DEMO_FARMER_ID,
    seller_name: "Ramesh Kumar",
    crop_name: "Wheat",
    category: "Grains",
    variety: "Sharbati",
    quantity_kg: 8000,
    unit: "kg",
    min_order_quantity: 100,
    price_per_kg: 28,
    quality_grade: "A",
    pickup_location: "Nandgaon, Nashik",
    description: "High-protein sharbati wheat, ideal for chapati and atta.",
    images: ["🌾"],
    is_active: true,
    created_at: daysAgo(10),
    rating: 4.6,
  },
  {
    id: "listing-3",
    seller_id: DEMO_FARMER_ID,
    seller_name: "Ramesh Kumar",
    crop_name: "Tomatoes",
    category: "Vegetables",
    variety: "Hybrid",
    quantity_kg: 1200,
    unit: "kg",
    min_order_quantity: 20,
    price_per_kg: 22,
    quality_grade: "A",
    pickup_location: "Nandgaon, Nashik",
    description: "Farm-fresh hybrid tomatoes, perfect for market supply.",
    images: ["🍅"],
    is_active: true,
    created_at: daysAgo(8),
    rating: 4.5,
  },
  {
    id: "listing-4",
    seller_id: DEMO_FARMER_ID,
    seller_name: "Ramesh Kumar",
    crop_name: "Onions",
    category: "Vegetables",
    variety: "Nasik Red",
    quantity_kg: 3000,
    unit: "kg",
    min_order_quantity: 50,
    price_per_kg: 18,
    quality_grade: "A",
    pickup_location: "Nandgaon, Nashik",
    description: "Premium Nasik red onions with excellent shelf life.",
    images: ["🧅"],
    is_active: true,
    created_at: daysAgo(6),
    rating: 4.7,
  },
  {
    id: "listing-5",
    seller_id: DEMO_FARMER_ID,
    seller_name: "Ramesh Kumar",
    crop_name: "Potatoes",
    category: "Vegetables",
    variety: "Kufri",
    quantity_kg: 4000,
    unit: "kg",
    min_order_quantity: 50,
    price_per_kg: 20,
    quality_grade: "B",
    pickup_location: "Nandgaon, Nashik",
    description: "Good quality Kufri potatoes, uniform size.",
    images: ["🥔"],
    is_active: true,
    created_at: daysAgo(5),
    rating: 4.3,
  },
  {
    id: "listing-6",
    seller_id: DEMO_FARMER_ID,
    seller_name: "Ramesh Kumar",
    crop_name: "Mustard",
    category: "Spices",
    variety: "Yellow",
    quantity_kg: 800,
    unit: "kg",
    min_order_quantity: 20,
    price_per_kg: 65,
    quality_grade: "A",
    pickup_location: "Nandgaon, Nashik",
    description: "Organic yellow mustard seeds, high oil content.",
    images: ["🌱"],
    is_active: true,
    created_at: daysAgo(3),
    rating: 4.9,
  },
  {
    id: "listing-7",
    seller_id: "demo-farmer-2",
    seller_name: "Suresh Patil",
    crop_name: "Carrots",
    category: "Vegetables",
    variety: "Nantes",
    quantity_kg: 1500,
    unit: "kg",
    min_order_quantity: 25,
    price_per_kg: 35,
    quality_grade: "A",
    pickup_location: "Khed, Satara",
    description: "Fresh Nantes carrots, sweet and crunchy.",
    images: ["🥕"],
    is_active: true,
    created_at: daysAgo(4),
    rating: 4.4,
  },
  {
    id: "listing-8",
    seller_id: "demo-farmer-2",
    seller_name: "Suresh Patil",
    crop_name: "Spinach",
    category: "Vegetables",
    variety: "Palak",
    quantity_kg: 600,
    unit: "kg",
    min_order_quantity: 10,
    price_per_kg: 30,
    quality_grade: "A",
    pickup_location: "Khed, Satara",
    description: "Organic palak spinach, harvested daily.",
    images: ["🥬"],
    is_active: true,
    created_at: daysAgo(4),
    rating: 4.2,
  },
  {
    id: "listing-9",
    seller_id: "demo-farmer-3",
    seller_name: "Anita Deshmukh",
    crop_name: "Mangoes",
    category: "Fruits",
    variety: "Alphonso",
    quantity_kg: 2000,
    unit: "kg",
    min_order_quantity: 50,
    price_per_kg: 120,
    quality_grade: "A",
    pickup_location: "Baramati, Pune",
    description: "Premium Alphonso mangoes, export quality.",
    images: ["🥭"],
    is_active: true,
    created_at: daysAgo(4),
    rating: 4.9,
  },
  {
    id: "listing-10",
    seller_id: "demo-farmer-3",
    seller_name: "Anita Deshmukh",
    crop_name: "Bananas",
    category: "Fruits",
    variety: "Robusta",
    quantity_kg: 3000,
    unit: "kg",
    min_order_quantity: 100,
    price_per_kg: 25,
    quality_grade: "A",
    pickup_location: "Baramati, Pune",
    description: "Fresh robusta bananas, ready for retail.",
    images: ["🍌"],
    is_active: true,
    created_at: daysAgo(4),
    rating: 4.5,
  },
  {
    id: "listing-11",
    seller_id: "demo-farmer-4",
    seller_name: "Vikram Singh",
    crop_name: "Wheat",
    category: "Grains",
    variety: "HD-2967",
    quantity_kg: 10000,
    unit: "kg",
    min_order_quantity: 100,
    price_per_kg: 26,
    quality_grade: "A",
    pickup_location: "Sangrur, Punjab",
    description: "Bulk wheat from Punjab, high yield variety.",
    images: ["🌾"],
    is_active: true,
    created_at: daysAgo(4),
    rating: 4.6,
  },
  {
    id: "listing-12",
    seller_id: "demo-farmer-4",
    seller_name: "Vikram Singh",
    crop_name: "Corn",
    category: "Grains",
    variety: "Sweet Corn",
    quantity_kg: 2500,
    unit: "kg",
    min_order_quantity: 50,
    price_per_kg: 32,
    quality_grade: "A",
    pickup_location: "Sangrur, Punjab",
    description: "Sweet corn cobs, freshly harvested.",
    images: ["🌽"],
    is_active: true,
    created_at: daysAgo(4),
    rating: 4.4,
  },
];

// ---------- Demo orders ----------
export const demoOrders: DemoOrder[] = [
  {
    id: "KS1001",
    buyer_id: "demo-buyer-2",
    buyer_name: "Rahul Verma",
    buyer_phone: "+914444444444",
    items: [
      {
        listing_id: "listing-1",
        crop_name: "Rice",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 200,
        price_per_kg: 45,
        image: "🌾",
      },
      {
        listing_id: "listing-4",
        crop_name: "Onions",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 100,
        price_per_kg: 18,
        image: "🧅",
      },
    ],
    total_amount: 10800,
    delivery_address: "GreenMart Superstore, Mumbai",
    status: "delivered",
    created_at: daysAgo(9),
  },
  {
    id: "KS1002",
    buyer_id: "demo-buyer-3",
    buyer_name: "Kavita Joshi",
    buyer_phone: "+913333333333",
    items: [
      {
        listing_id: "listing-3",
        crop_name: "Tomatoes",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 50,
        price_per_kg: 22,
        image: "🍅",
      },
    ],
    total_amount: 1100,
    delivery_address: "FreshBasket Retail, Nashik",
    status: "delivered",
    created_at: daysAgo(7),
  },
  {
    id: "KS1003",
    buyer_id: "demo-buyer-2",
    buyer_name: "Rahul Verma",
    buyer_phone: "+914444444444",
    items: [
      {
        listing_id: "listing-2",
        crop_name: "Wheat",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 300,
        price_per_kg: 28,
        image: "🌾",
      },
    ],
    total_amount: 8400,
    delivery_address: "GreenMart Superstore, Mumbai",
    status: "shipped",
    created_at: daysAgo(4),
  },
  {
    id: "KS1004",
    buyer_id: "demo-buyer-3",
    buyer_name: "Kavita Joshi",
    buyer_phone: "+913333333333",
    items: [
      {
        listing_id: "listing-5",
        crop_name: "Potatoes",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 150,
        price_per_kg: 20,
        image: "🥔",
      },
      {
        listing_id: "listing-4",
        crop_name: "Onions",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 80,
        price_per_kg: 18,
        image: "🧅",
      },
    ],
    total_amount: 4440,
    delivery_address: "FreshBasket Retail, Nashik",
    status: "processing",
    created_at: daysAgo(2),
  },
  {
    id: "KS1005",
    buyer_id: "demo-buyer-2",
    buyer_name: "Rahul Verma",
    buyer_phone: "+914444444444",
    items: [
      {
        listing_id: "listing-6",
        crop_name: "Mustard",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 40,
        price_per_kg: 65,
        image: "🌱",
      },
    ],
    total_amount: 2600,
    delivery_address: "GreenMart Superstore, Mumbai",
    status: "confirmed",
    created_at: daysAgo(1),
  },
  // Buyer's own orders
  {
    id: "KS1006",
    buyer_id: DEMO_BUYER_ID,
    buyer_name: "Priya Sharma",
    buyer_phone: "+918888888888",
    items: [
      {
        listing_id: "listing-9",
        crop_name: "Mangoes",
        seller_id: "demo-farmer-3",
        seller_name: "Anita Deshmukh",
        quantity_kg: 100,
        price_per_kg: 120,
        image: "🥭",
      },
    ],
    total_amount: 12000,
    delivery_address: "Shop 12, Azad Market, Pune",
    status: "delivered",
    created_at: daysAgo(6),
  },
  {
    id: "KS1007",
    buyer_id: DEMO_BUYER_ID,
    buyer_name: "Priya Sharma",
    buyer_phone: "+918888888888",
    items: [
      {
        listing_id: "listing-1",
        crop_name: "Rice",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 150,
        price_per_kg: 45,
        image: "🌾",
      },
    ],
    total_amount: 6750,
    delivery_address: "Shop 12, Azad Market, Pune",
    status: "shipped",
    created_at: daysAgo(3),
  },
  {
    id: "KS1008",
    buyer_id: DEMO_BUYER_ID,
    buyer_name: "Priya Sharma",
    buyer_phone: "+918888888888",
    items: [
      {
        listing_id: "listing-3",
        crop_name: "Tomatoes",
        seller_id: DEMO_FARMER_ID,
        seller_name: "Ramesh Kumar",
        quantity_kg: 40,
        price_per_kg: 22,
        image: "🍅",
      },
    ],
    total_amount: 880,
    delivery_address: "Shop 12, Azad Market, Pune",
    status: "processing",
    created_at: daysAgo(1),
  },
];

// ---------- Demo notifications ----------
export const demoNotifications: DemoNotification[] = [
  {
    id: "notif-1",
    user_id: DEMO_FARMER_ID,
    message: "New order #KS1005 has been placed by Rahul Verma",
    type: "order",
    read: false,
    created_at: daysAgo(1),
  },
  {
    id: "notif-2",
    user_id: DEMO_FARMER_ID,
    message: "Your product listing 'Mustard' was published",
    type: "listing",
    read: false,
    created_at: daysAgo(3),
  },
  {
    id: "notif-3",
    user_id: DEMO_FARMER_ID,
    message: "Order #KS1004 is now processing",
    type: "order",
    read: true,
    created_at: daysAgo(2),
  },
  {
    id: "notif-4",
    user_id: DEMO_BUYER_ID,
    message: "Your order #KS1007 has been shipped",
    type: "order",
    read: false,
    created_at: daysAgo(1),
  },
  {
    id: "notif-5",
    user_id: DEMO_BUYER_ID,
    message: "New products are available in the marketplace",
    type: "marketplace",
    read: false,
    created_at: daysAgo(2),
  },
  {
    id: "notif-6",
    user_id: DEMO_BUYER_ID,
    message: "Your order #KS1006 was delivered successfully",
    type: "order",
    read: true,
    created_at: daysAgo(5),
  },
];

// ---------- Demo transactions (farmer earnings) ----------
export const demoTransactions: DemoTransaction[] = [
  {
    id: "txn-1",
    farmer_id: DEMO_FARMER_ID,
    order_id: "KS1001",
    amount: 10800,
    status: "completed",
    created_at: daysAgo(9),
    description: "Payment received for Order KS1001",
  },
  {
    id: "txn-2",
    farmer_id: DEMO_FARMER_ID,
    order_id: "KS1002",
    amount: 1100,
    status: "completed",
    created_at: daysAgo(7),
    description: "Payment received for Order KS1002",
  },
  {
    id: "txn-3",
    farmer_id: DEMO_FARMER_ID,
    order_id: "KS1003",
    amount: 8400,
    status: "pending",
    created_at: daysAgo(4),
    description: "Payment pending for Order KS1003",
  },
  {
    id: "txn-4",
    farmer_id: DEMO_FARMER_ID,
    order_id: "KS1004",
    amount: 4440,
    status: "pending",
    created_at: daysAgo(2),
    description: "Payment pending for Order KS1004",
  },
  {
    id: "txn-5",
    farmer_id: DEMO_FARMER_ID,
    order_id: "KS1005",
    amount: 2600,
    status: "pending",
    created_at: daysAgo(1),
    description: "Payment pending for Order KS1005",
  },
];

// ---------- Categories ----------
export const demoCategories = [
  "Grains",
  "Vegetables",
  "Fruits",
  "Spices",
  "Pulses",
  "Oilseeds",
  "Dairy",
  "Other",
];

// ---------- Helpers ----------
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateOrderId(): string {
  const n = 1009 + Math.floor(Math.random() * 9000);
  return `KS${n}`;
}
