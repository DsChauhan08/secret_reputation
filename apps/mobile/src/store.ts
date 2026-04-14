import { create } from "zustand";
import { PLAYER_COLORS } from "./theme";

type RoomMode = "light-roast" | "normal-chaos" | "unhinged";
type GameStatus = "lobby" | "voting" | "revealing" | "ended";

interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  connected: boolean;
}

interface Category {
  id: string;
  text: string;
  mode: RoomMode;
  isCustom: boolean;
}

interface VoteCount {
  playerId: string;
  playerName: string;
  playerColor: string;
  count: number;
}

interface RoundResult {
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
  commentary: string;
  voteCounts: VoteCount[];
}

interface Room {
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

type ServerEvent =
  | { type: "ROOM_CREATED"; payload: { room: Room; playerId: string } }
  | { type: "ROOM_JOINED"; payload: { room: Room; playerId: string } }
  | { type: "PLAYER_JOINED"; payload: { player: Player } }
  | { type: "PLAYER_LEFT"; payload: { playerId: string } }
  | { type: "GAME_STARTED"; payload: { room: Room } }
  | { type: "VOTE_RECEIVED"; payload: { votesSubmitted: number; votesRequired: number } }
  | { type: "REVEAL_RESULT"; payload: { result: RoundResult } }
  | { type: "NEXT_ROUND"; payload: { currentRound: number; categoryId: string; categoryText: string } }
  | { type: "GAME_ENDED"; payload: { results: RoundResult[] } }
  | { type: "ROOM_STATE"; payload: { room: Room } }
  | { type: "ERROR"; payload: { message: string } };

export type { Room, Player, RoundResult, GameStatus, RoomMode, ServerEvent };

interface GameState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  playerId: string | null;
  playerName: string;
  playerColor: string;
  room: Room | null;

  setConnection: (connected: boolean, connecting?: boolean) => void;
  setError: (error: string | null) => void;
  setIdentity: (id: string, name: string, color: string) => void;
  setPlayerName: (name: string) => void;
  setPlayerColor: (color: string) => void;
  setRoom: (room: Room | null) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updateVoteProgress: (submitted: number, required: number) => void;
  addResult: (result: RoundResult) => void;
  setGameStatus: (status: GameStatus) => void;
  setCurrentRound: (round: number) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  connecting: false,
  error: null as string | null,
  playerId: null as string | null,
  playerName: "",
  playerColor: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
  room: null as Room | null,
};

export const useGameStore = create<GameState>()((set, get) => ({
  ...initialState,

  setConnection: (connected: boolean, connecting: boolean = false) =>
    set({ connected, connecting, error: connected ? null : get().error }),

  setError: (error: string | null) => set({ error }),

  setIdentity: (id: string, name: string, color: string) =>
    set({ playerId: id, playerName: name, playerColor: color }),

  setPlayerName: (name: string) => set({ playerName: name }),

  setPlayerColor: (color: string) => set({ playerColor: color }),

  setRoom: (room: Room | null) => set({ room }),

  addPlayer: (player: Player) =>
    set((state: GameState) => {
      if (!state.room) return state;
      const exists = state.room.players.some((p: Player) => p.id === player.id);
      if (exists) return state;
      return {
        room: {
          ...state.room,
          players: [...state.room.players, player],
        },
      };
    }),

  removePlayer: (playerId: string) =>
    set((state: GameState) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          players: state.room.players.filter((p: Player) => p.id !== playerId),
        },
      };
    }),

  updateVoteProgress: (submitted: number, required: number) =>
    set((state: GameState) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          votesSubmitted: submitted,
          votesRequired: required,
        },
      };
    }),

  addResult: (result: RoundResult) =>
    set((state: GameState) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          results: [...state.room.results, result],
        },
      };
    }),

  setGameStatus: (status: GameStatus) =>
    set((state: GameState) => {
      if (!state.room) return state;
      return { room: { ...state.room, status } };
    }),

  setCurrentRound: (round: number) =>
    set((state: GameState) => {
      if (!state.room) return state;
      return { room: { ...state.room, currentRound: round } };
    }),

  reset: () => set(initialState),
}));

export function handleServerEvent(event: ServerEvent): void {
  const store = useGameStore.getState();

  switch (event.type) {
    case "ROOM_CREATED":
      store.setIdentity(event.payload.playerId, store.playerName, store.playerColor);
      store.setRoom(event.payload.room);
      break;
    case "ROOM_JOINED":
      store.setIdentity(event.payload.playerId, store.playerName, store.playerColor);
      store.setRoom(event.payload.room);
      break;
    case "PLAYER_JOINED":
      store.addPlayer(event.payload.player);
      break;
    case "PLAYER_LEFT":
      store.removePlayer(event.payload.playerId);
      break;
    case "GAME_STARTED":
      store.setRoom(event.payload.room);
      break;
    case "VOTE_RECEIVED":
      store.updateVoteProgress(event.payload.votesSubmitted, event.payload.votesRequired);
      break;
    case "REVEAL_RESULT":
      store.addResult(event.payload.result);
      store.setGameStatus("revealing");
      break;
    case "NEXT_ROUND":
      store.setCurrentRound(event.payload.currentRound);
      store.setGameStatus("voting");
      break;
    case "GAME_ENDED":
      store.setRoom({ ...store.room!, results: event.payload.results, status: "ended" });
      break;
    case "ROOM_STATE":
      store.setRoom(event.payload.room);
      break;
    case "ERROR":
      store.setError(event.payload.message);
      break;
  }
}
