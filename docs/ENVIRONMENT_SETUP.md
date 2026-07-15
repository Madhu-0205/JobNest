# JobNest V2 — Environment Setup Guide

Step-by-step guide for setting up a development or production environment.

---

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/jobnest.git
cd jobnest

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Fill in required variables (see below)
# Edit .env.local with your values

# 5. Validate environment
npm run validate:env

# 6. Run database migrations
npm run db:migrate

# 7. Start the dev server
npm run dev
```

---

## Environment Variables — Field by Field

### Supabase (Required)

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project → API → URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project → API → service_role |

> **⚠️ Warning:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
> Only use it in server-side code.

### Setting Up a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for provisioning (1–2 minutes)
3. Go to **Settings → API** to find your URL and keys
4. Go to **Settings → Database** for the connection string

---

### AI Intelligence (Optional)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini (primary AI provider) |
| `OPENAI_API_KEY` | OpenAI (fallback provider) |
| `AI_PROVIDER` | `gemini` \| `openai` \| `mock` |

Get a Gemini API key at [aistudio.google.com](https://aistudio.google.com/).

Without AI keys, the platform runs with `AI_PROVIDER=mock` and returns placeholder responses.

---

### Razorpay (Optional)

| Variable | Purpose |
|----------|---------|
| `RAZORPAY_KEY_ID` | Public key for client-side payment initialization |
| `RAZORPAY_KEY_SECRET` | Private key for server-side order creation |
| `RAZORPAY_WEBHOOK_SECRET` | For verifying payment webhooks |

Use `rzp_test_*` keys in development. Never commit live keys.

---

### Upstash Redis (Optional)

Enables production-grade caching. Without it, the platform uses in-memory LRU.

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token to your environment

---

### Observability (Optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOG_LEVEL` | `info` | Logging verbosity |
| `METRICS_SECRET` | — | Required in production to access `/api/metrics` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | — | OpenTelemetry collector URL |

---

## Production Environment

Production environments must be configured with secrets management:

### Option A: Docker environment file

```bash
# Create a secure env file (not in Git)
cp .env.example /etc/jobnest/env.prod

# Reference it in docker-compose.prod.yml
env_file:
  - /etc/jobnest/env.prod
```

### Option B: Cloud secrets manager

```bash
# AWS Secrets Manager example
aws secretsmanager create-secret \
  --name jobnest/production \
  --secret-string file://.env.local

# Inject at container startup via ECS task definition
```

---

## Validating Your Environment

```bash
# Check that all required vars are present
npm run validate:env

# Output on success:
✅ Env OK

# Output on failure:
❌ Environment validation failed:
  • NEXT_PUBLIC_SUPABASE_URL: Required
  • SUPABASE_SERVICE_ROLE_KEY: Too short
```

---

## Troubleshooting

### "Cannot connect to database"

1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct (no trailing slash)
2. Check your IP is not blocked by Supabase network restrictions
3. Try: `curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/ -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"`

### "AI features not working"

1. Check `GEMINI_API_KEY` is set
2. Verify the key is active: `curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"`
3. Set `AI_PROVIDER=mock` to disable AI and test without it

### "Payments failing"

1. Confirm you're using `rzp_test_*` keys in development
2. Check Razorpay dashboard for API errors
3. Verify `RAZORPAY_WEBHOOK_SECRET` matches your webhook configuration

---

## Related Docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
