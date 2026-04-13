import { Platform, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
export { SCREEN_WIDTH, SCREEN_HEIGHT };

const FONT = Platform.OS === "ios" ? "System" : "Roboto";

export const colors = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  cardBorder: "#EDEDED",

  primary: "#845EC2",
  dark: "#4B4453",
  muted: "#B0A8B9",
  danger: "#C34A36",
  warm: "#FF8066",

  text: "#1A1A2E",
  textSecondary: "#4B4453",
  textMuted: "#B0A8B9",
  textPlaceholder: "#C8C2CC",

  divider: "#E8E4EC",
  overlay: "rgba(0,0,0,0.04)",
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
  massive: 56,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    color: colors.text,
    fontFamily: FONT,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    color: colors.text,
    fontFamily: FONT,
  },
  h2: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: colors.text,
    fontFamily: FONT,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    fontFamily: FONT,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.text,
    fontFamily: FONT,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    fontFamily: FONT,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.textSecondary,
    fontFamily: FONT,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: colors.textMuted,
    fontFamily: FONT,
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
  "#845EC2",
  "#FF8066",
  "#C34A36",
  "#4B4453",
  "#00C9A7",
  "#FF6F91",
  "#FFC75F",
  "#5B5EA6",
  "#9B89B3",
  "#F9F871",
  "#0089BA",
  "#D65DB1",
] as const;
