

import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// AI Provider Adapters
// ─────────────────────────────────────────────────────────────────

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

interface AIProviderAdapter {
  name: string;
  embed(text: string): Promise<AIEmbeddingResult>;
  complete(prompt: string, systemPrompt?: string): Promise<AICompletionResult>;
}

// ─────────────────────────────────────────────────────────────────
// Ollama Adapter (Default Local Provider)
// ─────────────────────────────────────────────────────────────────

const OLLAMA_BASE_URL = process.env["OLLAMA_URL"] || "http://localhost:11434";
const OLLAMA_EMBED_MODEL = "nomic-embed-text";
const OLLAMA_CHAT_MODEL = "gemma";

class OllamaAdapter implements AIProviderAdapter {
  name = "ollama";

  async embed(text: string): Promise<AIEmbeddingResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
      });

      if (!res.ok) throw new Error(`Ollama embed returned ${res.status}`);

      const data = await res.json() as { embedding: number[] };
      const latencyMs = Date.now() - start;

      logger.info(`[AIProvider:Ollama] Embedded ${text.length} chars in ${latencyMs}ms`);
      return {
        embedding: data.embedding,
        model: OLLAMA_EMBED_MODEL,
        inputTokens: Math.ceil(text.length / 4),
        latencyMs,
      };
    } catch {
      logger.warn("[AIProvider:Ollama] Embed request failed. Returning deterministic mock embedding.");
      return this.mockEmbed(text, start);
    }
  }

  async complete(prompt: string, systemPrompt?: string): Promise<AICompletionResult> {
    const start = Date.now();
    try {
      const messages = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });

      const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_CHAT_MODEL, messages, stream: false }),
      });

      if (!res.ok) throw new Error(`Ollama chat returned ${res.status}`);

      const data = await res.json() as { message?: { content?: string } };
      const latencyMs = Date.now() - start;
      const text = data.message?.content || "";

      logger.info(`[AIProvider:Ollama] Completion ${text.length} chars in ${latencyMs}ms`);
      return {
        text,
        model: OLLAMA_CHAT_MODEL,
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(text.length / 4),
        latencyMs,
      };
    } catch {
      logger.warn("[AIProvider:Ollama] Chat request failed. Returning mock completion.");
      return this.mockComplete(prompt, start);
    }
  }

  // ── Deterministic sandbox fallbacks ──

  private mockEmbed(text: string, startTime: number): AIEmbeddingResult {
    // Generate a deterministic 384-dim vector from text hash
    const embedding = new Array(384).fill(0).map((_, i) => {
      const charCode = text.charCodeAt(i % text.length) || 0;
      return parseFloat(((charCode * 0.00123 + i * 0.00071) % 1).toFixed(6));
    });
    return {
      embedding,
      model: OLLAMA_EMBED_MODEL,
      inputTokens: Math.ceil(text.length / 4),
      latencyMs: Date.now() - startTime,
    };
  }

  private mockComplete(prompt: string, startTime: number): AICompletionResult {
    const mockResponses: Record<string, string> = {
      enhance: "Experienced professional with strong dedication to quality work and consistent reliability. Skilled in delivering results across multiple domains with attention to detail and safety awareness.",
      translate: "अनुवादित पाठ: यह एक अनुवादित संदेश है।",
      default: "AI-generated suggestion based on the provided context. This recommendation considers local market dynamics, skill requirements, and regional availability patterns.",
    };

    const key = prompt.toLowerCase().includes("enhance") ? "enhance"
      : prompt.toLowerCase().includes("translate") ? "translate"
      : "default";

    const text = mockResponses[key] ?? mockResponses["default"];
    return {
      text,
      model: OLLAMA_CHAT_MODEL,
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(text.length / 4),
      latencyMs: Date.now() - startTime,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Provider Registry
// ─────────────────────────────────────────────────────────────────

type ProviderName = "ollama";

const ADAPTERS: Record<ProviderName, AIProviderAdapter> = {
  ollama: new OllamaAdapter(),
};

/**
 * AI Provider Service.
 * Unified access layer for embeddings, completions, and AI task logging.
 */
export class AIProviderService {
  private static defaultProvider: ProviderName = "ollama";

  static getAdapter(provider?: ProviderName): AIProviderAdapter {
    return ADAPTERS[provider || this.defaultProvider];
  }

  /**
   * Generate an embedding vector for the given text and log usage.
   */
  static async embed(text: string, userId?: string, provider?: ProviderName): Promise<AIEmbeddingResult> {
    const adapter = this.getAdapter(provider);
    const result = await adapter.embed(text);
    await this.logUsage(userId || null, adapter.name, result.model, "embedding", result.inputTokens, 0, result.latencyMs);
    return result;
  }

  /**
   * Generate a text completion and log usage.
   */
  static async complete(prompt: string, systemPrompt?: string, userId?: string, provider?: ProviderName): Promise<AICompletionResult> {
    const adapter = this.getAdapter(provider);
    const result = await adapter.complete(prompt, systemPrompt);
    await this.logUsage(userId || null, adapter.name, result.model, "completion", result.inputTokens, result.outputTokens, result.latencyMs);
    return result;
  }

  /**
   * Persist AI usage log to database for billing and audit.
   */
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
      logger.warn(`[AIProvider] Failed to persist AI log. Provider: ${provider}, Task: ${task}`);
    }
  }
}
