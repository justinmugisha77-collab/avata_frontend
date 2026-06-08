import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, User, Lock, Phone, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginRegisterModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login, register, forgotPassword, getAndClearRedirectPath } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', password: '', full_name: '', phone: '' });
      setForgotEmail('');
      setError('');
      setSuccessMessage('');
      setIsForgotPassword(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    setError('');
    setSuccessMessage('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const result = await forgotPassword(forgotEmail);
      if (result.success) {
        setSuccessMessage(result.message || 'If that email exists, a reset link has been sent.');
      } else {
        setError(result.message || 'Unable to process request. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password submit error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      let userData;

      if (isLogin) {
        result = await login(formData.email, formData.password);
        // Get user data from localStorage after login
        const storedUser = localStorage.getItem('user');
        userData = storedUser ? JSON.parse(storedUser) : null;
      } else {
        result = await register(formData);
        // Get user data from localStorage after registration
        const storedUser = localStorage.getItem('user');
        userData = storedUser ? JSON.parse(storedUser) : null;
      }

      if (result.success) {
        setFormData({ email: '', password: '', full_name: '', phone: '' });
        onClose();

        // Redirect based on user role
        if (userData?.role === 'admin') {
          navigate('/admin');
        } else if (userData?.role === 'owner') {
          navigate('/owner');
        } else {
          // For regular customers, check if there was a redirect path
          const redirectPath = getAndClearRedirectPath();
          navigate(redirectPath);
        }
      } else {
        setError(result.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-3 sm:p-4 min-h-screen">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <User className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">{isForgotPassword ? 'Forgot Password' : (isLogin ? 'Welcome Back' : 'Create Account')}</h2>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate('/');
              }}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Toggle Buttons */}
        {!isForgotPassword && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${isLogin
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${!isLogin
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-6">
          {!isForgotPassword ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="full_name"
                      autoComplete="name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder:text-gray-400 transition-colors"
                      placeholder="Enter your full name"
                      required
                    />
                    <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder:text-gray-400 transition-colors"
                      placeholder="Enter your phone number"
                      required
                    />
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder:text-gray-400 transition-colors"
                  placeholder="Enter your email address"
                  required
                />
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder:text-gray-400 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotEmail(formData.email || '');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your email and we will send you a password reset link.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    name="forgotEmail"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setError('');
                      setSuccessMessage('');
                      setForgotEmail(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder:text-gray-400 transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                }}
                className="w-full py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {isLogin && !isForgotPassword && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up here
                </button>
              </p>
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterModal;
