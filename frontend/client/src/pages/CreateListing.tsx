/* KisanSetu Create Listing — farmer/FPO create a new produce listing */
import React, { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createListing } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CreateListingPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    crop_name: "",
    variety: "",
    quantity_kg: "",
    quality_grade: "A",
    price_per_kg: "",
    harvest_date: "",
    availability_start: "",
    availability_end: "",
    pickup_location: "",
    pickup_latitude: "",
    pickup_longitude: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.crop_name.trim()) {
      setError(t("createListing.err.cropName"));
      return;
    }
    if (!form.quantity_kg || Number(form.quantity_kg) <= 0) {
      setError(t("createListing.err.quantity"));
      return;
    }
    if (!form.price_per_kg || Number(form.price_per_kg) <= 0) {
      setError(t("createListing.err.price"));
      return;
    }
    if (!form.pickup_location.trim()) {
      setError(t("createListing.err.location"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        crop_name: form.crop_name.trim(),
        variety: form.variety.trim() || undefined,
        quantity_kg: Number(form.quantity_kg),
        quality_grade: form.quality_grade || undefined,
        price_per_kg: Number(form.price_per_kg),
        harvest_date: form.harvest_date || undefined,
        availability_start: form.availability_start || undefined,
        availability_end: form.availability_end || undefined,
        pickup_location: form.pickup_location.trim(),
        pickup_latitude: form.pickup_latitude ? Number(form.pickup_latitude) : undefined,
        pickup_longitude: form.pickup_longitude ? Number(form.pickup_longitude) : undefined,
        description: form.description.trim() || undefined,
      };
      await createListing(payload);
      toast.success(t("createListing.success"));
      // Redirect to dashboard after successful creation
      window.location.href = "/dashboard";
    } catch (err: any) {
      const msg = err.message || t("createListing.err.generic");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <ProtectedRoute allowedRoles={["farmer", "fpo_manager"]}>
        <div className="dash-shell">
          <div className="dash-body">
            <p className="state">{t("common.loginRequired")}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <Link
            href="/dashboard"
            className="btn btn-ghost btn-sm dash-back-link"
            aria-label={t("dash.backToSite")}
          >
            <ArrowLeft size={16} />
            <span>{t("dash.backToSite")}</span>
          </Link>
          <div className="breadcrumb">
            <span>{t("dash.workspace")}</span>
            <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
            <strong>{t("createListing.title")}</strong>
          </div>
        </div>
        <div className="dash-topbar-right">
          <div className="dash-avatar">
            {user?.full_name?.[0] ?? user?.email?.[0] ?? "U"}
          </div>
        </div>
      </header>

      <div className="dash-body">
        <main className="dash-main" style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px 48px" }}>
          <div className="dash-head" style={{ marginBottom: 24 }}>
            <div>
              <p className="eyebrow">{t("createListing.subtitle")}</p>
              <h1>{t("createListing.title")}</h1>
              <p className="state-body" style={{ marginTop: 6 }}>
                {t("createListing.description")}
              </p>
            </div>
          </div>

          {error && (
            <div className="card" style={{ padding: 16, marginBottom: 24, borderColor: "var(--error)", background: "var(--error-soft)" }}>
              <p style={{ color: "var(--error)" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold">{t("createListing.basicInfo")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="auth-field">
                  <label htmlFor="crop_name">{t("createListing.cropName")} <span className="text-error">*</span></label>
                  <input
                    type="text"
                    id="crop_name"
                    name="crop_name"
                    value={form.crop_name}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder={t("createListing.cropNamePlaceholder")}
                    autoFocus
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="variety">{t("createListing.variety")}</label>
                  <input
                    type="text"
                    id="variety"
                    name="variety"
                    value={form.variety}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder={t("createListing.varietyPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="auth-field">
                  <label htmlFor="quantity_kg">{t("createListing.quantity")} <span className="text-error">*</span></label>
                  <input
                    type="number"
                    id="quantity_kg"
                    name="quantity_kg"
                    value={form.quantity_kg}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder={t("createListing.quantityPlaceholder")}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="quality_grade">{t("createListing.qualityGrade")}</label>
                  <select
                    id="quality_grade"
                    name="quality_grade"
                    value={form.quality_grade}
                    onChange={handleChange}
                    className="auth-input"
                  >
                    <option value="A">{t("createListing.gradeA")}</option>
                    <option value="B">{t("createListing.gradeB")}</option>
                    <option value="C">{t("createListing.gradeC")}</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label htmlFor="price_per_kg">{t("createListing.price")} <span className="text-error">*</span></label>
                  <input
                    type="number"
                    id="price_per_kg"
                    name="price_per_kg"
                    value={form.price_per_kg}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder={t("createListing.pricePlaceholder")}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold">{t("createListing.dates")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="auth-field">
                  <label htmlFor="harvest_date">{t("createListing.harvestDate")}</label>
                  <input
                    type="date"
                    id="harvest_date"
                    name="harvest_date"
                    value={form.harvest_date}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="availability_start">{t("createListing.availStart")}</label>
                  <input
                    type="date"
                    id="availability_start"
                    name="availability_start"
                    value={form.availability_start}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="availability_end">{t("createListing.availEnd")}</label>
                  <input
                    type="date"
                    id="availability_end"
                    name="availability_end"
                    value={form.availability_end}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold">{t("createListing.location")}</h3>
              <div className="auth-field">
                <label htmlFor="pickup_location">{t("createListing.pickupLocation")} <span className="text-error">*</span></label>
                <input
                  type="text"
                  id="pickup_location"
                  name="pickup_location"
                  value={form.pickup_location}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder={t("createListing.pickupLocationPlaceholder")}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="auth-field">
                  <label htmlFor="pickup_latitude">{t("createListing.latitude")}</label>
                  <input
                    type="number"
                    id="pickup_latitude"
                    name="pickup_latitude"
                    value={form.pickup_latitude}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder={t("createListing.latitudePlaceholder")}
                    step="any"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="pickup_longitude">{t("createListing.longitude")}</label>
                  <input
                    type="number"
                    id="pickup_longitude"
                    name="pickup_longitude"
                    value={form.pickup_longitude}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder={t("createListing.longitudePlaceholder")}
                    step="any"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold">{t("createListing.description")}</h3>
              <div className="auth-field">
                <label htmlFor="description">{t("createListing.descriptionLabel")}</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder={t("createListing.descriptionPlaceholder")}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : t("createListing.submit")}
              </button>
              <Link href="/dashboard" className="btn btn-secondary flex-1">
                {t("common.cancel")}
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}