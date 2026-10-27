// PREHERITAGE - Wear the Stories of India
// Brand Data, Heritage Catalogs, and Curated Products

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  sku: string;
  createdAt?: string;
  category: string;
  subcategory?: string;
  collection?: string;
  region: string;
  state: string;
  price: number;
  mrp: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  badge?: "NEW" | "BESTSELLER" | "SALE" | "LIMITED_EDITION" | "LOW_STOCK";
  images: string[];
  videoUrl?: string;
  shortDesc: string;
  description: string;
  culturalStory: string;
  fabricDetails: string;
  careInstructions: string;
  sizeFitGuide: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  variants?: { id: string; size: string; color: string; colorCode?: string; stock: number; additionalPrice: number; isActive?: boolean }[];
  stock: number;
  status?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export const CATEGORIES = [
  {
    id: "sarees",
    name: "Sarees",
    slug: "sarees",
    description: "Six yards of unstitched poetry woven across the sacred looms of India.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "kurtas",
    name: "Kurtas & Tunics",
    slug: "kurtas",
    description: "Breathable silks and handspun khadi tailored for modern poise.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "lehengas",
    name: "Lehengas",
    slug: "lehengas",
    description: "Regal silhouettes adorned with zardozi, gota patti, and hand-embroidery.",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "handloom",
    name: "Handloom",
    slug: "handloom",
    description: "Pure GI-tagged heritage weaves from master artisan clusters.",
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "handicrafts",
    name: "Handicrafts & Decor",
    slug: "handicrafts",
    description: "Hand-chiseled brass, dhokra bell metal, and wooden heirloom artifacts.",
    image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "posters",
    name: "Art Posters",
    slug: "posters",
    description: "Limited-edition archival prints depicting India's timeless architectural marvels.",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "accessories",
    name: "Accessories & Shawls",
    slug: "accessories",
    description: "Pure Pashmina wraps, potlis, and handcrafted antique gold jewelry.",
    image: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=900",
  },
];

export const REGIONS = [
  {
    id: "kashmir",
    name: "Kashmir",
    state: "Jammu & Kashmir",
    slug: "kashmir",
    craft: "Pashmina & Sozni Needlework",
    story: "Woven high in the Himalayas, where Changthangi goat wool meets the centuries-old delicate art of Sozni needlework passed down through Kashmiri families.",
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh",
    slug: "varanasi",
    craft: "Kashi Katan Silk & Real Zari",
    story: "On the ghats of the Ganges, master weavers translate Mughal motifs and celestial flora into heavy real zari brocades on pit looms.",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "rajasthan",
    name: "Rajasthan",
    state: "Rajasthan",
    slug: "rajasthan",
    craft: "Gota Patti & Royal Bandhej",
    story: "From Jaipur to Jodhpur, desert women tie thousands of tiny knots on georgette and silk to create kaleidoscopic patterns inspired by royal coronation ceremonies.",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "gujarat",
    name: "Kutch & Patan",
    state: "Gujarat",
    slug: "gujarat",
    craft: "Double Ikkat Patola & Ajrakh",
    story: "Ancient block printers and silk weavers using organic indigo, madder root, and intricate double-warp resist dyeing that lasts generations.",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "bengal",
    name: "Bengal",
    state: "West Bengal",
    slug: "bengal",
    craft: "Jamdani & Kantha Stitches",
    story: "The finest muslin woven with discontinuous weft technique that was once described as 'woven wind' by ancient Roman travelers.",
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "tamilnadu",
    name: "Kanchipuram",
    state: "Tamil Nadu",
    slug: "tamilnadu",
    craft: "Temple Kanjeevaram Silks",
    story: "Interlocking korvai weaving technique incorporating temple borders, peacocks (Mayil), and Rudraksha beads dipped in pure silver-gold zari.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=900",
  },
];

export const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    title: "Varanasi Rangkat Kadwa Silk Saree in Antique Gold",
    slug: "varanasi-rangkat-kadwa-silk-saree",
    sku: "PRE-SAR-001",
    category: "sarees",
    collection: "Royal Courtyards",
    region: "varanasi",
    state: "Uttar Pradesh",
    price: 34999,
    mrp: 44999,
    discount: 22,
    rating: 4.9,
    reviewCount: 48,
    badge: "BESTSELLER",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1200",
    ],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-traditional-dress-41838-large.mp4",
    shortDesc: "Handwoven pure Katan silk saree featuring rare Kadwa technique with electroplated antique gold zari.",
    description: "Every single inch of this masterpiece is hand-manipulated on an authentic pit loom by national award-winning artisans of Varanasi. The Kadwa technique ensures that each motif is woven individually without any loose threads at the back, giving a velvety soft touch against the skin.",
    culturalStory: "Kadwa in Hindi means 'engraved' or 'carved'. Originating during the reign of the Mughal emperors, master weavers sat together for 4 to 6 months to craft a single saree for royal queens and court dancers.",
    fabricDetails: "100% Pure Mulberry Katan Silk (Silk Mark Certified), Tested Gold & Silver Zari",
    careInstructions: "Strictly dry clean only. Store wrapped in pure unbleached muslin cloth with natural neem leaves.",
    sizeFitGuide: "Length: 5.5 Metres | Width: 46 Inches | Unstitched Blouse Piece Included: 0.9 Metres",
    sizes: ["Free Size"],
    colors: [
      { name: "Antique Gold", hex: "#C5A869" },
      { name: "Crimson Maroon", hex: "#881337" },
      { name: "Deep Royal Emerald", hex: "#1B4332" },
    ],
    stock: 6,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "prod-2",
    title: "Chanderi Handspun Silk-Cotton Kurta Set with Zardozi Yoke",
    slug: "chanderi-handspun-silk-cotton-kurta-set",
    sku: "PRE-KUR-002",
    category: "kurtas",
    collection: "Awadh Opulence",
    region: "varanasi",
    state: "Madhya Pradesh",
    price: 12499,
    mrp: 15999,
    discount: 21,
    rating: 4.8,
    reviewCount: 34,
    badge: "NEW",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200",
    ],
    shortDesc: "Whisper-light Chanderi silhouette adorned with dabka, french knots, and semi-precious bead embroidery.",
    description: "Tailored to modern relaxed fit while honoring the translucent delicacy of legendary Chanderi weaves. Features a comfortable mandarin collar, deep pockets, and paired with straight-cut mulberry silk trousers.",
    culturalStory: "Chanderi was patronized by the Scindias and the Bundela royalty. Woven using raw silk warp and fine handspun cotton weft, it imparts a golden shimmer while staying remarkably cool in Indian summers.",
    fabricDetails: "Kurta: Chanderi Silk Cotton | Pants: Pure Mulberry Raw Silk | Lining: 100% Mulmul Cotton",
    careInstructions: "Dry clean first two washes, followed by gentle hand wash with delicate silk liquid.",
    sizeFitGuide: "Relaxed tailored fit. True to size. Model is 5'9\" wearing size Small.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ivory Ecru", hex: "#FAF7F2" },
      { name: "Sunset Ochre", hex: "#D4AF37" },
      { name: "Dusty Rose", hex: "#C48B9F" },
    ],
    stock: 14,
    isFeatured: true,
    isNewArrival: true,
  },
  {
    id: "prod-3",
    title: "Kashmir Pashmina Shawl with Sozni Hand Embroidery",
    slug: "kashmir-pashmina-shawl-sozni-embroidery",
    sku: "PRE-SHA-003",
    category: "accessories",
    collection: "Himalayan Whisper",
    region: "kashmir",
    state: "Jammu & Kashmir",
    price: 28999,
    mrp: 36000,
    discount: 19,
    rating: 5.0,
    reviewCount: 22,
    badge: "LIMITED_EDITION",
    images: [
      "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&q=80&w=1200",
    ],
    shortDesc: "Authentic GI-certified Changthangi cashmere hand-embroidered with micro-needle Sozni floral vines.",
    description: "So fine it glides through a signet ring. Spun from the fleece of the Capra Hircus goat grazing at 14,000 feet in Ladakh, this heirloom shawl takes over 180 artisan hours of relentless craftsmanship.",
    culturalStory: "Introduced to Kashmir in the 14th century by Mir Sayyid Ali Hamadani, Pashmina shawls were cherished gifts sent by Maharaja Ranjit Singh to Napoleon Bonaparte and Empress Josephine.",
    fabricDetails: "100% Hand-combed Grade A Changthangi Pashmina Cashmere (GI Registered)",
    careInstructions: "Professional specialized cashmere cleaning only. Air-dry flat in shade.",
    sizeFitGuide: "Dimensions: 200 cm x 100 cm (80 inches x 40 inches). Generous royal drape.",
    sizes: ["Free Size"],
    colors: [
      { name: "Natural Ivory", hex: "#FAF7F2" },
      { name: "Charcoal Slate", hex: "#262626" },
      { name: "Pashmina Camel", hex: "#C19A6B" },
    ],
    stock: 4,
    isFeatured: true,
  },
  {
    id: "prod-4",
    title: "Jaipur Handblock Gota Patti Lehenga Ensemble",
    slug: "jaipur-handblock-gota-patti-lehenga",
    sku: "PRE-LEH-004",
    category: "lehengas",
    collection: "Marwar Splendor",
    region: "rajasthan",
    state: "Rajasthan",
    price: 52999,
    mrp: 65000,
    discount: 18,
    rating: 4.9,
    reviewCount: 19,
    badge: "BESTSELLER",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200",
    ],
    shortDesc: "Flowing 16-kali raw silk skirt with real metallic ribbon appliqué and organza dupatta.",
    description: "The golden glimmer of pure Gota Patti embroidery creates dimensional light as you move. Crafted with an expansive 6-meter flair, structured can-can underlay, and fully lined with soft organic cotton.",
    culturalStory: "Gota embroidery originated in Rajasthan under royal Rajputana court patronage. Ribbon woven from gold and silver threads was cut into flower petals (phool) and leaves to adorn celebratory wedding trousseaus.",
    fabricDetails: "Lehenga & Blouse: Pure Matka Raw Silk | Dupatta: Handwoven Sheer Silk Organza",
    careInstructions: "Dry clean only. Steam iron on reverse side on low silk heat.",
    sizeFitGuide: "Customizable waist 28-38 inches. Skirt length: 43 inches. Blouse provided unstitched or custom stitched.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Royal Terracotta", hex: "#9E2A2B" },
      { name: "Kundan Gold", hex: "#C5A869" },
    ],
    stock: 5,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "prod-5",
    title: "Kutch Ajrakh Hand-Printed Modcloth Kurta",
    slug: "kutch-ajrakh-hand-printed-kurta",
    sku: "PRE-KUR-005",
    category: "kurtas",
    collection: "Desert Rhythm",
    region: "gujarat",
    state: "Gujarat",
    price: 6499,
    mrp: 8499,
    discount: 23,
    rating: 4.7,
    reviewCount: 41,
    badge: "SALE",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200",
    ],
    shortDesc: "16-stage naturally dyed resist block print on handloom modal silk.",
    description: "Ajrakh is an ancient craft celebrating geometric symmetry and celestial astronomy. Dyed using pomegranate rinds, wild tamarind seed gum, fermented iron rust, and organic indigo extracts.",
    culturalStory: "The name Ajrakh comes from the Arabic 'Azrak' meaning blue, and the Hindi phrase 'Aaj Rakh' (keep it today). The artisans of Dhamadka and Ajrakhpur in Kutch have nurtured this complex alchemy for millennia.",
    fabricDetails: "100% Handloom Modal Silk, All-Natural Vegetable and Mineral Dyes",
    careInstructions: "Wash with mild non-chemical soap. Dry inside out in shaded breeze.",
    sizeFitGuide: "Regular straight fit with side slits. High comfort for all-day wear.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Indigo & Madder", hex: "#1E293B" },
      { name: "Forest Iron", hex: "#264653" },
    ],
    stock: 20,
    isFeatured: false,
  },
  {
    id: "prod-6",
    title: "Heritage Temple Bell-Metal Dhokra Sculptural Vase",
    slug: "dhokra-bell-metal-sculptural-vase",
    sku: "PRE-ART-006",
    category: "handicrafts",
    collection: "Indus Antiquities",
    region: "bengal",
    state: "West Bengal & Odisha",
    price: 8999,
    mrp: 11500,
    discount: 21,
    rating: 4.9,
    reviewCount: 15,
    badge: "LIMITED_EDITION",
    images: [
      "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&q=80&w=1200",
    ],
    shortDesc: "Ancient lost-wax cast brass heirloom artifact depicting the Tree of Eternal Life.",
    description: "Handcrafted using the 4,000-year-old cire perdue (lost wax) metal casting technique dating back to the Dancing Girl of Mohenjo-daro. Every piece is entirely unique and non-replicable.",
    culturalStory: "The Dhokra Damar nomadic tribes of Central and Eastern India gather natural beeswax, river clay, and recycled brass scraps to mold ancestral motifs inspired by nature, birds, and forest folklore.",
    fabricDetails: "Solid Brass & Bell Metal Bronze Alloy with Antique Patina Finish",
    careInstructions: "Wipe with soft microfiber cloth. Occasionally apply brass polish if high shine is preferred.",
    sizeFitGuide: "Height: 14 Inches | Base Diameter: 5.5 Inches | Weight: 2.4 Kilograms",
    sizes: ["One Size"],
    colors: [{ name: "Antique Patina Brass", hex: "#C5A869" }],
    stock: 8,
    isFeatured: false,
  },
  {
    id: "prod-7",
    title: "Timeless Architecture Archival Art Poster - Kashi Ghats",
    slug: "timeless-kashi-ghats-archival-poster",
    sku: "PRE-POS-007",
    category: "posters",
    collection: "Eternal India",
    region: "varanasi",
    state: "Uttar Pradesh",
    price: 2499,
    mrp: 3499,
    discount: 28,
    rating: 4.8,
    reviewCount: 29,
    badge: "NEW",
    images: [
      "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=1200",
    ],
    shortDesc: "Museum-grade 310 gsm cotton rag archival print with hand-stamped gold foil seal.",
    description: "A breathtaking architectural panoramic illustration capturing the misty sunrise across the ancient stone steps of Kashi. Printed with archival pigment inks rated for 100+ years of vibrant color permanence.",
    culturalStory: "Mark Twain remarked: 'Benares is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together.'",
    fabricDetails: "310 GSM 100% Acid-Free Cotton Rag Paper, Mineral Pigment Inks",
    careInstructions: "Frame under anti-reflective UV-filtered glass. Avoid direct high-intensity sunlight.",
    sizeFitGuide: "Dimensions: A2 (420 x 594 mm / 16.5 x 23.4 inches) or A1 (594 x 841 mm). Frame not included.",
    sizes: ["A2 (16.5 x 23.4 in)", "A1 (23.4 x 33.1 in)"],
    colors: [{ name: "Antique Ivory Base", hex: "#FAF7F2" }],
    stock: 35,
    isFeatured: false,
  },
  {
    id: "prod-8",
    title: "Bengal Muslin Jamdani Saree with Woven Lotus Motifs",
    slug: "bengal-muslin-jamdani-saree-lotus",
    sku: "PRE-SAR-008",
    category: "sarees",
    collection: "Riverbank Poetry",
    region: "bengal",
    state: "West Bengal",
    price: 21999,
    mrp: 27999,
    discount: 21,
    rating: 4.9,
    reviewCount: 38,
    badge: "BESTSELLER",
    images: [
      "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&q=80&w=1200",
    ],
    shortDesc: "Featherweight 200-count handspun cotton muslin with intricate supplementary weft lotus motifs.",
    description: "Known historically as 'Woven Air', Jamdani is declared a Masterpiece of the Oral and Intangible Heritage of Humanity by UNESCO. Each flower is inlaid by hand using fine bamboo shuttles as the loom advances thread by thread.",
    culturalStory: "During the ancient Roman Empire, Jamdani was imported at its weight in pure gold. The delicate translucent fabric allowed Indian court ladies to stay effortlessly regal in the tropical climate.",
    fabricDetails: "Pure 200s Count Handspun Muslin Cotton, Gold Zari Weft",
    careInstructions: "Specialist roll press or gentle dry clean only. Preserve in breathable cotton bag.",
    sizeFitGuide: "Length: 5.5 Metres | Blouse Piece: 0.8 Metres",
    sizes: ["Free Size"],
    colors: [
      { name: "Raw Ivory & Gold", hex: "#FAF7F2" },
      { name: "Midnight Charcoal", hex: "#1C1917" },
    ],
    stock: 7,
    isFeatured: true,
  },
];

export const TESTIMONIALS = [
  {
    id: "test-1",
    author: "Gayatri Devi Varma",
    location: "New Delhi & London",
    role: "Collector & Cultural Patron",
    rating: 5,
    quote: "PREHERITAGE is doing something truly extraordinary. The Katan silk saree arrived in an exquisite gold-embossed ivory box, accompanied by a letter explaining the exact lineage of the Varanasi weaver. This is genuine luxury with a soul.",
    productName: "Varanasi Rangkat Kadwa Silk Saree",
  },
  {
    id: "test-2",
    author: "Rohit & Meera Singhania",
    location: "Mumbai",
    role: "Architect & Fashion Curator",
    rating: 5,
    quote: "We ordered the Jaipur Gota Patti ensemble for an intimate heritage palace wedding in Udaipur. The weight of the raw silk, the precision of the hand-stitched borders, and the seamless customer service were flawless.",
    productName: "Jaipur Handblock Gota Patti Lehenga Ensemble",
  },
  {
    id: "test-3",
    author: "Anya Sharma-Levy",
    location: "New York, USA",
    role: "Creative Director",
    rating: 5,
    quote: "International shipping was swift and fully tracked through Shiprocket. The Pashmina wrap feels like a cloud against the skin. Wearing Preheritage feels like carrying my ancestral heritage with global elegance.",
    productName: "Kashmir Pashmina Shawl with Sozni Embroidery",
  },
];

export const COUPONS_LIST = [
  {
    code: "HERITAGE10",
    discount: "10% OFF",
    minSpend: 4999,
    description: "10% off on your entire purchase above ₹4,999",
  },
  {
    code: "ROYAL2000",
    discount: "₹2,000 FLAT OFF",
    minSpend: 19999,
    description: "Flat ₹2,000 instant saving on luxury sarees & lehengas above ₹19,999",
  },
  {
    code: "FIRSTWEAR",
    discount: "15% OFF",
    minSpend: 2999,
    description: "Welcome offer: 15% off on your first handcrafted order",
  },
];
