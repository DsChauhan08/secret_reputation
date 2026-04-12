import { Platform, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
export { SCREEN_WIDTH, SCREEN_HEIGHT };
// System font: San Francisco on iOS, Roboto on Android
const FONT_FAMILY = Platform.OS === "ios" ? "System" : "Roboto";

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
    fontFamily: FONT_FAMILY,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -1,
    color: colors.text,
    fontFamily: FONT_FAMILY,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
    letterSpacing: -0.5,
    color: colors.text,
    fontFamily: FONT_FAMILY,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
    fontFamily: FONT_FAMILY,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.text,
    fontFamily: FONT_FAMILY,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    fontFamily: FONT_FAMILY,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: colors.textMuted,
    fontFamily: FONT_FAMILY,
  },
  mono: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 6,
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
} as const;

export const PLAYER_COLORS = [
  "#8B5CF6",
  "#06F5C1",
  "#F43F5E",
  "#F59E0B",
  "#3B82F6",
  "#10B981",
  "#EC4899",
  "#F97316",
  "#14B8A6",
  "#6366F1",
  "#EF4444",
  "#84CC16",
] as const;
