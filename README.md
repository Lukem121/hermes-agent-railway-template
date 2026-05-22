# Hermes Agent Railway Template (v2)

One-click deploy for [Hermes Agent](https://github.com/NousResearch/hermes-agent) **v2026.5.16** (v0.14.0) on [Railway](https://railway.com), with a built-in setup UI at `/setup`.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/hermes-agent-1?referralCode=uXzB-u&utm_medium=integration&utm_source=template&utm_campaign=generic)

## Fresh deploy only

This is a **v2 greenfield** template. Use a **new Railway service** and a **new volume** at `/data/hermes`. Upgrading an old deploy by redeploying the same volume is not supported.

## What you get

- Hermes **messaging gateway** + OpenAI-compatible **HTTP API** on your public URL
- Web setup at **`/setup`** (no shell required)
- Platform webhook proxy on the same port:
  - **Teams** → `/api/messages`
  - **Telegram webhooks** → path from `TELEGRAM_WEBHOOK_URL` (default `/telegram`)
  - **Hermes webhooks** → `/webhooks/*`
- Hermes API + health → everything else proxied to internal port `8642`

## Quick start

1. Deploy from the Railway button (or fork this repo and connect it).
2. Add a **volume** mounted at **`/data/hermes`**.
3. Open **`https://<your-service>/setup`**.
4. Set **OpenRouter API key** + **model** (writes `config.yaml`), then **Telegram** bot token + allowed user IDs.
5. Click **Save and restart gateway**.
6. Message your bot on Telegram.

## How you chat

| Surface | How |
| -------- | ----- |
| **Telegram** (recommended) | Message your bot after `/setup` |
| **Discord / Slack / Teams** | Configure tokens in `/setup` |
| **HTTP API** | `POST /v1/chat/completions` with `Authorization: Bearer <API_SERVER_KEY>` |

This template does **not** run the interactive terminal `hermes` TUI on the server.

Docs: [Telegram](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram) · [Messaging gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging) · [Team Telegram guide](https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant)

## Configuration model

| Storage | Contents |
| -------- | --------- |
| `${HERMES_HOME}/.env` | API keys, bot tokens, gateway flags |
| `${HERMES_HOME}/config.yaml` | `model.default` and other Hermes config |

The setup UI writes both. **`LLM_MODEL` in `.env` is not used** (Hermes v0.14+).

## Teams on Railway

Register your bot messaging endpoint as:

```text
https://<your-railway-domain>/api/messages
```

The wrapper forwards that path to Hermes’s internal Bot Framework listener (port `3978` inside the container).

## Telegram webhooks (optional)

Default is long polling (no public webhook URL required). For webhook mode, set in `/setup`:

- `TELEGRAM_WEBHOOK_URL` = `https://<your-railway-domain>/telegram`
- `TELEGRAM_WEBHOOK_SECRET` = a long random string

## HTTP API

| Endpoint | Description |
| -------- | ------------- |
| `GET /setup/healthz` | Wrapper + gateway readiness |
| `GET /health` | Hermes health (proxied) |
| `GET /v1/models` | Models list |
| `POST /v1/chat/completions` | Chat |

Set **`API_SERVER_KEY`** in `/setup` on any public URL.

## Updating Hermes

Bump `HERMES_REF` in [`Dockerfile`](Dockerfile) (e.g. `v2026.5.16`) and redeploy. For a clean upgrade, use a new volume and re-run `/setup`.

## Maintainer notes

See [ARCHITECTURE.md](ARCHITECTURE.md) for process layout and ports.
