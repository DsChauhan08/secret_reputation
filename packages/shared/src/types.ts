// ============================================================
// TYPES — Core data models for Secret Reputation
// ============================================================

export type RoomMode = "light-roast" | "normal-chaos" | "unhinged";
export type GameStatus = "lobby" | "voting" | "revealing" | "ended";

export interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  connected: boolean;
}

export interface Category {
  id: string;
  text: string;
  mode: RoomMode;
  isCustom: boolean;
}

export interface CustomCategoryInput {
  id: string;
  text: string;
}

export interface Vote {
  playerId: string;
  categoryId: string;
  votedForId: string;
}

export interface VoteCount {
  playerId: string;
  playerName: string;
  playerColor: string;
  count: number;
}

export interface RoundResult {
  categoryId: string;
  categoryText: string;
  winnerId: string;
  winnerName: string;
  winnerColor: string;
  winnerVotes: number;
  totalVotes: number;
  runnerId: string | null;
  runnerName: string | null;
  runnerVotes: number;
  isTie?: boolean;
  tiedPlayerIds?: string[];
  tiedPlayerNames?: string[];
  tieVoteCount?: number;
  winningMethod?: "majority" | "consensus" | "tie-break";
  commentary: string;
  voteCounts: VoteCount[];
}

export interface Room {
  id: string;
  code: string;
  name: string;
  mode: RoomMode;
  hostId: string;
  players: Player[];
  categories: Category[];
  selectedCategoryIds: string[];
  currentRound: number;
  totalRounds: number;
  status: GameStatus;
  results: RoundResult[];
  votesSubmitted: number;
  votesRequired: number;
}

// ============================================================
// EVENTS — WebSocket protocol
// ============================================================

// Client -> Server
export type ClientEvent =
  | { type: "CREATE_ROOM"; payload: { playerName: string; playerColor: string; roomName: string; mode: RoomMode } }
  | { type: "JOIN_ROOM"; payload: { code: string; playerName: string; playerColor: string } }
  | { type: "RECONNECT"; payload: { playerId: string; reconnectToken: string } }
  | { type: "START_GAME"; payload: { selectedCategoryIds: string[]; customCategories?: CustomCategoryInput[] } }
  | { type: "SUBMIT_VOTE"; payload: { categoryId: string; votedForId: string } }
  | { type: "NEXT_ROUND"; payload: {} }
  | { type: "PLAY_AGAIN"; payload: {} }
  | { type: "KICK_PLAYER"; payload: { playerId: string } };

// Server -> Client
export type ServerEvent =
  | { type: "ROOM_CREATED"; payload: { room: Room; playerId: string; reconnectToken: string } }
  | { type: "ROOM_JOINED"; payload: { room: Room; playerId: string; reconnectToken: string } }
  | { type: "PLAYER_JOINED"; payload: { player: Player } }
  | { type: "PLAYER_LEFT"; payload: { playerId: string } }
  | { type: "GAME_STARTED"; payload: { room: Room } }
  | { type: "VOTE_RECEIVED"; payload: { votesSubmitted: number; votesRequired: number } }
  | { type: "REVEAL_RESULT"; payload: { result: RoundResult } }
  | { type: "NEXT_ROUND"; payload: { currentRound: number; categoryId: string; categoryText: string } }
  | { type: "GAME_ENDED"; payload: { results: RoundResult[] } }
  | { type: "ROOM_STATE"; payload: { room: Room } }
  | { type: "ERROR"; payload: { message: string } };
