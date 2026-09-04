"use client";

import { useState } from "react";
import { Mic, Loader2, X, Check, AlertTriangle, Sparkles, Navigation } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { VoiceIntent } from "@/features/voice/schemas";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { geocodeAddressAction } from "@/features/geospatial/actions";

export function VoiceAssistant() {
  const { state, setState, errorMsg, startRecording, stopRecording, reset } = useVoiceRecorder();
  const [transcript, setTranscript] = useState<string | null>(null);
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const { latitude, longitude } = useCurrentLocation();

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateTTSFeedback = (intentObj: VoiceIntent) => {
    if (intentObj.intent === "AMBIGUOUS") {
      return intentObj.clarification_question || "I didn't quite catch that. Could you clarify?";
    }
    if (["APPLY_TO_OPPORTUNITY", "BOOK_SERVICE", "CREATE_TASK", "START_TRACKING"].includes(intentObj.intent)) {
      return `Would you like to ${intentObj.intent.replace(/_/g, " ").toLowerCase()}? Please confirm.`;
    }
    let actionText = "Looking for";
    if (intentObj.query) actionText += ` ${intentObj.query}`;
    else actionText += ` ${intentObj.intent.replace(/_/g, " ").toLowerCase()}`;
    
    if (intentObj.location?.name) {
      actionText += ` in ${intentObj.location.name}`;
    } else if (intentObj.location?.radius_km) {
      actionText += ` within ${intentObj.location.radius_km} kilometers`;
    }
    return actionText + ".";
  };

  const handleMicClick = async () => {
    setLocalError(null);
    if (state === "idle" || state === "error" || state === "success" || state === "confirming") {
      setTranscript(null);
      setIntent(null);
      await startRecording();
    } else if (state === "listening") {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await processVoice(audioBlob);
      }
    }
  };

  const processVoice = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice.webm");

      const response = await fetch("/api/voice/intent", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process voice");
      }

      setTranscript(data.transcript);
      setIntent(data.intent);

      const parsedIntent = data.intent as VoiceIntent;
      
      const sensitiveIntents = ["APPLY_TO_OPPORTUNITY", "CREATE_TASK", "CREATE_OPPORTUNITY", "BOOK_SERVICE", "START_TRACKING"];
      
      if (sensitiveIntents.includes(parsedIntent.intent) || parsedIntent.intent === "AMBIGUOUS") {
        setState("confirming");
        speak(generateTTSFeedback(parsedIntent));
      } else {
        setState("success");
        speak(generateTTSFeedback(parsedIntent));
        executeIntent(parsedIntent);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process voice";
      setLocalError(message);
      setState("error");
      speak("I couldn't complete that search. Please try again.");
    }
  };

  const executeIntent = (parsedIntent: VoiceIntent) => {
    setTimeout(async () => {
      reset();
      
      const query = new URLSearchParams();
      if (parsedIntent.query) query.set("q", parsedIntent.query);
      
      let finalLat = parsedIntent.location?.lat;
      let finalLng = parsedIntent.location?.lng;

      if (parsedIntent.location?.name) {
        query.set("loc", parsedIntent.location.name);
        const locLower = parsedIntent.location.name.toLowerCase();
        if (locLower.includes("near me") || locLower.includes("current location") || locLower.includes("nearby")) {
          if (latitude && longitude) {
            finalLat = latitude;
            finalLng = longitude;
            query.set("loc", "Current Location");
          }
        } else {
          // Resolve location string to coordinates
          try {
            const geocodeResult = await geocodeAddressAction({ address: parsedIntent.location.name });
            if (geocodeResult.success && geocodeResult.data) {
              finalLat = geocodeResult.data.latitude;
              finalLng = geocodeResult.data.longitude;
            }
          } catch (e) {
            console.error("Voice geocoding failed", e);
          }
        }
      }

      if (finalLat != null && finalLng != null) {
        query.set("lat", finalLat.toString());
        query.set("lng", finalLng.toString());
      }
      
      if (parsedIntent.location?.radius_km != null) {
        query.set("radius", parsedIntent.location.radius_km.toString());
      }
      
      switch (parsedIntent.intent) {
        case "SEARCH_OPPORTUNITIES":
          const modeStr = parsedIntent.mode === "LOCAL" ? "/worker/opportunities" : "/pro/jobs";
          router.push(`${modeStr}?${query.toString()}`);
          break;
        case "SEARCH_SERVICES":
          router.push(`/worker/opportunities?${query.toString()}`);
          break;
        case "SEARCH_PEOPLE":
        case "SEARCH_ORGANIZATIONS":
        case "SEARCH_EVENTS":
        case "SHOW_RECOMMENDATIONS":
          router.push(`/pro/network?${query.toString()}`);
          break;
        case "SEARCH_MAP":
        case "NAVIGATE":
          router.push(`/geospatial?${query.toString()}`);
          break;
        case "OPEN_PROFILE":
          router.push("/profile");
          break;
        case "OPEN_MESSAGES":
          router.push("/messages");
          break;
        case "APPLY_TO_OPPORTUNITY":
        case "BOOK_SERVICE":
        case "CREATE_TASK":
          // Execute explicit server action flow in real system
          speak(`Action ${parsedIntent.intent.replace(/_/g, " ")} confirmed.`);
          break;
        default:
          break;
      }
    }, 2000);
  };

  const handleCancel = () => {
    reset();
  };

  const handleConfirm = () => {
    if (intent) {
      setState("success");
      executeIntent(intent);
    }
  };

  if (state === "idle") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleMicClick}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/30 flex items-center justify-center group"
          title="Talk to JobNest"
        >
          <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Voice Assistant Popover Card */}
      <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl w-80 p-5 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        {state === "listening" && (
          <div className="flex flex-col items-center py-4 gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
              <Mic className="w-8 h-8 text-indigo-500 animate-bounce" />
            </div>
            <Typography variant="h4" className="font-bold text-center">Listening...</Typography>
            <Typography variant="muted" className="text-xs text-center">Tap the mic to stop recording</Typography>
          </div>
        )}

        {state === "processing" && (
          <div className="flex flex-col items-center py-6 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <Typography variant="h4" className="font-bold text-center">Thinking...</Typography>
          </div>
        )}

        {state === "success" && intent && (
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
              <Check className="w-5 h-5" />
              <Typography variant="h4">Action Understood</Typography>
            </div>
            {transcript && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-border/50 pl-2">
                &quot;{transcript}&quot;
              </p>
            )}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 w-full mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> {intent.intent.replace(/_/g, " ")}
              </div>
              {intent.query && <div className="text-sm font-medium">{intent.query}</div>}
              {intent.location?.name && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Navigation className="w-3 h-3" /> {intent.location.name}</div>}
            </div>
            <Typography variant="muted" className="text-[10px] w-full text-center mt-2 animate-pulse">
              Executing action...
            </Typography>
          </div>
        )}

        {state === "confirming" && intent && (
          <div className="flex flex-col gap-3">
            {intent.intent === "AMBIGUOUS" ? (
              <>
                <div className="flex items-center gap-2 text-amber-500 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <Typography variant="h4">Clarification Needed</Typography>
                </div>
                <Typography variant="p" className="text-sm">
                  {intent.clarification_question || "Could you provide more details?"}
                </Typography>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-500 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <Typography variant="h4">Confirm Action</Typography>
                </div>
                {transcript && (
                  <p className="text-xs text-muted-foreground italic border-l-2 border-border/50 pl-2">
                    &quot;{transcript}&quot;
                  </p>
                )}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 w-full mt-2">
                  <div className="text-xs font-bold text-amber-500 mb-1">{intent.intent.replace(/_/g, " ")}</div>
                  {intent.query && <div className="text-sm font-medium">{intent.query}</div>}
                </div>
              </>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={handleCancel}>Cancel</Button>
              {intent.intent !== "AMBIGUOUS" && (
                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleConfirm}>Confirm</Button>
              )}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <Typography variant="h4" className="font-bold text-center text-red-400">Error</Typography>
            <Typography variant="muted" className="text-xs text-center text-red-300">
              {localError || errorMsg || "Something went wrong."}
            </Typography>
            <Button variant="outline" size="sm" onClick={handleCancel} className="mt-2">Close</Button>
          </div>
        )}
      </div>

      {/* Main Trigger Button (Stop/Close state) */}
      <button
        onClick={state === "listening" ? handleMicClick : handleCancel}
        className={`p-4 rounded-full shadow-lg transition-all focus:outline-none flex items-center justify-center ${
          state === "listening" ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-slate-800 hover:bg-slate-700"
        }`}
      >
        {state === "listening" ? (
          <div className="w-4 h-4 bg-white rounded-sm" />
        ) : (
          <X className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
