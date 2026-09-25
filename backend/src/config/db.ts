import dns from 'dns';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env.js';

// Configure public DNS fallback for Atlas SRV resolution (prevents querySrv ECONNREFUSED on local routers)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

let isConnected = false;
let memoryServer: MongoMemoryServer | null = null;

// Connection event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('✅ MongoDB connection established.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('🔄 MongoDB reconnected.');
});

export const connectDB = async (): Promise<boolean> => {
  // First attempt: Connect to configured MONGO_URI (e.g. Atlas or local MongoDB)
  if (ENV.MONGO_URI && !ENV.MONGO_URI.includes('localhost:27017')) {
    try {
      console.log(`🔌 Connecting to external MongoDB cluster: ${ENV.MONGO_URI.split('@').pop() || ENV.MONGO_URI}`);
      await mongoose.connect(ENV.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to connect to external MongoDB: ${error.message}`);
    }
  }

  // Second attempt: Try local MongoDB URI
  try {
    const uri = ENV.MONGO_URI || 'mongodb://localhost:27017/ai_interview_platform';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
    return true;
  } catch (localErr: any) {
    console.log(`ℹ️ Local MongoDB daemon on 27017 not detected (${localErr.message}).`);
  }

  // Third fallback for zero-dependency local dev/test: spawn MongoMemoryServer instance
  try {
    console.log('🚀 Initializing embedded local MongoDB Database Engine...');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    isConnected = true;
    console.log(`✅ Embedded local MongoDB running & connected at: ${memUri}`);
    return true;
  } catch (memErr: any) {
    isConnected = false;
    console.error(`❌ Failed to launch embedded MongoDB: ${memErr.message}`);
    return false;
  }
};

export const isMongoConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const getDbStatus = () => {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;
  return {
    status: stateMap[state] || 'unknown',
    readyState: state,
    isConnected: state === 1,
    isEmbedded: !!memoryServer,
    host: mongoose.connection.host || null,
    port: (mongoose.connection as any).port || null,
    dbName: mongoose.connection.name || null,
  };
};
