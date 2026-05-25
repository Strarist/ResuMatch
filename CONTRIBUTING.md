# Contributing to ResuMatch

## Quick Start

```bash
# Clone
git clone https://github.com/Strarist/ResuMatch.git
cd ResuMatch

# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements-dev.txt
python -m spacy download en_core_web_sm

# Frontend
cd ../frontend
npm install

# Environment
cp .env.example .env
# Edit .env with your local credentials
```

## Development Commands

### Backend

```bash
cd backend
uvicorn app.main:app --reload          # Run dev server
pytest                                  # Run tests
ruff check .                           # Lint
ruff check . --fix                     # Lint + autofix
black .                                # Format
mypy app/                              # Type check
```

### Frontend

```bash
cd frontend
npm run dev                            # Run dev server
npm run build                          # Production build
npm run lint                           # ESLint
npx tsc --noEmit                       # Type check
```

## Commit Conventions

Format: `type(scope): description`

Types:
- `feat` — new feature
- `fix` — bug fix
- `chore` — maintenance (deps, config)
- `refactor` — code change that neither fixes nor adds
- `docs` — documentation only
- `test` — adding/fixing tests
- `security` — security-related changes

Examples:
```
feat(api): add batch analysis endpoint
fix(auth): handle expired refresh tokens
chore(deps): bump fastapi to 0.115.6
security: rotate JWT signing key
```

## Branch Naming

```
feat/short-description
fix/issue-number-description
chore/what-you-are-doing
```

## Pull Request Standards

1. Title follows commit convention format
2. Description explains what and why (not how)
3. All CI checks pass
4. No `console.log` or `print()` in production code
5. New features include tests
6. Breaking changes are documented

## Testing Expectations

- New API endpoints: at least one happy-path and one error-path test
- Bug fixes: include a regression test
- AI pipeline changes: include accuracy assertions
- Frontend components: snapshot or interaction test for complex logic

## Pre-commit Hooks

Hooks run automatically on `git commit`. If blocked:
- `detect-secrets`: check if you're committing a real secret
- `check-added-large-files`: file >500KB shouldn't be in git
- `no-commit-to-branch`: create a feature branch first

To bypass (use sparingly): `git commit --no-verify`
