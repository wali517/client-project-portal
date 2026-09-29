import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as authApi from '../api/authApi.js';
import { clearStoredToken, getStoredToken, setStoredToken, setUnauthorizedHandler } from '../api/axios.js';
import { getErrorMessage } from '../utils/errors.js';
import { AuthContext } from './authContextObject.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const signOutLocally = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOutLocally();
      toast.error('Your session expired. Sign in again.');
    });
  }, [signOutLocally]);

  useEffect(() => {
    let timerId = null;
    const bootstrap = async () => {
      if (!getStoredToken()) {
        setStatus('anonymous');
        return;
      }
      try {
        const response = await authApi.me();
        setUser(response.data.user);
        setStatus('authenticated');
      } catch (err) {
        if (err?.response?.status === 429) {
          // If server returned 429 rate limit, do NOT sign out! Retry bootstrap after 4 seconds.
          timerId = setTimeout(bootstrap, 4000);
          return;
        }
        signOutLocally();
      }
    };
    bootstrap();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [signOutLocally]);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    setStoredToken(response.data.token);
    setUser(response.data.user);
    setStatus('authenticated');
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn(getErrorMessage(error));
    }
    signOutLocally();
  }, [signOutLocally]);

  const updateUser = useCallback((partial) => setUser((current) => ({ ...current, ...partial })), []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      updateUser,
    }),
    [user, status, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
