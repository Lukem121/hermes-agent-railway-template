# Hermes Agent Railway Template

One-click deploy for [Hermes Agent](https://github.com/NousResearch/hermes-agent) on [Railway](https://railway.com), with a built-in web setup page at `/setup` so users do not need shell access.

## How users actually interact with Hermes

Hermes can be used in more than one way:

| Where | What you do |
| ----- | ------------- |
| **Local install** | Run `hermes` in a terminal for the interactive TUI — that is the flow in the [Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart). |
| **This Railway template** | Runs the **messaging gateway** 24/7. You do **not** SSH in to chat. You talk to the agent through **Telegram** (recommended), **Discord**, **Slack**, or the **OpenAI-compatible HTTP API** (`/v1/chat/completions`, etc.) on your public URL. |

So for a typical team deploy: open `/setup`, add an LLM key and Telegram bot token, save, then **open Telegram and message your bot** — that is the main “chat UI.”

Official Telegram reference (BotFather, privacy mode in groups, home channel, voice, troubleshooting): [Telegram setup](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram). Team walkthrough: [Team Telegram assistant](https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant). Overview: [Messaging gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging).

## What this template deploys

- A Dockerized Hermes runtime pinned to a release tag (`HERMES_REF` in `Dockerfile`).
- A wrapper server that starts `hermes gateway run`, serves `/setup`, and proxies API traffic to Hermes’s internal API server.
- Hermes API server (OpenAI-compatible) for health checks and programmatic use.
- Persistent Hermes home at `/data/hermes` (attach a Railway volume here).

## Required Railway setup

1. Create a service from this template.
2. Add a **volume** mounted at `/data/hermes`.
3. Deploy and open **`/setup`** to configure LLM + Telegram (and optional API key).

The provided `railway.toml` configures Docker build, start command, and health check `/setup/healthz`.

## Setup page (no-code)

The UI walks through:

1. **LLM** — e.g. `OPENROUTER_API_KEY` and `LLM_MODEL`.
2. **Telegram** — `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USERS`, optional `TELEGRAM_HOME_CHANNEL` / `TELEGRAM_HOME_CHANNEL_NAME`.
3. **HTTP API** — `API_SERVER_KEY`, `GATEWAY_ALLOW_ALL_USERS`.
4. **Optional** — Discord / Slack.

Values are written to `${HERMES_HOME}/.env` and the gateway is restarted.

## Hermes API usage after deploy

Use your Railway service URL as the base URL:

- Health (wrapper): `GET /setup/healthz`
- Health (Hermes, proxied): `GET /health`
- Models: `GET /v1/models`
- Chat completions: `POST /v1/chat/completions`

Send `Authorization: Bearer <API_SERVER_KEY>` when the key is set.

## Updating Hermes version

The image is pinned by `HERMES_REF` in `Dockerfile`. Change the tag and redeploy to rebuild.

## Notes

- This template targets **gateway + API** usage, not the interactive `hermes` TUI on the server.
- WhatsApp/Signal need extra upstream setup beyond this template.
- Without messaging tokens, Hermes still responds via the **HTTP API** only.
