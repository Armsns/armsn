#!/bin/bash
set -euo pipefail

# ARM$N OVHCloud VPS installer
# Run as root (or a user with passwordless sudo) on an Ubuntu 22.04/24.04 VPS.
#
# Usage:
#   sudo ./deploy/ovh-install.sh
#
# The script:
#   - installs Docker + Docker Compose plugin,
#   - creates an unprivileged app user,
#   - clones the repo (or uses the current working tree),
#   - writes .env from .env.vps.example if missing,
#   - builds and starts the containers.

APP_DIR="/opt/armn"
SERVICE_FILE="/etc/systemd/system/armn.service"
USER="armn"

# -----------------------------------------------------------------------------
# 0. OS check
# -----------------------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run this script as root or with sudo." >&2
  exit 1
fi

# -----------------------------------------------------------------------------
# 1. Install Docker if missing
# -----------------------------------------------------------------------------
if ! command -v docker &>/dev/null; then
  echo "==> Installing Docker"
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "==> Docker version: $(docker --version)"

# -----------------------------------------------------------------------------
# 2. Create app user
# -----------------------------------------------------------------------------
if ! id -u "$USER" &>/dev/null; then
  echo "==> Creating user $USER"
  useradd -r -m -s /bin/bash "$USER"
fi

# Add user to docker group so docker compose can be run without sudo
usermod -aG docker "$USER" || true

# -----------------------------------------------------------------------------
# 3. Set up app directory
# -----------------------------------------------------------------------------
if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Cloning ARM$N repo into $APP_DIR"
  rm -rf "$APP_DIR"
  git clone https://github.com/arman/armsn.git "$APP_DIR" || {
    echo "ERROR: Failed to clone repo. Falling back to copying current working tree." >&2
    mkdir -p "$APP_DIR"
    cp -a . "$APP_DIR/"
  }
else
  echo "==> Updating existing repo in $APP_DIR"
  git -C "$APP_DIR" pull origin main || true
fi

chown -R "$USER:$USER" "$APP_DIR"

# -----------------------------------------------------------------------------
# 4. Create .env from example if missing
# -----------------------------------------------------------------------------
ENV_WAS_NEW=false
if [ ! -f "$APP_DIR/.env" ]; then
  echo "==> Creating $APP_DIR/.env from example"
  cp "$APP_DIR/.env.vps.example" "$APP_DIR/.env"
  ENV_WAS_NEW=true
  echo "    ⚠️  EDIT $APP_DIR/.env BEFORE STARTING THE APP."
fi

# -----------------------------------------------------------------------------
# 5. Build
# -----------------------------------------------------------------------------
echo "==> Building ARM$N with Docker Compose"
cd "$APP_DIR"
docker compose pull 2>/dev/null || true
docker compose build --no-cache armn

if [ "$ENV_WAS_NEW" = true ]; then
  echo ""
  echo "=========================================="
  echo " Build complete, but .env is using example values."
  echo " Please edit $APP_DIR/.env, then run:"
  echo "   cd $APP_DIR && docker compose up -d"
  echo "=========================================="
  exit 0
fi

# -----------------------------------------------------------------------------
# 5b. Start containers
# -----------------------------------------------------------------------------
docker compose up -d

# -----------------------------------------------------------------------------
# 6. Install systemd service for auto-start on boot
# -----------------------------------------------------------------------------
echo "==> Installing systemd service"
cp "$APP_DIR/deploy/armn-docker.service" "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable armn.service
systemctl start armn.service || true

# -----------------------------------------------------------------------------
# 7. Summary
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo " ARM\$N is installed at $APP_DIR"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/.env with your real values."
echo "  2. Point your domain's DNS A/AAAA record to this server's IP."
echo "  3. Run: cd $APP_DIR && docker compose up -d --build"
echo "  4. Check logs: cd $APP_DIR && docker compose logs -f armn"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status armn"
echo "  cd $APP_DIR && docker compose ps"
echo ""
