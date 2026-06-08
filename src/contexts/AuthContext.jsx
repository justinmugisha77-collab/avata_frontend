import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState(null);
  const API_BASE_URL = 'http://localhost:5000';

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user && data.token) {
        // Explicitly check and set role
        let role = 'customer';
        if (data.user.role) {
          role = data.user.role;
        } else if (data.user.email && data.user.email.includes('owner')) {
          role = 'owner';
        } else if (data.user.email && data.user.email.includes('admin')) {
          role = 'admin';
        }
        const userData = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.full_name,
          phone: data.user.phone,
          role,
          token: data.token
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);

        return { success: true, role };
      } else {
        return { 
          success: false, 
          message: data.message || 'Invalid credentials. Please check your email and password.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Unable to connect to server. Please ensure the backend is running.' 
      };
    }
  };

  const register = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user && data.token) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.full_name,
          phone: data.user.phone,
          role: data.user.role || 'customer',
          token: data.token
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);

        return { success: true };
      } else {
        return { 
          success: false, 
          message: data.message || 'Registration failed. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: 'Unable to connect to server. Please ensure the backend is running.' 
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Reset link sent if email exists.' };
      }

      return {
        success: false,
        message: data.message || 'Failed to send reset link. Please try again.'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Unable to connect to server. Please ensure the backend is running.'
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Password reset successful.' };
      }

      return {
        success: false,
        message: data.message || 'Failed to reset password. Please request a new link.'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Unable to connect to server. Please ensure the backend is running.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    localStorage.removeItem('savedEmail');
    localStorage.removeItem('savedCredentials');
    localStorage.removeItem('rememberedUser');
    localStorage.removeItem('adminDashboardActiveView');
    localStorage.removeItem('adminDashboardSourceFilter');
    localStorage.removeItem('adminDashboardStatusFilter');
    localStorage.removeItem('adminDashboardSearchTerm');
    localStorage.removeItem('adminDashboardOrdersCache');
    localStorage.removeItem('ownerDashboardActiveView');
    localStorage.removeItem('ownerDashboardTimeRange');
    localStorage.removeItem('ownerDashboardSourceFilter');
    localStorage.removeItem('ownerDashboardStatusFilter');
    localStorage.removeItem('ownerDashboardOrdersCache');
    // Remove any other sensitive info if stored
    Object.keys(localStorage).forEach(key => {
      if (
        key.startsWith('profile') ||
        key.startsWith('auth') ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('credential')
      ) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
    window.dispatchEvent(new Event('storage'));
  };

  const saveRedirectPath = (path) => {
    setRedirectPath(path);
  };

  const getAndClearRedirectPath = () => {
    const path = redirectPath;
    setRedirectPath(null);
    return path || '/';
  };

  const value = {
    user,
    loading,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    isAuthenticated: !!user,
    saveRedirectPath,
    getAndClearRedirectPath
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
