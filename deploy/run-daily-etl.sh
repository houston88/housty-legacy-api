#!/usr/bin/env bash
# Daily BlueSky Jetstream ETL runner for DigitalOcean Droplet
set -euo pipefail

cd /opt/housty-api

echo "[$(date -Is)] Starting daily 10-minute BlueSky Jetstream ETL..."
/usr/bin/node /opt/housty-api/etl/index.js --duration 600

echo "[$(date -Is)] Restarting housty-api.service to reload in-memory SQLite database..."
systemctl restart housty-api.service

echo "[$(date -Is)] Daily BlueSky ETL complete."
