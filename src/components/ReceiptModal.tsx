import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  MapPin, 
  Code2, 
  Copy, 
  Check, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { Receipt, ReceiptItem, ProductCategory } from '../types';
import { api } from '../services/api';

const PRODUCT_CATEGORIES: ProductCategory[] = [
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

interface ReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdateReceipt?: (updated: Receipt) => void;
  initialMode?: 'bill' | 'edit' | 'json';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  receipt, 
  onClose, 
  onDelete,
  onUpdateReceipt,
  initialMode = 'bill'
}) => {
  const [viewMode, setViewMode] = useState<'bill' | 'edit' | 'json'>(initialMode);
  const [copied, setCopied] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable bill state draft
  const [draftReceipt, setDraftReceipt] = useState<Receipt | null>(receipt);

  useEffect(() => {
    setDraftReceipt(receipt);
  }, [receipt]);

  if (!receipt || !draftReceipt) return null;

  const currentReceipt = draftReceipt;

  const getStructuredJson = () => {
    const payload = {
      shop_name: currentReceipt.shopName,
      shop_address: currentReceipt.shopAddress,
      date: currentReceipt.date,
      receipt_number: currentReceipt.receiptNumber,
      items: currentReceipt.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.totalPrice,
        category: it.category,
        ...(it.healthStatus ? { health_status: it.healthStatus } : {}),
        ...(it.healthNote ? { health_note: it.healthNote } : {})
      })),
      tax: currentReceipt.tax,
      grand_total: currentReceipt.grandTotal,
      health_summary: currentReceipt.healthSummary
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleDownload = () => {
    const jsonStr = getStructuredJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${currentReceipt.receiptNumber || currentReceipt.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getStructuredJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Item Editing Handlers
  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const updatedItems = [...draftReceipt.items];
    const item = { ...updatedItems[index], [field]: value };

    // Automatically recalculate totalPrice when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
      item.totalPrice = Math.round((qty * price) * 100) / 100;
    }

    updatedItems[index] = item;
    recalculateTotals(updatedItems, draftReceipt.tax);
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `it-${Date.now()}-${draftReceipt.items.length + 1}`,
      name: 'New Item',
      quantity: 1,
      unitPrice: 50,
      totalPrice: 50,
      category: 'Grocery'
    };
    const updatedItems = [...draftReceipt.items, newItem];
    recalculateTotals(updatedItems, draftReceipt.tax);
  };

  const handleDeleteItem = (index: number) => {
    if (draftReceipt.items.length <= 1) {
      alert('A receipt must have at least one item.');
      return;
    }
    const updatedItems = draftReceipt.items.filter((_, idx) => idx !== index);
    recalculateTotals(updatedItems, draftReceipt.tax);
  };

  const handleTaxChange = (taxValue: number) => {
    recalculateTotals(draftReceipt.items, taxValue);
  };

  const recalculateTotals = (items: ReceiptItem[], tax: number) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    const validTax = Math.max(0, Number(tax) || 0);
    const grandTotal = Math.round((subtotal + validTax) * 100) / 100;

    setDraftReceipt({
      ...draftReceipt,
      items,
      tax: validTax,
      grandTotal
    });
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const saved = await api.updateReceipt(draftReceipt.id, draftReceipt);
      setDraftReceipt(saved);
      if (onUpdateReceipt) {
        onUpdateReceipt(saved);
      }
      setSaveSuccessMessage('Bill items updated successfully!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
        setViewMode('bill');
      }, 1200);
    } catch (err: any) {
      alert('Failed to save receipt updates: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardEdits = () => {
    setDraftReceipt(receipt);
    setViewMode('bill');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden print:border-none print:shadow-none my-8">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 print:hidden gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('bill')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'bill'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                🧾 Bill View
              </button>
              
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'edit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>✏️ Edit Items</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {viewMode === 'json' ? (
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-colors"
                title="Copy JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Download JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-xl animate-in fade-in">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 font-bold hidden xs:inline">Delete?</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete) onDelete(currentReceipt.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Yes, Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Delete Receipt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
        )}

        {/* VIEW 1: Thermal Bill Formatted View */}
        {viewMode === 'bill' && (
          <div id="printable-receipt" className="p-6 sm:p-8 space-y-6 font-mono text-xs max-h-[70vh] overflow-y-auto">
            
            {/* Shop Header */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-zinc-300 dark:border-zinc-700">
              <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                {currentReceipt.shopName}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1 font-sans text-xs">
                <MapPin className="w-3 h-3" />
                <span>{currentReceipt.shopAddress || 'Store Location'}</span>
              </p>
              <p className="text-zinc-400 text-[11px]">Tax Invoice / Cash Memo</p>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300 text-xs pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-zinc-400">Bill No: </span>
                <span className="font-bold">{currentReceipt.receiptNumber}</span>
              </div>
              <div>
                <span className="text-zinc-400">Date: </span>
                <span className="font-bold">{currentReceipt.date}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-400 font-bold uppercase text-[10px] pb-1 border-b border-zinc-200 dark:border-zinc-800">
                <span className="flex-1">Item</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-20 text-right">Price</span>
                <span className="w-20 text-right">Total</span>
              </div>

              {currentReceipt.items.map((item, idx) => (
                <div key={item.id || idx} className="flex items-start justify-between py-1.5 border-b border-dashed border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-sans">
                      {item.category}
                    </span>
                  </div>
                  <div className="w-12 text-center text-zinc-600 dark:text-zinc-400">
                    {item.quantity}
                  </div>
                  <div className="w-20 text-right text-zinc-600 dark:text-zinc-400">
                    ₹{item.unitPrice}
                  </div>
                  <div className="w-20 text-right font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{item.totalPrice}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span>Subtotal</span>
                <span>₹{(currentReceipt.grandTotal - (currentReceipt.tax || 0)).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span>Tax / GST</span>
                <span>₹{(currentReceipt.tax || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                <span>GRAND TOTAL</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  ₹{currentReceipt.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action to switch to Edit Mode directly */}
            <div className="pt-2 flex justify-center print:hidden">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200/60"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Items in this Bill</span>
              </button>
            </div>

          </div>
        )}

        {/* VIEW 2: Interactive Bill & Items Editor */}
        {viewMode === 'edit' && (
          <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold font-display text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  Edit Receipt & Line Items
                </h3>
                <p className="text-xs text-zinc-500">
                  Modify quantities, item names, rates, categories or add new items.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Shop & Bill Info Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Shop / Merchant Name
                </label>
                <input
                  type="text"
                  value={draftReceipt.shopName}
                  onChange={(e) => setDraftReceipt({ ...draftReceipt, shopName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Shop Address / City
                </label>
                <input
                  type="text"
                  value={draftReceipt.shopAddress}
                  onChange={(e) => setDraftReceipt({ ...draftReceipt, shopAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Receipt Date
                </label>
                <input
                  type="date"
                  value={draftReceipt.date}
                  onChange={(e) => setDraftReceipt({ ...draftReceipt, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={draftReceipt.receiptNumber}
                  onChange={(e) => setDraftReceipt({ ...draftReceipt, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Editable Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase text-[11px]">
                  Receipt Items ({draftReceipt.items.length})
                </span>
                <span>Click trash icon to remove item</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-500">
                    <tr>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                      <th className="py-2.5 px-2 w-24 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-2 w-24 text-right">Total (₹)</th>
                      <th className="py-2.5 px-2 w-36">Category</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {draftReceipt.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium outline-none focus:border-emerald-500"
                            placeholder="Item name"
                          />
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 px-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-center outline-none focus:border-emerald-500 font-mono"
                          />
                        </td>

                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-20 px-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-right outline-none focus:border-emerald-500 font-mono"
                          />
                        </td>

                        <td className="p-2 text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                          ₹{Number(item.totalPrice || 0).toLocaleString()}
                        </td>

                        <td className="p-2">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(idx, 'category', e.target.value as ProductCategory)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                          >
                            {PRODUCT_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another item</span>
                </button>
              </div>
            </div>

            {/* Calculations & Tax Summary in Editor */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold">
                  ₹{(draftReceipt.grandTotal - draftReceipt.tax).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                <span>Tax / GST (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={draftReceipt.tax}
                  onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                />
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <span>Calculated Grand Total</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
                  ₹{draftReceipt.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Edit Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDiscardEdits}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard Changes</span>
              </button>

              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Bill Changes'}</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Structured Machine-Readable JSON */}
        {viewMode === 'json' && (
          <div className="p-5 space-y-3 bg-zinc-950 text-zinc-100 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] pb-2 border-b border-zinc-800">
              <span className="text-emerald-400 font-bold">receipt-{currentReceipt.receiptNumber || currentReceipt.id}.json</span>
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">Schema: Receipt v1.0</span>
            </div>
            <pre className="p-4 rounded-2xl bg-zinc-900 text-emerald-300 overflow-x-auto max-h-[60vh] border border-zinc-800 leading-relaxed select-text">
              {getStructuredJson()}
            </pre>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-mono">ID: {currentReceipt.id}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
