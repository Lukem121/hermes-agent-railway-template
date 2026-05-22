export const PUBLIC_PORT = Number.parseInt(process.env.PORT ?? "8080", 10);

export const INTERNAL_HERMES_API_PORT = Number.parseInt(
  process.env.INTERNAL_HERMES_API_PORT ?? "8642",
  10,
);
export const INTERNAL_TEAMS_PORT = Number.parseInt(process.env.INTERNAL_TEAMS_PORT ?? "3978", 10);
export const INTERNAL_TELEGRAM_WEBHOOK_PORT = Number.parseInt(
  process.env.INTERNAL_TELEGRAM_WEBHOOK_PORT ?? "8443",
  10,
);
export const INTERNAL_WEBHOOK_PORT = Number.parseInt(process.env.INTERNAL_WEBHOOK_PORT ?? "8644", 10);

export const INTERNAL_HOST = "127.0.0.1";
export const HERMES_API_TARGET = `http://${INTERNAL_HOST}:${INTERNAL_HERMES_API_PORT}`;
export const HERMES_HOME = (process.env.HERMES_HOME ?? "/data/hermes").trim();

/** Keys persisted in HERMES_HOME/.env */
export const MANAGED_ENV_KEYS = [
  "OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "NOVITA_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "GLM_API_KEY",
  "OLLAMA_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ALLOWED_USERS",
  "TELEGRAM_HOME_CHANNEL",
  "TELEGRAM_HOME_CHANNEL_NAME",
  "TELEGRAM_HOME_CHANNEL_THREAD_ID",
  "TELEGRAM_WEBHOOK_URL",
  "TELEGRAM_WEBHOOK_SECRET",
  "TELEGRAM_REQUIRE_MENTION",
  "DISCORD_BOT_TOKEN",
  "DISCORD_ALLOWED_USERS",
  "SLACK_BOT_TOKEN",
  "SLACK_APP_TOKEN",
  "SLACK_ALLOWED_USERS",
  "TEAMS_CLIENT_ID",
  "TEAMS_CLIENT_SECRET",
  "TEAMS_TENANT_ID",
  "TEAMS_ALLOWED_USERS",
  "TEAMS_ALLOW_ALL_USERS",
  "TEAMS_HOME_CHANNEL",
  "TEAMS_HOME_CHANNEL_NAME",
  "API_SERVER_KEY",
  "GATEWAY_ALLOW_ALL_USERS",
  "API_SERVER_CORS_ORIGINS",
  "API_SERVER_MODEL_NAME",
  "WEBHOOK_ENABLED",
  "WEBHOOK_SECRET",
];

export const SECRET_KEYS = new Set([
  "OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "NOVITA_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "GLM_API_KEY",
  "OLLAMA_API_KEY",
  "API_SERVER_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "DISCORD_BOT_TOKEN",
  "SLACK_BOT_TOKEN",
  "SLACK_APP_TOKEN",
  "TEAMS_CLIENT_SECRET",
  "WEBHOOK_SECRET",
]);

/** UI-only key mapped to config.yaml model.default */
export const CONFIG_MODEL_KEY = "MODEL_DEFAULT";

/** At least one required for a working agent */
export const LLM_PROVIDER_KEYS = [
  "OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "NOVITA_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "GLM_API_KEY",
  "OLLAMA_API_KEY",
];

/** Fields marked with a red asterisk in the setup UI (default Telegram path) */
export const UI_REQUIRED_FIELDS = new Set([
  "OPENROUTER_API_KEY",
  CONFIG_MODEL_KEY,
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ALLOWED_USERS",
]);

export const PLATFORM_CHECKS = [
  { id: "telegram", label: "Telegram", keys: ["TELEGRAM_BOT_TOKEN"] },
  { id: "discord", label: "Discord", keys: ["DISCORD_BOT_TOKEN"] },
  { id: "slack", label: "Slack", keys: ["SLACK_BOT_TOKEN", "SLACK_APP_TOKEN"] },
  {
    id: "teams",
    label: "Teams",
    keys: ["TEAMS_CLIENT_ID", "TEAMS_CLIENT_SECRET", "TEAMS_TENANT_ID"],
  },
];
