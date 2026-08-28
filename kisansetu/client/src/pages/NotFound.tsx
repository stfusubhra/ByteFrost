import { Link } from "wouter";
import { ArrowRight, AlertTriangle } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

export default function NotFound() {
  return (
    <PublicLayout eyebrow="404 · Page Not Found">
      <section className="public-hero compact">
        <span>00 / ERROR</span>
        <h1>
          404.
          <br />
          <em>Route not found.</em>
        </h1>
        <p>
          The page or route you requested does not exist or may have moved.
        </p>
        <Link className="public-pill" href="/">
          Return to home <ArrowRight size={14} />
        </Link>
      </section>
    </PublicLayout>
  );
}
