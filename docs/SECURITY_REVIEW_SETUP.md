# Security Review Pipeline — Setup Guide

This project ships with a **9-tool, $0/mo** code review and security stack.
Most layers are automatic. A few require one-time activation in GitHub.

---

## ✅ Already active

| Tool | What it does | Where to view results |
|---|---|---|
| **Aikido** | Workspace-wide vulnerability + secret scan across all Lovable projects | Lovable → Project → **Security** tab |
| **Lovable security linter** | Database RLS, auth config, exposed-data checks | Same Security tab |

---

## 🔧 Active after first push to GitHub

These run on every push and PR via `.github/workflows/security-scan.yml`:

| Job | Tool | What it catches |
|---|---|---|
| `semgrep` | Semgrep CI | OWASP Top 10, JS/TS/React anti-patterns, hard-coded secrets, supply-chain risks |
| `codeql` | GitHub native | Deep SAST — taint flow, injection, auth bypass |
| `npm-audit` | bun audit | Known CVEs in dependencies (high+ only) |
| `gitguardian` | ggshield | 350+ secret types in commits, history, and diffs |
| `trivy` | Aqua Trivy | SBOM, IaC misconfigs, container & filesystem CVEs |
| `osv-scanner` | Google OSV | Multi-ecosystem CVE database (npm, Deno, GitHub Actions) |
| `scorecard` | OSSF Scorecard | Repo security posture score (0–10) — **OCC charter evidence** |
| `qodo-merge` | Qodo Merge (PR-Agent) | AI-powered PR review (free, OSS alternative to CodeRabbit Pro) |

Results post to the **Security** tab of your GitHub repo.

---

## 🔑 One-time GitHub setup

### 1. Add the GitGuardian API key
1. Sign up at https://dashboard.gitguardian.com/ (free tier: 25 devs)
2. Settings → API → Create API key (`workspace_scan` scope)
3. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `GITGUARDIAN_API_KEY`
   - Value: paste the key

### 2. (Optional) Enable AI PR review via Qodo Merge
Qodo Merge is already wired into the workflow. To activate AI reviews:
1. Get a free OpenAI API key (or any compatible: Anthropic, Gemini, Lovable AI)
2. **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `OPENAI_API_KEY`
   - Value: your key
3. Reviews auto-post on every PR. Without the key, Qodo job will skip silently.

**Free alternative**: Install [CodeRabbit Free](https://github.com/marketplace/coderabbit) — `.coderabbit.yaml` is pre-tuned for AIQTP.

### 3. Enable CodeQL default setup
1. **Settings → Code security & analysis → CodeQL analysis → Set up → Default**
2. This runs alongside the workflow file — no extra cost on public repos.

### 4. Enable Dependabot OR install Renovate (recommended)

**Option A — Dependabot (already configured):**
1. **Settings → Code security & analysis**
2. Toggle on:
   - **Dependency graph**
   - **Dependabot alerts**
   - **Dependabot security updates**

**Option B — Renovate (better, also free):**
1. Install: https://github.com/apps/renovate
2. `renovate.json` is pre-configured: groups updates, OSV alerts, weekly schedule
3. Replaces Dependabot with smarter grouping and Deno support

### 5. Enable OSSF Scorecard public reporting (optional, charter-friendly)
1. **Settings → Code security and analysis → Scorecard** → enable
2. Public Scorecard score appears at https://securityscorecards.dev/viewer/?uri=github.com/<org>/<repo>
3. Examiners can verify your security posture without NDAs

---

## 🥇 Optional paid upgrades

| Tool | Cost | When to add |
|---|---|---|
| **CodeRabbit Pro** | $24/user/mo | Senior-engineer AI review with sequence diagrams (Qodo Merge covers most of this for free) |
| **GitHub Copilot Pro** | $10/mo | Native GitHub PR review + IDE assistance |
| **Snyk** | Free tier → $25+ | Best-in-class dep + container scan |
| **Halborn audit** | $30–80k | Before OCC charter submission (Q2 2026) |
| **HackerOne bounty** | Pay per finding | Post-launch, signals serious posture to examiners |

---

## 📋 Charter prep (OCC GENIUS Act, June 24 2026)

Examiners will ask for evidence of:
1. ✅ Automated SAST in CI (Semgrep + CodeQL + Trivy — covered)
2. ✅ Dependency CVE management (bun audit + OSV-Scanner + Renovate/Dependabot — covered)
3. ✅ Secret scanning (GitGuardian + Aikido — covered)
4. ✅ Supply chain integrity (Trivy SBOM + OSV — covered)
5. ✅ IaC misconfiguration scanning (Trivy config — covered)
6. ✅ Public security posture score (OSSF Scorecard — covered)
7. ✅ AI-assisted code review (Qodo Merge — covered)
8. ⚠️  Independent third-party audit report (NOT yet — schedule with Halborn or Trail of Bits 60 days before submission)
9. ⚠️  Bug bounty program (NOT yet — launch HackerOne 30 days before)
10. ✅ Security incident response policy (`.github/SECURITY.md` — covered)

Keep audit artifacts in `/docs/audits/` once you start receiving them.

---

## 🚨 If a scan finds something

1. **Critical/High** → fix before next deploy. Do not merge the PR.
2. **Medium** → file an internal task, fix within sprint.
3. **Low/Info** → document and review monthly.

All findings auto-close once the offending code is removed and CI re-runs.