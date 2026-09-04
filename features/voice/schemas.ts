import { z } from "zod";

export const VoiceIntentTypeSchema = z.enum([
  "SEARCH_OPPORTUNITIES",
  "SEARCH_PEOPLE",
  "SEARCH_ORGANIZATIONS",
  "SEARCH_SERVICES",
  "SEARCH_EVENTS",
  "SEARCH_MAP",
  "NAVIGATE",
  "CREATE_TASK",
  "CREATE_OPPORTUNITY",
  "APPLY_TO_OPPORTUNITY",
  "BOOK_SERVICE",
  "START_TRACKING",
  "OPEN_PROFILE",
  "OPEN_ORGANIZATION",
  "OPEN_MESSAGES",
  "SHOW_RECOMMENDATIONS",
  "AMBIGUOUS"
]);

export type VoiceIntentType = z.infer<typeof VoiceIntentTypeSchema>;

export const VoiceIntentSchema = z.object({
  intent: VoiceIntentTypeSchema,
  mode: z.enum(["LOCAL", "PRO", "UNKNOWN"]).nullish(),
  query: z.string().nullish().describe("The core search or action query extracted"),
  category: z.string().nullish(),
  skills: z.array(z.string()).nullish(),
  location: z.object({
    name: z.string(),
    radius_km: z.number().nullish(),
    lat: z.number().nullish(),
    lng: z.number().nullish(),
    formatted_address: z.string().nullish()
  }).nullish(),
  employment_type: z.string().nullish(),
  target_id: z.string().nullish().describe("ID of the user, organization, or opportunity if explicitly matched"),
  clarification_question: z.string().nullish().describe("If intent is AMBIGUOUS, the question to ask the user"),
  confidence: z.number().min(0).max(1).nullish()
});

export type VoiceIntent = z.infer<typeof VoiceIntentSchema>;
