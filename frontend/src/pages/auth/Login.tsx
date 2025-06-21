import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { auth } from '../../lib/api';
import { EyeIcon, EyeOffIcon } from '../../components/common/EyeIcons';
import NeomorphicInput from '../../components/common/NeomorphicInput';
import AuthInput from '../../components/common/AuthInput';
import { NeomorphicCheckbox } from '../../components/common/NeomorphicCheckbox';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const schema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
}).required();

type LoginFormData = yup.InferType<typeof schema>;

export default function Login() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    if (error) {
      toast.error('Social login failed: ' + error);
      setError('Social login failed: ' + error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (token) {
      setSocialLoading(true);
      localStorage.setItem('token', token);
      auth.me().then(user => {
        setAuth({
          id: user.id,
          email: user.email,
          name: user.full_name || '',
        }, token);
        navigate('/');
      }).catch(() => {
        toast.error('Social login failed.');
        setError('Social login failed. Please try again or use another method.');
        setSocialLoading(false);
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setAuth, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await auth.login(data.email, data.password);
      console.log('Login response:', response);
      const { user, access_token } = response;
      if (access_token && user) {
        setAuth({
          id: user.id,
          email: user.email,
          name: user.full_name || '',
        }, access_token);
        navigate('/');
      } else {
        setError('Invalid login response');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'An error occurred during login';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Use environment variable for backend URL in production
  const BACKEND_URL = 'http://localhost:8000';

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-12 shadow-lg sm:rounded-2xl sm:px-12 border border-gray-300 dark:border-gray-700 transition-colors duration-300">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {(error || socialLoading) && (
              <div className="rounded-md bg-red-50 p-4 flex items-center justify-center">
                {socialLoading ? (
                  <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400"><LoadingSpinner size="sm" /> Logging you in with social account...</span>
                ) : (
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                Email address
              </label>
              <div className="mt-2 relative">
                <NeomorphicInput
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  {...register('email')}
                  disabled={socialLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                Password
              </label>
              <div className="mt-2 relative">
                <NeomorphicInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  {...register('password')}
                  disabled={socialLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{padding: 0}}
                  disabled={socialLoading}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <NeomorphicCheckbox
                  id="remember-me"
                  label="Remember me"
                  className="mr-2"
                  disabled={socialLoading}
                />
              </div>
              <div className="text-sm leading-6">
                <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || socialLoading}
                className="btn-primary w-full mb-4"
              >
                {(isLoading && !socialLoading) ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="my-8 flex items-center justify-center">
            <div className="w-full border-t border-gray-200" />
            <span className="mx-4 text-gray-400 dark:text-gray-500 text-sm">or</span>
            <div className="w-full border-t border-gray-200" />
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={async () => {
                try {
                  window.location.href = `${BACKEND_URL}/api/v1/auth/google/login`;
                } catch (e) {
                  toast.error('Google auth failed.');
                }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.0003 2C6.4303 2 2.0003 6.43 2.0003 12C2.0003 17.57 6.4303 22 12.0003 22C17.5703 22 22.0003 17.57 22.0003 12C22.0003 6.43 17.5703 2 12.0003 2ZM18.3603 16.83C16.4303 18.17 14.1603 19 12.0003 19C8.4303 19 5.2903 16.89 4.0003 13.72C4.0003 13.72 7.0003 12.5 12.0003 12.5C12.0003 12.5 12.0003 12.5 12.0003 12.5C16.0003 12.5 18.3603 13.72 18.3603 13.72V16.83ZM18.3603 10.5V10.51C18.3603 10.51 16.0003 12 12.0003 12C8.0003 12 5.6403 10.51 5.6403 10.51V10.5C5.6403 8.52 7.1603 7 9.1403 7H14.8603C16.8403 7 18.3603 8.52 18.3603 10.5Z"
                  fill="#4285F4"
                />
              </svg>
              <span className="text-sm font-semibold leading-6">Google</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  window.location.href = `${BACKEND_URL}/api/v1/auth/github/login`;
                } catch (e) {
                  toast.error('GitHub auth failed.');
                }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  fill="#24292F"
                />
              </svg>
              <span className="text-sm font-semibold leading-6">GitHub</span>
            </button>
          </div>

          <div className="text-center mt-6">
            <span className="text-gray-600 dark:text-gray-300">Don't have an account? </span>
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 