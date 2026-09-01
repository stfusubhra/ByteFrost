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
    <div ref={ref} className={`lang-selector lang-selector--${variant}`}>
      <button
        className="lang-selector-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        <Globe size={13} aria-hidden="true" />
        <span>{current.nativeLabel}</span>
        <ChevronDown
          size={11}
          aria-hidden="true"
          className={open ? "rotated" : undefined}
        />
      </button>

      {open && (
        <ul
          className="lang-selector-dropdown"
          role="listbox"
          aria-label="Available languages"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                onClick={() => handleSelect(l.code)}
                className={l.code === lang ? "active" : undefined}
              >
                <span className="lang-native">{l.nativeLabel}</span>
                <span className="lang-label">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
