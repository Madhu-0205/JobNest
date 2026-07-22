import { logger } from "@/lib/observability/logger";

export const AI_ABUSE_CONFIG = {
  MAX_PROMPT_LENGTH: 2000,
  MAX_CONTEXT_LENGTH: 8000,
  MAX_OUTPUT_TOKENS: 1000,
};

export const UPLOAD_ABUSE_CONFIG = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "application/pdf"],
};

export class AbuseProtection {
  /**
   * Validates an AI prompt against abuse bounds.
   */
  static validateAIPrompt(prompt: string, context?: string) {
    if (prompt.length > AI_ABUSE_CONFIG.MAX_PROMPT_LENGTH) {
      logger.warn(`AI prompt abuse: Prompt length ${prompt.length} exceeds max ${AI_ABUSE_CONFIG.MAX_PROMPT_LENGTH}`);
      throw new Error(`Prompt exceeds maximum allowed length of ${AI_ABUSE_CONFIG.MAX_PROMPT_LENGTH} characters.`);
    }

    if (context && context.length > AI_ABUSE_CONFIG.MAX_CONTEXT_LENGTH) {
      logger.warn(`AI context abuse: Context length ${context.length} exceeds max ${AI_ABUSE_CONFIG.MAX_CONTEXT_LENGTH}`);
      throw new Error(`Context exceeds maximum allowed length of ${AI_ABUSE_CONFIG.MAX_CONTEXT_LENGTH} characters.`);
    }

    return true;
  }

  /**
   * Validates file upload metadata against abuse bounds.
   */
  static validateUpload(mimeType: string, sizeBytes: number) {
    if (!UPLOAD_ABUSE_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
      logger.warn(`Upload abuse: Blocked MIME type ${mimeType}`);
      throw new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed.");
    }

    if (sizeBytes > UPLOAD_ABUSE_CONFIG.MAX_FILE_SIZE_BYTES) {
      logger.warn(`Upload abuse: Blocked file of size ${sizeBytes} bytes (exceeds 10MB max)`);
      throw new Error("File exceeds maximum allowed size of 10MB.");
    }
    
    // Protection against basic ZIP bombs (relying on mimetype rejection above handles this for now, but explicit check for zipped types)
    if (mimeType.includes("zip") || mimeType.includes("compressed")) {
      throw new Error("Archives and compressed files are not permitted.");
    }

    return true;
  }
}
