import React from 'react';
import logoImg from '../assets/images/expense_insight_logo_1788227161800.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showSubtitle = false, 
  className = '',
  iconOnly = false
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Visual App Logo Emblem */}
      <div 
        className={`${iconSizes[size]} relative overflow-hidden flex-shrink-0 shadow-md shadow-emerald-900/15 group-hover:scale-105 transition-all duration-300 border border-emerald-500/20 bg-emerald-950/10`}
      >
        <img 
          src={logoImg} 
          alt="Expense Insight Hub" 
          className="w-full h-full object-cover rounded-[inherit]"
          referrerPolicy="no-referrer"
        />
      </div>

      {!iconOnly && (
        <div>
          <div className="flex items-center leading-none">
            <span className={`${textSizes[size]} font-extrabold tracking-tight font-display text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5`}>
              <span>Expense</span>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Insight
              </span>
              <span className="text-zinc-900 dark:text-white font-extrabold">
                Hub
              </span>
            </span>
          </div>
          {showSubtitle && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium tracking-tight mt-1">
              Track • Analyze • Optimize Spending
            </p>
          )}
        </div>
      )}
    </div>
  );
};
