import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

export default function ActionSheet({ isOpen, onClose, title, children, options = [] }) {
  const handleSelect = (option) => {
    option.onSelect?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-w-lg mx-auto"
            style={{ 
              backgroundColor: 'var(--gf-bg-surface)',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-12 h-1 rounded-full" style={{ backgroundColor: 'var(--gf-border)' }} />
            </div>

            {/* Header */}
            {(title || !options.length) && (
              <div className="px-6 pb-4 flex items-center justify-between">
                <h3 className="font-heading font-black text-lg" style={{ color: 'var(--gf-text-primary)' }}>
                  {title}
                </h3>
                <button onClick={onClose} className="p-1">
                  <X size={20} style={{ color: 'var(--gf-text-secondary)' }} />
                </button>
              </div>
            )}

            {/* Custom content */}
            {children ? (
              <div className="px-6 pb-6 max-h-96 overflow-y-auto">
                {children}
              </div>
            ) : null}

            {/* Options list */}
            {options.length > 0 && (
              <div className="px-6 pb-6 max-h-96 overflow-y-auto space-y-2">
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(option)}
                    className="w-full px-4 py-3 rounded-xl font-body text-sm font-medium text-left transition-all active:scale-95"
                    style={{
                      backgroundColor: option.selected ? 'rgba(200,255,0,0.15)' : 'var(--gf-bg-elevated)',
                      color: option.selected ? 'var(--gf-green)' : 'var(--gf-text-primary)',
                      border: option.selected ? '1px solid var(--gf-green)' : '1px solid var(--gf-border)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.selected && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SelectTrigger({ value, label, icon: Icon, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl font-body text-sm outline-none text-left flex items-center justify-between"
      style={{
        backgroundColor: 'var(--gf-bg-elevated)',
        color: 'var(--gf-text-primary)',
        border: '1px solid var(--gf-border)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>{value || label}</span>
      {Icon ? <Icon size={16} style={{ color: 'var(--gf-text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--gf-text-secondary)' }} />}
    </button>
  );
}