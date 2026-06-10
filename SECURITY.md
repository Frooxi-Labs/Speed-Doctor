# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Speed Doctor, **please do not open a public issue.**

Instead, report it privately:

- Use **[GitHub Security Advisories](https://github.com/dev-tanvu/Speed-Doctor/security/advisories/new)** (preferred), or
- Email the maintainer (add your contact here).

Please include steps to reproduce, affected versions/components, and impact. We aim to acknowledge reports within a few days and will keep you updated on the fix.

## Handling secrets

Speed Doctor never stores credentials in source control:

- All secrets (`DATABASE_URL`, `REDIS_URL`, `OPENROUTER_API_KEY`, …) live only in a local, git-ignored `.env`.
- `.env.example` contains **placeholders only** — commit changes there, never to `.env`.
- If you believe a credential was ever committed, **rotate it immediately** and purge it from git history.

## Built-in safeguards

- **SSRF protection** — submitted URLs are validated and private/internal IP ranges (localhost, RFC 1918, link-local, cloud metadata endpoints) are rejected before scanning.
- **Rate limiting** — the audit endpoint is IP rate-limited (`RATE_LIMIT_MAX`, default 10/min).
- **CORS allowlist** — the API only accepts browser requests from origins in `ALLOWED_ORIGINS`.
- **Process isolation** — Lighthouse runs in a separate child process.

## Supported versions

This project is pre-1.0. Security fixes are applied to the latest `main`.
