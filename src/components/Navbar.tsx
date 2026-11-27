import React, { useState } from 'react';
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Menu, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { User, Receipt } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  user: User | null;
  receipts?: Receipt[];
  activePage?: string;
  currentTab?: string;
  onNavigate?: (page: string) => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  onSearchQuery?: (q: string) => void;
  onSearch?: (q: string) => void;
  onQuickUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  receipts = [],
  onNavigate = (_page: string) => {},
  onLogout,
  onToggleSidebar
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const dynamicAlerts = React.useMemo(() => {
    const alerts: Array<{ 
      id: string; 
      type: 'warning' | 'danger' | 'info' | 'success'; 
      title: string; 
      desc: string;
      category?: string;
      actionPage?: string;
    }> = [];

    const totalSpent = (receipts || []).reduce((sum, r) => sum + (r.grandTotal || 0), 0);
    const budget = user?.monthlyBudget || 10000;

    // Total Monthly Budget Alerts
    if (budget > 0) {
      if (totalSpent > budget) {
        const over = totalSpent - budget;
        alerts.push({
          id: 'budget-exceeded',
          type: 'danger',
          title: '🚨 Monthly Budget Exceeded!',
          desc: `You have spent ₹${totalSpent.toLocaleString()} (₹${over.toLocaleString()} over your ₹${budget.toLocaleString()} limit).`,
          actionPage: 'budget'
        });
      } else if (totalSpent >= budget * 0.9) {
        alerts.push({
          id: 'budget-critical-90',
          type: 'warning',
          title: '⚠️ 90% Budget Limit Reached',
          desc: `You have spent ₹${totalSpent.toLocaleString()} of ₹${budget.toLocaleString()} (${((totalSpent / budget) * 100).toFixed(0)}% used). Only ₹${(budget - totalSpent).toLocaleString()} remaining.`,
          actionPage: 'budget'
        });
      } else if (totalSpent >= budget * 0.75) {
        alerts.push({
          id: 'budget-near-limit-75',
          type: 'warning',
          title: '📊 75% Budget Warning',
          desc: `You've utilized ${((totalSpent / budget) * 100).toFixed(0)}% of your monthly allowance (₹${(budget - totalSpent).toLocaleString()} left).`,
          actionPage: 'budget'
        });
      } else if (totalSpent > 0 && totalSpent <= budget * 0.5) {
        alerts.push({
          id: 'budget-healthy',
          type: 'success',
          title: '✅ Budget on Track',
          desc: `Good job! You've used only ${((totalSpent / budget) * 100).toFixed(0)}% of your monthly budget (₹${(budget - totalSpent).toLocaleString()} buffer left).`,
          actionPage: 'budget'
        });
      }
    }

    // Category Spending Limits Check from localStorage
    try {
      const storedBudgetsRaw = localStorage.getItem(user?.id ? `smartreceipt_user_budgets_${user.id}` : 'smartreceipt_user_budgets');
      if (storedBudgetsRaw) {
        const catBudgets = JSON.parse(storedBudgetsRaw);
        if (Array.isArray(catBudgets)) {
          catBudgets.forEach((cb: { category: string; allocated?: number; limit?: number }) => {
            const limit = cb.allocated || cb.limit || 0;
            if (limit > 0) {
              const catSpent = (receipts || []).reduce((sum, r) => {
                const itemSum = (r.items || [])
                  .filter(it => it.category?.toLowerCase() === cb.category?.toLowerCase())
                  .reduce((sub, it) => sub + (it.totalPrice || 0), 0);
                return sum + itemSum;
              }, 0);

              if (catSpent > limit) {
                alerts.push({
                  id: `cat-budget-${cb.category}`,
                  type: 'danger',
                  title: `🚨 ${cb.category} Budget Exceeded`,
                  desc: `Spent ₹${catSpent.toLocaleString()} against ₹${limit.toLocaleString()} limit in ${cb.category}.`,
                  actionPage: 'budget'
                });
              } else if (catSpent >= limit * 0.85) {
                alerts.push({
                  id: `cat-budget-near-${cb.category}`,
                  type: 'warning',
                  title: `⚠️ ${cb.category} Budget Alert`,
                  desc: `Used ${((catSpent / limit) * 100).toFixed(0)}% of your allocated ₹${limit.toLocaleString()} for ${cb.category}.`,
                  actionPage: 'budget'
                });
              }
            }
          });
        }
      }
    } catch (e) {}

    // Health limit checks
    let sweetCount = 0;
    (receipts || []).forEach(r => {
      (r.items || []).forEach(it => {
        const name = (it.name || '').toLowerCase();
        if (name.includes('biscuit') || name.includes('cola') || name.includes('soda') || name.includes('sugar') || it.healthStatus === 'less_healthy') {
          sweetCount += (it.quantity || 1);
        }
      });
    });

    if (sweetCount >= 4) {
      alerts.push({
        id: 'sugar-alert',
        type: 'info',
        title: '🍎 Dietary & Health Note',
        desc: `Logged ${sweetCount} sweetened snacks or cold drinks. Check your pantry health index.`,
        actionPage: 'health'
      });
    }

    return alerts;
  }, [receipts, user?.monthlyBudget, user?.id]);

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        
        {/* Left: Mobile Toggle, Website Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Website Logo and Brand Name in Header */}
          <div 
            onClick={() => onNavigate('dashboard')} 
            className="cursor-pointer group select-none py-1 flex-shrink-0"
            title="Expense Insight Hub - Click to go to Dashboard"
          >
            <Logo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Center Tagline (Track • Analyze • Optimize Spending) */}
        <div className="hidden md:flex items-center justify-center flex-1 mx-4 px-2 min-w-0 select-none">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-teal-950/40 border border-emerald-200/70 dark:border-emerald-800/50 shadow-xs">
            <span className="text-xs lg:text-sm font-medium tracking-wide text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Track</span>
              <span className="mx-2 text-emerald-500 font-bold">•</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Analyze</span>
              <span className="mx-2 text-emerald-500 font-bold">•</span>
              <span className="font-semibold text-teal-700 dark:text-teal-300">Optimize Spending</span>
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {dynamicAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              )}
            </button>

            {notifOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setNotifOpen(false)}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Smart Alerts</span>
                  <span className={`text-[10px] font-medium ${dynamicAlerts.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                    {dynamicAlerts.length} New
                  </span>
                </div>

                {dynamicAlerts.length === 0 ? (
                  <div className="py-6 px-3 text-center">
                    <div className="w-8 h-8 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-2">
                      <Bell className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No new notifications</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">
                      You're all caught up! Smart alerts and spending insights will appear as you scan receipts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dynamicAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          setNotifOpen(false);
                          if (alert.actionPage) onNavigate(alert.actionPage);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] ${
                          alert.type === 'danger'
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                            : alert.type === 'warning' 
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
                            : alert.type === 'info'
                            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/40 text-blue-800 dark:text-blue-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 font-semibold">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {alert.type === 'danger' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                            ) : alert.type === 'warning' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            ) : alert.type === 'success' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{alert.title}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-normal hover:underline flex-shrink-0">
                            View →
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                          {alert.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200/60 dark:border-zinc-800/80"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[100px] truncate">
                {user?.name || 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {profileOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setProfileOpen(false)}
              >
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.name || 'Logged in User'}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user?.email || 'user@expenseinsight.com'}</p>
                  <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                    Budget: ₹{user?.monthlyBudget?.toLocaleString() || '10,000'}
                  </div>
                </div>

                <div className="py-1 text-xs">
                  <button
                    onClick={() => onNavigate('profile')}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => onNavigate('budget')}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Budget & Settings</span>
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
