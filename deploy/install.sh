#!/bin/bash
set -euo pipefail

# ARM$N DigitalOcean droplet installer
# Run as root (or a user with passwordless sudo) on the droplet.
#
# Usage:
#   sudo ./install.sh [REPO_URL]
#
# If REPO_URL is omitted, the script copies the current working tree to /home/armsn/app.

APP_DIR="/home/armsn/app"
SERVICE_FILE="/etc/systemd/system/armn.service"
USER="armsn"
REPO_URL="${1:-}"

# -----------------------------------------------------------------------------
# 1. Create app user if missing
# -----------------------------------------------------------------------------
if ! id -u "$USER" &>/dev/null; then
  echo "==> Creating user $USER"
  useradd -m -s /bin/bash "$USER"
fi

# -----------------------------------------------------------------------------
# 2. Install system dependencies
# -----------------------------------------------------------------------------
echo "==> Updating packages and installing dependencies"
apt-get update
apt-get install -y curl git unzip build-essential python3 pkg-config postgresql-client

# -----------------------------------------------------------------------------
# 2b. Enable swap space (required for droplets with <= 1GB RAM to avoid build OOM)
# -----------------------------------------------------------------------------
if [ ! -f /swapfile ]; then
  echo "==> Creating 2GB swap file to prevent OOM errors"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "==> Swap space enabled successfully"
else
  echo "==> Swap file already exists"
fi

# -----------------------------------------------------------------------------
# 3. Install Bun as the app user
# -----------------------------------------------------------------------------
echo "==> Installing Bun for $USER"
su - "$USER" -c 'curl -fsSL https://bun.sh/install | bash'

# -----------------------------------------------------------------------------
# 4. Clone / update the repo
# -----------------------------------------------------------------------------
echo "==> Setting up app at $APP_DIR"
if [ -n "$REPO_URL" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    su - "$USER" -c "cd $APP_DIR && git pull origin main"
  else
    rm -rf "$APP_DIR"
    su - "$USER" -c "git clone --depth=1 $REPO_URL $APP_DIR"
  fi
else
  echo "==> Copying local working tree to $APP_DIR"
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  SRC_DIR="$(dirname "$SCRIPT_DIR")"
  rm -rf "$APP_DIR"
  mkdir -p "$APP_DIR"
  cp -a "$SRC_DIR/." "$APP_DIR/"
  rm -rf "$APP_DIR/node_modules" "$APP_DIR/dist"
  rm -f "$APP_DIR/.env" "$APP_DIR/.env.local" "$APP_DIR/.env.production"
  chown -R "$USER:$USER" "$APP_DIR"
fi

# -----------------------------------------------------------------------------
# 5. Install deps and build
# -----------------------------------------------------------------------------
echo "==> Installing dependencies and building"
su - "$USER" -c "cd $APP_DIR && ~/.bun/bin/bun install --frozen-lockfile"
su - "$USER" -c "cd $APP_DIR && ~/.bun/bin/bun run build"

# -----------------------------------------------------------------------------
# 6. Install systemd service
# -----------------------------------------------------------------------------
echo "==> Installing systemd service"
cp "$APP_DIR/deploy/armn.service" "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable armn.service

# -----------------------------------------------------------------------------
# 7. Open firewall
# -----------------------------------------------------------------------------
echo "==> Opening port 8080"
if command -v ufw &>/dev/null; then
  ufw allow 8080/tcp || true
fi

echo "==> App installed at $APP_DIR"
echo "Make sure $APP_DIR/.env exists, then run: systemctl restart armn"
