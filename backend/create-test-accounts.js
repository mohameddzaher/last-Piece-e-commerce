#!/usr/bin/env node

/**
 * Script to create test accounts
 * Run with: node create-test-accounts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const TEST_ACCOUNTS = [
  {
    email: 'admin@lastpiece.com',
    password: 'Admin@12345',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1-234-567-8900',
    role: 'admin',
  },
  {
    email: 'user@lastpiece.com',
    password: 'User@12345',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '+1-234-567-8901',
    role: 'customer',
  },
];

async function createTestAccounts() {
  try {
    // Use local MongoDB
    const mongoUri = 'mongodb://127.0.0.1:27017/lastpiece';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    for (const account of TEST_ACCOUNTS) {
      // Delete existing user if exists (to fix password hashing issues)
      const existingUser = await User.findOne({ email: account.email });

      if (existingUser) {
        await User.deleteOne({ email: account.email });
        console.log(`✓ Deleted existing account: ${account.email}`);
      }

      // Create new user (password will be hashed by the User model's pre-save hook)
      const newUser = await User.create({
        ...account,
        emailVerified: true, // Auto-verify test accounts
      });

      console.log(`✓ Created ${account.role} account:`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);
      console.log('   ---');
    }

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error creating test accounts:', error);
    process.exit(1);
  }
}

createTestAccounts();
