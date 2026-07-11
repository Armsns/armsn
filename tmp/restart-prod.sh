#!/bin/bash
set +e

echo "=== kill any prior tsx/astro + free :8081 ==="
pkill -9 -f tsx 2>/dev/null
pkill -9 -f astro 2>/dev/null
sleep 5
lsof -ti :8081 2>/dev/null | xargs -r kill -9 2>/dev/null
sleep 3
echo "cleanup done"

echo "=== build (no rm -rf; astro rebuilds incrementally) ==="
npx astro build 2>&1 | tail -4
echo "build exit ok"

echo "=== start prod on :8081 ==="
PORT=8081 OBFUSCATE=false COMPRESS=false nohup npx tsx index.ts > /tmp/armn-routes.log 2>&1 &
disown
sleep 22

echo "=== proc + port ==="
ps aux | grep "tsx index" | grep -v grep | head -2
lsof -i :8081 2>/dev/null | head -3

echo "=== boot log (head) ==="
head -12 /tmp/armn-routes.log

echo "=== /api/ai/status ==="
curl -sS http://localhost:8081/api/ai/status -w "\nstatus=%{http_code}\n" --max-time 6

echo
echo "=== /api/ai/chat POST no-auth (expect 401 with API key required) ==="
curl -sS -X POST http://localhost:8081/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":"x"}' \
  -w "\nstatus=%{http_code}\n" \
  --max-time 6
