import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * 📝 复古波普输入框组件
 * Retro Pop Input with hard borders and shadows
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-bold uppercase tracking-wider text-black">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border-2 border-black bg-white text-black placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(244,157,110,1)] transition-all ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600 font-semibold">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
