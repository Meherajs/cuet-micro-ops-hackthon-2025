# Makefile for DevOps operations
# Usage: make <target>

.PHONY: help dev prod test lint format clean logs status

# Default target
help:
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║           Delineate Hackathon - DevOps Commands              ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║  Development                                                 ║"
	@echo "║    make dev          Start development environment           ║"
	@echo "║    make dev-build    Rebuild and start development           ║"
	@echo "║    make logs         View container logs                     ║"
	@echo "║    make status       Show container status                   ║"
	@echo "║                                                              ║"
	@echo "║  Production                                                  ║"
	@echo "║    make prod         Start production environment            ║"
	@echo "║    make prod-build   Rebuild and start production            ║"
	@echo "║                                                              ║"
	@echo "║  Testing & Quality                                           ║"
	@echo "║    make test         Run E2E tests                           ║"
	@echo "║    make lint         Run ESLint                              ║"
	@echo "║    make format       Format code with Prettier               ║"
	@echo "║    make check        Run all checks (lint + format + test)   ║"
	@echo "║    make security     Run security audit                      ║"
	@echo "║                                                              ║"
	@echo "║  Cleanup                                                     ║"
	@echo "║    make clean        Stop and remove all containers/volumes  ║"
	@echo "║    make clean-all    Full cleanup including images           ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"

# Development
dev:
	docker compose -f docker/compose.dev.yml up

dev-build:
	docker compose -f docker/compose.dev.yml up --build

dev-detach:
	docker compose -f docker/compose.dev.yml up -d

# Production
prod:
	docker compose -f docker/compose.prod.yml up

prod-build:
	docker compose -f docker/compose.prod.yml up --build -d

# Testing & Quality
test:
	npm run test:e2e

lint:
	npm run lint

format:
	npm run format

format-check:
	npm run format:check

check:
	npm run lint && npm run format:check && npm run test:e2e

security:
	npm run security:audit

# Logs & Status
logs:
	docker compose -f docker/compose.dev.yml logs -f

logs-app:
	docker compose -f docker/compose.dev.yml logs -f delineate-app

status:
	docker compose -f docker/compose.dev.yml ps

# Cleanup
clean:
	docker compose -f docker/compose.dev.yml down -v
	docker compose -f docker/compose.prod.yml down -v

clean-all:
	docker compose -f docker/compose.dev.yml down -v --rmi local
	docker compose -f docker/compose.prod.yml down -v --rmi local
	docker system prune -f
