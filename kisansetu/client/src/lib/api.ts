/* KisanSetu API client: a thin typed layer over the ByteFrost FastAPI backend.
 *
 * The backend is the source of truth for data. This client centralizes the
 * base URL, auth token handling, and error normalization so pages can focus on
 * rendering. All functions return typed data or throw a normalized ApiError.
 */
import axios, { AxiosError } from "axios";

// The backend base URL. Override with VITE_API_URL if the backend is hosted
// elsewhere; otherwise default to the local FastAPI dev server.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach the bearer token from localStorage if present.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("kisansetu_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors so callers get a clean message instead of a stack trace.
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status || 0;
    let message = "Network error. Please check your connection and try again.";
    const data = error.response?.data as
      | { detail?: string | Array<{ msg?: string }> }
      | undefined;
    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg || "Invalid input").join("; ");
      }
    } else if (error.code === "ERR_NETWORK") {
      message = "Cannot reach the server. Is the backend running?";
    }
    return Promise.reject(new ApiError(message, status));
  }
);

// --- Types (mirror the backend schemas) ---
export interface Listing {
  id: string;
  seller_id: string;
  crop_name: string;
  variety: string | null;
  quantity_kg: number;
  quality_grade: string | null;
  price_per_kg: number | null;
  harvest_date: string | null;
  pickup_location: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MatchResult {
  buyer_id: string;
  score: number;
  explanation: Record<string, unknown>;
}

export interface PriceRecommendation {
  listing_id: string;
  recommended_price: number | null;
  confidence: number;
  price_band: { low: number | null; mid: number | null; high: number | null };
  factors: string[];
}

// --- Public endpoints (no auth) ---
export async function fetchListings(params?: {
  crop_name?: string;
  max_price?: number;
  limit?: number;
}): Promise<Listing[]> {
  const { data } = await client.get<Listing[]>("/listings/", { params });
  return data;
}

// --- Authenticated endpoints ---
export async function fetchMatches(
  listingId: string,
  maxResults = 5
): Promise<MatchResult[]> {
  const { data } = await client.post<MatchResult[]>("/matching/find-matches", {
    listing_id: listingId,
    max_results: maxResults,
  });
  return data;
}

export async function fetchPriceRecommendation(
  listingId: string
): Promise<PriceRecommendation> {
  const { data } = await client.post<PriceRecommendation>(
    "/matching/price-recommendation",
    null,
    { params: { listing_id: listingId } }
  );
  return data;
}

export { API_BASE };
