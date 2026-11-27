import React, { useMemo } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  Wallet, 
  Salad, 
  Shirt, 
  MapPin, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  UploadCloud,
  ShoppingBag
} from 'lucide-react';
import { User, Receipt } from '../types';
import { evaluateItemHealth, isFoodOrGroceryItem } from '../utils/healthEvaluator';

interface SmartSuggestionsPageProps {
  user?: User | null;
  receipts?: Receipt[];
  onNavigate?: (page: string) => void;
}

export const SmartSuggestionsPage: React.FC<SmartSuggestionsPageProps> = ({ 
  user, 
  receipts = [], 
  onNavigate = (_page: string) => {} 
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'budget': return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'health': return <Salad className="w-5 h-5 text-emerald-600" />;
      case 'clothing': return <Shirt className="w-5 h-5 text-blue-600" />;
      case 'location': return <MapPin className="w-5 h-5 text-amber-600" />;
      default: return <Sparkles className="w-5 h-5 text-purple-600" />;
    }
  };

  // Generate dynamic suggestions based on user's real receipts and budget
  const suggestions = useMemo(() => {
    const list: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      actionLabel: string;
      route: string;
    }> = [];

    const totalSpent = receipts.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
    const budget = user?.monthlyBudget || 10000;

    if (receipts.length === 0) {
      list.push(
        {
          id: 'sug-starter-1',
          category: 'budget',
          title: 'Initialize Your Monthly Budget Guard',
          description: `Your monthly allowance is set to ₹${budget.toLocaleString()}. Configure custom category caps in Budget & Spending Limits.`,
          impact: 'medium',
          actionLabel: 'Set Budget Caps',
          route: 'budget'
        },
        {
          id: 'sug-starter-2',
          category: 'shopping',
          title: 'Scan & Digitize Your First Receipt',
          description: 'Upload a bill photo or use live camera capture to unlock automated OCR breakdown, category tagging, and nutrition scoring.',
          impact: 'high',
          actionLabel: 'Scan Bill Now',
          route: 'upload'
        },
        {
          id: 'sug-starter-3',
          category: 'location',
          title: 'Discover Verified Local Retailers',
          description: 'Find top-rated nearby supermarkets, clothing boutiques, and organic stores with competitive pricing and navigation routes.',
          impact: 'low',
          actionLabel: 'Explore Shops',
          route: 'nearby'
        }
      );
      return list;
    }

    // Dynamic suggestions based on real receipts
    if (totalSpent > budget) {
      list.push({
        id: 'sug-overbudget',
        category: 'budget',
        title: 'Monthly Budget Limit Exceeded',
        description: `You have spent ₹${totalSpent.toLocaleString()} against your ₹${budget.toLocaleString()} target limit. Review itemized spending to rebalance.`,
        impact: 'high',
        actionLabel: 'Review Budget',
        route: 'budget'
      });
    } else {
      const remaining = budget - totalSpent;
      const pct = Math.round((totalSpent / budget) * 100);
      list.push({
        id: 'sug-budget-on-track',
        category: 'budget',
        title: `Budget On Track (${100 - pct}% remaining)`,
        description: `You have ₹${remaining.toLocaleString()} remaining in your allowance. Keep scanning receipts to maintain savings accuracy.`,
        impact: 'medium',
        actionLabel: 'Manage Budgets',
        route: 'budget'
      });
    }

    // Health items count
    let limitItemCount = 0;
    let healthyItemCount = 0;
    let clothingSpend = 0;

    receipts.forEach(r => {
      (r.items || []).forEach(it => {
        const cat = it.category || 'Grocery';
        if (isFoodOrGroceryItem(it.name || '', cat)) {
          const st = evaluateItemHealth(it.name || '', cat).status;
          if (st === 'limit' || st === 'less_healthy') limitItemCount += (it.quantity || 1);
          if (st === 'healthy') healthyItemCount += (it.quantity || 1);
        }
        if (it.category === 'Clothing') clothingSpend += (it.totalPrice || 0);
      });
    });

    if (limitItemCount > 0) {
      list.push({
        id: 'sug-health-warning',
        category: 'health',
        title: 'Nutritional Balance Advisory',
        description: `You have ${limitItemCount} items flagged for moderate or high sugar/processed ingredients. Consider swapping with fresh staples.`,
        impact: 'medium',
        actionLabel: 'View Health Score',
        route: 'health'
      });
    }

    if (clothingSpend > 0) {
      list.push({
        id: 'sug-clothing-watch',
        category: 'clothing',
        title: 'Apparel Spending Tracked',
        description: `You've spent ₹${clothingSpend.toLocaleString()} across your clothing purchases. Track apparel volume and seasonal trends.`,
        impact: 'low',
        actionLabel: 'View Clothing Stats',
        route: 'clothing'
      });
    }

    list.push({
      id: 'sug-nearby-shops',
      category: 'location',
      title: 'Nearby Verified Store Finder',
      description: 'Explore nearby grocery markets, pharmacies, and clothing stores with verified addresses and directions.',
      impact: 'low',
      actionLabel: 'Find Stores',
      route: 'nearby'
    });

    return list;
  }, [receipts, user?.monthlyBudget]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
          Smart AI Recommendations
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Machine intelligence continuously auditing expenses, purchase cadences, nutritional balance, and budget limits.
        </p>
      </div>

      {/* AI ENGINE OVERVIEW BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 text-white border border-zinc-800 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Vector AI Analysis</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display">
              Synthesizing 6 Core Spending Vectors
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
              Recommendations actively balance total spend, repetitive buy triggers, dietary guidelines, active monthly thresholds, and store geography.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('budget')}
              className="px-4 py-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Adjust Budget
            </button>
            <button
              onClick={() => onNavigate('report')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Monthly Report
            </button>
          </div>
        </div>
      </div>

      {/* SUGGESTIONS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((sug) => (
          <div
            key={sug.id}
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                    {getCategoryIcon(sug.category)}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {sug.category.toUpperCase()} ADVISORY
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  sug.impact === 'high'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    : sug.impact === 'medium'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {sug.impact} impact
                </span>
              </div>

              <h4 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100 mt-3">
                {sug.title}
              </h4>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                {sug.description}
              </p>
            </div>

            {/* Action link */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Expense Insight Engine</span>
              <button
                onClick={() => onNavigate(sug.route)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{sug.actionLabel || 'Take Action'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
