/**
 * Production AI Provider Service
 *
 * Supports three providers selectable via AI_PROVIDER env var:
 *   - gemini  → Google Gemini (cloud, production-ready)
 *   - openai  → OpenAI GPT (cloud, production-ready)
 *   - ollama  → Local Ollama (development ONLY)
 *   - sandbox → In-memory stub (testing ONLY)
 *
 * All providers share the same AIProviderAdapter interface.
 * Retry (3 attempts, exponential backoff) and timeout are applied
 * uniformly in AIProviderService.embed() / AIProviderService.complete().
 *
 * Failures always throw AIProviderError — no silent fallbacks.
 */

import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─── Error Type ───────────────────────────────────────────────────────────────

export class AIProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly operation: "embed" | "complete",
    message: string,
    public readonly cause?: unknown
  ) {
    super(`[AIProvider:${provider}] ${operation} failed — ${message}`);
    this.name = "AIProviderError";
  }
}

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface AIEmbeddingResult {
  embedding: number[];
  model: string;
  inputTokens: number;
  latencyMs: number;
}

export interface AICompletionResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface AIProviderAdapter {
  readonly name: string;
  embed(text: string): Promise<AIEmbeddingResult>;
  complete(prompt: string, systemPrompt?: string): Promise<AICompletionResult>;
}

export type ProviderName = "gemini" | "openai" | "ollama" | "sandbox";

// ─── Resilience Helpers ───────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = Number(process.env["AI_REQUEST_TIMEOUT_MS"] ?? "30000");
const MAX_RETRIES = 3;

/** Wraps a promise with a hard timeout. */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    return result;
  } finally {
    clearTimeout(timer!);
  }
}

/** Retries fn up to MAX_RETRIES times with exponential back-off. */
async function withRetry<T>(
  fn: () => Promise<T>,
  provider: string,
  operation: string
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const delayMs = 200 * Math.pow(2, attempt - 1); // 200 → 400 → 800
        logger.warn(
          `[AIProvider:${provider}] ${operation} attempt ${attempt}/${MAX_RETRIES} failed — retrying in ${delayMs}ms`,
          { error: err instanceof Error ? err.message : String(err) }
        );
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastErr;
}

// ─── Gemini Adapter ───────────────────────────────────────────────────────────

class GeminiAdapter implements AIProviderAdapter {
  readonly name = "gemini";
  private readonly chatModel: string;
  private readonly embedModel: string;

  constructor() {
    this.chatModel = process.env["GEMINI_CHAT_MODEL"] ?? "gemini-1.5-flash";
    this.embedModel = process.env["GEMINI_EMBED_MODEL"] ?? "text-embedding-004";
  }

  private async getClient() {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      throw new AIProviderError(
        this.name,
        "embed",
        "GEMINI_API_KEY is not set. Provide it via environment variables."
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  async embed(text: string): Promise<AIEmbeddingResult> {
    const start = Date.now();
    const genAI = await this.getClient();
    const model = genAI.getGenerativeModel({ model: this.embedModel });
    const response = await model.embedContent(text);
    const latencyMs = Date.now() - start;
    const embedding = response.embedding.values;

    logger.info(`[AIProvider:Gemini] Embedded ${text.length} chars via ${this.embedModel} in ${latencyMs}ms`, {
      model: this.embedModel,
      inputTokens: Math.ceil(text.length / 4),
      latencyMs,
    });

    return {
      embedding,
      model: this.embedModel,
      inputTokens: Math.ceil(text.length / 4),
      latencyMs,
    };
  }

  async complete(prompt: string, systemPrompt?: string): Promise<AICompletionResult> {
    const start = Date.now();
    const genAI = await this.getClient();
    const model = genAI.getGenerativeModel({
      model: this.chatModel,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const latencyMs = Date.now() - start;

    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? Math.ceil(prompt.length / 4);
    const outputTokens = usage?.candidatesTokenCount ?? Math.ceil(text.length / 4);

    logger.info(`[AIProvider:Gemini] Completion via ${this.chatModel} in ${latencyMs}ms`, {
      model: this.chatModel,
      inputTokens,
      outputTokens,
      latencyMs,
    });

    return { text, model: this.chatModel, inputTokens, outputTokens, latencyMs };
  }
}

// ─── OpenAI Adapter ───────────────────────────────────────────────────────────

class OpenAIAdapter implements AIProviderAdapter {
  readonly name = "openai";
  private readonly chatModel: string;
  private readonly embedModel: string;

  constructor() {
    this.chatModel = process.env["OPENAI_CHAT_MODEL"] ?? "gpt-4o-mini";
    this.embedModel = process.env["OPENAI_EMBED_MODEL"] ?? "text-embedding-3-small";
  }

  private async getClient() {
    const OpenAI = (await import("openai")).default;
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      throw new AIProviderError(
        this.name,
        "embed",
        "OPENAI_API_KEY is not set. Provide it via environment variables."
      );
    }
    return new OpenAI({ apiKey });
  }

  async embed(text: string): Promise<AIEmbeddingResult> {
    const start = Date.now();
    const client = await this.getClient();
    const response = await client.embeddings.create({
      model: this.embedModel,
      input: text,
      encoding_format: "float",
    });
    const latencyMs = Date.now() - start;
    const embedding = response.data[0]?.embedding ?? [];

    logger.info(`[AIProvider:OpenAI] Embedded ${text.length} chars via ${this.embedModel} in ${latencyMs}ms`, {
      model: this.embedModel,
      inputTokens: response.usage?.prompt_tokens ?? Math.ceil(text.length / 4),
      latencyMs,
    });

    return {
      embedding,
      model: this.embedModel,
      inputTokens: response.usage?.prompt_tokens ?? Math.ceil(text.length / 4),
      latencyMs,
    };
  }

  async complete(prompt: string, systemPrompt?: string): Promise<AICompletionResult> {
    const start = Date.now();
    const client = await this.getClient();
    const messages: { role: "system" | "user"; content: string }[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const response = await client.chat.completions.create({
      model: this.chatModel,
      messages,
    });

    const text = response.choices[0]?.message?.content ?? "";
    const latencyMs = Date.now() - start;
    const inputTokens = response.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4);
    const outputTokens = response.usage?.completion_tokens ?? Math.ceil(text.length / 4);

    logger.info(`[AIProvider:OpenAI] Completion via ${this.chatModel} in ${latencyMs}ms`, {
      model: this.chatModel,
      inputTokens,
      outputTokens,
      latencyMs,
    });

    return { text, model: this.chatModel, inputTokens, outputTokens, latencyMs };
  }
}

// ─── Ollama Adapter (Development only) ───────────────────────────────────────

const OLLAMA_BASE_URL = process.env["OLLAMA_API_URL"] ?? process.env["OLLAMA_URL"] ?? "http://localhost:11434";
const OLLAMA_EMBED_MODEL = process.env["EMBEDDING_MODEL"] ?? "all-minilm";
const OLLAMA_CHAT_MODEL = process.env["CHAT_MODEL"] ?? "gemma";
const EXPECTED_DIMENSION = Number(process.env["EMBEDDING_DIMENSION"] ?? "384");

class OllamaAdapter implements AIProviderAdapter {
  readonly name = "ollama";

  private assertNotProduction(): void {
    if (process.env.NODE_ENV === "production") {
      throw new AIProviderError(
        this.name,
        "embed",
        "Ollama is a local-only provider and cannot be used in production. " +
          "Set AI_PROVIDER=gemini or AI_PROVIDER=openai and configure the appropriate API key."
      );
    }
  }

  async embed(text: string): Promise<AIEmbeddingResult> {
    this.assertNotProduction();
    const start = Date.now();
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
    });
    if (!res.ok) throw new Error(`Ollama embed returned HTTP ${res.status}`);
    const data = await res.json() as { embedding: number[] };
    const latencyMs = Date.now() - start;
    logger.info(`[AIProvider:Ollama] Embedded ${text.length} chars in ${latencyMs}ms`);
    return {
      embedding: data.embedding,
      model: OLLAMA_EMBED_MODEL,
      inputTokens: Math.ceil(text.length / 4),
      latencyMs,
    };
  }

  async complete(prompt: string, systemPrompt?: string): Promise<AICompletionResult> {
    this.assertNotProduction();
    const start = Date.now();
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_CHAT_MODEL, messages, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama chat returned HTTP ${res.status}`);
    const data = await res.json() as { message?: { content?: string } };
    const text = data.message?.content ?? "";
    const latencyMs = Date.now() - start;
    logger.info(`[AIProvider:Ollama] Completion ${text.length} chars in ${latencyMs}ms`);
    return {
      text,
      model: OLLAMA_CHAT_MODEL,
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(text.length / 4),
      latencyMs,
    };
  }
}

// ─── Sandbox Adapter (Test only) ──────────────────────────────────────────────

class SandboxAdapter implements AIProviderAdapter {
  readonly name = "sandbox";

  private assertNotProduction(): void {
    if (process.env.NODE_ENV === "production") {
      throw new AIProviderError(
        this.name,
        "embed",
        "Sandbox provider cannot be used in production environments."
      );
    }
  }

  async embed(text: string): Promise<AIEmbeddingResult> {
    this.assertNotProduction();
    const start = Date.now();
    const embedding = Array.from({ length: EXPECTED_DIMENSION }, (_, i) => {
      const charCode = text.charCodeAt(i % text.length) || 0;
      return parseFloat(((charCode * 0.00123 + i * 0.00071) % 1).toFixed(6));
    });
    return { embedding, model: "sandbox-embed", inputTokens: Math.ceil(text.length / 4), latencyMs: Date.now() - start };
  }

  async complete(prompt: string): Promise<AICompletionResult> {
    this.assertNotProduction();
    const start = Date.now();
    return {
      text: "Sandbox completion stub.",
      model: "sandbox-chat",
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: 4,
      latencyMs: Date.now() - start,
    };
  }
}

// ─── Provider Registry & Service ─────────────────────────────────────────────

/** Lazily-instantiated adapters to avoid SDK imports at module load time. */
const adapterCache = new Map<ProviderName, AIProviderAdapter>();

function getAdapter(provider: ProviderName): AIProviderAdapter {
  if (!adapterCache.has(provider)) {
    const adapters: Record<ProviderName, AIProviderAdapter> = {
      gemini: new GeminiAdapter(),
      openai: new OpenAIAdapter(),
      ollama: new OllamaAdapter(),
      sandbox: new SandboxAdapter(),
    };
    if (!(provider in adapters)) {
      throw new AIProviderError(
        provider,
        "embed",
        `Unknown provider '${provider}'. Valid values: gemini, openai, ollama, sandbox.`
      );
    }
    adapterCache.set(provider, adapters[provider]);
  }
  return adapterCache.get(provider)!;
}

function resolveDefaultProvider(): ProviderName {
  const raw = (process.env["AI_PROVIDER"] ?? "").toLowerCase().trim();
  if (raw === "gemini" || raw === "openai" || raw === "ollama" || raw === "sandbox") {
    return raw;
  }
  // Default: sandbox in test, ollama in dev, fail-fast in production
  if (process.env.NODE_ENV === "production") {
    throw new AIProviderError(
      "config",
      "embed",
      "AI_PROVIDER must be explicitly set to 'gemini' or 'openai' in production. " +
        "No automatic fallback is allowed."
    );
  }
  return process.env.NODE_ENV === "test" ? "sandbox" : "ollama";
}

/**
 * AI Provider Service.
 * Unified access layer for embeddings and completions across Gemini, OpenAI, and Ollama.
 * All calls are wrapped with retry logic (3 attempts, exponential backoff) and a hard timeout.
 */
export class AIProviderService {
  /** Returns the active provider name without instantiating an adapter. */
  static getProviderName(): ProviderName {
    return resolveDefaultProvider();
  }

  static getAdapter(provider?: ProviderName): AIProviderAdapter {
    return getAdapter(provider ?? resolveDefaultProvider());
  }

  /**
   * Validate generated vector dimension length to prevent DB schema conflicts.
   */
  static validateEmbedding(embedding: number[]): void {
    if (!Array.isArray(embedding)) {
      throw new Error("Invalid embedding: must be a numeric array.");
    }
    if (embedding.length !== EXPECTED_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch: DB expects ${EXPECTED_DIMENSION}, provider returned ${embedding.length}.`
      );
    }
  }

  /**
   * Generate an embedding vector with retry + timeout, then log usage.
   */
  static async embed(
    text: string,
    userId?: string,
    provider?: ProviderName
  ): Promise<AIEmbeddingResult> {
    const adapter = getAdapter(provider ?? resolveDefaultProvider());
    try {
      const result = await withRetry(
        () => withTimeout(adapter.embed(text)),
        adapter.name,
        "embed"
      );
      this.validateEmbedding(result.embedding);
      await this.logUsage(userId ?? null, adapter.name, result.model, "embedding", result.inputTokens, 0, result.latencyMs);
      return result;
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError(adapter.name, "embed", err instanceof Error ? err.message : String(err), err);
    }
  }

  /**
   * Generate a text completion with retry + timeout, then log usage.
   */
  static async complete(
    prompt: string,
    systemPrompt?: string,
    userId?: string,
    provider?: ProviderName
  ): Promise<AICompletionResult> {
    const adapter = getAdapter(provider ?? resolveDefaultProvider());
    try {
      const result = await withRetry(
        () => withTimeout(adapter.complete(prompt, systemPrompt)),
        adapter.name,
        "complete"
      );
      await this.logUsage(userId ?? null, adapter.name, result.model, "completion", result.inputTokens, result.outputTokens, result.latencyMs);
      return result;
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError(adapter.name, "complete", err instanceof Error ? err.message : String(err), err);
    }
  }

  /** Persist AI usage log to database for billing and audit. */
  private static async logUsage(
    userId: string | null,
    provider: string,
    model: string,
    task: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number
  ): Promise<void> {
    try {
      const supabase = await createServerClient();
      await supabase.from("ai_logs").insert({
        user_id: userId,
        provider,
        model,
        task,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        latency_ms: latencyMs,
      });
    } catch {
      logger.warn(`[AIProvider] DB log write failed — provider: ${provider}, task: ${task}`);
    }
  }
}
