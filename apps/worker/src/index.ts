import { GameRoom } from "./GameRoom";

export { GameRoom };

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

function roomIdFromCode(env: Env, code: string): DurableObjectId {
  return env.GAME_ROOM.idFromName(`room:${code.toUpperCase()}`);
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Upgrade",
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

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

   
    if (path === "/" || path === "/health") {
      return jsonResponse({ status: "ok" });
    }

   
    const wsMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{4,6})\/ws$/i);
    if (wsMatch) {
      const code = wsMatch[1].toUpperCase();
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return jsonResponse({ error: "Expected WebSocket upgrade" }, 426);
      }

      const id = roomIdFromCode(env, code);
      const stub = env.GAME_ROOM.get(id);
     
      return stub.fetch(new Request(`http://internal/ws?code=${code}`, {
        headers: request.headers,
      }));
    }

   
    const checkMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{4,6})$/i);
    if (checkMatch) {
      const code = checkMatch[1].toUpperCase();
      const id = roomIdFromCode(env, code);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(new Request("http://internal/status"));
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
