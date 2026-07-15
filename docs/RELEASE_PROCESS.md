# JobNest V2 — Release Process

Defines how releases are prepared, tagged, and deployed.

---

## Release Types

| Type | When | Example |
|------|------|---------|
| Patch | Bug fix, security patch | `v0.1.1` |
| Minor | New feature, backward-compatible | `v0.2.0` |
| Major | Breaking change, major redesign | `v1.0.0` |

JobNest follows [Semantic Versioning 2.0.0](https://semver.org/).

---

## 1. Prepare the Release

```bash
# Ensure you're on main with a clean working tree
git checkout main
git pull origin main
git status  # should be clean

# Run the full quality gate
npm run lint
npm run typecheck
npm run build

# Run tests against the dev server
npm run test:smoke
npm run security:audit
```

All commands must exit with code `0`.

---

## 2. Bump the Version

```bash
# Patch (bug fix)
npm version patch -m "chore(release): bump to v%s"

# Minor (new feature)
npm version minor -m "chore(release): bump to v%s"

# Major
npm version major -m "chore(release): bump to v%s"
```

This automatically:
1. Updates `package.json` version
2. Creates a Git commit
3. Creates a Git tag (`v0.x.x`)

---

## 3. Push the Release

```bash
# Push commit and tag
git push origin main --tags
```

The GitHub Actions `.github/workflows/release.yml` workflow will automatically:
1. Build the Docker image
2. Tag it with the version and commit SHA
3. Push to the container registry
4. Create a GitHub Release with changelog

---

## 4. Deploy to Production

```bash
# Pull the new image
docker pull ghcr.io/your-org/jobnest:v0.x.x

# Update docker-compose.prod.yml image tag
# image: ghcr.io/your-org/jobnest:v0.x.x

# Run migrations before deploying
DATABASE_URL=... npm run db:migrate

# Rolling restart
npm run docker:prod
```

Verify with:

```bash
npm run health:check
TEST_BASE_URL=https://yourdomain.com npm run test:smoke
```

---

## 5. Rollback

If the deployment is bad:

```bash
# Stop the current app container
docker compose -f docker/docker-compose.prod.yml stop app

# Restore previous image tag in docker-compose.prod.yml
# image: ghcr.io/your-org/jobnest:v0.x.x-previous

# Restart
docker compose -f docker/docker-compose.prod.yml up -d app

# Verify
npm run health:check
```

For database rollback, see [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md).

---

## 6. Hotfix Process

```bash
# Create hotfix branch
git checkout -b hotfix/critical-auth-bug

# Fix the bug
# ...

# Merge back to main
git checkout main
git merge --no-ff hotfix/critical-auth-bug

# Release as patch
npm version patch -m "fix(auth): resolve critical session bug"
git push origin main --tags
```

---

## 7. Commit Convention

JobNest uses [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Type | Example |
|--------|------|---------|
| `feat:` | New feature | `feat(jobs): add job draft saving` |
| `fix:` | Bug fix | `fix(auth): resolve session expiry` |
| `chore:` | Build / tooling | `chore(deps): upgrade Next.js 16.3` |
| `docs:` | Documentation | `docs: update DEPLOYMENT.md` |
| `perf:` | Performance | `perf(cache): add Redis adapter` |
| `security:` | Security fix | `security(csp): tighten script-src` |
| `BREAKING CHANGE:` | Major change | In commit body |

Enforced by `commitlint` + `husky` in the pre-commit hook.

---

## Related Docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
