import {
  CONFIG_MODEL_KEY,
  LLM_PROVIDER_KEYS,
} from "./constants.js";

/**
 * @typedef {{ field: string, message: string }} SetupValidationError
 */

function isNonEmpty(value) {
  return Boolean(value && String(value).trim());
}

function hasAnyLlmKey(values) {
  return LLM_PROVIDER_KEYS.some((key) => isNonEmpty(values[key]));
}

function hasCompleteTelegram(values) {
  return (
    isNonEmpty(values.TELEGRAM_BOT_TOKEN) && isNonEmpty(values.TELEGRAM_ALLOWED_USERS)
  );
}

function hasPartialTelegram(values) {
  const token = isNonEmpty(values.TELEGRAM_BOT_TOKEN);
  const users = isNonEmpty(values.TELEGRAM_ALLOWED_USERS);
  return token !== users;
}

function hasDiscord(values) {
  return isNonEmpty(values.DISCORD_BOT_TOKEN);
}

function hasSlack(values) {
  return isNonEmpty(values.SLACK_BOT_TOKEN) && isNonEmpty(values.SLACK_APP_TOKEN);
}

function hasTeams(values) {
  return (
    isNonEmpty(values.TEAMS_CLIENT_ID) &&
    isNonEmpty(values.TEAMS_CLIENT_SECRET) &&
    isNonEmpty(values.TEAMS_TENANT_ID)
  );
}

function hasMessagingPath(values) {
  return (
    hasCompleteTelegram(values) ||
    hasDiscord(values) ||
    hasSlack(values) ||
    hasTeams(values) ||
    isNonEmpty(values.API_SERVER_KEY)
  );
}

/**
 * @param {Record<string, string>} values
 * @returns {{ ok: boolean, errors: SetupValidationError[] }}
 */
export function validateSetupValues(values) {
  const errors = [];

  if (!hasAnyLlmKey(values)) {
    errors.push({
      field: "OPENROUTER_API_KEY",
      message: "Add at least one AI provider key (OpenRouter is the easiest).",
    });
  }

  if (!isNonEmpty(values[CONFIG_MODEL_KEY])) {
    errors.push({
      field: CONFIG_MODEL_KEY,
      message: "Choose which AI model Hermes should use.",
    });
  }

  if (hasPartialTelegram(values)) {
    if (!isNonEmpty(values.TELEGRAM_BOT_TOKEN)) {
      errors.push({
        field: "TELEGRAM_BOT_TOKEN",
        message: "Add your Telegram bot token from @BotFather.",
      });
    }
    if (!isNonEmpty(values.TELEGRAM_ALLOWED_USERS)) {
      errors.push({
        field: "TELEGRAM_ALLOWED_USERS",
        message: "Add your Telegram user ID from @userinfobot.",
      });
    }
  }

  if (!hasMessagingPath(values) && !hasPartialTelegram(values)) {
    errors.push({
      field: "TELEGRAM_BOT_TOKEN",
      message:
        "Connect Telegram (recommended), set up another chat app in the optional sections, or add an API password under Advanced for HTTP-only use.",
    });
  }

  return { ok: errors.length === 0, errors };
}

/** Serialized for inline client validation in setup-html.js */
export const VALIDATION_RULES = {
  llmProviderKeys: LLM_PROVIDER_KEYS,
  configModelKey: CONFIG_MODEL_KEY,
};
