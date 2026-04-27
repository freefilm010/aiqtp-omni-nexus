# Security Policy

## Reporting a Vulnerability

AIQTP™ takes security seriously. If you discover a vulnerability:

1. **Do NOT open a public GitHub issue.**
2. Email `1drrey@gmail.com` with subject `[SECURITY] <short description>`.
3. Include: reproduction steps, affected component, suggested impact rating (low/medium/high/critical).
4. We will acknowledge within 48 hours and aim to patch critical issues within 7 days.

## Scope

- `aiqtp.com`, `www.aiqtp.com`, `aiqtp.lovable.app`
- All Supabase Edge Functions in this repository
- All client-side React code in `/src`
- All database RLS policies (SQL in `/supabase/migrations`)

## Out of Scope

- Third-party services (Stripe, Supabase platform, IBM Quantum, BTCC) — report directly to the vendor
- Findings requiring physical access or social engineering
- Denial-of-service via brute force on rate-limited endpoints

## Security Measures Currently in Place

- Row-Level Security (RLS) on all user-facing tables
- Server-side admin role enforcement (`has_role()` security-definer function)
- Stripe routed through Lovable connector gateway (no raw secret keys in code)
- Automated CI scans: Semgrep, CodeQL, GitGuardian, npm audit, Aikido
- Workspace-level Aikido scanning across all Lovable projects
- Authentication: email/password + Google OAuth, 2FA required for admins
- Anonymous signups disabled; email verification mandatory

## Bug Bounty

No formal bounty program yet. We may issue discretionary rewards for high-impact findings.

## Compliance

This platform is being prepared for the OCC GENIUS Act crypto charter (target: June 24, 2026).
Audit reports and remediation evidence are tracked privately for examiner review.