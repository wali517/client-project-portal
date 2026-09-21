import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { api, createUser, createAndLogin } from './helpers.js';
import User from '../src/models/User.js';
import { ROLES } from '../src/constants/index.js';

jest.setTimeout(60000);

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('Authentication', () => {
  it('hashes the password instead of storing it in plain text', async () => {
    const user = await createUser({ password: 'Passw0rd!' });
    const stored = await User.findById(user._id).select('+password');
    expect(stored.password).not.toBe('Passw0rd!');
    expect(await bcrypt.compare('Passw0rd!', stored.password)).toBe(true);
  });

  it('signs a user in and returns a token without the password', async () => {
    const user = await createUser();
    const res = await api().post('/api/auth/login').send({ email: user.email, password: 'Passw0rd!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects a wrong password with a generic message', async () => {
    const user = await createUser();
    const res = await api().post('/api/auth/login').send({ email: user.email, password: 'Wrong123!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('blocks deactivated accounts', async () => {
    const user = await createUser({ isActive: false });
    const res = await api().post('/api/auth/login').send({ email: user.email, password: 'Passw0rd!' });
    expect(res.status).toBe(403);
  });

  it('protects routes that need a token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the signed-in user on /me', async () => {
    const { user, token } = await createAndLogin(ROLES.ADMIN);
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
  });

  it('never reveals whether an email exists on forgot-password', async () => {
    const res = await api().post('/api/auth/forgot-password').send({ email: 'nobody@test.dev' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
