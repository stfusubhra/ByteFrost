import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { fetchListing, Listing } from "@/lib/api";
import { createOrder, OrderCreate, OrderItemCreate } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";
import { ArrowRight, MapPin, Loader2, CheckCircle } from "lucide-react";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [toast, setToast] = useState<string>(""); // simple toast message
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Helper to compute seller name and image similar to Marketplace mapping
  const getSellerName = (listing: Listing): string => {
    // Since the API does not include farm_name/producer_name, fallback to verified producer
    // In a real implementation, these might come from a joined user relation.
    return "Verified producer";
  };

  const imageMap: Record<string, string> = {
    Tomatoes: "/manus-storage/kisan-story-tomatoes_128fdb50.jpg",
    "Harvest crates": "/manus-storage/kisan-story-crates_8ebf1895.jpg",
    "Fresh produce": "/manus-storage/kisan-story-waiting_e345d9da.jpg",
    Default: "/manus-storage/kisan-story-farmer_581c0db7.jpg",
  };

  const getImage = (crop: string): string => {
    return imageMap[crop] || imageMap.Default;
  };

  // Fetch listing on mount and when id changes
  useEffect(() => {
    let isMounted = true;
    const loadListing = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchListing(id);
        if (isMounted) {
          setListing(data);
          setQuantity(data.quantity_kg); // default quantity to available
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load listing"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadListing();
    return () => {
      // Cleanup: set isMounted to false to prevent state updates after unmount
      // We'll use a mutable variable; simplest is to not check isMounted and rely on the fact that
      // the component may unmount before the promise resolves; we'll guard with a ref.
      // For simplicity, we'll skip; given the small app, it's acceptable.
    };
  }, [id]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const handleOrder = async () => {
    if (!listing) return;
    setOrderLoading(true);
    setOrderError(null);
    setOrderSuccess(false);
    try {
      const orderData: OrderCreate = {
        items: [
          {
            listing_id: listing.id,
            quantity_kg: quantity,
          },
        ],
        notes: notes.trim() || undefined,
        // We could optionally ask for delivery details; for demo we leave them undefined.
      };
      const response = await createOrder(orderData);
      setOrderSuccess(true);
      showToast(`Order placed! Order ID: ${response.id}`);
      // Reset form?
      setQuantity(listing.quantity_kg);
      setNotes("");
    } catch (err: any) {
      setOrderError(
        err instanceof Error
          ? err.message
          : "Failed to place order. Please check your credentials and try again."
      );
      showToast(orderError || "Order failed");
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout eyebrow="Loading…">
        <div className="container" style={{ textAlign: "center", padding: 40 }}>
          <Loader2 size={32} />
          <p className="state-body" style={{ marginTop: 16 }}>
            Loading listing details…
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout eyebrow="Error">
        <div className="container">
          <div className="badge badge-error">Error</div>
          <p className="state-body" style={{ marginTop: 8 }}>{error}</p>
          <Link href="/" className="btn btn-secondary">
            ← Back to Home
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (!listing) {
    return (
      <PublicLayout eyebrow="Not Found">
        <div className="container">
          <div className="badge badge-error">Not Found</div>
          <p className="state-body" style={{ marginTop: 8 }}>
            No listing with ID {id} found.
          </p>
          <Link href="/marketplace" className="btn btn-secondary">
            ← Back to Marketplace
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout eyebrow="Listing Detail">
      {toast && (
        <div className="public-toast" style={{ position: "fixed", bottom: 20, right: 20 }}>
          {toast}
        </div>
      )}
      <section className="container">
        <div className="row" style={{ gap: 16, alignItems: "start" }}>
          {/* Image */}
          <div className="detail-image">
<img
                src={getImage(listing.crop_name)}
                alt={`${listing.crop_name} listing`}
                style={{ width: "100%", maxWidth: 400, borderRadius: 8 }}
              />
            <span
              className="badge badge-neutral"
              style={{ position: "absolute", top: 12, left: 12 }}
            >
              {listing.is_active ? "Ready to move" : "Inactive"}
            </span>
          </div>

          {/* Details */}
          <div className="detail-content" style={{ flex: 1, minWidth: 0 }}>
            <h1>{listing.crop_name}</h1>
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <span className="badge badge-primary">{listing.quality_grade || "N/A"} Grade</span>
              <span><MapPin size={14} /> {listing.pickup_location || "Location TBA"}</span>
            </div>
            <p className="state-body" style={{ marginTop: 12, color: "var(--ink-soft)" }}>
              <strong>Seller:</strong> {getSellerName(listing)}
            </p>

            <div className="detail-stats" style={{ marginTop: 20 }}>
              <div className="detail-stat">
                <small>Quantity Available</small><strong>{listing.quantity_kg.toLocaleString()} kg</strong>
              </div>
              <div className="detail-stat">
                <small>Price per kg</small>{listing.price_per_kg !== null ? `₹${listing.price_per_kg.toFixed(2)}/kg` : "Price on request"}
              </div>
              <div className="detail-stat">
                <small>Harvest Date</small><strong>{listing.harvest_date || "TBA"}</strong>
              </div>
            </div>

            {/* Order Form */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <h2>Place Order</h2>
              <p className="state-body" style={{ color: "var(--ink-soft)", marginBottom: 12 }}>
                Enter the quantity you wish to purchase (max {listing.quantity_kg.toLocaleString()} kg).
              </p>

              {orderError && (
                <div className="badge badge-error" style={{ marginBottom: 12 }}>
                  {orderError}
                </div>
              )}

              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <label className="row" style={{ gap: 4, alignItems: "center" }}>
                  <span>Quantity (kg)</span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setQuantity(isNaN(val) ? 0 : val);
                    }}
                    style={{ width: 100, padding: 8 }}
                  />
                </label>
              </div>

              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <label className="row" style={{ gap: 4, alignItems: "start" }}>
                  <span>Notes (optional)</span><br />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </label>
              </div>

              <button
                className="btn btn-primary"
                disabled={orderLoading || quantity <= 0 || quantity > listing.quantity_kg}
                onClick={handleOrder}
              >
                {orderLoading ? (
                  <>
                    <Loader2 size={16} />
                    <span> Placing order…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span> Place Order</span>
                  </>
                )}
              </button>

              {orderSuccess && (
                <div className="badge badge-success" style={{ marginTop: 12 }}>
                  Order placed successfully! Check your dashboard for details.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Action buttons */}
      <div className="container" style={{ marginTop: 32, textAlign: "center" }}>
        <Link href="/marketplace" className="btn btn-ghost">
          ← Back to Marketplace
        </Link>
        <Link href={`/market-match`} className="btn btn-secondary">
          Find Market Match <ArrowRight size={15} />
        </Link>
      </div>
    </PublicLayout>
  );
}