import React, { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import './Input.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, fullWidth = false, className, ...props }, ref) => {
    return (
      <div className={clsx('input-wrapper', { 'input-wrapper--full-width': fullWidth })}>
        {label && (
          <label className="input__label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="input__container">
          {icon && <div className="input__icon">{icon}</div>}
          <input
            ref={ref}
            className={clsx(
              'input',
              {
                'input--error': error,
                'input--with-icon': icon,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="input__error">{error}</span>}
      </div>
    );
  }
); 