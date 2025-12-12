# VM Migration Guide

## Overview

Migrate from "git pull + build on VM" to "Docker Hub + pull pre-built images".

---

## Step 1: Configure GitHub Secrets

Go to repo **Settings → Secrets → Actions** and add:

| Secret               | Value                         |
| -------------------- | ----------------------------- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username      |
| `DOCKERHUB_TOKEN`    | Docker Hub access token       |
| `VM_HOST`            | VM IP address                 |
| `VM_USER`            | SSH username (e.g., `ubuntu`) |
| `VM_SSH_KEY`         | Private SSH key content       |

---

## Step 2: Prepare VM (One-time setup)

SSH into your VM and run:

```bash
# Navigate to project directory
cd /opt/hackathon

# Pull latest code
git pull origin main

# Create env file if not exists
cp .env.example .env
# Edit .env with your production values

# Stop old containers
docker compose -f docker/compose.prod.yml down

# Switch to registry-based compose
docker compose -f docker/compose.registry.yml pull
docker compose -f docker/compose.registry.yml up -d

# Verify
curl http://localhost:3000/health
```

---

## Step 3: Push Code to GitHub

After VM is ready:

```bash
git add .
git commit -m "feat: implement DevOps best practices"
git push origin main
```

This triggers:

1. **CI** → Lint, Test, Build image
2. **CD** → Push to Docker Hub, SSH to VM, Pull & restart

---

## Step 4: Verify CD Pipeline

Check GitHub Actions → CD workflow should:

1. Run tests ✓
2. Push to Docker Hub ✓
3. SSH to VM and pull image ✓
4. Health check passes ✓

---

## Rollback Plan

If something goes wrong:

```bash
# SSH to VM
ssh user@your-vm-ip

# Roll back to previous image
cd /opt/hackathon
export IMAGE_TAG=<previous-sha>
docker compose -f docker/compose.registry.yml pull
docker compose -f docker/compose.registry.yml up -d
```

---

## Files Changed for CD

| File                          | Purpose                        |
| ----------------------------- | ------------------------------ |
| `.github/workflows/cd.yml`    | Push → Build → Deploy pipeline |
| `docker/compose.registry.yml` | Pull images from Docker Hub    |
