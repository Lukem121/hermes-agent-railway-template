import fs from "node:fs";
import path from "node:path";
import { HERMES_HOME, MANAGED_ENV_KEYS, SECRET_KEYS } from "./constants.js";

export const ENV_FILE = path.join(HERMES_HOME, ".env");

export function ensureEnvFile() {
  fs.mkdirSync(HERMES_HOME, { recursive: true });
  if (!fs.existsSync(ENV_FILE)) {
    fs.writeFileSync(ENV_FILE, "", "utf8");
  }
}

export function loadEnvMap() {
  ensureEnvFile();
  const raw = fs.readFileSync(ENV_FILE, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1);
  }
  return out;
}

export function upsertEnvVars(updates) {
  ensureEnvFile();
  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  const touched = new Set();

  for (let i = 0; i < lines.length; i += 1) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(lines[i]);
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

export function maskValue(key, value) {
  if (!value) return "";
  if (!SECRET_KEYS.has(key)) return value;
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 3)}${"*".repeat(Math.max(3, value.length - 6))}${value.slice(-3)}`;
}

export function getEnvUiConfig() {
  const envMap = loadEnvMap();
  const cfg = {};
  for (const key of MANAGED_ENV_KEYS) {
    const value = process.env[key] ?? envMap[key] ?? "";
    cfg[key] = {
      value: SECRET_KEYS.has(key) ? "" : value,
      masked: maskValue(key, value),
      set: Boolean(value && String(value).trim()),
      from: process.env[key] != null ? "runtime" : envMap[key] != null ? "file" : "unset",
    };
  }
  return cfg;
}

export function isPlatformConfigured(keys) {
  const envMap = loadEnvMap();
  return keys.every((key) => {
    const v = process.env[key] ?? envMap[key] ?? "";
    return Boolean(String(v).trim());
  });
}
