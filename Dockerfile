FROM debian:13.4

ARG HERMES_REPO=https://github.com/NousResearch/hermes-agent.git
ARG HERMES_REF=v2026.3.28

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
    python3-pip \
    python3-venv \
    ripgrep \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt
RUN git clone --depth 1 --branch "${HERMES_REF}" "${HERMES_REPO}" hermes

WORKDIR /opt/hermes
RUN pip3 install -e ".[messaging,cron,mcp,pty,honcho]" --break-system-packages
RUN npm install --omit=dev
RUN if [ -d /opt/hermes/scripts/whatsapp-bridge ]; then cd /opt/hermes/scripts/whatsapp-bridge && npm install --omit=dev; fi

WORKDIR /wrapper
COPY package.json /wrapper/package.json
RUN npm install --omit=dev
COPY src /wrapper/src

ENV HERMES_HOME=/data/hermes

COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "/wrapper/src/server.js"]
