import React from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import './Button.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        {
          'btn--loading': loading,
          'btn--full-width': fullWidth,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      <span className={clsx('btn__content', { 'btn__content--loading': loading })}>
        {children}
      </span>
    </button>
  );
}; 