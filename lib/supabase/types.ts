
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // matches auth.users.id
          display_name: string;
          username: string;
          avatar_url: string | null;
          email: string;
          phone: string | null;
          locale: string;
          timezone: string;
          status: "active" | "suspended" | "deleted";
          verification_status: "unverified" | "pending" | "verified";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      roles: {
        Row: {
          id: string;
          name: string; // e.g. super_admin, admin, moderator, employer, worker, resident, student
          description: string | null;
          created_at: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          name: string; // e.g. jobs:create, jobs:delete, users:suspend, etc.
          description: string | null;
          created_at: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          created_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          timestamp: string;
          actor_id: string | null; // references auth.users.id
          action: string; // e.g. auth:signup, profile:update
          resource: string; // e.g. profiles, roles
          old_value: unknown | null;
          new_value: unknown | null;
          ip_address: string | null;
          user_agent: string | null;
          correlation_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          ip_address: string | null;
          user_agent: string | null;
          device_id: string | null;
          is_revoked: boolean;
          expires_at: string;
          created_at: string;
        };
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          device_name: string;
          device_type: string | null;
          os: string | null;
          browser: string | null;
          created_at: string;
          last_active_at: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: "dark" | "light" | "system";
          notifications_email: boolean;
          notifications_push: boolean;
          notifications_sms: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
export type UserPreferenceRow = Database["public"]["Tables"]["user_preferences"]["Row"];
