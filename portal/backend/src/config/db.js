import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);
export const connectDB = async (uri = env.mongoUri) => {
  const connection = await mongoose.connect(uri, {
    autoIndex: !env.isProduction
  });

  logger.info(
    `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
  );

  return connection;
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export default connectDB;
