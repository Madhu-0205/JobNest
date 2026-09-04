"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";
import { AuthorizationError } from "@/lib/errors";
import { RecommendationEngine } from "@/services/recommendation-engine";

async function executeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  return runWithRequestContext(async () => {
    return logRequestLifecycle(actionName, async (): Promise<ActionResult<T>> => {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: {
              message: "Validation Error",
              code: "VALIDATION_ERROR",
            },
          };
        }
        if (error instanceof AuthorizationError) {
          return {
            success: false,
            error: {
              message: error.message,
              code: "UNAUTHORIZED",
            },
          };
        }
        return {
          success: false,
          error: {
            message: error instanceof Error ? error.message : "Internal Server Error",
            code: "INTERNAL_ERROR",
          },
        };
      }
    });
  });
}

const targetSchema = z.object({
  targetId: z.string().uuid(),
  targetType: z.enum(["user", "organization"]),
});

export async function sendConnectionRequestAction(targetUserId: string) {
  return executeAction("sendConnectionRequest", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthorizationError("Authentication required.");

    if (user.id === targetUserId) {
      throw new Error("Cannot connect to yourself.");
    }

    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: user.id,
        recipient_id: targetUserId,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
         throw new Error("A connection request already exists between these users.");
      }
      throw new Error(error.message);
    }
    
    return data;
  });
}

export async function acceptConnectionRequestAction(connectionId: string) {
  return executeAction("acceptConnectionRequest", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthorizationError("Authentication required.");

    const { data, error } = await supabase
      .from("connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", connectionId)
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  });
}

export async function toggleFollowAction(params: { targetId: string; targetType: "user" | "organization" }) {
  return executeAction("toggleFollow", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthorizationError("Authentication required.");
    
    const parsed = targetSchema.parse(params);
    const { targetId, targetType } = parsed;

    if (targetType === "user" && targetId === user.id) {
      throw new Error("Cannot follow yourself.");
    }

    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .single();

    if (existing) {
      const { error } = await supabase.from("follows").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { following: false };
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        target_type: targetType,
        target_id: targetId,
      });
      if (error) throw new Error(error.message);
      return { following: true };
    }
  });
}

export async function getNetworkDiscoveryFeedAction(lat?: number, lng?: number) {
  return executeAction("getNetworkDiscoveryFeed", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthorizationError("Authentication required.");

    // Default to a generic location if not provided (for fallback purposes)
    const targetLat = lat ?? 28.6139;
    const targetLng = lng ?? 77.2090;

    const [orgs, connections, events] = await Promise.all([
      RecommendationEngine.recommend(user.id, "organization", targetLat, targetLng, 50000),
      RecommendationEngine.recommend(user.id, "connection", targetLat, targetLng, 50000),
      RecommendationEngine.recommend(user.id, "event", targetLat, targetLng, 50000)
    ]);

    const { data: posts, error: postError } = await supabase
      .from("professional_posts")
      .select(`
        id, content, post_type, created_at, attachment_url,
        profiles:author_id(id, full_name, avatar_url, role),
        organizations:organization_id(id, name, logo_url)
      `)
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (postError) {
      throw new Error(postError.message);
    }

    return {
      companies: orgs.candidates.slice(0, 10),
      connections: connections.candidates.slice(0, 10),
      events: events.candidates.slice(0, 10),
      posts: posts || [],
    };
  });
}
