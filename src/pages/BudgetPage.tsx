import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  TrendingUp, 
  Save, 
  Edit3, 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { CategoryBudget, User, Receipt, ProductCategory } from '../types';
import { 
  getStoredBudgets, 
  saveStoredBudgets, 
  getSuggestedStarterBudgets, 
  calculateReceiptSpentForCategory 
} from '../services/api';

interface BudgetPageProps {
  user: User | null;
  receipts: Receipt[];
  onUserBudgetUpdate: (newBudget: number) => void;
  onNavigate?: (page: string) => void;
}

const AVAILABLE_CATEGORIES: ProductCategory[] = [
  'Grocery',
  'Food & Health',
  'Clothing',
  'Beauty & Personal Care',
  'Electronics',
  'Health Products',
  'Home & Household',
  'Books & Education',
  'Other'
];

export const BudgetPage: React.FC<BudgetPageProps> = ({ 
  user, 
  receipts, 
  onUserBudgetUpdate, 
  onNavigate 
}) => {
  // Initialize budgets based on user's storage
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    return getStoredBudgets(user?.id, receipts);
  });

  const [totalMonthlyBudget, setTotalMonthlyBudget] = useState<number>(user?.monthlyBudget || 0);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotal, setTempTotal] = useState(String(user?.monthlyBudget || ''));
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Add Category Modal / Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState<string>('Grocery');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [newCatLimit, setNewCatLimit] = useState<string>('2000');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync user budget and categories when user changes
  useEffect(() => {
    setBudgets(getStoredBudgets(user?.id, receipts));
    setTotalMonthlyBudget(user?.monthlyBudget || 0);
    setTempTotal(String(user?.monthlyBudget || ''));
  }, [user?.id, user?.monthlyBudget]);

  // Sync spent calculations when receipts change
  useEffect(() => {
    setBudgets(prev => prev.map(b => ({
      ...b,
      spent: calculateReceiptSpentForCategory(b.category, receipts)
    })));
  }, [receipts]);

  // Actual spent computed directly from real user receipts
  const totalSpent = receipts.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
  const remaining = Math.max(0, totalMonthlyBudget - totalSpent);
  const overallUsedPct = totalMonthlyBudget > 0 
    ? Math.min(100, Math.round((totalSpent / totalMonthlyBudget) * 100)) 
    : 0;

  const showSavedNotification = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Update total monthly allowance
  const handleSaveTotalBudget = () => {
    const val = Math.max(0, parseFloat(tempTotal) || 0);
    setTotalMonthlyBudget(val);
    onUserBudgetUpdate(val);
    saveStoredBudgets(budgets, user?.id, val);
    setIsEditingTotal(false);
    showSavedNotification(`Monthly allowance updated to ₹${val.toLocaleString()}`);
  };

  // Update specific category limit
  const handleUpdateCategoryLimit = (index: number, newLimit: number) => {
    const limitVal = Math.max(0, newLimit);
    const updated = [...budgets];
    updated[index] = { 
      ...updated[index], 
      allocated: limitVal, 
      limit: limitVal,
      spent: calculateReceiptSpentForCategory(updated[index].category, receipts)
    };
    setBudgets(updated);
    saveStoredBudgets(updated, user?.id, totalMonthlyBudget);
    showSavedNotification(`Updated limit for ${updated[index].category}`);
  };

  // Delete category budget
  const handleDeleteCategory = (index: number) => {
    const catName = budgets[index].category;
    const updated = budgets.filter((_, i) => i !== index);
    setBudgets(updated);
    saveStoredBudgets(updated, user?.id, totalMonthlyBudget);
    showSavedNotification(`Removed "${catName}" from budget tracking`);
  };

  // Add new category budget
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const categoryToAdd = (isCustomCat ? customCatInput.trim() : newCatName).trim();
    if (!categoryToAdd) {
      setFormError('Please select or specify a category name.');
      return;
    }

    // Check if category already exists
    const exists = budgets.some(b => b.category.toLowerCase() === categoryToAdd.toLowerCase());
    if (exists) {
      setFormError(`A budget limit for "${categoryToAdd}" already exists.`);
      return;
    }

    const limitNum = parseFloat(newCatLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setFormError('Please enter a positive limit amount.');
      return;
    }

    const newEntry: CategoryBudget = {
      category: categoryToAdd,
      allocated: limitNum,
      limit: limitNum,
      spent: calculateReceiptSpentForCategory(categoryToAdd, receipts)
    };

    const updated = [...budgets, newEntry];
    setBudgets(updated);
    saveStoredBudgets(updated, user?.id, totalMonthlyBudget);

    // Reset form
    setShowAddForm(false);
    setCustomCatInput('');
    setIsCustomCat(false);
    setNewCatLimit('2000');
    showSavedNotification(`Added "${categoryToAdd}" with limit ₹${limitNum.toLocaleString()}`);
  };

  // Load starter template (customizable)
  const handleLoadSuggested = () => {
    const allowance = totalMonthlyBudget > 0 ? totalMonthlyBudget : 10000;
    if (totalMonthlyBudget === 0) {
      setTotalMonthlyBudget(allowance);
      onUserBudgetUpdate(allowance);
    }
    const starter = getSuggestedStarterBudgets(allowance).map(b => ({
      ...b,
      spent: calculateReceiptSpentForCategory(b.category, receipts)
    }));
    setBudgets(starter);
    saveStoredBudgets(starter, user?.id, allowance);
    showSavedNotification('Applied suggested starter categories. Feel free to customize!');
  };

  const hasBudgetConfigured = totalMonthlyBudget > 0 || budgets.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
          Personal Budget & Limits
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          You define your own financial limits. Spending is calculated directly from your real uploaded receipts.
        </p>
      </div>

      {/* Notification Banner */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {/* ZERO BUDGET SETUP WIZARD (WHEN USER HAS NOT CONFIGURED A BUDGET YET) */}
      {!hasBudgetConfigured && (
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white via-zinc-50 to-emerald-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xs">
            <Wallet className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Set Up Your Custom Budget
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
              No budget is enforced by default. You are in complete control of setting your monthly spending allowance and custom category limits.
            </p>
          </div>

          {/* Quick Setup Form */}
          <div className="max-w-md mx-auto space-y-4 pt-2">
            <div className="text-left">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Set Your Monthly Allowance (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={tempTotal}
                  onChange={(e) => setTempTotal(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-base outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSaveTotalBudget}
                disabled={!tempTotal || parseFloat(tempTotal) <= 0}
                className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Save Custom Budget</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={handleLoadSuggested}
                className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Load Suggested Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURED BUDGET VIEW */}
      {hasBudgetConfigured && (
        <>
          {/* OVERALL MONTHLY BUDGET CARD */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Your Monthly Spending Allowance
                </span>
                <div className="flex items-center gap-3 mt-1">
                  {isEditingTotal ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400">₹</span>
                        <input
                          type="number"
                          value={tempTotal}
                          onChange={(e) => setTempTotal(e.target.value)}
                          placeholder="e.g. 15000"
                          className="pl-7 pr-3 py-1 text-xl font-bold rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 w-40 outline-none focus:border-emerald-500"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={handleSaveTotalBudget}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingTotal(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl sm:text-4xl font-black font-display text-zinc-900 dark:text-zinc-100">
                        ₹{totalMonthlyBudget.toLocaleString()}
                      </h3>
                      <button
                        onClick={() => { 
                          setTempTotal(String(totalMonthlyBudget || '')); 
                          setIsEditingTotal(true); 
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Monthly Budget"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-zinc-400 block">Actual Spent:</span>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{totalSpent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 block">Remaining:</span>
                  <p className={`text-lg font-bold ${remaining <= 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₹{remaining.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 block">Used:</span>
                  <p className={`text-lg font-bold ${overallUsedPct >= 90 ? 'text-rose-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {overallUsedPct}%
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-500">Spending Against Your Target</span>
                <span className={
                  overallUsedPct >= 90 
                    ? 'text-rose-500 font-bold' 
                    : overallUsedPct >= 75 
                    ? 'text-amber-500 font-bold' 
                    : 'text-emerald-600'
                }>
                  {overallUsedPct}% Used {remaining === 0 && totalMonthlyBudget > 0 ? '(Quota Exhausted)' : ''}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallUsedPct >= 90
                      ? 'bg-rose-500'
                      : overallUsedPct >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, overallUsedPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ADD CATEGORY BUDGET FORM (EXPANDABLE) */}
          {showAddForm && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-bold font-display text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Create Custom Category Limit</span>
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  ✕ Close
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                {/* Category Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCat(!isCustomCat)}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      {isCustomCat ? 'Select Preset' : '+ Custom Name'}
                    </button>
                  </div>

                  {isCustomCat ? (
                    <input
                      type="text"
                      placeholder="e.g. Fuel, Pet Care, Dining"
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                    >
                      {AVAILABLE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Limit Input */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Monthly Limit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="2000"
                      value={newCatLimit}
                      onChange={(e) => setNewCatLimit(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    Add Category Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CATEGORY BUDGETS LIST */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold font-display text-base text-zinc-900 dark:text-zinc-100">
                  Category Limits & Real-Time Spending
                </h3>
                <p className="text-xs text-zinc-400">
                  Spending amounts update automatically whenever you scan or upload receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
                <button
                  onClick={handleLoadSuggested}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors flex items-center gap-1"
                  title="Load suggested categories"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Suggested Quotas</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {budgets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 text-center space-y-3">
                <SlidersHorizontal className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  No category limits added yet.
                </p>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Click "Add Category" above to specify custom limits for Grocery, Clothing, Food, or any custom category you wish to track.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-xs"
                >
                  + Add Your First Category
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map((b, idx) => {
                  const limitVal = b.allocated || b.limit || 1000;
                  const spent = calculateReceiptSpentForCategory(b.category, receipts);
                  const pct = limitVal > 0 ? Math.min(100, Math.round((spent / limitVal) * 100)) : 0;
                  const isOver = spent > limitVal;
                  const isCritical = pct >= 90;
                  const isWarning = pct >= 75 && pct < 90;

                  return (
                    <div
                      key={b.category}
                      className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5 transition-all hover:border-zinc-300 dark:hover:border-zinc-600"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {b.category}
                          </span>
                          {isOver ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              <span>Over Limit</span>
                            </span>
                          ) : isCritical ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              ⚠ Critical ({pct}%)
                            </span>
                          ) : isWarning ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                              ⚠ Warning ({pct}%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                              Safe
                            </span>
                          )}
                        </div>

                        {/* Limit Editor & Actions */}
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-zinc-500">
                            Spent: <strong className="text-zinc-800 dark:text-zinc-200">₹{spent.toLocaleString()}</strong>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-400">Limit: ₹</span>
                            <input
                              type="number"
                              value={limitVal}
                              onChange={(e) => handleUpdateCategoryLimit(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold outline-none focus:border-emerald-500"
                              title="Edit category limit"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(idx)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            title={`Remove ${b.category} limit`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver || isCritical 
                              ? 'bg-rose-500' 
                              : isWarning 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{pct}% of your custom limit used</span>
                        <span className={spent > limitVal ? 'text-rose-600 font-bold' : ''}>
                          {spent > limitVal 
                            ? `Exceeded by ₹${(spent - limitVal).toLocaleString()}` 
                            : `₹${Math.max(0, limitVal - spent).toLocaleString()} remaining`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Informational Guidance */}
            {receipts.length === 0 && onNavigate && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Scan or upload receipts to begin calculating live category spending against your limits.</span>
                </div>
                <button
                  onClick={() => onNavigate('upload')}
                  className="font-bold underline hover:no-underline whitespace-nowrap"
                >
                  Scan Receipt Now →
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};
