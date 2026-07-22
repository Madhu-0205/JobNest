function auditEnv() {
  // Only enforce strict checks in production CI/CD builds
  if (process.env.NODE_ENV !== "production") {
    console.info("ℹ️ Skipping strict environment audit (NODE_ENV !== production)");
    return;
  }

  console.info("🔒 Running production environment audit...");

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "METRICS_SECRET"
  ];

  const mockPatterns = [
    "your-",
    "example",
    "test_",
    "YOUR_"
  ];

  const errors = [];

  for (const v of requiredVars) {
    const val = process.env[v];
    if (!val) {
      errors.push(`❌ Missing required secret: ${v}`);
      continue;
    }

    const lowerVal = val.toLowerCase();
    for (const pattern of mockPatterns) {
      if (lowerVal.includes(pattern)) {
        errors.push(`❌ Secret ${v} contains mock/placeholder value: "${val}"`);
        break;
      }
    }
  }

  // Check metrics secret length
  if (process.env.METRICS_SECRET && process.env.METRICS_SECRET.length < 32) {
    if (!process.env.METRICS_SECRET.toLowerCase().includes("your-")) {
      errors.push("❌ METRICS_SECRET is too short. Must be at least 32 characters.");
    }
  }

  if (errors.length > 0) {
    console.error("\n🚨 Production Environment Audit Failed 🚨");
    errors.forEach(e => console.error(e));
    console.error("\nPlease configure these variables in your Vercel Project Settings before deploying.");
    process.exit(1);
  }

  console.info("✅ Production environment audit passed.");
}

auditEnv();
