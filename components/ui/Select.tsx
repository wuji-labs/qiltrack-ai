import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

/**
 * 📋 复古波普选择框组件
 * Retro Pop Select with hard borders
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-bold uppercase tracking-wider text-black">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-3 border-2 border-black bg-white text-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(244,157,110,1)] transition-all appearance-none cursor-pointer ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600 font-semibold">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
