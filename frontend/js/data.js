/**
 * MediCare Pharmacy - Product Data
 * Mock data for the online pharmacy application
 * 
 * IMPORTANT: requiresApproval property determines checkout behavior
 * - true: Prescription drugs, require pharmacist approval before purchase
 * - false: OTC products, can be purchased immediately
 */

// Currency configuration (display all prices in Kenyan Shillings)
const CURRENCY = {
  symbol: 'KSh',
  code: 'KES',
  // Conversion rate from USD to KES for the mock prices below
  usdToKesRate: 130
};

/**
 * Convert a USD amount to formatted Kenyan Shillings text.
 * @param {number} amountUSD - Raw amount in USD (as stored in mock data)
 * @returns {string} Formatted currency string (e.g., "KSh 3,248.70")
 */
function formatPrice(amountUSD) {
  const numericAmount = Number(amountUSD) || 0;
  const amountKes = numericAmount * CURRENCY.usdToKesRate;
  return `${CURRENCY.symbol} ${amountKes.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Product Data with real images
const PRODUCTS = [
  // ==========================================
  // PRESCRIPTION DRUGS
  // ==========================================
  {
    id: 1,
    name: "Amoxicillin 500mg",
    description: "Broad-spectrum antibiotic for bacterial infections. Requires prescription.",
    price: 24.99,
    category: "Antibiotics",
    image: "images/products/antibiotic.png",
    requiresApproval: true,
    stock: 50
  },
  {
    id: 2,
    name: "Metformin 850mg",
    description: "Oral diabetes medication for type 2 diabetes management.",
    price: 18.50,
    category: "Diabetes",
    image: "images/products/antibiotic.png",
    requiresApproval: true,
    stock: 100
  },
  {
    id: 3,
    name: "Lisinopril 10mg",
    description: "ACE inhibitor for high blood pressure and heart failure treatment.",
    price: 22.00,
    category: "Cardiovascular",
    image: "images/products/pain-relief.png",
    requiresApproval: true,
    stock: 75
  },
  {
    id: 4,
    name: "Omeprazole 20mg",
    description: "Proton pump inhibitor for acid reflux and stomach ulcers.",
    price: 15.99,
    category: "Gastrointestinal",
    image: "images/products/antibiotic.png",
    requiresApproval: true,
    stock: 120
  },
  {
    id: 5,
    name: "Atorvastatin 40mg",
    description: "Statin medication for lowering cholesterol levels.",
    price: 28.50,
    category: "Cardiovascular",
    image: "images/products/pain-relief.png",
    requiresApproval: true,
    stock: 80
  },
  {
    id: 6,
    name: "Sertraline 50mg",
    description: "SSRI antidepressant for depression and anxiety disorders.",
    price: 32.00,
    category: "Mental Health",
    image: "images/products/supplement.png",
    requiresApproval: true,
    stock: 60
  },
  {
    id: 7,
    name: "Azithromycin 250mg",
    description: "Macrolide antibiotic for respiratory and skin infections.",
    price: 35.99,
    category: "Antibiotics",
    image: "images/products/antibiotic.png",
    requiresApproval: true,
    stock: 45
  },
  {
    id: 8,
    name: "Levothyroxine 100mcg",
    description: "Thyroid hormone replacement for hypothyroidism.",
    price: 12.50,
    category: "Hormones",
    image: "images/products/pain-relief.png",
    requiresApproval: true,
    stock: 90
  },

  // ==========================================
  // OTC PRODUCTS
  // ==========================================
  {
    id: 9,
    name: "Pregnancy Test Kit",
    description: "Early detection home pregnancy test. 99% accuracy. Results in 3 minutes.",
    price: 8.99,
    category: "Diagnostics",
    image: "images/products/device.png",
    requiresApproval: false,
    stock: 200
  },
  {
    id: 10,
    name: "HIV Self-Test Kit",
    description: "Confidential at-home HIV screening. FDA approved with 99.9% accuracy.",
    price: 29.99,
    category: "Diagnostics",
    image: "images/products/first-aid.png",
    requiresApproval: false,
    stock: 150
  },
  {
    id: 11,
    name: "Condoms (12 Pack)",
    description: "Latex condoms with reservoir tip. Lubricated for comfort.",
    price: 12.99,
    category: "Sexual Health",
    image: "images/products/first-aid.png",
    requiresApproval: false,
    stock: 300
  },
  {
    id: 12,
    name: "Vitamin D3 1000IU",
    description: "Daily vitamin D supplement for bone health and immunity. 60 tablets.",
    price: 14.50,
    category: "Vitamins",
    image: "images/products/supplement.png",
    requiresApproval: false,
    stock: 180
  },
  {
    id: 13,
    name: "Multivitamin Complex",
    description: "Complete daily multivitamin with minerals. 90 tablets.",
    price: 19.99,
    category: "Vitamins",
    image: "images/products/supplement.png",
    requiresApproval: false,
    stock: 220
  },
  {
    id: 14,
    name: "Paracetamol 500mg",
    description: "Pain reliever and fever reducer. Pack of 20 tablets.",
    price: 5.99,
    category: "Pain Relief",
    image: "images/products/pain-relief.png",
    requiresApproval: false,
    stock: 500
  },
  {
    id: 15,
    name: "Ibuprofen 400mg",
    description: "Anti-inflammatory pain relief. Pack of 24 tablets.",
    price: 7.49,
    category: "Pain Relief",
    image: "images/products/pain-relief.png",
    requiresApproval: false,
    stock: 400
  },
  {
    id: 16,
    name: "Vitamin C 1000mg",
    description: "High-potency vitamin C for immune support. 30 effervescent tablets.",
    price: 11.99,
    category: "Vitamins",
    image: "images/products/supplement.png",
    requiresApproval: false,
    stock: 250
  },
  {
    id: 17,
    name: "Antihistamine Tablets",
    description: "Non-drowsy allergy relief. 30 tablets.",
    price: 9.99,
    category: "Allergy",
    image: "images/products/antibiotic.png",
    requiresApproval: false,
    stock: 180
  },
  {
    id: 18,
    name: "First Aid Kit",
    description: "Complete 100-piece emergency first aid kit for home use.",
    price: 24.99,
    category: "First Aid",
    image: "images/products/first-aid.png",
    requiresApproval: false,
    stock: 100
  },
  {
    id: 19,
    name: "Digital Thermometer",
    description: "Fast and accurate digital thermometer with fever alert.",
    price: 15.99,
    category: "Devices",
    image: "images/products/device.png",
    requiresApproval: false,
    stock: 120
  },
  {
    id: 20,
    name: "Blood Pressure Monitor",
    description: "Automatic upper arm blood pressure monitor with memory function.",
    price: 45.99,
    category: "Devices",
    image: "images/products/device.png",
    requiresApproval: false,
    stock: 60
  }
];

// Mock orders data for dashboard
const MOCK_ORDERS = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    items: ["Vitamin D3 1000IU", "Paracetamol 500mg"],
    total: 20.49,
    status: "delivered"
  },
  {
    id: "ORD-002",
    date: "2024-01-18",
    items: ["Amoxicillin 500mg"],
    total: 24.99,
    status: "pending",
    requiresApproval: true
  },
  {
    id: "ORD-003",
    date: "2024-01-20",
    items: ["Multivitamin Complex", "First Aid Kit"],
    total: 44.98,
    status: "processing"
  },
  {
    id: "ORD-004",
    date: "2024-01-22",
    items: ["Metformin 850mg", "Lisinopril 10mg"],
    total: 40.50,
    status: "approved",
    requiresApproval: true
  }
];

// Available appointment time slots
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

// Categories for filtering
const CATEGORIES = [
  "All",
  "Antibiotics",
  "Cardiovascular",
  "Diabetes",
  "Diagnostics",
  "Vitamins",
  "Pain Relief",
  "Sexual Health",
  "Allergy",
  "First Aid",
  "Devices",
  "Mental Health",
  "Hormones",
  "Gastrointestinal"
];
