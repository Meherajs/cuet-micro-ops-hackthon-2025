#!/bin/bash
set -e

# =============================================================================
# HACKATHON VM STARTUP SCRIPT - CUET Fest 2025
# Optimized for: Ubuntu 22.04/24.04 VM with MinIO (S3-compatible storage)
# =============================================================================

export DEBIAN_FRONTEND=noninteractive

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Starting VM setup for Hackathon..."

# =============================================================================
# SYSTEM UPDATE & ESSENTIAL TOOLS
# =============================================================================
log "📦 Updating system packages..."
apt-get update -y
apt-get upgrade -y

apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    wget \
    unzip \
    jq

# =============================================================================
# INSTALL DOCKER (Official method for Ubuntu)
# =============================================================================
log "🐳 Installing Docker..."

# Remove any old Docker installations
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Verify Docker
log "✅ Docker version: $(docker --version)"
log "✅ Docker Compose version: $(docker compose version)"

# =============================================================================
# PROJECT SETUP - CLONE REPOSITORY FIRST
# =============================================================================
log "📂 Setting up project directory..."

PROJECT_DIR="/opt/hackathon"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone repository into current directory
git clone https://github.com/tamim2763/cuet-micro-ops-hackthon-2025.git .

# Change to project directory (now contains the cloned files)
cd $PROJECT_DIR

# =============================================================================
# CREATE DATA DIRECTORIES
# =============================================================================
log "📁 Creating data directories..."

mkdir -p $PROJECT_DIR/minio-data

# =============================================================================
# CREATE .ENV FILE
# =============================================================================
log "⚙️ Creating environment configuration..."

cat > $PROJECT_DIR/.env << 'ENVEOF'
# Server Configuration
NODE_ENV=production
PORT=3000

# S3 Configuration (MinIO) - Credentials match docker-compose
S3_REGION=us-east-1
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minio_admin
S3_SECRET_ACCESS_KEY=minio_secret_key_2025
S3_BUCKET_NAME=downloads
S3_FORCE_PATH_STYLE=true

# Observability
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318

# Rate Limiting
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=*

# Download Delay Simulation
DOWNLOAD_DELAY_ENABLED=true
DOWNLOAD_DELAY_MIN_MS=10000
DOWNLOAD_DELAY_MAX_MS=120000
ENVEOF

# =============================================================================
# CREATE DOCKER COMPOSE WITH MINIO
# =============================================================================
log "🗄️ Creating Docker Compose with MinIO..."

cat > $PROJECT_DIR/docker-compose.yml << 'COMPOSEEOF'
name: delineate-hackathon

services:
  # ==========================================================================
  # Main Application
  # ==========================================================================
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.prod
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - S3_REGION=us-east-1
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY_ID=minio_admin
      - S3_SECRET_ACCESS_KEY=minio_secret_key_2025
      - S3_BUCKET_NAME=downloads
      - S3_FORCE_PATH_STYLE=true
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
    depends_on:
      minio-init:
        condition: service_completed_successfully
      jaeger:
        condition: service_started
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s

  # ==========================================================================
  # MinIO S3-Compatible Storage
  # ==========================================================================
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data
    environment:
      MINIO_ROOT_USER: minio_admin
      MINIO_ROOT_PASSWORD: minio_secret_key_2025
    command: server /data --console-address ":9001"
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  # ==========================================================================
  # MinIO Bucket Initialization
  # ==========================================================================
  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: /bin/sh
    command:
      - -c
      - |
        echo "Configuring MinIO client..."
        mc alias set myminio http://minio:9000 minio_admin minio_secret_key_2025
        echo "Creating downloads bucket..."
        mc mb --ignore-existing myminio/downloads
        echo "Setting bucket policy..."
        mc anonymous set download myminio/downloads
        echo "✅ Bucket [downloads] created successfully!"
        exit 0
    networks:
      - app-network

  # ==========================================================================
  # Jaeger for Distributed Tracing (OpenTelemetry)
  # ==========================================================================
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "4318:4318"
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  minio-data:
COMPOSEEOF

# =============================================================================
# CONFIGURE FIREWALL (Optional - skip if cloud firewall is used)
# =============================================================================
log "🔒 Configuring firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp      # SSH
    ufw allow 80/tcp      # HTTP
    ufw allow 443/tcp     # HTTPS
    ufw allow 3000/tcp    # API
    ufw allow 9000/tcp    # MinIO S3 API
    ufw allow 9001/tcp    # MinIO Console
    ufw allow 16686/tcp   # Jaeger UI
    ufw --force enable
    log "✅ Firewall configured"
else
    log "⚠️ ufw not found, skipping firewall configuration"
fi

# =============================================================================
# START SERVICES
# =============================================================================
log "🎯 Starting all services..."

cd $PROJECT_DIR

# Pull images first
log "📥 Pulling Docker images..."
docker compose pull

# Build and start all services
log "🏗️ Building and starting services..."
docker compose up -d --build

# Wait for services to initialize
log "⏳ Waiting for services to be ready (60 seconds)..."
sleep 60

# =============================================================================
# HEALTH CHECK
# =============================================================================
log "🏥 Checking service health..."

# Check container status
docker compose ps

# Check API health with retries
log "Checking API health..."
for i in {1..5}; do
    API_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "")
    if [ -n "$API_HEALTH" ]; then
        log "API Health: $API_HEALTH"
        break
    fi
    log "Attempt $i: API not ready, waiting 10 seconds..."
    sleep 10
done

# Check MinIO
log "Checking MinIO health..."
MINIO_HEALTH=$(curl -s http://localhost:9000/minio/health/live 2>/dev/null || echo "MinIO health check pending")
log "MinIO Health: $MINIO_HEALTH"

# =============================================================================
# COMPLETION
# =============================================================================
VM_IP=$(curl -s --connect-timeout 5 http://checkip.amazonaws.com 2>/dev/null || hostname -I | awk '{print $1}')

log "=============================================="
log "✅ SETUP COMPLETE!"
log "=============================================="
log ""
log "📍 Endpoints:"
log "   API:           http://$VM_IP:3000"
log "   API Docs:      http://$VM_IP:3000/docs"
log "   Health Check:  http://$VM_IP:3000/health"
log "   MinIO Console: http://$VM_IP:9001"
log "   Jaeger UI:     http://$VM_IP:16686"
log ""
log "🔐 MinIO Credentials: minio_admin / minio_secret_key_2025"
log ""
log "📋 Useful commands:"
log "   cd /opt/hackathon"
log "   docker compose logs -f        # View all logs"
log "   docker compose logs api -f    # View API logs"
log "   docker compose ps             # Check status"
log "   docker compose restart        # Restart all"
log "   docker compose down           # Stop all"
log "=============================================="
