import React from 'react';
import { Shield, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZKProofBadgeProps {
  variant?: 'default' | 'success' | 'info' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const ZKProofBadge: React.FC<ZKProofBadgeProps> = ({
  variant = 'default',
  size = 'sm',
  showIcon = true,
  className,
}) => {
  const variants = {
    default: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
    success: 'bg-green-500/20 text-green-200 border-green-400/30',
    info: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
    warning: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      title="Zero-Knowledge Proof: Tu información privada está protegida"
    >
      {showIcon && <Shield className={iconSizes[size]} />}
      <span>ZK Proof</span>
    </span>
  );
};

interface ZKProofInfoProps {
  className?: string;
}

export const ZKProofInfo: React.FC<ZKProofInfoProps> = ({ className }) => {
  return (
    <div className={cn('p-4 bg-blue-500/10 rounded-lg border border-blue-500/20', className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="font-medium text-blue-100 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Protección con Zero-Knowledge Proofs
            </h4>
            <p className="text-sm text-blue-200 mt-1">
              Demuestra que alcanzaste tu meta <strong>sin revelar tu balance real</strong>.
            </p>
          </div>
          <div className="text-xs text-blue-300/80 space-y-1">
            <p>• Tu balance permanece completamente privado</p>
            <p>• Solo se verifica que balance ≥ objetivo</p>
            <p>• Verificación on-chain en Stellar/Soroban</p>
          </div>
        </div>
      </div>
    </div>
  );
};

