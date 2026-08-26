import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bf_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const auth = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Listings
export const listings = {
  list: (params?: any) => api.get("/listings", { params }),
  get: (id: string) => api.get(`/listings/${id}`),
  create: (data: any) => api.post("/listings", data),
  deactivate: (id: string) => api.delete(`/listings/${id}`),
};

// Orders
export const orders = {
  list: (params?: any) => api.get("/orders", { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post("/orders", data),
};

// Matching (AI)
export const matching = {
  findMatches: (data: any) => api.post("/matching/find-matches", data),
  priceRecommendation: (listingId: string) =>
    api.post(`/matching/price-recommendation?listing_id=${listingId}`),
  demandForecast: (crop: string, region: string) =>
    api.post(`/matching/demand-forecast?crop_name=${crop}&region=${region}`),
};

// Logistics
export const logistics = {
  optimizeRoute: (data: any) => api.post("/logistics/optimize-route", data),
  consolidate: () => api.post("/logistics/consolidate"),
};

export default api;
