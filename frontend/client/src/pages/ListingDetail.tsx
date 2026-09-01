import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { fetchListing, Listing } from "@/lib/api";
import { createOrder, OrderCreate } from "@/lib/api";
import PublicLayout from "@/components/PublicLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight, MapPin, Loader2, CheckCircle } from "lucide-react";

export default function ListingDetail() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const getSellerName = (_listing: Listing): string => {
    return t("listing.verifiedProducer");
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
          setQuantity(data.quantity_kg);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : t("dash.failed")
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadListing();
    return () => {
      isMounted = false;
    };
  }, [id, t]);

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
      };
      const response = await createOrder(orderData);
      setOrderSuccess(true);
      showToast(`Order placed! Order ID: ${response.id}`);
      setQuantity(listing.quantity_kg);
      setNotes("");
    } catch (err: any) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to place order. Please check your credentials and try again.";
      setOrderError(message);
      showToast(message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout eyebrow={t("listing.loading")}>
        <div className="container stack" style={{ alignItems: "center", paddingTop: 40, paddingBottom: 40 }}>
          <Loader2 size={32} />
          <p className="state-body">{t("listing.loading")}</p>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout eyebrow={t("marketplace.backendError")}>
        <div className="container stack">
          <div className="badge badge-error">{t("marketplace.backendError")}</div>
          <p className="state-body">{error}</p>
          <Link href="/" className="btn btn-secondary">
            {t("listing.backHome")}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (!listing) {
    return (
      <PublicLayout eyebrow={t("notfound.eyebrow")}>
        <div className="container stack">
          <div className="badge badge-error">{t("listing.notFound")}</div>
          <p className="state-body">{t("listing.notFound")}: {id}</p>
          <Link href="/marketplace" className="btn btn-secondary">
            {t("listing.backMarketplace")}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout eyebrow={`${listing.crop_name} / KisanSetu`}>
      {toast && <div className="public-toast">{toast}</div>}
      <section className="container py-8 md:py-12">
        <div className="listing-detail-layout">
          {/* Image */}
          <div className="detail-image">
            <img
              src={getImage(listing.crop_name)}
              alt={`${listing.crop_name} listing`}
            />
            <span className="badge badge-neutral">
              {listing.is_active ? t("listing.readyToMove") : t("listing.inactive")}
            </span>
          </div>

          {/* Details */}
          <div className="detail-content">
            <h1>{listing.crop_name}</h1>
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <span className="badge badge-primary">{listing.quality_grade || "Grade A"}</span>
              <span className="row" style={{ gap: 4 }}>
                <MapPin size={14} /> {listing.pickup_location || t("marketplace.locationTBA")}
              </span>
            </div>
            <p className="state-body" style={{ marginTop: 12, color: "var(--ink-soft)" }}>
              <strong>{t("listing.seller")}</strong> {getSellerName(listing)}
            </p>

            <div className="detail-stats">
              <div className="detail-stat">
                <small>{t("listing.qtyAvailable")}</small><strong>{listing.quantity_kg.toLocaleString()} kg</strong>
              </div>
              <div className="detail-stat">
                <small>{t("listing.pricePerKg")}</small><strong>{listing.price_per_kg !== null ? `₹${listing.price_per_kg.toFixed(2)}/kg` : t("marketplace.priceOnRequest")}</strong>
              </div>
              <div className="detail-stat">
                <small>{t("listing.harvestDate")}</small><strong>{listing.harvest_date || t("marketplace.harvestDateTBA")}</strong>
              </div>
            </div>

            {/* Order Form */}
            <div className="detail-order">
              <h2>{t("listing.placeOrder")}</h2>
              <p className="state-body" style={{ color: "var(--ink-soft)", marginBottom: 12 }}>
                {t("listing.orderDesc")} (max {listing.quantity_kg.toLocaleString()} kg).
              </p>

              {orderError && (
                <div className="badge badge-error" style={{ marginBottom: 12 }}>
                  {orderError}
                </div>
              )}

              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <label className="row" style={{ gap: 4, alignItems: "center" }}>
                  <span>{t("listing.quantityKg")}</span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setQuantity(isNaN(val) ? 0 : val);
                    }}
                    className="input"
                  />
                </label>
              </div>

              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <label className="stack" style={{ gap: 4, alignItems: "start" }}>
                  <span>{t("listing.notes")}</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="input"
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
                    <span> {t("listing.placingOrder")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span> {t("listing.placeOrder")}</span>
                  </>
                )}
              </button>

              {orderSuccess && (
                <div className="badge badge-success" style={{ marginTop: 12 }}>
                  {t("listing.orderSuccess")}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Action buttons */}
      <div className="container detail-actions" style={{ justifyContent: "center" }}>
        <Link href="/marketplace" className="btn btn-ghost">
          {t("listing.backMarketplace")}
        </Link>
        <Link href={`/market-match`} className="btn btn-secondary">
          {t("listing.findMatch")} <ArrowRight size={15} />
        </Link>
      </div>
    </PublicLayout>
  );
}
