# Enterprise DevOps Implementation Template v2.0

A comprehensive, stage-by-stage guide for implementing DevOps from code to production.
Based on real-world enterprise practices from Netflix, Google, Spotify, and Adobe.

---

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DEVOPS IMPLEMENTATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  0. GIT SETUP       1. CODE QUALITY    2. DOCKER         3. CI PIPELINE             │
│  ──────────────     ──────────────     ────────          ────────────               │
│  • .gitignore       • Linting          • Dockerfile.dev   • Build & Test            │
│  • .gitattributes   • Pre-commit       • Dockerfile.prod  • Security Scan           │
│  • Branch rules     • Commit format    • docker-compose   • Push Images             │
│                                        • Makefile                                    │
│                                                                                      │
│  4. CD PIPELINE     5. KUBERNETES      6. GITOPS          7. MONITORING             │
│  ────────────       ────────────       ────────           ────────────              │
│  • Staging deploy   • Deployments      • ArgoCD           • Prometheus              │
│  • Prod deploy      • Services, HPA    • Auto-sync        • Grafana                 │
│  • Versioning       • Security         • Environment      • AlertManager            │
│                     • Ingress          • separation       • Dashboards              │
│                                                                                      │
│  8. TESTING         9. OPTIONAL                                                      │
│  ────────           ────────                                                         │
│  • Unit Tests       • Service Mesh     • Centralized Logs  • Chaos Engineering      │
│  • Integration      • (Istio/Linkerd)  • (ELK/Loki)        • (Chaos Monkey)         │
│  • E2E Tests                                                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 0: Git & Repository Setup

### Files to Create

| File              | Purpose                             |
| ----------------- | ----------------------------------- |
| `.gitignore`      | Exclude files from version control  |
| `.gitattributes`  | Line endings, LFS, merge strategies |
| `README.md`       | Project documentation               |
| `LICENSE`         | Open source license (if applicable) |
| `CONTRIBUTING.md` | Contribution guidelines             |

### Tasks

- [ ] Create comprehensive `.gitignore`
- [ ] Configure `.gitattributes` for line endings
- [ ] Set up branch protection rules (main, develop)
- [ ] Configure CODEOWNERS for review requirements
- [ ] Create PR template
- [ ] Create issue templates

### .gitignore Template

```gitignore
# Dependencies
node_modules/
vendor/

# Environment
.env
.env.*
!.env.example

# Build outputs
dist/
build/
*.log

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Docker
*.tar
```

### .gitattributes Template

```
* text=auto eol=lf
*.{cmd,[cC][mM][dD]} text eol=crlf
*.{bat,[bB][aA][tT]} text eol=crlf
*.png binary
*.jpg binary
*.gif binary
```

---

## Stage 1: Code Quality & Developer Experience

### Files to Create

| File                   | Purpose                  |
| ---------------------- | ------------------------ |
| `.eslintrc.json`       | Linting rules            |
| `.prettierrc`          | Code formatting          |
| `.editorconfig`        | Editor consistency       |
| `commitlint.config.js` | Commit message format    |
| `.husky/pre-commit`    | Run lint on staged files |
| `.husky/commit-msg`    | Validate commit messages |
| `package.json`         | lint-staged config       |

### Tasks

- [ ] Set up ESLint with project-appropriate rules
- [ ] Configure Prettier for consistent formatting
- [ ] Create `.editorconfig` for editor consistency
- [ ] Install Husky for git hooks
- [ ] Configure lint-staged for pre-commit checks
- [ ] Set up commitlint for conventional commits
- [ ] Add npm scripts for lint/format

### Best Practices

```json
// package.json lint-staged config
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### Conventional Commit Types

| Type       | Description      | Example                           |
| ---------- | ---------------- | --------------------------------- |
| `feat`     | New feature      | `feat: add user authentication`   |
| `fix`      | Bug fix          | `fix: resolve login timeout`      |
| `docs`     | Documentation    | `docs: update API readme`         |
| `style`    | Formatting       | `style: fix indentation`          |
| `refactor` | Code restructure | `refactor: extract auth module`   |
| `test`     | Tests            | `test: add unit tests for auth`   |
| `chore`    | Maintenance      | `chore: update dependencies`      |
| `ci`       | CI changes       | `ci: add caching to workflow`     |
| `perf`     | Performance      | `perf: optimize database queries` |

---

## Stage 2: Docker Containerization

### Files to Create

| File                         | Purpose                                   |
| ---------------------------- | ----------------------------------------- |
| `backend/Dockerfile.dev`     | Development with hot-reload               |
| `backend/Dockerfile.prod`    | Optimized production build                |
| `backend/.dockerignore`      | Exclude from backend image                |
| `frontend/Dockerfile.dev`    | Development with HMR                      |
| `frontend/Dockerfile.prod`   | Multi-stage with Nginx                    |
| `frontend/.dockerignore`     | Exclude from frontend image               |
| `frontend/nginx.conf`        | Nginx configuration with security headers |
| `docker-compose.dev.yml`     | Local development                         |
| `docker-compose.staging.yml` | Staging simulation                        |
| `docker-compose.prod.yml`    | Production simulation                     |
| `Makefile`                   | Common commands                           |

### Tasks

- [ ] Create development Dockerfiles with hot-reload
- [ ] Create production Dockerfiles with multi-stage builds
- [ ] Configure non-root user in ALL production images
- [ ] Add HEALTHCHECK instruction to all images
- [ ] Create `.dockerignore` files
- [ ] Set up docker-compose for dev environment
- [ ] Set up docker-compose for staging environment
- [ ] Set up docker-compose for production simulation
- [ ] Create Makefile for common commands
- [ ] Configure Nginx with security headers (frontend)

### Backend Dockerfile.prod Template

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 app && adduser -u 1001 -G app -s /bin/sh -D app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=app:app . .

# Switch to non-root user
USER app

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
```

### Frontend Dockerfile.prod Template (with Nginx)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner

# Security: non-root user
RUN addgroup -g 1001 app && adduser -u 1001 -G app -s /bin/sh -D app
RUN chown -R app:app /var/cache/nginx /var/run /var/log/nginx

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

USER app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Security Headers Template

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    # API proxy (if needed)
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Compose Files

**docker-compose.dev.yml:**

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:5000/api
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/app_dev
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

**docker-compose.staging.yml:**

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=staging
      - MONGO_URI=mongodb://mongo:27017/app_staging
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    volumes:
      - mongo_staging:/data/db

volumes:
  mongo_staging:
```

### Makefile Template

```makefile
.PHONY: dev staging prod build clean logs

# Development
dev:
	docker-compose -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.dev.yml up --build

# Staging
staging:
	docker-compose -f docker-compose.staging.yml up

staging-build:
	docker-compose -f docker-compose.staging.yml up --build

# Production simulation
prod:
	docker-compose -f docker-compose.prod.yml up

prod-build:
	docker-compose -f docker-compose.prod.yml build

# Utilities
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.staging.yml down -v
	docker system prune -f

logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Testing
test:
	cd backend && npm test
	cd frontend && npm test

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

# Kubernetes
k8s-staging:
	kubectl apply -k k8s/overlays/staging

k8s-prod:
	kubectl apply -k k8s/overlays/prod
```

---

## Stage 3: CI Pipeline (Continuous Integration)

### Files to Create

| File                       | Purpose                      |
| -------------------------- | ---------------------------- |
| `.github/workflows/ci.yml` | Main CI pipeline             |
| `.github/dependabot.yml`   | Automated dependency updates |

### Tasks

- [ ] Create CI workflow triggered on push/PR
- [ ] Add dynamic change detection (dorny/paths-filter)
- [ ] Add linting job (only if code changed)
- [ ] Add unit/integration testing job
- [ ] Add security scanning (Trivy)
- [ ] Add Docker image build & push
- [ ] Configure caching (npm, Docker layers)
- [ ] Use immutable image tags (sha-<commit>)
- [ ] Fail on CRITICAL vulnerabilities
- [ ] Configure concurrency control
- [ ] Configure Dependabot for updates

### CI Pipeline Template

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
            frontend:
              - 'frontend/**'

  test-backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm test

  test-frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm test

  security-scan:
    needs: changes
    if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy
        uses: aquasecurity/trivy-action@0.28.0
        with:
          scan-type: "fs"
          scan-ref: "."
          severity: "CRITICAL,HIGH"
          exit-code: "1"

  build:
    needs: [test-backend, test-frontend, security-scan]
    if: always() && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile.prod
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/app-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/app-backend:sha-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Dependabot Template

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    groups:
      npm-dependencies:
        patterns:
          - "*"

  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    groups:
      npm-dependencies:
        patterns:
          - "*"

  - package-ecosystem: "docker"
    directory: "/backend"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## Stage 4: CD Pipeline (Continuous Deployment)

### Files to Create

| File                            | Purpose                  |
| ------------------------------- | ------------------------ |
| `.github/workflows/cd.yml`      | Deployment pipeline      |
| `.github/workflows/release.yml` | Semantic versioning      |
| `.releaserc.json`               | Semantic release config  |
| `CHANGELOG.md`                  | Auto-generated changelog |

### Tasks

- [ ] Create staging deployment workflow
- [ ] Create production deployment workflow
- [ ] Configure semantic-release
- [ ] Set up changelog generation
- [ ] Add concurrency control
- [ ] Configure environment protection rules
- [ ] Add deployment notifications

### Semantic Release Config

```json
{
  "branches": ["main"],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits"
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "conventionalcommits"
      }
    ],
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json"],
        "message": "chore(release): ${nextRelease.version}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

---

## Stage 5: Kubernetes Manifests

### Directory Structure

```
k8s/
├── base/
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── mongodb.yaml (StatefulSet)
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── secrets.yaml
│   ├── configmap.yaml
│   ├── network-policy.yaml
│   ├── rbac.yaml
│   ├── resource-quota.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
└── overlays/
    ├── staging/
    │   ├── kustomization.yaml
    │   ├── replicas-patch.yaml
    │   └── ingress-patch.yaml
    └── prod/
        ├── kustomization.yaml
        ├── replicas-patch.yaml
        └── ingress-patch.yaml
```

### Tasks

- [ ] Create base deployment manifests
- [ ] Add resource limits (requests & limits)
- [ ] Configure liveness & readiness probes
- [ ] Add SecurityContext (non-root, readonly filesystem)
- [ ] Create ServiceAccount with RBAC
- [ ] Set up HPA for auto-scaling
- [ ] Configure PDB for availability
- [ ] Create NetworkPolicies
- [ ] Set up ResourceQuotas & LimitRange
- [ ] Create StatefulSet for databases
- [ ] Configure Ingress with TLS
- [ ] Create Kustomize overlays per environment

### Deployment Template with Best Practices

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  labels:
    app: myapp
    component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
      component: backend
  template:
    metadata:
      labels:
        app: myapp
        component: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "5000"
    spec:
      serviceAccountName: app-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: myapp
                    component: backend
                topologyKey: kubernetes.io/hostname
      containers:
        - name: backend
          image: myregistry/backend:latest
          ports:
            - containerPort: 5000
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
```

---

## Stage 6: GitOps with ArgoCD

### Files to Create

| File                              | Purpose                      |
| --------------------------------- | ---------------------------- |
| `argocd/application-staging.yaml` | Staging app (auto-sync)      |
| `argocd/application-prod.yaml`    | Production app (manual sync) |
| `argocd/project.yaml`             | ArgoCD project definition    |

### Tasks

- [ ] Install ArgoCD in cluster
- [ ] Create ArgoCD Project
- [ ] Create Application for staging (auto-sync)
- [ ] Create Application for production (manual sync)
- [ ] Enable self-healing
- [ ] Enable pruning
- [ ] Configure retry policies
- [ ] Set up SSO (optional)
- [ ] Configure notifications

### ArgoCD Application Template

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo.git
    targetRevision: main
    path: k8s/overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

---

## Stage 7: Monitoring & Observability

### Components to Install

| Tool          | Purpose            | Install Method               |
| ------------- | ------------------ | ---------------------------- |
| Prometheus    | Metrics collection | Helm (kube-prometheus-stack) |
| Grafana       | Dashboards         | Included in stack            |
| AlertManager  | Alert routing      | Included in stack            |
| Nginx Ingress | Ingress controller | Helm or kubectl              |

### Tasks

- [ ] Install NGINX Ingress Controller
- [ ] Install kube-prometheus-stack via Helm
- [ ] Add Prometheus annotations to pods
- [ ] Configure ServiceMonitors
- [ ] Import Kubernetes dashboards
- [ ] Create custom app dashboards
- [ ] Configure AlertManager rules
- [ ] Set up notification channels
- [ ] Add hosts file entry for local testing

### Installation Commands

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install Prometheus Stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123
```

---

## Stage 8: Testing Strategy

### Types of Tests

| Level       | Tool        | When to Run     | Coverage Target |
| ----------- | ----------- | --------------- | --------------- |
| Unit        | Jest/Vitest | On every commit | 80%+            |
| Integration | Supertest   | On every PR     | Critical paths  |
| E2E         | Playwright  | Before release  | Happy paths     |

### Tasks

- [ ] Set up unit testing framework
- [ ] Configure test coverage reporting
- [ ] Create API integration tests
- [ ] Set up Playwright for E2E
- [ ] Add E2E smoke tests
- [ ] Integrate tests into CI pipeline
- [ ] Configure coverage thresholds

### Playwright Config Template

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Complete File Tree Reference

```
project/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # CI pipeline
│   │   ├── cd.yml                    # CD pipeline
│   │   └── release.yml               # Semantic release
│   ├── dependabot.yml                # Dependency updates
│   ├── CODEOWNERS                    # Review requirements
│   └── PULL_REQUEST_TEMPLATE.md      # PR template
├── .husky/
│   ├── pre-commit                    # Lint staged files
│   └── commit-msg                    # Validate commits
├── backend/
│   ├── src/
│   ├── Dockerfile.dev                # Dev with hot-reload
│   ├── Dockerfile.prod               # Multi-stage production
│   ├── .dockerignore
│   ├── package.json
│   └── .eslintrc.json
├── frontend/
│   ├── src/
│   ├── e2e/                          # Playwright tests
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod               # With Nginx
│   ├── nginx.conf                    # Security headers
│   ├── .dockerignore
│   ├── package.json
│   └── playwright.config.ts
├── k8s/
│   ├── base/
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── mongodb.yaml              # StatefulSet
│   │   ├── hpa.yaml
│   │   ├── pdb.yaml
│   │   ├── network-policy.yaml
│   │   ├── rbac.yaml
│   │   ├── resource-quota.yaml
│   │   ├── secrets.yaml
│   │   ├── configmap.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       ├── staging/
│       │   └── kustomization.yaml
│       └── prod/
│           └── kustomization.yaml
├── argocd/
│   ├── application-staging.yaml      # Auto-sync
│   └── application-prod.yaml         # Manual sync
├── docker-compose.dev.yml            # Local development
├── docker-compose.staging.yml        # Staging simulation
├── docker-compose.prod.yml           # Production simulation
├── Makefile                          # Common commands
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .releaserc.json                   # Semantic release
├── commitlint.config.js
├── package.json                      # Root with lint-staged
├── README.md
└── CHANGELOG.md                      # Auto-generated
```

---

## Implementation Timeline

| Phase           | Duration | Priority     | Dependencies |
| --------------- | -------- | ------------ | ------------ |
| 0. Git Setup    | 1 hour   | Must-have    | None         |
| 1. Code Quality | Half day | Must-have    | None         |
| 2. Docker       | 1 day    | Must-have    | Code Quality |
| 3. CI Pipeline  | 1 day    | Must-have    | Docker       |
| 4. CD Pipeline  | Half day | Must-have    | CI           |
| 5. Kubernetes   | 2 days   | Must-have    | Docker       |
| 6. ArgoCD       | Half day | Should-have  | Kubernetes   |
| 7. Monitoring   | 1 day    | Should-have  | Kubernetes   |
| 8. E2E Testing  | 1 day    | Nice-to-have | CI           |

---

## Industry Standards Reference

| Practice             | Used By                   | Standard             |
| -------------------- | ------------------------- | -------------------- |
| GitOps (ArgoCD)      | Netflix, Intuit, Adobe    | CNCF Graduated       |
| Kustomize            | Google, Spotify           | Kubernetes Native    |
| Prometheus/Grafana   | SoundCloud, DigitalOcean  | CNCF Graduated       |
| Conventional Commits | Angular, Vue, React       | Semantic Versioning  |
| Multi-stage Docker   | All modern deployments    | Docker Best Practice |
| Non-root containers  | PCI-DSS, SOC2 compliance  | Security Standard    |
| HPA + PDB            | All production K8s        | High Availability    |
| NetworkPolicies      | Enterprise security teams | Zero-trust network   |

---

## Quick Start Commands

```bash
# 1. Local Development
make dev

# 2. Run Tests
make test

# 3. Build Production Images
make prod-build

# 4. Deploy to Staging K8s
make k8s-staging

# 5. Access Monitoring
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
```

---

## Stage 9: Advanced Topics

### 9.1 Secret Management

#### Option A: Sealed Secrets (GitOps-compatible)

```bash
# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create sealed secret
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# Commit sealed-secret.yaml to Git (safe!)
```

#### Option B: External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: app-secrets
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/database
        property: password
```

### 9.2 Deployment Strategies

#### Blue-Green Deployment

```yaml
# Service switches between blue and green
apiVersion: v1
kind: Service
metadata:
  name: app
spec:
  selector:
    app: myapp
    version: green # Switch to 'blue' for rollback
```

#### Canary Deployment (with Ingress)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "20" # 20% traffic
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            backend:
              service:
                name: app-canary
                port: 80
```

### 9.3 Database Migrations in Kubernetes

```yaml
# Job to run migrations before deployment
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: myapp:latest
          command: ["npm", "run", "migrate"]
          envFrom:
            - secretRef:
                name: app-secrets
```

### 9.4 Backup & Disaster Recovery

#### Database Backup CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongodb-backup
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: mongo:7
              command:
                - /bin/sh
                - -c
                - |
                  mongodump --uri=$MONGO_URI --archive=/backup/$(date +%Y%m%d).gz --gzip
              volumeMounts:
                - name: backup-volume
                  mountPath: /backup
          volumes:
            - name: backup-volume
              persistentVolumeClaim:
                claimName: backup-pvc
          restartPolicy: OnFailure
```

#### Disaster Recovery Checklist

- [ ] Database backups verified and restorable
- [ ] All secrets stored in external secret manager
- [ ] Infrastructure as Code (IaC) in version control
- [ ] Runbooks documented and tested
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined
- [ ] Failover procedure tested quarterly

---

## Stage 10: Operational Runbooks

### Runbook 1: High CPU Alert Response

**Alert:** `HighCPUUsage > 80% for 5 minutes`

**Steps:**

1. **Identify affected pods:**

   ```bash
   kubectl top pods -n <namespace> --sort-by=cpu
   ```

2. **Check for anomalies:**

   ```bash
   kubectl describe pod <pod-name> -n <namespace>
   kubectl logs <pod-name> -n <namespace> --tail=100
   ```

3. **Immediate mitigation:**

   ```bash
   # Scale up replicas
   kubectl scale deployment <name> --replicas=5 -n <namespace>
   ```

4. **Root cause analysis:**
   - Check Grafana for traffic spike
   - Review recent deployments
   - Check for infinite loops or memory leaks

5. **Resolution:**
   - Fix code issue or optimize queries
   - Adjust HPA thresholds if needed

---

### Runbook 2: Pod CrashLoopBackOff

**Alert:** Pod restarting repeatedly

**Steps:**

1. **Get pod status:**

   ```bash
   kubectl get pods -n <namespace>
   kubectl describe pod <pod-name> -n <namespace>
   ```

2. **Check logs (including previous container):**

   ```bash
   kubectl logs <pod-name> -n <namespace>
   kubectl logs <pod-name> -n <namespace> --previous
   ```

3. **Common causes:**
   | Symptom | Likely Cause | Fix |
   |---------|--------------|-----|
   | OOMKilled | Memory limit too low | Increase memory limit |
   | Exit code 1 | Application error | Check logs, fix code |
   | Exit code 137 | Killed by OOM | Increase memory |
   | Exit code 143 | SIGTERM received | Check probe timeouts |
   | Liveness probe failed | App not responding | Increase initialDelaySeconds |

4. **Quick fixes:**

   ```bash
   # Restart deployment
   kubectl rollout restart deployment <name> -n <namespace>

   # Rollback to previous version
   kubectl rollout undo deployment <name> -n <namespace>
   ```

---

### Runbook 3: Database Connection Issues

**Alert:** `MongoDBConnectionError` or `ConnectionRefused`

**Steps:**

1. **Check database pod:**

   ```bash
   kubectl get pods -n <namespace> -l component=mongodb
   kubectl logs mongodb-0 -n <namespace>
   ```

2. **Test connectivity:**

   ```bash
   # Exec into backend pod
   kubectl exec -it <backend-pod> -n <namespace> -- sh

   # Test DNS resolution
   nslookup mongodb

   # Test connection
   nc -zv mongodb 27017
   ```

3. **Check secrets:**

   ```bash
   kubectl get secret app-secrets -n <namespace> -o yaml
   # Verify MONGO_URI is correct
   ```

4. **Common fixes:**
   - Restart MongoDB StatefulSet
   - Check PersistentVolume status
   - Verify NetworkPolicy allows traffic

---

### Runbook 4: Rollback Procedure

**When to rollback:** Deployment causes errors, performance degradation, or outage.

**Steps:**

1. **Identify current and previous revision:**

   ```bash
   kubectl rollout history deployment <name> -n <namespace>
   ```

2. **Rollback to previous version:**

   ```bash
   kubectl rollout undo deployment <name> -n <namespace>
   ```

3. **Rollback to specific version:**

   ```bash
   kubectl rollout undo deployment <name> -n <namespace> --to-revision=3
   ```

4. **Verify rollback:**

   ```bash
   kubectl rollout status deployment <name> -n <namespace>
   kubectl get pods -n <namespace>
   ```

5. **ArgoCD rollback:**
   - Go to ArgoCD UI
   - Click "History and Rollback"
   - Select previous sync
   - Click "Rollback"

6. **Post-rollback:**
   - [ ] Verify application is healthy
   - [ ] Create incident report
   - [ ] Fix issue in code
   - [ ] Add tests to prevent recurrence

---

### Runbook 5: Certificate Expiry

**Alert:** TLS certificate expiring within 30 days

**Steps:**

1. **Check current certificate:**

   ```bash
   kubectl get secret <tls-secret> -n <namespace> -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout | grep "Not After"
   ```

2. **If using cert-manager:**

   ```bash
   kubectl get certificate -n <namespace>
   kubectl describe certificate <name> -n <namespace>

   # Force renewal
   kubectl delete secret <tls-secret> -n <namespace>
   ```

3. **Manual renewal:**
   ```bash
   kubectl create secret tls <name> \
     --cert=new-cert.pem \
     --key=new-key.pem \
     -n <namespace> \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

---

## Stage 11: Troubleshooting Guide

### Docker Issues

| Problem                           | Cause                      | Solution                          |
| --------------------------------- | -------------------------- | --------------------------------- |
| `Cannot connect to Docker daemon` | Docker not running         | Start Docker Desktop              |
| `permission denied`               | User not in docker group   | `sudo usermod -aG docker $USER`   |
| `no space left on device`         | Docker using too much disk | `docker system prune -a`          |
| `port already in use`             | Another process on port    | `lsof -i :5000` then kill process |
| `image not found`                 | Wrong registry/tag         | Check image name and login        |
| Build fails with OOM              | Not enough memory          | Increase Docker memory limit      |

### Docker Compose Issues

| Problem                     | Cause                             | Solution                                    |
| --------------------------- | --------------------------------- | ------------------------------------------- |
| `pull access denied`        | Image doesn't exist or auth issue | Remove `image:` line, use only `build:`     |
| `network not found`         | Network deleted                   | `docker-compose down && docker-compose up`  |
| Volumes not syncing         | Host path issue                   | Check volume mount paths                    |
| Container exits immediately | CMD fails                         | Check logs: `docker-compose logs <service>` |

### Kubernetes Issues

| Problem                      | Cause                    | Solution                                           |
| ---------------------------- | ------------------------ | -------------------------------------------------- |
| `ImagePullBackOff`           | Can't pull image         | Check image name, registry login                   |
| `CrashLoopBackOff`           | App crashing             | Check logs: `kubectl logs <pod> --previous`        |
| `Pending` pod                | No resources             | Check nodes, resource requests                     |
| `CreateContainerConfigError` | Secret/ConfigMap missing | Create the missing resource                        |
| `ErrImagePull`               | Auth required            | Create imagePullSecret                             |
| Service not accessible       | Wrong selector           | Verify labels match between deployment and service |
| Ingress not working          | No Ingress Controller    | Install nginx-ingress                              |

### Kubectl Debugging Commands

```bash
# Get all resources in namespace
kubectl get all -n <namespace>

# Describe pod (see events)
kubectl describe pod <name> -n <namespace>

# Get pod logs
kubectl logs <pod> -n <namespace>
kubectl logs <pod> -n <namespace> --previous  # crashed container
kubectl logs <pod> -n <namespace> -f  # follow logs

# Exec into pod
kubectl exec -it <pod> -n <namespace> -- /bin/sh

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# Debug networking
kubectl run debug --image=busybox -it --rm -- sh
nslookup <service-name>
wget -qO- <service-name>:<port>/health
```

### CI/CD Issues

| Problem                             | Cause                 | Solution                         |
| ----------------------------------- | --------------------- | -------------------------------- |
| Pipeline times out                  | Long running tests    | Add caching, parallelize jobs    |
| `DOCKER_USERNAME` not set           | Secret not configured | Add secret in repo settings      |
| Trivy scan fails                    | Vulnerabilities found | Fix or ignore non-critical       |
| Semantic release skips              | No feat/fix commits   | Use conventional commits         |
| CD not triggering                   | Wrong branch filter   | Check `on:` triggers in workflow |
| `paths` and `paths-ignore` conflict | Can't use both        | Use only one of them             |

### ArgoCD Issues

| Problem              | Cause                    | Solution                                                    |
| -------------------- | ------------------------ | ----------------------------------------------------------- |
| `OutOfSync`          | Manual changes made      | Enable self-heal or sync                                    |
| `Unknown`            | Can't reach cluster      | Check network, kubeconfig                                   |
| App stuck syncing    | Resource waiting         | Check `kubectl get events`                                  |
| Can't access UI      | Port-forward not running | `kubectl port-forward svc/argocd-server -n argocd 8080:443` |
| SSL error in browser | Self-signed cert         | Type `thisisunsafe` or use http                             |

### Monitoring Issues

| Problem                    | Cause                     | Solution                       |
| -------------------------- | ------------------------- | ------------------------------ |
| No metrics in Grafana      | Prometheus not scraping   | Check pod annotations          |
| Targets down in Prometheus | Service not found         | Verify ServiceMonitor selector |
| AlertManager not sending   | Wrong config              | Check alertmanager.yml         |
| Node exporter failing      | Docker Desktop limitation | Ignore for local dev           |

---

## Quick Reference: Emergency Commands

```bash
# === IMMEDIATE RESPONSE ===

# Rollback deployment NOW
kubectl rollout undo deployment <name> -n <namespace>

# Scale down to 0 (stop traffic)
kubectl scale deployment <name> --replicas=0 -n <namespace>

# Delete problematic pod (new one will start)
kubectl delete pod <pod-name> -n <namespace>

# Force sync in ArgoCD
kubectl patch application <app> -n argocd --type merge -p '{"operation":{"sync":{"force":true}}}'

# === INVESTIGATION ===

# What's happening right now?
kubectl get pods -n <namespace> -w

# Recent events
kubectl get events -n <namespace> --sort-by='.lastTimestamp' | tail -20

# Resource usage
kubectl top pods -n <namespace>
kubectl top nodes

# === RECOVERY ===

# Restart all pods in deployment
kubectl rollout restart deployment <name> -n <namespace>

# Restore from ArgoCD history
# Go to ArgoCD UI → App → History → Rollback

# Force re-pull image
kubectl set image deployment/<name> <container>=<image>:latest -n <namespace>
```
