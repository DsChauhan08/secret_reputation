import { GameRoom } from "./GameRoom";

export { GameRoom };

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

const ALLOWED_ORIGINS = [
  "https://secret-reputation.singhdschauhan10.workers.dev",
  "http://localhost:19006",
  "http://localhost:8081",
];

function roomIdFromCode(env: Env, code: string): DurableObjectId {
  return env.GAME_ROOM.idFromName(`room:${code.toUpperCase()}`);
}

function corsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("Origin") ?? "";
  const effectiveOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": effectiveOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Upgrade",
    "Vary": "Origin",
  };
}

const GITHUB_RELEASES_URL = "https://github.com/DsChauhan08/secret_reputation/releases/latest";

function sanitizeRoomCode(code: string | null): string {
  const safe = (code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return /^[A-Z0-9]{4,6}$/.test(safe) ? safe : "";
}

function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

   
    if (path === "/" || path === "/health") {
      return jsonResponse({ status: "ok" }, 200, request);
    }

    if (path === "/invite") {
      const room = sanitizeRoomCode(url.searchParams.get("room"));
      const appUrl = room ? `secretrep://join?room=${room}` : "secretrep://join";
      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#111827" />
  <meta property="og:title" content="Join my Secret Reputation room" />
  <meta property="og:description" content="Anonymous friend voting game. Tap to join instantly." />
  <meta property="og:image" content="https://opengraph.githubassets.com/1/DsChauhan08/secret_reputation" />
  <title>Join Secret Reputation</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100dvh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 20% 20%, #7c3aed 0%, #111827 45%, #05070d 100%);
      color: #f9fafb;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 24px;
    }
    .card {
      width: min(560px, 100%);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 24px;
      padding: 28px;
      background: rgba(11, 15, 26, 0.72);
      backdrop-filter: blur(8px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    h1 { margin: 0 0 8px; font-size: 32px; letter-spacing: -0.02em; }
    p { margin: 0; color: #cbd5e1; line-height: 1.5; }
    .code {
      margin: 20px 0;
      padding: 16px;
      border-radius: 14px;
      text-align: center;
      background: rgba(255,255,255,0.08);
      font-size: 28px;
      letter-spacing: 0.35em;
      font-weight: 700;
    }
    .buttons { display: grid; gap: 12px; margin-top: 22px; }
    .btn {
      display: inline-block;
      text-align: center;
      text-decoration: none;
      font-weight: 700;
      border-radius: 14px;
      padding: 14px 16px;
      transition: transform .14s ease;
    }
    .btn:active { transform: scale(.98); }
    .btn-primary { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; }
    .btn-secondary { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
    .hint { margin-top: 14px; font-size: 13px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Secret Reputation</h1>
    <p>Tap below to jump into the room instantly.</p>
    ${room ? `<div class="code">${room}</div>` : ""}
    <div class="buttons">
      <a class="btn btn-primary" href="${appUrl}">Open in app</a>
      <a class="btn btn-secondary" href="${GITHUB_RELEASES_URL}">Download latest APK</a>
    </div>
    <p class="hint">If the app is already installed, it should open automatically.</p>
  </main>
  <script>
    const appUrl = ${JSON.stringify(appUrl)};
    const fallbackUrl = ${JSON.stringify(GITHUB_RELEASES_URL)};
    const started = Date.now();

    setTimeout(() => {
      if (document.visibilityState === "visible" && Date.now() - started < 2200) {
        window.location.href = fallbackUrl;
      }
    }, 1200);

    window.location.href = appUrl;
  </script>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          ...corsHeaders(request),
        },
      });
    }

   
    const wsMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{4,6})\/ws$/i);
    if (wsMatch) {
      const code = wsMatch[1].toUpperCase();
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
        return jsonResponse({ error: "Expected WebSocket upgrade" }, 426, request);
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

    return jsonResponse({ error: "Not found" }, 404, request);
  },
};
