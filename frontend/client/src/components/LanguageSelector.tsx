/* KisanSetu LanguageSelector — compact globe dropdown matching existing button style */
import { useEffect, useRef, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { LANGUAGES, type LangCode } from "../locales";
import { useLanguage } from "../contexts/LanguageContext";

interface LanguageSelectorProps {
  /** "light" = for dark navbar (Home/premium-landing)
   *  "dark"  = for light navbar (PublicLayout)  */
  variant?: "light" | "dark";
}

export default function LanguageSelector({ variant = "dark" }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const isLight = variant === "light";
  const textColor = isLight ? "#f6f5f0" : "#1a1d19";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (code: LangCode) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      className={`lang-selector lang-selector--${variant}`}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <button
        className="lang-selector-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        style={{
          all: "unset",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "5px 9px",
          borderRadius: "6px",
          border: "1px solid transparent",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          color: textColor,
          lineHeight: 1,
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          const bg = isLight ? "rgba(246,245,240,0.14)" : "rgba(35,92,69,0.08)";
          (e.currentTarget as HTMLButtonElement).style.background = bg;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <Globe size={13} aria-hidden="true" style={{ flexShrink: 0, color: textColor }} />
        <span style={{ color: textColor }}>{current.nativeLabel}</span>
        <ChevronDown
          size={11}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: textColor,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        />
      </button>

      {open && (
        <ul
          className="lang-selector-dropdown"
          role="listbox"
          aria-label="Available languages"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 400,
            minWidth: "148px",
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.07)",
            listStyle: "none",
            margin: 0,
            padding: "5px",
            animation: "lang-drop-in 160ms cubic-bezier(.23,1,.32,1) both",
          }}
        >
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang} style={{ margin: 0 }}>
              <button
                onClick={() => handleSelect(l.code)}
                style={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  background: l.code === lang ? "#e6f2e6" : "transparent",
                  transition: "background 140ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f0f6f0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = l.code === lang ? "#e6f2e6" : "transparent"; }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1d19" }}>{l.nativeLabel}</span>
                <span style={{ fontSize: "10px", color: "#7a8c7e" }}>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
