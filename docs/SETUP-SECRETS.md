# GitHub Secrets Setup Guide

## Quick Setup

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret below

## Required Secrets

### Render.com Deployment Secrets

#### Staging Environment
- **Name**: `RENDER_API_URL`
- **Value**: `https://api.render.com/v1/services/YOUR_STAGING_SERVICE_ID`
- **Description**: Your staging service API endpoint

- **Name**: `RENDER_API_KEY`
- **Value**: `rnd_YOUR_STAGING_API_KEY`
- **Description**: Your Render API key for staging

#### Production Environment
- **Name**: `RENDER_API_URL_PROD`
- **Value**: `https://api.render.com/v1/services/YOUR_PRODUCTION_SERVICE_ID`
- **Description**: Your production service API endpoint

- **Name**: `RENDER_API_KEY_PROD`
- **Value**: `rnd_YOUR_PRODUCTION_API_KEY`
- **Description**: Your Render API key for production

### Health Check URLs
- **Name**: `STAGING_HEALTH_URL`
- **Value**: `https://your-staging-app.onrender.com`
- **Description**: Your staging app's base URL

- **Name**: `PRODUCTION_HEALTH_URL`
- **Value**: `https://your-production-app.com`
- **Description**: Your production app's base URL

### Notifications
- **Name**: `SLACK_WEBHOOK`
- **Value**: `https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK`
- **Description**: Slack webhook URL for deployment notifications

## How to Get These Values

### Render.com API Keys
1. Log into your Render.com account
2. Go to **Account Settings** → **API Keys**
3. Create a new API key
4. Copy the key (starts with `rnd_`)

### Render.com Service IDs
1. Go to your service dashboard on Render
2. The service ID is in the URL: `https://dashboard.render.com/web/YOUR_SERVICE_ID`
3. Use this format: `https://api.render.com/v1/services/YOUR_SERVICE_ID`

### Slack Webhook
1. Go to your Slack workspace
2. Create a new app or use existing one
3. Enable **Incoming Webhooks**
4. Create a webhook for your channel
5. Copy the webhook URL

## Testing Your Setup

After setting up all secrets:

1. Make a small change to trigger the pipeline
2. Check the GitHub Actions tab
3. Verify that:
   - All jobs complete successfully
   - Docker images are built and pushed
   - Deployment notifications are sent
   - Health checks pass

## Troubleshooting

### Common Issues

**"Secret not found" errors**
- Double-check secret names (case-sensitive)
- Ensure secrets are added to the correct repository

**Deployment failures**
- Verify Render API keys are valid
- Check service IDs are correct
- Ensure your Render account has proper permissions

**Health check failures**
- Verify health check URLs are accessible
- Check that your app's `/health` endpoint is working
- Ensure CORS is properly configured

**Notification failures**
- Test Slack webhook manually
- Verify webhook URL is correct
- Check Slack app permissions 