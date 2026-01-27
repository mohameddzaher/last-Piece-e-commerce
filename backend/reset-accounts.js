#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import bcryptjs from 'bcryptjs';

dotenv.config();

async function resetAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Delete existing accounts
    await User.deleteMany({ email: { $in: ['admin@lastpiece.com', 'user@lastpiece.com'] } });
    console.log('✓ Deleted existing accounts');

    // Create admin - let the pre-save hook hash the password
    const admin = await User.create({
      email: 'admin@lastpiece.com',
      password: 'Admin@12345',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1-234-567-8900',
      role: 'admin',
      emailVerified: true,
    });
    console.log('✓ Created admin account:');
    console.log('  Email: admin@lastpiece.com');
    console.log('  Password: Admin@12345');

    // Create customer - let the pre-save hook hash the password
    const customer = await User.create({
      email: 'user@lastpiece.com',
      password: 'User@12345',
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+1-234-567-8901',
      role: 'customer',
      emailVerified: true,
    });
    console.log('✓ Created customer account:');
    console.log('  Email: user@lastpiece.com');
    console.log('  Password: User@12345');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

resetAccounts();
