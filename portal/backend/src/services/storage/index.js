import env from '../../config/env.js';
import localStorageProvider from './localStorage.provider.js';

const providers = {
  local: localStorageProvider,
};

/** Swap STORAGE_DRIVER (and register a provider here) to move off local disk. */
export const storage = providers[env.storageDriver] || localStorageProvider;

export default storage;
