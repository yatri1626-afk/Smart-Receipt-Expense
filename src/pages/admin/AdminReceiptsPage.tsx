import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash2, AlertTriangle, Loader2, RefreshCw, X, Receipt, ShoppingBag, Filter, User, Calendar, Store } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { AdminReceiptRecord } from '../../types';

interface AdminReceiptsPageProps {
  initialUserFilter?: string;
  onClearUserFilter?: () => void;
}

export const AdminReceiptsPage: React.FC<AdminReceiptsPageProps> = ({
  initialUserFilter = '',
  onClearUserFilter
}) => {
  const [receipts, setReceipts] = useState<AdminReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>(initialUserFilter);
  const [receiptToView, setReceiptToView] = useState<AdminReceiptRecord | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<AdminReceiptRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialUserFilter !== undefined) {
      setSelectedUserFilter(initialUserFilter);
    }
  }, [initialUserFilter]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getReceipts();
      setReceipts(data);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    try {
      setDeleting(true);
      await adminApi.deleteReceipt(receiptToDelete.id);
      setReceipts((prev) => prev.filter((r) => r.id !== receiptToDelete.id));
      setReceiptToDelete(null);
    } catch (err) {
      console.error('Failed to delete receipt:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Extract unique users from receipts list for filter dropdown
  const uniqueUsers = React.useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; email: string; count: number }>();
    for (const r of receipts) {
      const key = (r.userEmail || r.userId || 'Unknown').toLowerCase();
      if (!userMap.has(key)) {
        userMap.set(key, {
          id: r.userId,
          name: r.userName || 'Customer',
          email: r.userEmail || 'N/A',
          count: 1
        });
      } else {
        const item = userMap.get(key)!;
        item.count += 1;
      }
    }
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [receipts]);

  const handleClearFilter = () => {
    setSelectedUserFilter('');
    if (onClearUserFilter) {
      onClearUserFilter();
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    // Check user filter
    if (selectedUserFilter) {
      const filterLower = selectedUserFilter.toLowerCase();
      const matchesEmail = (r.userEmail || '').toLowerCase() === filterLower;
      const matchesId = (r.userId || '').toLowerCase() === filterLower;
      const matchesName = (r.userName || '').toLowerCase().includes(filterLower);
      if (!matchesEmail && !matchesId && !matchesName) {
        return false;
      }
    }

    // Check search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesStore = r.shopName.toLowerCase().includes(q);
      const matchesUser = (r.userName && r.userName.toLowerCase().includes(q)) || (r.userEmail && r.userEmail.toLowerCase().includes(q));
      const matchesDate = r.date && r.date.toLowerCase().includes(q);
      const matchesItem = r.items && r.items.some((item) => item.name.toLowerCase().includes(q));
      if (!matchesStore && !matchesUser && !matchesDate && !matchesItem) {
        return false;
      }
    }

    return true;
  });

  const totalFilteredAmount = filteredReceipts.reduce((sum, r) => sum + (r.amount || r.grandTotal || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Search & Count */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Manage All User Receipts
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total {receipts.length} recorded receipts across Expense Insight Hub
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter by User Dropdown */}
          <div className="relative min-w-[180px]">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              <option value="">All Users ({receipts.length} total)</option>
              {uniqueUsers.map((u) => (
                <option key={u.email || u.id} value={u.email || u.id}>
                  {u.name} ({u.count}) - {u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store, items, date..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
          </div>

          <button
            onClick={fetchReceipts}
            title="Refresh"
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active User Filter Notification Banner */}
      {selectedUserFilter && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <User className="w-4 h-4 text-emerald-600" />
            <span>
              Showing records for user: <strong className="font-bold">{selectedUserFilter}</strong> ({filteredReceipts.length} receipts • Total: ₹{totalFilteredAmount.toLocaleString('en-IN')})
            </span>
          </div>
          <button
            onClick={handleClearFilter}
            className="px-2.5 py-1 rounded-lg bg-emerald-200/70 hover:bg-emerald-300 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear User Filter</span>
          </button>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 w-16">ID</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Shop Name</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading receipts...
                  </td>
                </tr>
              ) : filteredReceipts.length > 0 ? (
                filteredReceipts.map((r, index) => (
                  <tr key={r.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400 text-xs">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{r.userName}</span>
                        {r.userEmail && (
                          <p className="text-[10px] text-zinc-400 font-normal">{r.userEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      {r.shopName}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ₹ {(r.amount || r.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {r.date}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {r.items?.length || r.itemsCount || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setReceiptToView(r)}
                          title="View Receipt Details"
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setReceiptToDelete(r)}
                          title="Delete Receipt"
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    No receipts matching the current criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Receipt Details Modal */}
      {receiptToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {receiptToView.shopName}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Date: {receiptToView.date} • Customer: {receiptToView.userName} ({receiptToView.userEmail})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceiptToView(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto pr-1">
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Purchased Items ({receiptToView.items?.length || 0})
              </h4>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                {receiptToView.items && receiptToView.items.length > 0 ? (
                  receiptToView.items.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Qty: {item.quantity || 1} × ₹{item.unitPrice} • <span className="text-emerald-600 dark:text-emerald-400 font-medium">{item.category}</span>
                        </p>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{item.totalPrice || (item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No detailed item breakdown recorded
                  </div>
                )}
              </div>
            </div>

            {/* Grand Total Footer */}
            <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Grand Total</p>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹ {(receiptToView.amount || receiptToView.grandTotal || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setReceiptToView(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {receiptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Delete Receipt
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Are you sure you want to delete receipt from <span className="font-semibold text-zinc-800 dark:text-zinc-200">{receiptToDelete.shopName}</span> (₹{receiptToDelete.amount}) for user {receiptToDelete.userName}? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setReceiptToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReceipt}
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

