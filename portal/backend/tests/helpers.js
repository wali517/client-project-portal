import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { ROLES } from '../src/constants/index.js';

export const api = () => request(app);

export const createUser = async (overrides = {}) =>
  User.create({
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(16).slice(2)}@test.dev`,
    password: 'Passw0rd!',
    role: ROLES.CLIENT,
    ...overrides,
  });

export const loginAs = async (user, password = 'Passw0rd!') => {
  const res = await api().post('/api/auth/login').send({ email: user.email, password });
  return res.body?.data?.token;
};

export const createAndLogin = async (role = ROLES.CLIENT, overrides = {}) => {
  const user = await createUser({ role, ...overrides });
  const token = await loginAs(user);
  return { user, token };
};

export const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);
