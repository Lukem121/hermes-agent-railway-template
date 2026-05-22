import httpProxy from "http-proxy";
import {
  HERMES_API_TARGET,
  INTERNAL_HOST,
  INTERNAL_TEAMS_PORT,
  INTERNAL_TELEGRAM_WEBHOOK_PORT,
  INTERNAL_WEBHOOK_PORT,
} from "./constants.js";
import { loadEnvMap } from "./env.js";

function createTarget(port) {
  return `http://${INTERNAL_HOST}:${port}`;
}

function applyForwardedHeaders(proxyReq, req) {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const proto = req.headers["x-forwarded-proto"] ?? (req.socket?.encrypted ? "https" : "http");
  if (host) proxyReq.setHeader("x-forwarded-host", host);
  proxyReq.setHeader("x-forwarded-proto", proto);
}

export function createProxies() {
  const apiProxy = httpProxy.createProxyServer({
    target: HERMES_API_TARGET,
    ws: true,
    changeOrigin: false,
  });

  const teamsProxy = httpProxy.createProxyServer({
    target: createTarget(INTERNAL_TEAMS_PORT),
    changeOrigin: false,
  });

  const telegramWebhookProxy = httpProxy.createProxyServer({
    target: createTarget(INTERNAL_TELEGRAM_WEBHOOK_PORT),
    changeOrigin: false,
  });

  const webhookProxy = httpProxy.createProxyServer({
    target: createTarget(INTERNAL_WEBHOOK_PORT),
    changeOrigin: false,
  });

  for (const proxy of [apiProxy, teamsProxy, telegramWebhookProxy, webhookProxy]) {
    proxy.on("proxyReq", (proxyReq, req) => applyForwardedHeaders(proxyReq, req));
    proxy.on("error", (_err, req, res) => {
      if (res && !res.headersSent) {
        res.writeHead(503, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ ok: false, error: "upstream_unavailable", path: req.url }),
        );
      }
    });
  }

  return { apiProxy, teamsProxy, telegramWebhookProxy, webhookProxy };
}

/** Pathname from TELEGRAM_WEBHOOK_URL for public proxy routing (default /telegram). */
export function getTelegramWebhookPath() {
  const envMap = loadEnvMap();
  const raw = process.env.TELEGRAM_WEBHOOK_URL ?? envMap.TELEGRAM_WEBHOOK_URL ?? "";
  if (!raw.trim()) return "/telegram";
  try {
    const pathname = new URL(raw).pathname;
    return pathname && pathname !== "/" ? pathname : "/telegram";
  } catch {
    return "/telegram";
  }
}

export function matchPlatformRoute(pathname) {
  if (pathname === "/api/messages" || pathname.startsWith("/api/messages/")) {
    return "teams";
  }

  const telegramPath = getTelegramWebhookPath();
  if (pathname === telegramPath || pathname.startsWith(`${telegramPath}/`)) {
    return "telegram";
  }

  if (pathname === "/webhooks" || pathname.startsWith("/webhooks/")) {
    return "webhook";
  }

  return null;
}

export function proxyWeb(req, res, proxies) {
  const route = matchPlatformRoute(req.path ?? new URL(req.url, "http://localhost").pathname);
  if (route === "teams") {
    proxies.teamsProxy.web(req, res);
    return true;
  }
  if (route === "telegram") {
    proxies.telegramWebhookProxy.web(req, res);
    return true;
  }
  if (route === "webhook") {
    proxies.webhookProxy.web(req, res);
    return true;
  }
  proxies.apiProxy.web(req, res);
  return true;
}
