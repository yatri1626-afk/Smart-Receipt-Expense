import React, { useEffect, useState } from 'react';
import { Users, Receipt, IndianRupee, TrendingUp, ArrowRight, RefreshCw, Store } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { AdminStats } from '../../types';

interface AdminDashboardPageProps {
  onNavigateToUsers: () => void;
  onNavigateToReceipts: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateToUsers,
  onNavigateToReceipts
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatCurrency = (val: number) => {
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  const shopColors: Record<string, string> = {
    'Smart Bazar': 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    'Reliance Fresh': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    'Big Bazar': 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    'D-Mart': 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    'Vishal Mega Mart': 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
  };

  const getShopBadgeColor = (name: string) => {
    return shopColors[name] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Users */}
        <div 
          onClick={onNavigateToUsers}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800 transition-all group"
        >
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Total Users
            </p>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {loading ? '—' : stats?.totalUsers ?? 0}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <span>Manage active accounts</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* Total Receipts */}
        <div 
          onClick={onNavigateToReceipts}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-teal-300 dark:hover:border-teal-800 transition-all group"
        >
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Total Receipts
            </p>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {loading ? '—' : stats?.totalReceipts ?? 0}
            </h3>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-medium flex items-center gap-1">
              <span>View all transactions</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/40 shadow-xs">
            <Receipt className="w-7 h-7" />
          </div>
        </div>

        {/* Total Spending */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Total Spending
            </p>
            <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {loading ? '—' : formatCurrency(stats?.totalSpending ?? 0)}
            </h3>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
              Avg. {formatCurrency(stats?.avgSpending ?? 0)} per bill
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40 shadow-xs">
            <IndianRupee className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Recent Receipts List (Full Width) */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Recent Receipts
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Latest expense transactions recorded across registered accounts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardStats}
                title="Refresh"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateToReceipts}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? (
              <div className="col-span-full py-12 text-center text-xs text-zinc-400">
                Loading recent receipts...
              </div>
            ) : stats?.recentReceipts && stats.recentReceipts.length > 0 ? (
              stats.recentReceipts.map((rec) => {
                const firstLetter = rec.shopName ? rec.shopName.charAt(0).toUpperCase() : 'S';
                const badgeColor = getShopBadgeColor(rec.shopName);
                return (
                  <div 
                    key={rec.id}
                    onClick={onNavigateToReceipts}
                    className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${badgeColor}`}>
                        {firstLetter}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                          {rec.shopName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {rec.date}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            • {rec.userName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(rec.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-zinc-400">
                No recent receipts recorded
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Synchronized with cloud database</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
};
