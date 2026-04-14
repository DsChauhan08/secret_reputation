

import type { RoomMode } from "./store";

export interface Category {
  id: string;
  text: string;
  mode: RoomMode;
  isCustom: boolean;
}

const ALL_CATEGORIES: Category[] = [
 
  { id: "lr_01", text: "most likely to still be texting their ex", mode: "light-roast", isCustom: false },
  { id: "lr_02", text: "most likely to cry at a movie trailer", mode: "light-roast", isCustom: false },
  { id: "lr_03", text: "most likely to ghost a group chat", mode: "light-roast", isCustom: false },
  { id: "lr_04", text: "most likely to fall asleep at a party", mode: "light-roast", isCustom: false },
  { id: "lr_05", text: "most likely to get lost in their own city", mode: "light-roast", isCustom: false },
  { id: "lr_06", text: "most likely to apologize to a chair after bumping into it", mode: "light-roast", isCustom: false },
  { id: "lr_07", text: "most likely to have 47 unread messages", mode: "light-roast", isCustom: false },
  { id: "lr_08", text: "most likely to show up overdressed", mode: "light-roast", isCustom: false },
  { id: "lr_09", text: "most likely to take a selfie during a crisis", mode: "light-roast", isCustom: false },
  { id: "lr_10", text: "most likely to befriend the uber driver", mode: "light-roast", isCustom: false },
  { id: "lr_11", text: "most likely to forget their own birthday", mode: "light-roast", isCustom: false },
  { id: "lr_12", text: "most likely to cry during a speech", mode: "light-roast", isCustom: false },
  { id: "lr_13", text: "most likely to trip on a flat surface", mode: "light-roast", isCustom: false },
  { id: "lr_14", text: "most likely to accidentally like a post from 3 years ago", mode: "light-roast", isCustom: false },
  { id: "lr_15", text: "most likely to talk to animals like they understand", mode: "light-roast", isCustom: false },
  { id: "lr_16", text: "most likely to bring snacks to every occasion", mode: "light-roast", isCustom: false },
  { id: "lr_17", text: "most likely to laugh at their own joke before finishing it", mode: "light-roast", isCustom: false },

 
  { id: "nc_01", text: "most likely to start a fight at a wedding", mode: "normal-chaos", isCustom: false },
  { id: "nc_02", text: "most likely to get banned from a group chat", mode: "normal-chaos", isCustom: false },
  { id: "nc_03", text: "most likely to lie on their resume", mode: "normal-chaos", isCustom: false },
  { id: "nc_04", text: "most likely to gaslight everyone and get away with it", mode: "normal-chaos", isCustom: false },
  { id: "nc_05", text: "most likely to go viral for the wrong reason", mode: "normal-chaos", isCustom: false },
  { id: "nc_06", text: "most likely to ruin a vacation", mode: "normal-chaos", isCustom: false },
  { id: "nc_07", text: "most likely to disappear for 6 hours and not explain", mode: "normal-chaos", isCustom: false },
  { id: "nc_08", text: "most likely to have a secret finsta nobody knows about", mode: "normal-chaos", isCustom: false },
  { id: "nc_09", text: "most likely to date someone purely for the drama", mode: "normal-chaos", isCustom: false },
  { id: "nc_10", text: "most likely to get caught in a lie and double down", mode: "normal-chaos", isCustom: false },
  { id: "nc_11", text: "most likely to throw someone under the bus to save themselves", mode: "normal-chaos", isCustom: false },
  { id: "nc_12", text: "most likely to talk trash and then act innocent", mode: "normal-chaos", isCustom: false },
  { id: "nc_13", text: "most likely to ghost someone and act confused about it", mode: "normal-chaos", isCustom: false },
  { id: "nc_14", text: "most likely to screenshot your messages", mode: "normal-chaos", isCustom: false },
  { id: "nc_15", text: "most likely to steal someone's thunder on purpose", mode: "normal-chaos", isCustom: false },
  { id: "nc_16", text: "most likely to be the reason the group splits", mode: "normal-chaos", isCustom: false },
  { id: "nc_17", text: "most likely to have a villain arc", mode: "normal-chaos", isCustom: false },
  { id: "nc_18", text: "most likely to say something unhinged and mean it", mode: "normal-chaos", isCustom: false },
  { id: "nc_19", text: "most likely to make everything about themselves", mode: "normal-chaos", isCustom: false },
  { id: "nc_20", text: "most likely to create chaos and watch from the sidelines", mode: "normal-chaos", isCustom: false },
  { id: "nc_21", text: "most likely to have a backup friend group", mode: "normal-chaos", isCustom: false },

 
  { id: "un_01", text: "most likely to fake their own death for attention", mode: "unhinged", isCustom: false },
  { id: "un_02", text: "most likely to start a cult accidentally", mode: "unhinged", isCustom: false },
  { id: "un_03", text: "most likely to end up on a true crime podcast", mode: "unhinged", isCustom: false },
  { id: "un_04", text: "most likely to commit a crime and post about it", mode: "unhinged", isCustom: false },
  { id: "un_05", text: "most likely to survive a zombie apocalypse by betraying everyone", mode: "unhinged", isCustom: false },
  { id: "un_06", text: "most likely to marry someone they met 24 hours ago", mode: "unhinged", isCustom: false },
  { id: "un_07", text: "most likely to be a sleeper agent and nobody would notice", mode: "unhinged", isCustom: false },
  { id: "un_08", text: "most likely to burn everything down and call it self-care", mode: "unhinged", isCustom: false },
  { id: "un_09", text: "most likely to have a body buried somewhere figuratively", mode: "unhinged", isCustom: false },
  { id: "un_10", text: "most likely to blackmail someone for fun", mode: "unhinged", isCustom: false },
  { id: "un_11", text: "most likely to weaponize therapy language", mode: "unhinged", isCustom: false },
  { id: "un_12", text: "most likely to have a full breakdown and still look good", mode: "unhinged", isCustom: false },
  { id: "un_13", text: "most likely to disappear and start a new life", mode: "unhinged", isCustom: false },
  { id: "un_14", text: "most likely to become a conspiracy theorist", mode: "unhinged", isCustom: false },
  { id: "un_15", text: "most likely to sell everyone out for $100", mode: "unhinged", isCustom: false },
  { id: "un_16", text: "most likely to have already planned their villain monologue", mode: "unhinged", isCustom: false },
];

export function getCategoriesByMode(mode: RoomMode): Category[] {
  switch (mode) {
    case "light-roast":
      return ALL_CATEGORIES.filter((c) => c.mode === "light-roast");
    case "normal-chaos":
      return ALL_CATEGORIES.filter(
        (c) => c.mode === "light-roast" || c.mode === "normal-chaos"
      );
    case "unhinged":
      return ALL_CATEGORIES;
  }
}

export function getRandomCategories(mode: RoomMode, count: number): Category[] {
  const pool = getCategoriesByMode(mode);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

const BANNED_PATTERNS = [
  /\bn[i1]gg/i, /\bf[a@]g/i, /\br[a@]pe/i, /\bk[i1]ll\s+(your|my|the)\s+(family|self|mom|dad)/i,
  /\bsu[i1]c[i1]de/i, /\bsch?ool\s*shoot/i, /\bb[o0]mb\s*threat/i,
  /\bch[i1]ld\s*(p[o0]rn|abuse)/i, /\bped[o0]/i,
];

export function isContentSafe(text: string): { safe: boolean; reason?: string } {
  if (!text || text.trim().length < 5) return { safe: false, reason: "too short" };
  if (text.length > 120) return { safe: false, reason: "too long" };
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) return { safe: false, reason: "content not allowed" };
  }
  return { safe: true };
}
