import React, { useState } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Info,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Receipt } from '../types';
import { evaluateItemHealth } from '../utils/healthEvaluator';

interface PurchaseFrequencyPageProps {
  receipts?: Receipt[];
}

export const PurchaseFrequencyPage: React.FC<PurchaseFrequencyPageProps> = ({ receipts = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dynamically calculate product frequencies from real receipts
  const productFrequencyMap: Record<string, {
    productName: string;
    category: string;
    frequencyCount: number;
    totalSpent: number;
    healthStatus?: 'healthy' | 'limit' | 'less_healthy';
  }> = {};

  receipts.forEach(r => {
    (r.items || []).forEach(it => {
      const name = (it.name || '').trim();
      if (!name) return;
      const cat = it.category || 'Grocery';
      const qty = Number(it.quantity) || 1;
      const spent = Number(it.totalPrice) || 0;

      const evaluatedHealth = evaluateItemHealth(name, cat).status;

      if (!productFrequencyMap[name]) {
        productFrequencyMap[name] = {
          productName: name,
          category: cat,
          frequencyCount: 0,
          totalSpent: 0,
          healthStatus: evaluatedHealth
        };
      }
      productFrequencyMap[name].frequencyCount += qty;
      productFrequencyMap[name].totalSpent += spent;
      productFrequencyMap[name].healthStatus = evaluatedHealth;
    });
  });

  const allFrequentProducts = Object.values(productFrequencyMap).sort((a, b) => b.frequencyCount - a.frequencyCount);

  const categories = ['All', ...Array.from(new Set(allFrequentProducts.map(p => p.category)))];

  const filteredProducts = selectedCategory === 'All'
    ? allFrequentProducts
    : allFrequentProducts.filter((p) => p.category === selectedCategory);

  // Frequent alerts (items bought >= 3 times)
  const highFrequencySnacks = allFrequentProducts.filter(p => p.frequencyCount >= 3 && (p.category === 'Food & Health' || p.category === 'Grocery'));
  const highSugarItems = allFrequentProducts.filter(p => p.healthStatus === 'less_healthy' && p.frequencyCount >= 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
            Purchase Frequency Tracking
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Detects repetitive purchasing behavior, recurring grocery replenishment, and discretionary habit loops.
          </p>
        </div>

        {/* Category Filter */}
        {allFrequentProducts.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 self-start sm:self-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AUTOMATED FREQUENCY ALERTS */}
      {allFrequentProducts.length > 0 && (highFrequencySnacks.length > 0 || highSugarItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highFrequencySnacks.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>High Frequency Alert: {highFrequencySnacks[0].productName}</span>
              </div>
              <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                ⚠ <strong>Frequently Purchased:</strong> You purchased {highFrequencySnacks[0].productName} <span className="underline font-bold">{highFrequencySnacks[0].frequencyCount} times</span>. Consider checking your purchase cadence or buying in bulk to optimize costs.
              </p>
            </div>
          )}

          {highSugarItems.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Dietary Alert: {highSugarItems[0].productName}</span>
              </div>
              <p className="text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                ⚠ <strong>Repetitive Intake:</strong> You logged {highSugarItems[0].productName} <span className="underline font-bold">{highSugarItems[0].frequencyCount} times</span>. Consider substituting high sugar products with wholesome alternatives.
              </p>
            </div>
          )}
        </div>
      )}

      {/* BAR CHART: Frequency Count */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
              Product Purchase Frequency
            </h3>
            <p className="text-xs text-zinc-400">Total units logged from your registered receipts</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {allFrequentProducts.length} Items
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredProducts.slice(0, 10)} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                <XAxis dataKey="productName" tick={{ fontSize: 11, fill: '#71717a' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} units`, 'Frequency']}
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#f4f4f5', fontSize: '12px' }}
                />
                <Bar dataKey="frequencyCount" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-60 w-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <ShoppingBag className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">0 Products Tracked</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Your product frequency starts at 0. Once you add or scan receipts, repeating products will be tracked here.
            </p>
          </div>
        )}
      </div>

      {/* FREQUENT PRODUCTS CARDS GRID */}
      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.productName}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold font-display text-sm text-zinc-900 dark:text-zinc-100">
                    {prod.productName}
                  </h4>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {prod.category}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black font-display text-teal-600 dark:text-teal-400">
                    {prod.frequencyCount}x
                  </span>
                  <p className="text-[10px] text-zinc-400">Logged</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span>Total Amount Spent:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{prod.totalSpent.toLocaleString()}</span>
                </div>
              </div>

              {/* Smart Note */}
              <div className={`p-2.5 rounded-xl text-[11px] leading-snug ${
                prod.frequencyCount >= 3 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40' 
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400'
              }`}>
                {prod.frequencyCount >= 3 ? (
                  <span className="flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>Frequently repurchased item.</span>
                  </span>
                ) : (
                  <span className="flex items-start gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                    <span>Standard single or occasional purchase.</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
