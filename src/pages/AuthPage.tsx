import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, Lock, User, Sun, Moon, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import './AuthPage.scss';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const registerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;
type RegisterFormData = yup.InferType<typeof registerSchema>;
type FormData = LoginFormData | RegisterFormData;

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(isLogin ? loginSchema : registerSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { email, password } = data as LoginFormData;
        await login(email, password);
      } else {
        const { name, email, password } = data as RegisterFormData;
        await register(email, password, name);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    reset();
  };

  return (
    <div className="auth-page">
      <div className="auth-page__background" />
      
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-page__container">
        <div className="auth-page__header">
          <div className="auth-page__logo">
            <BookOpen size={48} />
          </div>
          <h1 className="auth-page__title">Teacher Assistant</h1>
          <p className="auth-page__subtitle">
            Upload PDFs and chat with AI about your documents
          </p>
        </div>

        <div className="auth-page__form-container">
          <div className="auth-page__tabs">
            <button
              className={`auth-page__tab ${isLogin ? 'auth-page__tab--active' : ''}`}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Login
            </button>
            <button
              className={`auth-page__tab ${!isLogin ? 'auth-page__tab--active' : ''}`}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-page__form">
            {!isLogin && (
              <Input
                {...registerField('name')}
                type="text"
                placeholder="Enter your name"
                label="Name"
                icon={<User size={20} />}
                error={!isLogin && 'name' in errors ? errors.name?.message : undefined}
                fullWidth
              />
            )}

            <Input
              {...registerField('email')}
              type="email"
              placeholder="Enter your email"
              label="Email"
              icon={<Mail size={20} />}
              error={errors.email?.message}
              fullWidth
            />

            <Input
              {...registerField('password')}
              type="password"
              placeholder="Enter your password"
              label="Password"
              icon={<Lock size={20} />}
              error={errors.password?.message}
              fullWidth
            />

            {error && (
              <div className="auth-page__error">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="auth-page__switch">
            <span className="auth-page__switch-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              onClick={switchMode}
              className="auth-page__switch-button"
              type="button"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 