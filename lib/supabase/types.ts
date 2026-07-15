
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
      route_segments: {
        Row: {
          id: string;
          route_id: string;
          segment_index: number;
          distance_meters: number;
          duration_seconds: number;
          instruction: string | null;
          street_name: string | null;
          geom: unknown | null;
          created_at: string;
        };
      };
      travel_estimates: {
        Row: {
          id: string;
          user_id: string | null;
          start_latitude: number;
          start_longitude: number;
          end_latitude: number;
          end_longitude: number;
          travel_mode: string;
          distance_meters: number;
          duration_seconds: number;
          eta_time: string;
          departure_time: string | null;
          arrival_time: string | null;
          traffic_factor: number;
          created_at: string;
        };
      };
      service_areas: {
        Row: {
          id: string;
          user_id: string;
          radius_meters: number;
          center_geom: unknown;
          boundary_polygon: unknown | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      coverage_zones: {
        Row: {
          id: string;
          zone_code: string;
          name: string;
          zone_type: string;
          boundary: unknown;
          created_at: string;
          updated_at: string;
        };
      };
      saved_locations: {
        Row: {
          id: string;
          user_id: string;
          location_id: string;
          label: string;
          created_at: string;
          updated_at: string;
        };
      };
      chat_rooms: {
        Row: {
          id: string;
          created_at: string;
          opportunity_id: string | null;
          employer_id: string;
          worker_id: string;
          metadata: Record<string, unknown>;
        };
        Insert: Omit<Database["public"]["Tables"]["chat_rooms"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["chat_rooms"]["Row"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          created_at: string;
          room_id: string;
          sender_id: string;
          message_type: string;
          content: string | null;
          attachment_url: string | null;
          location_lat: number | null;
          location_lon: number | null;
          delivery_status: string;
          delivered_at: string | null;
          read_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["chat_messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
      };
      live_tracking: {
        Row: {
          id: string;
          user_id: string;
          updated_at: string;
          latitude: number;
          longitude: number;
          speed: number | null;
          heading: number | null;
          accuracy: number | null;
          status: string;
          last_seen: string;
        };
        Insert: Omit<Database["public"]["Tables"]["live_tracking"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["live_tracking"]["Row"]>;
      };
      realtime_events_queue: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          event_type: string;
          payload: Record<string, unknown>;
          status: string;
          attempts: number;
          error_message: string | null;
          client_timestamp: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["realtime_events_queue"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["realtime_events_queue"]["Row"]>;
      };
      realtime_audit_logs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          event_type: string;
          payload: Record<string, unknown>;
        };
        Insert: Omit<Database["public"]["Tables"]["realtime_audit_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["realtime_audit_logs"]["Row"]>;
      };
      trust_scores: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          factors: Record<string, unknown>;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trust_scores"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["trust_scores"]["Row"]>;
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["verification_requests"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["verification_requests"]["Row"]>;
      };
      verification_documents: {
        Row: {
          id: string;
          request_id: string;
          document_type: string;
          document_number: string | null;
          file_url: string;
          expiry_date: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["verification_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["verification_documents"]["Row"]>;
      };
      verification_history: {
        Row: {
          id: string;
          request_id: string;
          user_id: string;
          status: string;
          changed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["verification_history"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["verification_history"]["Row"]>;
      };
      business_verifications: {
        Row: {
          id: string;
          user_id: string;
          gst_number: string | null;
          registration_number: string | null;
          business_name: string;
          business_address: string;
          authorized_contact: string;
          business_category: string;
          status: string;
          verification_request_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["business_verifications"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["business_verifications"]["Row"]>;
      };
      ratings: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewee_id: string;
          opportunity_id: string | null;
          score: number;
          category_scores: Record<string, unknown>;
          rating_type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ratings"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["ratings"]["Row"]>;
      };
      reviews: {
        Row: {
          id: string;
          opportunity_id: string | null;
          reviewer_id: string;
          reviewee_id: string;
          rating_id: string | null;
          review_text: string;
          is_verified: boolean;
          status: string;
          attachments: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
      review_replies: {
        Row: {
          id: string;
          review_id: string;
          replier_id: string;
          reply_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["review_replies"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["review_replies"]["Row"]>;
      };
      badges: {
        Row: {
          id: string;
          code: string;
          name: Record<string, unknown>;
          description: Record<string, unknown>;
          icon_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["badges"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["badges"]["Row"]>;
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          granted_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_badges"]["Row"], "id" | "granted_at">;
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Row"]>;
      };
      report_evidence: {
        Row: {
          id: string;
          report_id: string;
          file_url: string;
          file_type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["report_evidence"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["report_evidence"]["Row"]>;
      };
      incidents: {
        Row: {
          id: string;
          user_id: string;
          opportunity_id: string | null;
          type: string;
          status: string;
          latitude: number | null;
          longitude: number | null;
          timeline: Record<string, unknown>[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["incidents"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["incidents"]["Row"]>;
      };
      trusted_contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_name: string;
          contact_phone: string;
          contact_email: string | null;
          is_emergency_sos: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trusted_contacts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["trusted_contacts"]["Row"]>;
      };
      blocked_users: {
        Row: {
          id: string;
          user_id: string;
          blocked_user_id: string;
          type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["blocked_users"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["blocked_users"]["Row"]>;
      };
      disputes: {
        Row: {
          id: string;
          opportunity_id: string;
          initiator_id: string;
          respondent_id: string;
          reason: string;
          description: string;
          status: string;
          mediator_id: string | null;
          resolution_details: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["disputes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["disputes"]["Row"]>;
      };
      dispute_messages: {
        Row: {
          id: string;
          dispute_id: string;
          sender_id: string;
          message_text: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["dispute_messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["dispute_messages"]["Row"]>;
      };
      dispute_evidence: {
        Row: {
          id: string;
          dispute_id: string;
          uploaded_by: string;
          file_url: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["dispute_evidence"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["dispute_evidence"]["Row"]>;
      };
      moderation_actions: {
        Row: {
          id: string;
          moderator_id: string | null;
          target_user_id: string | null;
          action_type: string;
          reason: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["moderation_actions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["moderation_actions"]["Row"]>;
      };
      fraud_signals: {
        Row: {
          id: string;
          user_id: string | null;
          signal_type: string;
          score: number;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fraud_signals"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["fraud_signals"]["Row"]>;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          pending_balance: number;
          locked_balance: number;
          currency: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["wallets"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["wallets"]["Row"]>;
      };
      wallet_transactions: {
        Row: {
          id: string;
          wallet_id: string;
          amount: number;
          type: string;
          category: string;
          reference_id: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["wallet_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["wallet_transactions"]["Row"]>;
      };
      ledger_entries: {
        Row: {
          id: string;
          account_id: string | null;
          amount: number;
          type: string;
          transaction_id: string;
          reference_type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ledger_entries"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["ledger_entries"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          gateway: string;
          gateway_payment_id: string | null;
          gateway_order_id: string | null;
          status: string;
          idempotency_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      escrows: {
        Row: {
          id: string;
          opportunity_id: string;
          payer_id: string;
          payee_id: string;
          amount: number;
          commission_amount: number;
          status: string;
          released_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["escrows"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["escrows"]["Row"]>;
      };
      refunds: {
        Row: {
          id: string;
          payment_id: string;
          escrow_id: string | null;
          amount: number;
          reason: string;
          status: string;
          gateway_refund_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["refunds"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["refunds"]["Row"]>;
      };
      payouts: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          method: string;
          destination: string;
          status: string;
          gateway_payout_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payouts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payouts"]["Row"]>;
      };
      commissions: {
        Row: {
          id: string;
          escrow_id: string | null;
          opportunity_id: string | null;
          amount: number;
          rate: number;
          type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["commissions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["commissions"]["Row"]>;
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          invoice_number: string;
          invoice_type: string;
          amount: number;
          tax_amount: number;
          status: string;
          gstin: string | null;
          billing_details: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          tax_rate: number;
        };
        Insert: Omit<Database["public"]["Tables"]["invoice_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]>;
      };
      tax_records: {
        Row: {
          id: string;
          invoice_id: string;
          tax_type: string;
          rate: number;
          amount: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tax_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tax_records"]["Row"]>;
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: string;
          value: number;
          max_discount: number | null;
          min_spend: number;
          starts_at: string;
          expires_at: string;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["coupons"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["coupons"]["Row"]>;
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["referrals"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["referrals"]["Row"]>;
      };
      reward_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reward_type: string;
          wallet_transaction_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reward_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reward_transactions"]["Row"]>;
      };
      embeddings: {
        Row: {
          id: string;
          reference_type: string;
          reference_id: string;
          embedding: number[];
          content: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["embeddings"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["embeddings"]["Row"]>;
      };
      ai_logs: {
        Row: {
          id: string;
          user_id: string | null;
          provider: string;
          model: string;
          task: string;
          input_tokens: number;
          output_tokens: number;
          latency_ms: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["ai_logs"]["Row"]>;
      };
      recommendations: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          results: Record<string, unknown>[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["recommendations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Row"]>;
      };
      semantic_cache: {
        Row: {
          id: string;
          query_text: string;
          results: Record<string, unknown>[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["semantic_cache"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["semantic_cache"]["Row"]>;
      };
      ranking_cache: {
        Row: {
          id: string;
          user_id: string;
          results: Record<string, unknown>[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ranking_cache"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["ranking_cache"]["Row"]>;
      };
      support_tickets: {
        Row: {
          id: string;
          requester_id: string | null;
          assigned_to: string | null;
          subject: string;
          category: string;
          priority: string;
          status: string;
          sla_deadline_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["support_tickets"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string | null;
          message: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["support_messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["support_messages"]["Row"]>;
      };
      moderation_queue: {
        Row: {
          id: string;
          content_type: string;
          content_id: string;
          reported_by: string | null;
          assigned_to: string | null;
          reason: string | null;
          status: string;
          priority: string;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["moderation_queue"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["moderation_queue"]["Row"]>;
      };
      moderation_notes: {
        Row: {
          id: string;
          queue_item_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["moderation_notes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["moderation_notes"]["Row"]>;
      };
      fraud_cases: {
        Row: {
          id: string;
          suspect_id: string | null;
          investigator_id: string | null;
          title: string;
          description: string | null;
          severity: string;
          status: string;
          outcome: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fraud_cases"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["fraud_cases"]["Row"]>;
      };
      fraud_case_events: {
        Row: {
          id: string;
          fraud_case_id: string;
          actor_id: string | null;
          event_type: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fraud_case_events"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["fraud_case_events"]["Row"]>;
      };
      analytics_snapshots: {
        Row: {
          id: string;
          snapshot_type: string;
          metrics: Record<string, unknown>;
          snapshot_date: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["analytics_snapshots"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["analytics_snapshots"]["Row"]>;
      };
      business_metrics: {
        Row: {
          id: string;
          metric_name: string;
          metric_value: number;
          dimension: string | null;
          period_start: string;
          period_end: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["business_metrics"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["business_metrics"]["Row"]>;
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: Record<string, unknown>;
          description: string | null;
          category: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["system_settings"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["system_settings"]["Row"]>;
      };
      feature_flag_overrides: {
        Row: {
          id: string;
          flag_key: string;
          target_type: string;
          target_id: string | null;
          is_enabled: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["feature_flag_overrides"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["feature_flag_overrides"]["Row"]>;
      };
      system_notifications: {
        Row: {
          id: string;
          target_user_id: string | null;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["system_notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["system_notifications"]["Row"]>;
      };
      report_exports: {
        Row: {
          id: string;
          requested_by: string | null;
          report_type: string;
          parameters: Record<string, unknown>;
          status: string;
          file_url: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["report_exports"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["report_exports"]["Row"]>;
      };
    };
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
export type UserPreferenceRow = Database["public"]["Tables"]["user_preferences"]["Row"];
