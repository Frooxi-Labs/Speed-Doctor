# Contributing to Speed Doctor

Thanks for your interest in improving Speed Doctor! Contributions of every size are welcome — bug fixes, new detectors, docs, design polish or ideas.

## Ways to contribute

- **Report bugs / request features** via [GitHub issues](https://github.com/dev-tanvu/Speed-Doctor/issues/new/choose).
- **Improve detectors** — add or tune rules in `packages/dom-analyzer`.
- **Improve the docs** — the in-app docs live in `apps/web/app/docs`.
- **Polish the UI** and accessibility.
- **Triage issues** and review open pull requests.

## Development setup

Follow the [README](./README.md) to get a working install. In short:

```bash
git clone https://github.com/<your-fork>/Speed-Doctor.git
cd Speed-Doctor
pnpm install
cp .env.example .env     # fill in DATABASE_URL, REDIS_URL
docker compose up -d redis
pnpm --filter @speed-doctor/db exec drizzle-kit push
pnpm dev
```

## Workflow

1. **Fork** the repo and create a branch: `git checkout -b fix/short-description`.
2. **Make a focused change** — one logical change per pull request.
3. **Run the checks** that CI runs:
   ```bash
   pnpm typecheck
   pnpm build
   pnpm lint
   ```
4. **Open a pull request** against `main`. Note that the `main` branch is protected; your PR must pass all CI checks and receive a maintainer review before merging.
5. **Pass CI** (typecheck, build, CodeQL) and respond to review feedback.

> 💡 Planning a large change? Open an issue first to discuss the approach before investing time.

## Coding standards

- **TypeScript, strict mode** — avoid `any`.
- **Prettier** formats the code — run `pnpm format`.
- **Keep packages focused** — detectors, engines and the DB layer stay independent.
- **No secrets in code** — all configuration goes through environment variables.
- **Clear commit messages** — explain the "why", not just the "what".

## Project layout

See the [architecture section of the README](./README.md#-architecture) for what each app and package does.

## Code of Conduct

By participating you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
