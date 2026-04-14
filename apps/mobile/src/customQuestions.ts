import { isContentSafe, normalizeCategoryText } from "./gamedata";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StoredCustomQuestion {
  id: string;
  text: string;
  createdAt: number;
}

interface MinimalStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const asyncStorageModule = AsyncStorage as unknown;

const STORAGE_KEY = "secret-reputation:custom-questions:v1";
const MAX_STORED_QUESTIONS = 120;

let fallbackMemory: string | null = null;

function normalizeQuestion(text: string): string {
  return normalizeCategoryText(text);
}

function parseStored(raw: string | null): StoredCustomQuestion[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): StoredCustomQuestion | null => {
        if (!item || typeof item !== "object") return null;
        const id = typeof item.id === "string" ? item.id : "";
        const text = typeof item.text === "string" ? normalizeQuestion(item.text) : "";
        const createdAt = typeof item.createdAt === "number" ? item.createdAt : Date.now();
        if (!id || !text) return null;
        return { id, text, createdAt };
      })
      .filter((entry): entry is StoredCustomQuestion => Boolean(entry));
  } catch {
    return [];
  }
}

async function readAll(): Promise<StoredCustomQuestion[]> {
  if (fallbackMemory) {
    return parseStored(fallbackMemory);
  }

  const storage = asyncStorageModule as MinimalStorage;
  if (storage && typeof storage.getItem === "function") {
    try {
      const raw = await storage.getItem(STORAGE_KEY);
      return parseStored(raw);
    } catch {
      return parseStored(fallbackMemory);
    }
  }

  return parseStored(fallbackMemory);
}

async function writeAll(questions: StoredCustomQuestion[]): Promise<void> {
  const serialized = JSON.stringify(questions.slice(-MAX_STORED_QUESTIONS));
  fallbackMemory = serialized;

  const storage = asyncStorageModule as MinimalStorage;
  if (!storage || typeof storage.setItem !== "function") {
    return;
  }

  try {
    await storage.setItem(STORAGE_KEY, serialized);
  } catch {
    // ignored
  }
}

export async function listStoredCustomQuestions(): Promise<StoredCustomQuestion[]> {
  const questions = await readAll();
  return [...questions].sort((a, b) => b.createdAt - a.createdAt);
}

export async function addStoredCustomQuestion(
  input: string,
): Promise<{ ok: true; question: StoredCustomQuestion } | { ok: false; reason: string }> {
  const text = normalizeQuestion(input);
  const moderation = isContentSafe(text);
  if (!moderation.safe) {
    return { ok: false, reason: moderation.reason ?? "Question not allowed" };
  }

  const questions = await readAll();
  const existing = questions.find((entry) => entry.text === text);
  if (existing) {
    return { ok: true, question: existing };
  }

  const question: StoredCustomQuestion = {
    id: `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    text,
    createdAt: Date.now(),
  };

  const next = [...questions, question].slice(-MAX_STORED_QUESTIONS);
  await writeAll(next);

  return { ok: true, question };
}
