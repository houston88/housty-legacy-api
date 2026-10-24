#!/usr/bin/env bash
# Provisioning script for a fresh Ubuntu 24.04 LTS DigitalOcean Droplet
set -euo pipefail

echo "=== 1. Creating 2GB Swap File (if not already present) ==="
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap created and enabled."
else
    echo "/swapfile already exists."
fi

echo "=== 2. Installing System Packages, Nginx, and Certbot ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg nginx rsync
if ! command -v certbot >/dev/null 2>&1; then
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
fi

echo "=== 3. Installing Node.js 24 LTS ==="
if ! node -v 2>/dev/null | grep -q '^v24\.'; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
fi
node -v
npm -v

echo "=== 4. Installing Tailscale ==="
if ! command -v tailscale >/dev/null 2>&1; then
    curl -fsSL https://tailscale.com/install.sh | sh
fi

echo "=== 5. Preparing Application Directories ==="
mkdir -p /opt/housty-api /var/www/housty-home-react

echo "=== Provisioning Complete! ==="

