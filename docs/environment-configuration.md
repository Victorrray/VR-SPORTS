# Environment Configuration Guide

This document outlines the environment-specific behavior and configuration for the VR-Odds platform.

## Development vs Production Behavior

### Authentication
- **Development Mode**:
  - Protected routes are accessible without authentication
  - Console logs show authentication state changes
  - No actual authentication checks are performed

- **Production Mode**:
  - Full authentication is enforced
  - Users are redirected to login for protected routes
  - Session validation occurs on each protected route access

### API Requests
- **Development Mode**:
  - Uses proxy configuration from `package.json`
  - API requests are automatically prefixed with `/api`
  - Detailed request/response logging

- **Production Mode**:
  - Uses absolute URLs from environment variables
  - Optimized for performance
  - Minimal logging

## Environment Variables

### Required Variables
```
REACT_APP_API_BASE_URL=  # Base URL for API requests in production
REACT_APP_ENV=production # or 'development'
```

### Optional Variables
```
REACT_APP_DEBUG=true     # Enable debug logging
REACT_APP_USE_MOCKS=true # Use mock data instead of real API
```

## Running in Different Environments

### Development
```bash
# Start development server
npm start
```

### Production Build
```bash
# Create production build
npm run build

# Serve production build locally
npx serve -s build
```

## Troubleshooting

### Common Issues
1. **CORS Errors in Development**
   - Ensure the proxy is configured in `package.json`
   - Check that the backend server is running on the correct port

2. **Authentication Issues**
   - In development, check console logs for authentication state
   - In production, verify session cookies are being set correctly

3. **API Request Failures**
   - Check network tab for request/response details
   - Verify environment variables are set correctly

## Security Considerations
- Never commit sensitive environment variables
- Use HTTPS in production
- Keep dependencies up to date
- Regularly review security headers and CORS settings
