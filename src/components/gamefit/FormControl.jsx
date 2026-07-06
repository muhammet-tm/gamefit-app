import React from 'react';

export const inputStyle = {
  backgroundColor: 'var(--gf-bg-elevated)',
  color: 'var(--gf-text-primary)',
  border: '1px solid var(--gf-border)',
};

export const buttonStyle = {
  primary: {
    backgroundColor: 'var(--gf-green)',
    color: '#0D0F14',
  },
  secondary: {
    backgroundColor: 'var(--gf-bg-elevated)',
    border: '1px solid var(--gf-border)',
    color: 'var(--gf-text-secondary)',
  },
  accent: {
    backgroundColor: 'var(--gf-purple)',
    color: '#FFFFFF',
  },
};

// Unified input component with consistent styling
export function FormInput({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  disabled = false,
  className = ''
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl font-body text-sm outline-none ${className}`}
      style={inputStyle}
    />
  );
}

// Unified textarea component
export function FormTextarea({ 
  placeholder, 
  value, 
  onChange, 
  rows = 3,
  disabled = false,
  className = ''
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={rows}
      className={`w-full px-4 py-3 rounded-xl font-body text-sm outline-none resize-none ${className}`}
      style={inputStyle}
    />
  );
}

// Unified button component
export function FormButton({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false,
  isLoading = false,
  icon: Icon,
  className = ''
}) {
  const style = buttonStyle[variant] || buttonStyle.primary;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`px-4 py-3 rounded-2xl font-heading font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${className}`}
      style={{
        ...style,
        opacity: disabled || isLoading ? 0.6 : 1,
      }}>
      {Icon && <Icon size={18} />}
      {isLoading ? 'Loading...' : label}
    </button>
  );
}