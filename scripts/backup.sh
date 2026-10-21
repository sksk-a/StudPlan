#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
umask 077
mkdir -p backups
target="backups/studplan-$(date -u +%Y%m%dT%H%M%SZ).dump"
trap 'rm -f "$target.partial"' EXIT HUP INT TERM
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$target.partial"
test -s "$target.partial"
mv "$target.partial" "$target"
printf 'Backup: %s\n' "$target"
