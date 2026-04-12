const BANNED_PATTERNS = [
  // slurs and hate speech patterns (keeping list focused, not exhaustive)
  /\bn[i1]gg/i, /\bf[a4]gg/i, /\bk[i1]ke/i, /\bch[i1]nk/i,
  /\btr[a4]nn/i, /\br[e3]t[a4]rd/i,
  // direct threats
  /\bk[i1]ll\s+(your|them|him|her)/i,
  /\bhurt\s+(your|them|him|her)/i,
  // explicit sexual targeting
  /\brape/i, /\bmolest/i,
  // appearance shaming patterns
  /\bfat\s+and\s+ugly/i, /\bugly\s+face/i,
];

export function isContentSafe(text: string): { safe: boolean; reason?: string } {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { safe: false, reason: "Category cannot be empty" };
  }

  if (trimmed.length < 10) {
    return { safe: false, reason: "Category is too short" };
  }

  if (trimmed.length > 120) {
    return { safe: false, reason: "Category is too long" };
  }

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: "Category contains inappropriate content" };
    }
  }

  return { safe: true };
}
