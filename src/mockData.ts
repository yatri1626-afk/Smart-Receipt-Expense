import { Receipt, CategoryBudget, NearbyShop, SmartSuggestion, HealthSummaryItem, ProductFrequency } from './types';

export const INITIAL_BUDGET: number = 10000;

export const DEFAULT_BUDGETS: CategoryBudget[] = [
  { category: 'Total', allocated: 10000, spent: 8450 },
  { category: 'Clothing', allocated: 3500, spent: 3200 },
  { category: 'Grocery', allocated: 3000, spent: 2500 },
  { category: 'Food & Health', allocated: 1800, spent: 1350 },
  { category: 'Beauty & Personal Care', allocated: 1200, spent: 900 },
  { category: 'Electronics', allocated: 1000, spent: 900 },
  { category: 'Home & Household', allocated: 800, spent: 320 },
  { category: 'Books & Education', allocated: 500, spent: 180 },
];

export const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'rec-10234',
    userId: 'user-default',
    shopName: 'ABC Supermarket',
    shopAddress: '102 CG Road, Navrangpura, Ahmedabad, Gujarat',
    date: '2026-08-24',
    receiptNumber: 'REC-10234',
    tax: 20,
    grandTotal: 1490,
    healthSummary: 'Mixed items: Rice & Milk are nutritious staples; Biscuits contain refined sugars.',
    createdAt: '2026-08-24T14:32:00Z',
    items: [
      {
        id: 'item-1',
        name: 'Basmati Rice (5kg)',
        quantity: 2,
        unitPrice: 250,
        totalPrice: 500,
        category: 'Grocery',
        healthStatus: 'healthy',
        healthNote: 'Can be part of a balanced meal. Portion size and whole-grain alternatives matter.'
      },
      {
        id: 'item-2',
        name: 'Fresh Cow Milk (1L)',
        quantity: 2,
        unitPrice: 60,
        totalPrice: 120,
        category: 'Food & Health',
        healthStatus: 'healthy',
        healthNote: 'High calcium and protein source. Prefer low-fat if monitoring saturated fats.'
      },
      {
        id: 'item-3',
        name: 'Digestive Biscuits',
        quantity: 3,
        unitPrice: 30,
        totalPrice: 90,
        category: 'Food & Health',
        healthStatus: 'limit',
        healthNote: 'Contains processed wheat and moderate added sugars.'
      },
      {
        id: 'item-4',
        name: 'Premium Tea Leaves (500g)',
        quantity: 1,
        unitPrice: 280,
        totalPrice: 280,
        category: 'Grocery',
        healthStatus: 'healthy',
        healthNote: 'Rich in antioxidants when consumed without excess refined sugar.'
      },
      {
        id: 'item-5',
        name: 'Herbal Anti-Dandruff Shampoo',
        quantity: 1,
        unitPrice: 480,
        totalPrice: 480,
        category: 'Beauty & Personal Care'
      }
    ]
  },
  {
    id: 'rec-10228',
    userId: 'user-default',
    shopName: 'Urban Trends Clothing Store',
    shopAddress: 'AlphaOne Mall, Vastrapur, Ahmedabad',
    date: '2026-08-21',
    receiptNumber: 'REC-10228',
    tax: 150,
    grandTotal: 3200,
    healthSummary: 'Non-food apparel purchase.',
    createdAt: '2026-08-21T18:15:00Z',
    items: [
      {
        id: 'item-6',
        name: 'Men Slim Fit Cotton T-Shirt',
        quantity: 3,
        unitPrice: 600,
        totalPrice: 1800,
        category: 'Clothing'
      },
      {
        id: 'item-7',
        name: 'Casual Polo T-Shirt Navy',
        quantity: 2,
        unitPrice: 700,
        totalPrice: 1400,
        category: 'Clothing'
      }
    ]
  },
  {
    id: 'rec-10215',
    userId: 'user-default',
    shopName: 'QuickMart Daily Needs',
    shopAddress: 'Near University Circle, Ahmedabad',
    date: '2026-08-18',
    receiptNumber: 'REC-10215',
    tax: 15,
    grandTotal: 720,
    healthSummary: 'Soft drinks purchased frequently. High sugar alert flagged.',
    createdAt: '2026-08-18T11:20:00Z',
    items: [
      {
        id: 'item-8',
        name: 'Chilled Cola Soft Drink (750ml)',
        quantity: 6,
        unitPrice: 40,
        totalPrice: 240,
        category: 'Food & Health',
        healthStatus: 'less_healthy',
        healthNote: 'Often high in added sugar. Consider reducing purchase frequency.'
      },
      {
        id: 'item-9',
        name: 'Butter Cream Biscuits',
        quantity: 5,
        unitPrice: 35,
        totalPrice: 175,
        category: 'Food & Health',
        healthStatus: 'limit',
        healthNote: 'High sugar and saturated fat bakery item.'
      },
      {
        id: 'item-10',
        name: 'Whole Wheat Sandwich Bread',
        quantity: 3,
        unitPrice: 45,
        totalPrice: 135,
        category: 'Grocery',
        healthStatus: 'healthy',
        healthNote: 'Good fiber source for daily breakfast.'
      },
      {
        id: 'item-11',
        name: 'Farm Fresh Brown Eggs (6 pack)',
        quantity: 2,
        unitPrice: 85,
        totalPrice: 170,
        category: 'Food & Health',
        healthStatus: 'healthy',
        healthNote: 'Excellent source of protein, choline and vitamins.'
      }
    ]
  },
  {
    id: 'rec-10190',
    userId: 'user-default',
    shopName: 'Croma Electronics & Tech',
    shopAddress: 'Iscon Mega Mall, SG Highway, Ahmedabad',
    date: '2026-08-12',
    receiptNumber: 'REC-10190',
    tax: 80,
    grandTotal: 900,
    healthSummary: 'Electronics accessory purchase.',
    createdAt: '2026-08-12T16:45:00Z',
    items: [
      {
        id: 'item-12',
        name: 'Braided Fast Charging Type-C Cable',
        quantity: 1,
        unitPrice: 450,
        totalPrice: 450,
        category: 'Electronics'
      },
      {
        id: 'item-13',
        name: 'Wired Earphones with Mic',
        quantity: 1,
        unitPrice: 450,
        totalPrice: 450,
        category: 'Electronics'
      }
    ]
  },
  {
    id: 'rec-10174',
    userId: 'user-default',
    shopName: 'Nature Fresh Organic Store',
    shopAddress: 'Sindhu Bhavan Road, Bodakdev, Ahmedabad',
    date: '2026-08-08',
    receiptNumber: 'REC-10174',
    tax: 35,
    grandTotal: 1240,
    healthSummary: 'High density of nutritious fresh items and staples.',
    createdAt: '2026-08-08T10:10:00Z',
    items: [
      {
        id: 'item-14',
        name: 'Organic Whole Cow Milk (1L)',
        quantity: 4,
        unitPrice: 65,
        totalPrice: 260,
        category: 'Food & Health',
        healthStatus: 'healthy',
        healthNote: 'Fresh organic dairy with high bioavailable nutrition.'
      },
      {
        id: 'item-15',
        name: 'Multigrain Bread Loaf',
        quantity: 2,
        unitPrice: 55,
        totalPrice: 110,
        category: 'Grocery',
        healthStatus: 'healthy',
        healthNote: 'High dietary fiber.'
      },
      {
        id: 'item-16',
        name: 'Kashmiri Apples (1kg)',
        quantity: 2,
        unitPrice: 180,
        totalPrice: 360,
        category: 'Food & Health',
        healthStatus: 'healthy',
        healthNote: 'High in dietary fiber and vitamin C.'
      },
      {
        id: 'item-17',
        name: 'Organic Sunflower Cooking Oil (1L)',
        quantity: 2,
        unitPrice: 190,
        totalPrice: 380,
        category: 'Grocery',
        healthStatus: 'healthy',
        healthNote: 'Heart-healthy unsaturated fats; use in moderation.'
      },
      {
        id: 'item-18',
        name: 'Moisturizing Face Wash (100ml)',
        quantity: 1,
        unitPrice: 130,
        totalPrice: 130,
        category: 'Beauty & Personal Care'
      }
    ]
  },
  {
    id: 'rec-10160',
    userId: 'user-default',
    shopName: 'Amul Dairy Parlour',
    shopAddress: 'Nehrunagar Circle, Ahmedabad',
    date: '2026-08-04',
    receiptNumber: 'REC-10160',
    tax: 10,
    grandTotal: 900,
    healthSummary: 'Daily dairy replenishment and breakfast items.',
    createdAt: '2026-08-04T08:30:00Z',
    items: [
      {
        id: 'item-19',
        name: 'Amul Taaza Milk (500ml pouch)',
        quantity: 6,
        unitPrice: 28,
        totalPrice: 168,
        category: 'Food & Health',
        healthStatus: 'healthy',
        healthNote: 'Pasteurized toned milk.'
      },
      {
        id: 'item-20',
        name: 'Amul Salted Butter (500g)',
        quantity: 1,
        unitPrice: 275,
        totalPrice: 275,
        category: 'Food & Health',
        healthStatus: 'limit',
        healthNote: 'High in saturated fat and sodium. Consume in small portions.'
      },
      {
        id: 'item-21',
        name: 'Whole Wheat Sliced Bread',
        quantity: 3,
        unitPrice: 45,
        totalPrice: 135,
        category: 'Grocery',
        healthStatus: 'healthy',
        healthNote: 'Dietary carbohydrate source.'
      },
      {
        id: 'item-22',
        name: 'Shampoo Sachet Box & Hair Oil',
        quantity: 1,
        unitPrice: 290,
        totalPrice: 290,
        category: 'Beauty & Personal Care'
      },
      {
        id: 'item-23',
        name: 'Chocolate Crunch Biscuits',
        quantity: 1,
        unitPrice: 32,
        totalPrice: 32,
        category: 'Food & Health',
        healthStatus: 'limit',
        healthNote: 'Added sugar snack.'
      }
    ]
  },
  {
    id: 'rec-10150',
    userId: 'user-default',
    shopName: 'Metro Home & Living Mart',
    shopAddress: 'S.G. Highway, Thaltej, Ahmedabad',
    date: '2026-08-01',
    receiptNumber: 'REC-10150',
    tax: 30,
    grandTotal: 775,
    healthSummary: 'Household cleaning supplies and living essentials.',
    createdAt: '2026-08-01T11:20:00Z',
    items: [
      {
        id: 'item-24',
        name: 'Active Liquid Laundry Detergent (2L)',
        quantity: 1,
        unitPrice: 420,
        totalPrice: 420,
        category: 'Home & Household'
      },
      {
        id: 'item-25',
        name: 'Antibacterial Dishwashing Gel (750ml)',
        quantity: 1,
        unitPrice: 155,
        totalPrice: 155,
        category: 'Home & Household'
      },
      {
        id: 'item-26',
        name: 'Floor Disinfectant Surface Cleaner (1L)',
        quantity: 1,
        unitPrice: 170,
        totalPrice: 170,
        category: 'Home & Household'
      }
    ]
  },
  {
    id: 'rec-10145',
    userId: 'user-default',
    shopName: 'Crossword Bookstore & Stationery',
    shopAddress: 'Monalisa Complex, Mithakhali, Ahmedabad',
    date: '2026-07-28',
    receiptNumber: 'REC-10145',
    tax: 40,
    grandTotal: 950,
    healthSummary: 'Academic textbooks and study materials.',
    createdAt: '2026-07-28T16:40:00Z',
    items: [
      {
        id: 'item-27',
        name: 'Core Subject Academic Reference Textbook',
        quantity: 1,
        unitPrice: 550,
        totalPrice: 550,
        category: 'Books & Education'
      },
      {
        id: 'item-28',
        name: 'Spiral Ruled Notebooks (Pack of 4)',
        quantity: 1,
        unitPrice: 240,
        totalPrice: 240,
        category: 'Books & Education'
      },
      {
        id: 'item-29',
        name: 'Smooth Gel & Ball Pens Combo (Pack of 10)',
        quantity: 1,
        unitPrice: 120,
        totalPrice: 120,
        category: 'Books & Education'
      }
    ]
  }
];

export const FREQUENT_PRODUCTS: ProductFrequency[] = [
  {
    name: 'Biscuits',
    count: 8,
    category: 'Food & Health',
    totalSpent: 297,
    lastPurchased: '2026-08-24',
    warningAlert: 'You purchased biscuits 8 times this month. Consider checking your purchase frequency.'
  },
  {
    name: 'Soft Drink (Cola)',
    count: 6,
    category: 'Food & Health',
    totalSpent: 720,
    lastPurchased: '2026-08-18',
    warningAlert: 'You purchased soft drinks 6 times this month and spent ₹720. Consider reducing purchase frequency.'
  },
  {
    name: 'Fresh Cow Milk',
    count: 12,
    category: 'Food & Health',
    totalSpent: 720,
    lastPurchased: '2026-08-24'
  },
  {
    name: 'Whole Wheat Bread',
    count: 8,
    category: 'Grocery',
    totalSpent: 380,
    lastPurchased: '2026-08-21'
  },
  {
    name: 'Cotton T-Shirts',
    count: 5,
    category: 'Clothing',
    totalSpent: 3200,
    lastPurchased: '2026-08-21',
    warningAlert: 'You already purchased 5 T-Shirts this month. Consider checking your clothing budget before another purchase.'
  },
  {
    name: 'Basmati Rice',
    count: 4,
    category: 'Grocery',
    totalSpent: 1000,
    lastPurchased: '2026-08-24'
  },
  {
    name: 'Herbal Shampoo',
    count: 2,
    category: 'Beauty & Personal Care',
    totalSpent: 770,
    lastPurchased: '2026-08-24'
  }
];

export const HEALTH_ANALYSIS_LIST: HealthSummaryItem[] = [
  {
    productName: 'Soft Drink',
    status: 'less_healthy',
    reason: 'Often high in added sugar with minimal micronutrient density.',
    frequency: 6,
    smartNote: 'You are purchasing this item frequently. Consider reducing purchase frequency and choosing lower-sugar alternatives.'
  },
  {
    productName: 'Biscuits & Cookies',
    status: 'limit',
    reason: 'Contains refined wheat flour and elevated sugar content.',
    frequency: 8,
    smartNote: 'High consumption frequency detected. Try substituting with roasted nuts or seed mixes.'
  },
  {
    productName: 'Rice',
    status: 'healthy',
    reason: 'Can be part of a balanced meal. Portion size and overall diet matter.',
    frequency: 4,
    smartNote: 'Good staple carb source. Pair with high protein lentils or leafy vegetables.'
  },
  {
    productName: 'Milk',
    status: 'healthy',
    reason: 'Rich in bioavailable calcium, riboflavin, and complete proteins.',
    frequency: 12,
    smartNote: 'Regular healthy consumption. Low-fat or fortified options provide lean nutrition.'
  },
  {
    productName: 'Whole Wheat Bread',
    status: 'healthy',
    reason: 'Contains dietary fiber supporting sustained metabolic energy.',
    frequency: 8,
    smartNote: 'Preferred over refined white bread. Check label for 100% whole grain flour.'
  },
  {
    productName: 'Butter',
    status: 'limit',
    reason: 'Concentrated source of saturated fatty acids and sodium.',
    frequency: 2,
    smartNote: 'Moderation is key. Substitute with cold-pressed olive or mustard oil for cooking.'
  }
];

export const SMART_SUGGESTIONS: SmartSuggestion[] = [
  {
    id: 'sug-1',
    type: 'spending',
    title: 'Frequent Beverage Expenditure',
    description: 'You purchased soft drinks 6 times this month and spent ₹720. Consider reducing purchase frequency to save ~₹480/month.',
    badge: 'Spending Suggestion',
    impact: 'warning',
    actionText: 'View Beverage Stats'
  },
  {
    id: 'sug-2',
    type: 'budget',
    title: 'Healthy Budget Buffer',
    description: 'You have ₹1,550 remaining in your monthly budget with 4 days left in the cycle. You are on track to save 15.5%!',
    badge: 'Budget Suggestion',
    impact: 'positive',
    actionText: 'Manage Budgets'
  },
  {
    id: 'sug-3',
    type: 'clothing',
    title: 'Clothing Spending Spike',
    description: 'You spent ₹3,200 on clothing this month (5 T-shirts), which is 25% more than last month. Check your wardrobe budget.',
    badge: 'Clothing Suggestion',
    impact: 'warning',
    actionText: 'Review Clothing'
  },
  {
    id: 'sug-4',
    type: 'shopping',
    title: 'Smart Grocery Route',
    description: 'You frequently purchase groceries and dairy. Verified nearby grocery shops and wholesale marts are available when you request location-based recommendations.',
    badge: 'Shopping Suggestion',
    impact: 'tip',
    actionText: 'Find Nearby Shops'
  },
  {
    id: 'sug-5',
    type: 'health',
    title: 'Dietary Balance Alert',
    description: '8 biscuit purchases and 6 sweetened soft drinks recorded. Replacing 50% with fresh fruits can improve your nutritional score by 34%.',
    badge: 'Health Suggestion',
    impact: 'info',
    actionText: 'See Health Summary'
  }
];

export const NEARBY_SHOPS_DATABASE: NearbyShop[] = [
  // Ahmedabad Shops
  {
    id: 'shop-1',
    name: 'Style Hub Men & Women Apparel',
    category: 'Clothing',
    distanceKm: 1.2,
    rating: 4.5,
    address: '14 Commerce House, CG Road, Navrangpura',
    area: 'Navrangpura',
    city: 'Ahmedabad',
    lat: 23.0338,
    lng: 72.5562,
    matchedItem: 'Jeans, T-Shirts, Formal Shirts, Trousers',
    inStockItems: ['Slim Fit Denim Jeans', 'Cotton Polo T-Shirts', 'Linen Formal Shirts', 'Chinos', 'Jackets'],
    offers: 'Flat 15% OFF on minimum purchase of ₹2,500',
    priceRange: '₹₹',
    phone: '+91 79 2640 1122',
    timing: '10:00 AM - 09:30 PM'
  },
  {
    id: 'shop-2',
    name: 'Denim & Casuals Factory Outlet',
    category: 'Clothing',
    distanceKm: 2.1,
    rating: 4.3,
    address: 'GF-05, Palladium Mall, Sarkhej - Gandhinagar Hwy, Thaltej',
    area: 'Thaltej',
    city: 'Ahmedabad',
    lat: 23.0534,
    lng: 72.5168,
    matchedItem: 'Jeans, Denim Jackets, Chinos',
    inStockItems: ['Stretch Denim', 'Distressed Jeans', 'Oversized Hoodies', 'Cargo Pants'],
    offers: 'Buy 2 Get 1 Free on all Casual Wear',
    priceRange: '₹₹',
    phone: '+91 79 4900 8800',
    timing: '11:00 AM - 10:00 PM'
  },
  {
    id: 'shop-3',
    name: 'FreshBasket Supermarket',
    category: 'Grocery',
    distanceKm: 0.8,
    rating: 4.7,
    address: 'Block B, Dev Arc Commercial Complex, SG Highway, Satellite',
    area: 'Satellite',
    city: 'Ahmedabad',
    lat: 23.0298,
    lng: 72.5074,
    matchedItem: 'Rice, Milk, Flour, Spices, Pulses, Cooking Oil',
    inStockItems: ['Basmati Rice 5kg', 'Sunflower Oil', 'Atta 10kg', 'Organic Spices', 'Pulses & Dal'],
    offers: 'Extra 5% cashback on grocery bills above ₹1,000',
    priceRange: '₹',
    phone: '+91 79 2686 3450',
    timing: '08:00 AM - 10:00 PM'
  },
  {
    id: 'shop-4',
    name: 'Amul Daily Needs & Parlour',
    category: 'Food & Health',
    distanceKm: 0.4,
    rating: 4.6,
    address: 'Shop 3, University Plaza, Vijay Cross Roads, Navrangpura',
    area: 'Navrangpura',
    city: 'Ahmedabad',
    lat: 23.0385,
    lng: 72.5446,
    matchedItem: 'Milk, Curd, Butter, Cheese, Bread, Paneer',
    inStockItems: ['Amul Gold Milk', 'Fresh Paneer 200g', 'Butter 500g', 'Greek Yogurt', 'Whole Wheat Bread'],
    offers: 'Fresh morning stock guaranteed by 6:30 AM',
    priceRange: '₹',
    phone: '+91 98250 12345',
    timing: '06:30 AM - 10:30 PM'
  },
  {
    id: 'shop-5',
    name: 'Wellness Forever Chemists & Personal Care',
    category: 'Beauty & Personal Care',
    distanceKm: 1.5,
    rating: 4.4,
    address: 'Opp. Gulmohar Park Mall, Satellite',
    area: 'Satellite',
    city: 'Ahmedabad',
    lat: 23.0221,
    lng: 72.5185,
    matchedItem: 'Shampoo, Skincare, Haircare, Hygiene, First Aid',
    inStockItems: ['Anti-Dandruff Shampoo', 'Sunscreen SPF 50', 'Moisturizer', 'Hand Wash', 'Multivitamins'],
    offers: 'Up to 20% discount on generic essentials & personal care',
    priceRange: '₹₹',
    phone: '+91 79 6605 9999',
    timing: '24 Hours Open'
  },
  {
    id: 'shop-6',
    name: 'Reliance Digital Megastore',
    category: 'Electronics',
    distanceKm: 2.4,
    rating: 4.2,
    address: 'Himalaya Mall, Drive In Road, Memnagar',
    area: 'Memnagar',
    city: 'Ahmedabad',
    lat: 23.0519,
    lng: 72.5312,
    matchedItem: 'Cables, Earphones, Chargers, Power Banks, Smartwatches',
    inStockItems: ['Type-C Fast Cables', 'TWS Earbuds', '65W GaN Chargers', 'Bluetooth Speakers'],
    offers: 'Instant ₹500 off with select debit/credit cards',
    priceRange: '₹₹₹',
    phone: '+91 79 3001 5000',
    timing: '10:30 AM - 09:30 PM'
  },
  {
    id: 'shop-7',
    name: 'Nature Organics Farm Store',
    category: 'Grocery',
    distanceKm: 1.8,
    rating: 4.8,
    address: 'Shop 12, Sunrise Arcade, Vastrapur Lake Road',
    area: 'Vastrapur',
    city: 'Ahmedabad',
    lat: 23.0360,
    lng: 72.5293,
    matchedItem: 'Organic Grains, Cold Pressed Oils, Jaggery, Herbal Honey',
    inStockItems: ['Cold Pressed Groundnut Oil', 'Organic Brown Rice', 'Raw Forest Honey', 'Organic Millets'],
    offers: '10% discount on organic staples every Wednesday',
    priceRange: '₹₹',
    phone: '+91 99090 54321',
    timing: '09:00 AM - 09:00 PM'
  },
  {
    id: 'shop-8',
    name: 'The French Crust Artisan Bakery & Cafe',
    category: 'Food & Health',
    distanceKm: 1.1,
    rating: 4.7,
    address: 'GF, Sindhu Bhavan Road, Bodakdev',
    area: 'Bodakdev',
    city: 'Ahmedabad',
    lat: 23.0415,
    lng: 72.5110,
    matchedItem: 'Sourdough Bread, Croissants, Gluten-Free Cookies, Cake',
    inStockItems: ['Artisan Sourdough Loaf', 'Butter Croissant', 'Sugar-free Oat Cookies', 'Espresso Beans'],
    offers: 'Buy 1 Get 1 on fresh bread loaves after 8:00 PM',
    priceRange: '₹₹',
    phone: '+91 79 2692 7788',
    timing: '08:30 AM - 11:00 PM'
  },

  // Surat Shops
  {
    id: 'shop-surat-1',
    name: 'Surat Textile & Cotton Hub',
    category: 'Clothing',
    distanceKm: 0.9,
    rating: 4.8,
    address: 'Shop 101, Millennium Textile Market, Ring Road',
    area: 'Ring Road',
    city: 'Surat',
    lat: 21.1959,
    lng: 72.8302,
    matchedItem: 'Cotton Kurtas, Formal Shirts, Jeans, Sarees, T-Shirts',
    inStockItems: ['Pure Cotton Shirts', 'Stretch Denim', 'Traditional Kurtas', 'Linen Trousers'],
    offers: 'Wholesale rates on orders of 3+ apparel items',
    priceRange: '₹',
    phone: '+91 261 234 5678',
    timing: '09:30 AM - 09:00 PM'
  },
  {
    id: 'shop-surat-2',
    name: 'Diamond City Supermarket',
    category: 'Grocery',
    distanceKm: 1.3,
    rating: 4.6,
    address: 'Adajan Gam, Hazira Road, Near Prime Arcade',
    area: 'Adajan',
    city: 'Surat',
    lat: 21.1963,
    lng: 72.7933,
    matchedItem: 'Basmati Rice, Surati Spices, Cooking Oil, Dal, Ghee',
    inStockItems: ['Kolam Rice 10kg', 'Pure Cow Ghee', 'Surati Masala', 'Organic Pulses'],
    offers: 'Flat 8% discount on monthly family rations',
    priceRange: '₹₹',
    phone: '+91 261 278 9900',
    timing: '08:00 AM - 10:00 PM'
  },
  {
    id: 'shop-surat-3',
    name: 'Sumul Dairy Fresh Parlour & Organic Snacks',
    category: 'Food & Health',
    distanceKm: 0.5,
    rating: 4.7,
    address: 'Sumul Dairy Road, Near Railway Station',
    area: 'Varachha',
    city: 'Surat',
    lat: 21.2052,
    lng: 72.8415,
    matchedItem: 'Milk, Sumul Butter, Buttermilk, Paneer, Sweet Curd',
    inStockItems: ['Sumul Gold Cow Milk', 'Fresh Paneer', 'Chaas (Buttermilk)', 'Shrikhand'],
    offers: 'Guaranteed morning freshness & chilled beverages',
    priceRange: '₹',
    phone: '+91 261 253 4567',
    timing: '06:00 AM - 10:30 PM'
  },
  {
    id: 'shop-surat-4',
    name: 'Croma Electronics & Gadget Zone',
    category: 'Electronics',
    distanceKm: 2.0,
    rating: 4.5,
    address: 'VR Surat Mall, Dumas Road, Magdalla',
    area: 'Dumas Road',
    city: 'Surat',
    lat: 21.1444,
    lng: 72.7483,
    matchedItem: 'Earphones, Type-C Cables, Fast Chargers, Power Banks',
    inStockItems: ['Wireless Earbuds', '65W Fast Charger', 'Power Bank 20000mAh', 'Smart Watch'],
    offers: 'Instant ₹300 voucher on student IDs',
    priceRange: '₹₹₹',
    phone: '+91 261 672 0000',
    timing: '11:00 AM - 09:30 PM'
  },

  // Mumbai Shops
  {
    id: 'shop-mumbai-1',
    name: 'Nature\'s Basket Gourmet & Organic Mart',
    category: 'Grocery',
    distanceKm: 1.2,
    rating: 4.7,
    address: 'Hill Road, Near Bandra Police Station, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    lat: 19.0596,
    lng: 72.8295,
    matchedItem: 'Organic Bread, Cold Pressed Oils, Berries, Almond Milk',
    inStockItems: ['Almond Milk', 'Gluten Free Oats', 'Extra Virgin Olive Oil', 'Avocados'],
    offers: '10% OFF with contactless UPI payment',
    priceRange: '₹₹₹',
    phone: '+91 22 2642 1100',
    timing: '08:00 AM - 10:00 PM'
  },
  {
    id: 'shop-mumbai-2',
    name: 'Fabindia Apparel & Organic Living',
    category: 'Clothing',
    distanceKm: 1.8,
    rating: 4.6,
    address: 'Linking Road, Khar West',
    area: 'Khar West',
    city: 'Mumbai',
    lat: 19.0688,
    lng: 72.8360,
    matchedItem: 'Linen Shirts, Cotton Kurtas, Indigo Denim, Silk Sarees',
    inStockItems: ['Pure Linen Shirts', 'Cotton Chinos', 'Handloom Kurtas', 'Jackets'],
    offers: 'Members get 15% loyalty credits on new arrivals',
    priceRange: '₹₹₹',
    phone: '+91 22 2605 4500',
    timing: '10:30 AM - 09:30 PM'
  },
  {
    id: 'shop-mumbai-3',
    name: 'Noble Plus Pharmacy & Wellness Center',
    category: 'Beauty & Personal Care',
    distanceKm: 0.6,
    rating: 4.8,
    address: 'Linking Road, Santacruz West',
    area: 'Santacruz West',
    city: 'Mumbai',
    lat: 19.0825,
    lng: 72.8385,
    matchedItem: 'Dermatology Skincare, Shampoos, Multivitamins, Organic Serums',
    inStockItems: ['Sunscreen SPF 50', 'Vitamin C Serum', 'Biotin Capsules', 'Ceramide Cream'],
    offers: 'Flat 15% off on all wellness supplements',
    priceRange: '₹₹',
    phone: '+91 22 2660 7890',
    timing: '24 Hours Open'
  },

  // Delhi Shops
  {
    id: 'shop-delhi-1',
    name: 'Modern Bazaar Superstore',
    category: 'Grocery',
    distanceKm: 1.0,
    rating: 4.7,
    address: '49-B, Khan Market, Rabindra Nagar',
    area: 'Khan Market',
    city: 'Delhi',
    lat: 28.6003,
    lng: 77.2273,
    matchedItem: 'Artisan Breads, Whole Grains, Dairy, Imported Cheeses',
    inStockItems: ['Whole Wheat Sourdough', 'A2 Desi Cow Milk', 'Extra Virgin Olive Oil', 'Organic Dal'],
    offers: 'Free doorstep express delivery within 45 mins',
    priceRange: '₹₹₹',
    phone: '+91 11 2465 4321',
    timing: '09:00 AM - 10:30 PM'
  },
  {
    id: 'shop-delhi-2',
    name: 'Westside Fashion & Lifestyle Outpost',
    category: 'Clothing',
    distanceKm: 2.2,
    rating: 4.5,
    address: 'Block A, Connaught Place, Central Delhi',
    area: 'Connaught Place',
    city: 'Delhi',
    lat: 28.6328,
    lng: 77.2197,
    matchedItem: 'Casual Denim, Polo Shirts, Formal Trousers, Blazers',
    inStockItems: ['Slim Fit Denim', 'Supima Cotton Tees', 'Casual Blazers', 'Sneakers'],
    offers: 'End of season flat 30% discount on selected racks',
    priceRange: '₹₹',
    phone: '+91 11 4151 7890',
    timing: '10:30 AM - 09:30 PM'
  },

  // Bengaluru Shops
  {
    id: 'shop-blr-1',
    name: 'Nature Organics & Millet Co.',
    category: 'Food & Health',
    distanceKm: 0.7,
    rating: 4.8,
    address: '80 Feet Road, 4th Block, Koramangala',
    area: 'Koramangala',
    city: 'Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    matchedItem: 'Millets, Cold Pressed Coconut Oil, Organic Honey, Sprouted Flour',
    inStockItems: ['Foxtail Millet', 'Cold Pressed Mustard Oil', 'Wild Raw Honey', 'Ragi Flour'],
    offers: '10% discount on first organic grocery cart',
    priceRange: '₹₹',
    phone: '+91 80 2553 1122',
    timing: '08:00 AM - 09:30 PM'
  },
  {
    id: 'shop-blr-2',
    name: 'Decathlon & Urban Active Store',
    category: 'Clothing',
    distanceKm: 2.5,
    rating: 4.7,
    address: '100 Feet Road, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    lat: 12.9719,
    lng: 77.6412,
    matchedItem: 'Sportswear, Quick Dry T-Shirts, Track Pants, Walking Shoes',
    inStockItems: ['Breathable Running Tees', 'Gym Shorts', 'Trekking Pants', 'Comfort Socks'],
    offers: '2-Year warranty on all active apparel stitches',
    priceRange: '₹₹',
    phone: '+91 80 4960 7000',
    timing: '10:00 AM - 10:00 PM'
  },

  // Pune Shops
  {
    id: 'shop-pune-1',
    name: 'Chitale Bandhu Dairy & Confectionery',
    category: 'Food & Health',
    distanceKm: 0.9,
    rating: 4.9,
    address: 'Deccan Gymkhana, FC Road, Shivaji Nagar',
    area: 'Shivaji Nagar',
    city: 'Pune',
    lat: 18.5204,
    lng: 73.8407,
    matchedItem: 'Cow Milk, Shrikhand, Bakarwadi, Pure Ghee, Butter',
    inStockItems: ['Chitale Cow Milk', 'Mango Shrikhand', 'Special Bakarwadi', 'Pure Cow Ghee'],
    offers: 'Freshly packed morning dairy batches everyday',
    priceRange: '₹',
    phone: '+91 20 2567 8900',
    timing: '07:30 AM - 09:30 PM'
  },
  {
    id: 'shop-pune-2',
    name: 'Dorabjee\'s Supermarket & Deli',
    category: 'Grocery',
    distanceKm: 1.6,
    rating: 4.7,
    address: 'Pavillion Mall, Senapati Bapat Road',
    area: 'SB Road',
    city: 'Pune',
    lat: 18.5323,
    lng: 73.8298,
    matchedItem: 'Whole Grains, Cheese, Bakery Breads, Beverages, Spices',
    inStockItems: ['Artisan Bakery Loaf', 'Aged Cheddar', 'Organic Basmati Rice', 'Cold Pressed Oil'],
    offers: 'Special weekend bundling discounts on family grocery',
    priceRange: '₹₹',
    phone: '+91 20 2565 0000',
    timing: '09:00 AM - 10:00 PM'
  },

  // Jaipur Shops
  {
    id: 'shop-jaipur-1',
    name: 'Jaipur Cotton Craft & Handloom Emporium',
    category: 'Clothing',
    distanceKm: 1.1,
    rating: 4.8,
    address: 'MI Road, Near Raj Mandir Cinema',
    area: 'MI Road',
    city: 'Jaipur',
    lat: 26.9157,
    lng: 75.8070,
    matchedItem: 'Block Print Kurtas, Cotton Shirts, Indigo Jeans, Bed Linen',
    inStockItems: ['Jaipuri Block Print Shirts', 'Pure Cotton Kurtas', 'Handcrafted Nehru Jackets'],
    offers: '15% instant discount on traditional block prints',
    priceRange: '₹₹',
    phone: '+91 141 237 4500',
    timing: '10:00 AM - 09:00 PM'
  },
  {
    id: 'shop-jaipur-2',
    name: 'Saras Dairy Parlour & Super Mart',
    category: 'Food & Health',
    distanceKm: 0.6,
    rating: 4.6,
    address: 'Malviya Nagar Sector 3, Near World Trade Park',
    area: 'Malviya Nagar',
    city: 'Jaipur',
    lat: 26.8530,
    lng: 75.8050,
    matchedItem: 'Saras Toned Milk, Fresh Paneer, Ghee, Curd, Butter',
    inStockItems: ['Saras Gold Milk', 'Fresh Desi Paneer', 'Pure Danedar Ghee', 'Sweet Lassi'],
    offers: 'Chilled dairy stocks replenished twice daily',
    priceRange: '₹',
    phone: '+91 141 272 1200',
    timing: '06:00 AM - 10:00 PM'
  }
];
