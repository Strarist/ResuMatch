# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline is designed to be robust, secure, and production-ready.

## Workflow Files

### Main Pipeline: `.github/workflows/ci-cd.yml`

The main CI/CD pipeline that runs on every push to main and pull request.

#### Jobs:

1. **dependency-review** - Security scanning for dependencies
2. **lint-test-backend** - Backend linting, type checking, and testing
3. **lint-test-frontend** - Frontend linting, type checking, and testing
4. **build-and-push-images** - Docker image building and pushing
5. **deploy-staging** - Automated deployment to staging
6. **deploy-production** - Manual deployment to production

### Advanced Testing: `.github/workflows/test-matrix.yml`

Optional matrix testing across multiple Python versions (3.10, 3.11, 3.12).

## Features

### ✅ Security & Quality

- **Dependency Scanning**: GitHub's native dependency review
- **Linting**: ESLint (frontend), Flake8 (backend)
- **Type Checking**: TypeScript (frontend), MyPy (backend)
- **Testing**: Jest/Vitest (frontend), Pytest (backend)
- **Code Coverage**: Uploaded to Codecov and artifacts

### ✅ Build & Deploy

- **Docker Images**: Multi-tag strategy (sha, latest, branch-name)
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Deployment**: Render.com with health checks
- **Notifications**: Slack/Discord webhook integration

### ✅ Error Handling

- **Fail Fast**: `set -e` in all shell scripts
- **Health Checks**: Post-deployment verification
- **Notifications**: Success/failure alerts
- **Artifacts**: Build artifacts for debugging

## Required Secrets

Configure these secrets in your GitHub repository settings:

| Secret | Description | Example |
|--------|-------------|---------|
| `RENDER_API_URL` | Staging Render service URL | `https://api.render.com/v1/services/xxx` |
| `RENDER_API_KEY` | Staging Render API key | `rnd_xxx...` |
| `RENDER_API_URL_PROD` | Production Render service URL | `https://api.render.com/v1/services/yyy` |
| `RENDER_API_KEY_PROD` | Production Render API key | `rnd_yyy...` |
| `SLACK_WEBHOOK` | Slack webhook URL for notifications | `https://hooks.slack.com/services/xxx/yyy/zzz` |
| `STAGING_HEALTH_URL` | Staging health check endpoint | `https://staging.yourapp.com` |
| `PRODUCTION_HEALTH_URL` | Production health check endpoint | `https://yourapp.com` |

## Environment Setup

### Frontend Testing

The frontend uses:
- **Vitest** for testing
- **React Testing Library** for component testing
- **jsdom** for DOM simulation
- **TypeScript** for type checking

### Backend Testing

The backend uses:
- **Pytest** for testing
- **MyPy** for type checking
- **Flake8** for linting
- **Coverage.py** for code coverage

## Deployment Strategy

### Staging
- **Trigger**: Automatic on push to `main` branch
- **Environment**: Staging environment
- **Health Check**: Verifies deployment success
- **Notifications**: Slack alerts for success/failure

### Production
- **Trigger**: Manual via workflow dispatch
- **Environment**: Production environment
- **Health Check**: Verifies deployment success
- **Notifications**: Slack alerts for success/failure

## Docker Image Strategy

Images are tagged with:
- **Commit SHA**: `ghcr.io/owner/repo/backend:abc123`
- **Latest**: `ghcr.io/owner/repo/backend:latest`
- **Branch Name**: `ghcr.io/owner/repo/backend:main`

## Monitoring & Observability

### Health Checks
- Backend health endpoint: `/health`
- 60-second wait after deployment
- Automatic failure detection

### Metrics
- Prometheus metrics endpoint: `/metrics`
- Request/response tracking
- System resource monitoring

### Logging
- Structured logging with correlation IDs
- Request/response logging
- Error tracking and alerting

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check linting errors
   - Verify type checking
   - Review test failures

2. **Deployment Failures**
   - Verify Render API credentials
   - Check health endpoint availability
   - Review deployment logs

3. **Notification Issues**
   - Verify Slack webhook URL
   - Check webhook permissions
   - Test webhook manually

### Debugging

- **Artifacts**: Download build artifacts for inspection
- **Logs**: Check GitHub Actions logs for detailed error messages
- **Health Checks**: Verify endpoint availability manually

## Best Practices

1. **Branch Protection**: Enable branch protection on main
2. **Required Reviews**: Require PR reviews before merge
3. **Status Checks**: Require CI/CD to pass before merge
4. **Security Scanning**: Enable Dependabot alerts
5. **Regular Updates**: Keep dependencies updated

## Future Enhancements

- [ ] Performance testing
- [ ] Load testing with Locust
- [ ] Automated rollback on failure
- [ ] Blue-green deployment
- [ ] Canary deployments
- [ ] Integration with monitoring tools (DataDog, New Relic) 