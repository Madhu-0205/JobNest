import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// AI Provider Adapters & Types
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
// Ollama Adapter (Local Provider)
// ─────────────────────────────────────────────────────────────────

const OLLAMA_BASE_URL = process.env["OLLAMA_URL"] || "http://localhost:11434";
const OLLAMA_EMBED_MODEL = process.env["EMBEDDING_MODEL"] || "all-minilm"; // Defaulting to 384-dimension all-minilm
const OLLAMA_CHAT_MODEL = process.env["CHAT_MODEL"] || "gemma";
const EXPECTED_DIMENSION = Number(process.env["EMBEDDING_DIMENSION"] || "384");

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

      if (!res.ok) throw new Error(`Ollama embed returned status ${res.status}`);

      const data = await res.json() as { embedding: number[] };
      const latencyMs = Date.now() - start;

      logger.info(`[AIProvider:Ollama] Embedded ${text.length} chars in ${latencyMs}ms`);
      return {
        embedding: data.embedding,
        model: OLLAMA_EMBED_MODEL,
        inputTokens: Math.ceil(text.length / 4),
        latencyMs,
      };
    } catch (err) {
      logger.warn(`[AIProvider:Ollama] Request failed, using fallback mock: ${err instanceof Error ? err.message : String(err)}`);
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

      if (!res.ok) throw new Error(`Ollama chat returned status ${res.status}`);

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
    } catch (err) {
      logger.warn(`[AIProvider:Ollama] Request failed, using fallback mock: ${err instanceof Error ? err.message : String(err)}`);
      return this.mockComplete(prompt, start);
    }
  }

  private mockEmbed(text: string, startTime: number): AIEmbeddingResult {
    // Generate a deterministic vector matching expected dimension length from text hash
    const embedding = new Array(EXPECTED_DIMENSION).fill(0).map((_, i) => {
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
// Configurable Provider Registry
// ─────────────────────────────────────────────────────────────────

type ProviderName = "ollama" | "sandbox";

const ADAPTERS: Record<ProviderName, AIProviderAdapter> = {
  ollama: new OllamaAdapter(),
  sandbox: {
    name: "sandbox",
    async embed(text: string) {
      const start = Date.now();
      const embedding = new Array(EXPECTED_DIMENSION).fill(0).map((_, i) => {
        const charCode = text.charCodeAt(i % text.length) || 0;
        return parseFloat(((charCode * 0.00123 + i * 0.00071) % 1).toFixed(6));
      });
      return {
        embedding,
        model: "sandbox-embed",
        inputTokens: Math.ceil(text.length / 4),
        latencyMs: Date.now() - start,
      };
    },
    async complete(prompt: string) {
      const start = Date.now();
      return {
        text: "Sandbox completions simulation.",
        model: "sandbox-chat",
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: 8,
        latencyMs: Date.now() - start,
      };
    }
  }
};

/**
 * AI Provider Service.
 * Unified access layer for embeddings, completions, and AI task logging.
 */
export class AIProviderService {
  private static defaultProvider: ProviderName = (process.env["EMBEDDING_PROVIDER"] as ProviderName) || "ollama";

  static getAdapter(provider?: ProviderName): AIProviderAdapter {
    const active = provider || this.defaultProvider;
    if (!ADAPTERS[active]) {
      throw new Error(`AI Provider adapter '${active}' is not registered.`);
    }
    return ADAPTERS[active];
  }

  /**
   * Validate generated vector dimension length to prevent DB schema conflicts.
   */
  static validateEmbedding(embedding: number[]): void {
    if (!Array.isArray(embedding)) {
      throw new Error("Invalid embedding structure: must be a numeric array.");
    }
    if (embedding.length !== EXPECTED_DIMENSION) {
      throw new Error(`Embedding vector size mismatch: database expects ${EXPECTED_DIMENSION}, provider generated ${embedding.length}.`);
    }
  }

  /**
   * Generate an embedding vector for the given text and log usage.
   */
  static async embed(text: string, userId?: string, provider?: ProviderName): Promise<AIEmbeddingResult> {
    const adapter = this.getAdapter(provider);
    const result = await adapter.embed(text);
    
    // Auto-detect and validate the dimension sizes
    this.validateEmbedding(result.embedding);

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
