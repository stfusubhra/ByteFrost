import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Full-page loading screen shown while lazy-loaded routes hydrate.
 * Centered spinner with the KisanSetu brand color.
 */
export default function PageLoader({ label }: { label?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-3",
        "bg-background text-foreground"
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
