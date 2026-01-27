import { Calendar } from 'lucide-react';
import { cn, themeConfig } from '@/lib/theme-config';

interface BrandLogoProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export function BrandLogo({ size = 'default', className, showIcon = true }: BrandLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    default: 'h-10 w-10 text-base',
    lg: 'h-16 w-16 text-2xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  return (
    <div
      className={cn(
        themeConfig.backgrounds.logo,
        'rounded-xl flex items-center justify-center text-white font-bold shadow-md',
        sizeClasses[size],
        className
      )}
    >
      {showIcon ? (
        <Calendar className={iconSizes[size]} />
      ) : (
        <span>CM</span>
      )}
    </div>
  );
}
