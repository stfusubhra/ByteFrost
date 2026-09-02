/* KisanSetu API client: a thin typed layer over the ByteFrost FastAPI backend.
 *
 * The backend is the source of truth for data. This client centralizes the
 * base URL, auth token handling, and error normalization so pages can focus on
 * rendering. All functions return typed data or throw a normalized ApiError.
 */
import axios, { AxiosError } from "axios";

// Use the same-origin proxy in production; override with VITE_API_URL for local
// development or a directly hosted backend.
const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

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
  explanation: {
    quantity_fit: number;
    price_score: number;
    distance_score: number;
    reliability: number;
    distance_km: number | null;
    order_history: number;
    [key: string]: unknown;
  };
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

export async function fetchListing(id: string): Promise<Listing> {
   const { data } = await client.get<Listing>(`/listings/${id}`);
   return data;
 }

// --- Order types ---
export interface OrderItemCreate {
   listing_id: string;
   quantity_kg: number;
}

export interface OrderCreate {
   items: OrderItemCreate[];
   delivery_address?: string;
   delivery_latitude?: number;
   delivery_longitude?: number;
   delivery_deadline?: string; // ISO string
   notes?: string;
}

export interface OrderItemResponse {
   id: string;
   listing_id: string;
   quantity_kg: number;
   price_per_kg: number;
}

export interface OrderResponse {
   id: string;
   buyer_id: string;
   status: string;
   total_amount?: number;
   delivery_address?: string;
   delivery_deadline?: string;
   created_at: string;
   items: OrderItemResponse[];
}

// --- Logistics Types ---
export interface RouteStopItem {
  id: string;
  stop_type: "PICKUP" | "HUB" | "DROP" | string;
  farmer_id?: string | null;
  hub_id?: string | null;
  buyer_id?: string | null;
  latitude: number;
  longitude: number;
  quantity_kg: number;
  sequence: number;
  time_window_earliest?: string | null;
  time_window_latest?: string | null;
  max_transit_hours?: number | null;
  eta?: string | null;
}

export interface VehicleItem {
  id: string;
  capacity_kg: number;
  vehicle_type: "STANDARD" | "REFRIGERATED" | string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  operating_cost_per_km: number;
}

export interface ShipmentItem {
  id: string;
  allocation_id?: string | null;
  order_id?: string | null;
  route_id?: string | null;
  vehicle_id?: string | null;
  status: string;
  landed_cost?: number | null;
  route_mode?: string | null;
  estimated_distance_km?: number | null;
  estimated_duration_min?: number | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  drop_latitude?: number | null;
  drop_longitude?: number | null;
  pickup_time?: string | null;
  delivery_time?: string | null;
  created_at: string;
}

export interface ShipmentDetailItem extends ShipmentItem {
  stops: RouteStopItem[];
  vehicle?: VehicleItem | null;
  maps_url?: string | null;
}

export interface TrackingEventItem {
  id: string;
  event_type: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  timestamp: string;
}

export interface TrackingStatusData {
  shipment_id: string;
  current_status: string;
  current_latitude?: number | null;
  current_longitude?: number | null;
  estimated_arrival?: string | null;
  events: TrackingEventItem[];
  maps_url?: string | null;
}

export interface BuyerRequirementData {
  crop_name: string;
  required_quantity_kg: number;
  min_quality_grade?: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_address: string;
  delivery_deadline?: string;
  max_price_per_kg?: number;
}

export interface MatchedFarmerData {
  listing_id: string;
  farmer_id: string;
  farmer_name: string;
  crop_name: string;
  available_kg: number;
  allocated_kg: number;
  price_per_kg: number;
  quality_grade: string;
  distance_km: number;
  latitude: number;
  longitude: number;
  score: number;
  reliability_score: number;
  estimated_transport_cost: number;
  explanation: Record<string, any>;
}

export interface SupplierMatchResponseData {
  status: "FEASIBLE" | "PARTIAL" | "INFEASIBLE" | string;
  matched_farmers: MatchedFarmerData[];
  total_matched_kg: number;
  required_kg: number;
  shortage_kg: number;
  infeasibility_reason?: string | null;
}

export interface HubCapacityData {
  hub_id: string;
  hub_name: string;
  hub_type: string;
  total_capacity_kg: number;
  occupied_capacity_kg: number;
  reserved_capacity_kg: number;
  available_capacity_kg: number;
  incoming_quantity_kg: number;
  outgoing_quantity_kg: number;
  utilization_pct: number;
  can_accommodate: boolean;
}

export interface HubRoutingEvaluationRequestData {
  farmer_locations: Array<{ lat: number; lng: number; quantity_kg: number }>;
  buyer_latitude: number;
  buyer_longitude: number;
  total_kg: number;
  delivery_deadline?: string;
  max_freshness_hours?: number;
}

export interface HubRoutingEvaluationResponseData {
  mode: "direct" | "hub" | "multi_hub" | string;
  local_hub?: {
    hub_id: string;
    name: string;
    hub_type: string;
    capacity_kg: number;
    available_kg: number;
    distance_to_centroid_km: number;
  } | null;
  regional_hub?: {
    hub_id: string;
    name: string;
    hub_type: string;
    capacity_kg: number;
    available_kg: number;
    distance_to_centroid_km: number;
  } | null;
  direct_cost_estimate: number;
  hub_cost_estimate: number;
  multi_hub_cost_estimate: number;
  direct_duration_hours: number;
  hub_duration_hours: number;
  multi_hub_duration_hours: number;
  is_direct_feasible: boolean;
  is_hub_feasible: boolean;
  is_multi_hub_feasible: boolean;
  reason: string;
}

export interface MatchedVehicleDetailData {
  vehicle_id: string;
  vehicle_type: string;
  capacity_kg: number;
  current_load_kg: number;
  net_available_kg: number;
  allocated_load_kg: number;
  operating_cost_per_km: number;
  distance_to_pickup_km: number;
  score: number;
}

export interface VehicleMatchRequestData {
  required_capacity_kg: number;
  pickup_latitude: number;
  pickup_longitude: number;
  requires_refrigeration?: boolean;
  max_distance_km?: number;
  max_duration_hours?: number;
}

export interface VehicleMatchResponseData {
  status: "MATCHED" | "INSUFFICIENT_CAPACITY" | "NO_VEHICLES_AVAILABLE" | string;
  required_kg: number;
  total_allocated_kg: number;
  shortfall_kg: number;
  vehicles: MatchedVehicleDetailData[];
  requires_multiple_vehicles: boolean;
  refrigeration_met: boolean;
  explanation: string;
}

export interface LandedCostBreakdownData {
  produce_cost: number;
  transport_cost: number;
  handling_cost: number;
  expected_loss: number;
  total: number;
  is_economically_viable: boolean;
  warning?: string | null;
}

export interface FulfillmentPlanData {
  status: "FEASIBLE" | "PARTIAL" | "INFEASIBLE" | string;
  infeasibility_reason?: string | null;
  routing_mode?: string | null;
  vehicle_routes?: Array<{
    vehicle_id: string;
    stops: RouteStopItem[];
    distance_km: number;
    duration_min: number;
    load_kg: number;
    operating_cost: number;
  }>;
  landed_cost?: LandedCostBreakdownData | null;
  consolidation_savings_km?: number | null;
  estimated_delivery?: string | null;
  shipment_ids: string[];
}

export interface IncidentReportData {
  incident_type: "TRUCK_BREAKDOWN" | "FARMER_CANCELLED";
  latitude?: number;
  longitude?: number;
  cancelled_farmer_id?: string;
  notes?: string;
}

// --- Authenticated endpoint for creating an order ---
export async function createOrder(orderData: OrderCreate): Promise<OrderResponse> {
   const { data } = await client.post<OrderResponse>("/orders/", orderData);
   return data;
}

// --- Logistics Endpoints ---
export async function fetchShipments(params?: {
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<ShipmentItem[]> {
  const { data } = await client.get<ShipmentItem[]>("/shipments/", { params });
  return data;
}

export async function fetchShipment(shipmentId: string): Promise<ShipmentDetailItem> {
  const { data } = await client.get<ShipmentDetailItem>(`/shipments/${shipmentId}`);
  return data;
}

export async function updateShipmentStatus(
  shipmentId: string,
  payload: { status: string; notes?: string; latitude?: number; longitude?: number }
): Promise<ShipmentItem> {
  const { data } = await client.patch<ShipmentItem>(`/shipments/${shipmentId}/status`, payload);
  return data;
}

export async function fetchTracking(shipmentId: string): Promise<TrackingStatusData> {
  const { data } = await client.get<TrackingStatusData>(`/tracking/${shipmentId}`);
  return data;
}

export async function postTrackingEvent(
  shipmentId: string,
  event: { event_type: string; latitude?: number; longitude?: number; notes?: string }
): Promise<TrackingEventItem> {
  const { data } = await client.post<TrackingEventItem>(`/tracking/${shipmentId}/events`, event);
  return data;
}

export async function fulfillOrder(requirement: BuyerRequirementData): Promise<FulfillmentPlanData> {
  const { data } = await client.post<FulfillmentPlanData>("/logistics/fulfill-order", requirement);
  return data;
}

export async function reportShipmentIncident(
  shipmentId: string,
  payload: IncidentReportData
): Promise<any> {
  const { data } = await client.post(`/logistics/shipments/${shipmentId}/incident`, payload);
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

export async function matchSuppliers(
  payload: BuyerRequirementData
): Promise<SupplierMatchResponseData> {
  const { data } = await client.post<SupplierMatchResponseData>(
    "/matching/match-suppliers",
    payload
  );
  return data;
}

export async function fetchHubCapacity(
  hubId: string,
  requestedKg = 0
): Promise<HubCapacityData> {
  const { data } = await client.get<HubCapacityData>(
    `/logistics/hubs/${hubId}/capacity`,
    { params: { requested_kg: requestedKg } }
  );
  return data;
}

export async function evaluateHubMode(
  payload: HubRoutingEvaluationRequestData
): Promise<HubRoutingEvaluationResponseData> {
  const { data } = await client.post<HubRoutingEvaluationResponseData>(
    "/logistics/evaluate-hub-mode",
    payload
  );
  return data;
}

export async function matchVehicles(
  payload: VehicleMatchRequestData
): Promise<VehicleMatchResponseData> {
  const { data } = await client.post<VehicleMatchResponseData>(
    "/logistics/match-vehicles",
    payload
  );
  return data;
}

export { API_BASE, client as api };

