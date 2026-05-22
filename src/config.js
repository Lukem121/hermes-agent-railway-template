import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { CONFIG_MODEL_KEY, HERMES_HOME } from "./constants.js";
import { ensureEnvFile } from "./env.js";

export const CONFIG_FILE = path.join(HERMES_HOME, "config.yaml");

export function ensureConfigFile() {
  ensureEnvFile();
  if (!fs.existsSync(CONFIG_FILE)) {
    const example = "/opt/hermes/cli-config.yaml.example";
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, CONFIG_FILE);
    } else {
      fs.writeFileSync(CONFIG_FILE, "model:\n  default: anthropic/claude-opus-4.6\n", "utf8");
    }
  }
}

export function loadConfigDoc() {
  ensureConfigFile();
  const raw = fs.readFileSync(CONFIG_FILE, "utf8");
  return yaml.parse(raw) ?? {};
}

export function getDefaultModel() {
  const doc = loadConfigDoc();
  return doc?.model?.default ?? "";
}

export function setDefaultModel(model) {
  ensureConfigFile();
  const doc = loadConfigDoc();
  if (!doc.model || typeof doc.model !== "object") {
    doc.model = {};
  }
  doc.model.default = model;
  fs.writeFileSync(CONFIG_FILE, yaml.stringify(doc), "utf8");
}

export function getModelUiConfig() {
  const value = getDefaultModel();
  return {
    [CONFIG_MODEL_KEY]: {
      value,
      masked: value,
      set: Boolean(value && String(value).trim()),
      from: "config",
    },
  };
}
