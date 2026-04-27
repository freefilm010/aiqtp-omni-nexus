# Security Review Pipeline — Setup Guide

This project ships with a multi-layer code review and security stack.
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

Results post to the **Security** tab of your GitHub repo.

---

## 🔑 One-time GitHub setup

### 1. Add the GitGuardian API key
1. Sign up at https://dashboard.gitguardian.com/ (free tier: 25 devs)
2. Settings → API → Create API key (`workspace_scan` scope)
3. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `GITGUARDIAN_API_KEY`
   - Value: paste the key

### 2. Enable GitHub Copilot Code Review
1. **Settings → Code & automation → Copilot → Code review**
2. Toggle **Automatic code review by Copilot** → **On**
3. Choose: review every PR (recommended) or only PRs assigned to Copilot

Cost: included with **GitHub Copilot Pro ($10/mo)** or **Business ($19/user/mo)**.

### 3. Enable CodeQL default setup
1. **Settings → Code security & analysis → CodeQL analysis → Set up → Default**
2. This runs alongside the workflow file — no extra cost on public repos.

### 4. Enable Dependabot security updates
1. **Settings → Code security & analysis**
2. Toggle on:
   - **Dependency graph**
   - **Dependabot alerts**
   - **Dependabot security updates**
3. The included `.github/dependabot.yml` will auto-PR weekly minor/patch upgrades.

---

## 🥇 Recommended next layer (paid, optional)

| Tool | Cost | When to add |
|---|---|---|
| **CodeRabbit** | $24/user/mo | Senior-engineer-grade AI PR review. Install: https://github.com/marketplace/coderabbit |
| **Snyk** | Free tier → $25+ | Best-in-class dep + container scan |
| **Halborn audit** | $30–80k | Before OCC charter submission (Q2 2026) |
| **HackerOne bounty** | Pay per finding | Post-launch, signals serious posture to examiners |

---

## 📋 Charter prep (OCC GENIUS Act, June 24 2026)

Examiners will ask for evidence of:
1. ✅ Automated SAST/DAST in CI (Semgrep + CodeQL — covered)
2. ✅ Dependency CVE management (Dependabot + npm audit — covered)
3. ✅ Secret scanning (GitGuardian + Aikido — covered)
4. ⚠️  Independent third-party audit report (NOT yet — schedule with Halborn or Trail of Bits 60 days before submission)
5. ⚠️  Bug bounty program (NOT yet — launch HackerOne 30 days before)
6. ✅ Security incident response policy (`.github/SECURITY.md` — covered)

Keep audit artifacts in `/docs/audits/` once you start receiving them.

---

## 🚨 If a scan finds something

1. **Critical/High** → fix before next deploy. Do not merge the PR.
2. **Medium** → file an internal task, fix within sprint.
3. **Low/Info** → document and review monthly.

All findings auto-close once the offending code is removed and CI re-runs.