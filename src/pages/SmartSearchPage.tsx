import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  ShoppingBag, 
  Calendar, 
  Building2, 
  ArrowRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { Receipt, ReceiptItem } from '../types';

interface SmartSearchPageProps {
  receipts: Receipt[];
  initialQuery?: string;
}

export const SmartSearchPage: React.FC<SmartSearchPageProps> = ({ receipts, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  const sampleQueries = [
    'Show all shampoo purchases',
    'How much did I spend on clothes?',
    'How many times did I buy biscuits?',
    'Show milk receipts',
    'Jeans'
  ];

  // Dynamic Smart Query Analysis from actual user receipts
  const smartAnswer = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null;

    // Search items matching query keywords across all receipts
    const matchingReceipts = new Set<string>();
    let matchingUnits = 0;
    let matchingSpent = 0;
    const foundItemNames = new Set<string>();
    let primaryCategory = 'General';

    receipts.forEach((r) => {
      (r.items || []).forEach((it) => {
        const itName = (it.name || '').toLowerCase();
        const itCat = (it.category || '').toLowerCase();
        const shop = (r.shopName || '').toLowerCase();
        
        if (itName.includes(q) || itCat.includes(q) || shop.includes(q) || q.includes(itName)) {
          matchingReceipts.add(r.id);
          matchingUnits += Number(it.quantity) || 1;
          matchingSpent += Number(it.totalPrice) || 0;
          foundItemNames.add(it.name);
          primaryCategory = it.category || primaryCategory;
        }
      });
    });

    if (matchingReceipts.size === 0) {
      return {
        title: `Search Summary for "${query}"`,
        answer: `No purchases matching "${query}" were found in your currently stored receipts.`,
        highlight: '0 Found (₹0 Spent)',
        category: 'Search'
      };
    }

    const itemsSummary = Array.from(foundItemNames).slice(0, 3).join(', ');
    const extraCount = foundItemNames.size > 3 ? ` and ${foundItemNames.size - 3} more` : '';

    return {
      title: `Search Analysis for "${query}"`,
      answer: `You spent ₹${matchingSpent.toLocaleString()} across ${matchingReceipts.size} receipt${matchingReceipts.size > 1 ? 's' : ''} (${matchingUnits} total units: ${itemsSummary}${extraCount}).`,
      highlight: `₹${matchingSpent.toLocaleString()} Spent (${matchingUnits} units)`,
      category: primaryCategory
    };
  }, [query, receipts]);

  // Match items across all receipts
  const matchedItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: { item: ReceiptItem; receipt: Receipt }[] = [];
    receipts.forEach((r) => {
      r.items.forEach((it) => {
        if (
          it.name.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          r.shopName.toLowerCase().includes(q)
        ) {
          results.push({ item: it, receipt: r });
        }
      });
    });
    return results;
  }, [receipts, query]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
          Smart Purchase Search
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Ask questions or search individual line items across all your historical store bills.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Type a product or question: e.g. 'Show all shampoo purchases', 'clothes', 'rice'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-zinc-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Try asking:</span>
          </span>
          {sampleQueries.map((sq) => (
            <button
              key={sq}
              onClick={() => setQuery(sq)}
              className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition-colors text-xs font-medium"
            >
              "{sq}"
            </button>
          ))}
        </div>
      </div>

      {/* SMART AI DIRECT ANSWER */}
      {smartAnswer && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 shadow-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>AI Direct Answer: {smartAnswer.title}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
              {smartAnswer.highlight}
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed">
            {smartAnswer.answer}
          </p>
        </div>
      )}

      {/* MATCHED LINE ITEMS RESULTS */}
      {query.trim() && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
              Matched Receipt Items ({matchedItems.length})
            </h3>
            <span className="text-xs text-zinc-400">Queried across {receipts.length} total receipts</span>
          </div>

          {matchedItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No specific line items matched "{query}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-2">Item Name</th>
                    <th className="pb-3 px-2">Store Name</th>
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2 text-center">Qty</th>
                    <th className="pb-3 px-2 text-right">Unit Price</th>
                    <th className="pb-3 px-2 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {matchedItems.map(({ item, receipt }, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-2 font-bold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                        <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-zinc-600 dark:text-zinc-400 font-medium">
                        {receipt.shopName}
                      </td>
                      <td className="py-3 px-2 text-zinc-500">
                        {receipt.date}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {item.quantity}x
                      </td>
                      <td className="py-3 px-2 text-right text-zinc-600 dark:text-zinc-400">
                        ₹{item.unitPrice}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{item.totalPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
