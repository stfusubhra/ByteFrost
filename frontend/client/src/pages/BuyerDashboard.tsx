import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchListings, createOrder, OrderResponse } from "@/lib/api";
import { toast } from "sonner";

export default function BuyerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState([] as any[]);
  const [cart, setCart] = useState([] as any[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const data = await fetchListings();
        setListings(data);
      } catch (e) {
        toast.error("Failed to load marketplace");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const addToCart = (listing: any) => {
    setCart((c) => [...c, { ...listing, quantity: 1 }]);
    toast.success("Added to cart");
  };

  const checkout = async () => {
    if (cart.length === 0) return toast.error("Cart empty");
    try {
      const order = await createOrder({
        items: cart.map((i) => ({ listing_id: i.id, quantity_kg: i.quantity })),
      });
      toast.success(`Order placed: ${order.id}`);
      setCart([]);
    } catch (e) {
      toast.error("Order failed");
    }
  };

  if (!isAuthenticated) return <div>{t("common.loginRequired")}</div>;

  return (
    <div className="buyer-dashboard">
      <h2>{t("buyer.dashboard.title")}</h2>
      {loading ? (
        <p>{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <div key={l.id} className="card">
              <h3>{l.crop_name}</h3>
              <p>{l.quantity_kg} kg @ ₹{l.price_per_kg}/kg</p>
              <button className="btn btn-primary" onClick={() => addToCart(l)}>
                {t("buyer.addToCart")}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="cart mt-6">
        <h3>{t("buyer.cart.title")}</h3>
        {cart.map((c, idx) => (
          <div key={idx}>{c.crop_name} x {c.quantity}</div>
        ))}
        <button className="btn btn-success" onClick={checkout}>
          {t("buyer.checkout")}
        </button>
      </div>
    </div>
  );
}
