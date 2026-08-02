import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowRight, Phone } from 'lucide-react';
import { loginStart, loginSuccess, loginFailure } from '../../redux/slices/authSlice';
import api from '../../utils/axios';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      dispatch(loginStart());
      const res = await api.post('/auth/register', data);
      
      dispatch(loginSuccess(res.data.user));
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      dispatch(loginFailure(error.message));
      toast.error(error.message || 'Registration failed');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Create an account</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Join Craftora today for exclusive deals.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Name Fields (First & Last) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...register('firstName', { 
                  required: 'First name is required',
                  pattern: { value: /^[a-zA-Z\s]+$/, message: 'Letters only' }
                })}
                className={`input-field pl-10 ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="John"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...register('lastName', { 
                  required: 'Last name is required',
                  pattern: { value: /^[a-zA-Z\s]+$/, message: 'Letters only' }
                })}
                className={`input-field pl-10 ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Doe"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              {...register('phone', {
                pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid Indian phone number' }
              })}
              className={`input-field pl-10 ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="9876543210"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> {errors.phone.message}
            </p>
          )}
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { 
                  required: 'Required',
                  minLength: { value: 8, message: 'Min 8 chars' },
                  pattern: {
                    value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Include upper, lower, & number'
                  }
                })}
                className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 shrink-0 mt-0.5" /> 
                <span className="leading-tight">{errors.password.message}</span>
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword', { 
                  required: 'Required',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              {...register('terms', { required: 'You must accept the terms' })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-2 text-sm">
            <label htmlFor="terms" className="text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">Privacy Policy</a>
            </label>
            {errors.terms && <p className="text-xs text-red-600 mt-1">{errors.terms.message}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                Create account <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
            Log in instead
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
