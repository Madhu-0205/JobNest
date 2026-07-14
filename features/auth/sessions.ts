import { createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

interface ParsedUserAgent {
  deviceType: string;
  os: string;
  browser: string;
}

/**
 * Lightweight User Agent Parser.
 * Bypasses heavy external packages to optimize Server Action bundles.
 */
export function parseUserAgent(uaString: string): ParsedUserAgent {
  const lowercaseUa = uaString.toLowerCase();
  let deviceType = "desktop";
  let os = "unknown";
  let browser = "unknown";

  if (lowercaseUa.includes("mobi") || lowercaseUa.includes("android")) {
    deviceType = "mobile";
  } else if (lowercaseUa.includes("tablet") || lowercaseUa.includes("ipad")) {
    deviceType = "tablet";
  }

  if (lowercaseUa.includes("windows")) os = "Windows";
  else if (lowercaseUa.includes("macintosh") || lowercaseUa.includes("mac os")) os = "macOS";
  else if (lowercaseUa.includes("android")) os = "Android";
  else if (lowercaseUa.includes("iphone") || lowercaseUa.includes("ipad")) os = "iOS";
  else if (lowercaseUa.includes("linux")) os = "Linux";

  if (lowercaseUa.includes("chrome") || lowercaseUa.includes("crios")) browser = "Chrome";
  else if (lowercaseUa.includes("firefox")) browser = "Firefox";
  else if (lowercaseUa.includes("safari") && !lowercaseUa.includes("chrome")) browser = "Safari";
  else if (lowercaseUa.includes("edge")) browser = "Edge";

  return { deviceType, os, browser };
}

/**
 * Enterprise Session & Device Manager Service.
 * Tracks user login locations, devices, and sessions, allowing security auditing.
 */
export class SessionManager {
  /**
   * Registers a session and its executing device.
   */
  static async registerSession(userId: string): Promise<void> {
    const supabase = await createServerClient();
    const headerList = await headers();

    const userAgent = headerList.get("user-agent") || "unknown";
    const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const parsedUa = parseUserAgent(userAgent);
    const deviceName = `${parsedUa.os} (${parsedUa.browser})`;

    // 1. Insert or locate existing matching device
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .insert({
        user_id: userId,
        device_name: deviceName,
        device_type: parsedUa.deviceType,
        os: parsedUa.os,
        browser: parsedUa.browser,
        last_active_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (deviceError || !device) {
      // Graceful error logging (should not block login flow if analytics log fails)
      console.warn("Failed to register device details in identity ledger:", deviceError);
      return;
    }

    // 2. Register session state log
    const { error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        token_hash: crypto.randomUUID(), // Mock hash mapping
        ip_address: ipAddress,
        user_agent: userAgent,
        device_id: device.id,
        is_revoked: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

    if (sessionError) {
      console.warn("Failed to register session logs:", sessionError);
    }
  }

  /**
   * Revokes a session dynamically (Revocation).
   */
  static async revokeSession(sessionId: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from("sessions")
      .update({ is_revoked: true })
      .eq("id", sessionId);

    if (error) {
      throw new Error(`Failed to revoke session: ${error.message}`);
    }
  }

  /**
   * Logs out all sessions except the active one for a user (Device cleanup).
   */
  static async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from("sessions")
      .update({ is_revoked: true })
      .eq("user_id", userId)
      .neq("id", currentSessionId);

    if (error) {
      throw new Error(`Failed to revoke other sessions: ${error.message}`);
    }
  }
}
