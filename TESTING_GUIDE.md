# Testing Guide - Quick Wins Improvements

## 1️⃣ Health Check Endpoints

### Test in Browser or Terminal

```bash
# Full health status
curl http://localhost:3001/health

# Liveness probe
curl http://localhost:3001/health/live

# Readiness probe
curl http://localhost:3001/health/ready
```

### Expected Response

```json
{
  "status": "ok",
  "timestamp": "2025-10-26T00:47:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "externalApi": "ok"
  }
}
```

### ✅ Success Criteria
- [ ] Returns 200 status code
- [ ] Includes timestamp
- [ ] Shows uptime > 0
- [ ] All checks return "ok"
- [ ] Environment matches NODE_ENV

---

## 2️⃣ Winston Logging

### Check Log Files

```bash
# View error logs
tail -f logs/error.log

# View all logs
tail -f logs/combined.log

# Watch for new entries
watch -n 1 'wc -l logs/*.log'
```

### Expected Log Format

```json
{
  "level": "info",
  "message": "API Request",
  "timestamp": "2025-10-26 00:47:00",
  "service": "vr-odds-api",
  "method": "GET",
  "path": "/api/odds",
  "status": 200,
  "duration": "125ms",
  "userId": "user-123"
}
```

### ✅ Success Criteria
- [ ] `logs/` directory exists
- [ ] `error.log` file is created
- [ ] `combined.log` file is created
- [ ] Logs are in JSON format
- [ ] Each log includes timestamp
- [ ] Console output in development
- [ ] File rotation works (check after 5MB)

---

## 3️⃣ Jest Unit Tests

### Run Tests Locally

```bash
# Run all tests
npm test

# Run with coverage
npm run test:unit

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Expected Output

```
PASS  server/__tests__/middleware/auth.test.js
PASS  server/__tests__/middleware/errorHandler.test.js
PASS  server/__tests__/config/logger.test.js
PASS  server/__tests__/routes/health.test.js
PASS  server/__tests__/services/cache.test.js

Test Suites: 5 passed, 5 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        2.345s
```

### ✅ Success Criteria
- [ ] All 5 test suites pass
- [ ] No test failures
- [ ] Coverage report generated
- [ ] Watch mode works
- [ ] Tests run in < 5 seconds

### Test Files Created

1. **auth.test.js** - Authentication middleware tests
2. **errorHandler.test.js** - Error handling tests
3. **logger.test.js** - Logging tests
4. **health.test.js** - Health endpoint tests
5. **cache.test.js** - Caching tests

---

## 4️⃣ GitHub Actions CI/CD

### Check Workflow Status

1. Go to: `https://github.com/Victorrray/VR-SPORTS/actions`
2. Look for the "Tests & Quality Checks" workflow
3. Check the latest run

### Trigger a Test Run

```bash
# Make a test commit
git commit --allow-empty -m "test: trigger CI/CD pipeline"
git push
```

### Expected Workflow Jobs

- ✅ Lint & Format (5 min)
- ✅ Backend Unit Tests (10 min)
- ✅ Frontend Unit Tests (10 min)
- ✅ E2E Tests (15 min)
- ✅ Build Verification (10 min)
- ✅ Security Checks (5 min)
- ✅ Test Summary (2 min)

### ✅ Success Criteria
- [ ] All jobs pass
- [ ] No failed tests
- [ ] Build succeeds
- [ ] Security checks pass
- [ ] Artifacts uploaded
- [ ] PR comments appear (if PR)

### View Logs

Click on each job to see detailed logs:
- Lint output
- Test results
- Build logs
- Security scan results

---

## 5️⃣ Sentry Error Tracking

### Setup Required First

```bash
# Add to .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Test Error Capture

1. Create a test error endpoint:
```javascript
app.get('/test-error', (req, res) => {
  throw new Error('Test error for Sentry');
});
```

2. Trigger it:
```bash
curl http://localhost:3001/test-error
```

3. Check Sentry dashboard:
   - Go to https://sentry.io
   - View your project
   - Should see the error appear

### ✅ Success Criteria
- [ ] Sentry DSN configured
- [ ] Error appears in Sentry dashboard
- [ ] Stack trace is captured
- [ ] Request context included
- [ ] User ID tracked (if available)

---

## 🧪 Complete Testing Checklist

### Phase 1: Local Testing (30 min)

- [ ] Health endpoints respond correctly
- [ ] Log files are created and populated
- [ ] Jest tests all pass
- [ ] No console errors
- [ ] Coverage report generated

### Phase 2: GitHub Actions (10 min)

- [ ] Make a test commit
- [ ] Watch workflow run
- [ ] All jobs pass
- [ ] Artifacts uploaded
- [ ] No security warnings

### Phase 3: Production Setup (15 min)

- [ ] Add Sentry DSN to production .env
- [ ] Deploy to production
- [ ] Test health endpoints in production
- [ ] Verify logs in production
- [ ] Check Sentry dashboard

### Phase 4: Monitoring (Ongoing)

- [ ] Monitor error rates in Sentry
- [ ] Review logs daily
- [ ] Check health endpoint status
- [ ] Track test coverage trends

---

## 🐛 Troubleshooting

### Health Endpoints Return 503

**Issue**: Status is "degraded"
**Solution**: Check database/cache/API connectivity

```bash
# Test database connection
curl http://localhost:3001/health
# Check "checks" object for failures
```

### No Log Files Created

**Issue**: `logs/` directory missing
**Solution**: Create it manually

```bash
mkdir -p logs
npm start
```

### Jest Tests Fail

**Issue**: Tests not running
**Solution**: Install dependencies

```bash
npm install --save-dev jest --legacy-peer-deps
npm test
```

### GitHub Actions Not Running

**Issue**: Workflow not triggered
**Solution**: Check branch name

```bash
# Must be on main or develop
git branch
git push origin main
```

### Sentry Not Capturing Errors

**Issue**: Errors not appearing in Sentry
**Solution**: Verify DSN is correct

```bash
# Check .env
cat .env | grep SENTRY_DSN

# Restart server
npm start
```

---

## 📊 Performance Benchmarks

### Expected Performance

| Component | Metric | Target | Actual |
|-----------|--------|--------|--------|
| Health Check | Response Time | <50ms | ? |
| Logging | Write Time | <5ms | ? |
| Jest Tests | Total Time | <5s | ? |
| GitHub Actions | Total Time | <60min | ? |
| Sentry | Capture Time | <100ms | ? |

---

## 📝 Test Results Template

Copy and paste this template to track your results:

```markdown
## Test Results - [DATE]

### Health Endpoints
- [ ] /health - Status: ___
- [ ] /health/live - Status: ___
- [ ] /health/ready - Status: ___

### Logging
- [ ] error.log created - Yes/No
- [ ] combined.log created - Yes/No
- [ ] Logs in JSON format - Yes/No

### Jest Tests
- [ ] All tests pass - Yes/No
- [ ] Coverage: ____%
- [ ] Time: ___s

### GitHub Actions
- [ ] Workflow triggered - Yes/No
- [ ] All jobs passed - Yes/No
- [ ] Build successful - Yes/No

### Sentry
- [ ] DSN configured - Yes/No
- [ ] Errors captured - Yes/No
- [ ] Dashboard accessible - Yes/No

### Issues Found
- [ ] None
- [ ] [Describe issues]

### Next Steps
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Adjust configuration if needed
```

---

## 🎯 Quick Test Commands

```bash
# Test everything in one go
npm test && curl http://localhost:3001/health && tail logs/combined.log

# Watch tests while developing
npm run test:watch

# Check coverage
npm run test:coverage

# View logs in real-time
tail -f logs/combined.log

# Check health status
watch -n 5 'curl -s http://localhost:3001/health | jq'
```

---

## ✅ Sign-Off

Once all tests pass, mark this checklist:

- [ ] All local tests pass
- [ ] GitHub Actions workflow succeeds
- [ ] Health endpoints working
- [ ] Logs being written
- [ ] Sentry configured (optional)
- [ ] Ready for production deployment

**Tested by**: ___________  
**Date**: ___________  
**Notes**: ___________
