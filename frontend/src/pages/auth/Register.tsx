import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { auth } from '../../lib/api';
import { PageTransition } from '../../components/common/PageTransition';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { EyeIcon, EyeOffIcon } from '../../components/common/EyeIcons';
import NeomorphicInput from '../../components/common/NeomorphicInput';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
}).required();

type RegisterFormData = yup.InferType<typeof schema>;

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function Register() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    const payload = {
      email: data.email,
      password: data.password,
      full_name: data.name,
    };
    console.log('Register payload:', payload);
    try {
      const { access_token, user } = await auth.register(payload);
      if (access_token && user) {
        localStorage.setItem('token', access_token);
        setAuth({
          id: user.id,
          email: user.email,
          name: user.full_name || '',
        }, access_token);
        toast.success('Registration successful!');
        navigate('/');
      } else {
        toast.error('Registration failed. No token received.');
        setError('Registration failed. No token received.');
      }
    } catch (error: any) {
      let errorMsg = 'Registration error';
      if (error?.response?.data) {
        if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map((e: any) => e.msg).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        }
      }
      toast.error(errorMsg);
      setError(errorMsg);
      console.error('Registration error:', errorMsg, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <Toaster position="top-right" />
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
            Create your account
          </h2>
        </motion.div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-12 shadow-lg sm:rounded-2xl sm:px-12 border border-gray-300 dark:border-gray-700 transition-colors duration-300"
          >
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md bg-red-50 p-4"
                >
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                  Full name
                </label>
                <div className="mt-2">
                  <NeomorphicInput
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Full name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.name.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                  Email address
                </label>
                <div className="mt-2">
                  <NeomorphicInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    {...register('email')}
                  />
                  {errors.email && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                  Password
                </label>
                <div className="mt-2 relative">
                  <NeomorphicInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white focus:outline-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                  {errors.password && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                  Confirm password
                </label>
                <div className="mt-2 relative">
                  <NeomorphicInput
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white focus:outline-none"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                  {errors.confirmPassword && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.confirmPassword.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full mb-4"
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </motion.div>
            </form>

            <div className="my-8 flex items-center justify-center">
              <div className="w-full border-t border-gray-200" />
              <span className="mx-4 text-gray-400 dark:text-gray-500 text-sm">or</span>
              <div className="w-full border-t border-gray-200" />
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {/* Example: */}
              {/* <button className="btn-google w-full">Sign up with Google</button> */}
            </div>

            <div className="text-center mt-6">
              <span className="text-gray-600 dark:text-gray-300">Already have an account? </span>
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500">Login</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
} 