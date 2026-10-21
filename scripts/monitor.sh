#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
: "${MONITOR_URL:?Set MONITOR_URL to the public site URL}"
curl --fail --silent --show-error --max-time 15 "${MONITOR_URL%/}/api/health"
printf '\n'
for service in db backend frontend; do
  container=$(docker compose ps -q "$service")
  test -n "$container"
  health=$(docker inspect --format '{{.State.Health.Status}}' "$container")
  printf '%s: %s\n' "$service" "$health"
  test "$health" = healthy
done
usage=$(df -P . | awk 'NR==2 {gsub(/%/, "", $5); print $5}')
printf 'Disk used: %s%%\n' "$usage"
test "$usage" -lt 85
