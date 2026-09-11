/* KisanSetu Create Listing — farmer/FPO create a new produce listing */
import React, { useState } from "react";
import { Link, Redirect } from "wouter";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  MapPin,
  Package,
  Sprout,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createListing } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t("dash.backToSite")}
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{t("dash.backToSite")}</span>
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-semibold text-foreground">{t("createListing.title")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user?.full_name?.[0] ?? user?.email?.[0] ?? "U"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {t("createListing.subtitle")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("createListing.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("createListing.description")}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Basic Information */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Package className="size-4.5 text-primary" />
              </div>
              <CardTitle className="text-base">{t("createListing.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="crop_name">
                    {t("createListing.cropName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="crop_name"
                    name="crop_name"
                    value={form.crop_name}
                    onChange={handleChange}
                    placeholder={t("createListing.cropNamePlaceholder")}
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variety">{t("createListing.variety")}</Label>
                  <Input
                    id="variety"
                    name="variety"
                    value={form.variety}
                    onChange={handleChange}
                    placeholder={t("createListing.varietyPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity_kg">
                    {t("createListing.quantity")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity_kg"
                    name="quantity_kg"
                    type="number"
                    value={form.quantity_kg}
                    onChange={handleChange}
                    placeholder={t("createListing.quantityPlaceholder")}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("createListing.qualityGrade")}</Label>
                  <Select
                    value={form.quality_grade}
                    onValueChange={(value) => {
                      setForm((prev) => ({ ...prev, quality_grade: value }));
                      setError(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("createListing.qualityGrade")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">{t("createListing.gradeA")}</SelectItem>
                      <SelectItem value="B">{t("createListing.gradeB")}</SelectItem>
                      <SelectItem value="C">{t("createListing.gradeC")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_kg">
                    {t("createListing.price")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="price_per_kg"
                      name="price_per_kg"
                      type="number"
                      value={form.price_per_kg}
                      onChange={handleChange}
                      placeholder={t("createListing.pricePlaceholder")}
                      className="pl-7"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Dates */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="size-4.5 text-primary" />
              </div>
              <CardTitle className="text-base">{t("createListing.dates")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="harvest_date">{t("createListing.harvestDate")}</Label>
                  <Input
                    id="harvest_date"
                    name="harvest_date"
                    type="date"
                    value={form.harvest_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability_start">{t("createListing.availStart")}</Label>
                  <Input
                    id="availability_start"
                    name="availability_start"
                    type="date"
                    value={form.availability_start}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability_end">{t("createListing.availEnd")}</Label>
                  <Input
                    id="availability_end"
                    name="availability_end"
                    type="date"
                    value={form.availability_end}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pickup Location */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="size-4.5 text-primary" />
              </div>
              <CardTitle className="text-base">{t("createListing.location")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pickup_location">
                  {t("createListing.pickupLocation")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pickup_location"
                  name="pickup_location"
                  value={form.pickup_location}
                  onChange={handleChange}
                  placeholder={t("createListing.pickupLocationPlaceholder")}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pickup_latitude">{t("createListing.latitude")}</Label>
                  <Input
                    id="pickup_latitude"
                    name="pickup_latitude"
                    type="number"
                    value={form.pickup_latitude}
                    onChange={handleChange}
                    placeholder={t("createListing.latitudePlaceholder")}
                    step="any"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup_longitude">{t("createListing.longitude")}</Label>
                  <Input
                    id="pickup_longitude"
                    name="pickup_longitude"
                    type="number"
                    value={form.pickup_longitude}
                    onChange={handleChange}
                    placeholder={t("createListing.longitudePlaceholder")}
                    step="any"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-4.5 text-primary" />
              </div>
              <CardTitle className="text-base">{t("createListing.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">{t("createListing.descriptionLabel")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder={t("createListing.descriptionPlaceholder")}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild className="sm:flex-1 sm:max-w-[160px]">
              <Link href="/dashboard">{t("common.cancel")}</Link>
            </Button>
            <Button type="submit" disabled={loading} className="sm:flex-1 sm:max-w-[220px]">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sprout className="size-4" />}
              {t("createListing.submit")}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}