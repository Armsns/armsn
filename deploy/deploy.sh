#!/bin/bash
set -euo pipefail

# Local deploy script for DigitalOcean droplet
# Usage:
#   SUPABASE_SERVICE_KEY=<key> ./deploy/deploy.sh <SSH_KEY_PATH> <AUTH_USER> <AUTH_PASS> [DB_PASSWORD]

DROPLET_IP="147.182.214.246"
DROPLET_USER="root"
SSH_KEY="${1:-}"
AUTH_USER="${2:-}"
AUTH_PASS="${3:-}"
DB_PASSWORD="${4:-}"

SUPABASE_URL="https://reuujxdvrkeqjnlgsllz.supabase.co"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldXVqeGR2cmtlcWpubGdzbGx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzczMjE3MCwiZXhwIjoyMDk5MzA4MTcwfQ.hrGMS7ywVfM05O1sNIEFMyz1CO72xAece3bZwJP705o}"

if [ -z "$SSH_KEY" ] || [ -z "$AUTH_USER" ] || [ -z "$AUTH_PASS" ]; then
  echo "Usage: SUPABASE_SERVICE_KEY=<key> $0 <SSH_KEY_PATH> <AUTH_USER> <AUTH_PASS> [DB_PASSWORD]"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_KEY environment variable is required."
  exit 1
fi

if [ ! -f "$SSH_KEY" ]; then
  echo "SSH key not found: $SSH_KEY"
  exit 1
fi

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null"

# Upload current working tree (excluding node_modules, dist, .git, env files)
echo "==> Uploading project to droplet"
rsync -avz --delete \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  --exclude=.env \
  --exclude=.env.* \
  -e "ssh $SSH_OPTS" \
  "$(pwd)/" "$DROPLET_USER@$DROPLET_IP:/tmp/armsn-deploy/"

# Run the installer on the droplet
echo "==> Running installer on droplet"
ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "sudo bash /tmp/armsn-deploy/deploy/install.sh"

# Write the real .env file
echo "==> Writing production .env"
SYNC_TOKEN=$(openssl rand -hex 32)
ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "sudo tee /home/armsn/app/.env > /dev/null" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
AUTH_USER=$AUTH_USER
AUTH_PASS=$AUTH_PASS
ADMIN_USER=$AUTH_USER
PORT=8080
OBFUSCATE=false
COMPRESS=true
AUTH_CHALLENGE=true
SYNC_TOKEN=$SYNC_TOKEN
NODE_ENV=production
FIRST=false
EOF
ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "sudo chmod 600 /home/armsn/app/.env && sudo chown armsn:armsn /home/armsn/app/.env"

# Apply Supabase schema if DB password was provided
if [ -n "$DB_PASSWORD" ]; then
  echo "==> Applying Supabase schema"
  DB_HOST="db.reuujxdvrkeqjnlgsllz.supabase.co"
  ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "PGPASSWORD='$DB_PASSWORD' psql 'postgresql://postgres:$DB_PASSWORD@$DB_HOST:5432/postgres' -f /home/armsn/app/supabase/schema.sql" || {
    echo "WARNING: Failed to apply schema. You may need to run supabase/schema.sql manually in the Supabase SQL Editor."
  }
fi

# Restart the service
echo "==> Restarting armn service"
ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "sudo systemctl daemon-reload && sudo systemctl restart armn"

# Health check
echo "==> Waiting for app to start"
sleep 5
if ! ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "sudo systemctl is-active --quiet armn"; then
  echo "ERROR: armn service is not active"
  ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "sudo systemctl status armn --no-pager"
  exit 1
fi

if ! ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_IP" "curl -fsS http://localhost:8080/login >/dev/null"; then
  echo "ERROR: App is not responding on port 8080"
  exit 1
fi

echo "==> Deploy complete. App is running at http://$DROPLET_IP:8080"
echo "==> Make sure DigitalOcean cloud firewall allows TCP port 8080."
