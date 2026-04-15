import {
  getCategoriesByMode,
  getChaosCards,
  getRandomCategories,
  ALL_CATEGORIES,
  generateCommentary,
  isContentSafe,
} from "./index";
import type { RoundResult, VoteCount } from "./types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

function section(name: string) {
  console.log(`\n--- ${name} ---`);
}

// ============================================================
// CATEGORIES
// ============================================================
section("Categories");

assert(ALL_CATEGORIES.length >= 50, `should have 50+ categories (got ${ALL_CATEGORIES.length})`);

const lightOnly = getCategoriesByMode("light-roast");
assert(lightOnly.length > 0, "light-roast returns categories");
assert(
  lightOnly.every((c) => c.mode === "light-roast"),
  "light-roast only contains light-roast categories"
);

const normalChaos = getCategoriesByMode("normal-chaos");
assert(normalChaos.length > lightOnly.length, "normal-chaos includes more than light-roast");
assert(
  normalChaos.every((c) => c.mode === "light-roast" || c.mode === "normal-chaos"),
  "normal-chaos contains only light-roast + normal-chaos"
);

const unhinged = getCategoriesByMode("unhinged");
assert(unhinged.length === ALL_CATEGORIES.length, "unhinged includes all categories");

const chaosCards = getChaosCards();
assert(chaosCards.length >= 10, `chaos cards available (got ${chaosCards.length})`);
assert(chaosCards.every((category) => category.isChaos === true), "chaos cards flagged as chaos");

const random5 = getRandomCategories("normal-chaos", 5);
assert(random5.length === 5, `getRandomCategories returns requested count (got ${random5.length})`);

const random100 = getRandomCategories("light-roast", 100);
assert(
  random100.length === lightOnly.length,
  `getRandomCategories caps at pool size (got ${random100.length}, pool ${lightOnly.length})`
);

// Verify all categories have required fields
assert(
  ALL_CATEGORIES.every((c) => c.id && c.text && c.mode && typeof c.isCustom === "boolean"),
  "all categories have required fields (id, text, mode, isCustom)"
);

// Verify no duplicate IDs
const ids = ALL_CATEGORIES.map((c) => c.id);
assert(new Set(ids).size === ids.length, "no duplicate category IDs");

// Verify no emojis in category text
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(
  ALL_CATEGORIES.every((c) => !emojiRegex.test(c.text)),
  "no emojis in any category text"
);

// ============================================================
// COMMENTARY
// ============================================================
section("Commentary");

function makeResult(winnerVotes: number, totalVotes: number, uniqueVoters: number): RoundResult {
  const voteCounts: VoteCount[] = [];
  let remaining = totalVotes;
  voteCounts.push({ playerId: "p1", playerName: "Winner", playerColor: "#fff", count: winnerVotes });
  remaining -= winnerVotes;
  for (let i = 0; i < uniqueVoters - 1 && remaining > 0; i++) {
    const c = i === uniqueVoters - 2 ? remaining : Math.min(1, remaining);
    voteCounts.push({ playerId: `p${i + 2}`, playerName: `Player${i + 2}`, playerColor: "#ccc", count: c });
    remaining -= c;
  }
  if (remaining > 0) {
    voteCounts.push({ playerId: "pX", playerName: "Extra", playerColor: "#aaa", count: 0 });
  }
  return {
    categoryId: "cat_1",
    categoryText: "test category",
    winnerId: "p1",
    winnerName: "Winner",
    winnerColor: "#fff",
    winnerVotes,
    totalVotes,
    runnerId: null,
    runnerName: null,
    runnerVotes: 0,
    isTie: false,
    tiedPlayerIds: [],
    tiedPlayerNames: [],
    tieVoteCount: 0,
    winningMethod: "majority",
    isChaosRound: false,
    commentary: "",
    voteCounts,
  };
}

const unanimousResult = makeResult(5, 5, 1);
const commentary1 = generateCommentary(unanimousResult);
assert(typeof commentary1 === "string" && commentary1.length > 0, `unanimous generates commentary: "${commentary1}"`);

const landslideResult = makeResult(8, 10, 3);
const commentary2 = generateCommentary(landslideResult);
assert(typeof commentary2 === "string" && commentary2.length > 0, `landslide generates commentary: "${commentary2}"`);

const closeResult = makeResult(5, 10, 2);
const commentary3 = generateCommentary(closeResult);
assert(typeof commentary3 === "string" && commentary3.length > 0, `close race generates commentary: "${commentary3}"`);

const splitResult = makeResult(3, 10, 5);
const commentary4 = generateCommentary(splitResult);
assert(typeof commentary4 === "string" && commentary4.length > 0, `split generates commentary: "${commentary4}"`);

const tieCommentaryResult: RoundResult = {
  ...makeResult(3, 10, 3),
  isTie: true,
  tiedPlayerIds: ["p1", "p2"],
  tiedPlayerNames: ["Winner", "Player2"],
  tieVoteCount: 3,
  winningMethod: "tie-break",
  isChaosRound: false,
};
const commentary5 = generateCommentary(tieCommentaryResult);
assert(typeof commentary5 === "string" && commentary5.length > 0, `tie-break generates commentary: "${commentary5}"`);

const chaosCommentaryResult: RoundResult = {
  ...makeResult(4, 9, 3),
  isChaosRound: true,
};
const commentary6 = generateCommentary(chaosCommentaryResult);
assert(typeof commentary6 === "string" && commentary6.length > 0, `chaos round generates commentary: "${commentary6}"`);

// ============================================================
// MODERATION
// ============================================================
section("Moderation");

// Valid categories
assert(isContentSafe("most likely to disappear for 6 hours").safe, "valid category passes");
assert(isContentSafe("most likely to start a cult accidentally").safe, "edgy but safe category passes");
assert(isContentSafe("most likely to ghost someone and act confused").safe, "sharp category passes");

// Invalid - too short
assert(!isContentSafe("hi").safe, "too short category rejected");
assert(!isContentSafe("").safe, "empty category rejected");

// Invalid - too long
assert(!isContentSafe("a".repeat(121)).safe, "too long category rejected (121 chars)");

// Invalid - banned content
assert(!isContentSafe("most likely to r" + "ape someone").safe, "explicit content rejected");
assert(!isContentSafe("most likely to ki" + "ll your family").safe, "threat rejected");
assert(!isContentSafe("most likely to drop their address online").safe, "doxxing intent rejected");
assert(!isContentSafe("most likely to post phone number publicly").safe, "phone leak intent rejected");
assert(!isContentSafe("most likely to share this link https://evil.test").safe, "link content rejected");
assert(!isContentSafe("most likely to post someone@example.com in chat").safe, "email content rejected");
assert(!isContentSafe("most likely to call +1 555 123 4567 at 2am").safe, "phone number content rejected");

// Edge cases
assert(isContentSafe("a".repeat(120)).safe, "120 chars passes (boundary)");
assert(isContentSafe("most likely to say something controversial").safe, "controversial but safe passes");

// ============================================================
// VOTE AGGREGATION (test the logic pattern used in GameRoom)
// ============================================================
section("Vote Aggregation");

function aggregateVotes(votes: { votedForId: string }[], players: { id: string; name: string; color: string }[]) {
  const counts: Record<string, number> = {};
  for (const v of votes) {
    counts[v.votedForId] = (counts[v.votedForId] || 0) + 1;
  }
  const voteCounts: VoteCount[] = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    playerColor: p.color,
    count: counts[p.id] || 0,
  }));
  voteCounts.sort((a, b) => b.count - a.count);
  return voteCounts;
}

const players = [
  { id: "a", name: "Alice", color: "#f00" },
  { id: "b", name: "Bob", color: "#0f0" },
  { id: "c", name: "Charlie", color: "#00f" },
  { id: "d", name: "Diana", color: "#ff0" },
];

const votes = [
  { votedForId: "b" },
  { votedForId: "b" },
  { votedForId: "c" },
  { votedForId: "b" },
  { votedForId: "a" },
];

const result = aggregateVotes(votes, players);
assert(result[0].playerId === "b", `winner is Bob (got ${result[0].playerName})`);
assert(result[0].count === 3, `Bob has 3 votes (got ${result[0].count})`);
assert(result[1].count === 1, `runner-up has 1 vote`);
assert(result[3].count === 0, `Diana has 0 votes`);

// Tie scenario
const tieVotes = [
  { votedForId: "a" },
  { votedForId: "b" },
  { votedForId: "a" },
  { votedForId: "b" },
];
const tieResult = aggregateVotes(tieVotes, players);
assert(tieResult[0].count === 2, "tie: top has 2 votes");
assert(tieResult[1].count === 2, "tie: second also has 2 votes");

// Single vote
const singleResult = aggregateVotes([{ votedForId: "d" }], players);
assert(singleResult[0].playerId === "d", "single vote: Diana wins");
assert(singleResult[0].count === 1, "single vote: 1 vote total");

// ============================================================
// EVENT TYPE SAFETY
// ============================================================
section("Event Types");

import type { ClientEvent, ServerEvent } from "./types";

// These are compile-time checks - if this file compiles, they pass
const createEvent: ClientEvent = {
  type: "CREATE_ROOM",
  payload: { playerName: "Test", playerColor: "#fff", roomName: "Room", mode: "normal-chaos" },
};
assert(createEvent.type === "CREATE_ROOM", "ClientEvent CREATE_ROOM is valid");

const joinEvent: ClientEvent = {
  type: "JOIN_ROOM",
  payload: { code: "ABC123", playerName: "Test", playerColor: "#fff" },
};
assert(joinEvent.type === "JOIN_ROOM", "ClientEvent JOIN_ROOM is valid");

const voteEvent: ClientEvent = {
  type: "SUBMIT_VOTE",
  payload: { categoryId: "cat_1", votedForId: "player_1" },
};
assert(voteEvent.type === "SUBMIT_VOTE", "ClientEvent SUBMIT_VOTE is valid");

const errorEvent: ServerEvent = {
  type: "ERROR",
  payload: { message: "something went wrong" },
};
assert(errorEvent.type === "ERROR", "ServerEvent ERROR is valid");

// ============================================================
// ROOM CODE GENERATION (pattern used in worker)
// ============================================================
section("Room Code Generation");

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const codes = new Set<string>();
for (let i = 0; i < 100; i++) {
  codes.add(generateRoomCode());
}
assert(codes.size === 100, `100 generated codes are all unique (got ${codes.size})`);

const sampleCode = generateRoomCode();
assert(sampleCode.length === 6, `code is 6 chars (got ${sampleCode.length})`);
assert(/^[A-Z2-9]{6}$/.test(sampleCode), `code matches pattern [A-Z2-9] (got ${sampleCode})`);
  assert(!/[0O1I]/.test(sampleCode), "code has no ambiguous chars (0,O,1,I)");

// ============================================================
// SUMMARY
// ============================================================
console.log(`\n============================`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`============================\n`);

if (failed > 0) {
  throw new Error(`${failed} test(s) failed`);
}
