/**
 * Fresh seed for Last Piece.
 *
 * Wipes the entire database and reseeds with:
 *   - 4 team users (2 super-admins, 1 saudi-staff, 1 egypt-staff)
 *   - Categories Men / Women / Kids + subcategories
 *   - Top luxury brands
 *   - 3 sample sneakers spread across the Saudi → Egypt pipeline
 *   - Initial CMS site content for the home page (EN + AR)
 *
 * Run with:  node seed-fresh.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

import User from './src/models/User.js';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import Brand from './src/models/Brand.js';
import Shipment from './src/models/Shipment.js';
import Expense from './src/models/Expense.js';
import Sale from './src/models/Sale.js';
import PromoCode from './src/models/PromoCode.js';
import Referral from './src/models/Referral.js';
import SiteContent from './src/models/SiteContent.js';
import Review from './src/models/Review.js';
import Order from './src/models/Order.js';
import Cart from './src/models/Cart.js';
import Wishlist from './src/models/Wishlist.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env');
  process.exit(1);
}

const slug = (s) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

const hash = async (pw) => bcryptjs.hash(pw, parseInt(process.env.BCRYPT_ROUNDS) || 10);

const wipe = async () => {
  console.log('🧹 Wiping all collections...');
  const collections = [User, Product, Category, Brand, Shipment, Expense, Sale, PromoCode, Referral, SiteContent, Review, Order, Cart, Wishlist];
  for (const M of collections) {
    const c = await M.deleteMany({});
    console.log(`   - ${M.modelName}: ${c.deletedCount} removed`);
  }
};

const seedUsers = async () => {
  console.log('👥 Seeding users...');
  const users = await User.insertMany([
    {
      firstName: 'Mohamed',
      lastName: 'Zaher',
      email: 'mohamed@lastpiece.com',
      password: await hash('Founder@2026'),
      phone: '+966500000001',
      role: 'super-admin',
      workLocation: 'saudi',
      status: 'active',
      emailVerified: true,
    },
    {
      firstName: 'Sameh',
      lastName: 'Hassan',
      email: 'sameh@lastpiece.com',
      password: await hash('Founder@2026'),
      phone: '+966500000002',
      role: 'super-admin',
      workLocation: 'saudi',
      status: 'active',
      emailVerified: true,
    },
    {
      firstName: 'Asmaa',
      lastName: 'Kutbi',
      email: 'asmaa@lastpiece.com',
      password: await hash('Asmaa@2026'),
      phone: '+966500000003',
      role: 'saudi-staff',
      workLocation: 'saudi',
      status: 'active',
      emailVerified: true,
    },
    {
      firstName: 'Islam',
      lastName: 'Ahmed',
      email: 'islam@lastpiece.com',
      password: await hash('Islam@2026'),
      phone: '+201000000001',
      role: 'egypt-staff',
      workLocation: 'egypt',
      status: 'active',
      emailVerified: true,
    },
  ]);
  console.log(`   ✓ ${users.length} users seeded`);
  return users;
};

const seedCategories = async () => {
  console.log('📂 Seeding categories...');
  const top = await Category.insertMany([
    { name: 'Men', slug: 'men', description: 'Men’s sneakers — luxury statement pairs.', order: 1 },
    { name: 'Women', slug: 'women', description: 'Women’s sneakers — bold, refined, exclusive.', order: 2 },
    { name: 'Kids', slug: 'kids', description: 'Premium sneakers for the next generation.', order: 3 },
  ]);
  console.log(`   ✓ ${top.length} top categories seeded`);
  return Object.fromEntries(top.map((c) => [c.slug, c._id]));
};

const seedBrands = async () => {
  console.log('🏷  Seeding brands...');
  const data = [
    { name: 'Nike', country: 'USA', isFeatured: true, order: 1 },
    { name: 'Air Jordan', country: 'USA', isFeatured: true, order: 2 },
    { name: 'Adidas', country: 'Germany', isFeatured: true, order: 3 },
    { name: 'Yeezy', country: 'USA', isFeatured: true, order: 4 },
    { name: 'Balenciaga', country: 'France', isFeatured: true, order: 5 },
    { name: 'Louis Vuitton', country: 'France', isFeatured: true, order: 6 },
    { name: 'Dior', country: 'France', isFeatured: true, order: 7 },
    { name: 'Off-White', country: 'Italy', isFeatured: false, order: 8 },
    { name: 'New Balance', country: 'USA', isFeatured: false, order: 9 },
  ];
  const brands = await Brand.insertMany(data.map((b) => ({ ...b, slug: slug(b.name), isLuxury: true })));
  console.log(`   ✓ ${brands.length} brands seeded`);
  return Object.fromEntries(brands.map((b) => [b.slug, b._id]));
};

const seedSampleProducts = async (cats, brandsMap, founder) => {
  console.log('👟 Seeding 3 sample sneakers...');
  const items = [
    {
      name: 'Air Jordan 1 Retro High OG "Chicago"',
      shortDescription: 'The original. Untouchable streetwear icon in red, white, and black.',
      description:
        'A 100% authentic pair of the Air Jordan 1 Retro High OG "Chicago" — the silhouette that started everything. Premium leather upper, original colorway, deadstock condition.',
      brand: 'Air Jordan',
      brandRef: brandsMap['air-jordan'],
      category: cats.men,
      gender: 'men',
      size: '42',
      color: 'White / Red / Black',
      condition: 'new',
      images: [
        { url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200', alt: 'Jordan 1 Chicago', isPrimary: true },
      ],
      thumbnail: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600',
      // Pipeline state #1: still in Saudi inventory (just purchased)
      location: 'saudi',
      status: 'draft',
      purchasePrice: 4500,
      purchaseCurrency: 'SAR',
      purchaseExchangeRate: 13.20,
      purchaseDate: new Date(),
      supplier: { name: 'Riyadh Sneaker Authority', city: 'Riyadh', contact: '+966500000010' },
      batchCode: 'BATCH-001',
      price: 0,
      stock: 1,
      tags: ['jordan', 'retro', 'chicago', 'iconic'],
      badges: [{ label: 'Limited', type: 'limited' }],
      faqs: [
        { question: 'Is this the OG colorway?', answer: 'Yes — this is the original Air Jordan 1 High OG "Chicago" colorway in the exact red / white / black specification.' },
        { question: 'Has this pair been worn?', answer: 'No — brand new, deadstock condition. Never worn outside the box.' },
      ],
    },
    {
      name: 'Yeezy Boost 350 V2 "Zebra"',
      shortDescription: 'Primeknit upper with iconic SPLY-350 print. A grail of modern streetwear.',
      description:
        'Authentic Yeezy Boost 350 V2 in the legendary "Zebra" colorway. Boost cushioning, Primeknit construction, includes original box and tags.',
      brand: 'Yeezy',
      brandRef: brandsMap['yeezy'],
      category: cats.men,
      gender: 'men',
      size: '43',
      color: 'White / Black',
      condition: 'new',
      images: [
        { url: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=1200', alt: 'Yeezy 350 Zebra', isPrimary: true },
      ],
      thumbnail: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600',
      // Pipeline state #2: live online in Egypt — published, customers can buy
      location: 'egypt-online',
      status: 'active',
      purchasePrice: 5200,
      purchaseCurrency: 'SAR',
      purchaseExchangeRate: 13.08,
      purchaseDate: new Date(Date.now() - 14 * 86400000),
      supplier: { name: 'Jeddah Hype Drops', city: 'Jeddah' },
      batchCode: 'BATCH-002',
      onlinePrice: 38500,
      offlinePrice: 36000,
      minSellPrice: 34000,
      sellingCurrency: 'EGP',
      price: 38500,
      stock: 1,
      allocatedShippingCost: 750,
      landedCost: 5200 + 750,
      tags: ['yeezy', 'zebra', '350', 'streetwear'],
      badges: [{ label: 'Online Now', type: 'new' }],
      faqs: [
        { question: 'Does the Yeezy 350 V2 run true to size?', answer: 'Yeezys generally run half a size small. If you normally wear 42, we recommend going up to 42.5 or 43.' },
        { question: 'Is the box included?', answer: 'Yes — original box, dust tag, and receipt from our authentication team.' },
        { question: 'How was this pair authenticated?', answer: 'Every Yeezy that enters our inventory is inspected physically by our team in Riyadh: stitching, SPLY-350 print, tongue, boost density, and the infrared tag are all verified against reference pairs.' },
      ],
    },
    {
      name: 'Balenciaga Triple S Clear Sole "Beige"',
      shortDescription: 'Chunky, sculptural, unmistakable. The luxury statement sneaker.',
      description:
        'Balenciaga Triple S in the rare Clear Sole "Beige" colorway. Mesh, leather, and nubuck construction with the signature triple-stacked sole.',
      brand: 'Balenciaga',
      brandRef: brandsMap['balenciaga'],
      category: cats.women,
      gender: 'women',
      size: '38',
      color: 'Beige / Cream',
      condition: 'new',
      images: [
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200', alt: 'Balenciaga Triple S', isPrimary: true },
      ],
      thumbnail: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
      // Pipeline state #3: at the Egypt offline boutique
      location: 'egypt-offline',
      status: 'active',
      purchasePrice: 8800,
      purchaseCurrency: 'SAR',
      purchaseExchangeRate: 12.95,
      purchaseDate: new Date(Date.now() - 30 * 86400000),
      supplier: { name: 'Riyadh Luxury Imports', city: 'Riyadh' },
      batchCode: 'BATCH-003',
      onlinePrice: 0,
      offlinePrice: 65000,
      minSellPrice: 58000,
      sellingCurrency: 'EGP',
      price: 65000,
      stock: 1,
      allocatedShippingCost: 750,
      landedCost: 8800 + 750,
      tags: ['balenciaga', 'triple s', 'luxury', 'statement'],
      badges: [{ label: 'In Boutique', type: 'exclusive' }],
      faqs: [
        { question: 'Does the Triple S run big?', answer: 'Yes — Triple S runs one full size large. We recommend going down one size from your usual.' },
        { question: 'Can I try it on at the boutique?', answer: 'Yes, at our Cairo branch. For Saudi customers — we can ship to our Riyadh branch for you to try on.' },
      ],
    },
  ];

  for (const it of items) {
    it.createdBy = founder._id;
    if (!it.slug) it.slug = slug(it.name);
    if (!it.sku) {
      const ts = Date.now().toString().slice(-6);
      const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
      it.sku = `LP-${it.name.slice(0, 3).toUpperCase()}-${ts}-${rnd}`;
    }
  }
  const products = await Product.insertMany(items);
  console.log(`   ✓ ${products.length} products seeded`);
  return products;
};

const seedShipment = async (products, founder) => {
  console.log('📦 Seeding example shipment (Saudi → Egypt)...');
  // Put the Yeezy + Balenciaga into a delivered shipment so the cost trail is visible.
  const inShipment = products.filter((p) => p.location !== 'saudi');
  if (inShipment.length === 0) return null;
  const shipment = await Shipment.create({
    products: inShipment.map((p) => p._id),
    shippingCost: 1200,
    shippingCurrency: 'SAR',
    customsFees: 300,
    otherFees: 0,
    carrier: 'DHL',
    trackingNumber: 'DHL-LP-0001',
    status: 'delivered',
    sentAt: new Date(Date.now() - 25 * 86400000),
    receivedAt: new Date(Date.now() - 18 * 86400000),
    createdBy: founder._id,
    notes: 'First shipment of the Egypt soft launch.',
  });
  // Link products back
  await Product.updateMany(
    { _id: { $in: inShipment.map((p) => p._id) } },
    { $set: { shipment: shipment._id } },
  );
  console.log(`   ✓ Shipment ${shipment.code} created`);
  return shipment;
};

const seedExpenses = async (founder, asmaa, islam) => {
  console.log('💸 Seeding example operating expenses...');
  const month = new Date();
  month.setDate(1);
  await Expense.insertMany([
    {
      category: 'salary-saudi',
      title: 'Asmaa Kutbi — monthly salary',
      amount: 6000,
      currency: 'SAR',
      isRecurring: true,
      recurrenceDay: 1,
      relatedUser: asmaa._id,
      incurredOn: month,
      createdBy: founder._id,
    },
    {
      category: 'salary-egypt',
      title: 'Egypt staff — placeholder monthly salary',
      amount: 15000,
      currency: 'EGP',
      isRecurring: true,
      recurrenceDay: 1,
      relatedUser: islam._id,
      incurredOn: month,
      createdBy: founder._id,
    },
    {
      category: 'rent-egypt',
      title: 'Egypt boutique — monthly rent',
      amount: 25000,
      currency: 'EGP',
      isRecurring: true,
      recurrenceDay: 1,
      incurredOn: month,
      createdBy: founder._id,
    },
    {
      category: 'fitout-egypt',
      title: 'Egypt boutique — fit-out (one-off launch)',
      amount: 80000,
      currency: 'EGP',
      isRecurring: false,
      incurredOn: new Date(Date.now() - 60 * 86400000),
      createdBy: founder._id,
    },
    {
      category: 'marketing',
      title: 'Instagram launch campaign',
      amount: 12000,
      currency: 'EGP',
      isRecurring: false,
      incurredOn: new Date(Date.now() - 14 * 86400000),
      createdBy: founder._id,
    },
  ]);
  console.log('   ✓ 5 expenses seeded');
};

const seedPromos = async (founder) => {
  console.log('🎟  Seeding promo codes...');
  await PromoCode.insertMany([
    {
      code: 'WELCOME10',
      description: 'New customer welcome — 10% off',
      type: 'percent',
      value: 10,
      minOrderAmount: 0,
      maxDiscountAmount: 5000,
      usageLimitPerUser: 1,
      isActive: true,
      createdBy: founder._id,
    },
    {
      code: 'FIRSTPAIR500',
      description: '500 EGP off your first pair',
      type: 'fixed',
      value: 500,
      currency: 'EGP',
      minOrderAmount: 5000,
      usageLimitPerUser: 1,
      isActive: true,
      createdBy: founder._id,
    },
  ]);
  console.log('   ✓ 2 promo codes seeded');
};

const seedSiteContent = async () => {
  console.log('🎨 Seeding site CMS content...');
  const items = [
    {
      key: 'home.hero',
      section: 'home',
      label: 'Home — Hero',
      type: 'json',
      order: 1,
      value: {
        eyebrow: 'KHALEEJI LUXURY · NOW IN EGYPT',
        title: 'Luxury, One Pair at a Time.',
        subtitle:
          'A hand-curated boutique of the world’s rarest sneakers. Authentic. Limited. Yours.',
        ctaPrimary: { label: 'Shop the Collection', href: '/products' },
        ctaSecondary: { label: 'Our Story', href: '/about' },
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=2000',
      },
      i18n: {
        en: {
          eyebrow: 'KHALEEJI LUXURY · NOW IN EGYPT',
          title: 'Luxury, One Pair at a Time.',
          subtitle:
            'A hand-curated boutique of the world’s rarest sneakers. Authentic. Limited. Yours.',
          ctaPrimary: { label: 'Shop the Collection', href: '/products' },
          ctaSecondary: { label: 'Our Story', href: '/about' },
        },
        ar: {
          eyebrow: 'لاكجري خليجي · دلوقتي في مصر',
          title: 'لاكجري، قطعة واحدة في كل مرة.',
          subtitle:
            'بوتيك مختار بإيدينا لأندر كوتشيات في العالم. أصلية. محدودة. ليك إنت.',
          ctaPrimary: { label: 'تسوق المجموعة', href: '/products' },
          ctaSecondary: { label: 'قصتنا', href: '/about' },
        },
      },
    },
    {
      key: 'home.categorySection',
      section: 'home',
      label: 'Home — Shop by Category',
      type: 'json',
      order: 2,
      value: {
        heading: 'Shop by Category',
        subtitle: 'Find your perfect unique pair',
      },
      i18n: {
        en: { heading: 'Shop by Category', subtitle: 'Find your perfect unique pair' },
        ar: { heading: 'تسوق حسب القسم', subtitle: 'اعثر على قطعتك المثالية الفريدة' },
      },
    },
    {
      key: 'home.brandsSection',
      section: 'home',
      label: 'Home — Featured Brands',
      type: 'json',
      order: 3,
      value: {
        heading: 'The Houses We Carry',
        subtitle: 'Only the best. Nothing less.',
      },
      i18n: {
        en: { heading: 'The Houses We Carry', subtitle: 'Only the best. Nothing less.' },
        ar: { heading: 'البيوت التي نحملها', subtitle: 'الأفضل فقط. لا أقل.' },
      },
    },
    {
      key: 'home.dropSection',
      section: 'home',
      label: 'Home — Latest Drops',
      type: 'json',
      order: 4,
      value: {
        heading: 'Latest Drops',
        subtitle: 'Each pair lives once. When it’s gone, it’s gone.',
      },
      i18n: {
        en: { heading: 'Latest Drops', subtitle: 'Each pair lives once. When it’s gone, it’s gone.' },
        ar: { heading: 'أحدث القطع', subtitle: 'كل قطعة تعيش مرة واحدة. لما تتباع، خلاص.' },
      },
    },
    {
      key: 'home.storySection',
      section: 'home',
      label: 'Home — Story strip',
      type: 'json',
      order: 5,
      value: {
        eyebrow: 'OUR STORY',
        title: 'Born in the Khaleej. Curated for Cairo.',
        body:
          'Last Piece started as a private collection in Riyadh. Today, we bring those same standards to Egypt — every pair authenticated, every drop limited, every box opened with intent.',
        image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600',
      },
      i18n: {
        en: {
          eyebrow: 'OUR STORY',
          title: 'Born in the Khaleej. Curated for Cairo.',
          body:
            'Last Piece started as a private collection in Riyadh. Today, we bring those same standards to Egypt — every pair authenticated, every drop limited, every box opened with intent.',
        },
        ar: {
          eyebrow: 'قصتنا',
          title: 'وُلد في الخليج. مختار للقاهرة.',
          body:
            'لاست بيس بدا كمجموعة خاصة في الرياض. اليوم، بنجيب نفس المعايير لمصر — كل زوج موثق، كل دروب محدود، كل علبة بتتفتح بنية.',
        },
      },
    },
    {
      key: 'home.reviewsSection',
      section: 'home',
      label: 'Home — Reviews heading',
      type: 'json',
      order: 6,
      value: {
        heading: 'What Our Customers Say',
        subtitle: 'Real owners. Real pairs.',
      },
      i18n: {
        en: { heading: 'What Our Customers Say', subtitle: 'Real owners. Real pairs.' },
        ar: { heading: 'رأي عملائنا', subtitle: 'ملاك حقيقيون. قطع حقيقية.' },
      },
    },
    {
      key: 'footer.about',
      section: 'footer',
      label: 'Footer — About blurb',
      type: 'json',
      order: 1,
      value: {
        body: 'A Khaleeji luxury sneaker boutique. Now serving Egypt.',
      },
      i18n: {
        en: { body: 'A Khaleeji luxury sneaker boutique. Now serving Egypt.' },
        ar: { body: 'بوتيك كوتشيات لاكجري خليجي. دلوقتي بنخدم مصر.' },
      },
    },

    /* ============ Contact + locations + hours (used everywhere) ============ */
    {
      key: 'contact.config',
      section: 'contact',
      label: 'Contact — locations, email, hours',
      type: 'json',
      order: 1,
      value: {
        email: 'support@lastpiece.com',
        instagram: '@lastpiece',
        whatsapp: '+20 100 000 0001',
        hours: '24/7 · Online support every day of the week',
        locations: [
          { city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', role: 'Branch', address: 'King Fahd Rd, Riyadh', phone: '+966 50 000 0001' },
          { city: 'Jeddah', country: 'Saudi Arabia', flag: '🇸🇦', role: 'Branch', address: 'Tahlia St, Jeddah', phone: '+966 50 000 0002' },
          { city: 'Cairo', country: 'Egypt', flag: '🇪🇬', role: 'Branch · Delivery everywhere in Cairo', address: 'New Cairo (address on request)', phone: '+20 100 000 0001' },
        ],
      },
      i18n: {
        en: {
          email: 'support@lastpiece.com',
          instagram: '@lastpiece',
          whatsapp: '+20 100 000 0001',
          hours: '24/7 · Reply within minutes',
          locations: [
            { city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', role: 'Branch', address: 'King Fahd Rd, Riyadh', phone: '+966 50 000 0001' },
            { city: 'Jeddah', country: 'Saudi Arabia', flag: '🇸🇦', role: 'Branch', address: 'Tahlia St, Jeddah', phone: '+966 50 000 0002' },
            { city: 'Cairo', country: 'Egypt', flag: '🇪🇬', role: 'Branch · Delivery everywhere in Cairo', address: 'New Cairo (address on request)', phone: '+20 100 000 0001' },
          ],
        },
        ar: {
          email: 'support@lastpiece.com',
          instagram: '@lastpiece',
          whatsapp: '+20 100 000 0001',
          hours: '٢٤/٧ · بنرد خلال دقائق',
          locations: [
            { city: 'الرياض', country: 'المملكة العربية السعودية', flag: '🇸🇦', role: 'فرع', address: 'طريق الملك فهد، الرياض', phone: '+966 50 000 0001' },
            { city: 'جدة', country: 'المملكة العربية السعودية', flag: '🇸🇦', role: 'فرع', address: 'شارع التحلية، جدة', phone: '+966 50 000 0002' },
            { city: 'القاهرة', country: 'مصر', flag: '🇪🇬', role: 'فرع · توصيل لأي مكان في القاهرة', address: 'القاهرة الجديدة (العنوان عند الطلب)', phone: '+20 100 000 0001' },
          ],
        },
      },
    },

    /* ============ Home FAQ ============ */
    {
      key: 'home.faq',
      section: 'home',
      label: 'Home — FAQ section',
      type: 'json',
      order: 7,
      value: {
        eyebrow: 'FAQ',
        heading: 'Your questions, answered',
        subtitle: 'Before you ask — here are the ones our customers ask most.',
        items: [
          { question: 'Are all sneakers 100% authentic?', answer: 'Yes. Every pair is authenticated by hand by our team in Riyadh and Cairo before it goes on sale.' },
          { question: 'What makes Last Piece unique?', answer: 'Every pair we carry is one-of-one in our inventory. We don’t restock. When you buy a pair, you’re buying the only one we have — you won’t find it anywhere else.' },
          { question: 'Where do you deliver?', answer: 'Anywhere in Cairo within 1-2 working days. Other Egyptian governorates within 2-4 days. KSA and GCC — contact us on WhatsApp.' },
          { question: 'Do you have physical branches?', answer: 'Yes. We have branches in Riyadh, Jeddah, and Cairo. Our Cairo branch also handles online orders and ships across Egypt.' },
          { question: 'What if a pair doesn’t fit?', answer: 'You have 7 days from delivery to return the pair. It must be in the exact condition we shipped it — unworn, original box.' },
          { question: 'Can I pay cash on delivery?', answer: 'Yes, across Egypt. In-branch we accept cash and card. Online we also accept Visa, Mastercard, and bank transfer.' },
        ],
      },
      i18n: {
        en: {
          eyebrow: 'FAQ',
          heading: 'Your questions, answered',
          subtitle: 'Before you ask — here are the ones our customers ask most.',
          items: [
            { question: 'Are all sneakers 100% authentic?', answer: 'Yes. Every pair is authenticated by hand by our team in Riyadh and Cairo before it goes on sale.' },
            { question: 'What makes Last Piece unique?', answer: 'Every pair we carry is one-of-one in our inventory. We don’t restock.' },
            { question: 'Where do you deliver?', answer: 'Anywhere in Cairo within 1-2 working days. Other governorates 2-4 days.' },
            { question: 'Do you have physical branches?', answer: 'Yes — Riyadh, Jeddah, and Cairo.' },
            { question: 'What if a pair doesn’t fit?', answer: '7-day returns from delivery, in the original condition.' },
            { question: 'Can I pay cash on delivery?', answer: 'Yes, across Egypt.' },
          ],
        },
        ar: {
          eyebrow: 'الأسئلة الشائعة',
          heading: 'إجابات لأسئلتك',
          subtitle: 'هنا أكثر الأسئلة اللي بنسمعها من عملائنا.',
          items: [
            { question: 'هل كل الكوتشيات أصلية ١٠٠٪؟', answer: 'نعم. كل قطعة بنتحقق منها يدوياً في الرياض والقاهرة قبل العرض.' },
            { question: 'إيه اللي بيخلي لاست بيس فريد؟', answer: 'كل قطعة عندنا موجودة بقطعة واحدة بس. ما بنعيد التوفير. مش هتلاقيها في أي مكان تاني.' },
            { question: 'بتوصلوا فين؟', answer: 'في أي مكان في القاهرة خلال ١-٢ يوم. باقي المحافظات ٢-٤ أيام.' },
            { question: 'عندكم فروع فعلية؟', answer: 'أيوة — الرياض، جدة، والقاهرة.' },
            { question: 'لو المقاس مش ظبط؟', answer: 'عندك ٧ أيام من التسليم لإرجاع القطعة، لازم تكون زي ما بعتناها.' },
            { question: 'ممكن أدفع كاش عند الاستلام؟', answer: 'طبعاً في أي مكان في مصر.' },
          ],
        },
      },
    },

    /* ============ About page ============ */
    {
      key: 'about.story',
      section: 'about',
      label: 'About — Story block',
      type: 'json',
      order: 1,
      value: {
        eyebrow: 'OUR STORY',
        title: 'Born in the Khaleej. Curated for Cairo.',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85',
        p1: 'Last Piece started as a private collection in Riyadh — a small group of friends obsessed with the rarest, most limited drops in the world. We brought every pair home, kept what we loved, and only let go of the ones that were truly perfect.',
        p2: 'Today, we bring the same standards to Egypt. Every pair we carry is authenticated by hand, kept in pristine condition, and limited to exactly one in our inventory. Once it’s gone, it’s gone.',
      },
      i18n: {
        en: {
          eyebrow: 'OUR STORY',
          title: 'Born in the Khaleej. Curated for Cairo.',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85',
          p1: 'Last Piece started as a private collection in Riyadh — a small group of friends obsessed with the rarest, most limited drops in the world. We brought every pair home, kept what we loved, and only let go of the ones that were truly perfect.',
          p2: 'Today, we bring the same standards to Egypt. Every pair we carry is authenticated by hand, kept in pristine condition, and limited to exactly one in our inventory. Once it’s gone, it’s gone.',
        },
        ar: {
          eyebrow: 'قصتنا',
          title: 'وُلد في الخليج. مختار للقاهرة.',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85',
          p1: 'لاست بيس بدا كمجموعة خاصة في الرياض — مجموعة صغيرة من الأصحاب مهووسين بأندر وأكثر القطع المحدودة في العالم. كنا بنجيب كل قطعة بنحبها، نحتفظ بأفضلها، ومنبيع غير اللي بتكون كاملة بمعنى الكلمة.',
          p2: 'اليوم، بنجيب نفس المعايير لمصر. كل قطعة عندنا موثقة بإيدينا، ومحفوظة بأفضل حال، وموجودة بقطعة واحدة بس في الإنفنتوري. لما تنتهي، خلاص.',
        },
      },
    },

    /* ============ Footer pages (FAQ, Shipping, Returns, etc.) ============
     * The page components have their own English defaults — these CMS entries
     * are placeholders so super-admin sees them in Site Content and can edit.
     */
    ...[
      { key: 'page.faq', section: 'pages', label: 'Page — FAQ' },
      { key: 'page.shipping', section: 'pages', label: 'Page — Shipping & Delivery' },
      { key: 'page.returns', section: 'pages', label: 'Page — Returns & Exchanges' },
      { key: 'page.sizeGuide', section: 'pages', label: 'Page — Size Guide' },
      { key: 'page.privacy', section: 'pages', label: 'Page — Privacy Policy' },
      { key: 'page.terms', section: 'pages', label: 'Page — Terms of Service' },
      { key: 'page.cookies', section: 'pages', label: 'Page — Cookies' },
    ].map((p, i) => ({
      ...p,
      type: 'json',
      order: i + 1,
      // Empty values — page components will fall back to their English defaults
      // until a super-admin edits them. Keys exist so they show up in admin CMS.
      value: { title: '', intro: '', sections: [] },
      i18n: { en: {}, ar: {} },
    })),
  ];
  await SiteContent.insertMany(items);
  console.log(`   ✓ ${items.length} CMS items seeded`);
};

const main = async () => {
  console.log('🌱 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('   ✓ Connected\n');

  await wipe();
  console.log('');
  const users = await seedUsers();
  const founder = users.find((u) => u.email === 'mohamed@lastpiece.com');
  const asmaa = users.find((u) => u.email === 'asmaa@lastpiece.com');
  const islam = users.find((u) => u.email === 'islam@lastpiece.com');

  const cats = await seedCategories();
  const brands = await seedBrands();
  const products = await seedSampleProducts(cats, brands, founder);
  await seedShipment(products, founder);
  await seedExpenses(founder, asmaa, islam);
  await seedPromos(founder);
  await seedSiteContent();

  console.log('\n✅ Seed complete!\n');
  console.log('🔑 Login credentials:');
  console.log('   Mohamed (super-admin):  mohamed@lastpiece.com  /  Founder@2026');
  console.log('   Sameh   (super-admin):  sameh@lastpiece.com    /  Founder@2026');
  console.log('   Asmaa   (saudi-staff):  asmaa@lastpiece.com    /  Asmaa@2026');
  console.log('   Islam   (egypt-staff):  islam@lastpiece.com    /  Islam@2026\n');

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
