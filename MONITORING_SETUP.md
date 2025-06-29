# 📊 ResuMatch Monitoring Setup Guide

## 🎯 Production Monitoring Strategy

This guide covers the essential monitoring and alerting setup to ensure ResuMatch runs smoothly in production.

---

## 🔍 Application Performance Monitoring (APM)

### 1. Sentry Integration (Error Tracking)

**Backend Setup (FastAPI)**
```python
# Add to requirements.txt
sentry-sdk[fastapi]

# Add to main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment="production"
)
```

**Frontend Setup (Next.js)**
```bash
npm install @sentry/nextjs
```

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // your existing config
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: "your-org",
  project: "resumatch-frontend",
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

### 2. Performance Monitoring

**Backend Metrics (FastAPI)**
```python
# Add to requirements.txt
prometheus-client
fastapi-prometheus-metrics

# Add to main.py
from fastapi_prometheus_metrics import PrometheusMetrics

metrics = PrometheusMetrics(app)
metrics.info("app_info", "Application info", version="1.0.0")
```

**Frontend Performance (Vercel Analytics)**
```bash
npm install @vercel/analytics
```

```javascript
// _app.js
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

---

## 🗄️ Database Monitoring

### PostgreSQL Monitoring

**Connection Pool Monitoring**
```python
# Add to database.py
from sqlalchemy import event
import logging

logger = logging.getLogger(__name__)

@event.listens_for(engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    logger.info("Database connection established")

@event.listens_for(engine, "disconnect")
def receive_disconnect(dbapi_connection, connection_record):
    logger.info("Database connection closed")
```

**Query Performance Monitoring**
```python
# Add to database.py
import time

def log_slow_queries(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        if execution_time > 1.0:  # Log queries taking >1 second
            logger.warning(f"Slow query detected: {func.__name__} took {execution_time:.2f}s")
        
        return result
    return wrapper
```

### Redis Monitoring

**Connection Health Checks**
```python
# Add to redis_client.py
import redis
import logging

logger = logging.getLogger(__name__)

def check_redis_health():
    try:
        redis_client.ping()
        logger.info("Redis connection healthy")
        return True
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return False
```

---

## 🌐 Uptime Monitoring

### 1. Render Health Checks

**Backend Health Endpoint**
```python
# Add to main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "database": check_database_connection(),
        "redis": check_redis_connection()
    }
```

**Frontend Health Check**
```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
```

### 2. External Uptime Monitoring

**UptimeRobot Setup**
1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors for:
   - Backend API: `https://your-backend.onrender.com/health`
   - Frontend: `https://your-frontend.vercel.app`
   - Database connection
3. Set alert thresholds:
   - Response time > 5 seconds
   - Downtime > 1 minute

**Pingdom Setup**
1. Create account at [pingdom.com](https://pingdom.com)
2. Configure transaction monitoring for:
   - User registration flow
   - Resume upload process
   - Job analysis workflow

---

## 📈 Metrics Collection

### 1. Custom Metrics

**User Activity Tracking**
```python
# Add to main.py
from prometheus_client import Counter, Histogram, Gauge

# Metrics
user_registrations = Counter('user_registrations_total', 'Total user registrations')
resume_uploads = Counter('resume_uploads_total', 'Total resume uploads')
job_analyses = Counter('job_analyses_total', 'Total job analyses')
analysis_duration = Histogram('analysis_duration_seconds', 'Time spent on analysis')
active_users = Gauge('active_users', 'Number of active users')

# Usage in endpoints
@app.post("/register")
async def register_user(user_data: UserCreate):
    user_registrations.inc()
    # ... registration logic

@app.post("/upload-resume")
async def upload_resume(file: UploadFile):
    resume_uploads.inc()
    # ... upload logic

@app.post("/analyze")
async def analyze_job(analysis_data: JobAnalysis):
    start_time = time.time()
    # ... analysis logic
    analysis_duration.observe(time.time() - start_time)
    job_analyses.inc()
```

### 2. Business Metrics

**Conversion Funnel Tracking**
```python
# Add to analytics.py
class ConversionTracker:
    def __init__(self):
        self.signup_to_upload = Counter('signup_to_upload', 'Users who uploaded resume after signup')
        self.upload_to_analysis = Counter('upload_to_analysis', 'Users who analyzed job after upload')
        self.analysis_to_result = Counter('analysis_to_result', 'Users who viewed results after analysis')
    
    def track_signup(self, user_id):
        # Track user signup
        pass
    
    def track_upload(self, user_id):
        # Check if user signed up recently
        self.signup_to_upload.inc()
    
    def track_analysis(self, user_id):
        # Check if user uploaded recently
        self.upload_to_analysis.inc()
    
    def track_result_view(self, user_id):
        # Check if user analyzed recently
        self.analysis_to_result.inc()
```

---

## 🚨 Alerting Configuration

### 1. Critical Alerts

**High Error Rate**
```yaml
# Alert when error rate > 5% for 5 minutes
alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
for: 5m
labels:
  severity: critical
annotations:
  summary: "High error rate detected"
  description: "Error rate is {{ $value }}%"
```

**High Response Time**
```yaml
# Alert when 95th percentile response time > 3 seconds
alert: HighResponseTime
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 3
for: 2m
labels:
  severity: warning
annotations:
  summary: "High response time detected"
  description: "95th percentile response time is {{ $value }}s"
```

**Database Connection Issues**
```yaml
# Alert when database connections fail
alert: DatabaseConnectionFailed
expr: up{job="database"} == 0
for: 1m
labels:
  severity: critical
annotations:
  summary: "Database connection failed"
  description: "Database is not responding"
```

### 2. Business Alerts

**Low User Activity**
```yaml
# Alert when user registrations drop significantly
alert: LowUserRegistrations
expr: rate(user_registrations_total[1h]) < 0.1
for: 30m
labels:
  severity: warning
annotations:
  summary: "Low user registration rate"
  description: "Only {{ $value }} registrations per hour"
```

**High Analysis Failure Rate**
```yaml
# Alert when job analysis success rate drops
alert: HighAnalysisFailureRate
expr: rate(job_analyses_failed_total[10m]) / rate(job_analyses_total[10m]) > 0.1
for: 5m
labels:
  severity: critical
annotations:
  summary: "High analysis failure rate"
  description: "{{ $value }}% of analyses are failing"
```

---

## 📊 Dashboard Setup

### 1. Grafana Dashboard

**Key Metrics to Display**
- User registrations per hour/day
- Resume uploads per hour/day
- Job analyses per hour/day
- Average analysis duration
- Error rates by endpoint
- Response time percentiles
- Database connection pool status
- Redis memory usage
- System resource utilization

### 2. Business Dashboard

**Conversion Metrics**
- Signup to upload conversion rate
- Upload to analysis conversion rate
- Analysis completion rate
- User retention rates
- Feature usage statistics

---

## 🔧 Log Management

### 1. Structured Logging

**Backend Logging**
```python
# Add to main.py
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()
```

### 2. Log Aggregation

**ELK Stack Setup**
1. **Elasticsearch**: Store and index logs
2. **Logstash**: Process and transform logs
3. **Kibana**: Visualize and analyze logs

**Alternative: Cloud Logging**
- **Render Logs**: Built-in log viewing
- **Vercel Logs**: Function and build logs
- **Sentry Logs**: Error and performance logs

---

## 🛡️ Security Monitoring

### 1. Security Alerts

**Failed Authentication**
```yaml
# Alert on multiple failed login attempts
alert: MultipleFailedLogins
expr: rate(failed_login_attempts_total[5m]) > 10
for: 2m
labels:
  severity: warning
annotations:
  summary: "Multiple failed login attempts detected"
  description: "{{ $value }} failed attempts per minute"
```

**Suspicious File Uploads**
```yaml
# Alert on potentially malicious file uploads
alert: SuspiciousFileUpload
expr: rate(suspicious_file_uploads_total[10m]) > 0
for: 1m
labels:
  severity: critical
annotations:
  summary: "Suspicious file upload detected"
  description: "Potential security threat detected"
```

### 2. Rate Limiting Monitoring

**API Rate Limit Violations**
```python
# Add to rate_limiting.py
from prometheus_client import Counter

rate_limit_violations = Counter('rate_limit_violations_total', 'Total rate limit violations')

def check_rate_limit(user_id, endpoint):
    # Rate limiting logic
    if rate_limit_exceeded:
        rate_limit_violations.inc()
        return False
    return True
```

---

## 📱 Notification Channels

### 1. Email Alerts
- Critical alerts → Immediate email
- Warning alerts → Daily digest
- Info alerts → Weekly summary

### 2. Slack Integration
```python
# Add to notifications.py
import requests

def send_slack_alert(message, channel="#alerts"):
    webhook_url = "YOUR_SLACK_WEBHOOK_URL"
    payload = {
        "channel": channel,
        "text": message,
        "username": "ResuMatch Monitor"
    }
    requests.post(webhook_url, json=payload)
```

### 3. PagerDuty Integration
- Critical alerts → Immediate page
- Warning alerts → Escalation after 15 minutes
- Info alerts → No page, log only

---

## 🔄 Maintenance Procedures

### 1. Regular Health Checks
- **Daily**: Review error rates and performance metrics
- **Weekly**: Analyze user behavior and conversion rates
- **Monthly**: Review system capacity and scaling needs

### 2. Incident Response
1. **Detection**: Automated alerts trigger
2. **Assessment**: Determine severity and impact
3. **Response**: Execute runbook procedures
4. **Resolution**: Fix the issue
5. **Post-mortem**: Document lessons learned

### 3. Capacity Planning
- Monitor resource usage trends
- Plan for traffic spikes
- Scale infrastructure proactively
- Budget for growth

---

## 📋 Monitoring Checklist

- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring active
- [ ] Uptime monitoring setup
- [ ] Database monitoring configured
- [ ] Custom metrics implemented
- [ ] Alerts configured and tested
- [ ] Dashboards created
- [ ] Log aggregation working
- [ ] Security monitoring active
- [ ] Notification channels tested
- [ ] Runbooks documented
- [ ] Team trained on procedures

---

**Remember**: Good monitoring is proactive, not reactive. Set up comprehensive monitoring before launch to catch issues early and maintain a great user experience. 