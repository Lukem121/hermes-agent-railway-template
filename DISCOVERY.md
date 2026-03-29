# Hermes Deployment Discovery Notes

This file captures the design findings used to build this Railway template.

## 1) Runtime mode selection

Hermes supports:

- `hermes` (interactive local CLI/TUI)
- `hermes gateway ...` (long-running multi-platform process)

Railway is better suited to gateway mode. For no-code onboarding, this template wraps gateway mode in an HTTP setup shell:

- wrapper process: Node/Express on public Railway port
- child process: `hermes gateway run --replace`
- wrapper proxy: forwards non-setup requests to Hermes API server

## 2) Platform activation behavior (important)

Gateway platform connections are env-driven. In Hermes internals (`gateway/config.py`), platform config is auto-enabled when relevant env variables exist.

Examples:

- `TELEGRAM_BOT_TOKEN` enables Telegram
- `DISCORD_BOT_TOKEN` enables Discord
- `SLACK_BOT_TOKEN` enables Slack
- `API_SERVER_ENABLED=true` (or `API_SERVER_KEY`) enables API Server
- `WEBHOOK_ENABLED=true` enables Webhook adapter

This is ideal for Railway because users can enable integrations by setting service variables only.

## 3) Startup failure conditions

Gateway startup fails if platforms are configured but all fail to connect. It logs startup failure reasons and exits non-zero.

To avoid "no connected platform" failure in a fresh one-click deploy, this template enables API Server mode for the child Hermes process by default.

## 4) API Server fit for Railway

Hermes API server adapter exposes:

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Default host is `127.0.0.1`, so wrapper-to-child architecture is used:

- wrapper listens on Railway public `PORT`
- Hermes child binds API server to `127.0.0.1:8642`
- wrapper proxies incoming API traffic

## 5) Auth and security defaults

If `API_SERVER_KEY` is missing, API server allows unauthenticated requests by design. For public cloud deployment this is unsafe.

Template default therefore includes:

- `API_SERVER_KEY` (set through `/setup` UI or Railway variables)
- `GATEWAY_ALLOW_ALL_USERS=false`

This keeps API and messaging access explicit.

## 6) Persistence requirements

Hermes persists state under `HERMES_HOME` (sessions, memories, logs, skills, etc.).
For Railway, persistence should be a mounted volume:

- `HERMES_HOME=/data/hermes`
- Railway volume mount path: `/data/hermes`

Without volume persistence, sessions/memory/config are lost on redeploy.

## 7) Build/dependency choices

The template builds Hermes from upstream source pinned to `HERMES_REF` and installs Python package extras needed for gateway-centric use:

- `messaging`, `cron`, `mcp`, `pty`, `honcho`

Node/npm are installed both for Hermes components and for the setup wrapper server.

## 8) User-facing interaction model (Railway)

On a laptop, users often run `hermes` (TUI) per the [Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart).

On Railway, this template runs the gateway continuously. Primary interaction paths:

- **Telegram** (or Discord/Slack) after tokens are set — see [Team Telegram assistant](https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant).
- **HTTP API** for apps and automation — same public URL, `/v1/*` behind optional `API_SERVER_KEY`.

The `/setup` page is optimized for LLM + Telegram configuration without shell access.

