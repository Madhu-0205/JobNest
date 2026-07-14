export const PERMISSIONS = {
  // Job Actions
  JOBS_CREATE: "jobs:create",
  JOBS_VIEW: "jobs:view",
  JOBS_EDIT: "jobs:edit",
  JOBS_DELETE: "jobs:delete",
  JOBS_APPLY: "jobs:apply",

  // Profile Actions
  PROFILES_VIEW: "profiles:view",
  PROFILES_EDIT_OWN: "profiles:edit_own",
  PROFILES_VERIFY: "profiles:verify",

  // Wallet Actions
  WALLET_DEPOSIT: "wallet:deposit",
  WALLET_WITHDRAW: "wallet:withdraw",
  WALLET_VIEW: "wallet:view",

  // Administration Actions
  USERS_MANAGE: "users:manage",
  SYSTEM_SETTINGS: "system:settings",
  AUDIT_VIEW: "audit:view",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export type RoleName =
  | "super_admin"
  | "admin"
  | "moderator"
  | "employer"
  | "worker"
  | "resident"
  | "student"
  | "guest";

/**
 * Static Role-to-Permissions Mapping matrix.
 * Used for fast in-memory authorization fallbacks and static checking.
 */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_DELETE,
    PERMISSIONS.PROFILES_VIEW,
    PERMISSIONS.PROFILES_VERIFY,
    PERMISSIONS.WALLET_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],
  moderator: [
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_DELETE,
    PERMISSIONS.PROFILES_VIEW,
    PERMISSIONS.PROFILES_VERIFY,
  ],
  employer: [
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_EDIT,
    PERMISSIONS.PROFILES_VIEW,
    PERMISSIONS.PROFILES_EDIT_OWN,
    PERMISSIONS.WALLET_DEPOSIT,
    PERMISSIONS.WALLET_VIEW,
  ],
  worker: [
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_APPLY,
    PERMISSIONS.PROFILES_VIEW,
    PERMISSIONS.PROFILES_EDIT_OWN,
    PERMISSIONS.WALLET_WITHDRAW,
    PERMISSIONS.WALLET_VIEW,
  ],
  resident: [
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.PROFILES_VIEW,
    PERMISSIONS.PROFILES_EDIT_OWN,
    PERMISSIONS.WALLET_VIEW,
  ],
  student: [
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_APPLY,
    PERMISSIONS.PROFILES_VIEW,
    PERMISSIONS.PROFILES_EDIT_OWN,
    PERMISSIONS.WALLET_VIEW,
  ],
  guest: [
    PERMISSIONS.JOBS_VIEW,
  ],
};
