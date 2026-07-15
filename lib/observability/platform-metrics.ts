/**
 * Platform Semantic Metric Names
 *
 * Centralized metric name registry for all JobNest platform domains.
 * All metric names follow the OpenTelemetry semantic conventions format:
 *   {service}.{domain}.{noun}_{unit}
 *
 * Integration targets:
 * - Prometheus: via /api/metrics endpoint
 * - Grafana: pre-built dashboards keyed to these names
 * - Datadog / CloudWatch: via metric forwarding adapters
 */

export const METRIC_NAMES = {
  // ── HTTP / API ─────────────────────────────────────────────────
  API_REQUEST_TOTAL: "jobnest.api.request_total",
  API_REQUEST_DURATION_MS: "jobnest.api.request_duration_ms",
  API_ERROR_TOTAL: "jobnest.api.error_total",
  API_RATE_LIMIT_HIT: "jobnest.api.rate_limit_hit_total",

  // ── Authentication ──────────────────────────────────────────────
  AUTH_LOGIN_TOTAL: "jobnest.auth.login_total",
  AUTH_LOGIN_FAILURE_TOTAL: "jobnest.auth.login_failure_total",
  AUTH_SESSION_CREATED: "jobnest.auth.session_created_total",
  AUTH_SESSION_EXPIRED: "jobnest.auth.session_expired_total",
  AUTH_MFA_ATTEMPT: "jobnest.auth.mfa_attempt_total",

  // ── Opportunities ───────────────────────────────────────────────
  OPPORTUNITY_CREATED: "jobnest.opportunity.created_total",
  OPPORTUNITY_APPLIED: "jobnest.opportunity.application_total",
  OPPORTUNITY_HIRED: "jobnest.opportunity.hire_total",
  OPPORTUNITY_COMPLETED: "jobnest.opportunity.completed_total",
  OPPORTUNITY_CANCELLED: "jobnest.opportunity.cancelled_total",
  OPPORTUNITY_CONVERSION_RATE: "jobnest.opportunity.hire_conversion_rate",

  // ── Payments & Financial ────────────────────────────────────────
  PAYMENT_INITIATED: "jobnest.payment.initiated_total",
  PAYMENT_COMPLETED: "jobnest.payment.completed_total",
  PAYMENT_FAILED: "jobnest.payment.failed_total",
  PAYMENT_AMOUNT_INR: "jobnest.payment.amount_inr",
  WALLET_BALANCE_TOTAL_INR: "jobnest.wallet.balance_total_inr",
  ESCROW_CREATED: "jobnest.escrow.created_total",
  ESCROW_RELEASED: "jobnest.escrow.released_total",
  ESCROW_DISPUTED: "jobnest.escrow.disputed_total",

  // ── AI / Intelligence ───────────────────────────────────────────
  AI_INFERENCE_TOTAL: "jobnest.ai.inference_total",
  AI_INFERENCE_DURATION_MS: "jobnest.ai.inference_duration_ms",
  AI_INFERENCE_FAILURE: "jobnest.ai.inference_failure_total",
  AI_EMBEDDING_TOTAL: "jobnest.ai.embedding_total",
  AI_CACHE_HIT: "jobnest.ai.cache_hit_total",
  AI_CACHE_MISS: "jobnest.ai.cache_miss_total",
  AI_RECOMMENDATION_SERVED: "jobnest.ai.recommendation_served_total",
  AI_RECOMMENDATION_ACCEPTED: "jobnest.ai.recommendation_accepted_total",

  // ── Realtime ────────────────────────────────────────────────────
  REALTIME_CONNECTIONS_ACTIVE: "jobnest.realtime.connections_active",
  REALTIME_MESSAGE_SENT: "jobnest.realtime.message_sent_total",
  REALTIME_PRESENCE_UPDATES: "jobnest.realtime.presence_update_total",
  REALTIME_TRACKING_EVENTS: "jobnest.realtime.tracking_event_total",

  // ── Trust & Safety ──────────────────────────────────────────────
  TRUST_SCORE_COMPUTED: "jobnest.trust.score_computed_total",
  TRUST_KYC_INITIATED: "jobnest.trust.kyc_initiated_total",
  TRUST_KYC_VERIFIED: "jobnest.trust.kyc_verified_total",
  TRUST_REVIEW_CREATED: "jobnest.trust.review_created_total",
  TRUST_DISPUTE_OPENED: "jobnest.trust.dispute_opened_total",
  TRUST_DISPUTE_RESOLVED: "jobnest.trust.dispute_resolved_total",

  // ── Fraud ───────────────────────────────────────────────────────
  FRAUD_ALERT_RAISED: "jobnest.fraud.alert_raised_total",
  FRAUD_ACCOUNT_SUSPENDED: "jobnest.fraud.account_suspended_total",
  FRAUD_PATTERN_DETECTED: "jobnest.fraud.pattern_detected_total",

  // ── Geospatial ──────────────────────────────────────────────────
  GEO_SEARCH_TOTAL: "jobnest.geo.search_total",
  GEO_SEARCH_DURATION_MS: "jobnest.geo.search_duration_ms",
  GEO_LOCATION_UPDATE: "jobnest.geo.location_update_total",
  GEO_GEOFENCE_TRIGGER: "jobnest.geo.geofence_trigger_total",

  // ── Support & Operations ────────────────────────────────────────
  SUPPORT_TICKET_CREATED: "jobnest.support.ticket_created_total",
  SUPPORT_TICKET_SLA_BREACH: "jobnest.support.ticket_sla_breach_total",
  SUPPORT_TICKET_RESOLVED: "jobnest.support.ticket_resolved_total",
  MODERATION_ACTION_TAKEN: "jobnest.moderation.action_taken_total",

  // ── System Health ───────────────────────────────────────────────
  DB_QUERY_DURATION_MS: "jobnest.db.query_duration_ms",
  DB_POOL_SIZE_ACTIVE: "jobnest.db.pool_size_active",
  CACHE_HIT_RATE: "jobnest.cache.hit_rate",
  BUILD_INFO: "jobnest.build_info",
} as const;

export type MetricName = typeof METRIC_NAMES[keyof typeof METRIC_NAMES];

/**
 * Standard metric tag keys (label names for Prometheus).
 */
export const METRIC_TAGS = {
  ROUTE: "route",
  METHOD: "method",
  STATUS: "status",
  PROVIDER: "provider",
  ROLE: "role",
  LOCALE: "locale",
  REGION: "region",
  VERSION: "version",
  ENV: "env",
} as const;

/**
 * Prometheus metric type declarations for use in /api/metrics.
 */
export const METRIC_TYPES: Record<string, "counter" | "gauge" | "histogram"> = {
  [METRIC_NAMES.API_REQUEST_TOTAL]: "counter",
  [METRIC_NAMES.API_REQUEST_DURATION_MS]: "histogram",
  [METRIC_NAMES.API_ERROR_TOTAL]: "counter",
  [METRIC_NAMES.PAYMENT_AMOUNT_INR]: "counter",
  [METRIC_NAMES.WALLET_BALANCE_TOTAL_INR]: "gauge",
  [METRIC_NAMES.REALTIME_CONNECTIONS_ACTIVE]: "gauge",
  [METRIC_NAMES.AI_INFERENCE_DURATION_MS]: "histogram",
  [METRIC_NAMES.DB_QUERY_DURATION_MS]: "histogram",
  [METRIC_NAMES.BUILD_INFO]: "gauge",
};
