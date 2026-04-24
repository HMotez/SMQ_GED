#!/bin/bash
# Generates a self-signed TLS certificate for PostgreSQL on first startup.
# Placed in /docker-entrypoint-initdb.d/ — runs once when pgdata is empty.

set -e

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
CERT="$PGDATA/server.crt"
KEY="$PGDATA/server.key"

if [[ ! -f "$CERT" ]]; then
  echo "[DB-SSL] Génération du certificat auto-signé PostgreSQL..."
  openssl req -new -x509 -days 365 -nodes \
    -subj "/CN=smq-postgres" \
    -keyout "$KEY" \
    -out "$CERT"
  chmod 600 "$KEY"
  chown postgres:postgres "$CERT" "$KEY"
  echo "[DB-SSL] Certificat généré : $CERT"
fi
