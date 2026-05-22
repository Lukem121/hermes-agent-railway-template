import { CONFIG_MODEL_KEY, MANAGED_ENV_KEYS, SECRET_KEYS } from "./constants.js";
import { VALIDATION_RULES } from "./validate-setup.js";

function labelHtml(id, title, envName, required = false) {
  const reqClass = required ? "label-required" : "";
  const envHint = envName ? `<span class="env-hint">${envName}</span>` : "";
  const classAttr = reqClass ? ` class="${reqClass}"` : "";
  return `<label${classAttr} for="${id}">${title}${envHint}</label>`;
}

export function renderSetupHtml() {
  const keys = [...MANAGED_ENV_KEYS, CONFIG_MODEL_KEY];
  const validationRulesJson = JSON.stringify(VALIDATION_RULES);
  const secretKeysJson = JSON.stringify([...SECRET_KEYS]);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hermes Setup</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #0a0a0a; color: #e4e4e7; margin: 0; padding: 20px; line-height: 1.55; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; padding: 22px; margin-bottom: 14px; }
    h1 { margin: 0 0 8px; font-size: 26px; color: #fafafa; }
    .lead { color: #a1a1aa; font-size: 15px; margin: 0 0 14px; }
    .status-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; border: 1px solid #3f3f46; }
    .ok { color: #86efac; border-color: #166534; }
    .warn { color: #fde047; border-color: #854d0e; }
    .footer-meta { color: #71717a; font-size: 12px; margin-top: 8px; }
    .accordion { border: 1px solid #2a2a2a; border-radius: 10px; margin-bottom: 12px; background: #141414; overflow: hidden; }
    .accordion > summary { cursor: pointer; padding: 14px 16px; font-weight: 600; font-size: 15px; color: #fafafa; list-style: none; display: flex; align-items: center; gap: 8px; }
    .accordion > summary::-webkit-details-marker { display: none; }
    .accordion > summary::before { content: "▸"; color: #a1a1aa; font-size: 12px; transition: transform 0.15s; }
    .accordion[open] > summary::before { transform: rotate(90deg); }
    .accordion.optional > summary { color: #d4d4d8; font-weight: 500; font-size: 14px; }
    .accordion-body { padding: 0 16px 16px; border-top: 1px solid #2a2a2a; }
    .hint { color: #a1a1aa; font-size: 13px; margin: 12px 0; }
    .hint a { color: #a5b4fc; }
    .steps { margin: 12px 0 16px; padding-left: 20px; color: #d4d4d8; font-size: 14px; }
    .steps li { margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    .field { margin-bottom: 4px; }
    label { font-size: 13px; color: #e4e4e7; display: block; margin-bottom: 5px; font-weight: 500; }
    .label-required::after { content: " *"; color: #ef4444; font-weight: 600; }
    .env-hint { display: block; font-size: 10px; color: #71717a; font-weight: 400; text-transform: none; letter-spacing: 0; margin-top: 2px; }
    input, select { width: 100%; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; color: #fafafa; padding: 10px; font-size: 14px; }
    input.invalid, select.invalid { border-color: #ef4444; }
    .full { grid-column: 1 / -1; }
    .nested { margin-top: 14px; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px 14px; background: #111; }
    .nested > summary { cursor: pointer; font-size: 13px; color: #a1a1aa; font-weight: 500; list-style: none; }
    .nested > summary::-webkit-details-marker { display: none; }
    .btn { background: #27272a; color: #fff; border: 1px solid #3f3f46; border-radius: 8px; padding: 11px 16px; cursor: pointer; font-size: 14px; margin-right: 8px; margin-top: 4px; }
    .btn:hover { background: #3f3f46; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    pre { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; font-size: 13px; white-space: pre-wrap; margin-top: 12px; color: #d4d4d8; }
    pre.error { border-color: #7f1d1d; color: #fca5a5; }
    .help-link { font-size: 13px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Set up your Hermes agent</h1>
      <p class="lead">Add an AI key, connect Telegram, then click Save. Discord, Teams, and other settings are optional — skip anything you do not need.</p>
      <div class="status-row">
        <span>Status:</span>
        <span id="health" class="badge warn">checking</span>
        <span id="badges"></span>
      </div>
      <p class="footer-meta">Agent version: <span id="version">…</span></p>
    </div>

    <details class="accordion" open>
      <summary>Step 1 — AI provider</summary>
      <div class="accordion-body">
        <p class="hint">You need at least one AI provider key. OpenRouter is the easiest way to get started.</p>
        <div class="grid">
          <div class="field full">
            ${labelHtml("OPENROUTER_API_KEY", "OpenRouter API key (recommended)", "OPENROUTER_API_KEY", true)}
            <input id="OPENROUTER_API_KEY" placeholder="sk-or-…" autocomplete="off" />
          </div>
          <div class="field full">
            ${labelHtml(CONFIG_MODEL_KEY, "AI model", "model.default in config", true)}
            <input id="${CONFIG_MODEL_KEY}" placeholder="anthropic/claude-opus-4.6" />
          </div>
        </div>
        <details class="nested">
          <summary>Other AI providers (optional)</summary>
          <div class="grid" style="margin-top:12px">
            <div class="field">${labelHtml("ANTHROPIC_API_KEY", "Anthropic", "ANTHROPIC_API_KEY")}<input id="ANTHROPIC_API_KEY" autocomplete="off" /></div>
            <div class="field">${labelHtml("OPENAI_API_KEY", "OpenAI", "OPENAI_API_KEY")}<input id="OPENAI_API_KEY" autocomplete="off" /></div>
            <div class="field">${labelHtml("NOVITA_API_KEY", "Novita", "NOVITA_API_KEY")}<input id="NOVITA_API_KEY" autocomplete="off" /></div>
            <div class="field">${labelHtml("GOOGLE_API_KEY", "Google", "GOOGLE_API_KEY")}<input id="GOOGLE_API_KEY" autocomplete="off" /></div>
            <div class="field">${labelHtml("GEMINI_API_KEY", "Gemini", "GEMINI_API_KEY")}<input id="GEMINI_API_KEY" autocomplete="off" /></div>
            <div class="field">${labelHtml("GLM_API_KEY", "GLM / z.ai", "GLM_API_KEY")}<input id="GLM_API_KEY" autocomplete="off" /></div>
            <div class="field">${labelHtml("OLLAMA_API_KEY", "Ollama", "OLLAMA_API_KEY")}<input id="OLLAMA_API_KEY" autocomplete="off" /></div>
          </div>
        </details>
      </div>
    </details>

    <details class="accordion" open>
      <summary>Step 2 — Telegram (recommended)</summary>
      <div class="accordion-body">
        <ol class="steps">
          <li>Open <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a> in Telegram, send <strong>/newbot</strong>, follow the prompts, then copy the <strong>bot token</strong> into the field below.</li>
          <li>Open <a href="https://t.me/userinfobot" target="_blank" rel="noopener">@userinfobot</a>, send any message, and copy your <strong>numeric user ID</strong> into Allowed users.</li>
          <li>Scroll down and click <strong>Save and restart gateway</strong>.</li>
          <li>In Telegram, open your new bot and send a message — that is how you chat with Hermes.</li>
        </ol>
        <p class="hint"><a href="https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram" target="_blank" rel="noopener">More help with Telegram setup</a></p>
        <div class="grid">
          <div class="field full">
            ${labelHtml("TELEGRAM_BOT_TOKEN", "Telegram bot token", "TELEGRAM_BOT_TOKEN", true)}
            <input id="TELEGRAM_BOT_TOKEN" autocomplete="off" />
          </div>
          <div class="field full">
            ${labelHtml("TELEGRAM_ALLOWED_USERS", "Allowed users (your Telegram user ID)", "TELEGRAM_ALLOWED_USERS", true)}
            <input id="TELEGRAM_ALLOWED_USERS" placeholder="123456789" />
          </div>
        </div>
        <details class="nested">
          <summary>More Telegram options (optional)</summary>
          <div class="grid" style="margin-top:12px">
            <div class="field">${labelHtml("TELEGRAM_HOME_CHANNEL", "Home channel", "TELEGRAM_HOME_CHANNEL")}<input id="TELEGRAM_HOME_CHANNEL" placeholder="-100…" /></div>
            <div class="field">${labelHtml("TELEGRAM_HOME_CHANNEL_NAME", "Home channel name", "TELEGRAM_HOME_CHANNEL_NAME")}<input id="TELEGRAM_HOME_CHANNEL_NAME" /></div>
            <div class="field">${labelHtml("TELEGRAM_HOME_CHANNEL_THREAD_ID", "Home thread ID", "TELEGRAM_HOME_CHANNEL_THREAD_ID")}<input id="TELEGRAM_HOME_CHANNEL_THREAD_ID" /></div>
            <div class="field full">${labelHtml("TELEGRAM_WEBHOOK_URL", "Webhook URL (optional)", "TELEGRAM_WEBHOOK_URL")}<input id="TELEGRAM_WEBHOOK_URL" placeholder="https://your-app.up.railway.app/telegram" /></div>
            <div class="field">${labelHtml("TELEGRAM_WEBHOOK_SECRET", "Webhook secret", "TELEGRAM_WEBHOOK_SECRET")}<input id="TELEGRAM_WEBHOOK_SECRET" autocomplete="off" /></div>
            <div class="field">
              ${labelHtml("TELEGRAM_REQUIRE_MENTION", "Require @mention in groups", "TELEGRAM_REQUIRE_MENTION")}
              <select id="TELEGRAM_REQUIRE_MENTION">
                <option value="">Default</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </details>
      </div>
    </details>

    <details class="accordion optional">
      <summary>Optional — Discord and Slack <span class="hint" style="display:inline;margin:0">· skip if you only use Telegram</span></summary>
      <div class="accordion-body">
        <p class="hint">Only fill these in if you want Hermes on Discord or Slack instead of (or as well as) Telegram.</p>
        <div class="grid">
          <div class="field">${labelHtml("DISCORD_BOT_TOKEN", "Discord bot token", "DISCORD_BOT_TOKEN")}<input id="DISCORD_BOT_TOKEN" autocomplete="off" /></div>
          <div class="field">${labelHtml("DISCORD_ALLOWED_USERS", "Discord allowed users", "DISCORD_ALLOWED_USERS")}<input id="DISCORD_ALLOWED_USERS" /></div>
          <div class="field">${labelHtml("SLACK_BOT_TOKEN", "Slack bot token", "SLACK_BOT_TOKEN")}<input id="SLACK_BOT_TOKEN" autocomplete="off" /></div>
          <div class="field">${labelHtml("SLACK_APP_TOKEN", "Slack app token", "SLACK_APP_TOKEN")}<input id="SLACK_APP_TOKEN" autocomplete="off" /></div>
          <div class="field full">${labelHtml("SLACK_ALLOWED_USERS", "Slack allowed users", "SLACK_ALLOWED_USERS")}<input id="SLACK_ALLOWED_USERS" /></div>
        </div>
      </div>
    </details>

    <details class="accordion optional">
      <summary>Optional — Microsoft Teams</summary>
      <div class="accordion-body">
        <p class="hint">For Teams, register your bot messaging URL as <code>https://your-railway-domain/api/messages</code> in Azure.</p>
        <div class="grid">
          <div class="field">${labelHtml("TEAMS_CLIENT_ID", "Client ID", "TEAMS_CLIENT_ID")}<input id="TEAMS_CLIENT_ID" autocomplete="off" /></div>
          <div class="field">${labelHtml("TEAMS_CLIENT_SECRET", "Client secret", "TEAMS_CLIENT_SECRET")}<input id="TEAMS_CLIENT_SECRET" autocomplete="off" /></div>
          <div class="field">${labelHtml("TEAMS_TENANT_ID", "Tenant ID", "TEAMS_TENANT_ID")}<input id="TEAMS_TENANT_ID" /></div>
          <div class="field">${labelHtml("TEAMS_ALLOWED_USERS", "Allowed users", "TEAMS_ALLOWED_USERS")}<input id="TEAMS_ALLOWED_USERS" /></div>
          <div class="field">
            ${labelHtml("TEAMS_ALLOW_ALL_USERS", "Allow all users", "TEAMS_ALLOW_ALL_USERS")}
            <select id="TEAMS_ALLOW_ALL_USERS">
              <option value="false">No — allowlist only</option>
              <option value="true">Yes (risky)</option>
            </select>
          </div>
          <div class="field">${labelHtml("TEAMS_HOME_CHANNEL", "Home channel", "TEAMS_HOME_CHANNEL")}<input id="TEAMS_HOME_CHANNEL" /></div>
          <div class="field">${labelHtml("TEAMS_HOME_CHANNEL_NAME", "Home channel name", "TEAMS_HOME_CHANNEL_NAME")}<input id="TEAMS_HOME_CHANNEL_NAME" /></div>
        </div>
      </div>
    </details>

    <details class="accordion optional">
      <summary>Optional — HTTP API and webhooks <span class="hint" style="display:inline;margin:0">· for apps and scripts</span></summary>
      <div class="accordion-body">
        <p class="hint">Use this if you want to call Hermes over HTTP instead of Telegram. Set an API password on public URLs.</p>
        <div class="grid">
          <div class="field">${labelHtml("API_SERVER_KEY", "API password", "API_SERVER_KEY")}<input id="API_SERVER_KEY" autocomplete="off" placeholder="long random string" /></div>
          <div class="field">
            ${labelHtml("GATEWAY_ALLOW_ALL_USERS", "Allow anyone to message bots", "GATEWAY_ALLOW_ALL_USERS")}
            <select id="GATEWAY_ALLOW_ALL_USERS">
              <option value="false">No — allowlists only (recommended)</option>
              <option value="true">Yes (risky)</option>
            </select>
          </div>
          <div class="field full">${labelHtml("API_SERVER_CORS_ORIGINS", "CORS origins", "API_SERVER_CORS_ORIGINS")}<input id="API_SERVER_CORS_ORIGINS" placeholder="https://example.com" /></div>
          <div class="field">${labelHtml("API_SERVER_MODEL_NAME", "API model display name", "API_SERVER_MODEL_NAME")}<input id="API_SERVER_MODEL_NAME" /></div>
          <div class="field">
            ${labelHtml("WEBHOOK_ENABLED", "Enable webhooks", "WEBHOOK_ENABLED")}
            <select id="WEBHOOK_ENABLED">
              <option value="">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div class="field">${labelHtml("WEBHOOK_SECRET", "Webhook secret", "WEBHOOK_SECRET")}<input id="WEBHOOK_SECRET" autocomplete="off" /></div>
        </div>
      </div>
    </details>

    <div class="card">
      <button class="btn" type="button" id="saveBtn">Save and restart gateway</button>
      <button class="btn" type="button" id="refreshBtn">Reload saved settings</button>
      <pre id="output">Fill in Step 1 and Step 2, then save.</pre>
    </div>

    <details class="accordion optional">
      <summary>Help and troubleshooting</summary>
      <div class="accordion-body">
        <p class="hint">Mount a Railway volume at <code>/data/hermes</code> so your settings persist across redeploys.</p>
        <p class="help-link">
          <a href="https://github.com/Lukem121/hermes-agent-railway-template/issues" target="_blank" rel="noopener">Report an issue</a>
          · <a href="https://hermes-agent.nousresearch.com/docs/user-guide/messaging" target="_blank" rel="noopener">Messaging docs</a>
        </p>
      </div>
    </details>
  </div>
  <script>
    const keys = ${JSON.stringify(keys)};
    const RULES = ${validationRulesJson};
    const SECRET_KEYS = new Set(${secretKeysJson});
    let savedConfig = {};

    const health = document.getElementById("health");
    const badges = document.getElementById("badges");
    const version = document.getElementById("version");
    const output = document.getElementById("output");
    const saveBtn = document.getElementById("saveBtn");

    function isNonEmpty(v) {
      return Boolean(v && String(v).trim());
    }

    function validateQuickStart(values) {
      const errors = [];
      const hasLlm = RULES.llmProviderKeys.some((k) => isNonEmpty(values[k]));
      const hasModel = isNonEmpty(values[RULES.configModelKey]);
      const tgToken = isNonEmpty(values.TELEGRAM_BOT_TOKEN);
      const tgUsers = isNonEmpty(values.TELEGRAM_ALLOWED_USERS);
      const hasTelegram = tgToken && tgUsers;
      const partialTg = tgToken !== tgUsers;
      const hasDiscord = isNonEmpty(values.DISCORD_BOT_TOKEN);
      const hasSlack = isNonEmpty(values.SLACK_BOT_TOKEN) && isNonEmpty(values.SLACK_APP_TOKEN);
      const hasTeams = isNonEmpty(values.TEAMS_CLIENT_ID) && isNonEmpty(values.TEAMS_CLIENT_SECRET) && isNonEmpty(values.TEAMS_TENANT_ID);
      const hasMessaging = hasTelegram || hasDiscord || hasSlack || hasTeams || isNonEmpty(values.API_SERVER_KEY);

      if (!hasLlm) {
        errors.push({ field: "OPENROUTER_API_KEY", message: "Add at least one AI provider key (OpenRouter is the easiest)." });
      }
      if (!hasModel) {
        errors.push({ field: RULES.configModelKey, message: "Choose which AI model Hermes should use." });
      }
      if (partialTg) {
        if (!tgToken) errors.push({ field: "TELEGRAM_BOT_TOKEN", message: "Add your Telegram bot token from @BotFather." });
        if (!tgUsers) errors.push({ field: "TELEGRAM_ALLOWED_USERS", message: "Add your Telegram user ID from @userinfobot." });
      }
      if (!hasMessaging && !partialTg) {
        errors.push({
          field: "TELEGRAM_BOT_TOKEN",
          message: "Connect Telegram (recommended), set up another chat app in the optional sections, or add an API password under Advanced for HTTP-only use.",
        });
      }
      return errors;
    }

    function clearFieldErrors() {
      for (const key of keys) {
        const el = document.getElementById(key);
        if (el) el.classList.remove("invalid");
      }
      output.classList.remove("error");
    }

    function showFieldErrors(errors) {
      clearFieldErrors();
      const seen = new Set();
      const lines = [];
      for (const err of errors) {
        const el = document.getElementById(err.field);
        if (el) el.classList.add("invalid");
        if (!seen.has(err.message)) {
          seen.add(err.message);
          lines.push("• " + err.message);
        }
      }
      output.classList.add("error");
      output.textContent = lines.join("\\n");
      const first = document.getElementById(errors[0]?.field);
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function valuesFromForm() {
      const out = {};
      for (const key of keys) {
        const el = document.getElementById(key);
        if (el) out[key] = (el.value || "").trim();
      }
      return out;
    }

    /** Treat masked secrets already on disk as present for validation. */
    function valuesForValidation() {
      const out = valuesFromForm();
      for (const key of keys) {
        if (SECRET_KEYS.has(key) && !out[key] && savedConfig[key]?.set) {
          out[key] = "__saved__";
        }
      }
      if (!out[RULES.configModelKey] && savedConfig[RULES.configModelKey]?.set) {
        out[RULES.configModelKey] = savedConfig[RULES.configModelKey].value || "__saved__";
      }
      return out;
    }

    function fillForm(config) {
      for (const key of keys) {
        const el = document.getElementById(key);
        const item = config[key];
        if (!el || !item) continue;
        el.value = item.value || "";
        if (item.from === "runtime" && item.set && item.masked && item.masked !== item.value) {
          el.placeholder = item.masked + " (already set in Railway)";
        }
      }
    }

    function renderBadges(platforms) {
      badges.innerHTML = "";
      for (const p of platforms || []) {
        const s = document.createElement("span");
        s.className = "badge " + (p.configured ? "ok" : "warn");
        s.textContent = p.label + ": " + (p.configured ? "ready" : "not set");
        badges.appendChild(s);
      }
    }

    async function refreshStatus() {
      try {
        const res = await fetch("/setup/api/status");
        const j = await res.json();
        health.className = "badge " + (j.hermesReady ? "ok" : "warn");
        health.textContent = j.hermesReady ? "Gateway ready" : "Starting…";
        version.textContent = j.hermesVersion || "unknown";
        renderBadges(j.platforms);
      } catch {
        health.className = "badge warn";
        health.textContent = "Unreachable";
      }
    }

    async function loadFormFromServer() {
      clearFieldErrors();
      const res = await fetch("/setup/api/status");
      const j = await res.json();
      health.className = "badge " + (j.hermesReady ? "ok" : "warn");
      health.textContent = j.hermesReady ? "Gateway ready" : "Starting…";
      version.textContent = j.hermesVersion || "unknown";
      renderBadges(j.platforms);
      savedConfig = j.config || {};
      fillForm(savedConfig);
    }

    saveBtn.onclick = async () => {
      clearFieldErrors();
      const errors = validateQuickStart(valuesForValidation());
      if (errors.length) {
        showFieldErrors(errors);
        return;
      }

      saveBtn.disabled = true;
      output.classList.remove("error");
      output.textContent = "Saving and restarting…";
      try {
        const res = await fetch("/setup/api/save", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ updates: valuesFromForm() }),
        });
        const j = await res.json();
        if (!res.ok || !j.ok) {
          if (j.errors?.length) {
            showFieldErrors(j.errors);
          } else {
            output.classList.add("error");
            output.textContent = j.output || j.error || "Save failed.";
          }
          return;
        }
        output.textContent = j.output || "Saved successfully.";
        await loadFormFromServer();
      } catch (e) {
        output.classList.add("error");
        output.textContent = "Could not reach the server. Try again.";
      } finally {
        saveBtn.disabled = false;
      }
    };

    document.getElementById("refreshBtn").onclick = () => loadFormFromServer();
    loadFormFromServer();
    setInterval(refreshStatus, 8000);
  </script>
</body>
</html>`;
}
