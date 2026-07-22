import { createServerClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS, Permission, RoleName } from "./permissions";
import { AuthorizationError } from "../errors";

interface UserRoleQueryResult {
  roles: {
    name: string;
  } | null;
}

/**
 * Enterprise Authorization Guard.
 * Enforces Role-Based Access Control (RBAC) across Server Actions, Layouts, and API routes.
 */
export class AuthorizationGuard {
  /**
   * Asserts that the currently authenticated user possesses the required permission.
   * Throws an AuthorizationError if validation fails.
   * Returns the authenticated user's ID.
   */
  static async assertPermission(permission: Permission): Promise<string> {
    const supabase = await createServerClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new AuthorizationError("Authentication required to access this resource.");
    }

    // Query database user_roles mapping
    const { data: userRoles } = (await supabase
      .from("user_roles")
      .select("roles:roles ( name )")
      .eq("user_id", user.id)) as unknown as { data: UserRoleQueryResult[] | null };

    const roles: RoleName[] = (userRoles || [])
      .map((ur) => ur.roles?.name as RoleName)
      .filter((name): name is RoleName => !!name);

    // Fallback: check JWT metadata roles (e.g. app_metadata or user_metadata) if DB table is unpopulated
    const metadataRole = (user.app_metadata?.["role"] || user.user_metadata?.["role"]) as RoleName | undefined;
    if (metadataRole && !roles.includes(metadataRole)) {
      roles.push(metadataRole);
    }

    // Verify permission mapping match
    const hasPermission = roles.some((role) => {
      const allowed = ROLE_PERMISSIONS[role];
      return allowed && allowed.includes(permission);
    });

    if (!hasPermission) {
      throw new AuthorizationError(`Access denied. Required permission: ${permission}`);
    }

    return user.id;
  }

  /**
   * Asserts that the currently authenticated user possesses the specific role name.
   * Throws an AuthorizationError if validation fails.
   * Returns the authenticated user's ID.
   */
  static async assertRole(role: RoleName): Promise<string> {
    const supabase = await createServerClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new AuthorizationError("Authentication required.");
    }

    const { data: userRoles } = (await supabase
      .from("user_roles")
      .select("roles:roles ( name )")
      .eq("user_id", user.id)) as unknown as { data: UserRoleQueryResult[] | null };

    const roles: RoleName[] = (userRoles || [])
      .map((ur) => ur.roles?.name as RoleName)
      .filter((name): name is RoleName => !!name);

    const metadataRole = (user.app_metadata?.["role"] || user.user_metadata?.["role"]) as RoleName | undefined;
    if (metadataRole && !roles.includes(metadataRole)) {
      roles.push(metadataRole);
    }

    if (!roles.includes(role) && !roles.includes("super_admin")) {
      throw new AuthorizationError(`Access denied. Required role: ${role}`);
    }

    return user.id;
  }
}
