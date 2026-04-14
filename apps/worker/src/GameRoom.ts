

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

interface Vote {
  playerId: string;
  categoryId: string;
  votedForId: string;
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

type ClientEvent =
  | { type: "CREATE_ROOM"; payload: { playerName: string; playerColor: string; roomName: string; mode: RoomMode } }
  | { type: "JOIN_ROOM"; payload: { code: string; playerName: string; playerColor: string } }
  | { type: "START_GAME"; payload: { selectedCategoryIds: string[] } }
  | { type: "SUBMIT_VOTE"; payload: { categoryId: string; votedForId: string } }
  | { type: "NEXT_ROUND"; payload: Record<string, never> }
  | { type: "PLAY_AGAIN"; payload: Record<string, never> }
  | { type: "KICK_PLAYER"; payload: { playerId: string } };

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

function getCategoriesByMode(mode: RoomMode): Category[] {
  switch (mode) {
    case "light-roast": return ALL_CATEGORIES.filter((c) => c.mode === "light-roast");
    case "normal-chaos": return ALL_CATEGORIES.filter((c) => c.mode === "light-roast" || c.mode === "normal-chaos");
    case "unhinged": return ALL_CATEGORIES;
  }
}


const COMMENTARY_UNANIMOUS = [
  "Zero hesitation from the entire group.",
  "Every single person chose the same answer. Think about that.",
  "The room has spoken. Unanimously.",
];
const COMMENTARY_LANDSLIDE = [
  "Not even close.",
  "If this surprises you, you are the only one.",
  "The room has spoken. Unanimously.",
];
const COMMENTARY_CLOSE = [
  "Close race. Still got exposed.",
  "Two names at war. Only one survived.",
  "The margin was thin. The damage was not.",
];
const COMMENTARY_SPLIT = [
  "No clear winner. Just collective suspicion.",
  "The votes scattered like a crime scene.",
  "Nobody agreed, but everybody was thinking it.",
];

function generateCommentary(result: RoundResult): string {
  const ratio = result.totalVotes > 0 ? result.winnerVotes / result.totalVotes : 0;
  let pool: string[];
  if (ratio >= 1) pool = COMMENTARY_UNANIMOUS;
  else if (ratio >= 0.7) pool = COMMENTARY_LANDSLIDE;
  else if (ratio >= 0.4) pool = COMMENTARY_CLOSE;
  else pool = COMMENTARY_SPLIT;
  return pool[Math.floor(Math.random() * pool.length)];
}


interface SessionInfo {
  playerId: string;
}

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, SessionInfo> = new Map();
  private room: Room | null = null;
  private votes: Vote[] = [];

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.state.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as SessionInfo | null;
      if (meta) this.sessions.set(ws, meta);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      if (!this.room) {
        return new Response(JSON.stringify({ exists: false }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        exists: true,
        code: this.room.code,
        players: this.room.players.length,
        status: this.room.status,
      }), { headers: { "Content-Type": "application/json" } });
    }

   
    const roomCode = url.searchParams.get("code") ?? "UNKNOWN";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);

   
    const session: SessionInfo & { roomCode?: string } = { playerId: "", roomCode };
    this.sessions.set(server, session);
    server.serializeAttachment(session);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    try {
      const event: ClientEvent = JSON.parse(message);
      this.handleClientEvent(ws, event);
    } catch {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Invalid message format" } });
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, _wasClean: boolean) {
    const session = this.sessions.get(ws);
    if (session?.playerId && this.room) {
      const player = this.room.players.find((p) => p.id === session.playerId);
      if (player) {
        player.connected = false;
        this.broadcast({ type: "PLAYER_LEFT", payload: { playerId: session.playerId } });
      }
    }
    this.sessions.delete(ws);
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket) {
    const session = this.sessions.get(ws);
    if (session?.playerId && this.room) {
      const player = this.room.players.find((p) => p.id === session.playerId);
      if (player) player.connected = false;
    }
    this.sessions.delete(ws);
  }

  private handleClientEvent(ws: WebSocket, event: ClientEvent) {
    switch (event.type) {
      case "CREATE_ROOM": this.handleCreateRoom(ws, event.payload); break;
      case "JOIN_ROOM": this.handleJoinRoom(ws, event.payload); break;
      case "START_GAME": this.handleStartGame(ws, event.payload); break;
      case "SUBMIT_VOTE": this.handleSubmitVote(ws, event.payload); break;
      case "NEXT_ROUND": this.handleNextRound(ws); break;
      case "PLAY_AGAIN": this.handlePlayAgain(ws); break;
      case "KICK_PLAYER": this.handleKickPlayer(ws, event.payload); break;
    }
  }

  private handleCreateRoom(ws: WebSocket, payload: { playerName: string; playerColor: string; roomName: string; mode: RoomMode }) {
    const playerId = this.generateId();

   
    const sessionData = ws.deserializeAttachment() as SessionInfo & { roomCode?: string } | null;
    const code = sessionData?.roomCode ?? this.state.id.toString().slice(-6).toUpperCase();

    const host: Player = {
      id: playerId,
      name: payload.playerName,
      color: payload.playerColor,
      isHost: true,
      connected: true,
    };

    this.room = {
      id: this.state.id.toString(),
      code,
      name: payload.roomName || `Room ${code}`,
      mode: payload.mode,
      hostId: playerId,
      players: [host],
      categories: getCategoriesByMode(payload.mode),
      selectedCategoryIds: [],
      currentRound: 0,
      totalRounds: 0,
      status: "lobby",
      results: [],
      votesSubmitted: 0,
      votesRequired: 0,
    };

    const session: SessionInfo = { playerId };
    this.sessions.set(ws, session);
    ws.serializeAttachment(session);

    this.sendTo(ws, { type: "ROOM_CREATED", payload: { room: this.room, playerId } });
  }

  private handleJoinRoom(ws: WebSocket, payload: { code: string; playerName: string; playerColor: string }) {
    if (!this.room) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Room does not exist" } });
      return;
    }
    if (this.room.status !== "lobby") {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Game already in progress" } });
      return;
    }
    if (this.room.players.length >= 10) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Room is full" } });
      return;
    }

    const playerId = this.generateId();
    const newPlayer: Player = {
      id: playerId,
      name: payload.playerName,
      color: payload.playerColor,
      isHost: false,
      connected: true,
    };

    this.room.players.push(newPlayer);

    const session: SessionInfo = { playerId };
    this.sessions.set(ws, session);
    ws.serializeAttachment(session);

    this.sendTo(ws, { type: "ROOM_JOINED", payload: { room: this.room, playerId } });
    this.broadcastExcept(ws, { type: "PLAYER_JOINED", payload: { player: newPlayer } });
  }

  private handleStartGame(ws: WebSocket, payload: { selectedCategoryIds: string[] }) {
    if (!this.room) return;
    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Only the host can start" } });
      return;
    }
    if (this.room.players.length < 3) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Need at least 3 players" } });
      return;
    }

    this.room.selectedCategoryIds = payload.selectedCategoryIds;
    this.room.totalRounds = payload.selectedCategoryIds.length;
    this.room.currentRound = 0;
    this.room.status = "voting";
    this.room.results = [];
    this.votes = [];
    this.room.votesSubmitted = 0;
    this.room.votesRequired = this.room.players.filter((p) => p.connected).length;

    this.broadcast({ type: "GAME_STARTED", payload: { room: this.room } });
  }

  private handleSubmitVote(ws: WebSocket, payload: { categoryId: string; votedForId: string }) {
    if (!this.room || this.room.status !== "voting") return;
    const session = this.sessions.get(ws);
    if (!session) return;

    if (this.votes.some((v) => v.playerId === session.playerId && v.categoryId === payload.categoryId)) return;
    if (payload.votedForId === session.playerId) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Cannot vote for yourself" } });
      return;
    }

    this.votes.push({ playerId: session.playerId, categoryId: payload.categoryId, votedForId: payload.votedForId });
    this.room.votesSubmitted++;

    this.broadcast({ type: "VOTE_RECEIVED", payload: { votesSubmitted: this.room.votesSubmitted, votesRequired: this.room.votesRequired } });

    if (this.room.votesSubmitted >= this.room.votesRequired) {
      this.computeAndReveal();
    }
  }

  private handleNextRound(ws: WebSocket) {
    if (!this.room) return;
    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) return;

    this.room.currentRound++;
    if (this.room.currentRound >= this.room.totalRounds) {
      this.room.status = "ended";
      this.broadcast({ type: "GAME_ENDED", payload: { results: this.room.results } });
      return;
    }

    this.room.status = "voting";
    this.room.votesSubmitted = 0;
    this.room.votesRequired = this.room.players.filter((p) => p.connected).length;

    const catId = this.room.selectedCategoryIds[this.room.currentRound];
    const cat = this.room.categories.find((c) => c.id === catId);
    this.broadcast({ type: "NEXT_ROUND", payload: { currentRound: this.room.currentRound, categoryId: catId, categoryText: cat?.text ?? "" } });
  }

  private handlePlayAgain(ws: WebSocket) {
    if (!this.room) return;
    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) return;

    this.room.status = "lobby";
    this.room.currentRound = 0;
    this.room.totalRounds = 0;
    this.room.selectedCategoryIds = [];
    this.room.results = [];
    this.room.votesSubmitted = 0;
    this.room.votesRequired = 0;
    this.votes = [];

    this.broadcast({ type: "ROOM_STATE", payload: { room: this.room } });
  }

  private handleKickPlayer(ws: WebSocket, payload: { playerId: string }) {
    if (!this.room) return;
    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) return;

    this.room.players = this.room.players.filter((p) => p.id !== payload.playerId);
    for (const [socket, sess] of this.sessions) {
      if (sess.playerId === payload.playerId) {
        this.sendTo(socket, { type: "ERROR", payload: { message: "Removed from room" } });
        socket.close(1000, "Kicked");
        this.sessions.delete(socket);
        break;
      }
    }
    this.broadcast({ type: "PLAYER_LEFT", payload: { playerId: payload.playerId } });
  }

  private computeAndReveal() {
    if (!this.room) return;
    const catId = this.room.selectedCategoryIds[this.room.currentRound];
    const cat = this.room.categories.find((c) => c.id === catId);
    if (!cat) return;

    const roundVotes = this.votes.filter((v) => v.categoryId === catId);
    const counts: Record<string, number> = {};
    for (const v of roundVotes) counts[v.votedForId] = (counts[v.votedForId] || 0) + 1;

    const voteCounts: VoteCount[] = this.room.players.map((p) => ({
      playerId: p.id, playerName: p.name, playerColor: p.color, count: counts[p.id] || 0,
    }));
    voteCounts.sort((a, b) => b.count - a.count);

    const winner = voteCounts[0];
    const runner = voteCounts.length > 1 && voteCounts[1].count > 0 ? voteCounts[1] : null;

    const result: RoundResult = {
      categoryId: catId, categoryText: cat.text,
      winnerId: winner.playerId, winnerName: winner.playerName, winnerColor: winner.playerColor,
      winnerVotes: winner.count, totalVotes: roundVotes.length,
      runnerId: runner?.playerId ?? null, runnerName: runner?.playerName ?? null, runnerVotes: runner?.count ?? 0,
      commentary: "", voteCounts,
    };
    result.commentary = generateCommentary(result);

    this.room.results.push(result);
    this.room.status = "revealing";
    this.broadcast({ type: "REVEAL_RESULT", payload: { result } });
  }

  private sendTo(ws: WebSocket, event: ServerEvent) {
    try { ws.send(JSON.stringify(event)); } catch {}
  }

  private broadcast(event: ServerEvent) {
    const msg = JSON.stringify(event);
    for (const ws of this.sessions.keys()) { try { ws.send(msg); } catch {} }
  }

  private broadcastExcept(exclude: WebSocket, event: ServerEvent) {
    const msg = JSON.stringify(event);
    for (const ws of this.sessions.keys()) { if (ws !== exclude) try { ws.send(msg); } catch {} }
  }

  private generateId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }
}
