#!/usr/bin/env node

/**
 * Script to seed sample products to database
 * Run with: node seed-products.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';

dotenv.config();

const SAMPLE_PRODUCTS = [
  {
    name: 'Nike Air Force 1 Low',
    slug: 'nike-air-force-1-low',
    description: 'Classic white leather sneaker with iconic design and comfortable fit. Perfect for everyday wear and casual styling.',
    shortDescription: 'Classic white leather sneaker',
    price: 129.99,
    originalPrice: 169.99,
    sku: 'NIKE-AF1-LOW-001',
    thumbnail: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=800&q=80', alt: 'Nike Air Force 1 Low - Front' },
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Nike Air Force 1 Low - Side' }
    ],
    stock: 45,
    rating: { average: 4.8, count: 1250 },
    badges: [{ label: 'Popular' }],
    status: 'active',
    specifications: {
      brand: 'Nike',
      color: 'White',
      size: 'US 6-14',
      material: '100% Leather',
      weight: '340g'
    }
  },
  {
    name: 'Adidas Ultraboost 22',
    slug: 'adidas-ultraboost-22',
    description: 'High-performance running shoe with Boost cushioning technology and modern aerodynamic design for maximum comfort.',
    shortDescription: 'High-performance running shoe',
    price: 199.99,
    originalPrice: 249.99,
    sku: 'ADIDAS-UB22-001',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Adidas Ultraboost 22 - Front' },
      { url: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=800&q=80', alt: 'Adidas Ultraboost 22 - Side' }
    ],
    stock: 38,
    rating: { average: 4.7, count: 890 },
    badges: [{ label: 'New' }],
    status: 'active',
    specifications: {
      brand: 'Adidas',
      color: 'Black/White',
      size: 'US 6-14',
      material: 'Primeknit + Boost',
      weight: '310g'
    }
  },
  {
    name: 'Puma RS-X Softcase',
    slug: 'puma-rs-x-softcase',
    description: 'Retro-inspired running shoe with modern comfort technology. Perfect blend of style and functionality for lifestyle wear.',
    shortDescription: 'Retro-inspired running shoe',
    price: 99.99,
    originalPrice: 139.99,
    sku: 'PUMA-RSX-001',
    thumbnail: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=800&q=80', alt: 'Puma RS-X - Front' },
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Puma RS-X - Detail' }
    ],
    stock: 52,
    rating: { average: 4.6, count: 680 },
    badges: [{ label: 'Sale' }],
    status: 'active',
    specifications: {
      brand: 'Puma',
      color: 'Red/Black',
      size: 'US 6-14',
      material: 'Synthetic + Mesh',
      weight: '320g'
    }
  },
  {
    name: 'Converse Chuck Taylor Classic',
    slug: 'converse-chuck-taylor-classic',
    description: 'Timeless canvas high-top sneaker perfect for any occasion. The iconic Chuck Taylor ankle patch and rubber sole make it instantly recognizable.',
    shortDescription: 'Timeless canvas high-top sneaker',
    price: 69.99,
    originalPrice: 89.99,
    sku: 'CONVERSE-CT-001',
    thumbnail: 'https://images.unsplash.com/photo-1632533584180-f7e9c8c24a05?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1632533584180-f7e9c8c24a05?w=800&q=80', alt: 'Converse Chuck Taylor - Front' },
      { url: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=800&q=80', alt: 'Converse Chuck Taylor - Side' }
    ],
    stock: 78,
    rating: { average: 4.9, count: 2100 },
    badges: [{ label: 'Classic' }],
    status: 'active',
    specifications: {
      brand: 'Converse',
      color: 'Red',
      size: 'US 5-13',
      material: '100% Canvas',
      weight: '280g'
    }
  },
  {
    name: 'New Balance 990v6',
    slug: 'new-balance-990v6',
    description: 'Premium made-in-USA classic sneaker with superior comfort and stability. The gold standard in athletic footwear.',
    shortDescription: 'Premium classic sneaker made in USA',
    price: 219.99,
    originalPrice: 279.99,
    sku: 'NB-990V6-001',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'New Balance 990v6 - Front' },
      { url: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=800&q=80', alt: 'New Balance 990v6 - Side' }
    ],
    stock: 32,
    rating: { average: 4.9, count: 1520 },
    badges: [{ label: 'Premium' }],
    status: 'active',
    specifications: {
      brand: 'New Balance',
      color: 'Gray/White',
      size: 'US 6-15',
      material: 'Suede + Mesh',
      weight: '350g'
    }
  },
  {
    name: 'Vans Old Skool Pro',
    slug: 'vans-old-skool-pro',
    description: 'Skate-inspired classic with reinforced construction for durability. The iconic side stripe and comfortable fit make it perfect for street style.',
    shortDescription: 'Skate-inspired classic sneaker',
    price: 89.99,
    originalPrice: 119.99,
    sku: 'VANS-OSP-001',
    thumbnail: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=800&q=80', alt: 'Vans Old Skool Pro - Front' },
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Vans Old Skool Pro - Detail' }
    ],
    stock: 61,
    rating: { average: 4.7, count: 950 },
    badges: [{ label: 'Trending' }],
    status: 'active',
    specifications: {
      brand: 'Vans',
      color: 'Black/White',
      size: 'US 5-14',
      material: 'Canvas + Suede',
      weight: '290g'
    }
  },
  {
    name: 'Jordan 1 Retro High',
    slug: 'jordan-1-retro-high',
    description: 'Legendary basketball silhouette with premium leather and iconic Air Jordan branding. A cultural icon and collectors favorite.',
    shortDescription: 'Legendary basketball silhouette',
    price: 249.99,
    originalPrice: 319.99,
    sku: 'JORDAN-1RH-001',
    thumbnail: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=800&q=80', alt: 'Jordan 1 Retro High - Front' },
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Jordan 1 Retro High - Detail' }
    ],
    stock: 28,
    rating: { average: 4.9, count: 1890 },
    badges: [{ label: 'Limited' }],
    status: 'active',
    specifications: {
      brand: 'Nike',
      color: 'Black/Red/White',
      size: 'US 6-15',
      material: 'Premium Leather',
      weight: '380g'
    }
  },
  {
    name: 'Saucony Endorphin Speed 3',
    slug: 'saucony-endorphin-speed-3',
    description: 'Carbon-infused racing shoe designed for marathon runners. Lightweight and responsive for maximum performance.',
    shortDescription: 'Carbon-infused racing shoe',
    price: 179.99,
    originalPrice: 229.99,
    sku: 'SAUCONY-ES3-001',
    thumbnail: 'https://images.unsplash.com/photo-1632533584180-f7e9c8c24a05?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1632533584180-f7e9c8c24a05?w=800&q=80', alt: 'Saucony Endorphin - Front' },
      { url: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=800&q=80', alt: 'Saucony Endorphin - Side' }
    ],
    stock: 40,
    rating: { average: 4.8, count: 760 },
    badges: [{ label: 'Performance' }],
    status: 'active',
    specifications: {
      brand: 'Saucony',
      color: 'White/Blue',
      size: 'US 6-15',
      material: 'Engineered Mesh',
      weight: '270g'
    }
  },
  {
    name: 'ASICS Gel-Lyte V',
    slug: 'asics-gel-lyte-v',
    description: 'Retro running silhouette with split tongue design and Gel cushioning. A favorite among sneaker enthusiasts worldwide.',
    shortDescription: 'Retro running with split tongue design',
    price: 139.99,
    originalPrice: 189.99,
    sku: 'ASICS-GLV-001',
    thumbnail: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=800&q=80', alt: 'ASICS Gel-Lyte V - Front' },
      { url: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=800&q=80', alt: 'ASICS Gel-Lyte V - Detail' }
    ],
    stock: 55,
    rating: { average: 4.7, count: 1120 },
    badges: [{ label: 'Retro' }],
    status: 'active',
    specifications: {
      brand: 'ASICS',
      color: 'Cream/Peacoat',
      size: 'US 6-14',
      material: 'Suede + Mesh',
      weight: '330g'
    }
  },
  {
    name: 'Reebok Classic Leather Legacy',
    slug: 'reebok-classic-leather-legacy',
    description: 'Timeless classic with heritage design and modern comfort. The perfect blend of retro style and contemporary technology.',
    shortDescription: 'Timeless classic with heritage design',
    price: 109.99,
    originalPrice: 149.99,
    sku: 'REEBOK-CLL-001',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Reebok Classic Leather - Front' },
      { url: 'https://images.unsplash.com/photo-1608889335941-33ac5f53cac2?w=800&q=80', alt: 'Reebok Classic Leather - Side' }
    ],
    stock: 67,
    rating: { average: 4.6, count: 820 },
    badges: [{ label: 'Heritage' }],
    status: 'active',
    specifications: {
      brand: 'Reebok',
      color: 'White/Navy',
      size: 'US 5-15',
      material: '100% Leather',
      weight: '310g'
    }
  },
  {
    name: 'Salomon XT-6',
    slug: 'salomon-xt-6',
    description: 'Trail-ready advanced hiking shoe with exceptional grip and ankle support. Built for serious outdoor adventures.',
    shortDescription: 'Trail-ready hiking shoe',
    price: 169.99,
    originalPrice: 219.99,
    sku: 'SALOMON-XT6-001',
    thumbnail: 'https://images.unsplash.com/photo-1632533584180-f7e9c8c24a05?w=500&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1632533584180-f7e9c8c24a05?w=800&q=80', alt: 'Salomon XT-6 - Front' },
      { url: 'https://images.unsplash.com/photo-1595777707802-14b976267935?w=800&q=80', alt: 'Salomon XT-6 - Detail' }
    ],
    stock: 35,
    rating: { average: 4.8, count: 670 },
    badges: [{ label: 'Outdoor' }],
    status: 'active',
    specifications: {
      brand: 'Salomon',
      color: 'Black/Gray',
      size: 'US 6-14',
      material: 'Gore-Tex + Rubber',
      weight: '380g'
    }
  }
];

async function seedProducts() {
  try {
    // Use local MongoDB for seeding
    const mongoUri = 'mongodb://127.0.0.1:27017/lastpiece';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Get or create category
    let category = await Category.findOne({ name: 'Shoes' });
    if (!category) {
      category = await Category.create({
        name: 'Shoes',
        slug: 'shoes',
        description: 'Premium footwear collection'
      });
      console.log('✓ Created Shoes category');
    }

    // Add category reference to all products
    const productsWithCategory = SAMPLE_PRODUCTS.map(product => ({
      ...product,
      category: category._id
    }));

    // Clear existing products
    await Product.deleteMany({ category: category._id });
    console.log('✓ Cleared existing products');

    // Insert new products
    const createdProducts = await Product.insertMany(productsWithCategory);
    console.log(`✓ Seeded ${createdProducts.length} products successfully!`);

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
