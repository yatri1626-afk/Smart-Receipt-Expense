import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Wallet, 
  Receipt as ReceiptIcon, 
  Star, 
  ShoppingBag, 
  Flame, 
  Salad, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  ChevronDown,
  Filter,
  ArrowRight,
  Building2
} from 'lucide-react';
import { User, Receipt } from '../types';
import { evaluateItemHealth, isFoodOrGroceryItem } from '../utils/healthEvaluator';

interface MonthlyReportPageProps {
  user: User | null;
  receipts?: Receipt[];
}

export const MonthlyReportPage: React.FC<MonthlyReportPageProps> = ({ user, receipts = [] }) => {
  // Extract all available months from receipts
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    receipts.forEach(r => {
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d.getTime())) {
          // Key format: YYYY-MM
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          set.add(key);
        }
      }
    });
    return Array.from(set).sort().reverse();
  }, [receipts]);

  // Current month & Previous month keys
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Selected period: 'all' | 'this_month' | 'prev_month' | 'YYYY-MM'
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Filter receipts based on selected period
  const filteredReceipts = useMemo(() => {
    if (selectedPeriod === 'all') return receipts;

    let targetKey = selectedPeriod;
    if (selectedPeriod === 'this_month') targetKey = currentMonthKey;
    if (selectedPeriod === 'prev_month') targetKey = prevMonthKey;

    return receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === targetKey;
    });
  }, [receipts, selectedPeriod, currentMonthKey, prevMonthKey]);

  // Period display label
  const periodLabel = useMemo(() => {
    if (selectedPeriod === 'all') return 'All Time';
    if (selectedPeriod === 'this_month') {
      return `This Month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    }
    if (selectedPeriod === 'prev_month') {
      return `Previous Month (${prevDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    }
    // Specific YYYY-MM
    const [y, m] = selectedPeriod.split('-');
    const specificDate = new Date(Number(y), Number(m) - 1, 1);
    return specificDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedPeriod, now, prevDate]);

  // Dynamically calculate from filtered receipts
  const totalSpending = filteredReceipts.reduce((s, r) => s + (Number(r.grandTotal) || 0), 0);
  const totalReceipts = filteredReceipts.length;
  const totalUnits = filteredReceipts.reduce((s, r) => {
    return s + (r.items || []).reduce((is, it) => is + (Number(it.quantity) || 1), 0);
  }, 0);

  const monthlyBudget = user?.monthlyBudget || 0;
  const hasBudget = monthlyBudget > 0;
  const remaining = hasBudget ? Math.max(0, monthlyBudget - totalSpending) : 0;
  const budgetUtilization = hasBudget ? Math.min(100, Math.round((totalSpending / monthlyBudget) * 100)) : 0;

  // Category and Product aggregations
  const categoryTotals: Record<string, number> = {};
  const productCounts: Record<string, { count: number; category: string; spent: number }> = {};
  let healthy = 0;
  let limit = 0;
  let lessHealthy = 0;

  filteredReceipts.forEach(r => {
    (r.items || []).forEach(it => {
      const cat = it.category || 'Grocery';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(it.totalPrice) || 0);

      const name = (it.name || '').trim();
      if (name) {
        if (!productCounts[name]) {
          productCounts[name] = { count: 0, category: cat, spent: 0 };
        }
        productCounts[name].count += (Number(it.quantity) || 1);
        productCounts[name].spent += (Number(it.totalPrice) || 0);
      }

      if (isFoodOrGroceryItem(it.name || '', cat)) {
        const qty = Number(it.quantity) || 1;
        const st = evaluateItemHealth(it.name || '', cat).status;
        if (st === 'healthy') healthy += qty;
        else if (st === 'limit') limit += qty;
        else if (st === 'less_healthy') lessHealthy += qty;
      }
    });
  });

  // Top Category
  let topCategory = 'None yet';
  let topCategorySpend = 0;
  for (const cat in categoryTotals) {
    if (categoryTotals[cat] > topCategorySpend) {
      topCategorySpend = categoryTotals[cat];
      topCategory = cat;
    }
  }
  const topCategoryPct = totalSpending > 0 ? Math.round((topCategorySpend / totalSpending) * 100) : 0;

  // Top Product
  let topProduct = 'None yet';
  let topProductCount = 0;
  for (const p in productCounts) {
    if (productCounts[p].count > topProductCount) {
      topProductCount = productCounts[p].count;
      topProduct = p;
    }
  }

  // Handle Download as Text File
  const handleDownload = () => {
    const reportText = `==============================================
EXPENSE INSIGHT HUB - SPENDING & RECEIPT AUDIT REPORT
==============================================
Period:       ${periodLabel}
Generated:    ${new Date().toLocaleString()}
User:         ${user?.name || 'User'} (${user?.email || 'N/A'})
==============================================

FINANCIAL OVERVIEW:
-------------------
• Total Spending:            ₹${totalSpending.toLocaleString()}
• Total Receipts / Bills:    ${totalReceipts} Bills
• Total Item Units Logged:   ${totalUnits} Units
• Monthly Budget Allowance:  ${hasBudget ? `₹${monthlyBudget.toLocaleString()}` : 'Not set'}
• Remaining Budget Balance:  ${hasBudget ? `₹${remaining.toLocaleString()}` : 'N/A'}
• Budget Utilization:        ${hasBudget ? `${budgetUtilization}%` : 'N/A'}

TOP EXPENSE CATEGORY:
---------------------
• Top Category:              ${topCategory}
• Total Category Spend:      ₹${topCategorySpend.toLocaleString()} (${topCategoryPct}% of spend)

PRODUCT INSIGHTS:
-----------------
• Most Purchased Product:    ${topProduct} (${topProductCount} units)

HEALTH & NUTRITION AUDIT:
-------------------------
• Generally Healthy Items:   ${healthy} items
• Portion Limit Items:       ${limit} items
• Less Healthy / Sugar:      ${lessHealthy} items

DETAILED BILLS LOGGED IN THIS PERIOD (${totalReceipts} BILLS):
----------------------------------------------------------------------
${filteredReceipts.length === 0 ? 'No bills recorded for this period.' : filteredReceipts.map((r, idx) => {
  return `${idx + 1}. Date: ${r.date || 'N/A'} | Store: ${r.shopName || r.storeName || 'Store'} | Bill #: ${r.receiptNumber || r.id} | Amount: ₹${(r.grandTotal || 0).toLocaleString()} (${r.items?.length || 0} items)`;
}).join('\n')}

==============================================
Saved in Expense Insight Database
Report Generated on ${new Date().toLocaleDateString()}
==============================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Spending_Report_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
            Monthly Spending Report
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            View total expenses, receipt counts, and audit breakdowns for any month or all time.
          </p>
        </div>

        {/* Period Selector & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Month / Period Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="prev_month">Previous Month</option>
              {availableMonths.map((mKey) => {
                const [year, month] = mKey.split('-');
                const d = new Date(Number(year), Number(month) - 1, 1);
                const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <option key={mKey} value={mKey}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Download Text Report */}
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download report as text document"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      {/* REPORT PAPER CONTAINER */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Expense Insight Hub • Verified Audit Report</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-1">
              {periodLabel}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Account: {user?.name || 'User'} ({user?.email || 'N/A'})
            </p>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              Status: Live Calculated
            </span>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center justify-end gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Report Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>
        </div>

        {/* 6 REPORT METRICS TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. Total Spending in Period */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-zinc-400 font-medium">1. Total Expenses</span>
            <p className="text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-1">
              ₹{totalSpending.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Spent across {totalReceipts} receipt(s) in this period
            </p>
          </div>

          {/* 2. Total Receipts in Period */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-zinc-400 font-medium">2. Total Receipts</span>
            <p className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-1">
              {totalReceipts} {totalReceipts === 1 ? 'Receipt' : 'Receipts'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {totalUnits} items/products recorded
            </p>
          </div>

          {/* 3. Budget Status */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-zinc-400 font-medium">3. Budget Allowance</span>
            <p className="text-2xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-1">
              {hasBudget ? `₹${monthlyBudget.toLocaleString()}` : 'Not set'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {hasBudget ? `Remaining: ₹${remaining.toLocaleString()} (${budgetUtilization}% used)` : 'Set budget to track'}
            </p>
          </div>

          {/* 4. Top Category */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-zinc-400 font-medium">4. Top Expense Category</span>
            <p className="text-xl font-black font-display text-blue-600 dark:text-blue-400 mt-1 truncate">
              {topCategory}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              ₹{topCategorySpend.toLocaleString()} ({topCategoryPct}% of total spend)
            </p>
          </div>

          {/* 5. Most Purchased Product */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-zinc-400 font-medium">5. Most Frequent Item</span>
            <p className="text-xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-1 truncate">
              {topProduct}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {topProductCount} units recorded
            </p>
          </div>

          {/* 6. Food Health Audit */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
            <span className="text-xs text-zinc-400 font-medium">6. Food & Health Audit</span>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-bold text-emerald-600">🟢 {healthy} Healthy</span>
              <span className="text-xs font-bold text-amber-600">🟡 {limit} Limit</span>
              <span className="text-xs font-bold text-rose-600">🔴 {lessHealthy} Less</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {healthy + limit + lessHealthy} food units evaluated
            </p>
          </div>

        </div>

        {/* DETAILED RECEIPTS LOGGED FOR THIS PERIOD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-emerald-600" />
              <span>Bills / Receipts Recorded in {periodLabel} ({totalReceipts})</span>
            </h3>
            <span className="text-xs text-zinc-400">
              Total: ₹{totalSpending.toLocaleString()}
            </span>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
              No bills recorded for this period ({periodLabel}).
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Store / Shop</th>
                    <th className="py-3 px-4">Bill Number</th>
                    <th className="py-3 px-4">Items Count</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredReceipts.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-semibold text-zinc-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {r.date || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{r.shopName || r.storeName || 'Retail Store'}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-zinc-500">
                        {r.receiptNumber || r.id.slice(0, 12)}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {r.items?.length || 0} items
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-zinc-900 dark:text-zinc-100">
                        ₹{(r.grandTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Signature */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div>
            <p className="font-bold text-zinc-700 dark:text-zinc-300">SmartReceipt AI Insight Engine</p>
            <p className="text-[11px]">Database permanent record & receipt audit</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs">REF: {Date.now().toString().slice(-8)}</p>
            <p className="text-[10px]">Verified Audit Record</p>
          </div>
        </div>

      </div>

    </div>
  );
};
