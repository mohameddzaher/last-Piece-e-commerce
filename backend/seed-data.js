#!/usr/bin/env node

/**
 * Script to seed categories and products for Last Piece shoes
 * Run with: node seed-data.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';

dotenv.config();

const CATEGORIES = [
  {
    name: 'Sneakers',
    slug: 'sneakers',
    description: 'Stylish and comfortable sneakers for everyday wear',
    order: 1,
  },
  {
    name: 'Loafers',
    slug: 'loafers',
    description: 'Classic loafers with timeless elegance',
    order: 2,
  },
  {
    name: 'Boots',
    slug: 'boots',
    description: 'Fashionable boots for all seasons',
    order: 3,
  },
  {
    name: 'Sandals',
    slug: 'sandals',
    description: 'Comfortable sandals for warm weather',
    order: 4,
  },
  {
    name: 'Heels',
    slug: 'heels',
    description: 'Elegant heels for special occasions',
    order: 5,
  },
  {
    name: 'Flats',
    slug: 'flats',
    description: 'Comfortable flats for everyday style',
    order: 6,
  },
];

const PRODUCTS = [
  {
    name: 'Lowline Signature Sneaker',
    slug: 'lowline-signature-sneaker',
    description: 'A sleek low-top sneaker crafted from premium canvas with leather trim. Features a cushioned insole, rubber outsole, and stylish hardware. Perfect for casual everyday style.',
    shortDescription: 'Premium canvas low-top sneaker',
    price: 150.00,
    originalPrice: 195.00,
    sku: 'LP-LLS-001',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Lowline Sneaker - Side' },
      { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80', alt: 'Lowline Sneaker - Top' },
    ],
    stock: 1,
    rating: { average: 4.8, count: 124 },
    categorySlug: 'sneakers',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Citysole Court Sneaker',
    slug: 'citysole-court-sneaker',
    description: 'A modern court sneaker with signature detailing. Features a lightweight rubber outsole, padded collar, and premium leather upper. Urban sophistication meets comfort.',
    shortDescription: 'Premium leather court sneaker',
    price: 175.00,
    originalPrice: 225.00,
    sku: 'LP-CCS-001',
    thumbnail: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80', alt: 'Citysole - Front' },
      { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80', alt: 'Citysole - Side' },
    ],
    stock: 1,
    rating: { average: 4.9, count: 89 },
    categorySlug: 'sneakers',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Sculpted Signature Loafer',
    slug: 'sculpted-signature-loafer',
    description: 'An elegant loafer featuring iconic hardware and sculpted heel. Crafted from smooth leather with a cushioned footbed. Perfect for office or evening wear.',
    shortDescription: 'Elegant leather loafer with hardware',
    price: 195.00,
    originalPrice: 250.00,
    sku: 'LP-SSL-001',
    thumbnail: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80', alt: 'Signature Loafer - Side' },
      { url: 'https://images.unsplash.com/photo-1616406432452-07bc5938759d?w=800&q=80', alt: 'Signature Loafer - Top' },
    ],
    stock: 1,
    rating: { average: 4.7, count: 156 },
    categorySlug: 'loafers',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Ainsley Ankle Bootie',
    slug: 'ainsley-ankle-bootie',
    description: 'A chic ankle bootie with block heel and signature detailing. Features a side zip closure, leather upper, and padded insole. Versatile style for any occasion.',
    shortDescription: 'Block heel ankle bootie',
    price: 275.00,
    originalPrice: 350.00,
    sku: 'LP-AB-001',
    thumbnail: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', alt: 'Ainsley Bootie - Side' },
      { url: 'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=800&q=80', alt: 'Ainsley Bootie - Front' },
    ],
    stock: 1,
    rating: { average: 5.0, count: 67 },
    categorySlug: 'boots',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Jeri Slide Sandal',
    slug: 'jeri-slide-sandal',
    description: 'A sophisticated slide sandal with elegant hardware. Features a contoured footbed, leather upper, and modern silhouette. Effortless summer style.',
    shortDescription: 'Leather slide sandal with hardware',
    price: 125.00,
    originalPrice: 165.00,
    sku: 'LP-JS-001',
    thumbnail: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80', alt: 'Jeri Sandal - Top' },
      { url: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=800&q=80', alt: 'Jeri Sandal - Side' },
    ],
    stock: 1,
    rating: { average: 4.6, count: 43 },
    categorySlug: 'sandals',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Waverly Pointed Pump',
    slug: 'waverly-pointed-pump',
    description: 'A classic pointed-toe pump with kitten heel. Crafted from smooth leather with elegant branding. Perfect for work or special occasions.',
    shortDescription: 'Classic pointed-toe kitten heel',
    price: 185.00,
    originalPrice: 225.00,
    sku: 'LP-WP-001',
    thumbnail: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80', alt: 'Waverly Pump - Side' },
      { url: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=800&q=80', alt: 'Waverly Pump - Front' },
    ],
    stock: 1,
    rating: { average: 4.8, count: 92 },
    categorySlug: 'heels',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Eleanor Ballet Flat',
    slug: 'eleanor-ballet-flat',
    description: 'A timeless ballet flat with signature buckle detail. Features a soft leather upper, cushioned insole, and flexible rubber sole. All-day comfort with classic style.',
    shortDescription: 'Classic ballet flat with buckle detail',
    price: 145.00,
    originalPrice: 175.00,
    sku: 'LP-EBF-001',
    thumbnail: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80', alt: 'Eleanor Ballet Flat - Side' },
      { url: 'https://images.unsplash.com/photo-1598028068454-4eea35f9ba89?w=800&q=80', alt: 'Eleanor Ballet Flat - Top' },
    ],
    stock: 1,
    rating: { average: 4.7, count: 78 },
    categorySlug: 'flats',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Retro Runner Sneaker',
    slug: 'retro-runner-sneaker',
    description: 'A retro-inspired runner sneaker with mixed materials. Features premium canvas, suede overlays, and a chunky rubber sole. Athletic heritage meets modern design.',
    shortDescription: 'Retro runner with mixed materials',
    price: 165.00,
    originalPrice: 195.00,
    sku: 'LP-RS-001',
    thumbnail: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', alt: 'Retro Runner - Side' },
      { url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80', alt: 'Retro Runner - Back' },
    ],
    stock: 1,
    rating: { average: 4.5, count: 112 },
    categorySlug: 'sneakers',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Classic Chelsea Boot',
    slug: 'classic-chelsea-boot',
    description: 'A classic Chelsea boot with elastic side panels. Crafted from premium leather with a sturdy rubber sole and pull tab. Timeless style for every season.',
    shortDescription: 'Classic leather Chelsea boot',
    price: 295.00,
    originalPrice: 375.00,
    sku: 'LP-CB-001',
    thumbnail: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&q=80', alt: 'Chelsea Boot - Side' },
      { url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80', alt: 'Chelsea Boot - Back' },
    ],
    stock: 1,
    rating: { average: 4.9, count: 203 },
    categorySlug: 'boots',
    brand: 'Last Piece',
    status: 'active',
  },
  {
    name: 'Hazel Statement Heel',
    slug: 'hazel-statement-heel',
    description: 'A statement heel with elegant rose hardware. Features an adjustable ankle strap, block heel, and padded footbed. Bold elegance for special occasions.',
    shortDescription: 'Statement heel with rose hardware',
    price: 225.00,
    originalPrice: 295.00,
    sku: 'LP-HH-001',
    thumbnail: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', alt: 'Hazel Heel - Side' },
      { url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80', alt: 'Hazel Heel - Back' },
    ],
    stock: 1,
    rating: { average: 4.6, count: 167 },
    categorySlug: 'heels',
    brand: 'Last Piece',
    status: 'active',
  },
];

async function seedData() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/lastpiece';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('✓ Cleared existing categories and products');

    // Create categories
    const createdCategories = await Category.insertMany(CATEGORIES);
    console.log(`✓ Created ${createdCategories.length} categories`);

    // Create category map for products
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Add category IDs to products
    const productsWithCategories = PRODUCTS.map(product => ({
      ...product,
      category: categoryMap[product.categorySlug],
    }));

    // Remove categorySlug field
    productsWithCategories.forEach(p => delete p.categorySlug);

    // Create products
    const createdProducts = await Product.insertMany(productsWithCategories);
    console.log(`✓ Created ${createdProducts.length} products`);

    // Update category product counts
    for (const cat of createdCategories) {
      const count = await Product.countDocuments({ category: cat._id });
      await Category.findByIdAndUpdate(cat._id, { productCount: count });
    }
    console.log('✓ Updated category product counts');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('✗ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
