"use client";

import { useState, useCallback } from "react";

export interface TranslationResult {
  original: string;
  translated: string;
  targetLanguage: string;
  targetLanguageName: string;
  model: string;
  latencyMs: number;
}

export function useAiTranslation() {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (text: string, targetLanguage: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Translation failed.");
      }
    } catch {
      setError("Network error during translation.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTranslation = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, translate, clearTranslation };
}
