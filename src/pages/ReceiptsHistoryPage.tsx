import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  ShoppingBag, 
  Eye, 
  Trash2, 
  Download, 
  Plus, 
  Salad, 
  SlidersHorizontal,
  ChevronRight,
  Edit3,
  Flame,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Receipt as ReceiptIcon,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  AlertCircle,
  UploadCloud,
  X
} from 'lucide-react';
import { Receipt, ProductCategory } from '../types';
import { ReceiptModal } from '../components/ReceiptModal';
import { evaluateItemHealth } from '../utils/healthEvaluator';
import { api, formatHealthSummary } from '../services/api';

interface ReceiptsHistoryPageProps {
  receipts: Receipt[];
  onReceiptsChange?: (receipts: Receipt[]) => void;
  onDeleteReceipt?: (id: string) => void;
  onViewReceipt?: (receipt: Receipt) => void;
  onUploadClick?: () => void;
  onNavigate?: (page: string) => void;
}

export const ReceiptsHistoryPage: React.FC<ReceiptsHistoryPageProps> = ({
  receipts,
  onReceiptsChange,
  onDeleteReceipt,
  onViewReceipt,
  onUploadClick,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'receipts' | 'frequent'>('receipts');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedShop, setSelectedShop] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, 7days, 30days
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [frequentCategoryFilter, setFrequentCategoryFilter] = useState<string>('All');
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [modalMode, setModalMode] = useState<'bill' | 'edit'>('bill');
  const [deleteNoticeMessage, setDeleteNoticeMessage] = useState<string | null>(null);

  // Deletion Confirmation Modal State
  const [receiptPendingDelete, setReceiptPendingDelete] = useState<Receipt | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Extract unique shop names
  const uniqueShops = useMemo(() => {
    const shops = new Set(receipts.map((r) => r.shopName));
    return ['All', ...Array.from(shops)];
  }, [receipts]);

  // Categories list
  const categoriesList = [
    'All',
    'Grocery',
    'Clothing',
    'Food & Health',
    'Beauty & Personal Care',
    'Electronics'
  ];

  // Dynamically calculate product frequencies & re-orders from receipts
  const productFrequencyList = useMemo(() => {
    const map: Record<string, {
      productName: string;
      category: string;
      frequencyCount: number;
      totalSpent: number;
      lastShop: string;
      lastDate: string;
      healthStatus?: 'healthy' | 'limit' | 'less_healthy';
      healthNote?: string;
    }> = {};

    receipts.forEach((r) => {
      (r.items || []).forEach((it) => {
        const rawName = (it.name || '').trim();
        if (!rawName) return;

        const cat = it.category || 'Grocery';
        const qty = Number(it.quantity) || 1;
        const spent = Number(it.totalPrice) || 0;
        const healthEval = evaluateItemHealth(rawName, cat);

        if (!map[rawName]) {
          map[rawName] = {
            productName: rawName,
            category: cat,
            frequencyCount: 0,
            totalSpent: 0,
            lastShop: r.shopName,
            lastDate: r.date,
            healthStatus: healthEval.status,
            healthNote: healthEval.smartNote
          };
        }
        map[rawName].frequencyCount += qty;
        map[rawName].totalSpent += spent;
        map[rawName].lastShop = r.shopName;
        map[rawName].lastDate = r.date;
      });
    });

    return Object.values(map).sort((a, b) => b.frequencyCount - a.frequencyCount);
  }, [receipts]);

  // Frequent items categories
  const frequentCategories = useMemo(() => {
    return ['All', ...Array.from(new Set(productFrequencyList.map((p) => p.category)))];
  }, [productFrequencyList]);

  // Filtered frequent items
  const filteredFrequentProducts = useMemo(() => {
    return productFrequencyList.filter((p) => {
      const matchesCat = frequentCategoryFilter === 'All' || p.category === frequentCategoryFilter;
      const matchesSearch = !searchQuery || p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [productFrequencyList, frequentCategoryFilter, searchQuery]);

  // Top frequent item metrics
  const topFrequentItem = productFrequencyList[0];
  const totalRepurchases = productFrequencyList.filter(p => p.frequencyCount > 1).length;
  const totalRepeatSpend = productFrequencyList.reduce((acc, p) => p.frequencyCount > 1 ? acc + p.totalSpent : acc, 0);

  // Filtering logic for receipts archive
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Search
      const matchSearch =
        r.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      // Shop
      if (selectedShop !== 'All' && r.shopName !== selectedShop) return false;

      // Category
      if (selectedCategory !== 'All') {
        const hasCategory = r.items.some((it) => it.category === selectedCategory);
        if (!hasCategory) return false;
      }

      // Max price
      if (r.grandTotal > maxPrice) return false;

      // Date range filter
      if (dateFilter === 'this_month') {
        const now = new Date();
        const rDate = new Date(r.date);
        if (rDate.getFullYear() !== now.getFullYear() || rDate.getMonth() !== now.getMonth()) return false;
      } else if (dateFilter === 'prev_month') {
        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const rDate = new Date(r.date);
        if (rDate.getFullYear() !== prevYear || rDate.getMonth() !== prevMonth) return false;
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(r.date) < sevenDaysAgo) return false;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (new Date(r.date) < thirtyDaysAgo) return false;
      }

      return true;
    });
  }, [receipts, searchQuery, selectedShop, selectedCategory, maxPrice, dateFilter]);

  const promptDeleteReceipt = (r: Receipt) => {
    setReceiptPendingDelete(r);
  };

  const executeDeleteReceipt = async (id: string, shopName?: string, grandTotal?: number) => {
    const target = receipts.find((r) => r.id === id);
    const label = shopName || target?.shopName || 'Receipt';
    const amount = grandTotal !== undefined ? grandTotal : target?.grandTotal || 0;

    // 1. Instantly update UI and propagate to parent state
    const updated = receipts.filter((r) => r.id !== id);
    if (onReceiptsChange) onReceiptsChange(updated);
    if (onDeleteReceipt) onDeleteReceipt(id);
    setSelectedReceiptIds((prev) => prev.filter((item) => item !== id));

    setDeleteNoticeMessage(`Deleted receipt from "${label}" (₹${amount.toLocaleString()}) successfully.`);
    setTimeout(() => setDeleteNoticeMessage(null), 4000);

    // 2. Persist delete via API in the background
    try {
      await api.deleteReceipt(id);
    } catch (err) {
      console.warn('API delete receipt sync:', err);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!receiptPendingDelete) return;
    const target = receiptPendingDelete;
    setReceiptPendingDelete(null);
    await executeDeleteReceipt(target.id, target.shopName, target.grandTotal);
  };

  const handleDeleteReceiptDirect = async (id: string) => {
    const target = receipts.find(r => r.id === id);
    if (!target) return;
    promptDeleteReceipt(target);
  };

  const handleToggleSelectReceipt = (id: string) => {
    setSelectedReceiptIds((prev) => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedReceiptIds.length === filteredReceipts.length) {
      setSelectedReceiptIds([]);
    } else {
      setSelectedReceiptIds(filteredReceipts.map(r => r.id));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedReceiptIds.length === 0) return;
    const count = selectedReceiptIds.length;
    const idsToDelete = [...selectedReceiptIds];

    // Immediately update UI
    const updated = receipts.filter((r) => !idsToDelete.includes(r.id));
    if (onReceiptsChange) onReceiptsChange(updated);
    for (const id of idsToDelete) {
      if (onDeleteReceipt) onDeleteReceipt(id);
    }
    setSelectedReceiptIds([]);
    setIsSelectionMode(false);
    setIsBulkDeleteModalOpen(false);
    setDeleteNoticeMessage(`Successfully deleted ${count} selected receipts.`);
    setTimeout(() => setDeleteNoticeMessage(null), 4000);

    // Call API in sequence/parallel safely
    try {
      for (const id of idsToDelete) {
        await api.deleteReceipt(id);
      }
    } catch (err) {
      console.warn('Bulk delete sync warning:', err);
    }
  };

  const handleDownload = (r: Receipt) => {
    const jsonStr = JSON.stringify(r, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${r.receiptNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Purchase History & Invoices</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Complete digital ledger of your store visits, itemized invoices, receipts, and frequent repurchase cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('upload');
              else if (onUploadClick) onUploadClick();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Receipt</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {deleteNoticeMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{deleteNoticeMessage}</span>
          </div>
          <button 
            onClick={() => setDeleteNoticeMessage(null)}
            className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW SELECTOR TABS: Receipts Archive vs. Frequent Purchases & Re-Orders */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 w-fit">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'receipts'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Receipts Archive</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {receipts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('frequent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'frequent'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Frequent Purchases & Re-Orders</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
            {productFrequencyList.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: FREQUENT PURCHASES & RE-ORDERS PANEL */}
      {/* ========================================================================= */}
      {activeTab === 'frequent' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Quick Metrics Bar for Frequent Items */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Top Re-Ordered Item</p>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                  {topFrequentItem ? topFrequentItem.productName : 'None yet'}
                </h4>
                <p className="text-[10px] text-zinc-400">
                  {topFrequentItem ? `${topFrequentItem.frequencyCount} purchases (₹${topFrequentItem.totalSpent.toLocaleString()})` : 'Log bills to track'}
                </p>
              </div>
            </div>

            <div className="p-4.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Repeat Products</p>
                <h4 className="text-lg font-black font-display text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {totalRepurchases} <span className="text-xs font-normal text-zinc-400">items bought &gt;1×</span>
                </h4>
                <p className="text-[10px] text-zinc-400">Recurring pantry & retail replenishment</p>
              </div>
            </div>

            <div className="p-4.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Repeated Spend</p>
                <h4 className="text-lg font-black font-display text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{totalRepeatSpend.toLocaleString()}
                </h4>
                <p className="text-[10px] text-zinc-400">Total spent on repeat purchases</p>
              </div>
            </div>
          </div>

          {/* Category Filter & Search Bar for Frequent Items */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Frequent Purchases & Re-Order Radar</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Items ranked by total purchase volume and repurchase frequency across all registered bills.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search frequent item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {frequentCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFrequentCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    frequentCategoryFilter === cat
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Frequent Products Grid */}
          {filteredFrequentProducts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
                <Flame className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Frequent Items Found</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Scan or add receipts to automatically calculate repetitive item purchases and re-order insights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFrequentProducts.map((item, idx) => (
                <div
                  key={item.productName}
                  className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                          idx === 0 
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700' 
                            : idx === 1 
                            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200' 
                            : idx === 2
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {item.productName}
                          </h4>
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-800/50">
                          {item.frequencyCount}×
                        </span>
                      </div>
                    </div>

                    {/* Spend & Store Details */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                        <span>Total Cumulative Spend:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{item.totalSpent.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
                        <span>Last Store Visited:</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]">
                          {item.lastShop}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span>Last Purchase Date:</span>
                        <span>{item.lastDate}</span>
                      </div>
                    </div>

                    {/* Dietary Note if applicable */}
                    {item.healthNote && (
                      <div className="mt-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
                        <span>Dietary Type:</span>
                        <span className="font-semibold">{item.healthNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Quick Actions */}
                  <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setSearchQuery(item.productName);
                        setActiveTab('receipts');
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Find Bills with this Item</span>
                    </button>

                    {item.frequencyCount >= 3 && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                        High Re-Order
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ALL RECEIPTS ARCHIVE & FILTERS */}
      {/* ========================================================================= */}
      {activeTab === 'receipts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* RECENT UPLOADED RECEIPTS SHOWCASE */}
          {receipts.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ReceiptIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold font-display text-zinc-900 dark:text-zinc-100 text-base flex items-center gap-2">
                      <span>Recent Uploaded Receipts</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        Latest {Math.min(3, receipts.length)}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Quickly preview line items, print thermal receipts, or delete uploaded bills.
                    </p>
                  </div>
                </div>

                <span className="text-xs text-zinc-400">
                  {receipts.length} total receipts stored
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {receipts.slice(0, 3).map((r) => (
                  <div
                    key={`recent-${r.id}`}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/90 dark:border-zinc-700/70 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {r.shopName}
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{r.date}</span>
                            <span>•</span>
                            <span>{r.items?.length || 0} items</span>
                          </p>
                        </div>
                        <span className="text-sm font-black font-display text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          ₹{r.grandTotal?.toLocaleString()}
                        </span>
                      </div>

                      {/* Items preview tag list */}
                      {r.items && r.items.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {r.items.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] truncate max-w-[120px]">
                              {it.name}
                            </span>
                          ))}
                          {r.items.length > 2 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-zinc-400">+{r.items.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>

                      {/* Actions including prominent Delete button */}
                    <div className="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceipt(r);
                            setModalMode('bill');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="View Bill Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View</span>
                        </button>
                      </div>

                      {/* Prominent Delete Option with confirmation modal */}
                      <button
                        type="button"
                        onClick={() => promptDeleteReceipt(r)}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete this uploaded receipt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Frequent Alert Pill */}
          {topFrequentItem && topFrequentItem.frequencyCount > 1 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-850 border border-emerald-200/80 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Flame className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>
                  <strong>Top Re-Ordered Item:</strong> You purchased <strong>{topFrequentItem.productName}</strong> {topFrequentItem.frequencyCount} times across your bills.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('frequent')}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
              >
                View Re-Order Radar →
              </button>
            </div>
          )}

          {/* FILTER & VIEW CONTROLS BAR */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search shop, receipt #, or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Shop Filter */}
              <div>
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                >
                  {uniqueShops.map((shop) => (
                    <option key={shop} value={shop}>
                      {shop === 'All' ? 'All Stores / Shops' : shop}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                >
                  <option value="all">All Dates</option>
                  <option value="this_month">This Month</option>
                  <option value="prev_month">Previous Month</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>

            </div>

            {/* Price Range Slider & View Layout Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Filter Max Bill Price:</span>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-32 accent-emerald-600 cursor-pointer"
                />
                <span className="font-bold text-zinc-900 dark:text-zinc-100">≤ ₹{maxPrice.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Batch selection toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) setSelectedReceiptIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelectionMode
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isSelectionMode ? 'Cancel Select' : 'Select Multiple'}</span>
                </button>

                {/* View Layout Switcher (Grid vs Table) */}
                <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setViewLayout('grid')}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      viewLayout === 'grid'
                        ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                    title="Card Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLayout('table')}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      viewLayout === 'table'
                        ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                    title="Detailed Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-zinc-400 hidden sm:block">
                  Showing <span className="font-bold text-zinc-700 dark:text-zinc-300">{filteredReceipts.length}</span> of {receipts.length}
                </div>
              </div>
            </div>

            {/* Selection Actions Toolbar if Selection Mode is active */}
            {isSelectionMode && (
              <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs text-rose-900 dark:text-rose-200">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
                  >
                    {selectedReceiptIds.length === filteredReceipts.length ? 'Deselect All' : 'Select All Filtered'}
                  </button>
                  <span className="font-semibold">
                    {selectedReceiptIds.length} receipt{selectedReceiptIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  disabled={selectedReceiptIds.length === 0}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedReceiptIds.length})</span>
                </button>
              </div>
            )}

          </div>

          {/* RECEIPTS LIST: EMPTY STATE */}
          {filteredReceipts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-2">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
                {receipts.length === 0 ? 'No bill records entered yet' : 'No Receipts Matched Filter'}
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                {receipts.length === 0
                  ? 'Enter our bill today or upload any receipt. Every bill record you save is permanently stored in our account so you can view, search, and audit our records anytime or any day.'
                  : 'Try adjusting your search criteria, category filters, or price slider to see more receipts.'}
              </p>
              {receipts.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('upload-manual');
                      else if (onUploadClick) onUploadClick();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Enter Our Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate('upload');
                      else if (onUploadClick) onUploadClick();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Scan / Upload Receipt</span>
                  </button>
                </div>
              )}
            </div>
          ) : viewLayout === 'table' ? (
            /* ================= TABLE VIEW ================= */
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      {isSelectionMode && (
                        <th className="p-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedReceiptIds.length > 0 && selectedReceiptIds.length === filteredReceipts.length}
                            onChange={handleSelectAllFiltered}
                            className="rounded accent-rose-600 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="p-3.5">Store / Shop</th>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5 text-right">Receipt Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {filteredReceipts.map((receipt) => {
                      const isSelected = selectedReceiptIds.includes(receipt.id);
                      return (
                        <tr 
                          key={receipt.id}
                          className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                            isSelected ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          {isSelectionMode && (
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectReceipt(receipt.id)}
                                className="rounded accent-rose-600 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{receipt.shopName}</span>
                            </div>
                            <span className="text-[10px] font-normal text-zinc-400 block ml-6 truncate max-w-[180px]">
                              {receipt.shopAddress || 'Local Store'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-zinc-500">
                            {receipt.receiptNumber}
                          </td>
                          <td className="p-3.5 text-zinc-500">
                            {receipt.date}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                              {receipt.items?.length || 0} items
                            </span>
                          </td>
                          <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400 text-sm font-display">
                            ₹{receipt.grandTotal.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReceipt(receipt);
                                  setModalMode('bill');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                title="View Bill"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>View</span>
                              </button>

                              {/* Prominent Delete Option */}
                              <button
                                type="button"
                                onClick={() => promptDeleteReceipt(receipt)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Delete this receipt"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ================= GRID CARDS VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceipts.map((receipt) => {
                const categories = Array.from(new Set(receipt.items.map((i) => i.category)));
                const totalProducts = receipt.items.reduce((s, it) => s + it.quantity, 0);
                const isSelected = selectedReceiptIds.includes(receipt.id);

                return (
                  <div
                    key={receipt.id}
                    className={`p-5 rounded-3xl bg-white dark:bg-zinc-900 border transition-all flex flex-col justify-between group relative ${
                      isSelected
                        ? 'border-rose-500 shadow-md bg-rose-50/20 dark:bg-rose-950/10'
                        : 'border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Selection Checkbox on card when in selection mode */}
                    {isSelectionMode && (
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectReceipt(receipt.id)}
                          className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-rose-600 fill-rose-100" />
                          ) : (
                            <Square className="w-5 h-5 text-zinc-400" />
                          )}
                        </button>
                      </div>
                    )}

                    <div>
                      {/* Shop & Amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 pr-6">
                          <h4 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {receipt.shopName}
                          </h4>
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{receipt.shopAddress || 'Local Market'}</span>
                          </p>
                        </div>

                        {!isSelectionMode && (
                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-black font-display text-emerald-600 dark:text-emerald-400">
                              ₹{receipt.grandTotal.toLocaleString()}
                            </span>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              {receipt.receiptNumber}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Date & Product Count */}
                      <div className="flex items-center gap-3 my-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{receipt.date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{totalProducts} items</span>
                        </span>
                      </div>

                      {/* Categories Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {categories.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>

                      {/* Health summary */}
                      {receipt.healthSummary && Boolean(formatHealthSummary(receipt.healthSummary)) && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                          <Salad className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 mt-0.5" />
                          <span className="line-clamp-2">{formatHealthSummary(receipt.healthSummary)}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceipt(receipt);
                            setModalMode('bill');
                          }}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Bill</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceipt(receipt);
                            setModalMode('edit');
                          }}
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Edit items in this bill"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-zinc-400">
                        {/* Prominent Red Delete Button */}
                        <button
                          type="button"
                          onClick={() => promptDeleteReceipt(receipt)}
                          className="px-2.5 py-1 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Delete this receipt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE RECEIPT DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {receiptPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
                  Delete Uploaded Receipt?
                </h3>
                <p className="text-xs text-zinc-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Store / Shop:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{receiptPendingDelete.shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date:</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{receiptPendingDelete.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Invoice Number:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">{receiptPendingDelete.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Line Items:</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{receiptPendingDelete.items?.length || 0} items</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between text-sm font-bold">
                <span className="text-zinc-900 dark:text-zinc-100">Grand Total:</span>
                <span className="text-rose-600 dark:text-rose-400 font-display">₹{receiptPendingDelete.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Deleting this receipt will update your dashboard spend, category allocations, and purchase history.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReceiptPendingDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
                  Delete {selectedReceiptIds.length} Selected Receipts?
                </h3>
                <p className="text-xs text-zinc-500">
                  Bulk deletion cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You are about to permanently remove <strong>{selectedReceiptIds.length}</strong> receipt records. All associated line items, health metrics, and ledger histories will be deleted.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {selectedReceiptIds.length} Receipts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Bill Preview, Editing & Thermal Print */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          initialMode={modalMode}
          onClose={() => setActiveReceipt(null)}
          onDelete={(id) => {
            const target = activeReceipt;
            setActiveReceipt(null);
            executeDeleteReceipt(id, target.shopName, target.grandTotal);
          }}
          onUpdateReceipt={(updated) => {
            const updatedList = receipts.map((r) => (r.id === updated.id ? updated : r));
            if (onReceiptsChange) onReceiptsChange(updatedList);
            setActiveReceipt(updated);
          }}
        />
      )}

    </div>
  );
};
