#!/bin/bash
# deploy.sh — Deploy MiMo Code (Sakuranda fork) to OCI server
# Usage: bash deploy.sh
# Prerequisites: sshpass installed locally, server reachable

set -e

SERVER="45.125.33.88"
PORT="63195"
USER="root"
PASS="n4P8gvDmvOCck787lk"
REPO="https://github.com/Sakuranda/MiMo-Code.git"
BRANCH="feat/file-upload-download-mobile"
INSTALL_DIR="/opt/mimocode"
BINARY="/usr/local/bin/mimocode"

ssh_run() {
  sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$SERVER" "$@"
}

echo "=== Pulling latest code ==="
ssh_run "
  export PATH=\$HOME/.bun/bin:\$PATH
  cd $INSTALL_DIR
  git pull origin $BRANCH
"

echo "=== Building frontend ==="
ssh_run "
  export PATH=\$HOME/.bun/bin:\$PATH
  cd $INSTALL_DIR/packages/app
  bun run build
"

echo "=== Building backend binary (linux-x64) ==="
ssh_run "
  export PATH=\$HOME/.bun/bin:\$PATH
  cd $INSTALL_DIR/packages/opencode
  OPENCODE_BUILD_TARGET=linux-x64 bun run build
"

echo "=== Installing binary ==="
ssh_run "
  cp $INSTALL_DIR/packages/opencode/dist/mimocode-linux-x64/bin/mimo $BINARY
  chmod +x $BINARY
  $BINARY --version
"

echo "=== Restarting service ==="
ssh_run "
  systemctl restart mimocode
  sleep 2
  systemctl status mimocode --no-pager | head -8
"

echo "=== Done. Site: https://yxai.sakuranda.site ==="
