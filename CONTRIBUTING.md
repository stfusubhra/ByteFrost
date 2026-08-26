# ByteFrost - Contributing Guide

## Branch Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- `feature/<name>` — Feature branches
- `fix/<name>` — Bug fix branches

## Development Workflow

1. Pull latest `develop`
2. Create feature branch: `git checkout -b feature/my-feature develop`
3. Make changes, write tests
4. Push and create PR to `develop`
5. Get at least 1 review
6. Merge

## Commit Messages

Use conventional commits:
- `feat: add farmer registration API`
- `fix: resolve listing filter bug`
- `docs: update API documentation`
- `test: add order creation tests`
- `chore: update dependencies`

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints
- Docstrings for public functions
- Run `ruff check` before committing

### TypeScript (Frontend)
- Use ESLint + Prettier
- Prefer functional components
- Use TypeScript interfaces over types
- Run `npm run lint` before committing

## Testing

### Backend
```bash
cd backend
pytest -v
```

### Frontend
```bash
cd frontend
npm run type-check
npm run lint
```

## Environment Setup

See README.md for full setup instructions.

## PR Template

```
## What
Brief description of changes

## Why
Link to issue or explain motivation

## How
Implementation approach

## Testing
How to verify the changes work

## Checklist
- [ ] Tests pass
- [ ] No lint errors
- [ ] Documentation updated (if needed)
```
