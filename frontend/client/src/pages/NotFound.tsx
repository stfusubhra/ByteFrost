import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

export default function NotFound() {
  return (
    <PublicLayout eyebrow="404 · Page Not Found">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Error</span>
          <h1>404. Route not found.</h1>
          <p>
            The page or route you requested does not exist or may have moved.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" href="/">
              Return to home <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
