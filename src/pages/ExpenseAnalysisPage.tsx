import React, { useState } from 'react';
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  DollarSign,
  Shirt,
  ShoppingCart,
  Salad,
  Smartphone,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Receipt } from '../types';

interface ExpenseAnalysisPageProps {
  receipts?: Receipt[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Clothing': '#3b82f6',
  'Grocery': '#10b981',
  'Food & Health': '#f59e0b',
  'Beauty & Personal Care': '#ec4899',
  'Personal Care': '#ec4899',
  'Electronics': '#8b5cf6',
  'Home & Household': '#06b6d4',
  'Books & Education': '#6366f1'
};

export const ExpenseAnalysisPage: React.FC<ExpenseAnalysisPageProps> = ({ receipts = [] }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Dynamic calculations from user receipts
  const totalSpent = receipts.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  const productAgg: Record<string, { category: string; spent: number; quantity: number }> = {};

  receipts.forEach(r => {
    (r.items || []).forEach(it => {
      const cat = it.category || 'Grocery';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(it.totalPrice) || 0);

      const name = (it.name || '').trim();
      if (name) {
        if (!productAgg[name]) {
          productAgg[name] = { category: cat, spent: 0, quantity: 0 };
        }
        productAgg[name].spent += (Number(it.totalPrice) || 0);
        productAgg[name].quantity += (Number(it.quantity) || 1);
      }
    });
  });

  const categoriesData = Object.keys(categoryTotals).map(name => {
    const amount = categoryTotals[name];
    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    return {
      name,
      amount,
      percentage,
      color: CATEGORY_COLORS[name] || '#14b8a6'
    };
  }).sort((a, b) => b.amount - a.amount);

  const topCategory = categoriesData[0] || null;

  const topProducts = Object.keys(productAgg)
    .map(name => ({
      name,
      category: productAgg[name].category,
      spent: productAgg[name].spent,
      quantity: productAgg[name].quantity
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);

  // Dynamic timeline spending data
  const dateMap: Record<string, number> = {};
  receipts.forEach(r => {
    const dateStr = r.date || new Date().toISOString().split('T')[0];
    const label = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    dateMap[label] = (dateMap[label] || 0) + (Number(r.grandTotal) || 0);
  });
  const trendData = Object.keys(dateMap).map(label => ({
    label,
    amount: dateMap[label]
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
            Expense Analysis
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Deep drill-down into spending patterns, product costs, and category allocations.
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="flex items-center p-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs self-start sm:self-auto">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                period === p
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* CORE INSIGHT HIGHLIGHT BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border border-zinc-800 shadow-md">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Monthly Financial Summary</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Total Expenditure: <span className="text-emerald-400">₹{totalSpent.toLocaleString()}</span>
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-fit">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Calculated from {receipts.length} user receipt(s).</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Top Spending Driver</span>
            {topCategory ? (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center text-xl">
                    🛍️
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{topCategory.name}</h4>
                    <p className="text-xs text-zinc-400">{topCategory.percentage}% of total expenditure</p>
                  </div>
                </div>
                <span className="text-xl font-black font-display text-emerald-600 dark:text-emerald-400">₹{topCategory.amount.toLocaleString()}</span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-zinc-400 font-medium">
                No purchases logged yet. Upload or scan your receipts to see your top category.
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            {receipts.length > 0 ? `${productAgg ? Object.keys(productAgg).length : 0} unique items cataloged across your purchases.` : 'Start scanning receipts to generate itemized financial analytics.'}
          </p>
        </div>
      </div>

      {/* CHARTS: Spend Over Time & Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
                Expenditure Trend
              </h3>
              <p className="text-xs text-zinc-400">Daily receipt timeline</p>
            </div>
          </div>

          {trendData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    formatter={(val: any) => [`₹${val}`, 'Spending']}
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#f4f4f5', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#expGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Expenses Recorded</p>
              <p className="text-xs text-zinc-400 mt-1">Total spending is ₹0. Receipts you add will plot the expense curve here.</p>
            </div>
          )}
        </div>

        {/* Category Breakdown Progress */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100 mb-1">
              Category Allocation
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Proportionate breakdown of ₹{totalSpent.toLocaleString()}</p>

            {categoriesData.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {categoriesData.map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{c.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-400">({c.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 text-xs">
                No categories logged yet (₹0 spent)
              </div>
            )}
          </div>
        </div>

      </div>

      {/* TOP PRODUCTS SPENDING TABLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
              Purchased Products Breakdown
            </h3>
            <p className="text-xs text-zinc-400">Itemized expenses calculated from receipts</p>
          </div>
        </div>

        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Units</th>
                  <th className="pb-3 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500">{p.quantity}</td>
                    <td className="py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">₹{p.spent.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-400 text-xs">
            No products logged yet. Add your shopping receipts to see individual product breakdowns.
          </div>
        )}
      </div>

    </div>
  );
};
