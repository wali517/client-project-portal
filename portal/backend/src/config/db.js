import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

export const connectDB = async (uri = env.mongoUri) => {
  if (!uri) {
    throw new Error('MONGO_URI is missing');
  }

  const connection = await mongoose.connect(uri, {
    autoIndex: !env.isProduction,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  if (connection.connection.readyState !== 1) {
    throw new Error(
      `MongoDB connection is not ready. readyState=${connection.connection.readyState}`
    );
  }

  logger.info(
    `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
  );

  return connection;
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export default connectDB;