# Architecture (maintainers)

## Processes

| Process | Role |
| -------- | ------ |
| **Node wrapper** (`src/server.js`) | Public HTTP on `PORT` (8080), `/setup` UI, reverse proxy |
| **Hermes gateway** (`hermes gateway run --replace`) | Messaging adapters + internal services |

This template is a **dedicated agent machine** (Railway container runs as root). `HERMES_ALLOW_ROOT_GATEWAY=1` opts into root gateway startup — Hermes otherwise refuses `gateway run` as root when `/opt/hermes/docker` exists.

## Internal ports (localhost)

| Port | Service |
| ------ | --------- |
| `8642` | Hermes OpenAI-compatible API (`API_SERVER_*`) |
| `3978` | Microsoft Teams Bot Framework (`/api/messages`) |
| `8443` | Telegram webhook listener |
| `8644` | Hermes generic webhook platform (`/webhooks/{name}`) |

## Public routing (wrapper)

| Public path | Upstream |
| ------------- | --------- |
| `/setup`, `/setup/*` | Wrapper |
| `/api/messages` | `127.0.0.1:3978` |
| `/telegram` (or `TELEGRAM_WEBHOOK_URL` pathname) | `127.0.0.1:8443` |
| `/webhooks/*` | `127.0.0.1:8644` |
| `/*` (incl. `/health`, `/v1/*`) | `127.0.0.1:8642` |

## Build

- Hermes cloned at Docker build from `HERMES_REF` (default `v2026.5.16`)
- **Node.js 22** (NodeSource) — Hermes npm deps require `>=20`; Debian’s default is 18
- Installed with **uv** into `/opt/hermes/.venv`
- Extras: `messaging`, `cron`, `mcp`, `pty`, `honcho` (eager install for reliable first message)

## Persistence

Volume at `/data/hermes` → `HERMES_HOME`. Entrypoint seeds `.env`, `config.yaml`, `SOUL.md` only when missing.

## Gateway startup

Child env sets `HERMES_ALLOW_ROOT_GATEWAY=1` and `API_SERVER_ENABLED=true` so a deploy with no messaging tokens still has a connected platform (API server).
