const BANNED_PATTERNS = [
  // slurs and hate speech patterns (focused high-severity list)
  /\bn[i1]gg/i,
  /\bf[a4]gg/i,
  /\bk[i1]ke/i,
  /\bch[i1]nk/i,
  /\btr[a4]nn/i,
  /\br[e3]t[a4]rd/i,
  /\bsp[i1]cs?\b/i,
  // direct threats / self-harm / extremity
  /\bk[i1]ll\s+(yourself|myself|your|them|him|her)/i,
  /\bdie\s+(now|already|please)/i,
  /\bhang\s+yourself/i,
  /\bsu[i1]c[i1]de/i,
  /\bshoot\s+(up|the)\b/i,
  /\bbomb\s+threat/i,
  // sexual abuse
  /\brape/i,
  /\bmolest/i,
  /\bped[o0]/i,
  /\bchild\s*(porn|abuse)/i,
  // doxxing-style prompts
  /\b(leak|drop|post)\s+((their|his|her)\s+)?(address|number|phone(\s+number)?)/i,
  // appearance bullying (high confidence phrases)
  /\bfat\s+and\s+ugly/i,
  /\bugly\s+face/i,
  /\blooks\s+like\s+a\s+rat/i,
];

const URL_OR_CONTACT_PATTERN = /((https?:\/\/|www\.)\S+)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(\+?\d[\d\s().-]{7,}\d)/i;

function normalizeForModeration(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\n\r\t]/g, " ")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isContentSafe(text: string): { safe: boolean; reason?: string } {
  const trimmed = text.trim();
  const normalized = normalizeForModeration(trimmed);

  if (trimmed.length === 0) {
    return { safe: false, reason: "Category cannot be empty" };
  }

  if (trimmed.length < 10) {
    return { safe: false, reason: "Category is too short" };
  }

  if (trimmed.length > 120) {
    return { safe: false, reason: "Category is too long" };
  }

  if (URL_OR_CONTACT_PATTERN.test(trimmed)) {
    return { safe: false, reason: "Links and contact details are not allowed" };
  }

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { safe: false, reason: "Category contains inappropriate content" };
    }
  }

  return { safe: true };
}
