import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const colors = {
  bg: "#0B0B0F",
  surface: "#14141A",
  surfaceLight: "#1E1E28",
  surfaceBorder: "#2A2A36",

  primary: "#8B5CF6",
  primaryLight: "#A78BFA",
  primaryDark: "#7C3AED",

  accent: "#06F5C1",
  accentDark: "#05C99E",

  danger: "#F43F5E",
  dangerDark: "#E11D48",

  warning: "#F59E0B",

  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  textGhost: "#374151",
} as const;

export const gradients = {
  primary: ["#8B5CF6", "#6D28D9"] as const,
  accent: ["#06F5C1", "#059669"] as const,
  danger: ["#F43F5E", "#E11D48"] as const,
  dark: ["#1E1E28", "#0B0B0F"] as const,
  reveal: ["#8B5CF6", "#F43F5E"] as const,
  surface: ["#14141A", "#0B0B0F"] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  display: {
    fontSize: 40,
    fontWeight: "800" as const,
    letterSpacing: -1.5,
    color: colors.text,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -1,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
    letterSpacing: -0.5,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.text,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: colors.textMuted,
  },
  mono: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 6,
    color: colors.text,
  },
} as const;

// Player avatar colors (no emojis — just distinct colors)
export const PLAYER_COLORS = [
  "#8B5CF6", // violet
  "#06F5C1", // cyan
  "#F43F5E", // rose
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#10B981", // emerald
  "#EC4899", // pink
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#EF4444", // red
  "#84CC16", // lime
] as const;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
