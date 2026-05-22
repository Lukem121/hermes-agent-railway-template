import { spawn } from "node:child_process";
import {
  HERMES_API_TARGET,
  HERMES_HOME,
  INTERNAL_HERMES_API_PORT,
  INTERNAL_HOST,
  INTERNAL_TEAMS_PORT,
  INTERNAL_TELEGRAM_WEBHOOK_PORT,
  INTERNAL_WEBHOOK_PORT,
} from "./constants.js";

let hermesProc = null;
let restarting = false;
let cachedHermesVersion = null;
let versionProbe = null;

export function buildChildEnv() {
  return {
    ...process.env,
    HERMES_HOME,
    HERMES_ALLOW_ROOT_GATEWAY: "1",
    API_SERVER_ENABLED: "true",
    API_SERVER_HOST: INTERNAL_HOST,
    API_SERVER_PORT: String(INTERNAL_HERMES_API_PORT),
    TEAMS_PORT: String(INTERNAL_TEAMS_PORT),
    TELEGRAM_WEBHOOK_PORT: String(INTERNAL_TELEGRAM_WEBHOOK_PORT),
    WEBHOOK_PORT: String(INTERNAL_WEBHOOK_PORT),
  };
}

export function startHermes() {
  if (hermesProc) return;
  hermesProc = spawn("hermes", ["gateway", "run", "--replace"], {
    env: buildChildEnv(),
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

export async function restartHermes() {
  if (!hermesProc) {
    startHermes();
    return;
  }
  restarting = true;
  const proc = hermesProc;
  await new Promise((resolve) => {
    proc.once("exit", () => resolve());
    proc.kill("SIGTERM");
    setTimeout(() => resolve(), 8000);
  });
  restarting = false;
  startHermes();
}

export async function isHermesReady() {
  try {
    const res = await fetch(`${HERMES_API_TARGET}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function getHermesVersion() {
  if (cachedHermesVersion) return cachedHermesVersion;
  if (versionProbe) return versionProbe;

  versionProbe = new Promise((resolve) => {
    const proc = spawn("hermes", ["--version"], {
      env: buildChildEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    proc.stdout?.on("data", (chunk) => {
      out += chunk.toString();
    });
    const finish = (value) => {
      cachedHermesVersion = value;
      versionProbe = null;
      resolve(value);
    };
    proc.on("close", () => finish(out.trim() || "unknown"));
    proc.on("error", () => finish("unknown"));
    setTimeout(() => {
      proc.kill("SIGTERM");
      finish(out.trim() || "unknown");
    }, 5000);
  });

  return versionProbe;
}

export function stopHermes() {
  if (hermesProc) {
    hermesProc.kill("SIGTERM");
  }
}

export { hermesProc };
