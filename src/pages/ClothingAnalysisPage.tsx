import React from 'react';
import { Shirt, AlertCircle, ShoppingBag, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Receipt } from '../types';

interface ClothingAnalysisPageProps {
  receipts?: Receipt[];
}

export const ClothingAnalysisPage: React.FC<ClothingAnalysisPageProps> = ({ receipts = [] }) => {
  const clothingItems: Array<{
    item: string;
    quantity: number;
    spent: number;
    shop: string;
    date: string;
  }> = [];

  let totalSpent = 0;
  let totalUnits = 0;
  const itemMap: Record<string, { count: number; spent: number }> = {};

  receipts.forEach(r => {
    (r.items || []).forEach(it => {
      if (it.category === 'Clothing') {
        const qty = Number(it.quantity) || 1;
        const spent = Number(it.totalPrice) || 0;
        const name = (it.name || '').trim();

        totalSpent += spent;
        totalUnits += qty;

        clothingItems.push({
          item: name,
          quantity: qty,
          spent,
          shop: r.shopName || 'Fashion Store',
          date: r.date || new Date().toISOString().split('T')[0]
        });

        if (!itemMap[name]) {
          itemMap[name] = { count: 0, spent: 0 };
        }
        itemMap[name].count += qty;
        itemMap[name].spent += spent;
      }
    });
  });

  const clothingStats = Object.keys(itemMap).map(name => ({
    name,
    count: itemMap[name].count,
    spent: itemMap[name].spent
  })).sort((a, b) => b.spent - a.spent);

  const topItem = clothingStats[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
          Clothing & Apparel Analysis
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Wardrobe spending breakdown, garment frequency, and budget checks calculated from your receipts.
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Clothing Spent</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Shirt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-display text-blue-600 dark:text-blue-400 mt-2">
            ₹{totalSpent.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{totalUnits} total garments logged</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Top Purchased Item</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-2 truncate">
            {topItem ? topItem.name : 'None yet'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{topItem ? `${topItem.count} units bought` : '0 items'}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Purchases Count</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-2">
            {clothingItems.length}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Receipt line items</p>
        </div>
      </div>

      {/* RECENT CLOTHING PURCHASES TABLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100 mb-4">
          Apparel Purchase History
        </h3>

        {clothingItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Garment Item</th>
                  <th className="pb-3">Retail Shop</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {clothingItems.map((c, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100">{c.item}</td>
                    <td className="py-3 text-zinc-500">{c.shop}</td>
                    <td className="py-3 text-zinc-500">{c.quantity}</td>
                    <td className="py-3 text-zinc-400">{c.date}</td>
                    <td className="py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">₹{c.spent.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-400 text-xs">
            0 clothing items recorded. Receipts with clothing items will automatically appear here.
          </div>
        )}
      </div>

    </div>
  );
};
