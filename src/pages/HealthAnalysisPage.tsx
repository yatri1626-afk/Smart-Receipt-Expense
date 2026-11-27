import React, { useMemo } from 'react';
import { 
  Salad
} from 'lucide-react';
import { Receipt } from '../types';
import { evaluateItemHealth, isFoodOrGroceryItem } from '../utils/healthEvaluator';

interface HealthAnalysisPageProps {
  receipts?: Receipt[];
}

export const HealthAnalysisPage: React.FC<HealthAnalysisPageProps> = ({ receipts = [] }) => {
  // Extract and evaluate food & grocery items
  const { 
    healthyCount, 
    limitCount, 
    lessHealthyCount,
    totalFoodItems
  } = useMemo(() => {
    let healthy = 0;
    let limit = 0;
    let lessHealthy = 0;
    let totalCount = 0;

    receipts.forEach((r) => {
      (r.items || []).forEach((it) => {
        const rawName = (it.name || '').trim();
        if (!rawName) return;

        const itemCategory = it.category || 'Food & Health';
        if (!isFoodOrGroceryItem(rawName, itemCategory)) {
          return;
        }

        const evalResult = evaluateItemHealth(rawName);
        const qty = it.quantity && it.quantity > 0 ? it.quantity : 1;
        totalCount += qty;

        if (evalResult.status === 'healthy') healthy += qty;
        else if (evalResult.status === 'limit') limit += qty;
        else if (evalResult.status === 'less_healthy') lessHealthy += qty;
      });
    });

    return {
      healthyCount: healthy,
      limitCount: limit,
      lessHealthyCount: lessHealthy,
      totalFoodItems: totalCount
    };
  }, [receipts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Salad className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Dietary & Health Index</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Nutritional audit & dietary health scoring from all grocery and pantry items in your scanned receipts.
          </p>
        </div>
      </div>

      {/* 3 SUMMARY STATUS STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 🟢 Generally Healthy */}
        <div 
          id="stat-card-healthy"
          className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🟢</span>
            <span className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400">
              {healthyCount} <span className="text-sm font-semibold text-zinc-500">items</span>
            </span>
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
            Generally Healthy
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Wholesome staples, milk, curd, whole wheat, pulses, and fresh vegetables.
          </p>
        </div>

        {/* 🟡 Portion Limit */}
        <div 
          id="stat-card-limit"
          className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🟡</span>
            <span className="text-3xl font-black font-display text-amber-600 dark:text-amber-400">
              {limitCount} <span className="text-sm font-semibold text-zinc-500">items</span>
            </span>
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
            Limit Portions
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Biscuits, butter, noodles, sauces. Consume in mindful, controlled portions.
          </p>
        </div>

        {/* 🔴 Less Healthy / Cold Drinks & High Sugar */}
        <div 
          id="stat-card-less-healthy"
          className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🔴</span>
            <span className="text-3xl font-black font-display text-rose-600 dark:text-rose-400">
              {lessHealthyCount} <span className="text-sm font-semibold text-zinc-500">items</span>
            </span>
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">
            Less Healthy / Sugar
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Cold drinks, sodas, chips, chocolates, and ultra-processed confectionery.
          </p>
        </div>

      </div>

      {totalFoodItems === 0 && receipts.length === 0 && (
        <div className="py-14 text-center text-zinc-400 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xs">
          <div className="max-w-md mx-auto space-y-2">
            <Salad className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">No food receipts logged yet</p>
            <p>Upload or scan your grocery & supermarket bills in the Scan Receipt tab to automatically receive instant dietary evaluations and health recommendations.</p>
          </div>
        </div>
      )}

    </div>
  );
};
