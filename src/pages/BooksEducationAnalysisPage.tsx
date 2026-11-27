import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  Search, 
  GraduationCap, 
  DollarSign, 
  ShoppingCart
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Receipt, ProductCategory } from '../types';

interface BooksEducationAnalysisPageProps {
  receipts?: Receipt[];
  onNavigate?: (tab: string, itemData?: any) => void;
  onAddItemToBill?: (item: { name: string; category: ProductCategory; unitPrice: number }) => void;
}

export const BooksEducationAnalysisPage: React.FC<BooksEducationAnalysisPageProps> = ({
  receipts = [],
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all Books & Education items from user's receipts
  const educationReceiptItems = useMemo(() => {
    const list: Array<{
      id: string;
      item: string;
      quantity: number;
      spent: number;
      unitPrice: number;
      shop: string;
      date: string;
      receiptId: string;
    }> = [];

    receipts.forEach(r => {
      (r.items || []).forEach((it, idx) => {
        const cat = (it.category || '').toLowerCase();
        if (
          cat === 'books & education' || 
          cat === 'education' || 
          cat === 'books' ||
          cat.includes('book') ||
          cat.includes('education') ||
          cat.includes('study')
        ) {
          const qty = Number(it.quantity) || 1;
          const spent = Number(it.totalPrice) || 0;
          const unitPrice = Number(it.unitPrice) || (spent / qty) || 0;
          const name = (it.name || '').trim();

          list.push({
            id: it.id || `${r.id}-${idx}`,
            item: name,
            quantity: qty,
            spent,
            unitPrice,
            shop: r.shopName || 'Bookstore / Academic Retail',
            date: r.date || new Date().toISOString().split('T')[0],
            receiptId: r.id
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receipts]);

  // Aggregates
  const { totalSpent, totalUnits, topItem, averageItemPrice, monthlyTrend } = useMemo(() => {
    let spent = 0;
    let units = 0;
    const itemMap: Record<string, { count: number; spent: number }> = {};
    const monthMap: Record<string, number> = {};

    educationReceiptItems.forEach(it => {
      spent += it.spent;
      units += it.quantity;

      if (!itemMap[it.item]) {
        itemMap[it.item] = { count: 0, spent: 0 };
      }
      itemMap[it.item].count += it.quantity;
      itemMap[it.item].spent += it.spent;

      const monthKey = it.date.slice(0, 7);
      monthMap[monthKey] = (monthMap[monthKey] || 0) + it.spent;
    });

    const topList = Object.keys(itemMap)
      .map(name => ({ name, count: itemMap[name].count, spent: itemMap[name].spent }))
      .sort((a, b) => b.spent - a.spent);

    const trend = Object.keys(monthMap)
      .sort()
      .slice(-6)
      .map(m => ({
        month: m,
        spent: monthMap[m]
      }));

    return {
      totalSpent: spent,
      totalUnits: units,
      topItem: topList[0] || null,
      averageItemPrice: units > 0 ? Math.round(spent / units) : 0,
      monthlyTrend: trend.length > 0 ? trend : [{ month: 'Current', spent }]
    };
  }, [educationReceiptItems]);

  // Filtered Items
  const filteredReceiptItems = useMemo(() => {
    if (!searchQuery.trim()) return educationReceiptItems;
    const q = searchQuery.toLowerCase();
    return educationReceiptItems.filter(it => 
      it.item.toLowerCase().includes(q) || 
      it.shop.toLowerCase().includes(q)
    );
  }, [educationReceiptItems, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
                Books & Education Analysis
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Textbooks, stationery, certification courses, and learning material investments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Education Investment</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black font-display text-indigo-600 dark:text-indigo-400 mt-2">
            ₹{totalSpent.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{totalUnits} books & stationery units</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Top Book / Supply</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black font-display text-zinc-900 dark:text-zinc-100 mt-2 truncate">
            {topItem ? topItem.name : 'No items yet'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{topItem ? `₹${topItem.spent.toLocaleString()} spent (${topItem.count} units)` : '0 purchases recorded'}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Average Study Item</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-2">
            ₹{averageItemPrice.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Per book or stationery pack</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Purchase Records</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black font-display text-zinc-900 dark:text-zinc-100 mt-2">
            {educationReceiptItems.length}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Logged across all your receipts</p>
        </div>
      </div>

      {/* SPENDING TREND CHART */}
      {monthlyTrend.length > 1 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100 mb-2">
            Education & Learning Investment Over Time
          </h3>
          <p className="text-xs text-zinc-500 mb-4">Monthly trends for books, courses, exam materials, and academic supplies.</p>
          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Education Spent']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="spent" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* RECENT PURCHASES TABLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
              Education & Books Purchase History
            </h3>
            <p className="text-xs text-zinc-500">
              Receipt line items categorized as Books & Education.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search books, courses, or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {filteredReceiptItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Book / Item Name</th>
                  <th className="pb-3">Bookstore / Vendor</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredReceiptItems.map((c, i) => (
                  <tr key={`${c.id}-${i}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span>{c.item}</span>
                    </td>
                    <td className="py-3 text-zinc-500">{c.shop}</td>
                    <td className="py-3 text-center text-zinc-500">{c.quantity}</td>
                    <td className="py-3 text-zinc-400">{c.date}</td>
                    <td className="py-3 text-right text-zinc-500">₹{c.unitPrice.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      ₹{c.spent.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-400 text-xs space-y-2">
            <p>No educational items or books logged in your receipts yet.</p>
            <p className="text-zinc-500">Upload a receipt to get started.</p>
          </div>
        )}
      </div>

    </div>
  );
};
