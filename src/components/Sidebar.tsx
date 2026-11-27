import React from 'react';
import { 
  Home, 
  Receipt as ReceiptIcon, 
  UploadCloud, 
  PieChart, 
  Salad, 
  TrendingUp, 
  Shirt, 
  ShoppingCart, 
  ShoppingBag, 
  Wallet, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  X,
  Sparkles,
  Package,
  BookOpen,
  Laptop,
  ShieldCheck
} from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  currentTab?: string;
  activePage?: string;
  onSelectTab?: (page: string) => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  receiptsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activePage,
  onSelectTab,
  onNavigate,
  onLogout,
  onOpenAdmin,
  isOpenMobile = false,
  onCloseMobile,
  receiptsCount
}) => {
  const effectiveActive = activePage || currentTab || 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'receipts', label: 'Purchase History', icon: ReceiptIcon },
    { id: 'upload', label: 'Upload Receipt', icon: UploadCloud, highlight: true },
    { id: 'expenses', label: 'Expenses', icon: PieChart },
    { id: 'health', label: 'Food & Health', icon: Salad },
    { id: 'clothing', label: 'Clothing', icon: Shirt },
    { id: 'grocery', label: 'Grocery', icon: ShoppingCart },
    { id: 'beauty', label: 'Beauty Care', icon: Sparkles },
    { id: 'home-household', label: 'Household', icon: Package },
    { id: 'books-education', label: 'Books & Study', icon: BookOpen },
    { id: 'electronics', label: 'Electronics', icon: Laptop },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'report', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: UserIcon }
  ];

  const handleItemClick = (id: string) => {
    if (onSelectTab) onSelectTab(id);
    if (onNavigate) onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleClose = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-zinc-100 dark:border-zinc-800">
          <Logo size="md" showSubtitle={false} />
          <button 
            onClick={handleClose}
            className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Main Menu
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = effectiveActive === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : item.highlight
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Section with Admin & Logout */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Admin Portal</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-zinc-400 hover:text-red-500" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
