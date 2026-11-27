import React from 'react';
import { Home, Receipt, PlusCircle, PieChart, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activePage?: string;
  currentTab?: string;
  onNavigate?: (page: string) => void;
  onSelectTab?: (page: string) => void;
  onOpenSidebar?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  currentTab,
  onNavigate,
  onSelectTab,
  onOpenSidebar
}) => {
  const current = activePage || currentTab || 'dashboard';

  const handleNav = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    } else if (onSelectTab) {
      onSelectTab(id);
    }
  };

  const handleMenuClick = () => {
    if (onOpenSidebar) {
      onOpenSidebar();
    } else {
      handleNav('dashboard');
    }
  };

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'upload', label: 'Scan', icon: PlusCircle, isCta: true },
    { id: 'expenses', label: 'Expenses', icon: PieChart },
    { id: 'menu', label: 'Menu', icon: Menu, isMenu: true }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 backdrop-blur-lg bg-white/90 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;

          if (item.isCta) {
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="flex flex-col items-center justify-center -mt-5 relative group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 group-active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => (item.isMenu ? handleMenuClick() : handleNav(item.id))}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
