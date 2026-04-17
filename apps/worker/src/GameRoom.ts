import {
  generateCommentary,
  getChaosCards,
  getCategoriesByMode,
  isContentSafe,
  normalizeCategoryText,
  type Category,
  type ClientEvent,
  type CustomCategoryInput,
  type Player,
  type Room,
  type RoomMode,
  type RoundResult,
  type ServerEvent,
  type Vote,
  type VoteCount,
} from "@secret-reputation/shared";

function pickTieWinner(candidates: VoteCount[], categoryId: string): VoteCount {
  const seed = `${categoryId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return candidates[hash % candidates.length];
}

const MAX_PLAYERS = 10;
const MIN_PLAYERS = 3;
const MIN_ROUNDS = 10;
const MAX_CUSTOM_CATEGORIES = 24;

const PLAYER_NAME_MAX = 20;
const ROOM_NAME_MAX = 36;
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX = 20;

const ROOM_MODE_SET = new Set<RoomMode>(["light-roast", "normal-chaos", "unhinged"]);
const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const CUSTOM_ID_PATTERN = /^custom_[a-z0-9_-]{4,64}$/i;

interface SessionInfo {
  playerId: string;
  roomCode?: string;
  reconnectToken: string;
  msgCount: number;
  msgWindowStart: number;
}

interface PersistedState {
  room: Room;
  votes: Vote[];
  reconnectTokens: Record<string, string>;
}

function sanitizeLabel(input: string, maxLength: number, fallback: string): string {
  const cleaned = input
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLength);
}

function sanitizeColor(value: string): string {
  return COLOR_PATTERN.test(value) ? value : "#845EC2";
}

function isRoomMode(value: string): value is RoomMode {
  return ROOM_MODE_SET.has(value as RoomMode);
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function categoryIntensityScore(category: Category): number {
  const text = category.text.toLowerCase();

  let score = 1;
  if (category.mode === "light-roast") score = 0;
  if (category.mode === "unhinged") score = 2;

  const spicyKeywords = [
    "fight",
    "betray",
    "crime",
    "blackmail",
    "villain",
    "cult",
    "chaos",
    "unhinged",
    "disappear",
    "scam",
    "drama",
  ];

  const chillKeywords = [
    "snack",
    "movie",
    "birthday",
    "selfie",
    "laugh",
    "party",
    "sleep",
    "travel",
  ];

  if (spicyKeywords.some((word) => text.includes(word))) score += 1;
  if (chillKeywords.some((word) => text.includes(word))) score -= 1;

  if (category.isCustom) score += 1;

  return Math.max(0, Math.min(3, score));
}

function pickRandomAndRemove<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const index = Math.floor(Math.random() * arr.length);
  const [picked] = arr.splice(index, 1);
  return picked ?? null;
}

function buildEngagementOrder(selectedCategoryIds: string[], allCategories: Category[]): string[] {
  const byId = new Map(allCategories.map((category) => [category.id, category]));
  const selectedCategories = selectedCategoryIds
    .map((id) => byId.get(id))
    .filter((category): category is Category => Boolean(category));

  const low: Category[] = [];
  const mid: Category[] = [];
  const high: Category[] = [];

  for (const category of selectedCategories) {
    const score = categoryIntensityScore(category);
    if (score <= 0) low.push(category);
    else if (score >= 2) high.push(category);
    else mid.push(category);
  }

  const pattern: Array<"mid" | "low" | "high"> = ["mid", "low", "high", "mid", "high", "low"];
  const ordered: Category[] = [];

  while (low.length > 0 || mid.length > 0 || high.length > 0) {
    for (const bucket of pattern) {
      const source = bucket === "low" ? low : bucket === "mid" ? mid : high;
      const fallback = [mid, low, high].find((candidate) => candidate.length > 0) ?? null;
      const chosen = pickRandomAndRemove(source) ?? (fallback ? pickRandomAndRemove(fallback) : null);
      if (chosen) ordered.push(chosen);
    }
  }

  return ordered.map((category) => category.id);
}

function mergeCategories(base: Category[], custom: Category[]): Category[] {
  const merged = [...base];
  const idSet = new Set(base.map((category) => category.id));
  const textSet = new Set(base.map((category) => normalizeCategoryText(category.text)));

  for (const category of custom) {
    const normalizedText = normalizeCategoryText(category.text);
    if (!normalizedText || textSet.has(normalizedText)) continue;

    let id = category.id;
    if (idSet.has(id)) {
      id = `${id}_${Math.random().toString(36).slice(2, 6)}`;
    }

    idSet.add(id);
    textSet.add(normalizedText);

    merged.push({
      id,
      text: normalizedText,
      mode: category.mode,
      isCustom: true,
      isChaos: category.isChaos ?? false,
    });
  }

  return merged;
}

function validateAndBuildCustomCategories(
  inputs: CustomCategoryInput[] | undefined,
  mode: RoomMode,
): { ok: true; categories: Category[] } | { ok: false; message: string } {
  if (!inputs || inputs.length === 0) {
    return { ok: true, categories: [] };
  }

  if (inputs.length > MAX_CUSTOM_CATEGORIES) {
    return { ok: false, message: `Too many custom questions (max ${MAX_CUSTOM_CATEGORIES})` };
  }

  const categories: Category[] = [];
  const textSet = new Set<string>();
  const idSet = new Set<string>();

  for (const entry of inputs) {
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const text = typeof entry.text === "string" ? entry.text : "";

    const normalizedText = normalizeCategoryText(text);
    const moderation = isContentSafe(normalizedText);
    if (!moderation.safe) {
      return { ok: false, message: moderation.reason ?? "Custom question was blocked" };
    }

    if (!CUSTOM_ID_PATTERN.test(id)) {
      return { ok: false, message: "Invalid custom question id" };
    }

    if (textSet.has(normalizedText) || idSet.has(id)) {
      continue;
    }

    textSet.add(normalizedText);
    idSet.add(id);
    categories.push({
      id,
      text: normalizedText,
      mode,
      isCustom: true,
    });
  }

  return { ok: true, categories };
}

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, SessionInfo> = new Map();
  private room: Room | null = null;
  private votes: Vote[] = [];
  private reconnectTokens: Map<string, string> = new Map();

  private async hydrateFromStorageIfNeeded(force: boolean = false): Promise<void> {
    if (!force && this.room) return;

    const stored = await this.state.storage.get<PersistedState>("gameState");
    if (!stored) return;

    this.room = stored.room;
    this.votes = stored.votes;
    this.reconnectTokens = new Map(Object.entries(stored.reconnectTokens ?? {}));
  }

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      await this.hydrateFromStorageIfNeeded(true);
    });
    this.state.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as SessionInfo | null;
      if (!meta) return;

      const normalized: SessionInfo = {
        playerId: typeof meta.playerId === "string" ? meta.playerId : "",
        roomCode: typeof meta.roomCode === "string" ? meta.roomCode : undefined,
        reconnectToken: typeof meta.reconnectToken === "string" ? meta.reconnectToken : "",
        msgCount: typeof meta.msgCount === "number" ? meta.msgCount : 0,
        msgWindowStart: typeof meta.msgWindowStart === "number" ? meta.msgWindowStart : Date.now(),
      };

      this.sessions.set(ws, normalized);
      ws.serializeAttachment(normalized);
    });
  }

  private async persistState(): Promise<void> {
    if (this.room) {
      await this.state.storage.put("gameState", {
        room: this.room,
        votes: this.votes,
        reconnectTokens: Object.fromEntries(this.reconnectTokens.entries()),
      } satisfies PersistedState);
      await this.resetAlarm();
    } else {
      await this.state.storage.delete("gameState");
      await this.state.storage.deleteAlarm();
    }
  }

  private async resetAlarm(): Promise<void> {
    await this.state.storage.setAlarm(Date.now() + ROOM_TTL_MS);
  }

  async alarm(): Promise<void> {
    const connectedCount = Array.from(this.sessions.values()).filter((s) => s.playerId).length;
    if (connectedCount === 0) {
      this.room = null;
      this.votes = [];
      this.reconnectTokens.clear();
      await this.state.storage.deleteAll();
    } else {
      await this.resetAlarm();
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      await this.hydrateFromStorageIfNeeded();

      if (!this.room) {
        return new Response(JSON.stringify({ exists: false }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          exists: true,
          code: this.room.code,
          players: this.room.players.length,
          status: this.room.status,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const roomCode = url.searchParams.get("code") ?? "UNKNOWN";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);

    const session: SessionInfo = {
      playerId: "",
      roomCode,
      reconnectToken: "",
      msgCount: 0,
      msgWindowStart: Date.now(),
    };
    this.sessions.set(server, session);
    server.serializeAttachment(session);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;

    const session = this.sessions.get(ws);
    if (session) {
      const now = Date.now();
      if (now - session.msgWindowStart > RATE_LIMIT_WINDOW_MS) {
        session.msgCount = 0;
        session.msgWindowStart = now;
      }
      session.msgCount++;
      if (session.msgCount > RATE_LIMIT_MAX) {
        this.sendTo(ws, { type: "ERROR", payload: { message: "Too many messages" } });
        return;
      }
    }

    try {
      const event: ClientEvent = JSON.parse(message);
      await this.handleClientEvent(ws, event);
    } catch {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Invalid message format" } });
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.markPlayerDisconnected(ws);
    this.sessions.delete(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.markPlayerDisconnected(ws);
    this.sessions.delete(ws);
  }

  private async markPlayerDisconnected(ws: WebSocket): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session?.playerId || !this.room) return;

    const player = this.room.players.find((candidate) => candidate.id === session.playerId);
    if (!player || !player.connected) return;

    player.connected = false;

    if (this.room.status === "voting") {
      const currentCategoryId = this.room.selectedCategoryIds[this.room.currentRound];
      const alreadyVoted = this.votes.some(
        (vote) => vote.playerId === session.playerId && vote.categoryId === currentCategoryId,
      );

      if (!alreadyVoted && this.room.votesRequired > 0) {
        this.room.votesRequired -= 1;
        this.broadcast({
          type: "VOTE_RECEIVED",
          payload: { votesSubmitted: this.room.votesSubmitted, votesRequired: this.room.votesRequired },
        });
      }

      if (this.room.votesSubmitted >= this.room.votesRequired) {
        await this.computeAndReveal();
      }
    }

    this.broadcast({ type: "PLAYER_LEFT", payload: { playerId: session.playerId } });
    await this.persistState();
  }

  private async handleClientEvent(ws: WebSocket, event: ClientEvent): Promise<void> {
    switch (event.type) {
      case "CREATE_ROOM":
        await this.handleCreateRoom(ws, event.payload);
        break;
      case "JOIN_ROOM":
        await this.handleJoinRoom(ws, event.payload);
        break;
      case "RECONNECT":
        await this.handleReconnect(ws, event.payload);
        break;
      case "START_GAME":
        await this.handleStartGame(ws, event.payload);
        break;
      case "SUBMIT_VOTE":
        await this.handleSubmitVote(ws, event.payload);
        break;
      case "NEXT_ROUND":
        await this.handleNextRound(ws);
        break;
      case "PLAY_AGAIN":
        await this.handlePlayAgain(ws);
        break;
      case "KICK_PLAYER":
        await this.handleKickPlayer(ws, event.payload);
        break;
    }
  }

  private async handleCreateRoom(
    ws: WebSocket,
    payload: { playerName: string; playerColor: string; roomName: string; mode: RoomMode },
  ): Promise<void> {
    const playerId = this.generateId();
    const reconnectToken = this.generateReconnectToken();
    const mode = isRoomMode(payload.mode) ? payload.mode : "normal-chaos";

    const sessionData = ws.deserializeAttachment() as SessionInfo | null;
    const code = (sessionData?.roomCode ?? this.state.id.toString().slice(-6).toUpperCase()).toUpperCase();

    const host: Player = {
      id: playerId,
      name: sanitizeLabel(payload.playerName, PLAYER_NAME_MAX, "Host"),
      color: sanitizeColor(payload.playerColor),
      isHost: true,
      connected: true,
    };

    const roomName = sanitizeLabel(payload.roomName, ROOM_NAME_MAX, `Room ${code}`);

    this.room = {
      id: this.state.id.toString(),
      code,
      name: roomName,
      mode,
      hostId: playerId,
      players: [host],
      categories: getCategoriesByMode(mode),
      selectedCategoryIds: [],
      currentRound: 0,
      totalRounds: 0,
      status: "lobby",
      results: [],
      votesSubmitted: 0,
      votesRequired: 0,
    };

    this.reconnectTokens.set(playerId, reconnectToken);

    const session: SessionInfo = {
      playerId,
      roomCode: code,
      reconnectToken,
      msgCount: 0,
      msgWindowStart: Date.now(),
    };
    this.sessions.set(ws, session);
    ws.serializeAttachment(session);

    await this.persistState();
    this.sendTo(ws, { type: "ROOM_CREATED", payload: { room: this.room, playerId, reconnectToken } });
  }

  private async handleJoinRoom(
    ws: WebSocket,
    payload: { code: string; playerName: string; playerColor: string },
  ): Promise<void> {
    await this.hydrateFromStorageIfNeeded();

    if (!this.room) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Room does not exist" } });
      return;
    }

    if (this.room.status !== "lobby") {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Game already in progress" } });
      return;
    }

    if (this.room.players.length >= MAX_PLAYERS) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Room is full" } });
      return;
    }

    const playerId = this.generateId();
    const reconnectToken = this.generateReconnectToken();
    const newPlayer: Player = {
      id: playerId,
      name: sanitizeLabel(payload.playerName, PLAYER_NAME_MAX, `Player ${this.room.players.length + 1}`),
      color: sanitizeColor(payload.playerColor),
      isHost: false,
      connected: true,
    };

    this.room.players.push(newPlayer);
    this.reconnectTokens.set(playerId, reconnectToken);

    const session: SessionInfo = {
      playerId,
      roomCode: this.room.code,
      reconnectToken,
      msgCount: 0,
      msgWindowStart: Date.now(),
    };
    this.sessions.set(ws, session);
    ws.serializeAttachment(session);

    await this.persistState();
    this.sendTo(ws, { type: "ROOM_JOINED", payload: { room: this.room, playerId, reconnectToken } });
    this.broadcastExcept(ws, { type: "PLAYER_JOINED", payload: { player: newPlayer } });
  }

  private async handleReconnect(
    ws: WebSocket,
    payload: { playerId: string; reconnectToken: string },
  ): Promise<void> {
    await this.hydrateFromStorageIfNeeded();

    if (!this.room) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Room does not exist" } });
      return;
    }

    const playerId = typeof payload.playerId === "string" ? payload.playerId.trim() : "";
    const reconnectToken = typeof payload.reconnectToken === "string" ? payload.reconnectToken.trim() : "";
    if (!playerId || !reconnectToken) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Invalid reconnect payload" } });
      return;
    }

    const expectedToken = this.reconnectTokens.get(playerId);
    if (!expectedToken || expectedToken !== reconnectToken) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Reconnect denied" } });
      return;
    }

    const player = this.room.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Player not found" } });
      return;
    }

    for (const [socket, socketSession] of this.sessions.entries()) {
      if (socket === ws) continue;
      if (socketSession.playerId !== playerId) continue;

      socket.close(1000, "Reconnected from another session");
      this.sessions.delete(socket);
    }

    player.connected = true;

    const current = this.sessions.get(ws);
    const session: SessionInfo = {
      playerId,
      roomCode: this.room.code,
      reconnectToken,
      msgCount: current?.msgCount ?? 0,
      msgWindowStart: current?.msgWindowStart ?? Date.now(),
    };

    this.sessions.set(ws, session);
    ws.serializeAttachment(session);

    await this.persistState();

    this.sendTo(ws, {
      type: "ROOM_JOINED",
      payload: { room: this.room, playerId, reconnectToken },
    });
    this.broadcast({ type: "ROOM_STATE", payload: { room: this.room } });
  }

  private async handleStartGame(
    ws: WebSocket,
    payload: { selectedCategoryIds: string[]; customCategories?: CustomCategoryInput[]; enableChaos?: boolean },
  ): Promise<void> {
    if (!this.room) return;

    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Only the host can start" } });
      return;
    }

    if (this.room.players.length < MIN_PLAYERS) {
      this.sendTo(ws, { type: "ERROR", payload: { message: `Need at least ${MIN_PLAYERS} players` } });
      return;
    }

    const customCategoryResult = validateAndBuildCustomCategories(payload.customCategories, this.room.mode);
    if (!customCategoryResult.ok) {
      this.sendTo(ws, { type: "ERROR", payload: { message: customCategoryResult.message } });
      return;
    }

    const chaosEnabled = payload.enableChaos === true;
    const chaosPool = chaosEnabled ? getChaosCards() : [];
    const mergedCategories = mergeCategories(getCategoriesByMode(this.room.mode), [
      ...customCategoryResult.categories,
      ...chaosPool,
    ]);
    const categoryIdSet = new Set(mergedCategories.map((category) => category.id));

    const selectedCategoryIds = dedupe(payload.selectedCategoryIds)
      .filter((id) => categoryIdSet.has(id));

    if (chaosEnabled && selectedCategoryIds.length >= MIN_ROUNDS) {
      const chaosCandidates = mergedCategories.filter(
        (candidate) => candidate.isChaos && !selectedCategoryIds.includes(candidate.id),
      );

      if (chaosCandidates.length > 0) {
        const picked = chaosCandidates[Math.floor(Math.random() * chaosCandidates.length)];
        const insertAt = Math.max(1, Math.floor(selectedCategoryIds.length / 2));
        selectedCategoryIds.splice(insertAt, 0, picked.id);
      }
    }

    if (selectedCategoryIds.length < MIN_ROUNDS) {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: `Select at least ${MIN_ROUNDS} valid categories to start` },
      });
      return;
    }

    const orderedCategoryIds = buildEngagementOrder(selectedCategoryIds, mergedCategories);

    this.room.categories = mergedCategories;
    this.room.selectedCategoryIds = orderedCategoryIds;
    this.room.totalRounds = orderedCategoryIds.length;
    this.room.currentRound = 0;
    this.room.status = "voting";
    this.room.results = [];
    this.votes = [];
    this.room.votesSubmitted = 0;
    this.room.votesRequired = this.room.players.filter((player) => player.connected).length;

    await this.persistState();
    this.broadcast({ type: "GAME_STARTED", payload: { room: this.room } });
  }

  private async handleSubmitVote(
    ws: WebSocket,
    payload: { categoryId: string; votedForId: string },
  ): Promise<void> {
    if (!this.room || this.room.status !== "voting") return;

    const session = this.sessions.get(ws);
    if (!session) return;

    const currentCategoryId = this.room.selectedCategoryIds[this.room.currentRound];
    if (payload.categoryId !== currentCategoryId) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Invalid round category" } });
      return;
    }

    const target = this.room.players.find((player) => player.id === payload.votedForId);
    if (!target || !target.connected) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Player is no longer available" } });
      return;
    }

    if (payload.votedForId === session.playerId) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Cannot vote for yourself" } });
      return;
    }

    if (this.votes.some((vote) => vote.playerId === session.playerId && vote.categoryId === currentCategoryId)) {
      return;
    }

    this.votes.push({
      playerId: session.playerId,
      categoryId: currentCategoryId,
      votedForId: payload.votedForId,
    });
    this.room.votesSubmitted += 1;

    this.broadcast({
      type: "VOTE_RECEIVED",
      payload: {
        votesSubmitted: this.room.votesSubmitted,
        votesRequired: this.room.votesRequired,
      },
    });

    if (this.room.votesSubmitted >= this.room.votesRequired) {
      await this.computeAndReveal();
    }

    await this.persistState();
  }

  private async handleNextRound(ws: WebSocket): Promise<void> {
    if (!this.room) return;

    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) return;

    this.room.currentRound += 1;
    if (this.room.currentRound >= this.room.totalRounds) {
      this.room.status = "ended";
      await this.persistState();
      this.broadcast({ type: "GAME_ENDED", payload: { results: this.room.results } });
      return;
    }

    this.room.status = "voting";
    this.room.votesSubmitted = 0;
    this.room.votesRequired = this.room.players.filter((player) => player.connected).length;

    const categoryId = this.room.selectedCategoryIds[this.room.currentRound];
    const category = this.room.categories.find((candidate) => candidate.id === categoryId);

    await this.persistState();
    this.broadcast({
      type: "NEXT_ROUND",
      payload: {
        currentRound: this.room.currentRound,
        categoryId,
        categoryText: category?.text ?? "",
      },
    });
  }

  private async handlePlayAgain(ws: WebSocket): Promise<void> {
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

    await this.persistState();
    this.broadcast({ type: "ROOM_STATE", payload: { room: this.room } });
  }

  private async handleKickPlayer(ws: WebSocket, payload: { playerId: string }): Promise<void> {
    if (!this.room) return;

    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) return;

    const target = this.room.players.find((player) => player.id === payload.playerId);
    if (!target) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Player not found" } });
      return;
    }

    if (target.id === this.room.hostId) {
      this.sendTo(ws, { type: "ERROR", payload: { message: "Host cannot be removed" } });
      return;
    }

    if (this.room.status === "voting") {
      const currentCategoryId = this.room.selectedCategoryIds[this.room.currentRound];
      const alreadyVoted = this.votes.some(
        (vote) => vote.playerId === payload.playerId && vote.categoryId === currentCategoryId,
      );

      if (target.connected && !alreadyVoted && this.room.votesRequired > 0) {
        this.room.votesRequired -= 1;
        this.broadcast({
          type: "VOTE_RECEIVED",
          payload: { votesSubmitted: this.room.votesSubmitted, votesRequired: this.room.votesRequired },
        });
      }
    }

    this.room.players = this.room.players.filter((player) => player.id !== payload.playerId);
    this.reconnectTokens.delete(payload.playerId);

    for (const [socket, socketSession] of this.sessions) {
      if (socketSession.playerId !== payload.playerId) continue;

      this.sendTo(socket, { type: "ERROR", payload: { message: "Removed from room" } });
      socket.close(1000, "Kicked");
      this.sessions.delete(socket);
      break;
    }

    this.broadcast({ type: "PLAYER_LEFT", payload: { playerId: payload.playerId } });

    if (this.room.status === "voting" && this.room.votesSubmitted >= this.room.votesRequired) {
      await this.computeAndReveal();
    }

    await this.persistState();
  }

  private async computeAndReveal(): Promise<void> {
    if (!this.room) return;

    const categoryId = this.room.selectedCategoryIds[this.room.currentRound];
    const category = this.room.categories.find((candidate) => candidate.id === categoryId);
    if (!category) return;

    const roundVotes = this.votes.filter((vote) => vote.categoryId === categoryId);
    const counts: Record<string, number> = {};

    for (const vote of roundVotes) {
      counts[vote.votedForId] = (counts[vote.votedForId] || 0) + 1;
    }

    const voteCounts: VoteCount[] = this.room.players.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      count: counts[player.id] || 0,
    }));

    voteCounts.sort((a, b) => b.count - a.count || a.playerName.localeCompare(b.playerName));

    const winnerCandidate = voteCounts[0];
    if (!winnerCandidate) return;

    const topCount = winnerCandidate.count;
    const tiedTop = voteCounts.filter((candidate) => candidate.count === topCount && topCount > 0);
    const isTie = tiedTop.length > 1;
    const winner = isTie ? pickTieWinner(tiedTop, categoryId) : winnerCandidate;

    const runner = voteCounts
      .filter((candidate) => candidate.playerId !== winner.playerId)
      .find((candidate) => candidate.count > 0) ?? null;

    const result: RoundResult = {
      categoryId,
      categoryText: category.text,
      winnerId: winner.playerId,
      winnerName: winner.playerName,
      winnerColor: winner.playerColor,
      winnerVotes: winner.count,
      totalVotes: roundVotes.length,
      runnerId: runner?.playerId ?? null,
      runnerName: runner?.playerName ?? null,
      runnerVotes: runner?.count ?? 0,
      isTie,
      tiedPlayerIds: isTie ? tiedTop.map((candidate) => candidate.playerId) : [],
      tiedPlayerNames: isTie ? tiedTop.map((candidate) => candidate.playerName) : [],
      tieVoteCount: isTie ? topCount : 0,
      winningMethod: isTie ? "tie-break" : winner.count === roundVotes.length ? "consensus" : "majority",
      isChaosRound: Boolean(category.isChaos),
      commentary: "",
      voteCounts,
    };

    result.commentary = generateCommentary(result);

    this.room.results.push(result);
    this.room.status = "revealing";

    await this.persistState();

    this.broadcast({ type: "REVEAL_RESULT", payload: { result } });
  }

  private sendTo(ws: WebSocket, event: ServerEvent): void {
    try {
      ws.send(JSON.stringify(event));
    } catch {
      // ignored
    }
  }

  private broadcast(event: ServerEvent): void {
    const message = JSON.stringify(event);
    for (const ws of this.sessions.keys()) {
      try {
        ws.send(message);
      } catch {
        // ignored
      }
    }
  }

  private broadcastExcept(exclude: WebSocket, event: ServerEvent): void {
    const message = JSON.stringify(event);
    for (const ws of this.sessions.keys()) {
      if (ws === exclude) continue;
      try {
        ws.send(message);
      } catch {
        // ignored
      }
    }
  }

  private generateId(): string {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }

  private generateReconnectToken(): string {
    return crypto.randomUUID();
  }
}
