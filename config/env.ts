import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Later Phase Variables (Optional in Foundation Phase but validated if present)
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  OLLAMA_API_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(8).optional(),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
    NODE_ENV: process.env["NODE_ENV"],
    DATABASE_URL: process.env["DATABASE_URL"],
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"],
    RAZORPAY_KEY_ID: process.env["RAZORPAY_KEY_ID"],
    RAZORPAY_KEY_SECRET: process.env["RAZORPAY_KEY_SECRET"],
    OLLAMA_API_URL: process.env["OLLAMA_API_URL"],
    NEXTAUTH_SECRET: process.env["NEXTAUTH_SECRET"],
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingKeys = error.issues.map((issue) => issue.path.join(".")).join(", ");
    console.error(`❌ Invalid environment variables: ${missingKeys}`);
    throw new Error(`Environment validation failed. Missing or invalid keys: ${missingKeys}`);
  }
  throw error;
}

export { env };
