import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Receipt as ReceiptIcon, 
  ShoppingBag, 
  Star, 
  Flame, 
  ArrowUpRight, 
  UploadCloud, 
  FileText, 
  Salad, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  PlusCircle,
  Eye,
  Trash2,
  Search,
  MapPin,
  ListTodo,
  PieChart as PieIcon,
  BarChart3,
  Percent,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowDownRight,
  Bell
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { User, Receipt } from '../types';
import { evaluateItemHealth, isFoodOrGroceryItem } from '../utils/healthEvaluator';

interface DashboardPageProps {
  user: User | null;
  receipts?: Receipt[];
  onNavigate?: (page: string) => void;
  onViewReceipt?: (receipt: Receipt) => void;
  onDeleteReceipt?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Grocery': '#10b981',
  'Food & Health': '#f59e0b',
  'Clothing': '#3b82f6',
  'Beauty & Personal Care': '#ec4899',
  'Personal Care': '#ec4899',
  'Electronics': '#8b5cf6',
  'Home & Household': '#06b6d4',
  'Books & Education': '#6366f1',
  'Health Products': '#14b8a6',
  'Other': '#94a3b8'
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  user, 
  receipts = [], 
  onNavigate = (_page: string) => {},
  onViewReceipt,
  onDeleteReceipt
}) => {
  const [chartViewMode, setChartViewMode] = useState<'area' | 'bar'>('area');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  const budget = user?.monthlyBudget || 0;
  const hasBudget = budget > 0;
  
  // Real dynamic spent calculation from actual user receipts (starts strictly at 0)
  const spent = useMemo(() => {
    return receipts.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
  }, [receipts]);

  const remaining = hasBudget ? Math.max(0, budget - spent) : 0;
  const budgetUsedPct = hasBudget && budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const isBudgetExceeded = hasBudget && spent > budget;
  const avgTicket = receipts.length > 0 ? Math.round(spent / receipts.length) : 0;

  // Real products count and health statistics
  const { 
    productsCount, 
    uniqueProductsCount, 
    categoryTotals, 
    itemFrequencies, 
    healthyCount, 
    limitCount, 
    lessHealthyCount, 
    healthyNames, 
    limitNames, 
    lessHealthyNames 
  } = useMemo(() => {
    let pCount = 0;
    const catTotals: Record<string, number> = {};
    const itemFreqs: Record<string, { count: number; spent: number; category: string }> = {};
    let hCount = 0;
    let lCount = 0;
    let lhCount = 0;
    const hNames: string[] = [];
    const lNames: string[] = [];
    const lhNames: string[] = [];

    receipts.forEach(r => {
      (r.items || []).forEach(it => {
        const qty = Number(it.quantity) || 1;
        const total = Number(it.totalPrice) || 0;
        const cat = it.category || 'Grocery';

        pCount += qty;
        catTotals[cat] = (catTotals[cat] || 0) + total;

        const normName = (it.name || '').replace(/\(.*\)/, '').trim();
        if (normName) {
          if (!itemFreqs[normName]) {
            itemFreqs[normName] = { count: 0, spent: 0, category: cat };
          }
          itemFreqs[normName].count += qty;
          itemFreqs[normName].spent += total;
        }

        if (isFoodOrGroceryItem(it.name || '', cat)) {
          const itemStatus = evaluateItemHealth(it.name || '', cat).status;

          if (itemStatus === 'healthy') {
            hCount += qty;
            if (!hNames.includes(normName) && normName) hNames.push(normName);
          } else if (itemStatus === 'limit') {
            lCount += qty;
            if (!lNames.includes(normName) && normName) lNames.push(normName);
          } else if (itemStatus === 'less_healthy') {
            lhCount += qty;
            if (!lhNames.includes(normName) && normName) lhNames.push(normName);
          }
        }
      });
    });

    return {
      productsCount: pCount,
      uniqueProductsCount: Object.keys(itemFreqs).length,
      categoryTotals: catTotals,
      itemFrequencies: itemFreqs,
      healthyCount: hCount,
      limitCount: lCount,
      lessHealthyCount: lhCount,
      healthyNames: hNames,
      limitNames: lNames,
      lessHealthyNames: lhNames
    };
  }, [receipts]);

  // Top Category
  const { topCategory, topCategorySpent, topCategoryPct } = useMemo(() => {
    let topCat = 'None yet';
    let topSpent = 0;
    for (const cat in categoryTotals) {
      if (categoryTotals[cat] > topSpent) {
        topSpent = categoryTotals[cat];
        topCat = cat;
      }
    }
    const pct = spent > 0 ? Math.round((topSpent / spent) * 100) : 0;
    return { topCategory: topCat, topCategorySpent: topSpent, topCategoryPct: pct };
  }, [categoryTotals, spent]);

  // Most Frequent Item
  const { mostFrequentItem, mostFrequentCount } = useMemo(() => {
    let topIt = 'None yet';
    let maxCount = 0;
    for (const it in itemFrequencies) {
      if (itemFrequencies[it].count > maxCount) {
        maxCount = itemFrequencies[it].count;
        topIt = it;
      }
    }
    return { mostFrequentItem: topIt, mostFrequentCount: maxCount };
  }, [itemFrequencies]);

  // Dynamic Daily Spending for chart
  const { dailySpendingData, peakDay, peakDayAmount } = useMemo(() => {
    const spendingByDate: Record<string, number> = {};
    receipts.forEach(r => {
      const rawDate = r.date || new Date().toISOString().split('T')[0];
      const formattedDate = new Date(rawDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      spendingByDate[formattedDate] = (spendingByDate[formattedDate] || 0) + (Number(r.grandTotal) || 0);
    });

    let peak = 'N/A';
    let maxAmt = 0;
    const chartData = Object.keys(spendingByDate).map(day => {
      const amt = spendingByDate[day];
      if (amt > maxAmt) {
        maxAmt = amt;
        peak = day;
      }
      return { day, amount: amt };
    });

    return { dailySpendingData: chartData, peakDay: peak, peakDayAmount: maxAmt };
  }, [receipts]);

  // Dynamic Category chart data sorted by spend
  const categoryChartData = useMemo(() => {
    return Object.keys(categoryTotals)
      .map(name => ({
        name,
        value: categoryTotals[name],
        color: CATEGORY_COLORS[name] || '#14b8a6',
        percentage: spent > 0 ? Math.round((categoryTotals[name] / spent) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryTotals, spent]);

  // Dynamic Frequency chart data
  const frequencyChartData = useMemo(() => {
    return Object.keys(itemFrequencies)
      .map(name => ({
        name,
        count: itemFrequencies[name].count,
        spent: itemFrequencies[name].spent,
        category: itemFrequencies[name].category
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [itemFrequencies]);

  // High frequency alert items (>= 3 purchases)
  const highFrequencyAlerts = useMemo(() => {
    return Object.keys(itemFrequencies)
      .filter(name => itemFrequencies[name].count >= 3)
      .map(name => `${name} (${itemFrequencies[name].count}×)`);
  }, [itemFrequencies]);

  // Total food items
  const totalFoodItems = healthyCount + limitCount + lessHealthyCount;
  const healthyPct = totalFoodItems > 0 ? Math.round((healthyCount / totalFoodItems) * 100) : 0;
  const limitPct = totalFoodItems > 0 ? Math.round((limitCount / totalFoodItems) * 100) : 0;
  const lessHealthyPct = totalFoodItems > 0 ? Math.round((lessHealthyCount / totalFoodItems) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      
      {/* 1. TOP COMMAND BAR */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white shadow-md border border-emerald-500/25 p-5 sm:p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white">
              Welcome, {user?.name || 'Shopper'}!
            </h1>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-emerald-100 space-y-0.5 leading-snug">
              <p>Your Receipts.</p>
              <p>Your Spending.</p>
              <p className="text-emerald-300 font-extrabold">Your Smarter Financial Hub.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto">
            <button
              onClick={() => onNavigate('budget')}
              className="px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-400/30 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Wallet className="w-4 h-4 text-emerald-200" />
              <span>{hasBudget ? 'Budget' : 'Set Budget'}</span>
            </button>

            <button
              onClick={() => onNavigate('report')}
              className="px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-400/30 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Audit Report"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>Audit Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. COMPRESSED KEY METRICS TILES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. Total Spending */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Spent</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black font-display text-zinc-900 dark:text-zinc-50 tracking-tight">
              ₹{spent.toLocaleString()}
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 truncate">
              Avg: ₹{avgTicket.toLocaleString()} / bill
            </p>
          </div>
        </div>

        {/* 2. Monthly Budget */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Budget</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            {hasBudget ? (
              <>
                <div className="text-lg sm:text-xl font-black font-display text-zinc-900 dark:text-zinc-50 tracking-tight">
                  ₹{budget.toLocaleString()}
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full ${isBudgetExceeded ? 'bg-rose-500' : budgetUsedPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, budgetUsedPct)}%` }} 
                  />
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('budget')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  + Set Budget
                </button>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Not configured</p>
              </>
            )}
          </div>
        </div>

        {/* 3. Remaining Funds */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Remaining</span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            {hasBudget ? (
              <>
                <div className={`text-lg sm:text-xl font-black font-display tracking-tight ${isBudgetExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  ₹{remaining.toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  {isBudgetExceeded ? 'Over limit!' : `${100 - budgetUsedPct}% available`}
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-zinc-400">--</div>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Set limit</p>
              </>
            )}
          </div>
        </div>

        {/* 4. Total Receipts & Items */}
        <div 
          onClick={() => onNavigate('receipts')}
          className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Receipts</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <ReceiptIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black font-display text-zinc-900 dark:text-zinc-50 tracking-tight">
              {receipts.length} <span className="text-xs font-normal text-zinc-400">({productsCount} items)</span>
            </div>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 truncate">
              {uniqueProductsCount} unique products →
            </p>
          </div>
        </div>

        {/* 5. Top Spending Category */}
        <div 
          onClick={() => onNavigate('expenses')}
          className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Top Category</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-black font-display text-zinc-900 dark:text-zinc-50 truncate">
              {topCategory}
            </div>
            <p className="text-[10px] text-zinc-400 font-medium mt-0.5 truncate">
              {topCategorySpent > 0 ? `₹${topCategorySpent.toLocaleString()} (${topCategoryPct}%)` : 'No spend yet'}
            </p>
          </div>
        </div>

        {/* 6. Most Frequent Item */}
        <div 
          onClick={() => onNavigate('receipts')}
          className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Top Item</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-black font-display text-rose-600 dark:text-rose-400 truncate">
              {mostFrequentItem}
            </div>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {mostFrequentCount > 0 ? `${mostFrequentCount} orders • In History →` : '0 purchases'}
            </p>
          </div>
        </div>

      </div>

      {/* 3. DASHBOARD CHARTS ROW 1: SPENDING TRENDS & CATEGORY DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Spending Interactive Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold font-display text-zinc-900 dark:text-zinc-100 text-lg">
                    Spending Trends
                  </h3>
                  {dailySpendingData.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Daily expenditure fluctuations from scanned receipts
                </p>
              </div>

              {/* Chart Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  <button
                    onClick={() => setChartViewMode('area')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartViewMode === 'area'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Smooth Curve
                  </button>
                  <button
                    onClick={() => setChartViewMode('bar')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartViewMode === 'bar'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Daily Bars
                  </button>
                </div>

                <button
                  onClick={() => onNavigate('expenses')}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Expenses Breakdown"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Peak day badge */}
            {dailySpendingData.length > 1 && peakDay !== 'N/A' && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Peak Spending: <strong>₹{peakDayAmount.toLocaleString()}</strong> on {peakDay}</span>
              </div>
            )}

            {dailySpendingData.length > 0 ? (
              <div className="h-68 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartViewMode === 'area' ? (
                    <AreaChart data={dailySpendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717a" opacity={0.15} />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 11, fill: '#71717a' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#71717a' }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(v) => `₹${v}`} 
                      />
                      <Tooltip 
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Daily Total']}
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          borderRadius: '14px', 
                          border: '1px solid #27272a', 
                          color: '#f4f4f5', 
                          fontSize: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#spendGrad)" 
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={dailySpendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717a" opacity={0.15} />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 11, fill: '#71717a' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#71717a' }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(v) => `₹${v}`} 
                      />
                      <Tooltip 
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Daily Total']}
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          borderRadius: '14px', 
                          border: '1px solid #27272a', 
                          color: '#f4f4f5', 
                          fontSize: '12px' 
                        }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="#10b981" 
                        radius={[6, 6, 0, 0]} 
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-68 w-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Spending Activity Logged</p>
                <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                  Add grocery, store, or cafe bills to automatically see your daily expenditure trend.
                </p>
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add First Bill</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Aggregated across {receipts.length} registered receipts</span>
            <button
              onClick={() => onNavigate('report')}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Full Analytics Report →
            </button>
          </div>
        </div>

        {/* Category-wise Spending Donut & Distribution */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold font-display text-zinc-900 dark:text-zinc-100 text-lg">
                  Category Share
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Expense split across sectors</p>
              </div>
              <button 
                onClick={() => onNavigate('expenses')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {categoryChartData.length > 0 ? (
              <>
                {/* Donut Chart with Centered Total */}
                <div className="relative h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                        onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                        onMouseLeave={() => setActiveCategoryIndex(null)}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke={activeCategoryIndex === index ? '#ffffff' : 'transparent'}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Spent']}
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          borderRadius: '12px', 
                          border: 'none', 
                          color: '#f4f4f5', 
                          fontSize: '12px' 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total</span>
                    <span className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100">
                      ₹{spent >= 1000 ? `${(spent / 1000).toFixed(1)}k` : spent}
                    </span>
                  </div>
                </div>

                {/* Progress bars for top categories */}
                <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 max-h-48 overflow-y-auto pr-1">
                  {categoryChartData.map((cat, idx) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-zinc-400 text-[11px] font-medium">{cat.percentage}%</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{cat.value.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-2">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Category Breakdown</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Scanned bills will automatically distribute here.</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>{categoryChartData.length} distinct categories</span>
            <button onClick={() => onNavigate('expenses')} className="text-emerald-600 dark:text-emerald-400 hover:underline">
              Analyze Sectors
            </button>
          </div>
        </div>

      </div>

      {/* 4. DASHBOARD ROW 2: DEDICATED MODULE PORTALS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Portal 1: Purchase History & Invoices */}
        <div 
          onClick={() => onNavigate('receipts')}
          className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ReceiptIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {receipts.length} Invoices
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Purchase History & Invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Complete invoice repository, thermal receipts, delete controls, and frequent repurchase radar.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>Open Receipts & Invoices</span>
            <span>→</span>
          </div>
        </div>

        {/* Portal 2: Food & Health Analysis */}
        <div 
          onClick={() => onNavigate('health')}
          className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Salad className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {healthyPct}% Wholesome
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Food & Health Analysis</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Dietary & Health Index, full grocery nutritional audits, and wellness warnings moved here.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>View Health Index</span>
            <span>→</span>
          </div>
        </div>

        {/* Portal 3: Budget & Spending Alerts */}
        <div 
          onClick={() => onNavigate('budget')}
          className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                !hasBudget 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  : isBudgetExceeded 
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {!hasBudget ? 'Uncapped' : isBudgetExceeded ? 'Exceeded' : `${budgetUsedPct}% Used`}
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Budget & Spending Alerts</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-600 transition-colors" />
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Real-time threshold notifications, category limits, spending ceilings, and budget alarms.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>Manage Budget & Alerts</span>
            <span>→</span>
          </div>
        </div>

      </div>

      {/* 5. QUICK SHORTCUTS & ACTION DOCK */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => onNavigate('upload')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Upload Receipt</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">Upload photo, PDF, or enter bill</p>
        </div>

        <div 
          onClick={() => onNavigate('expenses')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PieIcon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Expenses</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">Category breakdowns</p>
        </div>

        <div 
          onClick={() => onNavigate('budget')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Budget & Alerts</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">Track limits & thresholds</p>
        </div>

        <div 
          onClick={() => onNavigate('report')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Audit Report</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">View monthly breakdown</p>
        </div>
      </div>

    </div>
  );
};
