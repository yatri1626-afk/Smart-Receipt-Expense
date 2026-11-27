import React, { useState, useEffect, useMemo } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Wallet, 
  Calendar, 
  Check, 
  Save, 
  ShieldCheck, 
  Sparkles,
  Receipt as ReceiptIcon,
  Heart,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, ProductCategory, Receipt } from '../types';
import { api, setCurrentUser, getCurrentUser, getStoredReceipts } from '../services/api';

interface ProfilePageProps {
  user: User | null;
  receipts?: Receipt[];
  onUserUpdate: (user: User) => void;
}

const ALL_CATEGORIES: ProductCategory[] = [
  'Grocery',
  'Clothing',
  'Food & Health',
  'Beauty & Personal Care',
  'Electronics',
  'Home & Household',
  'Books & Education'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, receipts = [], onUserUpdate }) => {
  const [name, setName] = useState(user?.name || 'Rahul Sharma');
  const [email, setEmail] = useState(user?.email || 'rahul@expenseinsight.com');
  const [monthlyBudget, setMonthlyBudget] = useState(user?.monthlyBudget ? String(user.monthlyBudget) : '10000');
  const [preferredCats, setPreferredCats] = useState<ProductCategory[]>(
    user?.preferredCategories || ['Grocery', 'Clothing', 'Food & Health']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Dynamic calculation of logged receipts
  const loggedReceiptsCount = useMemo(() => {
    if (receipts && Array.isArray(receipts)) {
      return receipts.length;
    }
    const stored = getStoredReceipts(user?.id || user?.email);
    return stored ? stored.length : 0;
  }, [receipts, user?.id, user?.email]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setMonthlyBudget(user.monthlyBudget ? String(user.monthlyBudget) : '');
      if (user.preferredCategories) {
        setPreferredCats(user.preferredCategories);
      }
    }
  }, [user]);

  // Check if form has unsaved modifications
  const hasUnsavedChanges = useMemo(() => {
    if (!user) return true;
    const nameDiff = name.trim() !== (user.name || '').trim();
    const emailDiff = email.trim().toLowerCase() !== (user.email || '').trim().toLowerCase();
    const budgetDiff = (parseFloat(monthlyBudget) || 0) !== (user.monthlyBudget || 0);
    return nameDiff || emailDiff || budgetDiff;
  }, [user, name, email, monthlyBudget]);

  const handleRevert = () => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setMonthlyBudget(user.monthlyBudget ? String(user.monthlyBudget) : '');
      setSaveMessage(null);
    }
  };

  const toggleCategory = (cat: ProductCategory) => {
    if (preferredCats.includes(cat)) {
      setPreferredCats(preferredCats.filter((c) => c !== cat));
    } else {
      setPreferredCats([...preferredCats, cat]);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!name.trim()) return;

    setIsSaving(true);
    setSaveMessage(null);

    const parsedBudget = parseFloat(monthlyBudget) || 0;
    const baseUser: User = user || getCurrentUser() || {
      id: 'user-pratha-1',
      name: name.trim(),
      email: email.trim(),
      monthlyBudget: parsedBudget,
      preferredCategories: preferredCats,
      createdAt: new Date().toISOString()
    };

    const updatedUser: User = {
      ...baseUser,
      name: name.trim(),
      email: email.trim(),
      monthlyBudget: parsedBudget,
      preferredCategories: preferredCats
    };

    try {
      // 1. Persist to backend database via API
      const serverResult = await api.updateProfile({
        name: updatedUser.name,
        email: updatedUser.email,
        monthlyBudget: updatedUser.monthlyBudget,
        preferredCategories: updatedUser.preferredCategories
      });

      const finalUser = serverResult || updatedUser;

      // 2. Persist in local storage and notify React app state
      setCurrentUser(finalUser);
      onUserUpdate(finalUser);

      // 3. Trigger celebratory confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err) {}

      setSaved(true);
      setSaveMessage(`Profile updated successfully! Name: "${finalUser.name}", Budget: ₹${finalUser.monthlyBudget?.toLocaleString() || '0'}`);
      setTimeout(() => {
        setSaved(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to update profile via API:', err);
      // Fallback local save
      setCurrentUser(updatedUser);
      onUserUpdate(updatedUser);
      setSaved(true);
      setSaveMessage(`Profile saved locally! Name: "${updatedUser.name}"`);
      setTimeout(() => setSaved(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
          User Profile & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your account profile and budget targets.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{saveMessage || 'Profile and budget preferences updated successfully in database!'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold uppercase tracking-wider">
            Saved
          </span>
        </div>
      )}

      {hasUnsavedChanges && !saved && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>You have unsaved changes. Click <strong>Save Profile Changes</strong> below to update your account database.</span>
          </div>
          <button
            type="button"
            onClick={handleRevert}
            className="px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Revert</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: User Avatar Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            {(name.trim() || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold font-display text-lg text-zinc-900 dark:text-zinc-100">{name.trim() || 'Your Name'}</h3>
            <p className="text-xs text-zinc-500 truncate">{email.trim() || 'your.email@example.com'}</p>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ReceiptIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Receipts Logged:</span>
              </span>
              <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                {loggedReceiptsCount} {loggedReceiptsCount === 1 ? 'Bill' : 'Bills'}
              </strong>
            </div>

            <div className="flex items-center justify-between text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                <span>Monthly Budget:</span>
              </span>
              <strong className="text-emerald-600">₹{(parseFloat(monthlyBudget) || 0).toLocaleString()}</strong>
            </div>

            <div className="flex items-center justify-between text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Member Since:</span>
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">August 2026</span>
            </div>
          </div>
        </div>

        {/* Right: Editable Form */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Monthly Shopping Budget (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-xs">₹</span>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  id="save-profile-changes-btn"
                  type="submit"
                  disabled={isSaving}
                  onClick={handleSaveProfile}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                    isSaving
                      ? 'bg-emerald-600/70 text-white cursor-wait'
                      : saved
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-700/30 scale-[1.02]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02]'
                  }`}
                  title="Click to save and persist profile changes in your account database"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Profile Changes...</span>
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>✓ Profile Changes Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                      {hasUnsavedChanges && (
                        <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse ml-0.5" title="Unsaved changes pending" />
                      )}
                    </>
                  )}
                </button>

                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={handleRevert}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel / Revert</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved changes sync across all devices</span>
              </div>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};
