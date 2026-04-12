import { RoomMode, Category } from "./types";

let _id = 0;
function cat(text: string, mode: RoomMode): Category {
  return { id: `cat_${++_id}`, text, mode, isCustom: false };
}

// ---- LIGHT ROAST ----
const lightRoast: Category[] = [
  cat("most likely to fall asleep anywhere", "light-roast"),
  cat("most likely to forget why they walked into a room", "light-roast"),
  cat("most likely to laugh at their own joke before finishing it", "light-roast"),
  cat("most likely to accidentally like a photo from 3 years ago", "light-roast"),
  cat("most likely to say 'I'm on my way' while still in bed", "light-roast"),
  cat("most likely to trip over nothing on a flat surface", "light-roast"),
  cat("most likely to order food and then steal everyone else's", "light-roast"),
  cat("most likely to get lost in their own neighborhood", "light-roast"),
  cat("most likely to wave back at someone who wasn't waving at them", "light-roast"),
  cat("most likely to send a text to the wrong person", "light-roast"),
  cat("most likely to zone out mid-conversation and just nod", "light-roast"),
  cat("most likely to set 12 alarms and still wake up late", "light-roast"),
  cat("most likely to apologize to a chair after bumping into it", "light-roast"),
  cat("most likely to forget someone's name while being introduced", "light-roast"),
  cat("most likely to overpack for a one-night trip", "light-roast"),
  cat("most likely to start telling a story and forget the point", "light-roast"),
  cat("most likely to say 'we should hang out more' and never follow up", "light-roast"),
];

// ---- NORMAL CHAOS ----
const normalChaos: Category[] = [
  cat("most likely to disappear for 6 hours with no explanation", "normal-chaos"),
  cat("most delusional confidence", "normal-chaos"),
  cat("most likely to become rich by accident", "normal-chaos"),
  cat("best fake calm under pressure", "normal-chaos"),
  cat("most likely to start drama by mistake", "normal-chaos"),
  cat("most likely to survive on charm alone", "normal-chaos"),
  cat("most likely to turn a small problem into an entire saga", "normal-chaos"),
  cat("most likely to be successful and still complain about everything", "normal-chaos"),
  cat("most likely to act innocent while knowing everything", "normal-chaos"),
  cat("most likely to text back three days later like nothing happened", "normal-chaos"),
  cat("most likely to arrive 40 minutes late and still act like the victim", "normal-chaos"),
  cat("most likely to make a terrible decision and somehow land on their feet", "normal-chaos"),
  cat("most likely to have a secret talent nobody asked to see", "normal-chaos"),
  cat("most likely to overthink a text message for 45 minutes", "normal-chaos"),
  cat("most likely to gaslight themselves into believing they're fine", "normal-chaos"),
  cat("most likely to give great advice and then do the exact opposite", "normal-chaos"),
  cat("most likely to have the most chaotic camera roll", "normal-chaos"),
  cat("most likely to get into an argument with a stranger for no reason", "normal-chaos"),
  cat("most likely to have a villain origin story over something minor", "normal-chaos"),
  cat("most likely to say 'I don't care' while clearly caring the most", "normal-chaos"),
  cat("most likely to ghost someone and then act confused when confronted", "normal-chaos"),
];

// ---- UNHINGED ----
const unhinged: Category[] = [
  cat("most likely to fake their own disappearance for attention", "unhinged"),
  cat("most likely to start a cult accidentally", "unhinged"),
  cat("most likely to survive a zombie apocalypse by betraying everyone", "unhinged"),
  cat("most likely to get banned from a country", "unhinged"),
  cat("most likely to have a government file somewhere", "unhinged"),
  cat("most concerning search history", "unhinged"),
  cat("most likely to end up on the news for something unhinged", "unhinged"),
  cat("most likely to convince a cop to let them go with pure audacity", "unhinged"),
  cat("most likely to run a scam and not even realize it", "unhinged"),
  cat("most likely to win a fight using only words", "unhinged"),
  cat("most likely to ruin a wedding by doing absolutely nothing wrong", "unhinged"),
  cat("most likely to become a dictator of a small island", "unhinged"),
  cat("most likely to have dirt on everyone in this room", "unhinged"),
  cat("most likely to lie on their deathbed about something petty", "unhinged"),
  cat("most likely to commit a crime and leave a yelp review about it", "unhinged"),
  cat("most likely to blackmail someone with a screenshot", "unhinged"),
];

export const ALL_CATEGORIES: Category[] = [...lightRoast, ...normalChaos, ...unhinged];

export function getCategoriesByMode(mode: RoomMode): Category[] {
  switch (mode) {
    case "light-roast":
      return lightRoast;
    case "normal-chaos":
      return [...lightRoast, ...normalChaos];
    case "unhinged":
      return ALL_CATEGORIES;
  }
}

export function getRandomCategories(mode: RoomMode, count: number): Category[] {
  const pool = getCategoriesByMode(mode);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
