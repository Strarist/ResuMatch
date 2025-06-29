# ResuMatch Authentication System

This document outlines the comprehensive authentication system implemented for the ResuMatch frontend application.

## 🏗️ Architecture Overview

The authentication system is built with the following components:

- **AuthContext**: Central state management for authentication
- **API Client**: Centralized API communication with automatic token handling
- **Route Protection**: Automatic route guarding and redirects
- **Session Management**: Automatic token refresh and expiry handling
- **OAuth Integration**: Google and LinkedIn social login support

## 📁 File Structure

```
src/auth/
├── AuthContext.tsx      # Main auth context and provider
├── auth.ts             # Auth utilities and token management
├── api.ts              # API client with auth integration
└── useApi.ts           # Custom hook for authenticated requests

src/components/
├── ProtectedRoute.tsx   # Route protection component
└── SessionManager.tsx   # Session monitoring and notifications

src/app/
├── login/page.tsx       # Enhanced login page with OAuth
└── [protected-pages]/   # All protected pages wrapped with ProtectedRoute
```

## 🔐 Authentication Flow

### 1. Login Process
```typescript
// Email/Password Login
const { login } = useAuth();
await login({ email, password });

// OAuth Login
const oauthUrl = apiClient.getOAuthUrl('google');
window.location.href = oauthUrl;
```

### 2. Token Management
- **Automatic Refresh**: Tokens are refreshed 5 minutes before expiry
- **Secure Storage**: Tokens stored in localStorage with automatic cleanup
- **Validation**: Continuous token validation with automatic logout on expiry

### 3. Route Protection
```typescript
// Protected Route
<ProtectedRoute>
  <DashboardContent />
</ProtectedRoute>

// Public Route (redirects authenticated users)
<ProtectedRoute requireAuth={false}>
  <LoginContent />
</ProtectedRoute>
```

## 🚀 Key Features

### ✅ Implemented Features

1. **Enhanced AuthContext**
   - Automatic token refresh
   - Session expiry handling
   - User data synchronization
   - Loading states

2. **API Integration**
   - Centralized API client
   - Automatic token injection
   - Error handling with automatic logout
   - Request/response typing

3. **Route Protection**
   - Automatic redirects
   - Post-login redirect handling
   - Loading states during auth checks
   - Session expired notifications

4. **OAuth Support**
   - Google OAuth integration
   - LinkedIn OAuth integration
   - OAuth callback handling
   - Token exchange

5. **Session Management**
   - Automatic token validation
   - Session expiry warnings
   - Graceful logout handling
   - Toast notifications

6. **Enhanced UI/UX**
   - Loading spinners
   - Error handling with toast notifications
   - Session expired messages
   - Improved user dropdown

### 🔧 Technical Implementation

#### Token Refresh Logic
```typescript
// Automatic refresh 5 minutes before expiry
const REFRESH_THRESHOLD = 5 * 60 * 1000;

export async function refreshTokenIfNeeded(): Promise<string | null> {
  if (!shouldRefreshToken()) {
    return getToken();
  }

  try {
    const response = await apiClient.refreshToken();
    login(response.access_token);
    return response.access_token;
  } catch (error) {
    logout();
    return null;
  }
}
```

#### Route Protection
```typescript
export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, sessionExpired } = useAuth();
  
  // Handle redirects based on auth state
  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading]);
}
```

#### API Request Hook
```typescript
export function useApi() {
  const { logout } = useAuth();

  const request = useCallback(async <T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const token = await getValidToken();
    if (!token) {
      await logout();
      throw new Error('Authentication required');
    }
    
    // Add auth header and make request
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }, [logout]);
}
```

## 🎯 Usage Examples

### Making Authenticated API Calls
```typescript
import { useApi } from '@/auth/useApi';

function MyComponent() {
  const { request } = useApi();

  const fetchData = async () => {
    try {
      const data = await request('/api/resumes');
      // Handle data
    } catch (error) {
      // Handle error (automatic logout on 401)
    }
  };
}
```

### Protecting Routes
```typescript
// Protected page
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// Public page that redirects authenticated users
export default function LoginPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <LoginContent />
    </ProtectedRoute>
  );
}
```

### Using Auth Context
```typescript
import { useAuth } from '@/auth/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    loading,
    sessionExpired 
  } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (sessionExpired) return <SessionExpiredMessage />;
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## 🔒 Security Features

1. **Token Security**
   - Automatic token refresh
   - Secure token storage
   - Token validation on every request

2. **Session Management**
   - Automatic session expiry handling
   - Graceful logout on token expiry
   - Session warning notifications

3. **Route Security**
   - Automatic route protection
   - Redirect handling
   - Loading states during auth checks

4. **API Security**
   - Automatic token injection
   - 401 handling with logout
   - Request/response validation

## 🚀 Next Steps

### Optional Enhancements

1. **JWT Fingerprint Binding**
   - Device fingerprinting
   - Token binding to device
   - Enhanced security

2. **Advanced Rate Limiting**
   - Tiered rate limiting
   - User-based limits
   - API quota management

3. **Multi-Factor Authentication**
   - TOTP support
   - SMS verification
   - Backup codes

4. **Audit Logging**
   - Login/logout events
   - Failed authentication attempts
   - Security event tracking

## 🐛 Troubleshooting

### Common Issues

1. **Token Refresh Fails**
   - Check network connectivity
   - Verify refresh token endpoint
   - Check server logs

2. **Route Protection Not Working**
   - Ensure ProtectedRoute wrapper
   - Check auth context initialization
   - Verify redirect paths

3. **OAuth Callback Issues**
   - Check OAuth configuration
   - Verify callback URLs
   - Check server OAuth setup

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('auth_debug', 'true');
```

## 📚 Dependencies

- `jwt-decode`: JWT token decoding
- `react-hot-toast`: Toast notifications
- `next/navigation`: Next.js routing
- `react`: React hooks and context

## 🔗 Related Files

- Backend OAuth implementation: `backend/app/api_v1.py`
- Database schema: `backend/migrations/`
- API documentation: Backend README 