// KisanSetu Design Tokens
// Single source of truth for design values
// https://github.com/stfusubhra/ByteFrost

export const tokens = {
  // === SPACING (4px base scale) ===
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "40px",
  },

  // === RADII ===
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px", // Retain for select icons only
  },

  // === COLORS ===
  colors: {
    // Canvas
    background: "#F5F5F2", // Warm cream
    backgroundSubtle: "#EFEBE4",
    backgroundSurface: "#FAFAF8",

    // Surface (cards)
    surface: "#FFFFFF",
    surfaceMuted: "#F3F1E9",

    // Ink
    text: "#1A1A1A", // Deep charcoal
    textMuted: "#555555",
    textLight: "#9A9A93",

    // Primary — agricultural green
    primary: "#2E593C",
    primaryStrong: "#24562C",
    primarySoft: "#EAF1E8",
    primaryAccent: "#3D8A63",

    // Earth accent
    earth: "#8A8F55",
    earthLight: "#B5C17F",
    earthDark: "#5E6341",

    // Success
    success: "#0F9D58",
    successLight: "#E8F5E9",
    successDark: "#077B47",

    // Warning
    warning: "#F9A825",
    warningLight: "#FFFBEB",
    warningDark: "#CA8A04",

    // Error
    error: "#D93025",
    errorLight: "#FDE8E7",
    errorDark: "#C5221F",

    // Info
    info: "#2F6F8F",
    infoLight: "#E1F5FE",
    infoDark: "#0277BD",

    // Lines
    border: "#E8E4DA",
    borderStrong: "#D5D1C8",
    borderLight: "#FADFC6",

    // Neutral hints
    neutral: {
      50: "#F9F9F9",
      100: "#F5F5F5",
    },
  },

  // === TYPOGRAPHY ===
  typography: {
    font: {
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      display: ["DM Sans", "Geist", "Georgia", "serif"],
      mono: ["Menlo", "Monaco", "Courier New", "monospace"],
    },
    sizes: {
      display: [
        { size: "64px", weight: 400, lineHeight: "1.04", letterSpacing: "-0.015em" },
        { size: "48px", weight: 400, lineHeight: "1.08", letterSpacing: "-0.012em" },
        { size: "36px", weight: 400, lineHeight: "1.12", letterSpacing: "-0.01em" },
      ],
      h1: [
        { size: "clamp(30px, 4vw, 36px)", weight: 650, lineHeight: "1.12", letterSpacing: "-0.02em" },
      ],
      h2: [
        { size: "clamp(24px, 3vw, 30px)", weight: 650, lineHeight: "1.16", letterSpacing: "-0.015em" },
      ],
      h3: [
        { size: "20px", weight: 600, lineHeight: "1.3", letterSpacing: "-0.008em" },
      ],
      body: [
        { size: "15px", weight: 400, lineHeight: "1.6" },
        { size: "14px", weight: 400, lineHeight: "1.55" },
        { size: "13px", weight: 400, lineHeight: "1.5" },
      ],
      small: { size: "13px", weight: 500, lineHeight: "1.5" },
      meta: { size: "12px", weight: 400, lineHeight: "1.4", color: "textMuted" },
      label: { size: "13px", weight: 600, lineHeight: "1.3", color: "text", letterSpacing: "0.05em", textTransform: "uppercase" },
    },
  },

  // === SHADOWS ===
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
    md: "0 2px 4px rgba(0, 0, 0, 0.06)",
    lg: "0 4px 12px rgba(0, 0, 0, 0.08)",
    xl: "0 8px 24px rgba(0, 0, 0, 0.10)",
    inner: "inset 0 2px 4px rgba(0, 0, 0, 0.03)",
  },

  // === MOTION ===
  motion: {
    duration: {
      instant: 150,
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      linear: "linear",
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
    },
  },

  // === BUTTONS ===
  buttons: {
    height: {
      xs: "32px",
      sm: "36px",
      md: "40px",
      lg: "48px",
    },
    padding: {
      sm: "0 12px",
      md: "0 16px",
      lg: "0 22px",
    },
  },

  // === FORMS ===
  forms: {
    height: {
      sm: "36px",
      md: "42px",
      lg: "48px",
    },
    padding: {
      sm: "0 13px",
      md: "0 13px",
    },
  },

  // === ELEVATION ===
  elevation: {
    0: 0,
    1: 1,
    2: 2,
    3: 4,
    4: 6,
    5: 8,
  },
} as const;

// Utility types
export type ColorName = keyof typeof tokens.colors;
export type TokenType = keyof typeof tokens;