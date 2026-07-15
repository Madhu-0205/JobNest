"use client";

import { useEffect, useState, useRef } from "react";
import { RouteResult, generateVoiceDirections } from "@/utils/geospatial";

interface VoiceNavigationOptions {
  route: RouteResult | null;
  latitude: number | null;
  longitude: number | null;
  locale?: string;
  isMuted?: boolean;
}

/**
 * Custom React Hook: Voice Navigation simulator.
 * - Extracts regional directions templates based on route progress
 * - Matches GPS coordinates to upcoming route steps/maneuvers
 * - Employs HTML5 SpeechSynthesis for TTS regional announcement simulation
 */
export function useVoiceNavigation({
  route,
  latitude,
  longitude,
  locale = "en",
  isMuted = false,
}: VoiceNavigationOptions) {
  const [directions, setDirections] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const spokenStepsRef = useRef<Record<number, boolean>>({});

  // Reset progress when route changes
  useEffect(() => {
    if (!route) {
      setDirections([]);
      setCurrentStepIndex(0);
      setCurrentPrompt("");
      spokenStepsRef.current = {};
      return;
    }

    const items = generateVoiceDirections(route, locale);
    setDirections(items);
    setCurrentStepIndex(0);
    setCurrentPrompt(items[0] || "");
    spokenStepsRef.current = {};
  }, [route, locale]);

  function speak(text: string, langCode: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // clear previous announcements

      const utterance = new SpeechSynthesisUtterance(text);
      const locales: Record<string, string> = {
        en: "en-US",
        hi: "hi-IN",
        te: "te-IN",
        ta: "ta-IN",
        kn: "kn-IN",
        mr: "mr-IN",
      };

      utterance.lang = locales[langCode] || "en-US";
      utterance.rate = 0.95; // slightly slower for clarity
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Bypassed TTS speech output
    }
  }

  // Track progress and trigger voice prompts as the user moves close to waypoints
  useEffect(() => {
    if (!route || latitude === null || longitude === null || directions.length === 0) return;

    // Simulate progress: as index increases, match step instructions
    // For manual QA, let page controller advance step indices
    const currentText = directions[currentStepIndex];
    if (currentText && !spokenStepsRef.current[currentStepIndex]) {
      setCurrentPrompt(currentText);
      spokenStepsRef.current[currentStepIndex] = true;
      if (!isMuted) {
        speak(currentText, locale);
      }
    }
  }, [latitude, longitude, route, currentStepIndex, directions, locale, isMuted]);

  const nextStep = () => {
    if (currentStepIndex < directions.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return {
    directions,
    currentStepIndex,
    currentPrompt,
    nextStep,
    prevStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === directions.length - 1,
    announceCurrent: () => speak(currentPrompt, locale),
  };
}

export default useVoiceNavigation;
