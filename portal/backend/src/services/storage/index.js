import env from '../../config/env.js';
import localStorageProvider from './localStorage.provider.js';

const providers = {
  local: localStorageProvider,
};
export const storage = providers[env.storageDriver] || localStorageProvider;

export default storage;
