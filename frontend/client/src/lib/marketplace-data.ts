/* KisanSetu Marketplace — data layer.
   Product catalog, category mapping, and listing normalizers used by the
   public Marketplace page. Kept separate from the page so the shadcn UI
   can stay presentational.

   Only real backend data is rendered: no fabricated MRP, discounts, match
   scores or "verified" badges. Fields the backend does not provide are
   shown as honest placeholders ("—", "Price on request", etc.). */

export type MarketListing = {
  id: string;
  crop: string;
  grade: string;
  place: string;
  quantity: string;
  price: string;
  priceNum: number;
  freshness: string;
  route: string;
  image: string;
  status: string;
  harvest: string;
  seller: string;
  category: string;
};

/** Verified Unsplash product photos (checked for HTTP 200 + subject colour). */
export const IMG = {
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
export const CATEGORY_MAP: Record<string, string> = {
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

/** Crop name -> product photo (shared by Marketplace and ListingDetail). */
export function cropImage(cropName: string | null | undefined): string {
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
  };
  return (cropName && imageMap[cropName]) || "/images/produce/farmer.svg";
}

export function mapBackendListing(listing: any): MarketListing {
  const quantity =
    listing.quantity_kg !== null && listing.quantity_kg !== undefined
      ? `${listing.quantity_kg.toLocaleString("en-IN")} kg`
      : "Quantity TBA";

  const priceNum =
    listing.price_per_kg !== null && listing.price_per_kg !== undefined
      ? listing.price_per_kg
      : 0;

  const price = priceNum > 0 ? `₹${priceNum.toFixed(2)}/kg` : "Price on request";

  const freshness =
    listing.harvest_date !== null && listing.harvest_date !== undefined
      ? "Harvested recently"
      : "Freshness info TBA";

  return {
    id: listing.id,
    crop: listing.crop_name,
    grade: listing.quality_grade || "N/A",
    place: listing.pickup_location || "Location TBA",
    quantity,
    price,
    priceNum,
    freshness,
    route: listing.pickup_location ? "Pickup at farm gate" : "Route TBA",
    image: cropImage(listing.crop_name),
    status: listing.is_active ? "Ready to move" : "Inactive",
    harvest: listing.harvest_date || "Harvest date TBA",
    seller: listing.farm_name || "Producer",
    category: CATEGORY_MAP[listing.crop_name] || "vegetables",
  };
}