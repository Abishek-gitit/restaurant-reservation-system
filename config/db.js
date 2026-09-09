const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    // Attempt standard connection first with 3s timeout
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (initialError) {
    // If local connection refused in dev/test, fallback to in-memory MongoDB
    if (env.nodeEnv !== 'production' && (initialError.message.includes('ECONNREFUSED') || initialError.name === 'MongooseServerSelectionError')) {
      console.warn(`[MongoDB] Local daemon not reachable at ${env.mongoUri}. Starting embedded in-memory MongoDB instance for development...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri();
        await mongoose.connect(memoryUri);
        console.log(`[MongoDB] Connected to embedded in-memory MongoDB instance at ${memoryUri}`);
        return mongoose.connection;
      } catch (memError) {
        console.error('[MongoDB] Failed to start in-memory MongoDB server:', memError.message);
        throw initialError;
      }
    } else {
      console.error('[MongoDB] Connection error:', initialError.message);
      throw initialError;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database.');
  });

  return mongoose.connection;
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('[MongoDB] Connection closed.');
  } catch (error) {
    console.error('[MongoDB] Error during disconnect:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
