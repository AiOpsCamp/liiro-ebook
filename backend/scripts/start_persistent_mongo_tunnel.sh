#!/bin/bash
while true; do
  if ! nc -z 127.0.0.1 27018 >/dev/null 2>&1; then
    echo "[$(date)] Port 27018 not listening. Establishing persistent SSH tunnel..."
    kill -9 $(lsof -t -i:27018) 2>/dev/null || true
    ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no -o ServerAliveInterval=10 -o ServerAliveCountMax=3 -N -L 27018:10.43.172.242:27017 root@46.224.188.251
  fi
  sleep 3
done
