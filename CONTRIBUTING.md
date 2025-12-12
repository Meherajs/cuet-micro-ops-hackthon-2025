# Contributing to Delineate Hackathon Challenge

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/tamim2763/cuet-micro-ops-hackthon-2025.git
cd cuet-micro-ops-hackthon-2025

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development
make dev
# Or: npm run docker:dev
```

## 📋 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic

### 3. Run Checks

```bash
# Run all checks before committing
make check
# Or individually:
npm run lint          # Check for linting issues
npm run format:check  # Check formatting
npm run test:e2e      # Run tests
```

### 4. Commit Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type       | Description                 |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `docs`     | Documentation               |
| `style`    | Formatting (no code change) |
| `refactor` | Code restructure            |
| `test`     | Adding tests                |
| `chore`    | Maintenance                 |
| `ci`       | CI/CD changes               |

Example:

```bash
git commit -m "feat: add download progress tracking"
git commit -m "fix: resolve timeout issue on slow connections"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub.

## 🧪 Testing

```bash
# Run E2E tests
npm run test:e2e

# Run with Docker
make test
```

## 📁 Project Structure

```
├── src/               # Source code
├── scripts/           # Utility scripts
├── docker/            # Docker configurations
├── .github/           # GitHub Actions & templates
└── docs/              # Documentation
```

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) when creating issues.

## 💡 Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) for suggestions.

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow

## 🤝 Getting Help

- Check existing issues and documentation
- Ask questions in PR comments
- Reach out to maintainers

---

Thank you for contributing! 🎉
