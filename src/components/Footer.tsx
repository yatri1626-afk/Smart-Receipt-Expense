import React from 'react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/80 py-6 px-6 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
          © 2026 Expense Insight Hub. All Rights Reserved. | Design by NMC
        </p>
      </div>
    </footer>
  );
};
