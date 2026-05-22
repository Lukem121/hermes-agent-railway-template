FROM debian:bookworm-slim

ARG HERMES_REPO=https://github.com/NousResearch/hermes-agent.git
ARG HERMES_REF=v2026.5.16

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    ffmpeg \
    gcc \
    git \
    libffi-dev \
    nodejs \
    npm \
    python3 \
    python3-dev \
    python3-venv \
    ripgrep \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /opt
RUN git clone --depth 1 --branch "${HERMES_REF}" "${HERMES_REPO}" hermes

WORKDIR /opt/hermes
RUN uv venv .venv

ENV VIRTUAL_ENV=/opt/hermes/.venv
ENV PATH="/opt/hermes/.venv/bin:/root/.local/bin:${PATH}"

RUN uv pip install -e ".[messaging,cron,mcp,pty,honcho]"
RUN npm install --omit=dev
RUN if [ -d /opt/hermes/scripts/whatsapp-bridge ]; then \
      cd /opt/hermes/scripts/whatsapp-bridge && npm install --omit=dev; \
    fi

WORKDIR /wrapper
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src

ENV HERMES_HOME=/data/hermes

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "/wrapper/src/server.js"]
