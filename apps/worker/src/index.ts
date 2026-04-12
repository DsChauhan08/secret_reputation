import { GameRoom } from "./GameRoom";

export { GameRoom };

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

// Room code -> Durable Object ID mapping
// In production, use KV for this. For now, derive deterministically from code.
function roomIdFromCode(env: Env, code: string): DurableObjectId {
  return env.GAME_ROOM.idFromName(`room:${code.toUpperCase()}`);
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // POST /api/rooms — create a new room
    if (path === "/api/rooms" && request.method === "POST") {
      const code = generateRoomCode();
      return jsonResponse({ code });
    }

    // GET /api/rooms/:code/ws — WebSocket upgrade
    const wsMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{4,6})\/ws$/i);
    if (wsMatch) {
      const code = wsMatch[1].toUpperCase();
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return jsonResponse({ error: "Expected WebSocket upgrade" }, 426);
      }

      const id = roomIdFromCode(env, code);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    // GET /api/rooms/:code — check if room exists
    const checkMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{4,6})$/i);
    if (checkMatch) {
      const code = checkMatch[1].toUpperCase();
      const id = roomIdFromCode(env, code);
      const stub = env.GAME_ROOM.get(id);
      const resp = await stub.fetch(new Request(`http://internal/status`));
      return resp;
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
