import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  lastRefresh: Date | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5001/api/v1';
axios.defaults.withCredentials = true;

// Add axios interceptors for token handling
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface QueueItem {
  resolve: (value: string | null) => void;
  reject: (reason?: unknown) => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: ApiError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via HTTP-only cookie
        const response = await axios.post('/auth/refreshToken');
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as ApiError, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Function to setup automatic token refresh every 14 minutes
  const setupTokenRefresh = () => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    console.log('🔄 Setting up automatic token refresh every 14 minutes');
    
    // Set up new interval for 14 minutes (14 * 60 * 1000 ms)
    refreshIntervalRef.current = setInterval(async () => {
      try {
        console.log('⏰ Auto-refreshing token...');
        await refreshToken();
        console.log('✅ Token refreshed automatically at:', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('❌ Auto refresh failed:', error);
        // If auto refresh fails, redirect to login
        logout();
      }
    }, 14 * 60 * 1000); // 14 minutes
  };

  // Function to clear token refresh interval
  const clearTokenRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }

    // Cleanup interval on unmount
    return () => {
      clearTokenRefresh();
    };
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
      // Setup auto refresh when user is verified
      setupTokenRefresh();
    } catch (error) {
      localStorage.removeItem('accessToken');
      console.error('Token verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(userData);
      
      // Setup auto refresh after successful login
      setupTokenRefresh();
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.response?.data?.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await axios.post('/auth/register', { email, password, name });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(userData);
      
      // Setup auto refresh after successful registration
      setupTokenRefresh();
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await axios.delete('/app/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      // Clear auto refresh on logout
      clearTokenRefresh();
    }
  };

  const refreshToken = async () => {
    try {
      console.log('🔄 Refreshing access token...');
      // Refresh token is sent automatically via HTTP-only cookie
      const response = await axios.post('/auth/refreshToken');
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setLastRefresh(new Date());
      console.log('✅ Access token refreshed successfully');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
      clearTokenRefresh();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    lastRefresh,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 