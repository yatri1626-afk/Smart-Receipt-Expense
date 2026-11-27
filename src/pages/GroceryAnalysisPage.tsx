import React from 'react';
import { ShoppingCart, Calendar, TrendingUp, Sparkles, CheckCircle2, ShieldCheck, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Receipt } from '../types';

interface GroceryAnalysisPageProps {
  receipts?: Receipt[];
}

export const GroceryAnalysisPage: React.FC<GroceryAnalysisPageProps> = ({ receipts = [] }) => {
  let totalGrocerySpent = 0;
  let groceryVisits = 0;
  const groceryItemMap: Record<string, { count: number; spent: number }> = {};

  receipts.forEach(r => {
    let hasGrocery = false;
    (r.items || []).forEach(it => {
      if (it.category === 'Grocery' || it.category === 'Food & Health') {
        hasGrocery = true;
        const qty = Number(it.quantity) || 1;
        const spent = Number(it.totalPrice) || 0;
        const name = (it.name || '').trim();

        totalGrocerySpent += spent;

        if (name) {
          if (!groceryItemMap[name]) {
            groceryItemMap[name] = { count: 0, spent: 0 };
          }
          groceryItemMap[name].count += qty;
          groceryItemMap[name].spent += spent;
        }
      }
    });
    if (hasGrocery) groceryVisits++;
  });

  const groceryItems = Object.keys(groceryItemMap).map(name => ({
    item: name,
    count: groceryItemMap[name].count,
    spent: groceryItemMap[name].spent
  })).sort((a, b) => b.spent - a.spent);

  const topStaple = groceryItems[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
          Grocery & Pantry Analysis
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Monitor your essential staples, replenishment rhythms, and estimated monthly grocery budget.
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Grocery Spending</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{totalGrocerySpent.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Staples, dairy, bakery & pantry</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Top Pantry Staple</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-2 truncate">
            {topStaple ? topStaple.item : 'None yet'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{topStaple ? `${topStaple.count} units logged` : '0 items'}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Store Visits</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-2">
            {groceryVisits} Visits
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {groceryVisits > 0 ? `Avg bill: ₹${Math.round(totalGrocerySpent / groceryVisits)}` : '0 visits'}
          </p>
        </div>
      </div>

      {/* GROCERY SMART SUGGESTIONS */}
      <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
        <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
            Pantry & Grocery Intelligence
          </h4>
          <p className="mt-1 leading-relaxed text-sm">
            {groceryItems.length === 0 ? (
              "Grocery spending starts at ₹0. Once you scan supermarket receipts or upload grocery bills, Expense Insight Hub will detect recurring staples and calculate optimal restock schedules."
            ) : (
              `You have purchased ${groceryItems.length} unique grocery items totaling ₹${totalGrocerySpent.toLocaleString()}. Tracking these items regularly helps optimize household grocery budgets.`
            )}
          </p>
        </div>
      </div>

      {/* FREQUENT GROCERY ITEMS TABLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
          Replenished Grocery Items ({groceryItems.length})
        </h3>

        {groceryItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-2">Grocery Item</th>
                  <th className="pb-3 px-2 text-center">Purchases</th>
                  <th className="pb-3 px-2 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {groceryItems.map((g, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-2 font-bold text-zinc-900 dark:text-zinc-100">{g.item}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">{g.count}x</td>
                    <td className="py-3 px-2 text-right font-bold text-zinc-900 dark:text-zinc-100">₹{g.spent.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-400 text-xs">
            0 grocery items logged. Scan or upload your food and pantry receipts to view replenishment metrics.
          </div>
        )}
      </div>

    </div>
  );
};
