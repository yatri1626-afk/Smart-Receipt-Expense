import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  UploadCloud, 
  Sparkles, 
  Check, 
  Copy, 
  Download, 
  Save, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  ArrowRight,
  Code2,
  FileCode,
  Columns,
  Eye,
  Edit3,
  FileJson,
  Smartphone,
  Receipt as ReceiptIcon,
  BarChart3,
  PieChart,
  Salad,
  HeartPulse,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  Square,
  X,
  Layers,
  Activity,
  Zap,
  Info,
  ShieldCheck,
  Search,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Receipt, ReceiptItem, ProductCategory } from '../types';
import { api, getCurrentUser } from '../services/api';
import { evaluateItemHealth, isFoodOrGroceryItem } from '../utils/healthEvaluator';

interface UploadReceiptPageProps {
  onReceiptSaved: (receipt: Receipt) => void;
  onDeleteReceipt?: (id: string) => void;
  receipts?: Receipt[];
  onViewReceipt?: (receipt: Receipt) => void;
  onNavigate?: (page: string) => void;
  onCancel?: () => void;
  initialMode?: 'scan' | 'manual';
  onReceiptsChange?: (receipts: Receipt[]) => void;
  preloadedItem?: { name: string; category: ProductCategory; unitPrice: number; quantity?: number } | null;
}

const QUICK_CATEGORY_ITEMS: Record<string, Array<{ name: string; category: ProductCategory; price: number }>> = {
  'Beauty & Personal Care': [
    { name: 'Hydrating Facial Moisturizer', category: 'Beauty & Personal Care', price: 450 },
    { name: 'Sunscreen SPF 50+ PA++++', category: 'Beauty & Personal Care', price: 599 },
    { name: 'Gentle Foaming Face Cleanser', category: 'Beauty & Personal Care', price: 349 },
    { name: 'Keratin Hair Shampoo', category: 'Beauty & Personal Care', price: 380 },
    { name: 'Body Wash / Shower Gel', category: 'Beauty & Personal Care', price: 299 },
    { name: 'Deodorant / Body Spray', category: 'Beauty & Personal Care', price: 249 }
  ],
  'Home & Household': [
    { name: 'Active Liquid Detergent (2L)', category: 'Home & Household', price: 420 },
    { name: 'Dishwashing Gel (750ml)', category: 'Home & Household', price: 155 },
    { name: 'Floor Surface Cleaner (1L)', category: 'Home & Household', price: 199 },
    { name: 'Kitchen Paper Towel Rolls', category: 'Home & Household', price: 160 },
    { name: 'Biodegradable Trash Bags', category: 'Home & Household', price: 180 },
    { name: 'LED Light Bulbs 9W (Pack of 2)', category: 'Home & Household', price: 220 }
  ],
  'Books & Education': [
    { name: 'Academic Reference Textbook', category: 'Books & Education', price: 550 },
    { name: 'Exam Guide & Solved Papers', category: 'Books & Education', price: 480 },
    { name: 'Spiral Ruled Notebooks (Pack of 4)', category: 'Books & Education', price: 240 },
    { name: 'Smooth Gel & Ball Pens (Pack of 10)', category: 'Books & Education', price: 120 },
    { name: 'Highlighters & Sticky Notes Set', category: 'Books & Education', price: 160 },
    { name: 'Scientific Calculator FX-991', category: 'Books & Education', price: 1250 }
  ],
  'Electronics': [
    { name: '65W GaN Fast Charger', category: 'Electronics', price: 1499 },
    { name: 'Braided USB-C Cable (2m)', category: 'Electronics', price: 399 },
    { name: '20000mAh Fast Power Bank', category: 'Electronics', price: 1899 },
    { name: 'Bluetooth Wireless Earbuds', category: 'Electronics', price: 2499 },
    { name: 'Tempered Glass Screen Protector', category: 'Electronics', price: 299 },
    { name: 'Wireless Ergonomic Mouse', category: 'Electronics', price: 699 }
  ],
  'Grocery': [
    { name: 'Fresh Milk 1L', category: 'Grocery', price: 66 },
    { name: 'Whole Wheat Atta 5kg', category: 'Grocery', price: 245 },
    { name: 'Basmati Rice 5kg', category: 'Grocery', price: 450 },
    { name: 'Organic Eggs 12-Pack', category: 'Grocery', price: 130 },
    { name: 'Cold Pressed Sunflower Oil 1L', category: 'Grocery', price: 190 }
  ],
  'Clothing': [
    { name: 'Cotton Crew Neck T-Shirt', category: 'Clothing', price: 499 },
    { name: 'Comfort Fit Denim Jeans', category: 'Clothing', price: 1299 },
    { name: 'Formal Cotton Shirt', category: 'Clothing', price: 899 },
    { name: 'Running Ankle Socks 3-Pack', category: 'Clothing', price: 299 }
  ]
};

const POPULAR_STORES = [
  'Reliance Fresh',
  'D-Mart',
  "Nature's Basket",
  'Apollo Pharmacy',
  'Starbucks',
  'Local Kirana',
  "Spencer's Retail",
  'BigBasket'
];

const CATEGORIES_LIST: ProductCategory[] = [
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

export const UploadReceiptPage: React.FC<UploadReceiptPageProps> = ({
  onReceiptSaved,
  onDeleteReceipt,
  receipts = [],
  onViewReceipt,
  onNavigate,
  onCancel,
  initialMode,
  onReceiptsChange,
  preloadedItem
}) => {
  // Ingestion Mode (Upload File or Manual Entry)
  const [ingestionMode, setIngestionMode] = useState<'manual' | 'scan'>(
    initialMode === 'manual' ? 'manual' : 'scan'
  );
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>(
    preloadedItem?.category || 'Beauty & Personal Care'
  );
  const currentUser = getCurrentUser();

  // Cross-session database synchronization & fetch states
  const [isFetchingBills, setIsFetchingBills] = useState(false);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);

  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'json' | 'edit' | 'split' | 'analyze'>('edit');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedReceiptId, setSavedReceiptId] = useState<string | null>(null);
  const [readSuccessMessage, setReadSuccessMessage] = useState<string | null>(null);
  const [deleteNoticeMessage, setDeleteNoticeMessage] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Manual / On-Demand Fetch Bills & Data from Account Database
  const handleFetchBills = async () => {
    setIsFetchingBills(true);
    setFetchNotice(null);
    try {
      const remote = await api.getReceipts();
      if (Array.isArray(remote)) {
        if (onReceiptsChange) {
          onReceiptsChange(remote);
        } else {
          remote.forEach(r => onReceiptSaved && onReceiptSaved(r));
        }
        setFetchNotice(
          `✅ Successfully fetched ${remote.length} bill${remote.length === 1 ? '' : 's'} from our account (${currentUser?.email || 'Active Account'}). Live and permanently saved today, tomorrow, and anytime!`
        );
      }
    } catch (err: any) {
      setFetchNotice('Synced with local account storage.');
    } finally {
      setIsFetchingBills(false);
      setTimeout(() => setFetchNotice(null), 5000);
    }
  };

  // Automatically fetch / sync user bills from account on component mount
  useEffect(() => {
    api.getReceipts().then(remote => {
      if (Array.isArray(remote) && remote.length > 0 && onReceiptsChange) {
        onReceiptsChange(remote);
      }
    }).catch(() => {});
  }, []);

  // In-App Interactive Deletion Modals
  const [receiptToDelete, setReceiptToDelete] = useState<{ id: string; shopName: string; grandTotal: number; date?: string; itemsCount?: number } | null>(null);
  const [confirmDeleteCurrent, setConfirmDeleteCurrent] = useState(false);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-select Batch Delete for Uploaded Receipts
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  // Instant AI Analysis Modal for any receipt from the archive
  const [analyzingReceipt, setAnalyzingReceipt] = useState<Receipt | null>(null);

  // Raw JSON editor state
  const [isJsonEditorMode, setIsJsonEditorMode] = useState(false);
  const [rawJsonDraft, setRawJsonDraft] = useState('');
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);

  // Camera Capture States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  // Camera stream and Device Input References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const deviceCameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const editorSectionRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Editable Extracted Receipt State
  const [extractedData, setExtractedData] = useState<{
    shopName: string;
    shopAddress: string;
    date: string;
    receiptNumber: string;
    items: ReceiptItem[];
    tax: number;
    grandTotal: number;
  } | null>(null);

  const processingSteps = [
    '🧾 Receipt Uploaded',
    '🔍 Reading Receipt & Pixels',
    '🤖 Gemini AI Vision OCR Parsing',
    '📊 Parsing Key-Value Pairs',
    '🏷️ Structuring Machine-Readable JSON',
    '💡 Finalizing JSON Payload'
  ];

  // Helper to format structured JSON
  const formatReceiptJson = (data: typeof extractedData) => {
    if (!data) return '{}';
    const jsonPayload = {
      shop_name: data.shopName,
      shop_address: data.shopAddress,
      date: data.date,
      receipt_number: data.receiptNumber,
      items: data.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.totalPrice,
        category: it.category,
        ...(it.healthStatus ? { health_status: it.healthStatus } : {}),
        ...(it.healthNote ? { health_note: it.healthNote } : {})
      })),
      tax: data.tax,
      grand_total: data.grandTotal
    };
    return JSON.stringify(jsonPayload, null, 2);
  };

  // Keep draft in sync when extractedData changes
  useEffect(() => {
    if (extractedData) {
      setRawJsonDraft(formatReceiptJson(extractedData));
      setJsonValidationError(null);
    }
  }, [extractedData]);

  // Dynamically merge items from uploaded receipts into the selected quick category items
  const dynamicQuickItemsForCategory = useMemo(() => {
    const itemMap = new Map<string, { name: string; category: ProductCategory; price: number }>();

    // 1. Find items from uploaded receipts matching this category
    const catLower = selectedQuickCategory.toLowerCase();
    receipts.forEach((r) => {
      (r.items || []).forEach((it) => {
        const itemCat = (it.category || '').toLowerCase();
        const matchesCategory =
          itemCat === catLower ||
          (catLower.includes('beauty') && (itemCat.includes('beauty') || itemCat.includes('personal') || itemCat.includes('care'))) ||
          (catLower.includes('household') && (itemCat.includes('household') || itemCat.includes('home'))) ||
          (catLower.includes('books') && (itemCat.includes('books') || itemCat.includes('education') || itemCat.includes('study'))) ||
          (catLower.includes('electronic') && itemCat.includes('electronic')) ||
          (catLower.includes('grocery') && itemCat.includes('grocery')) ||
          (catLower.includes('clothing') && (itemCat.includes('cloth') || itemCat.includes('apparel')));

        if (matchesCategory) {
          const cleanName = (it.name || '').trim();
          if (!cleanName) return;
          const key = cleanName.toLowerCase();
          if (!itemMap.has(key)) {
            const price = Number(it.unitPrice) || (it.quantity > 0 ? Math.round(Number(it.totalPrice) / Number(it.quantity)) : Number(it.totalPrice)) || 0;
            itemMap.set(key, {
              name: cleanName,
              category: selectedQuickCategory as ProductCategory,
              price
            });
          }
        }
      });
    });

    // 2. Append standard presets if not already in the map
    const presets = QUICK_CATEGORY_ITEMS[selectedQuickCategory] || [];
    presets.forEach((p) => {
      const key = p.name.toLowerCase();
      if (!itemMap.has(key)) {
        itemMap.set(key, p);
      }
    });

    return Array.from(itemMap.values());
  }, [selectedQuickCategory, receipts]);

  // Ensure stream attaches when cameraActive toggles
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.log('Camera playback auto error:', e));
    }
  }, [cameraActive]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Camera Handlers
  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    setCameraError(null);
    setCameraActive(true);
    const targetFacing = overrideFacing || facingMode;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e1) {
        // Fallback to generic video if facingMode constraint fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.log('Video play catch:', playErr);
          }
        }
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Unable to open live webcam stream in this iframe. Click "Device Camera App" to snap directly with your phone/device camera, or upload an image.'
      );
    }
  };

  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = (autoReadJson: boolean = true) => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewUrl(dataUrl);
        stopCamera();
      }
    }
  };

  // Manual Bill Entry Handler
  const startManualBillEntry = (itemToPreload?: { name: string; category: ProductCategory; unitPrice: number; quantity?: number } | null) => {
    const targetItem = itemToPreload || preloadedItem;
    const today = new Date().toISOString().split('T')[0];
    const itemQty = targetItem?.quantity || 1;
    const itemPrice = targetItem?.unitPrice || 0;
    const initialBlankBill = {
      shopName: targetItem?.category ? `${targetItem.category} Store` : '',
      shopAddress: '',
      date: today,
      receiptNumber: `BILL-${Math.floor(100000 + Math.random() * 900000)}`,
      items: [
        {
          id: `item-${Date.now()}`,
          name: targetItem?.name || '',
          category: (targetItem?.category || 'Grocery') as ProductCategory,
          quantity: itemQty,
          unitPrice: itemPrice,
          totalPrice: itemQty * itemPrice,
          healthStatus: undefined,
          healthNote: ''
        }
      ],
      tax: 0,
      grandTotal: itemQty * itemPrice
    };
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(initialBlankBill);
    setActiveTab('edit');
    setSaveSuccess(false);
    setSavedReceiptId(null);
    setReadSuccessMessage(
      targetItem?.name 
        ? `✍️ Added "${targetItem.name}" to bill! Enter store name and save, or add more items.` 
        : '✍️ Enter Our Bill: Enter store name, add line items and prices below, then click "Save Our Bill" to store it permanently in our account.'
    );
    setTimeout(() => {
      editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // Auto trigger manual bill entry if in manual mode or initialMode is manual, or preloadedItem changes
  useEffect(() => {
    if (preloadedItem) {
      startManualBillEntry(preloadedItem);
    } else if (initialMode === 'manual' || (ingestionMode === 'manual' && !extractedData)) {
      startManualBillEntry();
    }
  }, [initialMode, ingestionMode, preloadedItem]);

  // File Handlers (Gallery selection for Images or JSON)
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCameraError(null);

    // 1. Direct JSON file from gallery/documents
    if (file.name.endsWith('.json') || file.type === 'application/json' || file.type === 'text/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          const parsed = JSON.parse(rawText);

          // Handle standard and alternate key conventions
          const shopName = parsed.shop_name || parsed.shopName || 'Retail Store';
          const shopAddress = parsed.shop_address || parsed.shopAddress || 'Local Market';
          const date = parsed.date || new Date().toISOString().split('T')[0];
          const receiptNumber = parsed.receipt_number || parsed.receiptNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`;
          
          const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
          const items: ReceiptItem[] = rawItems.map((it: any, idx: number) => {
            const quantity = Number(it.quantity || it.qty || 1);
            const unitPrice = Number(it.unit_price || it.unitPrice || it.price || 0);
            const totalPrice = Number(it.total_price || it.totalPrice || (quantity * unitPrice));
            const category = it.category || 'Grocery';
            const name = it.name || it.item_name || `Item ${idx + 1}`;
            const isFood = isFoodOrGroceryItem(name, category);
            const evalHealth = isFood ? evaluateItemHealth(name, category) : { status: undefined, note: undefined };
            return {
              id: it.id || `item-json-${idx}-${Date.now()}`,
              name,
              quantity,
              unitPrice,
              totalPrice,
              category,
              healthStatus: isFood ? (it.health_status || it.healthStatus || evalHealth.status) : undefined,
              healthNote: isFood ? (it.health_note || it.healthNote || evalHealth.note) : undefined
            };
          });

          const tax = Number(parsed.tax || 0);
          const subtotal = items.reduce((s, it) => s + (it.totalPrice || 0), 0);
          const grandTotal = Number(parsed.grand_total || parsed.grandTotal || (subtotal + tax));

          const newReceipt = {
            shopName,
            shopAddress,
            date,
            receiptNumber,
            items,
            tax,
            grandTotal
          };

          setExtractedData(newReceipt);
          setRawJsonDraft(JSON.stringify(parsed, null, 2));
          setActiveTab('edit');
          setReadSuccessMessage(`Successfully processed receipt "${file.name}"!`);
          setTimeout(() => setReadSuccessMessage(null), 5000);
        } catch (err: any) {
          setCameraError(`Failed to parse JSON file "${file.name}": ${err.message}`);
        }
      };
      reader.readAsText(file);
      return;
    }

    // 2. Image / PDF file from gallery
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

    // Process OCR Pipeline with animation and structured output
  const runOcrSimulation = async (predefinedData?: any, targetView: 'json' | 'edit' | 'split' = 'edit', directImage?: string) => {
    setIsProcessing(true);
    setSaveSuccess(false);
    setCurrentStep(0);
    setActiveTab(targetView);

    // Step animations
    for (let i = 0; i < processingSteps.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 380));
    }

    if (predefinedData) {
      setExtractedData({
        shopName: predefinedData.shop_name || predefinedData.shopName,
        shopAddress: predefinedData.shop_address || predefinedData.shopAddress,
        date: predefinedData.date,
        receiptNumber: predefinedData.receipt_number || predefinedData.receiptNumber,
        items: predefinedData.items,
        tax: predefinedData.tax,
        grandTotal: predefinedData.grandTotal
      });
      setIsProcessing(false);
      setReadSuccessMessage('Receipt read successfully in JSON format!');
      setTimeout(() => setReadSuccessMessage(null), 4000);
      return;
    }

    // Call OCR endpoint
    try {
      const imgToUse = directImage || previewUrl || '';
      const res = await api.processOcr(imgToUse);
      const ocr = res.data;
      if (res.quotaNotice || res.quotaExceeded) {
        setQuotaNotice(res.quotaNotice || 'Cloud service quota limit reached. Expense Insight Hub processed your receipt using our local optical parser into JSON format.');
      } else {
        setQuotaNotice(null);
      }
      setExtractedData({
        shopName: ocr.shop_name,
        shopAddress: ocr.shop_address,
        date: ocr.date,
        receiptNumber: ocr.receipt_number,
        items: ocr.items,
        tax: ocr.tax,
        grandTotal: ocr.grand_total
      });
      setReadSuccessMessage('OCR finished: Receipt successfully extracted in JSON format!');
      setTimeout(() => setReadSuccessMessage(null), 4000);
    } catch (e: any) {
      setCameraError(e?.message || 'Could not parse receipt image automatically. You can enter or edit the items directly.');
      setExtractedData({
        shopName: 'Scanned Merchant',
        shopAddress: '',
        date: new Date().toISOString().split('T')[0],
        receiptNumber: `REC-${Date.now().toString().slice(-5)}`,
        items: [],
        tax: 0,
        grandTotal: 0
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply JSON Changes from the live code editor
  const handleApplyJsonChanges = () => {
    try {
      setJsonValidationError(null);
      const parsed = JSON.parse(rawJsonDraft);
      const shopName = parsed.shop_name || parsed.shopName || extractedData?.shopName || 'Shop';
      const shopAddress = parsed.shop_address || parsed.shopAddress || extractedData?.shopAddress || '';
      const date = parsed.date || extractedData?.date || new Date().toISOString().split('T')[0];
      const receiptNumber = parsed.receipt_number || parsed.receiptNumber || extractedData?.receiptNumber || 'REC-001';
      
      const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
      const items: ReceiptItem[] = rawItems.map((it: any, idx: number) => {
        const qty = Number(it.quantity || it.qty || 1);
        const unit = Number(it.unit_price || it.unitPrice || 0);
        const total = Number(it.total_price || it.totalPrice || (qty * unit));
        const category = it.category || 'Grocery';
        const name = it.name || `Item ${idx + 1}`;
        const isFood = isFoodOrGroceryItem(name, category);
        const evalHealth = isFood ? evaluateItemHealth(name, category) : { status: undefined, note: undefined };
        return {
          id: it.id || `item-json-edit-${idx}-${Date.now()}`,
          name,
          quantity: qty,
          unitPrice: unit,
          totalPrice: total,
          category,
          healthStatus: isFood ? (it.health_status || it.healthStatus || evalHealth.status) : undefined,
          healthNote: isFood ? (it.health_note || it.healthNote || evalHealth.note) : undefined
        };
      });

      const tax = Number(parsed.tax || 0);
      const subtotal = items.reduce((s, it) => s + (it.totalPrice || 0), 0);
      const grandTotal = Number(parsed.grand_total || parsed.grandTotal || (subtotal + tax));

      setExtractedData({
        shopName,
        shopAddress,
        date,
        receiptNumber,
        items,
        tax,
        grandTotal
      });
      setIsJsonEditorMode(false);
      setReadSuccessMessage('JSON modifications applied to receipt successfully!');
      setTimeout(() => setReadSuccessMessage(null), 3000);
    } catch (err: any) {
      setJsonValidationError(`JSON Syntax Error: ${err.message}`);
    }
  };

  // Item Table Mutators
  const updateItem = (index: number, field: keyof ReceiptItem, val: any) => {
    if (!extractedData) return;
    const updated = [...extractedData.items];
    updated[index] = { ...updated[index], [field]: val };

    // When item name or category changes, re-evaluate health status and note
    if (field === 'name' || field === 'category') {
      const itemName = field === 'name' ? val : updated[index].name;
      const itemCat = field === 'category' ? val : (updated[index].category || 'Grocery');
      const isFood = isFoodOrGroceryItem(itemName, itemCat);
      if (isFood) {
        const evalHealth = evaluateItemHealth(itemName, itemCat);
        updated[index].healthStatus = evalHealth.status;
        updated[index].healthNote = evalHealth.note;
      } else {
        updated[index].healthStatus = undefined;
        updated[index].healthNote = undefined;
      }
    }

    // Auto recalculate total for item
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : updated[index].quantity;
      const p = field === 'unitPrice' ? Number(val) : updated[index].unitPrice;
      updated[index].totalPrice = q * p;
    }

    // Auto recalculate grand total
    const subtotal = updated.reduce((s, it) => s + (it.totalPrice || 0), 0);
    const newGrand = subtotal + extractedData.tax;

    setExtractedData({
      ...extractedData,
      items: updated,
      grandTotal: newGrand
    });
  };

  const deleteItem = (index: number) => {
    if (!extractedData) return;
    const updated = extractedData.items.filter((_, i) => i !== index);
    const subtotal = updated.reduce((s, it) => s + (it.totalPrice || 0), 0);
    setExtractedData({
      ...extractedData,
      items: updated,
      grandTotal: subtotal + extractedData.tax
    });
  };

  const addItem = () => {
    if (!extractedData) return;
    const defaultName = '';
    const newItem: ReceiptItem = {
      id: `item-new-${Date.now()}`,
      name: defaultName,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Grocery',
      healthStatus: undefined,
      healthNote: undefined
    };
    const updated = [...extractedData.items, newItem];
    const subtotal = updated.reduce((s, it) => s + (it.totalPrice || 0), 0);
    setExtractedData({
      ...extractedData,
      items: updated,
      grandTotal: subtotal + extractedData.tax
    });
  };

  const addItemWithDetails = (itemData: { name: string; category: ProductCategory; price: number }) => {
    if (!extractedData) return;
    const qty = 1;
    const price = itemData.price || 100;
    const isFood = isFoodOrGroceryItem(itemData.name, itemData.category);
    const evalHealth = isFood ? evaluateItemHealth(itemData.name, itemData.category) : { status: undefined, note: undefined };
    const newItem: ReceiptItem = {
      id: `item-quick-${Date.now()}`,
      name: itemData.name,
      quantity: qty,
      unitPrice: price,
      totalPrice: qty * price,
      category: itemData.category,
      healthStatus: evalHealth.status,
      healthNote: evalHealth.note
    };

    let updated: ReceiptItem[];
    // If the items list only contains 1 blank item, replace it
    if (extractedData.items.length === 1 && !extractedData.items[0].name.trim()) {
      updated = [newItem];
    } else {
      updated = [...extractedData.items, newItem];
    }

    const subtotal = updated.reduce((s, it) => s + (it.totalPrice || 0), 0);
    setExtractedData({
      ...extractedData,
      items: updated,
      grandTotal: subtotal + extractedData.tax
    });
  };

  const updateTax = (newTax: number) => {
    if (!extractedData) return;
    const subtotal = extractedData.items.reduce((s, it) => s + (it.totalPrice || 0), 0);
    setExtractedData({
      ...extractedData,
      tax: newTax,
      grandTotal: subtotal + newTax
    });
  };

  // Structured JSON export
  const getStructuredJson = () => {
    return formatReceiptJson(extractedData);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(getStructuredJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([getStructuredJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${extractedData?.receiptNumber || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Computed Health & Expense Analytics for Extracted Receipt
  const extractedAnalysis = useMemo(() => {
    if (!extractedData || !extractedData.items) return null;
    const items = extractedData.items;
    
    // Category Breakdown
    const categoryMap: Record<string, { total: number; count: number }> = {};
    let subtotal = 0;
    
    // Health & Nutrition breakdown
    const healthyItems: ReceiptItem[] = [];
    const limitItems: ReceiptItem[] = [];
    const lessHealthyItems: ReceiptItem[] = [];
    const nonFoodItems: ReceiptItem[] = [];

    items.forEach((it) => {
      const price = Number(it.totalPrice || (it.quantity * it.unitPrice) || 0);
      subtotal += price;
      const cat = it.category || 'Grocery';
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
      categoryMap[cat].total += price;
      categoryMap[cat].count += Number(it.quantity || 1);

      if (isFoodOrGroceryItem(it.name, cat)) {
        const evalRes = evaluateItemHealth(it.name, cat);
        const status = evalRes.status === 'less_healthy' ? 'less_healthy' : (it.healthStatus || evalRes.status);
        if (status === 'healthy') {
          healthyItems.push(it);
        } else if (status === 'limit') {
          limitItems.push(it);
        } else {
          lessHealthyItems.push(it);
        }
      } else {
        nonFoodItems.push(it);
      }
    });

    const totalFoodItems = healthyItems.length + limitItems.length + lessHealthyItems.length;
    const healthScore = totalFoodItems > 0 
      ? Math.round(((healthyItems.length * 1.0 + limitItems.length * 0.5) / totalFoodItems) * 100)
      : 100;

    const sortedCategories = Object.entries(categoryMap)
      .map(([cat, data]) => ({
        category: cat,
        total: data.total,
        count: data.count,
        percentage: subtotal > 0 ? Math.round((data.total / subtotal) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);

    const mostExpensiveItem = [...items].sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0))[0] || null;
    const avgItemPrice = items.length > 0 ? Math.round(subtotal / items.length) : 0;

    return {
      subtotal,
      healthyItems,
      limitItems,
      lessHealthyItems,
      nonFoodItems,
      totalFoodItems,
      healthScore,
      sortedCategories,
      mostExpensiveItem,
      avgItemPrice
    };
  }, [extractedData]);

  // Computed Health & Expense Analytics for Archived Receipt in modal
  const analyzingReceiptAnalysis = useMemo(() => {
    if (!analyzingReceipt || !analyzingReceipt.items) return null;
    const items = analyzingReceipt.items;
    const categoryMap: Record<string, { total: number; count: number }> = {};
    let subtotal = 0;
    const healthyItems: ReceiptItem[] = [];
    const limitItems: ReceiptItem[] = [];
    const lessHealthyItems: ReceiptItem[] = [];
    const nonFoodItems: ReceiptItem[] = [];

    items.forEach((it) => {
      const price = Number(it.totalPrice || (it.quantity * it.unitPrice) || 0);
      subtotal += price;
      const cat = it.category || 'Grocery';
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
      categoryMap[cat].total += price;
      categoryMap[cat].count += Number(it.quantity || 1);

      if (isFoodOrGroceryItem(it.name, cat)) {
        const evalRes = evaluateItemHealth(it.name, cat);
        const status = evalRes.status === 'less_healthy' ? 'less_healthy' : (it.healthStatus || evalRes.status);
        if (status === 'healthy') healthyItems.push(it);
        else if (status === 'limit') limitItems.push(it);
        else lessHealthyItems.push(it);
      } else {
        nonFoodItems.push(it);
      }
    });

    const totalFoodItems = healthyItems.length + limitItems.length + lessHealthyItems.length;
    const healthScore = totalFoodItems > 0 
      ? Math.round(((healthyItems.length * 1.0 + limitItems.length * 0.5) / totalFoodItems) * 100)
      : 100;

    const sortedCategories = Object.entries(categoryMap)
      .map(([cat, data]) => ({
        category: cat,
        total: data.total,
        count: data.count,
        percentage: subtotal > 0 ? Math.round((data.total / subtotal) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);

    const mostExpensiveItem = [...items].sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0))[0] || null;
    const avgItemPrice = items.length > 0 ? Math.round(subtotal / items.length) : 0;

    return {
      subtotal,
      healthyItems,
      limitItems,
      lessHealthyItems,
      nonFoodItems,
      totalFoodItems,
      healthScore,
      sortedCategories,
      mostExpensiveItem,
      avgItemPrice
    };
  }, [analyzingReceipt]);

  // Save to Database
  const handleSaveReceipt = async () => {
    if (!extractedData) return;
    const finalShopName = extractedData.shopName.trim() || 'Store Bill';
    const subtotal = extractedData.items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
    const calculatedGrandTotal = subtotal + (Number(extractedData.tax) || 0);
    const finalGrandTotal = extractedData.grandTotal > 0 ? extractedData.grandTotal : calculatedGrandTotal;

    const finalItems = extractedData.items.map((it, idx) => {
      const q = Math.max(1, Number(it.quantity) || 1);
      const u = Number(it.unitPrice) || 0;
      const t = Number(it.totalPrice) || (q * u);
      return {
        ...it,
        id: it.id || `item-${Date.now()}-${idx}`,
        name: it.name.trim() || `Item ${idx + 1}`,
        quantity: q,
        unitPrice: u,
        totalPrice: t
      };
    });

    const effectiveUserId = currentUser?.id || currentUser?.email;

    const saved = await api.saveReceipt({
      userId: effectiveUserId,
      shopName: finalShopName,
      shopAddress: extractedData.shopAddress || 'Local Market',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      receiptNumber: extractedData.receiptNumber || `BILL-${Date.now().toString().slice(-6)}`,
      items: finalItems,
      tax: Number(extractedData.tax) || 0,
      grandTotal: finalGrandTotal,
      imageUrl: previewUrl || undefined
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setSavedReceiptId(saved.id);
    setSaveSuccess(true);
    setReadSuccessMessage(`✅ Our bill #${saved.receiptNumber} from "${saved.shopName}" (₹${saved.grandTotal.toLocaleString()}) has been permanently saved in our account! You can fetch this bill today, tomorrow, or anytime.`);
    onReceiptSaved(saved);
  };

  // Delete / Remove current uploaded file
  const handleDeleteUploadedFile = () => {
    setConfirmDeleteFile(true);
  };

  const handleConfirmDeleteFile = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setExtractedData(null);
    setRawJsonDraft('');
    setReadSuccessMessage(null);
    setConfirmDeleteFile(false);
    setDeleteNoticeMessage('Uploaded preview file was removed.');
    setTimeout(() => setDeleteNoticeMessage(null), 3000);
  };

  // Delete / Discard currently open extracted receipt
  const handleDiscardOrDeleteCurrent = () => {
    setConfirmDeleteCurrent(true);
  };

  const handleConfirmDiscardOrDeleteCurrent = async () => {
    setIsDeleting(true);
    try {
      if (savedReceiptId) {
        await api.deleteReceipt(savedReceiptId);
        if (onDeleteReceipt) onDeleteReceipt(savedReceiptId);
        setDeleteNoticeMessage('Receipt was permanently deleted from your database.');
        setTimeout(() => setDeleteNoticeMessage(null), 4000);
        setSavedReceiptId(null);
        setSaveSuccess(false);
      } else {
        setDeleteNoticeMessage('Extracted receipt data discarded.');
        setTimeout(() => setDeleteNoticeMessage(null), 3000);
      }
      setExtractedData(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setRawJsonDraft('');
      setReadSuccessMessage(null);
      setConfirmDeleteCurrent(false);
    } catch (err: any) {
      console.error('Delete current receipt error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete a receipt from the uploaded receipts history
  const handleDeleteFromHistory = (id: string, shopName: string, amount: number, date?: string, itemsCount?: number) => {
    setReceiptToDelete({ id, shopName, grandTotal: amount, date, itemsCount });
  };

  const handleConfirmDeleteSingle = async () => {
    if (!receiptToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteReceipt(receiptToDelete.id);
      if (onDeleteReceipt) onDeleteReceipt(receiptToDelete.id);
      if (savedReceiptId === receiptToDelete.id) {
        setSavedReceiptId(null);
        setSaveSuccess(false);
      }
      setSelectedReceiptIds((prev) => prev.filter((id) => id !== receiptToDelete.id));
      setDeleteNoticeMessage(`Receipt from "${receiptToDelete.shopName}" (₹${receiptToDelete.grandTotal.toLocaleString()}) was deleted successfully.`);
      setTimeout(() => setDeleteNoticeMessage(null), 4000);
      setReceiptToDelete(null);
    } catch (err: any) {
      console.error('Delete receipt error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch Selection and Deletion Handlers
  const handleToggleSelectReceipt = (id: string) => {
    setSelectedReceiptIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllReceipts = () => {
    if (selectedReceiptIds.length === receipts.length) {
      setSelectedReceiptIds([]);
    } else {
      setSelectedReceiptIds(receipts.map((r) => r.id));
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedReceiptIds.length === 0) return;
    setIsDeleting(true);
    try {
      const count = selectedReceiptIds.length;
      for (const id of selectedReceiptIds) {
        await api.deleteReceipt(id);
        if (onDeleteReceipt) onDeleteReceipt(id);
        if (savedReceiptId === id) {
          setSavedReceiptId(null);
          setSaveSuccess(false);
        }
      }
      setDeleteNoticeMessage(`Successfully deleted ${count} uploaded receipts.`);
      setTimeout(() => setDeleteNoticeMessage(null), 4000);
      setSelectedReceiptIds([]);
      setIsMultiSelectMode(false);
      setConfirmBatchDelete(false);
    } catch (err: any) {
      console.error('Batch delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter saved receipts by search query
  const filteredSavedReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (!billSearchQuery.trim()) return true;
      const q = billSearchQuery.toLowerCase().trim();
      const matchShop = r.shopName?.toLowerCase().includes(q);
      const matchNumber = r.receiptNumber?.toLowerCase().includes(q);
      const matchItem = r.items?.some((it) => it.name?.toLowerCase().includes(q));
      const matchTotal = r.grandTotal?.toString().includes(q);
      const matchDate = r.date?.toLowerCase().includes(q);
      return Boolean(matchShop || matchNumber || matchItem || matchTotal || matchDate);
    });
  }, [receipts, billSearchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Title & Purpose Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
            Upload Receipt
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enter bill details manually or upload any receipt. Every bill you save is permanently stored in your account database so you can fetch, view, search, and audit your records anytime.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {readSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{readSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Delete / Removal Notice Banner */}
      {deleteNoticeMessage && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>{deleteNoticeMessage}</span>
          </div>
        </div>
      )}

      {/* Quota / API Key Notice Banner */}
      {quotaNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-300">
                {quotaNotice.includes('GEMINI_API_KEY') || quotaNotice.includes('API Key is missing') ? 'AI Vision Scanning Setup (Local VS Code)' : 'Notice: Local Parser Active'}
              </p>
              <p className="mt-1 leading-relaxed">{quotaNotice}</p>
              {(quotaNotice.includes('GEMINI_API_KEY') || quotaNotice.includes('API Key is missing')) && (
                <div className="mt-2 text-[11px] bg-amber-500/10 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/20 text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">💡 Steps to enable AI Scanning:</span>
                  <ol className="list-decimal list-inside mt-1 space-y-0.5">
                    <li>Create a <code className="font-mono bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env</code> file in your project root directory.</li>
                    <li>Add your key: <code className="font-mono bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded">GEMINI_API_KEY=your_key_here</code> and save.</li>
                    <li>Restart the development server in terminal (<code className="font-mono bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded">npm run dev</code>).</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => setQuotaNotice(null)}
            className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Ingestion Mode Selector Bar (Only 2 Options: Upload File & Enter Our Bill) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIngestionMode('scan');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ingestionMode === 'scan'
                ? 'bg-emerald-600 text-white shadow-xs scale-102'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>📁 Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIngestionMode('manual');
              if (!extractedData) startManualBillEntry();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ingestionMode === 'manual'
                ? 'bg-purple-600 text-white shadow-xs scale-102'
                : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-purple-50 dark:hover:bg-purple-950/30'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>✍️ Enter Our Bill</span>
          </button>
        </div>

        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 px-2 font-medium">
          Our bills are permanently stored in account and can be fetched today, tomorrow, or anytime
        </span>
      </div>

      {/* Mode 1: Manual Ingestion Banner */}
      {ingestionMode === 'manual' && (
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Enter Our Bill Manually</span>
            </h4>
            <p className="text-xs text-purple-700/90 dark:text-purple-300 mt-0.5">
              Enter our store details, line items, and prices into the interactive form below. Click "Save Our Bill" to permanently store this bill in our account. You can fetch our bills anytime today, tomorrow, or after logging in again.
            </p>
          </div>
          <button
            type="button"
            onClick={startManualBillEntry}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Blank Bill Form</span>
          </button>
        </div>
      )}

      {/* Mode 2: Upload File Ingestion (Photos, PDFs, JSON) */}
      {ingestionMode === 'scan' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Main Upload Card */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-center flex flex-col items-center justify-between shadow-xs cursor-pointer group max-w-2xl mx-auto"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*,application/pdf,.pdf,application/json,.json,text/json" 
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]);
              }}
            />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform mb-4 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="font-bold font-display text-lg text-zinc-900 dark:text-zinc-100">
                📁 Upload Receipt File
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-md">
                Select receipt photos from your device (JPG, PNG, WEBP), digital PDF invoices, or structured JSON files.
              </p>
            </div>
            <div className="mt-5 w-full max-w-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Browse & Upload File</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div 
            ref={dropZoneRef}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-5 rounded-3xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center max-w-2xl mx-auto ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 scale-[1.01]'
                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-semibold text-xs">
              <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Or Drag & Drop Any Receipt File (JPG, PNG, PDF, JSON) Here</span>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW & DUAL TRIGGER: READ IN JSON OR FORM */}
      {previewUrl && !isProcessing && !extractedData && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center shadow-inner">
              {selectedFile?.type === 'application/pdf' ? (
                <FileText className="w-10 h-10 text-blue-500" />
              ) : (
                <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {selectedFile?.name || 'Captured Receipt'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ready for AI Optical Character Recognition & structured JSON parsing.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleDeleteUploadedFile}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800/60 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete/Remove this uploaded file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Uploaded File</span>
                </button>
                <button
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:underline flex items-center gap-1 ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Choose Another</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => runOcrSimulation(undefined, 'edit')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Process Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* OCR PROCESSING PROGRESSION */}
      {isProcessing && (
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md text-center max-w-sm mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h3 className="text-lg font-bold font-display text-zinc-900 dark:text-zinc-100">
              Processing...
            </h3>
          </div>
        </div>
      )}

      {/* EXTRACTED DATA VIEW WITH 3 MODES: JSON, FORM, DUAL */}
      {extractedData && !isProcessing && (
        <div ref={editorSectionRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Top Bar with Mode Switcher & Primary Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>✏️ Bill Items</span>
              </button>

              {previewUrl && (
                <button
                  type="button"
                  onClick={() => setActiveTab('split')}
                  className={`hidden md:flex px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'split'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>⇄ Split View</span>
                </button>
              )}
            </div>

            {/* Save, Print, Delete & Reset Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {/* Active Delete Action for Extracted/Saved Receipt */}
              <button
                type="button"
                onClick={handleDiscardOrDeleteCurrent}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                title={savedReceiptId ? "Delete this saved receipt from database" : "Discard and delete this extracted receipt"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{savedReceiptId ? 'Delete Saved' : 'Delete / Discard'}</span>
              </button>
              
              <button
                onClick={handleSaveReceipt}
                disabled={saveSuccess}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  saveSuccess 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved to Database!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Receipt saved successfully! Budgets and purchase history updated.</span>
              </div>
              <button 
                onClick={() => onNavigate ? onNavigate('receipts') : null}
                className="font-bold underline ml-2 hover:text-emerald-900 dark:hover:text-emerald-100"
              >
                View in My Receipts →
              </button>
            </div>
          )}

          {/* TAB 1: STRUCTURED JSON VIEW & EDITOR */}
          {(activeTab === 'json' || activeTab === 'split') && (
            <div className={`p-5 rounded-3xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-xl space-y-4 ${activeTab === 'split' ? 'grid grid-cols-1' : ''}`}>
              
              {/* Top metadata & tools */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold font-display text-emerald-400 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      Receipt JSON Document
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[10px] font-mono font-bold">
                      RFC 8259 JSON
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono">
                      {extractedData.items.length} items
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-emerald-400 border border-zinc-800 text-[10px] font-mono font-bold">
                      Grand Total: ₹{extractedData.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Extracted machine-readable format parsed from receipt.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Toggle JSON Editor Mode */}
                  <button
                    onClick={() => {
                      if (!isJsonEditorMode) {
                        setRawJsonDraft(getStructuredJson());
                      }
                      setIsJsonEditorMode(!isJsonEditorMode);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isJsonEditorMode 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {isJsonEditorMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span>{isJsonEditorMode ? 'View Formatted' : 'Edit Raw JSON'}</span>
                  </button>

                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>

              {/* JSON Validation Error Alert if in edit mode */}
              {jsonValidationError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{jsonValidationError}</span>
                </div>
              )}

              {/* VIEW 1: Monospace Code Display */}
              {!isJsonEditorMode ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/90">
                  <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      <span className="ml-2 font-bold text-zinc-300">receipt-{extractedData.receiptNumber}.json</span>
                    </span>
                    <span>JSON Schema v1.0</span>
                  </div>

                  <pre className="p-4 text-emerald-300 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed select-text">
                    {getStructuredJson()}
                  </pre>
                </div>
              ) : (
                /* VIEW 2: Raw Editable JSON Textarea */
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
                    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] text-amber-300 font-mono">
                      <span>✏️ Live JSON Editor (Modify properties directly)</span>
                      <span className="text-zinc-400">Press Apply to sync</span>
                    </div>

                    <textarea
                      value={rawJsonDraft}
                      onChange={(e) => setRawJsonDraft(e.target.value)}
                      rows={18}
                      className="w-full p-4 bg-zinc-950 font-mono text-xs text-emerald-300 outline-none resize-y border-none leading-relaxed"
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const formatted = JSON.stringify(JSON.parse(rawJsonDraft), null, 2);
                          setRawJsonDraft(formatted);
                          setJsonValidationError(null);
                        } catch (e: any) {
                          setJsonValidationError(`Cannot format: ${e.message}`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                    >
                      Format Indentation
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRawJsonDraft(getStructuredJson());
                          setIsJsonEditorMode(false);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyJsonChanges}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply JSON Changes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions Footer inside JSON Card */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-900 text-xs text-zinc-400">
                <span>
                  ✓ Ready for backend sync, analytics, and budget updates.
                </span>
                <button
                  onClick={handleSaveReceipt}
                  disabled={saveSuccess}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveSuccess ? 'Saved to Database' : 'Save Extracted Receipt'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: EDITABLE FORM TABLE */}
          {(activeTab === 'edit' || activeTab === 'split') && (
            <div className="space-y-6">
              
              {/* Shop & Receipt Metadata Inputs */}
              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="font-bold font-display text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-zinc-400">
                  Receipt Metadata Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Shop / Merchant Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. D-Mart, Reliance Fresh, Local Store"
                      value={extractedData.shopName}
                      onChange={(e) => setExtractedData({ ...extractedData, shopName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:border-purple-500 outline-none"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {POPULAR_STORES.slice(0, 5).map((store) => (
                        <button
                          key={store}
                          type="button"
                          onClick={() => setExtractedData((prev) => (prev ? { ...prev, shopName: store } : null))}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 hover:bg-purple-100 dark:bg-zinc-800 dark:hover:bg-purple-950/40 text-zinc-700 dark:text-zinc-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          {store}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Shop Address / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Street / City"
                      value={extractedData.shopAddress}
                      onChange={(e) => setExtractedData({ ...extractedData, shopAddress: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Receipt / Bill Date
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setExtractedData({ ...extractedData, date: today });
                        }}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        📅 Set Today
                      </button>
                    </div>
                    <input
                      type="date"
                      value={extractedData.date}
                      onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Receipt Number
                    </label>
                    <input
                      type="text"
                      value={extractedData.receiptNumber}
                      onChange={(e) => setExtractedData({ ...extractedData, receiptNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold font-display text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-zinc-400">
                      Receipt Items Table
                    </h3>
                    <p className="text-xs text-zinc-500">Edit item name, quantity, unit price, or category</p>
                  </div>
                  <button
                    onClick={addItem}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-2">Item Name</th>
                        <th className="pb-3 px-2 w-20 text-center">Qty</th>
                        <th className="pb-3 px-2 w-28 text-right">Unit Price (₹)</th>
                        <th className="pb-3 px-2 w-28 text-right">Total (₹)</th>
                        <th className="pb-3 px-2 w-44">Category</th>
                        <th className="pb-3 px-2 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {extractedData.items.map((item, idx) => {
                        const isFood = isFoodOrGroceryItem(item.name, item.category);
                        const isLessHealthy = isFood && item.healthStatus === 'less_healthy';
                        const isLimit = isFood && item.healthStatus === 'limit';
                        const isHealthy = isFood && item.healthStatus === 'healthy';

                        return (
                        <tr key={item.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Type item name (e.g. Milk, Rice, T-Shirt)"
                                value={item.name}
                                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium outline-none focus:border-emerald-500"
                              />
                              {isLessHealthy && (
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800" title="Categorized as Less Healthy / Sugar">
                                  🔴 Less Healthy
                                </span>
                              )}
                              {isLimit && (
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Categorized as Portion Controlled">
                                  🟡 Limit
                                </span>
                              )}
                              {isHealthy && (
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Categorized as Healthy Staple">
                                  🟢 Healthy
                                </span>
                              )}
                            </div>
                            {isFood && item.healthNote && (
                              <p className={`text-[10px] mt-1 ${isLessHealthy ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-400'}`}>
                                {item.healthNote}
                              </p>
                            )}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-center outline-none focus:border-emerald-500"
                            />
                          </td>

                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-right outline-none focus:border-emerald-500"
                            />
                          </td>

                          <td className="py-2.5 px-2 text-right font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{item.totalPrice.toLocaleString()}
                          </td>

                          <td className="py-2.5 px-2">
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(idx, 'category', e.target.value as ProductCategory)}
                              className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                            >
                              {CATEGORIES_LIST.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => deleteItem(idx)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, Tax, Grand Total Calculation Bar */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                  <span className="text-xs text-zinc-500">
                    Line Items Subtotal + Tax = Grand Total
                  </span>

                  <div className="space-y-1 text-right min-w-[200px]">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        ₹{extractedData.items.reduce((s, it) => s + (it.totalPrice || 0), 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Tax / GST:</span>
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          value={extractedData.tax}
                          onChange={(e) => updateTax(parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-0.5 text-xs text-right rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm font-black font-display text-zinc-900 dark:text-zinc-50 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span>Grand Total:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ₹{extractedData.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>



              </div>

            </div>
          )}

          {/* TAB 4: ✨ AI HEALTH & EXPENSE ANALYSIS BREAKDOWN */}
          {activeTab === 'analyze' && extractedAnalysis && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Top Analytical Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Health Score Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Health & Nutrition Score
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      extractedAnalysis.healthScore >= 75
                        ? 'bg-emerald-600 text-white'
                        : extractedAnalysis.healthScore >= 50
                        ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {extractedAnalysis.healthScore >= 75 ? 'Wholesome' : extractedAnalysis.healthScore >= 50 ? 'Moderate' : 'Low Nutrition'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-display text-emerald-700 dark:text-emerald-300">
                      {extractedAnalysis.healthScore}%
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      from {extractedAnalysis.totalFoodItems} food items
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        extractedAnalysis.healthScore >= 75 ? 'bg-emerald-500' : extractedAnalysis.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(5, extractedAnalysis.healthScore)}%` }}
                    />
                  </div>
                </div>

                {/* Grand Spend & Item Count */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <ReceiptIcon className="w-4 h-4 text-indigo-500" />
                      Grand Spend
                    </span>
                    <span className="text-[11px] text-zinc-400">{extractedData.items.length} items</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black font-display text-zinc-900 dark:text-zinc-100">
                      ₹{extractedData.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Avg ₹{extractedAnalysis.avgItemPrice.toLocaleString()} per line item
                  </p>
                </div>

                {/* Dominant Category */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-violet-500" />
                      Top Category
                    </span>
                    <span className="text-[11px] text-violet-600 dark:text-violet-400 font-bold">
                      {extractedAnalysis.sortedCategories[0]?.percentage || 0}% share
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100 truncate block">
                      {extractedAnalysis.sortedCategories[0]?.category || 'None'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    ₹{extractedAnalysis.sortedCategories[0]?.total.toLocaleString() || 0} allocated
                  </p>
                </div>

                {/* Highest Single Expense */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      Top Item Expense
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100 truncate block">
                      {extractedAnalysis.mostExpensiveItem?.name || '—'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
                    ₹{(extractedAnalysis.mostExpensiveItem?.totalPrice || 0).toLocaleString()} ({Math.round(((extractedAnalysis.mostExpensiveItem?.totalPrice || 0) / (extractedData.grandTotal || 1)) * 100)}% of bill)
                  </p>
                </div>

              </div>

              {/* Nutritional Health Evaluation Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Wholesome & Nutrient-Rich Items */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Salad className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Wholesome & Fresh</h4>
                        <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400">Nutrient-dense real food</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-black">
                      {extractedAnalysis.healthyItems.length}
                    </span>
                  </div>

                  {extractedAnalysis.healthyItems.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2">No fresh / whole food items detected.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {extractedAnalysis.healthyItems.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.name}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Limit & Moderation Items */}
                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Enjoy in Moderation</h4>
                        <p className="text-[10px] text-amber-700/80 dark:text-amber-400">Refined carbs, sugars, oils</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-black">
                      {extractedAnalysis.limitItems.length}
                    </span>
                  </div>

                  {extractedAnalysis.limitItems.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2">No moderate limit items detected.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {extractedAnalysis.limitItems.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-amber-100 dark:border-amber-900/50 flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.name}</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Ultra-Processed / Less Healthy Items */}
                <div className="p-5 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-red-900 dark:text-red-200">🔴 Less Healthy / Sugar</h4>
                        <p className="text-[10px] text-red-700/80 dark:text-red-400">Cold drinks, sodas, ultra-processed sweets & snacks</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 text-xs font-black">
                      {extractedAnalysis.lessHealthyItems.length}
                    </span>
                  </div>

                  {extractedAnalysis.lessHealthyItems.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2">Great job! No ultra-processed junk detected.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {extractedAnalysis.lessHealthyItems.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-red-100 dark:border-red-900/50 flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.name}</span>
                          <span className="font-bold text-red-600 dark:text-red-400 flex-shrink-0">₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Spending by Category Visual Distribution */}
              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Receipt Category Allocation</span>
                  </h4>
                  <span className="text-xs text-zinc-400">Total ₹{extractedData.grandTotal.toLocaleString()}</span>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  {extractedAnalysis.sortedCategories.map((cat, idx) => {
                    const colors = [
                      'bg-emerald-500',
                      'bg-indigo-500',
                      'bg-amber-500',
                      'bg-violet-500',
                      'bg-blue-500',
                      'bg-rose-500',
                      'bg-teal-500'
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <div
                        key={cat.category}
                        style={{ width: `${cat.percentage}%` }}
                        className={`${color} h-full transition-all`}
                        title={`${cat.category}: ₹${cat.total} (${cat.percentage}%)`}
                      />
                    );
                  })}
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {extractedAnalysis.sortedCategories.map((cat, idx) => (
                    <div key={cat.category} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{cat.category}</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">₹{cat.total.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-zinc-400">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Shortcuts to Deep Analysis */}
              {onNavigate && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Want long-term nutritional trends or expense forecasts?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('health')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      🥗 Full Health Dashboard →
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('expenses')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      💰 Full Expense Analytics →
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* UPLOADED RECEIPTS ARCHIVE & MANAGEMENT */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold font-display text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ReceiptIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Our Saved Bills & Records ({receipts.length})</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage, view, print, analyze, or fetch our saved bills and receipts anytime today, tomorrow, or in future logins.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[180px] sm:min-w-[210px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={billSearchQuery}
                onChange={(e) => setBillSearchQuery(e.target.value)}
                placeholder="Search our bills & stores..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              {billSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBillSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Direct Fetch Bills & Data Button */}
            <button
              type="button"
              onClick={handleFetchBills}
              disabled={isFetchingBills}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={`Fetch all saved bills from our account database (${currentUser?.email || 'Logged-in user'})`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingBills ? 'animate-spin' : ''}`} />
              <span>{isFetchingBills ? 'Fetching Data...' : 'Fetch Bills & Data'}</span>
            </button>

            {receipts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsMultiSelectMode(!isMultiSelectMode);
                    if (isMultiSelectMode) setSelectedReceiptIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isMultiSelectMode
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-300 dark:border-red-800'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isMultiSelectMode ? 'Cancel Batch' : 'Batch Delete'}</span>
                </button>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('receipts')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 ml-1 cursor-pointer"
                  >
                    <span>Full History →</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Live Fetch Notice Banner */}
        {fetchNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{fetchNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setFetchNotice(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Batch Delete Action Bar */}
        {isMultiSelectMode && receipts.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllReceipts}
                className="text-xs font-bold text-red-800 dark:text-red-300 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                {selectedReceiptIds.length === receipts.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Select All ({receipts.length})</span>
                  </>
                )}
              </button>
              <span className="text-xs text-red-700 dark:text-red-400 font-semibold">
                {selectedReceiptIds.length} receipt{selectedReceiptIds.length === 1 ? '' : 's'} selected
              </span>
            </div>

            <button
              type="button"
              disabled={selectedReceiptIds.length === 0}
              onClick={() => setConfirmBatchDelete(true)}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedReceiptIds.length})</span>
            </button>
          </div>
        )}

        {filteredSavedReceipts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <ReceiptIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {billSearchQuery ? 'No matching bills found' : 'No Saved Bills Yet'}
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {billSearchQuery
                ? `No bills match "${billSearchQuery}". Clear your search or enter our bill above.`
                : 'Enter our bill details or upload any receipt above. It is permanently saved in our account and can be fetched anytime today, tomorrow, or in future logins.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSavedReceipts.map((receipt) => {
              const isSelected = selectedReceiptIds.includes(receipt.id);
              const isJustSaved = savedReceiptId === receipt.id;
              return (
                <div
                  key={receipt.id}
                  onClick={() => {
                    if (isMultiSelectMode) handleToggleSelectReceipt(receipt.id);
                  }}
                  className={`p-4.5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all flex flex-col justify-between gap-4 relative ${
                    isJustSaved
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/20'
                      : isSelected
                      ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20 ring-2 ring-red-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700'
                  } ${isMultiSelectMode ? 'cursor-pointer' : ''}`}
                >
                  <div>
                    {isJustSaved && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                          ✨ Just Saved
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {isMultiSelectMode && (
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-red-600" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {receipt.shopName}
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {receipt.date} • {receipt.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black font-display text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        ₹{receipt.grandTotal?.toLocaleString()}
                      </span>
                    </div>

                    {receipt.items && receipt.items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {receipt.items.slice(0, 3).map((it, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] truncate max-w-[140px]"
                          >
                            {it.name}
                          </span>
                        ))}
                        {receipt.items.length > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-zinc-400 font-medium">
                            +{receipt.items.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Receipt Actions: View, Analyze, Print, Delete */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {onViewReceipt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt(receipt);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Bill Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      )}
                    </div>

                    {/* Active Delete Receipt Option */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFromHistory(receipt.id, receipt.shopName, receipt.grandTotal, receipt.date, receipt.items?.length);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Delete this uploaded receipt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🛑 IN-APP MODAL 1: SINGLE RECEIPT DELETE CONFIRMATION */}
      {receiptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
                  Delete Uploaded Receipt?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  This action cannot be undone. All associated expense records will be deleted.
                </p>
              </div>
            </div>

            {/* Receipt details snippet */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Merchant / Store:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{receiptToDelete.shopName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Total Amount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{receiptToDelete.grandTotal.toLocaleString()}</span>
              </div>
              {receiptToDelete.date && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Date:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{receiptToDelete.date}</span>
                </div>
              )}
              {receiptToDelete.itemsCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Items:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{receiptToDelete.itemsCount} line items</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setReceiptToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteSingle}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 IN-APP MODAL 2: BATCH DELETE CONFIRMATION */}
      {confirmBatchDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
                  Delete {selectedReceiptIds.length} Receipts?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Permanently delete all {selectedReceiptIds.length} selected receipts from database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmBatchDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmBatchDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting {selectedReceiptIds.length}...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete {selectedReceiptIds.length} Receipts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 IN-APP MODAL 3: DISCARD / DELETE CURRENT EXTRACTED DATA */}
      {confirmDeleteCurrent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
                  {savedReceiptId ? 'Delete Saved Receipt?' : 'Discard Extracted Data?'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {savedReceiptId 
                    ? 'This receipt is already stored in your database. Deleting it will permanently erase it.' 
                    : 'Discard and erase all extracted items, JSON schema, and image previews.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteCurrent(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDiscardOrDeleteCurrent}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Erasing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{savedReceiptId ? 'Yes, Delete from Database' : 'Yes, Discard'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 IN-APP MODAL 4: DELETE UPLOADED PREVIEW FILE */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-zinc-900 dark:text-zinc-100">
                  Remove Uploaded File?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Remove this receipt image/PDF from preview.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteFile(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFile}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ IN-APP MODAL 5: INSTANT AI ANALYSIS FOR ANY UPLOADED RECEIPT */}
      {analyzingReceipt && analyzingReceiptAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-6 animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-zinc-900 dark:text-zinc-100">
                    Receipt AI Analysis: {analyzingReceipt.shopName}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {analyzingReceipt.date} • ₹{analyzingReceipt.grandTotal.toLocaleString()} • {analyzingReceipt.items?.length || 0} items
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnalyzingReceipt(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  Health Score
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {analyzingReceiptAnalysis.healthScore}%
                  </span>
                  <span className="text-[11px] text-zinc-500">wholesome</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                  Top Category
                </span>
                <div className="mt-2">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                    {analyzingReceiptAnalysis.sortedCategories[0]?.category || 'General'}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    ₹{analyzingReceiptAnalysis.sortedCategories[0]?.total.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  Highest Item
                </span>
                <div className="mt-2">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                    {analyzingReceiptAnalysis.mostExpensiveItem?.name || '—'}
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    ₹{(analyzingReceiptAnalysis.mostExpensiveItem?.totalPrice || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Food Health Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Nutritional Quality Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    🟢 Wholesome ({analyzingReceiptAnalysis.healthyItems.length})
                  </span>
                  <ul className="mt-2 space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                    {analyzingReceiptAnalysis.healthyItems.slice(0, 3).map((it, i) => (
                      <li key={i} className="truncate">• {it.name}</li>
                    ))}
                    {analyzingReceiptAnalysis.healthyItems.length === 0 && <li className="text-zinc-400 italic">None</li>}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    🟡 Moderate ({analyzingReceiptAnalysis.limitItems.length})
                  </span>
                  <ul className="mt-2 space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                    {analyzingReceiptAnalysis.limitItems.slice(0, 3).map((it, i) => (
                      <li key={i} className="truncate">• {it.name}</li>
                    ))}
                    {analyzingReceiptAnalysis.limitItems.length === 0 && <li className="text-zinc-400 italic">None</li>}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40">
                  <span className="text-xs font-bold text-red-800 dark:text-red-300">
                    🔴 Less Healthy / Sugar ({analyzingReceiptAnalysis.lessHealthyItems.length})
                  </span>
                  <ul className="mt-2 space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                    {analyzingReceiptAnalysis.lessHealthyItems.slice(0, 3).map((it, i) => (
                      <li key={i} className="truncate">• {it.name}</li>
                    ))}
                    {analyzingReceiptAnalysis.lessHealthyItems.length === 0 && <li className="text-zinc-400 italic">None</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  const toView = analyzingReceipt;
                  setAnalyzingReceipt(null);
                  if (onViewReceipt && toView) onViewReceipt(toView);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Full Bill View</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyzingReceipt(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close Analysis
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

