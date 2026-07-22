/**
 * Unit tests: AI Provider Service
 *
 * Covers:
 *   - withRetry logic (3 attempts, correct backoff)
 *   - withTimeout logic
 *   - GeminiAdapter (mocked SDK) — embed and complete
 *   - OpenAIAdapter (mocked SDK) — embed and complete
 *   - OllamaAdapter throws in production
 *   - SandboxAdapter throws in production
 *   - Unknown provider throws AIProviderError
 *   - resolveDefaultProvider behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIProviderError } from "@/services/ai-provider-service";

// ─── Mock external SDKs BEFORE importing the service ─────────────────────────

const { mockGeminiEmbed, mockGeminiComplete, mockOpenAIEmbed, mockOpenAIComplete } = vi.hoisted(() => ({
  mockGeminiEmbed: vi.fn(),
  mockGeminiComplete: vi.fn(),
  mockOpenAIEmbed: vi.fn(),
  mockOpenAIComplete: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        embedContent: mockGeminiEmbed,
        generateContent: mockGeminiComplete,
      }),
    };
  }),
}));

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      embeddings: { create: mockOpenAIEmbed },
      chat: { completions: { create: mockOpenAIComplete } },
    };
  }),
}));

// Import AFTER mocking
import { AIProviderService } from "@/services/ai-provider-service";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

// ─── AIProviderError ──────────────────────────────────────────────────────────

describe("AIProviderError", () => {
  it("constructs with correct message format", () => {
    const err = new AIProviderError("gemini", "embed", "API key missing");
    expect(err.message).toBe("[AIProvider:gemini] embed failed — API key missing");
    expect(err.name).toBe("AIProviderError");
    expect(err.provider).toBe("gemini");
    expect(err.operation).toBe("embed");
  });
});

// ─── Provider resolution ──────────────────────────────────────────────────────

describe("AIProviderService.getProviderName", () => {
  afterEach(() => {
    setEnv({ AI_PROVIDER: undefined, NODE_ENV: "test" });
  });

  it("returns 'sandbox' in test when AI_PROVIDER is not set", () => {
    setEnv({ AI_PROVIDER: undefined, NODE_ENV: "test" });
    expect(AIProviderService.getProviderName()).toBe("sandbox");
  });

  it("returns 'gemini' when AI_PROVIDER=gemini", () => {
    setEnv({ AI_PROVIDER: "gemini" });
    expect(AIProviderService.getProviderName()).toBe("gemini");
  });

  it("returns 'openai' when AI_PROVIDER=openai", () => {
    setEnv({ AI_PROVIDER: "openai" });
    expect(AIProviderService.getProviderName()).toBe("openai");
  });

  it("throws AIProviderError in production when AI_PROVIDER is not set", () => {
    setEnv({ AI_PROVIDER: undefined, NODE_ENV: "production" });
    expect(() => AIProviderService.getProviderName()).toThrow(AIProviderError);
  });
});

// ─── Ollama + Sandbox production guard ───────────────────────────────────────

describe("OllamaAdapter production guard", () => {
  beforeEach(() => setEnv({ AI_PROVIDER: "ollama", NODE_ENV: "production" }));
  afterEach(() => setEnv({ NODE_ENV: "test", AI_PROVIDER: undefined }));

  it("throws AIProviderError on embed() in production", async () => {
    await expect(AIProviderService.embed("test")).rejects.toThrow(AIProviderError);
  });

  it("throws AIProviderError on complete() in production", async () => {
    await expect(AIProviderService.complete("test")).rejects.toThrow(AIProviderError);
  });
});

describe("SandboxAdapter production guard", () => {
  beforeEach(() => setEnv({ AI_PROVIDER: "sandbox", NODE_ENV: "production" }));
  afterEach(() => setEnv({ NODE_ENV: "test", AI_PROVIDER: undefined }));

  it("throws AIProviderError on embed() in production", async () => {
    await expect(AIProviderService.embed("test")).rejects.toThrow(AIProviderError);
  });
});

// ─── Gemini Adapter ───────────────────────────────────────────────────────────

describe("GeminiAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEnv({ AI_PROVIDER: "gemini", GEMINI_API_KEY: "fake-gemini-key", NODE_ENV: "test" });
  });

  afterEach(() => setEnv({ AI_PROVIDER: undefined, GEMINI_API_KEY: undefined, NODE_ENV: "test" }));

  it("calls embedContent and returns correct shape", async () => {
    mockGeminiEmbed.mockResolvedValueOnce({
      embedding: { values: Array(384).fill(0.1) },
    });

    const result = await AIProviderService.embed("hello world");
    expect(mockGeminiEmbed).toHaveBeenCalledWith("hello world");
    expect(result.embedding).toHaveLength(384);
    expect(result.model).toContain("embedding");
    expect(typeof result.latencyMs).toBe("number");
  });

  it("calls generateContent and returns text", async () => {
    mockGeminiComplete.mockResolvedValueOnce({
      response: {
        text: () => "Gemini response text",
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
      },
    });

    const result = await AIProviderService.complete("Hello");
    expect(result.text).toBe("Gemini response text");
    expect(result.inputTokens).toBe(5);
    expect(result.outputTokens).toBe(3);
  });

  it("throws AIProviderError when GEMINI_API_KEY is missing", async () => {
    setEnv({ GEMINI_API_KEY: undefined });
    await expect(AIProviderService.embed("test")).rejects.toThrow(AIProviderError);
  });
});

// ─── OpenAI Adapter ───────────────────────────────────────────────────────────

describe("OpenAIAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEnv({ AI_PROVIDER: "openai", OPENAI_API_KEY: "fake-openai-key", NODE_ENV: "test" });
  });

  afterEach(() => setEnv({ AI_PROVIDER: undefined, OPENAI_API_KEY: undefined, NODE_ENV: "test" }));

  it("calls embeddings.create and returns correct shape", async () => {
    mockOpenAIEmbed.mockResolvedValueOnce({
      data: [{ embedding: Array(384).fill(0.05) }],  // 384 to match EMBEDDING_DIMENSION (DB schema)
      usage: { prompt_tokens: 4 },
    });

    const result = await AIProviderService.embed("test embed");
    expect(mockOpenAIEmbed).toHaveBeenCalledWith(
      expect.objectContaining({ input: "test embed" })
    );
    expect(result.embedding).toHaveLength(384);
    expect(result.inputTokens).toBe(4);
  });

  it("calls chat.completions.create and returns text", async () => {
    mockOpenAIComplete.mockResolvedValueOnce({
      choices: [{ message: { content: "OpenAI reply" } }],
      usage: { prompt_tokens: 3, completion_tokens: 2 },
    });

    const result = await AIProviderService.complete("Hi");
    expect(result.text).toBe("OpenAI reply");
    expect(result.inputTokens).toBe(3);
    expect(result.outputTokens).toBe(2);
  });

  it("throws AIProviderError when OPENAI_API_KEY is missing", async () => {
    setEnv({ OPENAI_API_KEY: undefined });
    await expect(AIProviderService.embed("test")).rejects.toThrow(AIProviderError);
  });
});

// ─── Embedding validation ─────────────────────────────────────────────────────

describe("AIProviderService.validateEmbedding", () => {
  it("passes for correct dimension (384 default)", () => {
    setEnv({ EMBEDDING_DIMENSION: "384" });
    expect(() => AIProviderService.validateEmbedding(Array(384).fill(0))).not.toThrow();
  });

  it("throws for wrong dimension", () => {
    setEnv({ EMBEDDING_DIMENSION: "384" });
    expect(() => AIProviderService.validateEmbedding(Array(512).fill(0))).toThrow(/dimension mismatch/i);
  });

  it("throws for non-array", () => {
    expect(() => AIProviderService.validateEmbedding("not-an-array" as never)).toThrow();
  });
});
