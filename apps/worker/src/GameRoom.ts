import type {
  Room,
  Player,
  Category,
  Vote,
  RoundResult,
  VoteCount,
  RoomMode,
  GameStatus,
  ClientEvent,
  ServerEvent,
} from "@secret-reputation/shared";
import { getCategoriesByMode, generateCommentary } from "@secret-reputation/shared";

interface SessionInfo {
  playerId: string;
}

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, SessionInfo> = new Map();

  // Room state
  private room: Room | null = null;
  private votes: Vote[] = [];
  private currentCategoryIndex = 0;

  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
    // Use hibernation API for cost efficiency
    this.state.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as SessionInfo | null;
      if (meta) {
        this.sessions.set(ws, meta);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Status check
    if (url.pathname === "/status") {
      if (!this.room) {
        return new Response(JSON.stringify({ exists: false }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          exists: true,
          players: this.room.players.length,
          status: this.room.status,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // WebSocket upgrade
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);
    this.sessions.set(server, { playerId: "" });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    try {
      const event: ClientEvent = JSON.parse(message);
      this.handleClientEvent(ws, event);
    } catch (err) {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: "Invalid message format" },
      });
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    const session = this.sessions.get(ws);
    if (session && session.playerId && this.room) {
      // Mark player as disconnected
      const player = this.room.players.find((p) => p.id === session.playerId);
      if (player) {
        player.connected = false;
        this.broadcast({
          type: "PLAYER_LEFT",
          payload: { playerId: session.playerId },
        });
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

  // ---- EVENT HANDLING ----

  private handleClientEvent(ws: WebSocket, event: ClientEvent) {
    switch (event.type) {
      case "CREATE_ROOM":
        this.handleCreateRoom(ws, event.payload);
        break;
      case "JOIN_ROOM":
        this.handleJoinRoom(ws, event.payload);
        break;
      case "START_GAME":
        this.handleStartGame(ws, event.payload);
        break;
      case "SUBMIT_VOTE":
        this.handleSubmitVote(ws, event.payload);
        break;
      case "NEXT_ROUND":
        this.handleNextRound(ws);
        break;
      case "PLAY_AGAIN":
        this.handlePlayAgain(ws);
        break;
      case "KICK_PLAYER":
        this.handleKickPlayer(ws, event.payload);
        break;
    }
  }

  private handleCreateRoom(
    ws: WebSocket,
    payload: { playerName: string; playerColor: string; roomName: string; mode: RoomMode }
  ) {
    const playerId = this.generateId();
    const code = this.state.id.toString().slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, "X");

    const host: Player = {
      id: playerId,
      name: payload.playerName,
      color: payload.playerColor,
      isHost: true,
      connected: true,
    };

    const categories = getCategoriesByMode(payload.mode);

    this.room = {
      id: this.state.id.toString(),
      code: payload.roomName.slice(0, 6).toUpperCase() || code,
      name: payload.roomName || `Room ${code}`,
      mode: payload.mode,
      hostId: playerId,
      players: [host],
      categories,
      selectedCategoryIds: [],
      currentRound: 0,
      totalRounds: 0,
      status: "lobby",
      results: [],
      votesSubmitted: 0,
      votesRequired: 0,
    };

    // Bind session
    const session: SessionInfo = { playerId };
    this.sessions.set(ws, session);
    ws.serializeAttachment(session);

    this.sendTo(ws, {
      type: "ROOM_CREATED",
      payload: { room: this.room, playerId },
    });
  }

  private handleJoinRoom(
    ws: WebSocket,
    payload: { code: string; playerName: string; playerColor: string }
  ) {
    if (!this.room) {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: "Room does not exist" },
      });
      return;
    }

    if (this.room.status !== "lobby") {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: "Game already in progress" },
      });
      return;
    }

    if (this.room.players.length >= 20) {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: "Room is full" },
      });
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

    // Bind session
    const session: SessionInfo = { playerId };
    this.sessions.set(ws, session);
    ws.serializeAttachment(session);

    // Send full room state to the joiner
    this.sendTo(ws, {
      type: "ROOM_JOINED",
      payload: { room: this.room, playerId },
    });

    // Notify everyone else
    this.broadcastExcept(ws, {
      type: "PLAYER_JOINED",
      payload: { player: newPlayer },
    });
  }

  private handleStartGame(
    ws: WebSocket,
    payload: { selectedCategoryIds: string[] }
  ) {
    if (!this.room) return;

    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: "Only the host can start the game" },
      });
      return;
    }

    if (this.room.players.length < 3) {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: "Need at least 3 players" },
      });
      return;
    }

    // Store selected categories
    this.room.selectedCategoryIds = payload.selectedCategoryIds;
    this.room.totalRounds = payload.selectedCategoryIds.length;
    this.room.currentRound = 0;
    this.room.status = "voting";
    this.room.results = [];
    this.votes = [];
    this.room.votesSubmitted = 0;
    this.room.votesRequired = this.room.players.filter((p) => p.connected).length;

    this.broadcast({
      type: "GAME_STARTED",
      payload: { room: this.room },
    });
  }

  private handleSubmitVote(
    ws: WebSocket,
    payload: { categoryId: string; votedForId: string }
  ) {
    if (!this.room || this.room.status !== "voting") return;

    const session = this.sessions.get(ws);
    if (!session) return;

    // Prevent double voting
    const alreadyVoted = this.votes.some(
      (v) => v.playerId === session.playerId && v.categoryId === payload.categoryId
    );
    if (alreadyVoted) return;

    // Prevent voting for self
    if (payload.votedForId === session.playerId) {
      this.sendTo(ws, {
        type: "ERROR",
        payload: { message: "You cannot vote for yourself" },
      });
      return;
    }

    this.votes.push({
      playerId: session.playerId,
      categoryId: payload.categoryId,
      votedForId: payload.votedForId,
    });

    this.room.votesSubmitted++;

    // Broadcast progress
    this.broadcast({
      type: "VOTE_RECEIVED",
      payload: {
        votesSubmitted: this.room.votesSubmitted,
        votesRequired: this.room.votesRequired,
      },
    });

    // Check if all votes are in
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
      // Game over
      this.room.status = "ended";
      this.broadcast({
        type: "GAME_ENDED",
        payload: { results: this.room.results },
      });
      return;
    }

    // Reset for next round
    this.room.status = "voting";
    this.room.votesSubmitted = 0;
    this.room.votesRequired = this.room.players.filter((p) => p.connected).length;

    const catId = this.room.selectedCategoryIds[this.room.currentRound];
    const cat = this.room.categories.find((c) => c.id === catId);

    this.broadcast({
      type: "NEXT_ROUND",
      payload: {
        currentRound: this.room.currentRound,
        categoryId: catId,
        categoryText: cat?.text ?? "",
      },
    });
  }

  private handlePlayAgain(ws: WebSocket) {
    if (!this.room) return;

    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) return;

    // Reset game state but keep players
    this.room.status = "lobby";
    this.room.currentRound = 0;
    this.room.totalRounds = 0;
    this.room.selectedCategoryIds = [];
    this.room.results = [];
    this.room.votesSubmitted = 0;
    this.room.votesRequired = 0;
    this.votes = [];

    this.broadcast({
      type: "ROOM_STATE",
      payload: { room: this.room },
    });
  }

  private handleKickPlayer(ws: WebSocket, payload: { playerId: string }) {
    if (!this.room) return;

    const session = this.sessions.get(ws);
    if (!session || session.playerId !== this.room.hostId) return;

    this.room.players = this.room.players.filter((p) => p.id !== payload.playerId);

    // Close the kicked player's connection
    for (const [socket, sess] of this.sessions) {
      if (sess.playerId === payload.playerId) {
        this.sendTo(socket, {
          type: "ERROR",
          payload: { message: "You have been removed from the room" },
        });
        socket.close(1000, "Kicked by host");
        this.sessions.delete(socket);
        break;
      }
    }

    this.broadcast({
      type: "PLAYER_LEFT",
      payload: { playerId: payload.playerId },
    });
  }

  // ---- VOTE AGGREGATION ----

  private computeAndReveal() {
    if (!this.room) return;

    const currentCatId = this.room.selectedCategoryIds[this.room.currentRound];
    const currentCat = this.room.categories.find((c) => c.id === currentCatId);
    if (!currentCat) return;

    const roundVotes = this.votes.filter((v) => v.categoryId === currentCatId);

    // Count votes per player
    const counts: Record<string, number> = {};
    for (const v of roundVotes) {
      counts[v.votedForId] = (counts[v.votedForId] || 0) + 1;
    }

    // Build vote counts array
    const voteCounts: VoteCount[] = this.room.players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      playerColor: p.color,
      count: counts[p.id] || 0,
    }));

    // Sort by count descending
    voteCounts.sort((a, b) => b.count - a.count);

    const winner = voteCounts[0];
    const runner = voteCounts.length > 1 && voteCounts[1].count > 0 ? voteCounts[1] : null;

    const result: RoundResult = {
      categoryId: currentCatId,
      categoryText: currentCat.text,
      winnerId: winner.playerId,
      winnerName: winner.playerName,
      winnerColor: winner.playerColor,
      winnerVotes: winner.count,
      totalVotes: roundVotes.length,
      runnerId: runner?.playerId ?? null,
      runnerName: runner?.playerName ?? null,
      runnerVotes: runner?.count ?? 0,
      commentary: "",
      voteCounts,
    };

    // Generate commentary
    result.commentary = generateCommentary(result);

    this.room.results.push(result);
    this.room.status = "revealing";

    this.broadcast({
      type: "REVEAL_RESULT",
      payload: { result },
    });
  }

  // ---- HELPERS ----

  private sendTo(ws: WebSocket, event: ServerEvent) {
    try {
      ws.send(JSON.stringify(event));
    } catch {}
  }

  private broadcast(event: ServerEvent) {
    const msg = JSON.stringify(event);
    for (const ws of this.sessions.keys()) {
      try {
        ws.send(msg);
      } catch {}
    }
  }

  private broadcastExcept(exclude: WebSocket, event: ServerEvent) {
    const msg = JSON.stringify(event);
    for (const ws of this.sessions.keys()) {
      if (ws !== exclude) {
        try {
          ws.send(msg);
        } catch {}
      }
    }
  }

  private generateId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 12; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }
}
