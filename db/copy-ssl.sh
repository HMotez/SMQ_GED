#!/bin/bash
# Runs once after initdb (as postgres user). Reads from /run/pg-ssl (chowned
# by entrypoint), copies into PGDATA, and enables ssl in postgresql.conf.
set -e
cp /run/pg-ssl/server.crt "$PGDATA/server.crt"
cp /run/pg-ssl/server.key "$PGDATA/server.key"
chmod 644 "$PGDATA/server.crt"
chmod 600 "$PGDATA/server.key"
cat >> "$PGDATA/postgresql.conf" <<'EOF'

# SSL — written by copy-ssl.sh on first init (persists in pgdata volume)
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file  = 'server.key'
EOF
echo "[DB-SSL] SSL enabled in postgresql.conf."
