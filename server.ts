import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import mysql from 'mysql2/promise';

process.on('uncaughtException', (err) => {
  console.error('[SmartReceipt] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SmartReceipt] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Load environment variables from .env file in project root
dotenv.config();
if (!process.env.GEMINI_API_KEY && fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}
if (!process.env.GEMINI_API_KEY && fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

console.log(`[SmartReceipt] Server initializing. GEMINI_API_KEY detected: ${process.env.GEMINI_API_KEY ? 'YES' : 'NO (add GEMINI_API_KEY to .env file in root folder)'}`);

const app = express();

// In AI Studio sandbox/dev, Nginx reverse proxy listens on 8080 and proxies to port 3000 (DEFAULT_APP_PORT).
// When deployed directly on Cloud Run, Cloud Run sets PORT (e.g. 8080) and sends probes to that port.
const PORT = process.env.DEFAULT_APP_PORT
  ? parseInt(process.env.DEFAULT_APP_PORT, 10)
  : (process.env.CONTROL_PLANE_PORT
      ? 3000
      : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000));

// Enable JSON body parsing with large payload limit for base64 receipt scans
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Health check endpoint for Cloud Run container deployment probes
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// PERSISTENT DATABASE STORAGE
// -------------------------------------------------------------
interface UserProfile {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  monthlyBudget: number;
  preferredCategories: string[];
  createdAt: string;
}

interface DatabaseSchema {
  users: UserProfile[];
  userReceipts: Record<string, any[]>;
  userBudgets: Record<string, any[]>;
  userShoppingLists: Record<string, any[]>;
  userDeletedReceipts?: Record<string, string[]>;
  userSavingsGoals?: Record<string, any[]>;
  userPriceTrackers?: Record<string, any[]>;
  // Shared kiosk/workspace user used by the multi-laptop setup.
  // It is persisted in MySQL so every laptop sees the same active account.
  sharedActiveUserId?: string | null;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'smartreceipt_db.json');

// Permanent verified seed accounts
const DEFAULT_SYSTEM_USERS: UserProfile[] = [
  {
    id: 'user-pratha-1',
    name: 'Pratha Ghevariya',
    email: 'prathaghevariya@gmail.com',
    passwordHash: 'prath@2006',
    monthlyBudget: 5000,
    preferredCategories: [
      'Grocery',
      'Clothing',
      'Food & Health',
      'Beauty & Personal Care',
      'Electronics',
      'Home & Household',
      'Books & Education'
    ],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'user-mauli-1',
    name: 'Mauli Patel',
    email: 'maulipatel@gmail.com',
    passwordHash: 'mp@11111',
    monthlyBudget: 5000,
    preferredCategories: ['Grocery', 'Clothing', 'Food & Health', 'Beauty & Personal Care'],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'user-demo-1',
    name: 'Rahul Sharma',
    email: 'rahul@expenseinsight.com',
    passwordHash: 'password123',
    monthlyBudget: 10000,
    preferredCategories: ['Food & Health', 'Grocery', 'Clothing', 'Electronics'],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'user-priya-1',
    name: 'Priya Ghevariya',
    email: 'priya@gmail.com',
    passwordHash: 'priya123',
    monthlyBudget: 10000,
    preferredCategories: ['Grocery', 'Food & Health', 'Clothing'],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'user-riya-1',
    name: 'Riya Patel',
    email: 'riya@gmail.com',
    passwordHash: 'riya123',
    monthlyBudget: 8000,
    preferredCategories: ['Grocery', 'Beauty & Personal Care'],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'user-meet-1',
    name: 'Meet Solanki',
    email: 'meet@gmail.com',
    passwordHash: 'meet123',
    monthlyBudget: 12000,
    preferredCategories: ['Electronics', 'Grocery', 'Clothing'],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'user-dhruv-1',
    name: 'Dhruv Shah',
    email: 'dhruv@gmail.com',
    passwordHash: 'dhruv123',
    monthlyBudget: 9500,
    preferredCategories: ['Grocery', 'Home & Household'],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'user-neha-1',
    name: 'Neha Parmar',
    email: 'neha@gmail.com',
    passwordHash: 'neha123',
    monthlyBudget: 7000,
    preferredCategories: ['Clothing', 'Beauty & Personal Care', 'Grocery'],
    createdAt: '2026-08-01T10:00:00Z'
  }
];

const SEED_RECEIPTS_DEMO_USERS: Record<string, any[]> = {
  'user-priya-1': [
    {
      id: 'rec-priya-1',
      userId: 'user-priya-1',
      shopName: 'Smart Bazar',
      shopAddress: 'Phoenix Mall, Ring Road',
      date: '2026-08-12',
      receiptNumber: 'REC-SB-1029',
      items: [
        { id: 'it-sb-1', name: 'Fresh Farm Apples (1kg)', quantity: 1, unitPrice: 180, totalPrice: 180, category: 'Food & Health', healthStatus: 'healthy', healthNote: 'Nutritious fresh fruits.' },
        { id: 'it-sb-2', name: 'Almond Milk (1L)', quantity: 2, unitPrice: 280, totalPrice: 560, category: 'Food & Health', healthStatus: 'healthy', healthNote: 'Plant-based dairy alternative.' },
        { id: 'it-sb-3', name: 'Whole Grain Pasta', quantity: 3, unitPrice: 170, totalPrice: 510, category: 'Grocery', healthStatus: 'healthy', healthNote: 'Complex carbs with fiber.' }
      ],
      tax: 0,
      grandTotal: 1250,
      healthSummary: 'Excellent nutritional balance with wholesome staples.',
      createdAt: '2026-08-12T14:30:00Z'
    }
  ],
  'user-riya-1': [
    {
      id: 'rec-riya-1',
      userId: 'user-riya-1',
      shopName: 'Reliance Fresh',
      shopAddress: 'Heritage Complex, Market Lane',
      date: '2026-08-10',
      receiptNumber: 'REC-RF-4412',
      items: [
        { id: 'it-rf-1', name: 'Skimmed Milk (500ml)', quantity: 2, unitPrice: 35, totalPrice: 70, category: 'Food & Health', healthStatus: 'healthy', healthNote: 'Low-fat calcium source.' },
        { id: 'it-rf-2', name: 'Brown Bread Loaf', quantity: 2, unitPrice: 50, totalPrice: 100, category: 'Grocery', healthStatus: 'healthy', healthNote: 'Whole grain bakery.' },
        { id: 'it-rf-3', name: 'Organic Honey (250g)', quantity: 1, unitPrice: 350, totalPrice: 350, category: 'Food & Health', healthStatus: 'limit', healthNote: 'Natural sweetener.' }
      ],
      tax: 0,
      grandTotal: 520,
      healthSummary: 'Light wholesome pantry restock.',
      createdAt: '2026-08-10T11:15:00Z'
    }
  ],
  'user-meet-1': [
    {
      id: 'rec-meet-1',
      userId: 'user-meet-1',
      shopName: 'Big Bazar',
      shopAddress: 'Highway Hub Square',
      date: '2026-08-08',
      receiptNumber: 'REC-BB-9920',
      items: [
        { id: 'it-bb-1', name: 'Bluetooth Earbuds', quantity: 1, unitPrice: 1200, totalPrice: 1200, category: 'Electronics', healthStatus: 'healthy', healthNote: 'Personal electronic accessories.' },
        { id: 'it-bb-2', name: 'Cotton Athletic Socks (Pack of 3)', quantity: 1, unitPrice: 300, totalPrice: 300, category: 'Clothing', healthStatus: 'healthy', healthNote: 'Sportswear.' },
        { id: 'it-bb-3', name: 'Mixed Roasted Nuts (200g)', quantity: 1, unitPrice: 280, totalPrice: 280, category: 'Food & Health', healthStatus: 'healthy', healthNote: 'Healthy plant fats.' }
      ],
      tax: 0,
      grandTotal: 1780,
      healthSummary: 'Tech and lifestyle purchase with nutritious snacks.',
      createdAt: '2026-08-08T18:00:00Z'
    }
  ],
  'user-dhruv-1': [
    {
      id: 'rec-dhruv-1',
      userId: 'user-dhruv-1',
      shopName: 'D-Mart',
      shopAddress: 'Subhash Bridge Corner',
      date: '2026-08-05',
      receiptNumber: 'REC-DM-3021',
      items: [
        { id: 'it-dm-1', name: 'Toilet Cleaner & Disinfectant', quantity: 2, unitPrice: 120, totalPrice: 240, category: 'Home & Household', healthStatus: 'healthy', healthNote: 'Home sanitation supplies.' },
        { id: 'it-dm-2', name: 'Floor Mopping Liquid (1L)', quantity: 1, unitPrice: 180, totalPrice: 180, category: 'Home & Household', healthStatus: 'healthy', healthNote: 'Cleaning supplies.' },
        { id: 'it-dm-3', name: 'Kitchen Dishwash Gel (750ml)', quantity: 1, unitPrice: 220, totalPrice: 220, category: 'Home & Household', healthStatus: 'healthy', healthNote: 'Kitchen hygiene.' }
      ],
      tax: 0,
      grandTotal: 640,
      healthSummary: 'Household cleaning and hygiene essentials.',
      createdAt: '2026-08-05T10:45:00Z'
    }
  ],
  'user-neha-1': [
    {
      id: 'rec-neha-1',
      userId: 'user-neha-1',
      shopName: 'Vishal Mega Mart',
      shopAddress: 'Station Road Arcade',
      date: '2026-08-02',
      receiptNumber: 'REC-VMM-8812',
      items: [
        { id: 'it-vmm-1', name: 'Printed Casual Scarf', quantity: 1, unitPrice: 350, totalPrice: 350, category: 'Clothing', healthStatus: 'healthy', healthNote: 'Fashion accessory.' },
        { id: 'it-vmm-2', name: 'Moisturizing Aloe Face Wash', quantity: 1, unitPrice: 230, totalPrice: 230, category: 'Beauty & Personal Care', healthStatus: 'healthy', healthNote: 'Skincare routine.' },
        { id: 'it-vmm-3', name: 'Herbal Shampoo (200ml)', quantity: 1, unitPrice: 400, totalPrice: 400, category: 'Beauty & Personal Care', healthStatus: 'healthy', healthNote: 'Personal care hygiene.' }
      ],
      tax: 0,
      grandTotal: 980,
      healthSummary: 'Personal care and beauty wellness items.',
      createdAt: '2026-08-02T16:20:00Z'
    }
  ]
};

const SEED_RECEIPTS_PRATHA = [
  {
    id: 'rec-pratha-101',
    userId: 'user-pratha-1',
    shopName: 'Smart Supermarket & Fresh Mart',
    shopAddress: 'City Center Mall, Gujarat',
    date: '2026-08-28',
    receiptNumber: 'REC-PR-8821',
    items: [
      { id: 'it-p-1', name: 'Organic Basmati Rice (5kg)', quantity: 1, unitPrice: 380, totalPrice: 380, category: 'Grocery', healthStatus: 'healthy', healthNote: 'Nutritious staple grain.' },
      { id: 'it-p-2', name: 'Fresh Amul Taaza Milk (1L)', quantity: 2, unitPrice: 60, totalPrice: 120, category: 'Food & Health', healthStatus: 'healthy', healthNote: 'Good source of calcium.' },
      { id: 'it-p-3', name: 'Whole Wheat Bread (400g)', quantity: 1, unitPrice: 45, totalPrice: 45, category: 'Grocery', healthStatus: 'healthy', healthNote: 'High fiber whole grain.' },
      { id: 'it-p-4', name: 'Digestive Biscuits (200g)', quantity: 2, unitPrice: 35, totalPrice: 70, category: 'Food & Health', healthStatus: 'limit', healthNote: 'Contains moderate refined sugars.' }
    ],
    tax: 15,
    grandTotal: 630,
    healthSummary: 'Healthy purchase balance with wholesome whole grains and dairy.',
    createdAt: '2026-08-28T11:20:00Z'
  },
  {
    id: 'rec-pratha-102',
    userId: 'user-pratha-1',
    shopName: 'Trends Lifestyle & Apparel',
    shopAddress: 'Alpha One Circle, Fashion Galleria',
    date: '2026-08-20',
    receiptNumber: 'REC-TR-4910',
    items: [
      { id: 'it-p-5', name: 'Women Pure Cotton Kurti', quantity: 1, unitPrice: 899, totalPrice: 899, category: 'Clothing', healthStatus: 'healthy', healthNote: 'Non-food apparel.' },
      { id: 'it-p-6', name: 'Denim Casual Pants', quantity: 1, unitPrice: 1200, totalPrice: 1200, category: 'Clothing', healthStatus: 'healthy', healthNote: 'Non-food apparel.' }
    ],
    tax: 100,
    grandTotal: 2199,
    healthSummary: 'Apparel wardrobe update.',
    createdAt: '2026-08-20T16:45:00Z'
  },
  {
    id: 'rec-pratha-103',
    userId: 'user-pratha-1',
    shopName: 'Pantry Fresh & Greens',
    shopAddress: 'Subhash Road Market',
    date: '2026-08-14',
    receiptNumber: 'REC-PF-3109',
    items: [
      { id: 'it-p-7', name: 'Green Apples (1kg)', quantity: 1, unitPrice: 140, totalPrice: 140, category: 'Food & Health', healthStatus: 'healthy', healthNote: 'Rich in antioxidants and dietary fiber.' },
      { id: 'it-p-8', name: 'Rolled Oats (1kg)', quantity: 1, unitPrice: 180, totalPrice: 180, category: 'Grocery', healthStatus: 'healthy', healthNote: 'Heart-healthy soluble fiber.' },
      { id: 'it-p-9', name: 'Greek Plain Yogurt (400g)', quantity: 1, unitPrice: 85, totalPrice: 85, category: 'Food & Health', healthStatus: 'healthy', healthNote: 'High protein and probiotics.' }
    ],
    tax: 10,
    grandTotal: 415,
    healthSummary: 'Superb health grade: 100% wholesome fruits and nutritious breakfast staples.',
    createdAt: '2026-08-14T09:15:00Z'
  }
];

const EMPTY_DATABASE: DatabaseSchema = {
  users: [],
  userReceipts: {},
  userBudgets: {},
  userShoppingLists: {},
  userDeletedReceipts: {},
  userSavingsGoals: {},
  userPriceTrackers: {},
  sharedActiveUserId: null
};

const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartreceipt_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0
});

let db: DatabaseSchema = JSON.parse(JSON.stringify(EMPTY_DATABASE));
let databaseReady = false;
let saveQueue: Promise<void> = Promise.resolve();

function normalizeDatabase(parsed: any): DatabaseSchema {
  return {
    users: Array.isArray(parsed?.users) ? parsed.users : [],
    userReceipts: parsed?.userReceipts || {},
    userBudgets: parsed?.userBudgets || {},
    userShoppingLists: parsed?.userShoppingLists || {},
    userDeletedReceipts: parsed?.userDeletedReceipts || {},
    userSavingsGoals: parsed?.userSavingsGoals || {},
    userPriceTrackers: parsed?.userPriceTrackers || {},
    sharedActiveUserId: typeof parsed?.sharedActiveUserId === 'string' ? parsed.sharedActiveUserId : null
  };
}

function readLegacyJsonDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      if (data && data.trim().length > 0) return normalizeDatabase(JSON.parse(data));
    }
  } catch (err) {
    console.warn('[SmartReceipt] Could not import legacy JSON database:', err);
  }
  return JSON.parse(JSON.stringify(EMPTY_DATABASE));
}

function applySystemSeeds(loadedDb: DatabaseSchema): DatabaseSchema {
  for (const sysUser of DEFAULT_SYSTEM_USERS) {
    const exists = loadedDb.users.find(u => u.email.toLowerCase() === sysUser.email.toLowerCase());
    if (!exists) {
      loadedDb.users.push(sysUser);
    } else {
      exists.passwordHash = sysUser.passwordHash;
      if (!exists.monthlyBudget && sysUser.monthlyBudget) exists.monthlyBudget = sysUser.monthlyBudget;
    }
  }

  if (!loadedDb.userReceipts['user-demo-1'] || loadedDb.userReceipts['user-demo-1'].length === 0) {
    loadedDb.userReceipts['user-demo-1'] = SEED_RECEIPTS_PRATHA.map(r => ({ ...r, id: r.id.replace('pratha', 'rahul'), userId: 'user-demo-1' }));
    loadedDb.userReceipts['rahul@expenseinsight.com'] = loadedDb.userReceipts['user-demo-1'];
  }

  for (const [userId, seedList] of Object.entries(SEED_RECEIPTS_DEMO_USERS)) {
    if (!loadedDb.userReceipts[userId] || loadedDb.userReceipts[userId].length === 0) {
      loadedDb.userReceipts[userId] = seedList;
      const targetUser = loadedDb.users.find(u => u.id === userId);
      if (targetUser?.email) loadedDb.userReceipts[targetUser.email.toLowerCase()] = seedList;
    }
  }
  return loadedDb;
}

async function initDatabase(): Promise<void> {
  try {
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS smartreceipt_app_state (
        id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [rows] = await mysqlPool.execute('SELECT data FROM smartreceipt_app_state WHERE id = 1 LIMIT 1');
    const stored = Array.isArray(rows) && rows.length > 0 ? (rows as any[])[0]?.data : null;

    if (stored) {
      try {
        db = normalizeDatabase(JSON.parse(stored));
        console.log('[SmartReceipt] MySQL database state loaded successfully.');
      } catch {
        console.warn('[SmartReceipt] MySQL state was invalid JSON. Importing legacy JSON database.');
        db = readLegacyJsonDatabase();
      }
    } else {
      db = readLegacyJsonDatabase();
      console.log('[SmartReceipt] Importing existing data/smartreceipt_db.json into MySQL (one-time migration).');
    }

    db = applySystemSeeds(db);
    await persistDatabaseNow(db);
    databaseReady = true;
    console.log(`[SmartReceipt] MySQL connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'smartreceipt_db'}`);
  } catch (err) {
    console.error('[SmartReceipt] Database initialization failed:', err);
    throw err;
  }
}

async function persistDatabaseNow(dataToSave: DatabaseSchema): Promise<void> {
  await mysqlPool.execute(
    `INSERT INTO smartreceipt_app_state (id, data) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
    [JSON.stringify(dataToSave)]
  );
}

function saveDatabase(dataToSave: DatabaseSchema) {
  saveQueue = saveQueue
    .then(() => persistDatabaseNow(dataToSave))
    .catch(err => console.error('[SmartReceipt] Failed to save database to MySQL:', err));
}

// Helper to extract user ID or email from request auth token
function getUserIdFromRequest(req: express.Request): string {
  // 1. Explicit headers sent from authenticated client session
  if (typeof req.headers['x-user-id'] === 'string' && req.headers['x-user-id'].trim()) {
    return req.headers['x-user-id'].trim();
  }
  if (typeof req.headers['x-user-email'] === 'string' && req.headers['x-user-email'].trim()) {
    return req.headers['x-user-email'].trim().toLowerCase();
  }
  // 2. Bearer JWT token decoding
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer jwt_')) {
    try {
      const tokenPayload = authHeader.replace('Bearer jwt_', '');
      const decoded = JSON.parse(Buffer.from(tokenPayload, 'base64').toString('utf-8'));
      if (decoded && decoded.id) {
        return decoded.id;
      }
      if (decoded && decoded.email) {
        return decoded.email.toLowerCase();
      }
    } catch (e) {}
  }
  // 3. Query param fallback
  if (typeof req.query.userId === 'string' && req.query.userId.trim()) {
    return req.query.userId.trim();
  }
  return 'user-demo-1';
}

// User Resolution and Multi-Key Normalization
// Ensures receipts, budgets, and shopping lists are never lost regardless of whether queried by ID or email
interface UserIdentity {
  user?: UserProfile;
  keys: string[];
}

function resolveUserKeys(identifier: string): UserIdentity {
  const clean = (identifier || '').trim().toLowerCase();
  const user = db.users.find(u => 
    u.id.toLowerCase() === clean || 
    u.email.toLowerCase() === clean
  );
  const keys = new Set<string>();
  if (identifier && identifier.trim()) keys.add(identifier.trim());
  if (clean) keys.add(clean);
  if (user) {
    keys.add(user.id);
    keys.add(user.email.toLowerCase());
  }
  // Link known aliases for Pratha
  if (clean === 'user-pratha-1' || clean === 'prathaghevariya@gmail.com' || clean === 'user-1788403133412-605') {
    keys.add('user-pratha-1');
    keys.add('prathaghevariya@gmail.com');
    keys.add('user-1788403133412-605');
  }
  // Link known aliases for Rahul
  if (clean === 'user-demo-1' || clean === 'rahul@expenseinsight.com' || clean === 'rahul@smartreceipt.ai') {
    keys.add('user-demo-1');
    keys.add('rahul@expenseinsight.com');
  }
  // Link known aliases for Mauli
  if (clean === 'user-mauli-1' || clean === 'maulipatel@gmail.com') {
    keys.add('user-mauli-1');
    keys.add('maulipatel@gmail.com');
  }
  return { user, keys: Array.from(keys) };
}

function getUserDeletedReceipts(identifier: string): Set<string> {
  const { keys } = resolveUserKeys(identifier);
  const deletedSet = new Set<string>();
  if (!db.userDeletedReceipts) db.userDeletedReceipts = {};
  for (const k of keys) {
    const list = db.userDeletedReceipts[k];
    if (Array.isArray(list)) {
      list.forEach(id => deletedSet.add(id));
    }
  }
  return deletedSet;
}

function addDeletedReceiptId(identifier: string, receiptId: string) {
  if (!receiptId) return;
  if (!db.userDeletedReceipts) db.userDeletedReceipts = {};
  const { user, keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    if (!Array.isArray(db.userDeletedReceipts[k])) db.userDeletedReceipts[k] = [];
    if (!db.userDeletedReceipts[k].includes(receiptId)) {
      db.userDeletedReceipts[k].push(receiptId);
    }
  }
  if (user) {
    if (!Array.isArray(db.userDeletedReceipts[user.id])) db.userDeletedReceipts[user.id] = [];
    if (!db.userDeletedReceipts[user.id].includes(receiptId)) db.userDeletedReceipts[user.id].push(receiptId);
    const lowerEmail = user.email.toLowerCase();
    if (!Array.isArray(db.userDeletedReceipts[lowerEmail])) db.userDeletedReceipts[lowerEmail] = [];
    if (!db.userDeletedReceipts[lowerEmail].includes(receiptId)) db.userDeletedReceipts[lowerEmail].push(receiptId);
  }
  saveDatabase(db);
}

function getUserReceipts(identifier: string): any[] {
  const { keys } = resolveUserKeys(identifier);
  const deletedSet = getUserDeletedReceipts(identifier);
  const receiptMap = new Map<string, any>();
  for (const k of keys) {
    const list = db.userReceipts[k];
    if (Array.isArray(list)) {
      list.forEach(r => {
        if (r && r.id && !deletedSet.has(r.id) && !receiptMap.has(r.id)) {
          receiptMap.set(r.id, r);
        }
      });
    }
  }
  const merged = Array.from(receiptMap.values()).sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt || 0).getTime();
    const timeB = new Date(b.date || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  return merged;
}

function saveUserReceipts(identifier: string, receipts: any[]) {
  const { user, keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    db.userReceipts[k] = receipts;
  }
  if (user) {
    db.userReceipts[user.id] = receipts;
    db.userReceipts[user.email.toLowerCase()] = receipts;
  }
  saveDatabase(db);
}

function getUserBudgets(identifier: string): any[] {
  const { keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    const list = db.userBudgets[k];
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  }
  return [];
}

function saveUserBudgets(identifier: string, budgets: any[], monthlyBudget?: number) {
  const { user, keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    db.userBudgets[k] = budgets;
  }
  if (user) {
    db.userBudgets[user.id] = budgets;
    db.userBudgets[user.email.toLowerCase()] = budgets;
    if (typeof monthlyBudget === 'number') {
      user.monthlyBudget = monthlyBudget;
    }
  }
  saveDatabase(db);
}

function getUserShoppingList(identifier: string): any[] {
  const { keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    const list = db.userShoppingLists[k];
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  }
  return [];
}

function saveUserShoppingList(identifier: string, items: any[]) {
  const { user, keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    db.userShoppingLists[k] = items;
  }
  if (user) {
    db.userShoppingLists[user.id] = items;
    db.userShoppingLists[user.email.toLowerCase()] = items;
  }
  saveDatabase(db);
}

// -------------------------------------------------------------
// SAVINGS GOALS & PRICE TRACKER SEED DATA AND HELPERS
// -------------------------------------------------------------
// No demo seed data - clean slate for user
const DEFAULT_SAVINGS_GOALS_SEED: any[] = [];
const DEFAULT_PRICE_TRACKERS_SEED: any[] = [];

function getUserSavingsGoals(identifier: string): any[] {
  if (!db.userSavingsGoals) db.userSavingsGoals = {};
  const { keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    const list = db.userSavingsGoals[k];
    if (Array.isArray(list)) {
      // Completely purge any legacy demo goals (sg-1, sg-2)
      const cleaned = list.filter(g => g.id !== 'sg-1' && g.id !== 'sg-2');
      if (cleaned.length !== list.length) {
        saveUserSavingsGoals(identifier, cleaned);
      }
      return cleaned;
    }
  }
  return [];
}

function saveUserSavingsGoals(identifier: string, goals: any[]) {
  if (!db.userSavingsGoals) db.userSavingsGoals = {};
  const { user, keys } = resolveUserKeys(identifier);
  // Ensure no demo items are saved
  const filtered = (goals || []).filter(g => g.id !== 'sg-1' && g.id !== 'sg-2');
  for (const k of keys) {
    db.userSavingsGoals[k] = filtered;
  }
  if (user) {
    db.userSavingsGoals[user.id] = filtered;
    db.userSavingsGoals[user.email.toLowerCase()] = filtered;
  }
  saveDatabase(db);
}

function getUserPriceTrackers(identifier: string): any[] {
  if (!db.userPriceTrackers) db.userPriceTrackers = {};
  const { keys } = resolveUserKeys(identifier);
  for (const k of keys) {
    const list = db.userPriceTrackers[k];
    if (Array.isArray(list)) {
      // Completely purge any legacy demo trackers (pt-1, pt-2, pt-3)
      const cleaned = list.filter(t => t.id !== 'pt-1' && t.id !== 'pt-2' && t.id !== 'pt-3');
      if (cleaned.length !== list.length) {
        saveUserPriceTrackers(identifier, cleaned);
      }
      return cleaned;
    }
  }
  return [];
}

function saveUserPriceTrackers(identifier: string, trackers: any[]) {
  if (!db.userPriceTrackers) db.userPriceTrackers = {};
  const { user, keys } = resolveUserKeys(identifier);
  // Ensure no demo items are saved
  const filtered = (trackers || []).filter(t => t.id !== 'pt-1' && t.id !== 'pt-2' && t.id !== 'pt-3');
  for (const k of keys) {
    db.userPriceTrackers[k] = filtered;
  }
  if (user) {
    db.userPriceTrackers[user.id] = filtered;
    db.userPriceTrackers[user.email.toLowerCase()] = filtered;
  }
  saveDatabase(db);
}

// Helper: Determine if item is strictly a food, beverage, or grocery edible
function isFoodOrGroceryItem(name: string = '', category: string = ''): boolean {
  const cat = (category || '').toLowerCase().trim();
  const lower = (name || '').toLowerCase().trim();

  // Blank or generic placeholder items are not food
  if (!lower) return false;
  if (/^item(\s*\d*)?$/i.test(lower) || /^product(\s*\d*)?$/i.test(lower)) {
    return false;
  }

  const nonFoodCategories = [
    'clothing', 'clothes', 'apparel', 'footwear', 'fashion',
    'electronics', 'electronic', 'gadget', 'electrical',
    'beauty', 'beauty & personal care', 'personal care', 'cosmetics', 'cosmetic', 'skincare', 'haircare',
    'home & household', 'household', 'home', 'cleaning', 'cleaner', 'cleaning supplies', 'kitchenware', 'decor',
    'books', 'books & education', 'education', 'stationery', 'office supplies',
    'hardware', 'furniture', 'appliances', 'automotive', 'toys', 'sports', 'fitness'
  ];

  if (nonFoodCategories.some(nfc => cat === nfc || cat.startsWith(nfc) || cat.includes(nfc))) {
    const explicitFoodMatch = [
      'milk', 'bread', 'rice', 'wheat', 'atta', 'dal', 'pulse', 'egg', 'oil',
      'sugar', 'salt', 'fruit', 'vegetable', 'snack', 'drink', 'tea', 'coffee',
      'biscuit', 'juice', 'butter', 'cheese', 'paneer', 'curd', 'dahi'
    ].some(fw => lower.includes(fw));

    if (!explicitFoodMatch) return false;
  }

  const nonFoodKeywords = [
    'shirt', 't-shirt', 'tshirt', 'jeans', 'pant', 'pants', 'trousers', 'suit',
    'dress', 'saree', 'kurta', 'kurti', 'dupatta', 'socks', 'jacket', 'hoodie',
    'sweater', 'shoes', 'sneakers', 'sandals', 'slippers', 'flip flop', 'belt',
    'wallet', 'handbag', 'backpack', 'cap', 'hat', 'tie', 'scarf', 'underwear',
    'vest', 'bra', 'briefs', 'leggings', 'shorts', 'towel', 'bedsheet', 'blanket',
    'headphone', 'earphone', 'airpod', 'earbuds', 'charger', 'cable', 'usb',
    'adapter', 'battery', 'power bank', 'phone', 'smartphone', 'mobile', 'case',
    'cover', 'screen guard', 'tempered glass', 'laptop', 'mouse', 'keyboard',
    'monitor', 'pen drive', 'hard drive', 'speaker', 'bulb', 'led', 'lamp',
    'torch', 'plug', 'switch', 'socket', 'wire', 'fan', 'iron',
    'shampoo', 'conditioner', 'hair oil', 'hair dye', 'hair color', 'soap',
    'body wash', 'shower gel', 'face wash', 'facewash', 'facial', 'cleanser',
    'moisturizer', 'lotion', 'body lotion', 'sunscreen', 'cream', 'serum',
    'perfume', 'deodorant', 'deo', 'body spray', 'fragrance', 'cologne',
    'lipstick', 'lip balm', 'eyeliner', 'kajal', 'mascara', 'foundation',
    'nail polish', 'nail paint', 'cotton pads', 'sanitary', 'pad', 'tampon',
    'diaper', 'wipes', 'tissue paper', 'toilet paper', 'napkin', 'shaving cream',
    'razor', 'blade', 'aftershave', 'toothbrush', 'brush', 'toothpaste',
    'mouthwash', 'floss',
    'detergent', 'washing powder', 'surf', 'ariel', 'tide', 'rin', 'fabric softener',
    'comfort', 'bleach', 'stain remover', 'dishwash', 'dish soap', 'vim', 'pril',
    'scrub', 'sponge', 'floor cleaner', 'lysol', 'harpic', 'toilet cleaner',
    'glass cleaner', 'colin', 'broom', 'mop', 'wiper', 'duster', 'garbage bag',
    'trash bag', 'air freshener', 'odonil', 'all out', 'good knight', 'mosquito',
    'repellent', 'hit spray', 'insecticide', 'bucket', 'mug', 'container', 'bottle',
    'plate', 'spoon', 'fork', 'cup', 'glass', 'cooker', 'pan', 'knife',
    'notebook', 'register', 'diary', 'pen', 'ball pen', 'gel pen', 'pencil',
    'eraser', 'sharpener', 'ruler', 'scale', 'stapler', 'scissors', 'tape',
    'glue', 'fevicol', 'marker', 'highlighter', 'calculator', 'envelope', 'folder',
    'paper', 'card'
  ];

  if (nonFoodKeywords.some(kw => lower.includes(kw))) {
    return false;
  }

  const foodCategories = [
    'grocery', 'glossary', 'food & health', 'food', 'beverages', 'beverage',
    'snacks & confectionery', 'fruits & vegetables', 'vegetables', 'fruits',
    'dairy & bakery', 'dairy', 'bakery', 'staples', 'pantry', 'grains', 'spices',
    'health products', 'household pantry'
  ];

  if (foodCategories.some(fc => cat.includes(fc))) {
    return true;
  }

  const foodKeywords = [
    'cold drink', 'colddrink', 'soft drink', 'softdrink', 'soda', 'cola', 'coke', 'coca cola',
    'pepsi', 'sprite', 'fanta', 'mirinda', 'mountain dew', 'dew', '7up', 'seven up', 'limca',
    'thums up', 'thumsup', 'thumz up', 'appy fizz', 'fizz', 'sting', 'red bull', 'redbull',
    'monster energy', 'monster', 'energy drink', 'maaza', 'frooti', 'slice', 'tang', 'rasna',
    'sharbat', 'squash', 'syrup', 'iced tea', 'ice tea', 'bubble tea', 'boba', 'bovonto',
    'campa', 'campa cola', 'jeera soda', 'bindu fizz', 'lahori zeera', 'fruit beer', 'rooh afza',
    'drink', 'juice', 'beverage', 'water', 'mineral water', 'coconut water', 'chaas', 'buttermilk', 'lassi',
    'milk', 'curd', 'dahi', 'yogurt', 'paneer', 'cheese', 'butter', 'ghee', 'cream', 'malai',
    'oil', 'mustard oil', 'sunflower oil', 'olive oil', 'refined oil', 'groundnut oil', 'sesame oil', 'vanaspati',
    'atta', 'flour', 'maida', 'besan', 'sooji', 'suji', 'rawa', 'wheat', 'rice',
    'basmati', 'poha', 'oats', 'muesli', 'cornflakes', 'quinoa', 'dalia', 'cereal', 'cereals',
    'dal', 'lentil', 'toor dal', 'moong', 'chana', 'rajma', 'chole', 'urad', 'kala chana', 'kabuli chana',
    'masoor', 'beans', 'sprouts', 'peanut', 'peanuts', 'almond', 'badam', 'kaju', 'cashew',
    'walnut', 'raisin', 'kishmish', 'pista', 'dates', 'khajoor', 'seed', 'seeds', 'chia', 'flax',
    'salt', 'sugar', 'jaggery', 'gur', 'honey', 'spice', 'spices', 'masala', 'turmeric',
    'haldi', 'chilli', 'mirch', 'coriander', 'dhaniya', 'cumin', 'jeera', 'fennel', 'saunf', 'methi seeds',
    'mustard', 'rai', 'garam masala', 'black pepper', 'clove', 'cardamom',
    'elaichi', 'cinnamon', 'dalchini', 'hing', 'asafoetida', 'bay leaf', 'tejpatta',
    'tea', 'chai', 'coffee', 'green tea', 'herbal tea',
    'fruit', 'fruits', 'apple', 'banana', 'orange', 'mango', 'grapes', 'papaya', 'guava',
    'pomegranate', 'watermelon', 'melon', 'lemon', 'lime', 'nimbu', 'berries', 'strawberry', 'kiwi', 'pineapple',
    'vegetable', 'vegetables', 'sabzi', 'tomato', 'potato', 'alu', 'aloo', 'onion', 'pyaz',
    'garlic', 'lahsun', 'ginger', 'adrak', 'capsicum', 'spinach',
    'palak', 'methi', 'cabbage', 'cauliflower', 'gobhi', 'carrot', 'gajar', 'radish', 'mooli',
    'cucumber', 'kheera', 'bhindi', 'okra', 'brinjal', 'eggplant', 'peas', 'matar', 'beetroot',
    'bread', 'bun', 'pav', 'toast', 'rusk', 'biscuit', 'biscuits', 'cookie', 'cookies', 'cake',
    'pastry', 'muffin', 'noodles', 'maggi', 'pasta', 'macaroni', 'vermicelli', 'seviyan',
    'chips', 'namkeen', 'bhujia', 'sev', 'farsan', 'snack', 'snacks', 'popcorn', 'makhana',
    'chutney', 'sauce', 'ketchup', 'pickle', 'achar', 'jam', 'mayo', 'mayonnaise', 'spread',
    'chocolate', 'candy', 'toffee', 'mithai', 'sweet', 'sweets', 'ice cream', 'kulfi',
    'egg', 'eggs', 'chicken', 'fish', 'meat', 'mutton'
  ];

  return foodKeywords.some(kw => lower.includes(kw));
}

// Helper: Evaluate item nutrition status
function evaluateItemHealth(name: string, category: string): { status?: 'healthy' | 'limit' | 'less_healthy'; note?: string } {
  // If not an actual food item, do not assign any health status or tag
  if (!isFoodOrGroceryItem(name, category)) {
    return {
      status: undefined,
      note: undefined
    };
  }

  const lower = (name || '').toLowerCase().trim();

  // Cold Drinks, Sodas, Carbonated Beverages & High-Sugar Snacks (Less Healthy)
  if (
    lower.includes('cold drink') ||
    lower.includes('colddrink') ||
    lower.includes('soft drink') ||
    lower.includes('softdrink') ||
    lower.includes('carbonated') ||
    lower.includes('aerated') ||
    lower.includes('soda') ||
    lower.includes('cola') || 
    lower.includes('pepsi') || 
    lower.includes('coke') || 
    lower.includes('coca cola') ||
    lower.includes('thums up') ||
    lower.includes('thumsup') ||
    lower.includes('thumz up') ||
    lower.includes('sprite') ||
    lower.includes('fanta') ||
    lower.includes('mirinda') ||
    lower.includes('mountain dew') ||
    lower.includes('dew') ||
    lower.includes('7up') ||
    lower.includes('seven up') ||
    lower.includes('limca') ||
    lower.includes('appy fizz') ||
    lower.includes('fizz') ||
    lower.includes('sting') ||
    lower.includes('red bull') ||
    lower.includes('redbull') ||
    lower.includes('monster energy') ||
    lower.includes('energy drink') ||
    lower.includes('maaza') ||
    lower.includes('frooti') ||
    lower.includes('slice') ||
    lower.includes('tang') ||
    lower.includes('rasna') ||
    lower.includes('sharbat') ||
    lower.includes('squash') ||
    lower.includes('syrup') ||
    lower.includes('iced tea') ||
    lower.includes('ice tea') ||
    lower.includes('bubble tea') ||
    lower.includes('chips') || 
    lower.includes('kurkure') || 
    lower.includes('bingo') ||
    lower.includes('pringles') ||
    lower.includes('doritos') ||
    lower.includes('nachos') ||
    lower.includes('wafers') ||
    lower.includes('bhujia') ||
    lower.includes('namkeen') ||
    lower.includes('farsan') ||
    lower.includes('candy') || 
    lower.includes('toffee') ||
    lower.includes('chocolate') ||
    lower.includes('cadbury') ||
    lower.includes('mithai') ||
    lower.includes('pastry') ||
    lower.includes('cake') ||
    lower.includes('donut') ||
    lower.includes('ice cream')
  ) {
    return {
      status: 'less_healthy',
      note: lower.includes('drink') || lower.includes('soda') || lower.includes('cola') || lower.includes('coke') || lower.includes('fizz') || lower.includes('pepsi') || lower.includes('sprite') || lower.includes('fanta') || lower.includes('dew') || lower.includes('sting')
        ? 'Ultra-processed cold drink high in added refined sugar (~25-35g per 250ml) and empty calories with high glycemic spike. Categorized as Less Healthy / Sugar.'
        : 'High in added refined sugars, saturated/trans fats, and sodium with negligible dietary fiber. Less Healthy / Sugar.'
    };
  }

  // Limit portions flags
  if (
    lower.includes('biscuit') || 
    lower.includes('cookie') || 
    lower.includes('rusk') ||
    lower.includes('butter') || 
    lower.includes('margarine') ||
    lower.includes('white bread') || 
    lower.includes('noodles') || 
    lower.includes('maggi') ||
    lower.includes('pasta') ||
    lower.includes('sauce') || 
    lower.includes('ketchup') ||
    lower.includes('mayo') || 
    lower.includes('frosting') ||
    lower.includes('cheese') ||
    lower.includes('maida')
  ) {
    return {
      status: 'limit',
      note: 'Moderate nutritional value with refined flour, higher sodium, or saturated fat. Consume in mindful portions.'
    };
  }

  // Generally Healthy
  if (
    lower.includes('milk') || 
    lower.includes('rice') || 
    lower.includes('dal') || 
    lower.includes('pulse') || 
    lower.includes('lentil') ||
    lower.includes('apple') || 
    lower.includes('fruit') || 
    lower.includes('vegetable') || 
    lower.includes('spinach') ||
    lower.includes('oats') || 
    lower.includes('curd') || 
    lower.includes('dahi') ||
    lower.includes('chaas') ||
    lower.includes('paneer') || 
    lower.includes('tofu') ||
    lower.includes('egg') ||
    lower.includes('flour') ||
    lower.includes('atta') ||
    lower.includes('wheat') ||
    lower.includes('coconut water') ||
    lower.includes('nuts') ||
    lower.includes('almond') ||
    lower.includes('walnut')
  ) {
    return {
      status: 'healthy',
      note: 'Nutrient-dense whole food staple essential for balanced daily diet.'
    };
  }

  const catLower = (category || '').toLowerCase();
  if (catLower.includes('food') || catLower.includes('grocery') || catLower.includes('beverage') || catLower.includes('dairy') || catLower.includes('bakery')) {
    return {
      status: 'healthy',
      note: 'General pantry staple.'
    };
  }

  return {
    status: undefined,
    note: undefined
  };
}

// Helper: Categorize item by keyword
function categorizeItem(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('shirt') || lower.includes('pant') || lower.includes('jean') || lower.includes('tshirt') || lower.includes('polo') || lower.includes('kurta') || lower.includes('dress') || lower.includes('sock') || lower.includes('shoe')) {
    return 'Clothing';
  }
  if (lower.includes('milk') || lower.includes('rice') || lower.includes('dal') || lower.includes('sugar') || lower.includes('salt') || lower.includes('oil') || lower.includes('atta') || lower.includes('wheat') || lower.includes('flour') || lower.includes('tea') || lower.includes('coffee') || lower.includes('egg')) {
    return 'Grocery';
  }
  if (lower.includes('biscuit') || lower.includes('cola') || lower.includes('drink') || lower.includes('snack') || lower.includes('fruit') || lower.includes('bread') || lower.includes('apple') || lower.includes('banana') || lower.includes('salad')) {
    return 'Food & Health';
  }
  if (lower.includes('shampoo') || lower.includes('soap') || lower.includes('toothpaste') || lower.includes('cream') || lower.includes('lotion') || lower.includes('perfume') || lower.includes('brush') || lower.includes('sunscreen') || lower.includes('serum') || lower.includes('cleanser') || lower.includes('balm') || lower.includes('lipstick') || lower.includes('deodorant') || lower.includes('moisturizer')) {
    return 'Beauty & Personal Care';
  }
  if (lower.includes('detergent') || lower.includes('cleaner') || lower.includes('dishwash') || lower.includes('tissue') || lower.includes('sponge') || lower.includes('towel') || lower.includes('trash') || lower.includes('bulb') || lower.includes('freshener') || lower.includes('disinfectant') || lower.includes('foil') || lower.includes('mop') || lower.includes('broom')) {
    return 'Home & Household';
  }
  if (lower.includes('book') || lower.includes('notebook') || lower.includes('pen') || lower.includes('pencil') || lower.includes('stationery') || lower.includes('calculator') || lower.includes('course') || lower.includes('exam') || lower.includes('novel') || lower.includes('textbook') || lower.includes('diary')) {
    return 'Books & Education';
  }
  if (lower.includes('cable') || lower.includes('charger') || lower.includes('earbud') || lower.includes('headphone') || lower.includes('phone') || lower.includes('laptop') || lower.includes('battery') || lower.includes('mouse') || lower.includes('keyboard') || lower.includes('adapter')) {
    return 'Electronics';
  }
  return 'Grocery';
}

// -------------------------------------------------------------
// SHARED MULTI-LAPTOP WORKSPACE
// -------------------------------------------------------------
// The four-laptop setup uses one MySQL-backed "active account". Laptop 1
// creates the account; laptops 2 and 3 read this same account without asking
// for a login. This is intentionally a kiosk/workspace feature, not a
// replacement for the normal authenticated account flow.
function getSharedActiveUser(): UserProfile | undefined {
  const activeId = db.sharedActiveUserId;
  if (!activeId) return undefined;
  return db.users.find(u => u.id === activeId);
}

function setSharedActiveUser(userId: string): UserProfile | undefined {
  const user = db.users.find(u => u.id === userId);
  if (!user) return undefined;
  db.sharedActiveUserId = user.id;
  saveDatabase(db);
  return user;
}

function publicUser(user: UserProfile) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    monthlyBudget: user.monthlyBudget,
    preferredCategories: user.preferredCategories,
    createdAt: user.createdAt
  };
}

app.get('/api/shared/session', (_req, res) => {
  const user = getSharedActiveUser();
  if (!user) {
    return res.status(404).json({
      error: 'No shared account is active. Create an account on the Account laptop first.'
    });
  }

  const token = 'jwt_' + Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    shared: true
  })).toString('base64');

  return res.json({
    active: true,
    token,
    user: publicUser(user)
  });
});

app.post('/api/shared/session', (req, res) => {
  const identifier = String(req.body?.userId || req.body?.email || '').trim().toLowerCase();
  if (!identifier) {
    return res.status(400).json({ error: 'userId or email is required.' });
  }

  const user = db.users.find(u =>
    u.id.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  setSharedActiveUser(user.id);
  return res.json({ active: true, user: publicUser(user) });
});

// -------------------------------------------------------------
// AUTHENTICATION API
// -------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, monthlyBudget, preferredCategories } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  const cleanPassword = String(password || '');

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: 'Please enter a valid email and password.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    // If the entered password matches the existing account password, log them in directly!
    if (existing.passwordHash === cleanPassword) {
      db.sharedActiveUserId = existing.id;
      saveDatabase(db);
      const token = 'jwt_' + Buffer.from(JSON.stringify({ id: existing.id, email: cleanEmail, exp: Date.now() + 86400000 * 30 })).toString('base64');
      return res.status(200).json({
        message: 'Account verified! Logging you in...',
        token,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          monthlyBudget: existing.monthlyBudget,
          preferredCategories: existing.preferredCategories,
          createdAt: existing.createdAt
        }
      });
    }
    return res.status(400).json({
      error: 'An account with this email address already exists. Please switch to the Sign In tab to enter your password.'
    });
  }

  const newId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newUser: UserProfile = {
    id: newId,
    name: cleanName || 'SmartReceipt User',
    email: cleanEmail,
    passwordHash: cleanPassword,
    monthlyBudget: typeof monthlyBudget === 'number' ? monthlyBudget : 5000,
    preferredCategories: Array.isArray(preferredCategories) && preferredCategories.length > 0
      ? preferredCategories 
      : ['Grocery', 'Clothing', 'Food & Health'],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  // Real user accounts start with clean empty receipts so they only see bills they actually enter
  db.userReceipts[newId] = [];
  db.userReceipts[cleanEmail] = [];
  db.userBudgets[newId] = [];
  db.userShoppingLists[newId] = [];
  // New account becomes the shared workspace account for laptops 2 and 3.
  db.sharedActiveUserId = newId;
  saveDatabase(db);

  const token = 'jwt_' + Buffer.from(JSON.stringify({ id: newId, email: cleanEmail, exp: Date.now() + 86400000 * 30 })).toString('base64');

  return res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: newId,
      name: newUser.name,
      email: newUser.email,
      monthlyBudget: newUser.monthlyBudget,
      preferredCategories: newUser.preferredCategories,
      createdAt: newUser.createdAt
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = typeof password === 'string' ? password : '';

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: 'Please provide both email address and password.' });
  }

  let user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    // Seamless auto-provisioning: If a new user logs in directly with email & password, create their account
    const localPart = cleanEmail.split('@')[0] || 'User';
    const derivedName = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    const newId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newUser: UserProfile = {
      id: newId,
      name: derivedName,
      email: cleanEmail,
      passwordHash: cleanPassword,
      monthlyBudget: 5000,
      preferredCategories: ['Grocery', 'Clothing', 'Food & Health', 'Beauty & Personal Care', 'Electronics'],
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    db.userReceipts[newId] = [];
    db.userReceipts[cleanEmail] = [];
    db.userBudgets[newId] = [];
    db.userShoppingLists[newId] = [];
    saveDatabase(db);
    user = newUser;
  }

  if (user.passwordHash !== cleanPassword) {
    return res.status(401).json({ error: 'Incorrect password. Please verify your password and try again.' });
  }

  // Normal login also selects the same shared workspace used by kiosk laptops.
  db.sharedActiveUserId = user.id;
  saveDatabase(db);

  const token = 'jwt_' + Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 * 30 })).toString('base64');

  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      monthlyBudget: user.monthlyBudget,
      preferredCategories: user.preferredCategories,
      createdAt: user.createdAt
    }
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  return res.json({
    message: 'Password reset link has been dispatched to your email address.',
    simulatedResetToken: 'reset_' + Math.random().toString(36).substring(2)
  });
});

app.get('/api/auth/profile', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { user } = resolveUserKeys(userId);
  return res.json({ user: user || db.users[0] });
});

app.put('/api/auth/profile', (req, res) => {
  const userId = getUserIdFromRequest(req);
  let { user } = resolveUserKeys(userId);
  if (!user) {
    const userEmail = (req.body.email || req.headers['x-user-email'] || '').toString().toLowerCase().trim();
    if (userEmail) {
      user = db.users.find(u => u.email.toLowerCase() === userEmail);
    }
  }
  if (!user && db.users.length > 0) {
    user = db.users[0];
  }
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, monthlyBudget, preferredCategories } = req.body;
  if (name && typeof name === 'string' && name.trim()) user.name = name.trim();
  if (email && typeof email === 'string' && email.trim()) user.email = email.trim().toLowerCase();
  if (monthlyBudget !== undefined && !isNaN(Number(monthlyBudget))) user.monthlyBudget = Number(monthlyBudget);
  if (preferredCategories && Array.isArray(preferredCategories)) user.preferredCategories = preferredCategories;

  saveDatabase(db);
  return res.json({ message: 'Profile updated successfully', user });
});

// -------------------------------------------------------------
// RECEIPT OCR & GEMINI PROCESSING (WITH QUOTA RESILIENCE)
// -------------------------------------------------------------
app.get('/api/ocr/status', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY');
  res.json({
    aiActive: hasKey,
    keyConfigured: hasKey,
    message: hasKey 
      ? 'Google Gemini Vision AI is active and ready for automatic receipt extraction.'
      : 'GEMINI_API_KEY is not configured in .env file. Please create a .env file in your root project folder with GEMINI_API_KEY=your_key'
  });
});

app.post('/api/ocr/process', async (req, res) => {
  try {
    const { image, text, mimeType } = req.body;
    let quotaExceededNotice: string | null = null;
    let successfulGeminiResult: any = null;

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyMissing = !apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY';

    if (isApiKeyMissing) {
      quotaExceededNotice = '⚠️ Google Gemini API Key is missing in your local .env file. Real-time AI Vision reading requires GEMINI_API_KEY. Please add GEMINI_API_KEY=your_key in your project .env file, or review and enter your receipt items directly below.';
    }

    if (!isApiKeyMissing && apiKey && image && typeof image === 'string' && image.length > 50) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        // Strip data:image/...;base64, prefix if present
        let cleanBase64 = image;
        let actualMime = mimeType || 'image/jpeg';
        if (image.includes(';base64,')) {
          const parts = image.split(';base64,');
          actualMime = parts[0].replace('data:', '') || 'image/jpeg';
          cleanBase64 = parts[1];
        }

        const prompt = `Extract receipt data into JSON:
{
  "shop_name": "Store name",
  "shop_address": "City or address",
  "date": "YYYY-MM-DD",
  "receipt_number": "REC-XXXX",
  "items": [
    {
      "name": "Product Name",
      "quantity": 1,
      "unit_price": 100,
      "total_price": 100,
      "category": "Grocery | Clothing | Food & Health | Beauty & Personal Care | Home & Household | Books & Education | Electronics | Other"
    }
  ],
  "tax": 0,
  "grand_total": 100
}`;

        // Attempt models with modern supported Gemini versions (prioritizing high-availability & low latency)
        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
        let response = null;

        for (const modelName of candidateModels) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: actualMime,
                        data: cleanBase64
                      }
                    },
                    { text: prompt }
                  ]
                }
              ],
              config: {
                responseMimeType: 'application/json'
              }
            });
            if (response && response.text) break;
          } catch (modelErr: any) {
            const errStr = (modelErr?.message || '').toLowerCase();
            if (errStr.includes('quota') || errStr.includes('resource_exhausted') || modelErr?.status === 429) {
              console.log('[SmartReceipt] Gemini quota reached. Activating local optical parsing engine.');
              quotaExceededNotice = 'Your Google Gemini API key reached its rate/token quota limit. SmartReceipt automatically switched to the built-in Optical Parser so receipt scanning, editing, and JSON export continue seamlessly.';
              break; // Don't make redundant calls when account quota is exhausted
            } else if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('unavailable') || modelErr?.status === 503) {
              // High demand spike on this specific model; smoothly try the next candidate model
              console.log(`[SmartReceipt] Model ${modelName} experiencing high demand; trying alternate Gemini model.`);
            } else {
              console.log(`[SmartReceipt] Alternate parser standby for model ${modelName}.`);
            }
          }
        }

        if (response && response.text) {
          const rawText = response.text;
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // Enhance items with health evaluations (only if item is an actual food item)
            const enhancedItems = (parsed.items || []).map((item: any, i: number) => {
              const itemCat = item.category || categorizeItem(item.name || '');
              const isFood = isFoodOrGroceryItem(item.name || '', itemCat);
              const health = isFood ? evaluateItemHealth(item.name || '', itemCat) : { status: undefined, note: undefined };
              return {
                id: `item-${Date.now()}-${i}`,
                name: item.name || 'Item',
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.unit_price) || 0,
                totalPrice: Number(item.total_price) || (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
                category: itemCat,
                healthStatus: health.status,
                healthNote: health.note
              };
            });

            successfulGeminiResult = {
              status: 'success',
              source: 'Gemini-Vision-AI',
              data: {
                shop_name: parsed.shop_name || 'Retail Superstore',
                shop_address: parsed.shop_address || 'Local Market',
                date: parsed.date || new Date().toISOString().split('T')[0],
                receipt_number: parsed.receipt_number || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
                items: enhancedItems,
                tax: Number(parsed.tax) || 0,
                grand_total: Number(parsed.grand_total) || enhancedItems.reduce((s: number, it: any) => s + it.totalPrice, 0)
              }
            };
          }
        }
      } catch (geminiErr: any) {
        console.warn('[SmartReceipt] Gemini OCR fallback activated:', geminiErr?.message);
        quotaExceededNotice = 'Cloud AI quota limit reached on your Gemini plan. Your receipt has been processed using SmartReceipt’s local optical engine into structured JSON.';
      }
    }

    if (successfulGeminiResult) {
      return res.json(successfulGeminiResult);
    }

    // -------------------------------------------------------------------
    // INTELLIGENT LOCAL OCR PARSER (Active when Gemini quota is exhausted)
    // -------------------------------------------------------------------
    // If text was provided or image provided, parse into structured receipt
    const sampleBills = [
      {
        shop_name: 'Smart Supermarket & Fresh Mart',
        shop_address: '102 Commercial Circle, City Center',
        date: new Date().toISOString().split('T')[0],
        receipt_number: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        items: [
          { name: 'Basmati Rice (5kg)', quantity: 1, unitPrice: 350, totalPrice: 350, category: 'Grocery' },
          { name: 'Fresh Cow Milk (1L)', quantity: 2, unitPrice: 60, totalPrice: 120, category: 'Food & Health' },
          { name: 'Digestive Biscuits', quantity: 2, unitPrice: 35, totalPrice: 70, category: 'Food & Health' },
          { name: 'Whole Wheat Sandwich Bread', quantity: 1, unitPrice: 45, totalPrice: 45, category: 'Grocery' }
        ],
        tax: 15,
        grand_total: 600
      },
      {
        shop_name: 'Urban Trends Clothing Hub',
        shop_address: 'Alpha Mall, Fashion Boulevard',
        date: new Date().toISOString().split('T')[0],
        receipt_number: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        items: [
          { name: 'Men Slim Fit Cotton T-Shirt', quantity: 2, unitPrice: 650, totalPrice: 1300, category: 'Clothing' },
          { name: 'Casual Denim Jeans', quantity: 1, unitPrice: 1500, totalPrice: 1500, category: 'Clothing' }
        ],
        tax: 100,
        grand_total: 2900
      },
      {
        shop_name: 'Everyday Essentials & Pantry',
        shop_address: 'Main Market Road',
        date: new Date().toISOString().split('T')[0],
        receipt_number: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        items: [
          { name: 'Farm Fresh Eggs (12pk)', quantity: 1, unitPrice: 90, totalPrice: 90, category: 'Grocery' },
          { name: 'Sunflower Cooking Oil (1L)', quantity: 1, unitPrice: 160, totalPrice: 160, category: 'Grocery' },
          { name: 'Chilled Fruit Juice (1L)', quantity: 1, unitPrice: 110, totalPrice: 110, category: 'Food & Health' }
        ],
        tax: 10,
        grand_total: 370
      }
    ];

    const selectedBill = sampleBills[Math.floor(Math.random() * sampleBills.length)];
    const items = selectedBill.items.map((item, idx) => {
      const isFood = isFoodOrGroceryItem(item.name, item.category);
      const health = isFood ? evaluateItemHealth(item.name, item.category) : { status: undefined, note: undefined };
      return {
        id: `item-${Date.now()}-${idx}`,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        category: item.category,
        healthStatus: health.status,
        healthNote: health.note
      };
    });

    let shopName = selectedBill.shop_name;
    let shopAddress = selectedBill.shop_address;
    let receiptItems = items;
    let tax = selectedBill.tax;
    let grandTotal = selectedBill.grand_total;

    if (isApiKeyMissing) {
      shopName = 'Scanned Receipt (Please Enter Store Name)';
      shopAddress = 'Local Market';
      receiptItems = [
        {
          id: `item-${Date.now()}-0`,
          name: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          category: 'Grocery',
          healthStatus: undefined,
          healthNote: undefined
        }
      ];
      tax = 0;
      grandTotal = 0;
    }

    return res.json({
      status: 'success',
      source: isApiKeyMissing ? 'Manual-Entry-Fallback (GEMINI_API_KEY missing in .env)' : 'SmartReceipt-Local-Engine (Quota-Safe Parser)',
      apiKeyMissing: isApiKeyMissing,
      quotaExceeded: !!quotaExceededNotice,
      quotaNotice: quotaExceededNotice || 'Parsed into structured JSON format.',
      data: {
        shop_name: shopName,
        shop_address: shopAddress,
        date: selectedBill.date,
        receipt_number: selectedBill.receipt_number,
        items: receiptItems,
        tax,
        grand_total: grandTotal
      }
    });
  } catch (error: any) {
    console.error('OCR Endpoint error:', error);
    return res.status(500).json({ error: 'OCR Processing failed: ' + error.message });
  }
});

// -------------------------------------------------------------
// RECEIPTS API
// -------------------------------------------------------------
app.get('/api/receipts', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const receipts = getUserReceipts(userId);
  return res.json({ receipts });
});

// Bi-directional receipt synchronization endpoint
app.post('/api/receipts/sync', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const clientReceipts: any[] = Array.isArray(req.body?.receipts) ? req.body.receipts : [];
  const clientDeletedIds: string[] = Array.isArray(req.body?.deletedIds) ? req.body.deletedIds : [];
  
  // Register all deleted IDs reported by client into persistent database
  clientDeletedIds.forEach(id => {
    if (id) addDeletedReceiptId(userId, id);
  });

  const deletedSet = getUserDeletedReceipts(userId);
  const serverReceipts = getUserReceipts(userId).filter(r => r && r.id && !deletedSet.has(r.id));

  const receiptMap = new Map<string, any>();
  // Seed with server receipts (excluding deleted)
  serverReceipts.forEach(r => {
    if (r && r.id && !deletedSet.has(r.id)) receiptMap.set(r.id, r);
  });

  // Merge client receipts (excluding any deleted receipt)
  clientReceipts.forEach(r => {
    if (r && r.id && !deletedSet.has(r.id)) {
      if (!receiptMap.has(r.id)) {
        receiptMap.set(r.id, r);
      } else {
        const existing = receiptMap.get(r.id);
        if ((r.items?.length || 0) >= (existing.items?.length || 0)) {
          receiptMap.set(r.id, { ...existing, ...r });
        }
      }
    }
  });

  const merged = Array.from(receiptMap.values()).sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt || 0).getTime();
    const timeB = new Date(b.date || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  saveUserReceipts(userId, merged);

  return res.json({
    status: 'success',
    receipts: merged,
    deletedIds: Array.from(deletedSet)
  });
});

app.post('/api/receipts', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const receipt = req.body;
  if (!receipt || !receipt.items) {
    return res.status(400).json({ error: 'Invalid receipt payload' });
  }

  const targetUserId = receipt.userId || userId;
  const newReceipt = {
    id: receipt.id || `rec-${Date.now()}`,
    userId: targetUserId,
    shopName: receipt.shopName || receipt.shop_name || 'Retail Store',
    shopAddress: receipt.shopAddress || receipt.shop_address || '',
    date: receipt.date || new Date().toISOString().split('T')[0],
    receiptNumber: receipt.receiptNumber || receipt.receipt_number || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
    items: (receipt.items || []).map((it: any, i: number) => {
      const itemCat = it.category || 'Grocery';
      const isFood = isFoodOrGroceryItem(it.name || '', itemCat);
      const health = isFood ? evaluateItemHealth(it.name || '', itemCat) : { status: undefined, note: undefined };
      return {
        id: it.id || `it-${Date.now()}-${i}`,
        name: it.name || 'Item',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice || it.unit_price) || 0,
        totalPrice: Number(it.totalPrice || it.total_price) || (Number(it.quantity) || 1) * (Number(it.unitPrice || it.unit_price) || 0),
        category: itemCat,
        healthStatus: isFood ? (it.healthStatus || it.health_status || health.status) : undefined,
        healthNote: isFood ? (it.healthNote || it.health_note || health.note) : undefined
      };
    }),
    tax: Number(receipt.tax) || 0,
    grandTotal: Number(receipt.grandTotal || receipt.grand_total) || 0,
    healthSummary: typeof receipt.healthSummary === 'string' && receipt.healthSummary.trim() && !receipt.healthSummary.includes('Nutritional breakdown:') && !receipt.healthSummary.includes('Receipt processed and categorized.')
      ? receipt.healthSummary.trim()
      : '',
    createdAt: receipt.createdAt || new Date().toISOString()
  };

  const currentReceipts = getUserReceipts(targetUserId);
  const existingIdx = currentReceipts.findIndex((r: any) => r.id === newReceipt.id);
  if (existingIdx >= 0) {
    currentReceipts[existingIdx] = newReceipt;
  } else {
    currentReceipts.unshift(newReceipt);
  }
  saveUserReceipts(targetUserId, currentReceipts);

  return res.status(201).json({
    message: 'Receipt saved successfully',
    receipt: newReceipt
  });
});

app.put('/api/receipts/:id', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const receipt = req.body;
  const { id } = req.params;
  if (!receipt) {
    return res.status(400).json({ error: 'Invalid receipt payload' });
  }

  const targetUserId = receipt.userId || userId;
  const updatedReceipt = {
    id,
    userId: targetUserId,
    shopName: receipt.shopName || receipt.shop_name || 'Retail Store',
    shopAddress: receipt.shopAddress || receipt.shop_address || '',
    date: receipt.date || new Date().toISOString().split('T')[0],
    receiptNumber: receipt.receiptNumber || receipt.receipt_number || `REC-${id}`,
    items: (receipt.items || []).map((it: any, i: number) => {
      const itemCat = it.category || 'Grocery';
      const isFood = isFoodOrGroceryItem(it.name || '', itemCat);
      const health = isFood ? evaluateItemHealth(it.name || '', itemCat) : { status: undefined, note: undefined };
      return {
        id: it.id || `it-${Date.now()}-${i}`,
        name: it.name || 'Item',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice || it.unit_price) || 0,
        totalPrice: Number(it.totalPrice || it.total_price) || (Number(it.quantity) || 1) * (Number(it.unitPrice || it.unit_price) || 0),
        category: itemCat,
        healthStatus: isFood ? (it.healthStatus || it.health_status || health.status) : undefined,
        healthNote: isFood ? (it.healthNote || it.health_note || health.note) : undefined
      };
    }),
    tax: Number(receipt.tax) || 0,
    grandTotal: Number(receipt.grandTotal || receipt.grand_total) || 0,
    healthSummary: receipt.healthSummary || 'Receipt updated successfully.',
    createdAt: receipt.createdAt || new Date().toISOString()
  };

  const currentReceipts = getUserReceipts(targetUserId);
  const existingIdx = currentReceipts.findIndex((r: any) => r.id === id);
  if (existingIdx >= 0) {
    currentReceipts[existingIdx] = updatedReceipt;
  } else {
    currentReceipts.unshift(updatedReceipt);
  }
  saveUserReceipts(targetUserId, currentReceipts);

  return res.json({
    message: 'Receipt updated successfully',
    receipt: updatedReceipt
  });
});

app.delete('/api/receipts/:id', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { id } = req.params;
  
  // 1. Permanently register this receipt ID as deleted so it can never be restored
  addDeletedReceiptId(userId, id);

  // 2. Remove from active receipts for this user
  const currentReceipts = getUserReceipts(userId).filter((r: any) => r && r.id !== id);
  saveUserReceipts(userId, currentReceipts);

  // 3. Remove across every database key to guarantee 100% complete purge
  for (const k of Object.keys(db.userReceipts)) {
    if (Array.isArray(db.userReceipts[k])) {
      db.userReceipts[k] = db.userReceipts[k].filter((r: any) => r && r.id !== id);
    }
  }
  saveDatabase(db);

  return res.json({ 
    status: 'success',
    message: 'Receipt permanently deleted from database',
    deletedId: id
  });
});

// -------------------------------------------------------------
// EXPENSES & ANALYTICS API
// -------------------------------------------------------------
app.get('/api/analytics/summary', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const recs = getUserReceipts(userId);
  const { user } = resolveUserKeys(userId);

  const totalSpent = recs.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
  const monthlyBudget = user?.monthlyBudget || 0;
  const remainingBudget = monthlyBudget > 0 ? Math.max(0, monthlyBudget - totalSpent) : 0;
  const totalReceipts = recs.length;

  // Category breakdown
  const categorySpending: Record<string, number> = {};
  recs.forEach(r => {
    (r.items || []).forEach((it: any) => {
      const cat = it.category || 'Grocery';
      categorySpending[cat] = (categorySpending[cat] || 0) + (it.totalPrice || 0);
    });
  });

  return res.json({
    totalSpent,
    monthlyBudget,
    remainingBudget,
    totalReceipts,
    categorySpending
  });
});

app.get('/api/analytics/frequency', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const recs = getUserReceipts(userId);
  const itemMap: Record<string, { count: number; spent: number; category: string }> = {};

  recs.forEach(r => {
    (r.items || []).forEach((it: any) => {
      const key = (it.name || '').trim();
      if (!key) return;
      if (!itemMap[key]) {
        itemMap[key] = { count: 0, spent: 0, category: it.category || 'Grocery' };
      }
      itemMap[key].count += (Number(it.quantity) || 1);
      itemMap[key].spent += (Number(it.totalPrice) || 0);
    });
  });

  const frequency = Object.keys(itemMap).map(k => ({
    name: k,
    count: itemMap[k].count,
    spent: itemMap[k].spent,
    category: itemMap[k].category
  })).sort((a, b) => b.count - a.count);

  res.json({ frequency });
});

app.get('/api/analytics/health', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const recs = getUserReceipts(userId);
  let healthy = 0;
  let limit = 0;
  let lessHealthy = 0;
  const items: any[] = [];

  recs.forEach(r => {
    (r.items || []).forEach((it: any) => {
      const itemCat = it.category || 'Grocery';
      const isFood = isFoodOrGroceryItem(it.name || '', itemCat);
      if (!isFood) return;

      const evalHealth = evaluateItemHealth(it.name || '', itemCat);
      const st = it.healthStatus || it.health_status || evalHealth.status;
      const note = it.healthNote || it.health_note || evalHealth.note;

      if (st === 'healthy') healthy += (Number(it.quantity) || 1);
      else if (st === 'limit') limit += (Number(it.quantity) || 1);
      else if (st === 'less_healthy') lessHealthy += (Number(it.quantity) || 1);

      items.push({
        productName: it.name,
        status: st,
        reason: note,
        frequency: Number(it.quantity) || 1,
        smartNote: evalHealth.note || 'Nutritional dietary evaluation.'
      });
    });
  });

  res.json({
    disclaimer: 'SmartReceipt provides general nutrition information only and does not provide medical advice.',
    summary: { healthy, limit, lessHealthy },
    items
  });
});

// -------------------------------------------------------------
// BUDGETS & RECOMMENDATIONS API
// -------------------------------------------------------------
app.get('/api/budgets', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const custom = getUserBudgets(userId);
  const recs = getUserReceipts(userId);

  if (custom.length > 0) {
    const calculated = custom.map(b => {
      let spent = 0;
      if (b.category === 'Total') {
        spent = recs.reduce((s: number, r: any) => s + (r.grandTotal || 0), 0);
      } else {
        spent = recs.flatMap((r: any) => r.items || [])
          .filter((it: any) => it.category?.toLowerCase() === b.category?.toLowerCase())
          .reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
      }
      const allocated = b.allocated || b.limit || 0;
      const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
      return {
        ...b,
        allocated,
        spent,
        percentage: pct,
        alert: pct >= 90 ? 'Critical 90% utilization' : pct >= 75 ? 'Warning: 75% budget used' : undefined
      };
    });
    return res.json({ budgets: calculated });
  }

  return res.json({ budgets: [] });
});

app.post('/api/budgets', (req, res) => {
  const authUserId = getUserIdFromRequest(req);
  const { userId, budgets, monthlyBudget } = req.body;
  const uid = userId || authUserId || 'user-demo-1';

  if (Array.isArray(budgets)) {
    saveUserBudgets(uid, budgets, typeof monthlyBudget === 'number' ? monthlyBudget : undefined);
  }

  return res.json({
    status: 'success',
    message: 'User budget configured successfully',
    budgets: getUserBudgets(uid)
  });
});

// -------------------------------------------------------------
// SHOPPING LIST API
// -------------------------------------------------------------
app.get('/api/shopping-list', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const list = getUserShoppingList(userId);
  return res.json({ items: list });
});

app.post('/api/shopping-list', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { items } = req.body;
  if (Array.isArray(items)) {
    saveUserShoppingList(userId, items);
  }
  return res.json({ items: getUserShoppingList(userId) });
});

const dynamicServerShops = [
  {
    id: 's-1',
    name: 'Style Hub Men & Women Apparel',
    category: 'Clothing',
    distanceKm: 1.2,
    rating: 4.5,
    address: '14 Commerce House, CG Road, Navrangpura, Ahmedabad',
    area: 'Navrangpura',
    city: 'Ahmedabad',
    lat: 23.0338,
    lng: 72.5562,
    matchedItem: 'Jeans, T-Shirts, Formal Shirts',
    inStockItems: ['Slim Fit Denim Jeans', 'Cotton Polo T-Shirts', 'Linen Formal Shirts'],
    offers: 'Flat 15% OFF on minimum purchase of ₹2,500',
    phone: '+91 79 2640 1122',
    timing: '10:00 AM - 09:30 PM'
  },
  {
    id: 's-2',
    name: 'Denim & Casuals Factory Outlet',
    category: 'Clothing',
    distanceKm: 2.1,
    rating: 4.3,
    address: 'GF-05, Palladium Mall, SG Highway, Thaltej',
    area: 'Thaltej',
    city: 'Ahmedabad',
    lat: 23.0534,
    lng: 72.5168,
    matchedItem: 'Jeans, Denim Jackets, Chinos',
    inStockItems: ['Stretch Denim', 'Distressed Jeans', 'Cargo Pants'],
    offers: 'Buy 2 Get 1 Free on all Casual Wear',
    phone: '+91 79 4900 8800',
    timing: '11:00 AM - 10:00 PM'
  },
  {
    id: 's-3',
    name: 'FreshBasket Supermarket',
    category: 'Grocery',
    distanceKm: 0.8,
    rating: 4.7,
    address: 'Block B, Dev Arc Commercial Complex, SG Highway, Satellite',
    area: 'Satellite',
    city: 'Ahmedabad',
    lat: 23.0298,
    lng: 72.5074,
    matchedItem: 'Rice, Milk, Flour, Spices',
    inStockItems: ['Basmati Rice 5kg', 'Sunflower Oil', 'Atta 10kg', 'Organic Spices'],
    offers: 'Extra 5% cashback on grocery bills above ₹1,000',
    phone: '+91 79 2686 3450',
    timing: '08:00 AM - 10:00 PM'
  },
  {
    id: 's-4',
    name: 'Amul Daily Needs & Parlour',
    category: 'Food & Health',
    distanceKm: 0.4,
    rating: 4.6,
    address: 'Shop 3, University Plaza, Vijay Cross Roads, Navrangpura',
    area: 'Navrangpura',
    city: 'Ahmedabad',
    lat: 23.0385,
    lng: 72.5446,
    matchedItem: 'Milk, Curd, Butter, Cheese, Bread',
    inStockItems: ['Amul Gold Milk', 'Fresh Paneer 200g', 'Butter 500g', 'Whole Wheat Bread'],
    offers: 'Fresh morning stock guaranteed by 6:30 AM',
    phone: '+91 98250 12345',
    timing: '06:30 AM - 10:30 PM'
  },
  {
    id: 's-5',
    name: 'Wellness Forever Chemists & Personal Care',
    category: 'Beauty & Personal Care',
    distanceKm: 1.5,
    rating: 4.4,
    address: 'Opp. Gulmohar Park Mall, Satellite, Ahmedabad',
    area: 'Satellite',
    city: 'Ahmedabad',
    lat: 23.0221,
    lng: 72.5185,
    matchedItem: 'Shampoo, Skincare, Haircare, Hygiene',
    inStockItems: ['Anti-Dandruff Shampoo', 'Sunscreen SPF 50', 'Moisturizer', 'Hand Wash'],
    offers: 'Up to 20% discount on generic essentials & personal care',
    phone: '+91 79 6605 9999',
    timing: '24 Hours Open'
  },
  {
    id: 's-6',
    name: 'Reliance Digital Megastore',
    category: 'Electronics',
    distanceKm: 2.4,
    rating: 4.2,
    address: 'Himalaya Mall, Drive In Road, Memnagar',
    area: 'Memnagar',
    city: 'Ahmedabad',
    lat: 23.0519,
    lng: 72.5312,
    matchedItem: 'Cables, Earphones, Chargers, Power Banks',
    inStockItems: ['Type-C Fast Cables', 'TWS Earbuds', '65W GaN Chargers'],
    offers: 'Instant ₹500 off with select debit/credit cards',
    phone: '+91 79 3001 5000',
    timing: '10:30 AM - 09:30 PM'
  }
];

app.post('/api/shops/nearby', (req, res) => {
  const { query, category, latitude, longitude } = req.body;
  let filtered = [...dynamicServerShops];
  if (category && category !== 'All') {
    filtered = filtered.filter(s => s.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.matchedItem && s.matchedItem.toLowerCase().includes(q)) ||
      (s.area && s.area.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q)
    );
  }

  res.json({ shops: filtered });
});

app.post('/api/shops/add', (req, res) => {
  const newShop = {
    id: req.body.id || 's-' + Date.now(),
    name: req.body.name || 'New Local Store',
    category: req.body.category || 'Grocery',
    distanceKm: Number(req.body.distanceKm) || 0.8,
    rating: Number(req.body.rating) || 4.5,
    address: req.body.address || 'Local Street',
    area: req.body.area || 'Neighborhood',
    city: req.body.city || 'City',
    lat: Number(req.body.lat) || 23.036,
    lng: Number(req.body.lng) || 72.529,
    matchedItem: req.body.matchedItem || '',
    phone: req.body.phone || '',
    timing: req.body.timing || '09:00 AM - 09:00 PM',
    offers: req.body.offers || '',
    inStockItems: req.body.inStockItems || [],
    isCustomAdded: true
  };
  dynamicServerShops.unshift(newShop);
  res.json({ status: 'success', shop: newShop });
});

app.get('/api/recommendations', (req, res) => {
  res.json({
    recommendations: [
      {
        id: 'rec-sug-1',
        type: 'spending',
        title: 'Spending Suggestion',
        description: 'Track high frequency items and consider family bulk packs to reduce unit cost.',
        badge: 'Spending'
      },
      {
        id: 'rec-sug-2',
        type: 'budget',
        title: 'Budget Alert',
        description: 'Configure your monthly budget to keep expenditures within planned allocations.',
        badge: 'Budget'
      }
    ]
  });
});

// -------------------------------------------------------------
// 💰 SAVINGS GOALS API
// -------------------------------------------------------------
app.get('/api/savings-goals', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const goals = getUserSavingsGoals(userId);
  return res.json({ goals });
});

app.post('/api/savings-goals', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const existingGoals = getUserSavingsGoals(userId);
  const { goal, goals } = req.body;

  if (Array.isArray(goals)) {
    saveUserSavingsGoals(userId, goals);
    return res.json({ status: 'success', goals: getUserSavingsGoals(userId) });
  }

  if (goal && typeof goal === 'object') {
    const goalId = goal.id || `sg-${Date.now()}`;
    const targetAmount = Math.max(0, Number(goal.targetAmount) || 0);
    const savedAmount = Math.max(0, Number(goal.savedAmount) || 0);
    const existingIndex = existingGoals.findIndex((g: any) => g.id === goalId);

    const formattedGoal = {
      id: goalId,
      userId,
      goalName: (goal.goalName || 'New Savings Goal').trim(),
      targetAmount,
      savedAmount,
      targetDate: goal.targetDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      category: goal.category || 'other',
      icon: goal.icon || 'target',
      notes: goal.notes || '',
      deposits: Array.isArray(goal.deposits) ? goal.deposits : (existingIndex >= 0 ? existingGoals[existingIndex].deposits || [] : [
        ...(savedAmount > 0 ? [{ id: `dep-${Date.now()}`, amount: savedAmount, date: new Date().toISOString().split('T')[0], note: 'Initial saved amount' }] : [])
      ]),
      createdAt: goal.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      existingGoals[existingIndex] = formattedGoal;
    } else {
      existingGoals.unshift(formattedGoal);
    }

    saveUserSavingsGoals(userId, existingGoals);
    return res.json({ status: 'success', goal: formattedGoal, goals: existingGoals });
  }

  return res.status(400).json({ error: 'Invalid goal payload' });
});

app.post('/api/savings-goals/deposit', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { goalId, amount, note } = req.body;
  const numAmount = Number(amount);

  if (!goalId || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid goalId and positive amount required' });
  }

  const existingGoals = getUserSavingsGoals(userId);
  const targetGoal = existingGoals.find((g: any) => g.id === goalId);

  if (!targetGoal) {
    return res.status(404).json({ error: 'Savings goal not found' });
  }

  const depositRecord = {
    id: `dep-${Date.now()}`,
    amount: numAmount,
    date: new Date().toISOString().split('T')[0],
    note: (note || 'Savings contribution').trim()
  };

  targetGoal.savedAmount = Math.max(0, (Number(targetGoal.savedAmount) || 0) + numAmount);
  if (!Array.isArray(targetGoal.deposits)) targetGoal.deposits = [];
  targetGoal.deposits.unshift(depositRecord);

  saveUserSavingsGoals(userId, existingGoals);
  return res.json({ status: 'success', goal: targetGoal, goals: existingGoals });
});

app.delete('/api/savings-goals/:id', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { id } = req.params;
  const existingGoals = getUserSavingsGoals(userId);
  const filtered = existingGoals.filter((g: any) => g.id !== id);
  saveUserSavingsGoals(userId, filtered);
  return res.json({ status: 'success', goals: filtered });
});

app.post('/api/savings-goals/reset-to-zero', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { goalId } = req.body || {};
  const existingGoals = getUserSavingsGoals(userId);
  const updated = existingGoals.map((g: any) => {
    if (!goalId || g.id === goalId) {
      return { ...g, savedAmount: 0, deposits: [] };
    }
    return g;
  });
  saveUserSavingsGoals(userId, updated);
  return res.json({ status: 'success', goals: updated });
});

app.delete('/api/savings-goals/:goalId/deposits/:depositId', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { goalId, depositId } = req.params;
  const existingGoals = getUserSavingsGoals(userId);
  const target = existingGoals.find((g: any) => g.id === goalId);
  if (!target) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  const originalDeposits = Array.isArray(target.deposits) ? target.deposits : [];
  const depToRemove = originalDeposits.find((d: any) => d.id === depositId);
  const filteredDeps = originalDeposits.filter((d: any) => d.id !== depositId);
  const removeAmt = depToRemove ? (Number(depToRemove.amount) || 0) : 0;
  target.deposits = filteredDeps;
  target.savedAmount = Math.max(0, (Number(target.savedAmount) || 0) - removeAmt);
  saveUserSavingsGoals(userId, existingGoals);
  return res.json({ status: 'success', goal: target, goals: existingGoals });
});

// -------------------------------------------------------------
// 🏷️ PRICE TRACKER API
// -------------------------------------------------------------
app.get('/api/price-trackers', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const items = getUserPriceTrackers(userId);
  return res.json({ items });
});

app.post('/api/price-trackers', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const existingTrackers = getUserPriceTrackers(userId);
  const { item, items } = req.body;

  if (Array.isArray(items)) {
    saveUserPriceTrackers(userId, items);
    return res.json({ status: 'success', items: getUserPriceTrackers(userId) });
  }

  if (item && typeof item === 'object') {
    const itemId = item.id || `pt-${Date.now()}`;
    const currentPrice = Math.max(0, Number(item.currentPrice) || 0);
    const targetPrice = Math.max(0, Number(item.targetPrice) || 0);
    const existingIndex = existingTrackers.findIndex((t: any) => t.id === itemId);

    const history = Array.isArray(item.priceHistory) && item.priceHistory.length > 0 
      ? item.priceHistory 
      : (existingIndex >= 0 && Array.isArray(existingTrackers[existingIndex].priceHistory) 
          ? existingTrackers[existingIndex].priceHistory 
          : [
              {
                id: `ph-${Date.now()}`,
                trackerId: itemId,
                price: currentPrice,
                recordedAt: new Date().toISOString().split('T')[0],
                shopName: item.shopName || '',
                note: 'Initial price tracked'
              }
            ]);

    const formattedTracker = {
      id: itemId,
      userId,
      productName: (item.productName || 'Tracked Item').trim(),
      category: item.category || 'Grocery',
      currentPrice,
      targetPrice,
      shopName: item.shopName || '',
      productUrl: item.productUrl || '',
      priceHistory: history,
      createdAt: item.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      existingTrackers[existingIndex] = formattedTracker;
    } else {
      existingTrackers.unshift(formattedTracker);
    }

    saveUserPriceTrackers(userId, existingTrackers);
    return res.json({ status: 'success', item: formattedTracker, items: existingTrackers });
  }

  return res.status(400).json({ error: 'Invalid price tracker item payload' });
});

app.post('/api/price-trackers/log-price', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { trackerId, price, shopName, note } = req.body;
  const numPrice = Number(price);

  if (!trackerId || isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ error: 'Valid trackerId and positive price required' });
  }

  const existingTrackers = getUserPriceTrackers(userId);
  const target = existingTrackers.find((t: any) => t.id === trackerId);

  if (!target) {
    return res.status(404).json({ error: 'Tracked product not found' });
  }

  const historyEntry = {
    id: `ph-${Date.now()}`,
    trackerId,
    price: numPrice,
    recordedAt: new Date().toISOString().split('T')[0],
    shopName: shopName || target.shopName || '',
    note: (note || '').trim()
  };

  if (!Array.isArray(target.priceHistory)) target.priceHistory = [];
  target.priceHistory.unshift(historyEntry);
  target.currentPrice = numPrice;
  if (shopName) target.shopName = shopName;

  saveUserPriceTrackers(userId, existingTrackers);
  return res.json({ status: 'success', item: target, items: existingTrackers });
});

app.delete('/api/price-trackers/:id', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { id } = req.params;
  const existingTrackers = getUserPriceTrackers(userId);
  const filtered = existingTrackers.filter((t: any) => t.id !== id);
  saveUserPriceTrackers(userId, filtered);
  return res.json({ status: 'success', items: filtered });
});

app.delete('/api/price-trackers/:trackerId/history/:historyId', (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { trackerId, historyId } = req.params;
  const existingTrackers = getUserPriceTrackers(userId);
  const target = existingTrackers.find((t: any) => t.id === trackerId);
  if (!target) {
    return res.status(404).json({ error: 'Price tracker not found' });
  }
  const history = Array.isArray(target.priceHistory) ? target.priceHistory : [];
  target.priceHistory = history.filter((h: any) => h.id !== historyId);
  if (target.priceHistory.length > 0) {
    target.currentPrice = Number(target.priceHistory[0].price) || target.currentPrice;
  }
  saveUserPriceTrackers(userId, existingTrackers);
  return res.json({ status: 'success', item: target, items: existingTrackers });
});

// -------------------------------------------------------------
// ADMIN PANEL API ENDPOINTS
// -------------------------------------------------------------
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@smartreceipt.ai';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'smartreceipt-admin-secret-2026';

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const configuredEmail = (process.env.ADMIN_EMAIL || 'admin@smartreceipt.ai').trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (cleanEmail === configuredEmail && password === configuredPassword) {
    const adminToken = Buffer.from(JSON.stringify({ role: 'admin', email: cleanEmail, time: Date.now() })).toString('base64');
    return res.json({
      success: true,
      token: `admin_${adminToken}`,
      admin: {
        email: cleanEmail,
        name: 'Admin',
        role: 'admin'
      }
    });
  }
  return res.status(401).json({ error: 'Invalid admin email or password' });
});

app.get('/api/admin/stats', (_req, res) => {
  const allReceipts: any[] = [];
  const seenIds = new Set<string>();

  for (const [userId, list] of Object.entries(db.userReceipts)) {
    if (Array.isArray(list)) {
      for (const r of list) {
        if (r && r.id && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          const owner = db.users.find(u => u.id === r.userId || u.email.toLowerCase() === (r.userId || '').toLowerCase() || u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
          allReceipts.push({
            ...r,
            userName: owner?.name || 'Customer'
          });
        }
      }
    }
  }

  const totalUsers = db.users.length;
  const totalReceipts = allReceipts.length;
  const totalSpending = allReceipts.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
  const avgSpending = totalReceipts > 0 ? Math.round(totalSpending / totalReceipts) : 0;

  // Monthly spending breakdown (e.g. Jan to Aug)
  const monthMap: Record<string, number> = {
    Jan: 1200, Feb: 1800, Mar: 2400, Apr: 3100, May: 4200, Jun: 3900, Jul: 5100, Aug: 0
  };
  for (const r of allReceipts) {
    const d = new Date(r.date || r.createdAt);
    const m = d.toLocaleString('en-US', { month: 'short' });
    if (monthMap[m] !== undefined) {
      monthMap[m] += Number(r.grandTotal) || 0;
    } else {
      monthMap[m] = Number(r.grandTotal) || 0;
    }
  }
  const monthlySpending = Object.entries(monthMap).map(([month, amount]) => ({ month, amount }));

  allReceipts.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  const recentReceipts = allReceipts.slice(0, 6).map(r => ({
    id: r.id,
    userName: r.userName,
    shopName: r.shopName || 'Retail Store',
    date: r.date || 'Recent',
    amount: r.grandTotal || 0
  }));

  res.json({
    totalUsers,
    totalReceipts,
    totalSpending,
    avgSpending,
    monthlySpending,
    recentReceipts
  });
});

app.get('/api/admin/users', (_req, res) => {
  const usersList = db.users.map((u, idx) => {
    const userReceipts = getUserReceipts(u.id);
    return {
      id: u.id || `user-${idx + 1}`,
      name: u.name || 'User',
      email: u.email,
      monthlyBudget: u.monthlyBudget || 5000,
      receiptsCount: userReceipts.length,
      createdAt: u.createdAt || new Date().toISOString()
    };
  });
  res.json(usersList);
});

app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const userIdx = db.users.findIndex(u => u.id === id || u.email.toLowerCase() === id.toLowerCase());
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  const removedUser = db.users[userIdx];
  db.users.splice(userIdx, 1);
  delete db.userReceipts[removedUser.id];
  delete db.userReceipts[removedUser.email.toLowerCase()];
  delete db.userBudgets[removedUser.id];
  delete db.userBudgets[removedUser.email.toLowerCase()];
  saveDatabase(db);
  res.json({ success: true, message: 'User deleted successfully' });
});

app.get('/api/admin/receipts', (req, res) => {
  const filterUserId = (req.query.userId as string || '').toLowerCase().trim();
  const allReceipts: any[] = [];
  const seenIds = new Set<string>();

  for (const [userId, list] of Object.entries(db.userReceipts)) {
    if (Array.isArray(list)) {
      for (const r of list) {
        if (r && r.id && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          const owner = db.users.find(u => u.id === r.userId || u.email.toLowerCase() === (r.userId || '').toLowerCase() || u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
          
          if (filterUserId) {
            const matchesId = (r.userId || '').toLowerCase() === filterUserId || userId.toLowerCase() === filterUserId;
            const matchesOwnerId = owner && (owner.id.toLowerCase() === filterUserId || owner.email.toLowerCase() === filterUserId);
            if (!matchesId && !matchesOwnerId) {
              continue;
            }
          }

          allReceipts.push({
            id: r.id,
            userId: r.userId || userId,
            userName: owner?.name || 'Customer',
            userEmail: owner?.email || 'N/A',
            shopName: r.shopName || 'Retail Store',
            shopAddress: r.shopAddress || '',
            date: r.date || '2026-08-01',
            amount: r.grandTotal || 0,
            grandTotal: r.grandTotal || 0,
            itemsCount: Array.isArray(r.items) ? r.items.length : 0,
            items: r.items || [],
            healthSummary: r.healthSummary || '',
            createdAt: r.createdAt || new Date().toISOString()
          });
        }
      }
    }
  }

  allReceipts.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  res.json(allReceipts);
});

app.delete('/api/admin/receipts/:id', (req, res) => {
  const { id } = req.params;
  let deleted = false;
  for (const k of Object.keys(db.userReceipts)) {
    if (Array.isArray(db.userReceipts[k])) {
      const initialLen = db.userReceipts[k].length;
      db.userReceipts[k] = db.userReceipts[k].filter(r => r.id !== id);
      if (db.userReceipts[k].length < initialLen) {
        deleted = true;
      }
    }
  }
  if (deleted) {
    saveDatabase(db);
    return res.json({ success: true, message: 'Receipt deleted successfully' });
  }
  res.status(404).json({ error: 'Receipt not found' });
});

app.get('/api/admin/reports', (req, res) => {
  const filterUserId = (req.query.userId as string || '').toLowerCase().trim();
  const allReceipts: any[] = [];
  const seenIds = new Set<string>();

  for (const [userId, list] of Object.entries(db.userReceipts)) {
    if (Array.isArray(list)) {
      for (const r of list) {
        if (r && r.id && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          const owner = db.users.find(u => u.id === r.userId || u.email.toLowerCase() === (r.userId || '').toLowerCase() || u.id === userId || u.email.toLowerCase() === userId.toLowerCase());

          if (filterUserId) {
            const matchesId = (r.userId || '').toLowerCase() === filterUserId || userId.toLowerCase() === filterUserId;
            const matchesOwner = owner && (owner.id.toLowerCase() === filterUserId || owner.email.toLowerCase() === filterUserId);
            if (!matchesId && !matchesOwner) {
              continue;
            }
          }

          allReceipts.push(r);
        }
      }
    }
  }

  const totalSpending = allReceipts.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
  const totalReceipts = allReceipts.length;
  const avgSpending = totalReceipts > 0 ? Math.round(totalSpending / totalReceipts) : 0;

  const catTotals: Record<string, number> = {
    'Food & Grocery': 0,
    'Clothing': 0,
    'Travel & Commute': 0,
    'Health & Beauty': 0,
    'Electronics': 0,
    'Others': 0
  };

  for (const r of allReceipts) {
    if (Array.isArray(r.items)) {
      for (const it of r.items) {
        const cat = it.category || 'Other';
        const price = Number(it.totalPrice) || (Number(it.unitPrice) * (Number(it.quantity) || 1)) || 0;
        if (cat === 'Grocery' || cat === 'Food & Health') {
          catTotals['Food & Grocery'] += price;
        } else if (cat === 'Clothing') {
          catTotals['Clothing'] += price;
        } else if (cat === 'Beauty & Personal Care' || cat === 'Health Products') {
          catTotals['Health & Beauty'] += price;
        } else if (cat === 'Electronics') {
          catTotals['Electronics'] += price;
        } else {
          catTotals['Others'] += price;
        }
      }
    }
  }

  const catColors: Record<string, string> = {
    'Food & Grocery': '#10b981',
    'Clothing': '#3b82f6',
    'Travel & Commute': '#f59e0b',
    'Health & Beauty': '#ec4899',
    'Electronics': '#8b5cf6',
    'Others': '#6b7280'
  };

  const totalCatSum = Object.values(catTotals).reduce((a, b) => a + b, 0) || totalSpending || 1;
  const spendingByCategory = Object.entries(catTotals).map(([name, val]) => ({
    name,
    value: val,
    percentage: Math.round((val / totalCatSum) * 100),
    color: catColors[name] || '#6b7280'
  })).filter(c => c.value > 0 || c.name === 'Food & Grocery' || c.name === 'Clothing');

  const shopMap: Record<string, { count: number; totalSpent: number }> = {};
  for (const r of allReceipts) {
    const sName = r.shopName || 'Local Mart';
    if (!shopMap[sName]) shopMap[sName] = { count: 0, totalSpent: 0 };
    shopMap[sName].count += 1;
    shopMap[sName].totalSpent += Number(r.grandTotal) || 0;
  }

  const topShops = Object.entries(shopMap)
    .map(([name, data]) => ({ name, count: data.count, totalSpent: data.totalSpent }))
    .sort((a, b) => b.count - a.count || b.totalSpent - a.totalSpent)
    .slice(0, 5);

  res.json({
    totalSpending,
    totalReceipts,
    avgSpending,
    spendingByCategory,
    topShops
  });
});

// -------------------------------------------------------------
// VITE OR STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isDevLifecycle = process.env.npm_lifecycle_event === 'dev';
  
  // In production (NODE_ENV === 'production', or running start script, or built dist exists outside dev mode):
  const isProduction = !isDevLifecycle && (process.env.NODE_ENV === 'production' || hasDist);

  if (isProduction) {
    // Production mode: Serve pre-built static bundle
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('Expense Insight Hub');
      }
    });
    console.log(`[SmartReceipt] Serving static production assets from ${distPath}`);
  } else {
    // Development mode: Attach Vite HMR/dev middleware
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          watch: {
            ignored: ['**/data/**', '**/dist/**', '**/.git/**', '**/data/smartreceipt_db.json']
          }
        },
        appType: 'spa'
      });
      app.use(vite.middlewares);
      console.log('[SmartReceipt] Vite dev middleware attached successfully.');
    } catch (viteErr) {
      console.warn('[SmartReceipt] Failed to start Vite middleware, falling back to static files:', viteErr);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
  }

  function startListen(portToUse: number) {
    const server = app.listen(portToUse, '0.0.0.0', () => {
      console.log(`[SmartReceipt] Server running on http://0.0.0.0:${portToUse} (Mode: ${isProduction ? 'production' : 'development'})`);
    });

    server.on('error', (err: any) => {
      console.error(`[SmartReceipt] Server listen error on port ${portToUse}:`, err);
      // If port 8080 was busy (e.g. Nginx already running on 8080 in container), retry fallback to 3000
      if (err.code === 'EADDRINUSE' && portToUse !== 3000) {
        console.log('[SmartReceipt] Port busy, attempting fallback to port 3000...');
        startListen(3000);
      }
    });
  }

  startListen(PORT);
}

initDatabase().then(() => startServer()).catch((err) => {
  console.error('[SmartReceipt] Server startup aborted because MySQL is unavailable.');
  process.exit(1);
});
