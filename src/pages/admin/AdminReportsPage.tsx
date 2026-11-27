import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Receipt, 
  RefreshCw, 
  Search, 
  Mail, 
  User as UserIcon, 
  Calendar, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  PieChart as PieIcon,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { adminApi } from '../../services/adminApi';
import { AdminReportsData, AdminUserRecord, AdminReceiptRecord } from '../../types';

export const AdminReportsPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [userReceipts, setUserReceipts] = useState<AdminReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load all users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const userList = await adminApi.getUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch report whenever selectedUser changes
  const fetchReports = async (user?: AdminUserRecord | null) => {
    try {
      setLoading(true);
      const targetUser = user !== undefined ? user : selectedUser;
      const targetUserId = targetUser?.id || targetUser?.email;

      const [reportRes, receiptsRes] = await Promise.all([
        adminApi.getReports(targetUserId),
        targetUserId ? adminApi.getReceipts(targetUserId) : Promise.resolve([])
      ]);

      setData(reportRes);
      setUserReceipts(receiptsRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedUser);
  }, [selectedUser]);

  const handleSelectUser = (user: AdminUserRecord | null) => {
    setSelectedUser(user);
  };

  const formatCurrency = (val: number) => `₹ ${val.toLocaleString('en-IN')}`;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Overview Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <PieIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>User Spending Reports & Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            View individual user expense breakdowns and category-wise spending charts by selecting any user email below.
          </p>
        </div>

        <button
          onClick={() => {
            fetchUsers();
            fetchReports(selectedUser);
          }}
          title="Refresh Data"
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid: User Directory Selector on Left, Detailed Report on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: USER DIRECTORY ================= */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Select User Report
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {users.length} Users
            </span>
          </div>

          {/* User Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* All Users Toggle Option */}
          <div
            onClick={() => handleSelectUser(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedUser === null
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-700/70 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                selectedUser === null ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
                ALL
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  All Users (Aggregate)
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Platform-wide total expenses & categories
                </p>
              </div>
            </div>
            {selectedUser === null && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loadingUsers ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Loading users directory...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No users match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                const initial = (u.name || u.email || 'U').charAt(0).toUpperCase();

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                            {u.name || 'Anonymous User'}
                          </p>
                          
                          {/* Clickable Email Button / Label */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(u);
                            }}
                            className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate text-left cursor-pointer"
                            title={`Click to view ${u.email}'s report`}
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                          {u.receiptsCount || 0} bills
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: USER SEPARATE REPORT & CATEGORY CHART ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Context Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-900 dark:border dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-bold text-base">
                {selectedUser ? (selectedUser.name || selectedUser.email).charAt(0).toUpperCase() : '⚡'}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  {selectedUser ? 'Individual User Report' : 'System Aggregate Report'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedUser ? selectedUser.name || 'User Report' : 'All Registered Users'}</span>
                </h3>
                {selectedUser && (
                  <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono">{selectedUser.email}</span>
                  </p>
                )}
              </div>
            </div>

            {selectedUser && (
              <button
                onClick={() => handleSelectUser(null)}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer border border-zinc-700"
              >
                Back to All Users
              </button>
            )}
          </div>

          {/* Top 3 Stat Cards for this User */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Spending */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Total Expenses
              </p>
              <h4 className="text-2xl sm:text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 tracking-tight">
                {loading ? '—' : formatCurrency(data?.totalSpending || 0)}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-1">
                {selectedUser ? `For ${selectedUser.name || selectedUser.email}` : 'Across all registered accounts'}
              </p>
            </div>

            {/* Total Receipts */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Total Receipts
              </p>
              <h4 className="text-2xl sm:text-3xl font-black font-display text-emerald-600 dark:text-emerald-400 tracking-tight">
                {loading ? '—' : data?.totalReceipts || 0}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-1">
                Scanned & verified receipts
              </p>
            </div>

            {/* Average Spending */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Avg. Per Receipt
              </p>
              <h4 className="text-2xl sm:text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 tracking-tight">
                {loading ? '—' : formatCurrency(data?.avgSpending || 0)}
              </h4>
              <p className="text-[11px] text-zinc-400 mt-1">
                Average transaction value
              </p>
            </div>

          </div>

          {/* SPENDING BY CATEGORY CHART (Requested by user) */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Spending by Category</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selectedUser 
                    ? `Category-wise expense distribution for ${selectedUser.email}`
                    : 'Aggregated breakdown across all purchase categories'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Donut / Pie Chart */}
              <div className="md:col-span-6 h-64 w-full flex items-center justify-center">
                {loading ? (
                  <span className="text-xs text-zinc-400">Generating category chart...</span>
                ) : data?.spendingByCategory && data.spendingByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.spendingByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {data.spendingByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          borderRadius: '12px', 
                          border: 'none', 
                          color: '#fff', 
                          fontSize: '12px',
                          padding: '8px 12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-10 space-y-1">
                    <ShoppingBag className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">No category expenses found</p>
                    <p className="text-[11px] text-zinc-400">No purchase records logged for this user yet.</p>
                  </div>
                )}
              </div>

              {/* Legend & Breakdown List */}
              <div className="md:col-span-6 space-y-3">
                {data?.spendingByCategory && data.spendingByCategory.length > 0 ? (
                  data.spendingByCategory.map((cat) => (
                    <div key={cat.name} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 font-bold">
                        <span className="text-zinc-900 dark:text-zinc-100">
                          ₹{cat.value.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-zinc-400 w-10 text-right font-medium">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">No category data to display.</p>
                )}
              </div>
            </div>
          </div>

          {/* User's Recent Receipts (When a user is selected) */}
          {selectedUser && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Receipts by {selectedUser.name || selectedUser.email}</span>
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Individual receipts uploaded under this account
                  </p>
                </div>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                  {userReceipts.length} total
                </span>
              </div>

              <div className="space-y-2.5">
                {userReceipts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    No receipts uploaded by this user yet.
                  </div>
                ) : (
                  userReceipts.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                          {rec.shopName ? rec.shopName.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {rec.shopName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                            <span>{rec.date}</span>
                            <span>•</span>
                            <span>{rec.itemsCount || rec.items?.length || 0} items</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">
                          ₹ {(rec.amount || rec.grandTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
