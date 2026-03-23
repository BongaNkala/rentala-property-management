import React from 'react';
import { Button } from './button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`glass-panel p-12 text-center animate-scale-in ${className}`}>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 mb-6 border border-white/10">
        <Icon className="w-10 h-10 text-white/40" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/70 mb-6 max-w-md mx-auto text-lg">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white hover:opacity-90"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
