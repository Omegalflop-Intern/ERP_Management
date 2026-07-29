import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_shop_erp';
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Error]: Could not connect to MongoDB (${error.message}). Please check database configuration.`);
    return false;
  }
};
