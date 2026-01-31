#!/usr/bin/env node

/**
 * Script to create a super-admin test account
 * Run with: node seed-superadmin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const SUPER_ADMIN = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'superadmin@lastpiece.com',
  password: 'SuperAdmin123!',
  role: 'super-admin',
  emailVerified: true,
  status: 'active',
};

async function seedSuperAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lastpiece';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Delete existing super-admin to recreate with correct password
    await User.deleteOne({ email: SUPER_ADMIN.email });

    // Create super-admin (password will be hashed by pre-save hook in User model)
    const superAdmin = await User.create(SUPER_ADMIN);

    console.log('Super-admin account created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', SUPER_ADMIN.email);
    console.log('Password:', SUPER_ADMIN.password);
    console.log('-----------------------------------');
    console.log('User ID:', superAdmin._id);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating super-admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
