import React, { useEffect, useState } from 'react';
import { Search, Trash2, AlertTriangle, Loader2, RefreshCw, Receipt, Eye, X, ChevronDown, ChevronUp, ArrowRight, Store, Calendar, CreditCard, ShoppingBag } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { AdminUserRecord, AdminReceiptRecord } from '../../types';

interface AdminUsersPageProps {
  onNavigateToReceipts?: (userEmail?: string) => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onNavigateToReceipts }) => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<AdminUserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // User records viewing state
  const [activeUserForRecords, setActiveUserForRecords] = useState<AdminUserRecord | null>(null);
  const [userReceipts, setUserReceipts] = useState<AdminReceiptRecord[]>([]);
  const [loadingUserReceipts, setLoadingUserReceipts] = useState(false);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenUserRecords = async (user: AdminUserRecord) => {
    setActiveUserForRecords(user);
    setReceiptSearchQuery('');
    setExpandedReceiptId(null);
    setLoadingUserReceipts(true);
    try {
      // Fetch all receipts filtered for this user
      const all = await adminApi.getReceipts(user.id);
      setUserReceipts(all);
    } catch (err) {
      console.error('Failed to fetch user receipts:', err);
      setUserReceipts([]);
    } finally {
      setLoadingUserReceipts(false);
    }
  };

  const handleDeleteReceiptFromUser = async (receiptId: string) => {
    try {
      await adminApi.deleteReceipt(receiptId);
      setUserReceipts((prev) => prev.filter((r) => r.id !== receiptId));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === activeUserForRecords?.id
            ? { ...u, receiptsCount: Math.max(0, (u.receiptsCount || 1) - 1) }
            : u
        )
      );
    } catch (err) {
      console.error('Failed to delete receipt:', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await adminApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      if (activeUserForRecords?.id === userToDelete.id) {
        setActiveUserForRecords(null);
      }
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const filteredUserReceipts = userReceipts.filter((r) => {
    const q = receiptSearchQuery.toLowerCase();
    if (!q) return true;
    return (
      r.shopName.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      (r.items && r.items.some((i) => i.name.toLowerCase().includes(q)))
    );
  });

  const totalUserSpent = userReceipts.reduce((acc, r) => acc + (r.amount || r.grandTotal || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Search & Count */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Manage Users & Records
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total {users.length} registered accounts across Expense Insight Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
          </div>

          <button
            onClick={fetchUsers}
            title="Refresh"
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 w-16">ID</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Monthly Budget</th>
                <th className="px-6 py-3.5">Total Records</th>
                <th className="px-6 py-3.5 text-center">User Records</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading user records...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u, index) => (
                  <tr key={u.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400 text-xs">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-300/40">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ₹ {u.monthlyBudget?.toLocaleString('en-IN') || '5,000'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {u.receiptsCount} {u.receiptsCount === 1 ? 'receipt' : 'receipts'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenUserRecords(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-colors border border-emerald-200 dark:border-emerald-800/80 cursor-pointer shadow-2xs"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View All Records ({u.receiptsCount})</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setUserToDelete(u)}
                        title="Delete User"
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    No users matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER RECORDS DETAIL MODAL */}
      {activeUserForRecords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-emerald-500/20">
                  {activeUserForRecords.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                      {activeUserForRecords.name}'s Records
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                      User ID: {activeUserForRecords.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {activeUserForRecords.email} • Monthly Budget: ₹{activeUserForRecords.monthlyBudget?.toLocaleString('en-IN') || '5,000'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToReceipts && (
                  <button
                    onClick={() => {
                      onNavigateToReceipts(activeUserForRecords.email);
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                  >
                    <span>Open in Receipts Tab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveUserForRecords(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase">Total Records</p>
                <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {userReceipts.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Total Spent</p>
                <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  ₹ {totalUserSpent.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase">Avg / Receipt</p>
                <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  ₹ {userReceipts.length > 0 ? Math.round(totalUserSpent / userReceipts.length).toLocaleString('en-IN') : 0}
                </p>
              </div>
            </div>

            {/* Search Filter for Receipts */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={receiptSearchQuery}
                  onChange={(e) => setReceiptSearchQuery(e.target.value)}
                  placeholder="Filter user's receipts by store name, date, or item..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Receipts List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loadingUserReceipts ? (
                <div className="py-16 text-center text-xs text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Loading user's receipt records...
                </div>
              ) : filteredUserReceipts.length > 0 ? (
                filteredUserReceipts.map((rec) => {
                  const isExpanded = expandedReceiptId === rec.id;
                  return (
                    <div
                      key={rec.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 p-4 transition-all shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/50">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {rec.shopName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {rec.date}
                              </span>
                              {rec.shopAddress && <span>• {rec.shopAddress}</span>}
                              <span>• {rec.items?.length || 0} items</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Bill</p>
                            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                              ₹ {(rec.amount || rec.grandTotal || 0).toLocaleString('en-IN')}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setExpandedReceiptId(isExpanded ? null : rec.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Items' : 'View Items'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteReceiptFromUser(rec.id)}
                              title="Delete this record"
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable itemized table */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-150">
                          <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <ShoppingBag className="w-3 h-3 text-emerald-500" />
                            <span>Item Breakdown</span>
                          </h5>
                          {rec.items && rec.items.length > 0 ? (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                              {rec.items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="p-2.5 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                >
                                  <div>
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-zinc-400">
                                      Qty: {item.quantity || 1} × ₹{item.unitPrice} • <span className="text-emerald-600 dark:text-emerald-400">{item.category}</span>
                                    </p>
                                  </div>
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                    ₹{item.totalPrice || (item.quantity * item.unitPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 italic">No item list recorded for this receipt.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">
                  {receiptSearchQuery ? `No records matching "${receiptSearchQuery}"` : 'This user has not uploaded any receipts yet.'}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Viewing {filteredUserReceipts.length} of {userReceipts.length} records for {activeUserForRecords.name}
              </p>
              <button
                onClick={() => setActiveUserForRecords(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Delete User Account
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Are you sure you want to delete <span className="font-semibold text-zinc-800 dark:text-zinc-200">{userToDelete.name}</span> ({userToDelete.email})? This will also remove all their receipts from the system.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-sm shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
