import { AIProviderService } from "@/services/ai-provider-service";
import { VoiceIntentSchema, VoiceIntent } from "./schemas";
import { logger } from "@/services/logger";
import { GeospatialService } from "@/services/geospatial-service";

const SYSTEM_PROMPT = `You are the JobNest Voice Intelligence Router.
Your job is to read a transcript from a user's voice command and extract the structured intent.
The user might speak in English, Hindi, Telugu, Tamil, or a mix of these (code-switching).
Translate the core request to English in your internal thought process, then output the structured JSON.

Valid intents:
SEARCH_OPPORTUNITIES: looking for jobs or gigs
SEARCH_PEOPLE: looking for connections, workers, freelancers
SEARCH_ORGANIZATIONS: looking for companies, startups
SEARCH_SERVICES: looking to hire someone for a service
SEARCH_EVENTS: looking for professional events, meetups
SEARCH_MAP: looking for things near a location generally
NAVIGATE: requesting directions or route to a specific place
CREATE_TASK: wants to post a gig or task
CREATE_OPPORTUNITY: wants to post a professional job
APPLY_TO_OPPORTUNITY: wants to apply for a job
BOOK_SERVICE: wants to book a worker
START_TRACKING: wants to track live location
OPEN_PROFILE: wants to see their profile or someone else's
OPEN_ORGANIZATION: wants to view a company
OPEN_MESSAGES: wants to check inbox
SHOW_RECOMMENDATIONS: wants to see their feed
AMBIGUOUS: if the request is incomplete or unclear, ask a clarification_question

Mode mapping:
- PRO: jobs, companies, startups, career events, professional networking
- LOCAL: gigs, home services, repairs, local workers, local meetups
- UNKNOWN: if you can't tell

Extract any location mentions into \`location.name\`. If a distance like "within 5 km" is mentioned, set \`location.radius_km\`.
Extract skills, categories, or employment_type if mentioned.
Return ONLY valid JSON matching the schema. No markdown formatting.
`;

export async function extractVoiceIntentAction(transcript: string): Promise<VoiceIntent> {
  try {
    const result = await AIProviderService.complete(transcript, SYSTEM_PROMPT);
    
    let text = result.text.trim();
    if (text.startsWith("```json")) text = text.substring(7);
    else if (text.startsWith("```")) text = text.substring(3);
    if (text.endsWith("```")) text = text.substring(0, text.length - 3);

    const parsed = JSON.parse(text);
    const intent = VoiceIntentSchema.parse(parsed);

    if (
      intent.location?.name &&
      !intent.location.name.toLowerCase().includes("near me") &&
      !intent.location.name.toLowerCase().includes("current location") &&
      !intent.location.name.toLowerCase().includes("nearby")
    ) {
      const geo = await GeospatialService.geocode(intent.location.name);
      if (geo) {
        intent.location.lat = geo.latitude;
        intent.location.lng = geo.longitude;
        intent.location.formatted_address = geo.displayName;
      }
    }

    return intent;
  } catch (error) {
    logger.error("[VoiceActions] Failed to extract intent", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isRateLimit = msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit");
    return {
      intent: "AMBIGUOUS",
      clarification_question: isRateLimit
        ? "AI assistant is temporarily busy due to high demand. Please wait a moment and try again."
        : "I couldn't quite understand that. Could you try rephrasing?",
      confidence: 0.0
    };
  }
}
