import { CONFIG_MODEL_KEY, HERMES_HOME, MANAGED_ENV_KEYS } from "./constants.js";
import { ENV_FILE } from "./env.js";

export function renderSetupHtml() {
  const keys = [...MANAGED_ENV_KEYS, CONFIG_MODEL_KEY];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hermes Setup</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #0a0a0a; color: #e4e4e7; margin: 0; padding: 20px; line-height: 1.5; }
    .wrap { max-width: 920px; margin: 0 auto; }
    .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; padding: 22px; margin-bottom: 16px; }
    h1 { margin: 0 0 6px; font-size: 26px; }
    .sub { color: #a1a1aa; font-size: 14px; margin: 0 0 16px; }
    h2 { font-size: 15px; margin: 0 0 10px; color: #fafafa; }
    .hint { color: #a1a1aa; font-size: 13px; margin: 0 0 12px; }
    .hint a { color: #a5b4fc; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    label { font-size: 11px; color: #d4d4d8; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    input, select { width: 100%; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; color: #fafafa; padding: 9px 10px; font-size: 13px; }
    .full { grid-column: 1 / -1; }
    .btn { background: #27272a; color: #fff; border: 1px solid #3f3f46; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-size: 13px; margin-right: 8px; }
    .btn:hover { background: #3f3f46; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; border: 1px solid #3f3f46; margin-right: 6px; margin-bottom: 4px; }
    .ok { color: #86efac; border-color: #166534; }
    .warn { color: #fde047; border-color: #854d0e; }
    pre { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; font-size: 12px; white-space: pre-wrap; margin-top: 12px; }
    code { background: #1a1a1a; padding: 2px 5px; border-radius: 4px; font-size: 12px; }
    .callout { background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #d4d4d8; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Hermes Railway Setup</h1>
      <p class="sub">v2 greenfield template · Hermes <span id="version">…</span> · saves to <code>${ENV_FILE}</code> and <code>${HERMES_HOME}/config.yaml</code></p>
      <div class="callout">
        <strong>Fresh deploy only.</strong> Mount a new volume at <code>/data/hermes</code>, configure here, then chat on Telegram (or your platform).
        Gateway API: <span id="health" class="badge warn">checking</span>
        <span id="badges"></span>
      </div>
      <p class="hint">Issues? <a href="https://github.com/Lukem121/hermes-agent-railway-template/issues" target="_blank" rel="noopener">GitHub</a> ·
        <a href="https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram" target="_blank" rel="noopener">Telegram docs</a></p>
    </div>

    <div class="card">
      <h2>1 — LLM</h2>
      <p class="hint">Provider keys go in <code>.env</code>. Default model is stored in <code>config.yaml</code> (<code>model.default</code>).</p>
      <div class="grid">
        <div class="full"><label>OPENROUTER_API_KEY</label><input id="OPENROUTER_API_KEY" placeholder="sk-or-…" autocomplete="off" /></div>
        <div class="full"><label>MODEL_DEFAULT (config.yaml)</label><input id="${CONFIG_MODEL_KEY}" placeholder="anthropic/claude-opus-4.6" /></div>
        <div><label>ANTHROPIC_API_KEY</label><input id="ANTHROPIC_API_KEY" autocomplete="off" /></div>
        <div><label>OPENAI_API_KEY</label><input id="OPENAI_API_KEY" autocomplete="off" /></div>
        <div><label>NOVITA_API_KEY</label><input id="NOVITA_API_KEY" autocomplete="off" /></div>
        <div><label>GOOGLE_API_KEY</label><input id="GOOGLE_API_KEY" autocomplete="off" /></div>
        <div><label>GEMINI_API_KEY</label><input id="GEMINI_API_KEY" autocomplete="off" /></div>
        <div><label>GLM_API_KEY</label><input id="GLM_API_KEY" autocomplete="off" /></div>
        <div><label>OLLAMA_API_KEY</label><input id="OLLAMA_API_KEY" autocomplete="off" /></div>
      </div>
    </div>

    <div class="card">
      <h2>2 — Telegram</h2>
      <p class="hint"><a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a> for token · <a href="https://t.me/userinfobot" target="_blank" rel="noopener">@userinfobot</a> for your user ID</p>
      <div class="grid">
        <div class="full"><label>TELEGRAM_BOT_TOKEN</label><input id="TELEGRAM_BOT_TOKEN" autocomplete="off" /></div>
        <div><label>TELEGRAM_ALLOWED_USERS</label><input id="TELEGRAM_ALLOWED_USERS" placeholder="123456789" /></div>
        <div><label>TELEGRAM_HOME_CHANNEL</label><input id="TELEGRAM_HOME_CHANNEL" placeholder="-100…" /></div>
        <div><label>TELEGRAM_HOME_CHANNEL_NAME</label><input id="TELEGRAM_HOME_CHANNEL_NAME" /></div>
        <div><label>TELEGRAM_HOME_CHANNEL_THREAD_ID</label><input id="TELEGRAM_HOME_CHANNEL_THREAD_ID" /></div>
        <div class="full"><label>TELEGRAM_WEBHOOK_URL</label><input id="TELEGRAM_WEBHOOK_URL" placeholder="https://your-app.up.railway.app/telegram" /></div>
        <div><label>TELEGRAM_WEBHOOK_SECRET</label><input id="TELEGRAM_WEBHOOK_SECRET" autocomplete="off" /></div>
        <div><label>TELEGRAM_REQUIRE_MENTION</label>
          <select id="TELEGRAM_REQUIRE_MENTION">
            <option value="">(default)</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>3 — Discord &amp; Slack</h2>
      <div class="grid">
        <div><label>DISCORD_BOT_TOKEN</label><input id="DISCORD_BOT_TOKEN" autocomplete="off" /></div>
        <div><label>DISCORD_ALLOWED_USERS</label><input id="DISCORD_ALLOWED_USERS" /></div>
        <div><label>SLACK_BOT_TOKEN</label><input id="SLACK_BOT_TOKEN" autocomplete="off" /></div>
        <div><label>SLACK_APP_TOKEN</label><input id="SLACK_APP_TOKEN" autocomplete="off" /></div>
        <div class="full"><label>SLACK_ALLOWED_USERS</label><input id="SLACK_ALLOWED_USERS" /></div>
      </div>
    </div>

    <div class="card">
      <h2>4 — Microsoft Teams</h2>
      <p class="hint">Bot Framework webhook is proxied at <code>/api/messages</code> on your public Railway URL. Register that URL in Azure Bot configuration.</p>
      <div class="grid">
        <div><label>TEAMS_CLIENT_ID</label><input id="TEAMS_CLIENT_ID" autocomplete="off" /></div>
        <div><label>TEAMS_CLIENT_SECRET</label><input id="TEAMS_CLIENT_SECRET" autocomplete="off" /></div>
        <div><label>TEAMS_TENANT_ID</label><input id="TEAMS_TENANT_ID" /></div>
        <div><label>TEAMS_ALLOWED_USERS</label><input id="TEAMS_ALLOWED_USERS" /></div>
        <div><label>TEAMS_ALLOW_ALL_USERS</label>
          <select id="TEAMS_ALLOW_ALL_USERS">
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </div>
        <div><label>TEAMS_HOME_CHANNEL</label><input id="TEAMS_HOME_CHANNEL" /></div>
        <div><label>TEAMS_HOME_CHANNEL_NAME</label><input id="TEAMS_HOME_CHANNEL_NAME" /></div>
      </div>
    </div>

    <div class="card">
      <h2>5 — HTTP API &amp; webhooks</h2>
      <div class="grid">
        <div><label>API_SERVER_KEY</label><input id="API_SERVER_KEY" autocomplete="off" placeholder="recommended on public URLs" /></div>
        <div><label>GATEWAY_ALLOW_ALL_USERS</label>
          <select id="GATEWAY_ALLOW_ALL_USERS">
            <option value="false">false — allowlists only</option>
            <option value="true">true — anyone (risky)</option>
          </select>
        </div>
        <div class="full"><label>API_SERVER_CORS_ORIGINS</label><input id="API_SERVER_CORS_ORIGINS" placeholder="https://app.example.com,https://other.example.com" /></div>
        <div><label>API_SERVER_MODEL_NAME</label><input id="API_SERVER_MODEL_NAME" placeholder="optional display name" /></div>
        <div><label>WEBHOOK_ENABLED</label>
          <select id="WEBHOOK_ENABLED">
            <option value="">false</option>
            <option value="true">true</option>
          </select>
        </div>
        <div><label>WEBHOOK_SECRET</label><input id="WEBHOOK_SECRET" autocomplete="off" /></div>
      </div>
    </div>

    <div class="card">
      <button class="btn" type="button" id="saveBtn">Save and restart gateway</button>
      <button class="btn" type="button" id="refreshBtn">Reload</button>
      <pre id="output">ready</pre>
    </div>
  </div>
  <script>
    const keys = ${JSON.stringify(keys)};

    const health = document.getElementById("health");
    const badges = document.getElementById("badges");
    const version = document.getElementById("version");
    const output = document.getElementById("output");

    function valuesFromForm() {
      const out = {};
      for (const key of keys) {
        const el = document.getElementById(key);
        if (el) out[key] = (el.value || "").trim();
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
          el.placeholder = item.masked + " (runtime var)";
        }
      }
    }

    function renderBadges(platforms) {
      badges.innerHTML = "";
      for (const p of platforms || []) {
        const s = document.createElement("span");
        s.className = "badge " + (p.configured ? "ok" : "warn");
        s.textContent = p.label + ": " + (p.configured ? "ok" : "—");
        badges.appendChild(s);
      }
    }

    async function refreshStatus() {
      try {
        const res = await fetch("/setup/api/status");
        const j = await res.json();
        health.className = "badge " + (j.hermesReady ? "ok" : "warn");
        health.textContent = j.hermesReady ? "gateway ready" : "starting";
        version.textContent = j.hermesVersion || "unknown";
        renderBadges(j.platforms);
      } catch {
        health.className = "badge warn";
        health.textContent = "unreachable";
      }
    }

    async function loadFormFromServer() {
      const res = await fetch("/setup/api/status");
      const j = await res.json();
      health.className = "badge " + (j.hermesReady ? "ok" : "warn");
      health.textContent = j.hermesReady ? "gateway ready" : "starting";
      version.textContent = j.hermesVersion || "unknown";
      renderBadges(j.platforms);
      fillForm(j.config || {});
    }

    document.getElementById("saveBtn").onclick = async () => {
      output.textContent = "Saving and restarting…";
      const res = await fetch("/setup/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ updates: valuesFromForm() }),
      });
      const j = await res.json();
      output.textContent = j.output || JSON.stringify(j, null, 2);
      await loadFormFromServer();
    };

    document.getElementById("refreshBtn").onclick = () => loadFormFromServer();
    loadFormFromServer();
    setInterval(refreshStatus, 8000);
  </script>
</body>
</html>`;
}
