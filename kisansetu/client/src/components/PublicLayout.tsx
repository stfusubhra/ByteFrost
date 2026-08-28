/* KisanSetu public shell: quiet editorial navigation shared by marketplace, match, story, FAQ, contact, and dashboard entry. Adds site-wide scroll progress, scroll reveals, animated menu, and a product-grade footer. */
import { Link } from "wouter";
import { ArrowUpRight, Mail, MapPin, Menu, Sprout, X } from "lucide-react";
import { useEffect, useState } from "react";

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, []);
  return progress;
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)),
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );
    document.querySelectorAll(".public-reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

const menuLinks = [
  { href: "/", label: "Home", index: "01" },
  { href: "/marketplace", label: "Marketplace", index: "02" },
  { href: "/market-match", label: "Find your market match", index: "03" },
  { href: "/story", label: "Our story", index: "04" },
  { href: "/faq", label: "FAQ", index: "05" },
  { href: "/contact", label: "Contact", index: "06" },
];

export default function PublicLayout({ children, eyebrow = "Direct market intelligence for everyday farming" }: { children: React.ReactNode; eyebrow?: string }) {
  const [open, setOpen] = useState(false);
  const progress = useScrollProgress();
  useReveal();
  return <div className="public-site"><div className="public-scrollbar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" /><div className="public-announcement">{eyebrow}</div><header className="public-header"><button className="public-menu-trigger" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /><span>Menu</span></button><Link href="/" className="public-wordmark"><span><Sprout size={15} /></span>KisanSetu</Link><nav className="public-nav"><Link href="/marketplace">Marketplace</Link><Link href="/market-match">Find your market match</Link><Link href="/dashboard">Product</Link></nav></header>{open && <div className="public-drawer" role="dialog" aria-modal="true" aria-label="Menu"><div className="public-drawer-top"><button className="public-drawer-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={22} /></button></div><div className="public-drawer-links">{menuLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}><span className="public-drawer-index">{link.index}</span><span className="public-drawer-label">{link.label}</span><ArrowUpRight className="public-drawer-arrow" size={20} /></Link>)}</div><div className="public-drawer-foot"><span>Market, made clearer.</span><a href="mailto:hello@kisansetu.in">hello@kisansetu.in</a></div></div>}<main>{children}</main><footer className="public-footer"><div className="public-footer-brand"><Link href="/" className="public-wordmark"><span><Sprout size={15} /></span>KisanSetu</Link><p>Direct market intelligence for everyday farming. We bring supply, demand, and the route between them into one clearer view.</p><div className="public-footer-contact"><span><MapPin size={13} /> Nashik · Pune · Remote</span><a href="mailto:hello@kisansetu.in"><Mail size={13} /> hello@kisansetu.in</a></div></div><div className="public-footer-col"><span className="public-footer-head">Explore</span><Link href="/marketplace">Marketplace</Link><Link href="/market-match">Market match</Link><Link href="/dashboard">Product</Link></div><div className="public-footer-col"><span className="public-footer-head">Company</span><Link href="/story">Our story</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link></div><div className="public-footer-cta"><span className="public-footer-head">Get started</span><p>See what a clearer market looks like for your produce.</p><Link className="public-pill" href="/market-match">Find your match <ArrowUpRight size={14} /></Link></div><div className="public-footer-bottom"><span>© {new Date().getFullYear()} KisanSetu. Market, made clearer.</span><span>Built for farmers, buyers, and the people between them.</span></div></footer></div>;
}
