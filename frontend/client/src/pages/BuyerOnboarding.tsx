import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, MapPin, Package } from "lucide-react";
import { fetchMe, updateMe } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 0, label: "Business", icon: Building2 },
  { id: 1, label: "Delivery", icon: MapPin },
  { id: 2, label: "Preferences", icon: Package },
];

const BUSINESS_TYPES = [
  { value: "retail_chain", label: "Retail chain / supermarket" },
  { value: "restaurant", label: "Restaurant / hotel group" },
  { value: "wholesaler", label: "Wholesaler / distributor" },
  { value: "fpo", label: "FPO / cooperative" },
  { value: "other", label: "Other" },
];

const CROP_OPTIONS = ["Tomato", "Onion", "Potato", "Rice", "Wheat", "Brinjal", "Cauliflower", "Mango", "Cabbage", "Carrot", "Capsicum", "Garlic", "Ginger"];

export default function BuyerOnboarding() {
  const { refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    business_type: "",
    delivery_city: "",
    address: "",
    preferred_crops: [] as string[],
    monthly_volume_kg: "",
  });

  useEffect(() => {
    // Pre-fill from the server profile if it exists
    fetchMe()
      .then((me) => {
        const p = me.profile || {};
        setForm((f) => ({
          ...f,
          business_name: p.business_name || f.business_name,
          business_type: p.business_type || f.business_type,
          delivery_city: p.delivery_city || f.delivery_city,
          address: me.address || f.address,
          preferred_crops: p.preferred_crops || f.preferred_crops,
          monthly_volume_kg: p.monthly_volume_kg ? String(p.monthly_volume_kg) : f.monthly_volume_kg,
        }));
      })
      .catch(() => {});
  }, []);

  const toggleCrop = (crop: string) => {
    setForm((f) => ({
      ...f,
      preferred_crops: f.preferred_crops.includes(crop)
        ? f.preferred_crops.filter((c) => c !== crop)
        : [...f.preferred_crops, crop],
    }));
  };

  const canProceed = () => {
    if (step === 0) return form.business_name.trim().length > 0 && form.business_type.length > 0;
    if (step === 1) return form.delivery_city.trim().length > 0;
    return form.preferred_crops.length > 0;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateMe({
        business_name: form.business_name.trim(),
        business_type: form.business_type,
        delivery_city: form.delivery_city.trim(),
        address: form.address.trim() || undefined,
        preferred_crops: form.preferred_crops,
        monthly_volume_kg: form.monthly_volume_kg ? Number(form.monthly_volume_kg) : undefined,
        onboarding_completed: true,
      });
      await refreshUser();
      toast.success("Profile complete — welcome to KisanSetu procurement");
      navigate("/buyer-dashboard");
    } catch (e: any) {
      toast.error(e.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Button variant="ghost" size="sm" className="mb-4 h-auto p-0 text-muted-foreground" onClick={() => navigate("/buyer-dashboard")}>
        <ArrowLeft className="size-3.5" />
        Back to dashboard
      </Button>

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Set up your buyer profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three quick steps so we can match supply to your procurement needs.
        </p>
      </div>

      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                  active && "border-primary bg-primary/5 text-primary",
                  done && "border-emerald-300 bg-emerald-50 text-emerald-700",
                  !active && !done && "text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
                {s.label}
              </div>
              {s.id < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent className="space-y-6 p-6">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="business_name">Business name</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  placeholder="e.g. FreshMart Retail"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Business type</Label>
                <Select value={form.business_type} onValueChange={(v) => setForm((f) => ({ ...f, business_type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="delivery_city">Primary delivery city</Label>
                <Input
                  id="delivery_city"
                  value={form.delivery_city}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_city: e.target.value }))}
                  placeholder="e.g. Pune"
                />
                <p className="text-xs text-muted-foreground">
                  Matching and logistics are optimized around this location.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Delivery address (optional)</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. FC Road, Pune, Maharashtra"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label>Crops you buy regularly</Label>
                <div className="flex flex-wrap gap-2">
                  {CROP_OPTIONS.map((crop) => {
                    const selected = form.preferred_crops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:border-primary/50"
                        )}
                        aria-pressed={selected}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthly_volume">Approximate monthly volume (kg)</Label>
                <Input
                  id="monthly_volume"
                  type="number"
                  value={form.monthly_volume_kg}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_volume_kg: e.target.value }))}
                  placeholder="e.g. 5000"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!canProceed() || saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {saving ? "Saving…" : "Complete setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}