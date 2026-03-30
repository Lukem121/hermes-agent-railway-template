import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import httpProxy from "http-proxy";

const PUBLIC_PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const INTERNAL_PORT = Number.parseInt(process.env.INTERNAL_HERMES_API_PORT ?? "8642", 10);
const INTERNAL_HOST = "127.0.0.1";
const HERMES_TARGET = `http://${INTERNAL_HOST}:${INTERNAL_PORT}`;
const HERMES_HOME = (process.env.HERMES_HOME ?? "/data/hermes").trim();
const ENV_FILE = path.join(HERMES_HOME, ".env");

const MANAGED_ENV_KEYS = [
  "OPENROUTER_API_KEY",
  "LLM_MODEL",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ALLOWED_USERS",
  "TELEGRAM_HOME_CHANNEL",
  "TELEGRAM_HOME_CHANNEL_NAME",
  "API_SERVER_KEY",
  "GATEWAY_ALLOW_ALL_USERS",
  "DISCORD_BOT_TOKEN",
  "DISCORD_ALLOWED_USERS",
  "SLACK_BOT_TOKEN",
  "SLACK_APP_TOKEN",
  "SLACK_ALLOWED_USERS",
];

const SECRET_KEYS = new Set([
  "OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "API_SERVER_KEY",
  "TELEGRAM_BOT_TOKEN",
  "DISCORD_BOT_TOKEN",
  "SLACK_BOT_TOKEN",
  "SLACK_APP_TOKEN",
]);

let hermesProc = null;
let restarting = false;

function ensureEnvFile() {
  fs.mkdirSync(HERMES_HOME, { recursive: true });
  if (!fs.existsSync(ENV_FILE)) {
    fs.writeFileSync(ENV_FILE, "", "utf8");
  }
}

function loadEnvMap() {
  ensureEnvFile();
  const raw = fs.readFileSync(ENV_FILE, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1);
    out[key] = value;
  }
  return out;
}

function upsertEnvVars(updates) {
  ensureEnvFile();
  const src = fs.readFileSync(ENV_FILE, "utf8");
  const lines = src.split(/\r?\n/);
  const touched = new Set();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    if (!(key in updates)) continue;
    lines[i] = `${key}=${String(updates[key] ?? "")}`;
    touched.add(key);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (touched.has(key)) continue;
    lines.push(`${key}=${String(value ?? "")}`);
  }

  fs.writeFileSync(ENV_FILE, `${lines.join("\n").replace(/\n*$/, "\n")}`, "utf8");
}

function maskValue(key, value) {
  if (!value) return "";
  if (!SECRET_KEYS.has(key)) return value;
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 3)}${"*".repeat(Math.max(3, value.length - 6))}${value.slice(-3)}`;
}

function getUiConfig() {
  const envMap = loadEnvMap();
  const cfg = {};
  for (const key of MANAGED_ENV_KEYS) {
    const value = process.env[key] ?? envMap[key] ?? "";
    cfg[key] = {
      value: SECRET_KEYS.has(key) ? "" : value,
      masked: maskValue(key, value),
      set: Boolean(value && String(value).trim()),
      from: process.env[key] != null ? "runtime" : (envMap[key] != null ? "file" : "unset"),
    };
  }
  return cfg;
}

function telegramTokenPresent() {
  const envMap = loadEnvMap();
  const t = process.env.TELEGRAM_BOT_TOKEN ?? envMap.TELEGRAM_BOT_TOKEN ?? "";
  return Boolean(String(t).trim());
}

function startHermes() {
  if (hermesProc) return;
  const childEnv = {
    ...process.env,
    HERMES_HOME,
    API_SERVER_ENABLED: "true",
    API_SERVER_HOST: INTERNAL_HOST,
    API_SERVER_PORT: String(INTERNAL_PORT),
  };
  hermesProc = spawn("hermes", ["gateway", "run", "--replace"], {
    env: childEnv,
    stdio: "inherit",
  });
  hermesProc.on("exit", (code, signal) => {
    console.error(`[hermes] exited code=${code} signal=${signal}`);
    hermesProc = null;
    if (!restarting) {
      setTimeout(() => startHermes(), 2000);
    }
  });
}

async function restartHermes() {
  if (!hermesProc) {
    startHermes();
    return;
  }
  restarting = true;
  const proc = hermesProc;
  await new Promise((resolve) => {
    const done = () => resolve();
    proc.once("exit", done);
    proc.kill("SIGTERM");
    setTimeout(() => resolve(), 8000);
  });
  restarting = false;
  startHermes();
}

async function isHermesReady() {
  try {
    const res = await fetch(`${HERMES_TARGET}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

function setupHtml() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hermes Setup</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Inter, system-ui, -apple-system, sans-serif; background:#0d0d0d; color:#d8d8d8; margin:0; padding:24px; line-height:1.45; }
      .card { max-width:900px; margin:0 auto; background:#141414; border:1px solid #2d2d2d; border-radius:12px; padding:24px; }
      h1 { margin:0 0 8px 0; font-size:24px; color:#fff; }
      .sub { color:#9ca3af; margin:0 0 16px 0; font-size:14px; }
      .step { border-top:1px solid #2d2d2d; padding-top:18px; margin-top:18px; }
      .step:first-of-type { border-top:0; padding-top:0; margin-top:0; }
      .title { font-size:16px; font-weight:600; color:#fff; margin:0 0 8px 0; }
      .muted { color:#9ca3af; font-size:13px; }
      .muted a { color:#a5b4fc; }
      .muted a:hover { text-decoration:underline; }
      .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px; }
      label { font-size:12px; color:#b7b7b7; display:block; margin-bottom:4px; }
      input, select { width:100%; background:#1a1a1a; border:1px solid #333; border-radius:8px; color:#e5e5e5; padding:10px; font-size:13px; }
      .row { margin-top:12px; }
      .btn { background:#262626; color:#fff; border:1px solid #404040; border-radius:8px; padding:10px 14px; cursor:pointer; font-size:13px; margin-right:8px; }
      .btn:hover { background:#2d2d2d; }
      .btn:disabled { opacity:0.6; cursor:not-allowed; }
      pre { background:#1a1a1a; border:1px solid #2d2d2d; border-radius:8px; padding:12px; font-size:12px; white-space:pre-wrap; word-break:break-word; margin:10px 0 0 0; }
      code { background:#1a1a1a; padding:2px 6px; border-radius:4px; }
      .status { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid #333; }
      .ok { color:#86efac; border-color:#1f5c35; }
      .warn { color:#facc15; border-color:#69561d; }
      .callout { background:#1a1a1a; border:1px solid #333; border-radius:8px; padding:14px 16px; margin-bottom:16px; font-size:13px; color:#c4c4c4; }
      .callout strong { color:#e5e5e5; }
      .template-help { margin:-6px 0 16px 0; font-size:13px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hermes Setup</h1>
      <p class="sub">No-code setup. Saves to <code>${ENV_FILE}</code> and restarts the gateway.</p>
      <p class="muted template-help">Having trouble with this template? <a href="https://github.com/Lukem121/hermes-agent-railway-template/issues" target="_blank" rel="noopener">Open an issue on GitHub</a>.</p>

      <div class="callout">
        <strong>How you talk to Hermes on this deploy</strong><br />
        This service runs the <strong>messaging gateway</strong> (not the interactive terminal <code>hermes</code> TUI from the
        <a href="https://hermes-agent.nousresearch.com/docs/getting-started/quickstart" target="_blank" rel="noopener">quickstart</a>).
        After you add an LLM key and Telegram below, open Telegram, find your bot, and send a message — that is your chat UI.
        You can also use the OpenAI-compatible <strong>HTTP API</strong> on this same URL (<code>/v1/…</code>) for apps and scripts.
        See also:
        <a href="https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram" target="_blank" rel="noopener">Telegram setup</a> (BotFather, privacy mode in groups, voice, troubleshooting),
        <a href="https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant" target="_blank" rel="noopener">Team Telegram assistant</a>,
        and <a href="https://hermes-agent.nousresearch.com/docs/user-guide/messaging" target="_blank" rel="noopener">Messaging gateway</a>.
      </div>

      <div class="step">
        <div class="title">Status</div>
        <div class="muted">Gateway API: <span id="health" class="status warn">checking</span> · Telegram: <span id="telegram" class="status warn">—</span></div>
      </div>

      <div class="step">
        <div class="title">1 — LLM provider</div>
        <p class="muted">Hermes needs a provider to answer messages. OpenRouter is the usual default.</p>
        <div class="grid">
          <div><label>OPENROUTER_API_KEY</label><input id="OPENROUTER_API_KEY" placeholder="sk-or-..." autocomplete="off" /></div>
          <div><label>LLM_MODEL</label><input id="LLM_MODEL" placeholder="anthropic/claude-sonnet-4" /></div>
          <div><label>ANTHROPIC_API_KEY (optional)</label><input id="ANTHROPIC_API_KEY" autocomplete="off" /></div>
          <div><label>OPENAI_API_KEY (optional)</label><input id="OPENAI_API_KEY" autocomplete="off" /></div>
        </div>
      </div>

      <div class="step">
        <div class="title">2 — Telegram (recommended)</div>
        <p class="muted">Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a>, copy the token, then get your numeric user ID from <a href="https://t.me/userinfobot" target="_blank" rel="noopener">@userinfobot</a> for <code>TELEGRAM_ALLOWED_USERS</code>. Optional home channel for cron (<code>/sethome</code> or fields below). Full reference:
        <a href="https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram" target="_blank" rel="noopener">Telegram</a> ·
        <a href="https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant" target="_blank" rel="noopener">Team tutorial</a>.</p>
        <div class="grid">
          <div style="grid-column: 1 / -1;"><label>TELEGRAM_BOT_TOKEN</label><input id="TELEGRAM_BOT_TOKEN" autocomplete="off" /></div>
          <div><label>TELEGRAM_ALLOWED_USERS</label><input id="TELEGRAM_ALLOWED_USERS" placeholder="123456789,987654321" /></div>
          <div><label>TELEGRAM_HOME_CHANNEL (optional)</label><input id="TELEGRAM_HOME_CHANNEL" placeholder="-100…" /></div>
          <div><label>TELEGRAM_HOME_CHANNEL_NAME (optional)</label><input id="TELEGRAM_HOME_CHANNEL_NAME" placeholder="Team updates" /></div>
        </div>
      </div>

      <div class="step">
        <div class="title">3 — Other messaging platforms (optional)</div>
        <p class="muted">Skip if you only use Telegram.</p>
        <div class="grid">
          <div><label>DISCORD_BOT_TOKEN</label><input id="DISCORD_BOT_TOKEN" autocomplete="off" /></div>
          <div><label>DISCORD_ALLOWED_USERS</label><input id="DISCORD_ALLOWED_USERS" /></div>
          <div><label>SLACK_BOT_TOKEN</label><input id="SLACK_BOT_TOKEN" autocomplete="off" /></div>
          <div><label>SLACK_APP_TOKEN</label><input id="SLACK_APP_TOKEN" autocomplete="off" /></div>
          <div><label>SLACK_ALLOWED_USERS</label><input id="SLACK_ALLOWED_USERS" /></div>
        </div>
      </div>

      <div class="step">
        <div class="title">Optional — Advanced: HTTP API &amp; messaging access</div>
        <p class="muted">
          <strong>You do not need to fill this out</strong> for a normal Telegram-only setup. Configure LLM + Telegram above, click Save, and you are done.<br /><br />
          Use this block when you want to (a) <strong>password-protect</strong> the OpenAI-compatible web API (<code>/v1/*</code> on this same URL), and/or (b) change who may use Telegram/Discord/Slack bots at the gateway level.<br /><br />
          <strong>API server key</strong> — Password for the HTTP API. Clients send <code>Authorization: Bearer &lt;key&gt;</code>. On a public URL, setting a random key stops strangers from using your API. Leave empty if you only use Telegram and accept that the API may be reachable without auth (not ideal on the public internet).<br /><br />
          <strong>Gateway allow all users</strong> — <code>false</code> = only IDs in your allowlists (e.g. <code>TELEGRAM_ALLOWED_USERS</code>). <code>true</code> = anyone can message your bots (risky with tools).
        </p>
        <div class="grid">
          <div><label>API_SERVER_KEY (optional — lock <code>/v1/*</code>)</label><input id="API_SERVER_KEY" placeholder="leave blank if unused" autocomplete="off" /></div>
          <div>
            <label>GATEWAY_ALLOW_ALL_USERS (optional — defaults to allowlist-only)</label>
            <select id="GATEWAY_ALLOW_ALL_USERS">
              <option value="false">false — only allowlisted users (recommended)</option>
              <option value="true">true — anyone can message (risky)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="step">
        <button class="btn" type="button" id="saveBtn">Save and restart gateway</button>
        <button class="btn" type="button" id="refreshBtn">Reload</button>
        <pre id="output">ready</pre>
      </div>
    </div>

    <script>
      const keys = ${JSON.stringify(MANAGED_ENV_KEYS)};
      const output = document.getElementById("output");
      const health = document.getElementById("health");
      const telegram = document.getElementById("telegram");

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

      /** Updates gateway/Telegram indicators only — does not touch inputs (avoids wiping unsaved edits). */
      async function refreshStatus() {
        try {
          const res = await fetch("/setup/api/status");
          const j = await res.json();
          health.className = "status " + (j.hermesReady ? "ok" : "warn");
          health.textContent = j.hermesReady ? "ready" : "starting";
          telegram.className = "status " + (j.telegramConfigured ? "ok" : "warn");
          telegram.textContent = j.telegramConfigured ? "configured" : "not configured";
        } catch (e) {
          health.className = "status warn";
          health.textContent = "unreachable";
        }
      }

      /** Loads saved config from server into the form. Use on first load, after Save, or Reload — not on a timer. */
      async function loadFormFromServer() {
        try {
          const res = await fetch("/setup/api/status");
          const j = await res.json();
          health.className = "status " + (j.hermesReady ? "ok" : "warn");
          health.textContent = j.hermesReady ? "ready" : "starting";
          telegram.className = "status " + (j.telegramConfigured ? "ok" : "warn");
          telegram.textContent = j.telegramConfigured ? "configured" : "not configured";
          fillForm(j.config || {});
        } catch (e) {
          health.className = "status warn";
          health.textContent = "unreachable";
        }
      }

      document.getElementById("saveBtn").onclick = async () => {
        output.textContent = "Saving and restarting...";
        const res = await fetch("/setup/api/save", {
          method: "POST",
          headers: {"content-type": "application/json"},
          body: JSON.stringify({ updates: valuesFromForm() })
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

const app = express();
app.use(express.json({ limit: "1mb" }));

const proxy = httpProxy.createProxyServer({
  target: HERMES_TARGET,
  ws: true,
  changeOrigin: false,
});

proxy.on("proxyReq", (proxyReq, req) => {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const proto = req.headers["x-forwarded-proto"] ?? (req.socket?.encrypted ? "https" : "http");
  if (host) proxyReq.setHeader("x-forwarded-host", host);
  proxyReq.setHeader("x-forwarded-proto", proto);
});

proxy.on("error", (_err, req, res) => {
  if (res && !res.headersSent) {
    res.writeHead(503, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "hermes_unavailable", path: req.url }));
  }
});

app.get("/setup", (_req, res) => {
  res.status(200).type("html").send(setupHtml());
});

app.get("/setup/healthz", async (_req, res) => {
  const ready = await isHermesReady();
  res.status(200).json({ ok: true, wrapper: "ready", hermesReady: ready });
});

app.get("/setup/api/status", async (_req, res) => {
  res.status(200).json({
    ok: true,
    hermesReady: await isHermesReady(),
    target: HERMES_TARGET,
    telegramConfigured: telegramTokenPresent(),
    config: getUiConfig(),
  });
});

app.post("/setup/api/save", async (req, res) => {
  const updates = req.body?.updates ?? {};
  const safeUpdates = {};
  for (const key of MANAGED_ENV_KEYS) {
    if (!(key in updates)) continue;
    const value = String(updates[key] ?? "");
    if (SECRET_KEYS.has(key) && value === "") continue;
    safeUpdates[key] = value === "__CLEAR__" ? "" : value;
  }
  upsertEnvVars(safeUpdates);
  await restartHermes();
  res.status(200).json({
    ok: true,
    output: "Saved managed variables to HERMES_HOME/.env and restarted Hermes.",
  });
});

app.use((req, res) => {
  proxy.web(req, res);
});

const server = app.listen(PUBLIC_PORT, () => {
  console.log(`[wrapper] listening on ${PUBLIC_PORT}, proxying Hermes API ${HERMES_TARGET}`);
});

server.on("upgrade", (req, socket, head) => {
  proxy.ws(req, socket, head);
});

startHermes();

const shutdown = () => {
  if (hermesProc) {
    hermesProc.kill("SIGTERM");
  }
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
