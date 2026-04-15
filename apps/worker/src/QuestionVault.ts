import { isContentSafe, normalizeCategoryText } from "@secret-reputation/shared";

interface StoredQuestion {
  id: string;
  text: string;
  createdAt: number;
}

interface SaveQuestionPayload {
  text?: string;
  consent?: boolean;
}

const MAX_VAULT_SIZE = 600;
const MAX_RETURNED = 150;
const QUESTION_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

function now(): number {
  return Date.now();
}

function withCors(request: Request, headers: Record<string, string> = {}): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "https://secret-reputation.singhdschauhan10.workers.dev";
  const allowed = [
    "https://secret-reputation.singhdschauhan10.workers.dev",
    "http://localhost:19006",
    "http://localhost:8081",
  ];
  const effective = allowed.includes(origin) ? origin : allowed[0];

  return {
    "Access-Control-Allow-Origin": effective,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    ...headers,
  };
}

function json(data: unknown, request: Request, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCors(request, { "Content-Type": "application/json" }),
  });
}

function dedupeAndTrim(items: StoredQuestion[]): StoredQuestion[] {
  const seen = new Set<string>();
  const freshCutoff = now() - QUESTION_TTL_MS;

  const normalized = items
    .filter((item) => item.createdAt >= freshCutoff)
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((item) => {
      const key = normalizeCategoryText(item.text);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return normalized.slice(0, MAX_VAULT_SIZE);
}

export class QuestionVault implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
  }

  private async readVault(): Promise<StoredQuestion[]> {
    const stored = await this.state.storage.get<StoredQuestion[]>("vault");
    return Array.isArray(stored) ? stored : [];
  }

  private async writeVault(items: StoredQuestion[]): Promise<void> {
    const deduped = dedupeAndTrim(items);
    await this.state.storage.put("vault", deduped);
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: withCors(request) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/questions/save" && request.method === "POST") {
      let payload: SaveQuestionPayload;
      try {
        payload = await request.json<SaveQuestionPayload>();
      } catch {
        return json({ ok: false, message: "Invalid JSON" }, request, 400);
      }

      if (payload.consent !== true) {
        return json({ ok: false, message: "Consent required" }, request, 400);
      }

      const text = normalizeCategoryText(typeof payload.text === "string" ? payload.text : "");
      const moderation = isContentSafe(text);
      if (!moderation.safe) {
        return json({ ok: false, message: moderation.reason ?? "Question blocked" }, request, 400);
      }

      const question: StoredQuestion = {
        id: `vault_${now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        text,
        createdAt: now(),
      };

      const current = await this.readVault();
      await this.writeVault([question, ...current]);

      return json({ ok: true }, request, 201);
    }

    if (url.pathname === "/questions/list" && request.method === "GET") {
      const current = await this.readVault();
      const deduped = dedupeAndTrim(current);
      if (deduped.length !== current.length) {
        await this.state.storage.put("vault", deduped);
      }

      return json(
        {
          ok: true,
          questions: deduped.slice(0, MAX_RETURNED),
        },
        request,
      );
    }

    if (url.pathname === "/questions/cleanup" && request.method === "POST") {
      const cleaned = dedupeAndTrim(await this.readVault());
      await this.state.storage.put("vault", cleaned);
      return json({ ok: true, remaining: cleaned.length }, request);
    }

    return json({ ok: false, message: "Not found" }, request, 404);
  }
}
