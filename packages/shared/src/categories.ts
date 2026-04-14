import { RoomMode, Category } from "./types";

let idCounter = 0;

export function normalizeCategoryText(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 120);
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function createCategory(text: string, mode: RoomMode): Category {
  idCounter += 1;
  return {
    id: `cat_${idCounter}`,
    text,
    mode,
    isCustom: false,
  };
}

const lightRoastTexts = [
  "most likely to fall asleep anywhere",
  "most likely to forget why they walked into a room",
  "most likely to laugh at their own joke before finishing it",
  "most likely to accidentally like a photo from 3 years ago",
  "most likely to say 'i'm on my way' while still in bed",
  "most likely to trip over nothing on a flat surface",
  "most likely to order food and then steal everyone else's",
  "most likely to get lost in their own neighborhood",
  "most likely to wave back at someone who wasn't waving at them",
  "most likely to send a text to the wrong person",
  "most likely to zone out mid-conversation and just nod",
  "most likely to set 12 alarms and still wake up late",
  "most likely to apologize to a chair after bumping into it",
  "most likely to forget someone's name while being introduced",
  "most likely to overpack for a one-night trip",
  "most likely to start telling a story and forget the point",
  "most likely to say 'we should hang out more' and never follow up",
  "most likely to befriend a random dog before greeting its owner",
  "most likely to take 40 photos and post none",
  "most likely to have the cleanest notes and the messiest life",
  "most likely to turn one errand into a 4-hour adventure",
  "most likely to buy a planner and forget to use it",
  "most likely to narrate their life like a documentary",
  "most likely to get emotional over a fictional character",
  "most likely to laugh in a serious situation",
  "most likely to bring snacks everywhere 'just in case'",
  "most likely to arrive early and still feel late",
  "most likely to lose their phone while holding it",
  "most likely to know random facts nobody asked for",
  "most likely to create a playlist for every mood",
  "most likely to make a to-do list and then nap",
  "most likely to cry-laugh at the worst timing",
  "most likely to say the exact wrong word and panic",
  "most likely to turn a quick call into an hour",
  "most likely to order the same thing every time",
  "most likely to ask for directions and still get lost",
  "most likely to cheer the loudest for everyone else",
  "most likely to give the best random pep talks",
  "most likely to adopt a new hobby for one weekend",
  "most likely to save memes for a specific friend",
  "most likely to forget what day it is",
  "most likely to be accidentally iconic in every group photo",
  "most likely to write a long caption and delete it",
  "most likely to pretend they saw the message later",
  "most likely to dramatically whisper in public",
  "most likely to have 30 tabs open and call it organized",
  "most likely to make everyone laugh without trying",
  "most likely to insist they are fine while clearly hungry",
  "most likely to buy gifts months early",
  "most likely to become group mom or dad by accident",
  "most likely to clap when the plane lands",
  "most likely to start cleaning at midnight",
  "most likely to send voice notes like podcasts",
  "most likely to schedule a call and still forget it",
  "most likely to bring the best party game",
  "most likely to get nostalgic from one old song",
  "most likely to call everyone by nicknames",
  "most likely to organize the trip and forget their own charger",
  "most likely to make the group chat plan actually happen",
  "most likely to read receipts and panic",
];

const normalChaosTexts = [
  "most likely to disappear for 6 hours with no explanation",
  "most delusional confidence",
  "most likely to become rich by accident",
  "best fake calm under pressure",
  "most likely to start drama by mistake",
  "most likely to survive on charm alone",
  "most likely to turn a small problem into an entire saga",
  "most likely to be successful and still complain about everything",
  "most likely to act innocent while knowing everything",
  "most likely to text back three days later like nothing happened",
  "most likely to arrive 40 minutes late and still act like the victim",
  "most likely to make a terrible decision and somehow land on their feet",
  "most likely to have a secret talent nobody asked to see",
  "most likely to overthink a text message for 45 minutes",
  "most likely to gaslight themselves into believing they're fine",
  "most likely to give great advice and then do the exact opposite",
  "most likely to have the most chaotic camera roll",
  "most likely to get into an argument with a stranger for no reason",
  "most likely to have a villain origin story over something minor",
  "most likely to say 'i don't care' while clearly caring the most",
  "most likely to ghost someone and then act confused when confronted",
  "most likely to screenshot and then say 'i wasn't judging'",
  "most likely to start a side hustle and forget the password",
  "most likely to accidentally expose a secret in a joke",
  "most likely to hype everyone up then cancel last minute",
  "most likely to become everyone's emergency contact",
  "most likely to win an argument they started",
  "most likely to roast you and fix your life in one sentence",
  "most likely to make a risky plan sound reasonable",
  "most likely to flirt their way out of trouble",
  "most likely to send a paragraph and regret it instantly",
  "most likely to become famous for one unhinged clip",
  "most likely to have a backup plan for their backup plan",
  "most likely to say 'trust me' before chaos",
  "most likely to call at 2am with a story",
  "most likely to ask for honesty then deny everything",
  "most likely to keep receipts for every argument",
  "most likely to make a fake scenario and get mad",
  "most likely to talk themselves into and out of a relationship",
  "most likely to post something vague and vanish",
  "most likely to get a random life reset at 3am",
  "most likely to become the group's unofficial PR manager",
  "most likely to create chaos and then offer snacks",
  "most likely to become friends with someone after a fight",
  "most likely to respond with 'lol' during a crisis",
  "most likely to invent a phrase everyone starts using",
  "most likely to run on coffee and audacity",
  "most likely to treat every outing like content",
  "most likely to organize a reunion and start drama at it",
  "most likely to ask deep questions at the wrong time",
  "most likely to be suspiciously good at getting free upgrades",
  "most likely to become a conspiracy influencer for fun",
  "most likely to fake being chill and fail beautifully",
  "most likely to become a trendsetter by accident",
  "most likely to ask for space then spam the chat",
  "most likely to claim they are over it and bring it up again",
  "most likely to turn a typo into a personality",
  "most likely to make the room laugh during tense moments",
  "most likely to win at bluffing games with a straight face",
  "most likely to start a challenge everyone regrets",
];

const unhingedTexts = [
  "most likely to fake their own disappearance for attention",
  "most likely to start a cult accidentally",
  "most likely to survive a zombie apocalypse by betraying everyone",
  "most likely to get banned from a country",
  "most likely to have a government file somewhere",
  "most concerning search history",
  "most likely to end up on the news for something unhinged",
  "most likely to convince a cop to let them go with pure audacity",
  "most likely to run a scam and not even realize it",
  "most likely to win a fight using only words",
  "most likely to ruin a wedding by doing absolutely nothing wrong",
  "most likely to become a dictator of a small island",
  "most likely to have dirt on everyone in this room",
  "most likely to lie on their deathbed about something petty",
  "most likely to commit a crime and leave a yelp review about it",
  "most likely to blackmail someone with a screenshot",
  "most likely to disappear for a year and return rebranded",
  "most likely to marry someone they met yesterday",
  "most likely to survive on pure delusion",
  "most likely to become the final boss of this friend group",
  "most likely to narrate their villain era unironically",
  "most likely to host a party and forget why",
  "most likely to start a fake rumor as an experiment",
  "most likely to become suspiciously good at deception games",
  "most likely to choose chaos as self-care",
  "most likely to make a dramatic exit and come back for snacks",
  "most likely to start a rebellion over something tiny",
  "most likely to reveal a plot twist about themselves",
  "most likely to become everyone's red flag and favorite person",
  "most likely to make a legal-looking contract for a joke",
  "most likely to do the absolute most for no reason",
  "most likely to accidentally create a fake identity",
  "most likely to talk their way into a VIP section",
  "most likely to become a myth in their hometown",
  "most likely to get away with the wildest dare",
  "most likely to weaponize silence in an argument",
  "most likely to write an unhinged manifesto in notes app",
  "most likely to become a courtroom drama witness",
  "most likely to gaslight the GPS",
  "most likely to confidently do something illegal by mistake",
  "most likely to stage an intervention for themselves",
  "most likely to fake a documentary interview",
  "most likely to turn one rumor into a trilogy",
  "most likely to befriend a rival mid-argument",
  "most likely to become famous for the wrong reason and own it",
  "most likely to plan an escape route at every event",
  "most likely to return from vacation with a new persona",
  "most likely to announce retirement from drama and fail instantly",
  "most likely to create a secret group chat for one meme",
  "most likely to influence the entire room with one look",
  "most likely to win fake scenarios and real arguments",
  "most likely to wake up and choose mayhem",
  "most likely to create a startup that sounds illegal",
  "most likely to have an alibi prepared for everything",
  "most likely to become a plot twist in your life",
  "most likely to make a TED talk out of bad decisions",
  "most likely to fake confidence so hard it becomes real",
  "most likely to make everyone nervous and laugh at once",
  "most likely to cause the drama and moderate it",
  "most likely to say 'trust the process' before disaster",
];

const lightRoast: Category[] = lightRoastTexts.map((text) => createCategory(text, "light-roast"));
const normalChaos: Category[] = normalChaosTexts.map((text) => createCategory(text, "normal-chaos"));
const unhinged: Category[] = unhingedTexts.map((text) => createCategory(text, "unhinged"));

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
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
