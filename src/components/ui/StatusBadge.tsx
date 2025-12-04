import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatusBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  children, 
  variant = 'default', 
  size = 'sm',
  className 
}: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center font-medium rounded-full",
      size === 'sm' && "px-2.5 py-0.5 text-xs",
      size === 'md' && "px-3 py-1 text-sm",
      variant === 'default' && "bg-muted text-muted-foreground",
      variant === 'success' && "bg-success/10 text-success",
      variant === 'warning' && "bg-warning/10 text-warning",
      variant === 'error' && "bg-error/10 text-error",
      variant === 'info' && "bg-info/10 text-info",
      variant === 'primary' && "bg-primary/10 text-primary",
      className
    )}>
      {children}
    </span>
  );
}
