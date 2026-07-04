import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  placeholder = '',
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={id}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-slate-200 dark:border-slate-800 focus:ring-primary-500 focus:border-primary-500'
        } rounded-lg shadow-sm outline-none focus:ring-2 transition duration-150 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error.message || error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({
  label,
  id,
  error,
  rows = 3,
  placeholder = '',
  className = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-slate-200 dark:border-slate-800 focus:ring-primary-500 focus:border-primary-500'
        } rounded-lg shadow-sm outline-none focus:ring-2 transition duration-150 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error.message || error}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
