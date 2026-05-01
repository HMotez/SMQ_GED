#!/bin/bash
set -e
# Stage certs from Windows bind-mount to a temp dir with correct ownership.
# Runs as root (postgres image entrypoint is root); postgres uid=70 in alpine.
mkdir -p /run/pg-ssl
cp /tmp/pg-ssl/server.crt /run/pg-ssl/server.crt
cp /tmp/pg-ssl/server.key /run/pg-ssl/server.key
chown 70:70  /run/pg-ssl/server.crt /run/pg-ssl/server.key
chmod 644    /run/pg-ssl/server.crt
chmod 600    /run/pg-ssl/server.key
exec /usr/local/bin/docker-entrypoint.sh "$@"
