import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'circle' | 'card' | 'button';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  variant = 'text'
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700';
  
  const variantClasses = {
    text: 'rounded-md',
    circle: 'rounded-full',
    card: 'rounded-xl',
    button: 'rounded-lg'
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${width} ${height} ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}
    />
  );
};

// Skeleton components específicos
export const SkeletonBalance: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <SkeletonLoader width="w-32" height="h-4" />
      <SkeletonLoader width="w-8" height="h-8" variant="circle" />
    </div>
    <SkeletonLoader width="w-48" height="h-12" />
    <div className="space-y-2">
      <SkeletonLoader width="w-full" height="h-2" />
      <SkeletonLoader width="w-3/4" height="h-2" />
    </div>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-gray-800/50 backdrop-blur-xl border-white/20 p-6 rounded-xl space-y-4 animate-pulse">
    <div className="flex items-center space-x-3">
      <SkeletonLoader width="w-10" height="h-10" variant="circle" />
      <div className="space-y-2 flex-1">
        <SkeletonLoader width="w-24" height="h-4" />
        <SkeletonLoader width="w-16" height="h-3" />
      </div>
    </div>
    <SkeletonLoader width="w-32" height="h-8" />
  </div>
);

export const SkeletonTransaction: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-700/20 animate-pulse">
    <SkeletonLoader width="w-12" height="h-12" variant="circle" />
    <div className="flex-1 space-y-2">
      <SkeletonLoader width="w-32" height="h-4" />
      <SkeletonLoader width="w-24" height="h-3" />
    </div>
    <div className="text-right space-y-2">
      <SkeletonLoader width="w-20" height="h-4" />
      <SkeletonLoader width="w-16" height="h-3" />
    </div>
  </div>
); 