import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  Store, 
  Share2, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ArrowRight,
  RefreshCw,
  Search,
  IndianRupee,
  Layers,
  ChevronDown,
  X,
  ListPlus,
  Compass,
  MapPin,
  TrendingDown,
  Copy
} from 'lucide-react';
import { User, Receipt, ProductCategory, ShoppingListItem } from '../types';
import { api } from '../services/api';

interface ShoppingPageProps {
  user: User | null;
  receipts: Receipt[];
  onNavigate: (tab: string) => void;
}

export const ShoppingPage: React.FC<ShoppingPageProps> = ({
  user,
  receipts = [],
  onNavigate
}) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'must_buy'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Form State for Adding Item
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Grocery');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [priority, setPriority] = useState<'must_buy' | 'regular' | 'optional'>('must_buy');
  const [targetShop, setTargetShop] = useState('');
  const [notes, setNotes] = useState('');

  // Load shopping list
  useEffect(() => {
    loadList();
  }, [user?.id, user?.email]);

  const loadList = async () => {
    setLoading(true);
    try {
      const list = await api.getShoppingList(user?.id || user?.email);
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete price & target shop from user's receipt history
  const handleNameChange = (val: string) => {
    setName(val);
    if (!val.trim()) return;

    const lower = val.toLowerCase();
    // Search receipt items for matching price
    for (const receipt of receipts) {
      for (const it of receipt.items || []) {
        if (it.name.toLowerCase().includes(lower)) {
          if (!estimatedPrice) {
            setEstimatedPrice(String(Math.round(it.unitPrice || it.totalPrice)));
          }
          if (!targetShop) {
            setTargetShop(receipt.shopName);
          }
          if (it.category) {
            setCategory(it.category);
          }
          return;
        }
      }
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const priceNum = parseFloat(estimatedPrice) || 0;
    try {
      const newItem = await api.addShoppingItem(
        {
          name: name.trim(),
          category,
          quantity: Number(quantity) || 1,
          unit: unit || 'pcs',
          estimatedPrice: priceNum,
          priority,
          targetShop: targetShop.trim() || undefined,
          notes: notes.trim() || undefined
        },
        user?.id || user?.email
      );
      setItems(prev => [newItem, ...prev]);
      // Reset form
      setName('');
      setEstimatedPrice('');
      setTargetShop('');
      setNotes('');
      setQuantity(1);
      setIsAddModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Purchased
  const handleTogglePurchased = async (id: string) => {
    const updated = await api.toggleShoppingItem(id, user?.id || user?.email);
    setItems(updated);
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    const updated = await api.deleteShoppingItem(id, user?.id || user?.email);
    setItems(updated);
  };

  // Clear completed items
  const handleClearCompleted = async () => {
    const remaining = items.filter(it => !it.isPurchased);
    await api.saveShoppingList(remaining, user?.id || user?.email);
    setItems(remaining);
  };

  // Restock Recommendations derived from user's actual receipts
  const restockSuggestions = useMemo(() => {
    const productMap = new Map<string, { name: string; category: ProductCategory; count: number; lastDate: string; avgPrice: number; shop: string }>();

    receipts.forEach(r => {
      (r.items || []).forEach(it => {
        const cleanName = it.name.trim();
        const existing = productMap.get(cleanName.toLowerCase());
        if (existing) {
          existing.count += 1;
          if (new Date(r.date) > new Date(existing.lastDate)) {
            existing.lastDate = r.date;
          }
        } else {
          productMap.set(cleanName.toLowerCase(), {
            name: cleanName,
            category: it.category || 'Grocery',
            count: 1,
            lastDate: r.date,
            avgPrice: Math.round(it.unitPrice || it.totalPrice),
            shop: r.shopName
          });
        }
      });
    });

    // Exclude items already present in the current shopping list
    const currentItemNames = new Set(items.map(it => it.name.toLowerCase()));
    
    return Array.from(productMap.values())
      .filter(p => p.count >= 2 && !currentItemNames.has(p.name.toLowerCase()))
      .slice(0, 5);
  }, [receipts, items]);

  const handleAddRestockItem = async (p: { name: string; category: ProductCategory; avgPrice: number; shop: string }) => {
    const newItem = await api.addShoppingItem(
      {
        name: p.name,
        category: p.category,
        quantity: 1,
        unit: 'pcs',
        estimatedPrice: p.avgPrice,
        priority: 'must_buy',
        targetShop: p.shop,
        notes: 'Added from smart restock analysis'
      },
      user?.id || user?.email
    );
    setItems(prev => [newItem, ...prev]);
  };

  // Calculate budget statistics
  const totalSpentSoFar = receipts.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
  const monthlyLimit = user?.monthlyBudget || 10000;
  const remainingMonthlyBudget = Math.max(0, monthlyLimit - totalSpentSoFar);

  const totalEstimatedCost = items.reduce((sum, it) => sum + (it.estimatedPrice * (it.quantity || 1)), 0);
  const pendingCost = items.filter(it => !it.isPurchased).reduce((sum, it) => sum + (it.estimatedPrice * (it.quantity || 1)), 0);
  const completedCost = items.filter(it => it.isPurchased).reduce((sum, it) => sum + (it.estimatedPrice * (it.quantity || 1)), 0);

  // Group items by target store for intelligent shopping trip planning
  const storeTrips = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>();
    items.filter(it => !it.isPurchased).forEach(it => {
      const store = it.targetShop || 'Any Nearby Supermarket';
      const list = map.get(store) || [];
      list.push(it);
      map.set(store, list);
    });
    return Array.from(map.entries()).map(([storeName, storeItems]) => ({
      storeName,
      items: storeItems,
      totalEst: storeItems.reduce((s, it) => s + (it.estimatedPrice * (it.quantity || 1)), 0)
    }));
  }, [items]);

  // Filtering
  const filteredItems = items.filter(item => {
    if (activeFilter === 'pending' && item.isPurchased) return false;
    if (activeFilter === 'completed' && !item.isPurchased) return false;
    if (activeFilter === 'must_buy' && item.priority !== 'must_buy') return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || 
             (item.targetShop && item.targetShop.toLowerCase().includes(q)) ||
             (item.notes && item.notes.toLowerCase().includes(q));
    }
    return true;
  });

  const handleCopyChecklist = () => {
    const pending = items.filter(it => !it.isPurchased);
    if (pending.length === 0) {
      navigator.clipboard.writeText("Shopping list is clear! All items purchased.");
    } else {
      const text = `🛒 SMART SHOPPING LIST (${pending.length} items - Est: ₹${pendingCost.toLocaleString()}):\n` +
        pending.map(it => `• [ ] ${it.name} (${it.quantity} ${it.unit}) - Est: ₹${it.estimatedPrice * it.quantity}${it.targetShop ? ` @ ${it.targetShop}` : ''}`).join('\n') +
        `\n\nGenerated via Expense Insight Hub`;
      navigator.clipboard.writeText(text);
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const categories: ProductCategory[] = [
    'Grocery',
    'Clothing',
    'Food & Health',
    'Beauty & Personal Care',
    'Health Products',
    'Electronics',
    'Home & Household',
    'Books & Education',
    'Other'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
              Smart Shopping Planner
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {items.filter(i => !i.isPurchased).length} Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Organize upcoming purchases, restock essentials, estimate costs, and match stores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleCopyChecklist}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy formatted list for WhatsApp or Notes"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedToast ? 'Copied to Clipboard!' : 'Share / Copy List'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Total */}
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Pending To Buy</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-display text-zinc-900 dark:text-zinc-100">
            ₹{pendingCost.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {items.filter(i => !i.isPurchased).length} items remaining
          </div>
        </div>

        {/* Completed In Cart */}
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Purchased / Checked</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-display text-emerald-600 dark:text-emerald-400">
            ₹{completedCost.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {items.filter(i => i.isPurchased).length} items bought
          </div>
        </div>

        {/* Budget Alignment Check */}
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Monthly Budget Fit</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-display text-zinc-900 dark:text-zinc-100">
            ₹{remainingMonthlyBudget.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px]">
            {pendingCost <= remainingMonthlyBudget ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                ✓ Fits in monthly budget
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                ⚠️ Exceeds budget by ₹{(pendingCost - remainingMonthlyBudget).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Action / Next Step Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
              Done Shopping?
            </div>
            <div className="text-sm font-bold mt-1">
              Scan & Log Receipt
            </div>
          </div>
          <button
            onClick={() => onNavigate('upload')}
            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Receipt</span>
          </button>
        </div>
      </div>

      {/* SMART RESTOCK SUGGESTIONS BANNER (If available) */}
      {restockSuggestions.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                AI Smart Restock Recommendations
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Based on frequent past purchases
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {restockSuggestions.map((item, i) => (
              <div 
                key={i}
                className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                    ~₹{item.avgPrice} • {item.category}
                  </div>
                </div>
                <button
                  onClick={() => handleAddRestockItem(item)}
                  className="mt-2.5 w-full py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add to List</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & SEARCH */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items, stores, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All (${items.length})` },
              { id: 'pending', label: `Pending (${items.filter(i => !i.isPurchased).length})` },
              { id: 'must_buy', label: `Must Buy (${items.filter(i => i.priority === 'must_buy' && !i.isPurchased).length})` },
              { id: 'completed', label: `Bought (${items.filter(i => i.isPurchased).length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {items.some(i => i.isPurchased) && (
              <button
                onClick={handleClearCompleted}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto cursor-pointer"
                title="Clear all completed items"
              >
                Clear Bought
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN ITEMS LIST AND STORE ROUTE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SHOPPING ITEMS LIST (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400">Loading your shopping list...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                No items in this filter
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Add essential groceries, clothes, or household products to plan your shopping.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                + Add First Item
              </button>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-start sm:items-center justify-between gap-3 ${
                  item.isPurchased
                    ? 'bg-zinc-50/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/60 opacity-60'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleTogglePurchased(item.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 transition-colors cursor-pointer ${
                      item.isPurchased
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-emerald-500'
                    }`}
                  >
                    {item.isPurchased && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold truncate ${
                        item.isPurchased ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'
                      }`}>
                        {item.name}
                      </span>

                      {/* Quantity Tag */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.quantity} {item.unit}
                      </span>

                      {/* Priority Tag */}
                      {item.priority === 'must_buy' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          Must Buy
                        </span>
                      )}
                      {item.priority === 'optional' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          Optional
                        </span>
                      )}
                    </div>

                    {/* Metadata Subtitle */}
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
                      <span>{item.category}</span>
                      {item.targetShop && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Store className="w-3 h-3" />
                          <span>{item.targetShop}</span>
                        </span>
                      )}
                      {item.notes && (
                        <span className="italic text-zinc-400">"{item.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Estimated Price and Delete */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black font-display text-zinc-900 dark:text-zinc-100">
                      ₹{(item.estimatedPrice * (item.quantity || 1)).toLocaleString()}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-zinc-400">
                        ₹{item.estimatedPrice}/{item.unit}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* STORE ROUTE & TARGET SHOPS RECOMMENDER (1 col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Store Trip Breakdown
                </h3>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Items on your pending shopping list organized by target shop for faster shopping trips.
            </p>

            {storeTrips.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                No pending items left to buy!
              </div>
            ) : (
              <div className="space-y-3">
                {storeTrips.map((trip, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{trip.storeName}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₹{trip.totalEst.toLocaleString()}
                      </span>
                    </div>

                    <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1 pl-5 list-disc">
                      {trip.items.map(it => (
                        <li key={it.id}>
                          {it.name} ({it.quantity} {it.unit})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onNavigate('nearby')}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Locate Nearby Shops on Map</span>
            </button>
          </div>

          {/* QUICK SHOPPING TIPS */}
          <div className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 text-xs space-y-2">
            <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Shopper Advice</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Scan bills right after checkout to automatically update your remaining budget, track item price changes over time, and keep restock cycles accurate.
            </p>
          </div>
        </div>

      </div>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <ListPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Add Item to Shopping List
                  </h3>
                  <p className="text-[11px] text-zinc-500">Auto-suggests prices from your receipt history</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basmati Rice, Cotton Jeans, Milk, Toothpaste"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="must_buy">Must Buy (Urgent)</option>
                    <option value="regular">Regular Essential</option>
                    <option value="optional">Optional / Wishlist</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Unit & Estimated Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pack">pack</option>
                    <option value="bottle">bottle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Est. Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Target Shop / Preferred Store */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Preferred Store / Target Shop (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. FreshBasket, Style Hub, Amul Parlour, DMart"
                  value={targetShop}
                  onChange={(e) => setTargetShop(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes / Specifics (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Low sodium version, Size M, specific brand"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-colors cursor-pointer"
                >
                  Add to Shopping List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
