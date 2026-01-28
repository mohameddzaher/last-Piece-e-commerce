import mongoose from 'mongoose';

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get connection strings at runtime (not at module load)
const getConnectionStrings = () => {
  const strings = [];

  // In production, use Atlas directly
  if (process.env.NODE_ENV === 'production') {
    if (process.env.MONGODB_URI) {
      strings.push(process.env.MONGODB_URI);
    }
  } else {
    // In development, try local first, then Atlas
    strings.push('mongodb://127.0.0.1:27017/lastpiece');
    if (process.env.MONGODB_URI) {
      strings.push(process.env.MONGODB_URI);
    }
  }

  return strings;
};

export const connectDB = async (uriIndex = 0, retryCount = 0) => {
  const connectionStrings = getConnectionStrings();
  const uri = connectionStrings[uriIndex];

  if (!uri) {
    console.error('No more database connections to try.');
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running without database in development mode...');
      console.log('API will return mock responses where possible.');
      return null;
    }
    process.exit(1);
  }

  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
  console.log(`📡 Attempting to connect to ${isLocal ? 'Local' : 'Atlas'} MongoDB...`);

  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    const conn = await mongoose.connect(uri, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected. Will reconnect on next request.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    return conn;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);

    // If we haven't exhausted retries for this URI
    if (retryCount < MAX_RETRIES) {
      console.log(`   Retrying in ${RETRY_DELAY / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return connectDB(uriIndex, retryCount + 1);
    }

    // Try next connection string
    if (uriIndex < connectionStrings.length - 1) {
      console.log(`\n📡 Trying fallback database connection...`);
      return connectDB(uriIndex + 1, 0);
    }

    // All options exhausted
    console.error('\n⚠️  Could not connect to any MongoDB database.');
    console.error('Please ensure either:');
    console.error('  1. MONGODB_URI is set correctly in environment variables');
    console.error('  2. Your IP is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for Render)');
    console.error('  3. MongoDB Atlas cluster is running and accessible');

    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔧 Running in development mode without database...');
      return null;
    }

    // In production, don't crash - let server start but log error
    console.error('\n⚠️  Server will start but API endpoints will fail without database connection.');
    console.error('Check MONGODB_URI in Render environment variables.');
    return null;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

// Check if database is connected
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};
