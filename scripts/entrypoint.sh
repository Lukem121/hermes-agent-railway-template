#!/bin/sh
set -e

HERMES_HOME="${HERMES_HOME:-/data/hermes}"
INSTALL_DIR="/opt/hermes"
export HERMES_HOME
export PATH="/opt/hermes/.venv/bin:/root/.local/bin:${PATH}"
export VIRTUAL_ENV="/opt/hermes/.venv"

mkdir -p \
  "$HERMES_HOME/cron" \
  "$HERMES_HOME/sessions" \
  "$HERMES_HOME/logs" \
  "$HERMES_HOME/hooks" \
  "$HERMES_HOME/memories" \
  "$HERMES_HOME/skills" \
  "$HERMES_HOME/skins" \
  "$HERMES_HOME/plans" \
  "$HERMES_HOME/workspace" \
  "$HERMES_HOME/home"

if [ ! -f "$HERMES_HOME/.env" ] && [ -f "$INSTALL_DIR/.env.example" ]; then
  cp "$INSTALL_DIR/.env.example" "$HERMES_HOME/.env"
fi

if [ ! -f "$HERMES_HOME/config.yaml" ] && [ -f "$INSTALL_DIR/cli-config.yaml.example" ]; then
  cp "$INSTALL_DIR/cli-config.yaml.example" "$HERMES_HOME/config.yaml"
fi

if [ ! -f "$HERMES_HOME/SOUL.md" ] && [ -f "$INSTALL_DIR/docker/SOUL.md" ]; then
  cp "$INSTALL_DIR/docker/SOUL.md" "$HERMES_HOME/SOUL.md"
fi

if [ -d "$INSTALL_DIR/skills" ]; then
  python3 "$INSTALL_DIR/tools/skills_sync.py"
fi

exec "$@"
