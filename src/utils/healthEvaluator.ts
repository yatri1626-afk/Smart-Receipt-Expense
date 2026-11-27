export interface HealthEvaluation {
  status?: 'healthy' | 'limit' | 'less_healthy';
  isFood?: boolean;
  note: string;
  smartNote: string;
  healthyAlternative?: string;
  category: string;
}

/**
 * Checks whether an item belongs strictly to Food, Beverages, or Grocery pantry categories.
 * Filters out apparel, electronics, cosmetics, household cleaners, stationery, etc.
 */
export function isFoodOrGroceryItem(name: string = '', category: string = ''): boolean {
  const cat = (category || '').toLowerCase().trim();
  const lower = (name || '').toLowerCase().trim();

  // If item name is empty or a generic placeholder like "Item 1", "Item 2", "Product",
  // it is NOT considered a food item and must never be auto-labeled as healthy
  if (!lower) return false;
  if (/^item(\s*\d*)?$/i.test(lower) || /^product(\s*\d*)?$/i.test(lower)) {
    return false;
  }

  // 1. Explicitly Excluded Non-Food Categories
  const nonFoodCategories = [
    'clothing',
    'clothes',
    'apparel',
    'footwear',
    'fashion',
    'electronics',
    'electronic',
    'gadget',
    'electrical',
    'beauty',
    'beauty & personal care',
    'personal care',
    'cosmetics',
    'cosmetic',
    'skincare',
    'haircare',
    'home & household',
    'household',
    'home',
    'cleaning',
    'cleaner',
    'cleaning supplies',
    'kitchenware',
    'decor',
    'books',
    'books & education',
    'education',
    'stationery',
    'office supplies',
    'hardware',
    'furniture',
    'appliances',
    'automotive',
    'toys',
    'sports',
    'fitness'
  ];

  if (nonFoodCategories.some(nfc => cat === nfc || cat.startsWith(nfc) || cat.includes(nfc))) {
    // Unless item name clearly indicates a grocery/food item
    const explicitFoodMatch = [
      'milk', 'bread', 'rice', 'wheat', 'atta', 'dal', 'pulse', 'egg', 'oil',
      'sugar', 'salt', 'fruit', 'vegetable', 'snack', 'drink', 'tea', 'coffee',
      'biscuit', 'juice', 'butter', 'cheese', 'paneer', 'curd', 'dahi'
    ].some(fw => lower.includes(fw));

    if (!explicitFoodMatch) {
      return false;
    }
  }

  // 2. Explicit Non-Food Item Keywords (Apparel, Tech, Toiletries, Cleaners, Stationery, Household)
  const nonFoodKeywords = [
    // Apparel & Footwear
    'shirt', 't-shirt', 'tshirt', 'jeans', 'pant', 'pants', 'trousers', 'suit',
    'dress', 'saree', 'kurta', 'kurti', 'dupatta', 'socks', 'jacket', 'hoodie',
    'sweater', 'shoes', 'sneakers', 'sandals', 'slippers', 'flip flop', 'belt',
    'wallet', 'handbag', 'backpack', 'cap', 'hat', 'tie', 'scarf', 'underwear',
    'vest', 'bra', 'briefs', 'leggings', 'shorts', 'towel', 'bedsheet', 'blanket',

    // Electronics & Hardware
    'headphone', 'earphone', 'airpod', 'earbuds', 'charger', 'cable', 'usb',
    'adapter', 'battery', 'power bank', 'phone', 'smartphone', 'mobile', 'case',
    'cover', 'screen guard', 'tempered glass', 'laptop', 'mouse', 'keyboard',
    'monitor', 'pen drive', 'hard drive', 'speaker', 'bulb', 'led', 'lamp',
    'torch', 'plug', 'switch', 'socket', 'wire', 'fan', 'iron',

    // Toiletries, Cosmetics & Personal Care
    'shampoo', 'conditioner', 'hair oil', 'hair dye', 'hair color', 'soap',
    'body wash', 'shower gel', 'face wash', 'facewash', 'facial', 'cleanser',
    'moisturizer', 'lotion', 'body lotion', 'sunscreen', 'cream', 'serum',
    'perfume', 'deodorant', 'deo', 'body spray', 'fragrance', 'cologne',
    'lipstick', 'lip balm', 'eyeliner', 'kajal', 'mascara', 'foundation',
    'nail polish', 'nail paint', 'cotton pads', 'sanitary', 'pad', 'tampon',
    'diaper', 'wipes', 'tissue paper', 'toilet paper', 'napkin', 'shaving cream',
    'razor', 'blade', 'aftershave', 'toothbrush', 'brush', 'toothpaste',
    'mouthwash', 'floss',

    // Cleaning & Household Supplies
    'detergent', 'washing powder', 'surf', 'ariel', 'tide', 'rin', 'fabric softener',
    'comfort', 'bleach', 'stain remover', 'dishwash', 'dish soap', 'vim', 'pril',
    'scrub', 'sponge', 'floor cleaner', 'lysol', 'harpic', 'toilet cleaner',
    'glass cleaner', 'colin', 'broom', 'mop', 'wiper', 'duster', 'garbage bag',
    'trash bag', 'air freshener', 'odonil', 'all out', 'good knight', 'mosquito',
    'repellent', 'hit spray', 'insecticide', 'bucket', 'mug', 'container', 'bottle',
    'plate', 'spoon', 'fork', 'cup', 'glass', 'cooker', 'pan', 'knife',

    // Stationery & Office
    'notebook', 'register', 'diary', 'pen', 'ball pen', 'gel pen', 'pencil',
    'eraser', 'sharpener', 'ruler', 'scale', 'stapler', 'scissors', 'tape',
    'glue', 'fevicol', 'marker', 'highlighter', 'calculator', 'envelope', 'folder',
    'paper', 'card'
  ];

  if (nonFoodKeywords.some(kw => lower.includes(kw))) {
    return false;
  }

  // 3. Accepted Food & Grocery Categories
  const foodCategories = [
    'grocery',
    'glossary',
    'food & health',
    'food',
    'beverages',
    'beverage',
    'snacks & confectionery',
    'fruits & vegetables',
    'vegetables',
    'fruits',
    'dairy & bakery',
    'dairy',
    'bakery',
    'staples',
    'pantry',
    'grains',
    'spices',
    'health products',
    'household pantry'
  ];

  if (foodCategories.some(fc => cat.includes(fc))) {
    return true;
  }

  // 4. Match against common food/grocery ingredients, beverages, spices, and cold drink brands
  const foodKeywords = [
    // Cold Drinks, Sodas, Beverages & Juices
    'cold drink', 'colddrink', 'soft drink', 'softdrink', 'soda', 'cola', 'coke', 'coca cola',
    'pepsi', 'sprite', 'fanta', 'mirinda', 'mountain dew', 'dew', '7up', 'seven up', 'limca',
    'thums up', 'thumsup', 'thumz up', 'appy fizz', 'fizz', 'sting', 'red bull', 'redbull',
    'monster energy', 'monster', 'energy drink', 'maaza', 'frooti', 'slice', 'tang', 'rasna',
    'sharbat', 'squash', 'syrup', 'iced tea', 'ice tea', 'bubble tea', 'boba', 'bovonto',
    'campa', 'campa cola', 'jeera soda', 'bindu fizz', 'lahori zeera', 'fruit beer', 'rooh afza',
    'drink', 'juice', 'beverage', 'water', 'mineral water', 'coconut water', 'chaas', 'buttermilk', 'lassi',
    
    // Dairy, Staples, Grains & Cooking Essentials
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

/**
 * Robust dietary & nutritional classification engine for receipt items.
 * Accurately categorizes pantry staples, portion-limited foods, and less healthy items
 * (specifically ensuring cold drinks, sodas, colas, energy drinks, and sugary snacks are flagged).
 */
export function evaluateItemHealth(name: string, category: string = 'Food & Health'): HealthEvaluation {
  const isFood = isFoodOrGroceryItem(name, category);

  // If this is NOT a food, beverage, or grocery edible item, it does NOT receive any health status or tag
  if (!isFood) {
    return {
      status: undefined,
      isFood: false,
      category: category || 'Household',
      note: '',
      smartNote: ''
    };
  }

  const lower = (name || '').toLowerCase().trim();

  // -------------------------------------------------------------------------
  // 1. COLD DRINKS, SODAS, CARBONATED & HIGH-SUGAR BEVERAGES (LESS HEALTHY)
  // -------------------------------------------------------------------------
  const isColdDrinkOrSoda = 
    lower.includes('cold drink') ||
    lower.includes('colddrink') ||
    lower.includes('soft drink') ||
    lower.includes('softdrink') ||
    lower.includes('carbonated') ||
    lower.includes('aerated') ||
    lower.includes('soda') ||
    lower.includes('cola') ||
    lower.includes('coke') ||
    lower.includes('coca cola') ||
    lower.includes('pepsi') ||
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
    lower.includes('rasna') ||
    lower.includes('tang') ||
    lower.includes('sharbat') ||
    lower.includes('squash') ||
    lower.includes('iced tea') ||
    lower.includes('ice tea') ||
    lower.includes('bubble tea') ||
    lower.includes('boba') ||
    lower.includes('flavored syrup') ||
    lower.includes('flavoured syrup') ||
    lower.includes('bovonto') ||
    lower.includes('campa') ||
    lower.includes('gatorade') ||
    lower.includes('rooh afza') ||
    lower.includes('glucon');

  if (isColdDrinkOrSoda) {
    return {
      status: 'less_healthy',
      category: 'Less Healthy / Sugar',
      note: 'Ultra-processed cold drink high in added refined sugar (approx. 25-35g per 250ml) and empty calories with high glycemic spike. Unhealthy for daily diet.',
      smartNote: 'Less Healthy / Sugar • High Sugar Load',
      healthyAlternative: 'Chilled Coconut Water, Fresh Lime Mint Water (Nimbu Pani with no sugar), Spiced Buttermilk (Chaas), or Unsweetened Herbal Iced Tea.'
    };
  }

  // -------------------------------------------------------------------------
  // 2. ULTRA-PROCESSED SNACKS, CONFECTIONERY & HIGH-SUGAR FOODS (LESS HEALTHY)
  // -------------------------------------------------------------------------
  if (
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
    lower.includes('sev') ||
    lower.includes('fried snack') ||
    lower.includes('candy') ||
    lower.includes('candies') ||
    lower.includes('toffee') ||
    lower.includes('lollipop') ||
    lower.includes('chocolate') ||
    lower.includes('cadbury') ||
    lower.includes('dairy milk') ||
    lower.includes('kitkat') ||
    lower.includes('snickers') ||
    lower.includes('marshmallow') ||
    lower.includes('gummy') ||
    lower.includes('gulab jamun') ||
    lower.includes('rasgulla') ||
    lower.includes('jalebi') ||
    lower.includes('kaju katli') ||
    lower.includes('mithai') ||
    lower.includes('pastry') ||
    lower.includes('pastries') ||
    lower.includes('cake') ||
    lower.includes('cakes') ||
    lower.includes('cupcake') ||
    lower.includes('donut') ||
    lower.includes('doughnut') ||
    lower.includes('brownie') ||
    lower.includes('ice cream') ||
    lower.includes('sundae') ||
    lower.includes('refined sugar') ||
    lower.includes('white sugar') ||
    lower.includes('glucose')
  ) {
    return {
      status: 'less_healthy',
      category: 'Snacks & Confectionery',
      note: 'High in refined sugars, saturated/trans fats, and sodium with negligible dietary fiber.',
      smartNote: 'Ultra-Processed • High Sugar/Fat',
      healthyAlternative: 'Roasted Makhana (Fox Nuts), Roasted Chana, Mixed Raw Walnuts & Almonds, or Fresh Seasonal Fruits.'
    };
  }

  // -------------------------------------------------------------------------
  // 3. PORTION-LIMIT FOODS (MODERATE NUTRITION / REFINED CARBS / HIGH SODIUM)
  // -------------------------------------------------------------------------
  if (
    lower.includes('biscuit') ||
    lower.includes('biscuits') ||
    lower.includes('cookie') ||
    lower.includes('cookies') ||
    lower.includes('rusk') ||
    lower.includes('parle-g') ||
    lower.includes('bourbon') ||
    lower.includes('oreo') ||
    lower.includes('noodles') ||
    lower.includes('instant noodles') ||
    lower.includes('maggi') ||
    lower.includes('top ramen') ||
    lower.includes('pasta') ||
    lower.includes('macaroni') ||
    lower.includes('white bread') ||
    lower.includes('toast') ||
    lower.includes('bun') ||
    lower.includes('pav') ||
    lower.includes('pizza') ||
    lower.includes('burger') ||
    lower.includes('french fries') ||
    lower.includes('butter') ||
    lower.includes('margarine') ||
    lower.includes('mayo') ||
    lower.includes('mayonnaise') ||
    lower.includes('cheese') ||
    lower.includes('cheese spread') ||
    lower.includes('cheese slice') ||
    lower.includes('ketchup') ||
    lower.includes('tomato ketchup') ||
    lower.includes('sauce') ||
    lower.includes('schezwan') ||
    lower.includes('pickle') ||
    lower.includes('achar') ||
    lower.includes('maida')
  ) {
    return {
      status: 'limit',
      category: 'Portion Controlled',
      note: 'Contains refined flour, added sodium, or saturated fats. Mindful portion control recommended.',
      smartNote: 'Moderate Portion • Watch Sodium/Fat',
      healthyAlternative: '100% Whole Wheat / Multigrain Bread, Homemade Mint Chutney, Unsalted White Butter, or Rolled Oats.'
    };
  }

  // -------------------------------------------------------------------------
  // 4. GENERALLY HEALTHY WHOLE FOODS & NUTRIENT-DENSE STAPLES
  // -------------------------------------------------------------------------
  if (
    lower.includes('milk') ||
    lower.includes('cow milk') ||
    lower.includes('toned milk') ||
    lower.includes('soya milk') ||
    lower.includes('almond milk') ||
    lower.includes('curd') ||
    lower.includes('dahi') ||
    lower.includes('yogurt') ||
    lower.includes('chaas') ||
    lower.includes('buttermilk') ||
    lower.includes('paneer') ||
    lower.includes('tofu') ||
    lower.includes('egg') ||
    lower.includes('eggs') ||
    lower.includes('rice') ||
    lower.includes('basmati') ||
    lower.includes('brown rice') ||
    lower.includes('atta') ||
    lower.includes('wheat') ||
    lower.includes('whole wheat') ||
    lower.includes('oats') ||
    lower.includes('muesli') ||
    lower.includes('quinoa') ||
    lower.includes('poha') ||
    lower.includes('dalia') ||
    lower.includes('dal') ||
    lower.includes('pulses') ||
    lower.includes('lentil') ||
    lower.includes('lentils') ||
    lower.includes('rajma') ||
    lower.includes('chole') ||
    lower.includes('chana') ||
    lower.includes('beans') ||
    lower.includes('sprouts') ||
    lower.includes('fruit') ||
    lower.includes('apple') ||
    lower.includes('banana') ||
    lower.includes('orange') ||
    lower.includes('pomegranate') ||
    lower.includes('papaya') ||
    lower.includes('guava') ||
    lower.includes('mango') ||
    lower.includes('grapes') ||
    lower.includes('berries') ||
    lower.includes('watermelon') ||
    lower.includes('coconut water') ||
    lower.includes('vegetable') ||
    lower.includes('spinach') ||
    lower.includes('palak') ||
    lower.includes('methi') ||
    lower.includes('tomato') ||
    lower.includes('onion') ||
    lower.includes('potato') ||
    lower.includes('cucumber') ||
    lower.includes('carrot') ||
    lower.includes('cabbage') ||
    lower.includes('cauliflower') ||
    lower.includes('broccoli') ||
    lower.includes('capsicum') ||
    lower.includes('green tea') ||
    lower.includes('almond') ||
    lower.includes('walnut') ||
    lower.includes('nuts') ||
    lower.includes('seeds') ||
    lower.includes('olive oil') ||
    lower.includes('mustard oil')
  ) {
    return {
      status: 'healthy',
      category: 'Wholesome Staples',
      note: 'Nutrient-dense whole food staple essential for balanced dietary health, providing vital micronutrients, proteins, or healthy fibers.',
      smartNote: 'Wholesome Staple • Nutrient Dense',
      healthyAlternative: 'Excellent nutritional choice for daily meals.'
    };
  }

  // Fallback for valid food categories
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('food') || catLower.includes('grocery') || catLower.includes('beverage') || catLower.includes('dairy') || catLower.includes('bakery')) {
    return {
      status: 'healthy',
      isFood: true,
      category: 'Grocery Staple',
      note: 'Standard household pantry food staple.',
      smartNote: 'General Pantry Item',
      healthyAlternative: 'Keep balanced alongside fresh vegetables and fiber.'
    };
  }

  return {
    status: undefined,
    isFood: false,
    category: category || 'Household',
    note: '',
    smartNote: ''
  };
}
