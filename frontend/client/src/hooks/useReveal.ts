import { useEffect } from "react";

interface UseRevealOptions {
  /** IntersectionObserver threshold (0–1). Default 0.14. */
  threshold?: number;
  /** IntersectionObserver rootMargin. Default "0px 0px -10% 0px". */
  rootMargin?: string;
  /** Selector for elements to observe. Default ".reveal". */
  selector?: string;
}

/**
 * Shared reveal-on-scroll hook. Observes elements matching `selector` and
 * toggles the `is-visible` class when they enter the viewport.
 *
 * Used by both PublicLayout and Home so the reveal behavior stays consistent.
 */
export function useReveal({
  threshold = 0.14,
  rootMargin = "0px 0px -10% 0px",
  selector = ".reveal",
}: UseRevealOptions = {}) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle("is-visible", entry.isIntersecting)
        ),
      { threshold, rootMargin }
    );
    document.querySelectorAll(selector).forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [threshold, rootMargin, selector]);
}
