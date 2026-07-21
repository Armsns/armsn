#!/bin/bash
set -euo pipefail

# ARM$N one-command deploy from local machine to OVH VPS.
# Usage:
#   ./deploy/deploy-from-local.sh 135.148.40.243
#
# Requirements on your Mac:
#   - ssh and rsync installed (default on macOS)
#   - root access to the VPS

SERVER_IP="${1:-}"

if [ -z "$SERVER_IP" ]; then
  echo "Usage: $0 <SERVER_IP>"
  echo "Example: $0 135.148.40.243"
  exit 1
fi

APP_DIR="/opt/armn"

read -r -p "Are you sure you want to deploy ARM\$N to root@$SERVER_IP? [y/N] " confirm || true
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo "==> Checking SSH connection..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "root@$SERVER_IP" "echo 'SSH OK'" || {
  echo "ERROR: Cannot SSH into root@$SERVER_IP"
  echo "Make sure the password is correct and the server is in Normal mode."
  exit 1
}

echo "==> Updating server and installing Docker..."
ssh "root@$SERVER_IP" <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release rsync git

if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

docker compose version >/dev/null 2>&1 || {
  echo "ERROR: docker compose not available after install"
  exit 1
}
REMOTE

echo "==> Copying project to $APP_DIR..."
ssh "root@$SERVER_IP" "mkdir -p $APP_DIR"

# Sync everything except heavy/unnecessary local files.
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='.DS_Store' \
  -e 'ssh -o StrictHostKeyChecking=accept-new' \
  . "root@$SERVER_IP:$APP_DIR"

echo "==> Creating .env if missing..."
ssh "root@$SERVER_IP" <<'REMOTE'
set -euo pipefail
APP_DIR="/opt/armn"
cd "$APP_DIR"

if [ ! -f .env ]; then
  echo ".env not found, creating a minimal one for testing..."
  cat > .env <<'EOF'
PORT=8080
HOST=0.0.0.0
OBFUSCATE=true
COMPRESS=true
TRUST_PROXY=true
AUTH_CHALLENGE=false
EOF
fi
REMOTE

echo "==> Building and starting ARM\$N..."
ssh "root@$SERVER_IP" <<'REMOTE'
set -euo pipefail
APP_DIR="/opt/armn"
cd "$APP_DIR"

docker compose down 2>/dev/null || true
docker compose build --no-cache armn
docker compose up -d

# Simple health check
for i in {1..10}; do
  sleep 2
  if docker compose ps | grep -q "Up"; then
    echo "ARM\$N container is up."
    break
  fi
done
REMOTE

echo ""
echo "=========================================="
echo " ARM\$N deployed to http://$SERVER_IP"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  ssh root@$SERVER_IP"
echo "  cd $APP_DIR && docker compose logs -f armn"
echo ""
