import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: 'default' | 'primary' | 'accent' | 'destructive';
  className?: string;
  href?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  variant = 'default',
  className,
  href
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-success';
    if (trend.value < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const cardContent = (
    <div className={cn(
      "rounded-xl p-5 transition-all duration-300 animate-fade-in",
      variant === 'default' && "bg-card border border-border/50 hover:shadow-soft",
      variant === 'primary' && "bg-gradient-to-br from-primary to-primary-hover text-primary-foreground",
      variant === 'accent' && "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground",
      variant === 'destructive' && "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground",
      href && "cursor-pointer hover:scale-[1.02] hover:shadow-lg",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            "text-sm font-medium mb-1",
            variant === 'default' ? "text-muted-foreground" : "opacity-90",
            variant === 'destructive' && "text-destructive-foreground/90"
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1",
              variant === 'default' ? "text-muted-foreground" : "opacity-80"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              variant === 'default' ? getTrendColor() : "opacity-90"
            )}>
              {getTrendIcon()}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              {trend.label && <span className="opacity-70">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-3 rounded-xl",
            variant === 'default' ? "bg-primary/10 text-primary" : "bg-white/20"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{cardContent}</Link>;
  }

  return cardContent;
}
