'use client';

import { forwardRef } from 'react';
import { X } from 'lucide-react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
  onClose?: () => void;
  variant?: 'default' | 'dark' | 'light';
}

/**
 * Premium glass-morphism card component
 * Used for dialogs, panels, and elevated content
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', showClose = false, onClose, variant = 'default' }, ref) => {
    const variantStyles = {
      default: 'bg-zinc-900/80 border-white/10',
      dark: 'bg-black/70 border-white/5',
      light: 'bg-white/10 border-white/20',
    };

    return (
      <div
        ref={ref}
        className={`
          relative rounded-2xl
          backdrop-blur-xl
          border
          shadow-2xl
          ${variantStyles[variant]}
          ${className}
        `}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Close button */}
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full
              bg-white/10 hover:bg-white/20
              text-white/60 hover:text-white
              transition-all duration-200
              touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="relative z-0">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

/**
 * Glass effect overlay for modals
 */
export function GlassOverlay({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
        {children}
      </div>
    </div>
  );
}

/**
 * Utility classes for glass effects (use with Tailwind)
 */
export const glassClasses = {
  // Base glass effect
  base: 'bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-2xl',

  // Light glass (for lighter content)
  light: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl',

  // Dark glass (for darker, more subtle look)
  dark: 'bg-black/70 backdrop-blur-xl border border-white/5 shadow-2xl',

  // Glass button
  button: 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all',

  // Glass input
  input: 'bg-black/30 backdrop-blur-sm border border-white/10 focus:border-white/30 transition-all',
};
