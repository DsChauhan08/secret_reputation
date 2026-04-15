import { RoundResult } from "./types";

const LANDSLIDE_LINES = [
  "This was not even close.",
  "The room has spoken. Unanimously.",
  "There is no coming back from this one.",
  "The evidence was overwhelming.",
  "Everyone saw it. Everyone.",
  "If this surprises you, you are the only one.",
  "The jury did not deliberate long.",
];

const CLOSE_RACE_LINES = [
  "The room was violently divided on this one.",
  "This could have gone either way. It didn't.",
  "A narrow victory. Still counts.",
  "The margin was thin. The damage was not.",
  "Close race. Still got exposed.",
  "Two names at war. Only one survived.",
];

const UNANIMOUS_LINES = [
  "Every single person chose the same answer. Think about that.",
  "Not a single vote for anyone else. Brutal.",
  "The room agreed on exactly one thing today.",
  "Zero hesitation from the entire group.",
  "A perfect consensus. That takes talent.",
];

const SPLIT_LINES = [
  "The room could not agree. That says something too.",
  "Everyone had a different theory. Chaos.",
  "No clear winner. Just collective suspicion.",
  "The votes scattered like a crime scene.",
];

const TIE_LINES = [
  "Dead heat. The room had to break the tie.",
  "Too close to call. Chaos picked a winner.",
  "Tie on top. Fate flipped the coin.",
  "Equal firepower. One name still had to take it.",
  "The room split down the middle. Brutal tie-break.",
];

const GENERIC_LINES = [
  "The room has decided.",
  "Accept this and move on.",
  "You know exactly why.",
  "No one is surprised by this.",
  "This was inevitable.",
  "The group has spoken.",
  "Own it.",
  "There is no escape from this one.",
  "The numbers do not lie.",
  "You earned this.",
];

export function generateCommentary(result: RoundResult): string {
  const { winnerVotes, totalVotes, voteCounts } = result;
  if (result.isTie) {
    return TIE_LINES[Math.floor(Math.random() * TIE_LINES.length)];
  }

  const ratio = winnerVotes / totalVotes;
  const uniqueVoted = voteCounts.filter((vc) => vc.count > 0).length;

  let pool: string[];

  if (ratio === 1) {
    pool = UNANIMOUS_LINES;
  } else if (ratio >= 0.7) {
    pool = LANDSLIDE_LINES;
  } else if (ratio >= 0.4 && uniqueVoted <= 2) {
    pool = CLOSE_RACE_LINES;
  } else if (uniqueVoted >= 4) {
    pool = SPLIT_LINES;
  } else {
    pool = GENERIC_LINES;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
