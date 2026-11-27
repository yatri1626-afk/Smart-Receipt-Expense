export type ProductCategory =
  | 'Grocery'
  | 'Clothing'
  | 'Food & Health'
  | 'Beauty & Personal Care'
  | 'Health Products'
  | 'Electronics'
  | 'Home & Household'
  | 'Books & Education'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyBudget: number;
  preferredCategories: ProductCategory[];
  avatar?: string;
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: ProductCategory;
  healthStatus?: 'healthy' | 'limit' | 'less_healthy' | string;
  healthNote?: string;
}

export interface Receipt {
  id: string;
  userId: string;
  shopName: string;
  shopAddress: string;
  date: string;
  receiptNumber: string;
  items: ReceiptItem[];
  tax: number;
  grandTotal: number;
  imageUrl?: string;
  healthSummary?: string;
  createdAt: string;
}

export interface CategoryBudget {
  category: ProductCategory | 'Total' | string;
  allocated: number;
  spent: number;
  limit?: number; // alias for allocated
}

export interface NearbyShop {
  id: string;
  name: string;
  category: ProductCategory | 'General' | string;
  distanceKm?: number;
  distance?: string;
  rating: number;
  address: string;
  area?: string;
  city?: string;
  lat?: number;
  lng?: number;
  matchedItem?: string;
  phone?: string;
  timing?: string;
  offers?: string;
  inStockItems?: string[];
  priceRange?: '₹' | '₹₹' | '₹₹₹';
  isCustomAdded?: boolean;
  notes?: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  isPurchased: boolean;
  priority: 'must_buy' | 'regular' | 'optional';
  targetShop?: string;
  notes?: string;
}

export interface ShoppingPlan {
  id: string;
  title: string;
  createdAt: string;
  targetBudget?: number;
  items: ShoppingListItem[];
}

export interface SmartSuggestion {
  id: string;
  type?: 'spending' | 'budget' | 'clothing' | 'shopping' | 'health' | string;
  category?: string; // alias for type
  title: string;
  description: string;
  badge?: string;
  impact: 'warning' | 'tip' | 'info' | 'positive' | 'high' | 'medium' | 'low';
  actionText?: string;
  actionLabel?: string;
}

export interface ProductFrequency {
  name?: string;
  productName?: string; // alias
  count?: number;
  frequencyCount?: number; // alias
  category: ProductCategory | string;
  totalSpent: number;
  lastPurchased?: string;
  averageIntervalDays?: number;
  warningAlert?: string;
}

export interface HealthSummaryItem {
  productName: string;
  status?: 'healthy' | 'limit' | 'less_healthy';
  healthStatus?: 'healthy' | 'limit' | 'less_healthy'; // alias
  reason?: string;
  nutritionNote?: string; // alias
  frequency: number;
  smartNote?: string;
  healthyAlternative?: string; // alias
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalSpending: number;
  totalReceipts: number;
  totalProducts: number;
  topCategory: ProductCategory;
  mostPurchased: string;
  mostFrequent: string;
  budgetUsedPercent: number;
  healthSummary: string;
  moneyInsight: string;
  categoryBreakdown: { category: ProductCategory; amount: number; percentage: number }[];
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  monthlyBudget: number;
  receiptsCount: number;
  createdAt: string;
}

export interface AdminReceiptRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  shopName: string;
  shopAddress: string;
  date: string;
  amount: number;
  grandTotal: number;
  itemsCount: number;
  items: ReceiptItem[];
  healthSummary?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalReceipts: number;
  totalSpending: number;
  avgSpending: number;
  monthlySpending: { month: string; amount: number }[];
  recentReceipts: {
    id: string;
    userName: string;
    shopName: string;
    date: string;
    amount: number;
  }[];
}

export interface AdminReportsData {
  totalSpending: number;
  totalReceipts: number;
  avgSpending: number;
  spendingByCategory: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  topShops: {
    name: string;
    count: number;
    totalSpent: number;
  }[];
}

// -------------------------------------------------------------
// 💰 SAVINGS GOALS (User-Targeted Financial Saving Engine)
// -------------------------------------------------------------
export interface SavingsDeposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  category?: 'gadgets' | 'vehicle' | 'emergency' | 'education' | 'travel' | 'home' | 'other' | string;
  icon?: string;
  notes?: string;
  deposits?: SavingsDeposit[];
  createdAt: string;
}

// -------------------------------------------------------------
// 🏷️ PRICE TRACKER (Smart Shopping & Price History System)
// -------------------------------------------------------------
export interface PriceHistoryRecord {
  id: string;
  trackerId: string;
  price: number;
  recordedAt: string;
  shopName?: string;
  note?: string;
}

export interface PriceTrackerItem {
  id: string;
  userId: string;
  productName: string;
  category: ProductCategory | string;
  currentPrice: number;
  targetPrice: number;
  shopName?: string;
  productUrl?: string;
  priceHistory: PriceHistoryRecord[];
  createdAt: string;
}

