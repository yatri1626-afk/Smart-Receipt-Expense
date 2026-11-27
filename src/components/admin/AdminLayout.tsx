import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  BarChart3, 
  LogOut, 
  ArrowLeft,
  Menu,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { AdminLogoutModal } from './AdminLogoutModal';
import { Logo } from '../Logo';
import { getAdminUser } from '../../services/adminApi';

export type AdminTab = 'dashboard' | 'users' | 'receipts' | 'reports';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  onBackToApp: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  onBackToApp,
  children
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'receipts' as AdminTab, label: 'Receipts', icon: Receipt },
    { id: 'reports' as AdminTab, label: 'Reports', icon: BarChart3 }
  ];

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return { 
          title: 'Dashboard', 
          subtitle: 'Track, Analyze & Optimize your spending & financial performance' 
        };
      case 'users':
        return { title: 'Manage Users', subtitle: 'All registered accounts across Expense Insight Hub' };
      case 'receipts':
        return { title: 'Manage Receipts', subtitle: 'All receipts and expense records uploaded by all users' };
      case 'reports':
        return { title: 'Reports & Analytics', subtitle: 'Comprehensive spending analysis, stores, and category insights' };
      default:
        return { title: 'Console', subtitle: 'Track, Analyze & Optimize' };
    }
  };

  const headerInfo = getPageTitle();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-5 shrink-0 justify-between">
        <div>
          {/* Logo */}
          <div className="pb-5 border-b border-zinc-200 dark:border-zinc-800 mb-6">
            <div className="flex items-center justify-between">
              <Logo size="sm" />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1.5 pl-1">
              Control & Management Console
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <button
            onClick={onBackToApp}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Main Website</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-2 z-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
            <button
              onClick={onBackToApp}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-center"
            >
              Back to Main Website
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutModal(true);
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 hidden md:flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {headerInfo.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {headerInfo.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>

            <div className="h-4 w-px bg-zinc-200 dark:border-zinc-700" />

            {/* Admin Avatar Badge */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-extrabold text-xs border border-emerald-300/40">
                A
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight">Administrator</p>
                <p className="text-[11px] text-zinc-400">{getAdminUser()?.email || 'Console Session'}</p>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <AdminLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          onLogout();
        }}
      />
    </div>
  );
};
