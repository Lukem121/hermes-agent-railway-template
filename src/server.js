import express from "express";
import {
  CONFIG_MODEL_KEY,
  HERMES_API_TARGET,
  HERMES_HOME,
  MANAGED_ENV_KEYS,
  PLATFORM_CHECKS,
  PUBLIC_PORT,
  SECRET_KEYS,
} from "./constants.js";
import { getModelUiConfig, setDefaultModel } from "./config.js";
import { ENV_FILE, getEnvUiConfig, isPlatformConfigured, upsertEnvVars } from "./env.js";
import {
  getHermesVersion,
  isHermesReady,
  restartHermes,
  startHermes,
  stopHermes,
} from "./hermes-process.js";
import { createProxies, getTelegramWebhookPath, proxyWeb } from "./proxy.js";
import { renderSetupHtml } from "./setup-html.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

const proxies = createProxies();

app.get("/setup", (_req, res) => {
  res.status(200).type("html").send(renderSetupHtml());
});

app.get("/setup/healthz", async (_req, res) => {
  res.status(200).json({
    ok: true,
    wrapper: "ready",
    hermesReady: await isHermesReady(),
    hermesVersion: await getHermesVersion(),
  });
});

app.get("/setup/api/status", async (_req, res) => {
  const platforms = PLATFORM_CHECKS.map((p) => ({
    id: p.id,
    label: p.label,
    configured: isPlatformConfigured(p.keys),
  }));

  res.status(200).json({
    ok: true,
    hermesReady: await isHermesReady(),
    hermesVersion: await getHermesVersion(),
    target: HERMES_API_TARGET,
    hermesHome: HERMES_HOME,
    envFile: ENV_FILE,
    telegramWebhookPath: getTelegramWebhookPath(),
    platforms,
    config: { ...getEnvUiConfig(), ...getModelUiConfig() },
  });
});

app.post("/setup/api/save", async (req, res) => {
  const updates = req.body?.updates ?? {};
  const envUpdates = {};

  for (const key of MANAGED_ENV_KEYS) {
    if (!(key in updates)) continue;
    const value = String(updates[key] ?? "");
    if (SECRET_KEYS.has(key) && value === "") continue;
    envUpdates[key] = value === "__CLEAR__" ? "" : value;
  }

  if (CONFIG_MODEL_KEY in updates) {
    const model = String(updates[CONFIG_MODEL_KEY] ?? "").trim();
    if (model) {
      setDefaultModel(model);
    }
  }

  upsertEnvVars(envUpdates);
  await restartHermes();

  res.status(200).json({
    ok: true,
    output: "Saved configuration and restarted Hermes gateway.",
  });
});

app.get("/", (_req, res) => {
  res.redirect(302, "/setup");
});

app.use((req, res) => {
  proxyWeb(req, res, proxies);
});

const server = app.listen(PUBLIC_PORT, () => {
  console.log(`[wrapper] v2 listening on ${PUBLIC_PORT}`);
  console.log(`[wrapper] Hermes API proxy ${HERMES_API_TARGET}`);
  console.log(`[wrapper] Teams webhook path /api/messages`);
  console.log(`[wrapper] Telegram webhook path ${getTelegramWebhookPath()}`);
});

server.on("upgrade", (req, socket, head) => {
  proxies.apiProxy.ws(req, socket, head);
});

startHermes();

const shutdown = () => {
  stopHermes();
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
