#!/bin/bash
set -e

# Configuration
VM_USER="root"
VM_IP="209.38.206.101"
VM_DIR="/opt/multicamp"
IMAGE_NAME="langoread-landingpage"
SERVICE_NAME="langoreads-prod-landing"
TAR_FILE="${IMAGE_NAME}.tar"
SSH_KEY=~/.ssh/id_ed25519_personal

echo "🚀 Starting local deployment for ${IMAGE_NAME}..."

# 1. Build the Docker image for linux/amd64 architecture
echo "🔨 Building Docker image (${IMAGE_NAME}:latest) for linux/amd64..."
# We pass the NEXT_PUBLIC_APP_URL in case it's needed (similar to GitHub Actions)
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_APP_URL=https://app.langoread.io \
  -t ${IMAGE_NAME}:latest \
  -f Dockerfile .

# 2. Save the image to a tarball
echo "📦 Saving image to ${TAR_FILE}..."
docker save ${IMAGE_NAME}:latest > ${TAR_FILE}

# 3. SCP the tarball to the VM
echo "📤 Transferring ${TAR_FILE} to ${VM_USER}@${VM_IP}:${VM_DIR}/..."
scp -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new ${TAR_FILE} ${VM_USER}@${VM_IP}:${VM_DIR}/${TAR_FILE}

# 4. SSH into the VM, load, and deploy
echo "🔌 Connecting to VM to deploy..."
ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new ${VM_USER}@${VM_IP} bash -c "'
  set -e
  cd ${VM_DIR}
  
  echo \"📥 Loading Docker image from tarball...\"
  docker load -i ${TAR_FILE}
  
  # Ensure the image is tagged properly for the compose file
  docker tag ${IMAGE_NAME}:latest ghcr.io/aiopscamp/${IMAGE_NAME}:latest
  
  echo \"🔄 Restarting service ${SERVICE_NAME}...\"
  docker compose up -d --no-deps ${SERVICE_NAME}
  
  echo \"🧹 Cleaning up...\"
  rm -f ${TAR_FILE}
  docker image prune -f
  
  echo \"✅ Deployment finished on VM!\"
'"

# Local Cleanup
echo "🧹 Cleaning up local tarball..."
rm -f ${TAR_FILE}

echo "🎉 All done! LangoRead landing page deployed successfully."
