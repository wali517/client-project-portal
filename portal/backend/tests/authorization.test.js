import { jest } from '@jest/globals';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { api, createAndLogin } from './helpers.js';
import { ROLES } from '../src/constants/index.js';

jest.setTimeout(60000);

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('Role based authorization', () => {
  it('lets an admin list users', async () => {
    const { token } = await createAndLogin(ROLES.ADMIN);
    const res = await api().get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('stops a client from creating users', async () => {
    const { token } = await createAndLogin(ROLES.CLIENT);
    const res = await api()
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', email: 'x@test.dev', password: 'Passw0rd!', role: ROLES.STAFF });
    expect(res.status).toBe(403);
  });

  it('stops staff from creating projects', async () => {
    const { token } = await createAndLogin(ROLES.STAFF);
    const res = await api().post('/api/projects').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(403);
  });

  it('stops a client from reading another client request', async () => {
    const admin = await createAndLogin(ROLES.ADMIN);
    const clientA = await createAndLogin(ROLES.CLIENT);
    const clientB = await createAndLogin(ROLES.CLIENT);

    const created = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${clientA.token}`)
      .send({
        title: 'Private request',
        description: 'Something confidential for client A only.',
        serviceType: 'SEO',
      });
    expect(created.status).toBe(201);

    const forbidden = await api()
      .get(`/api/requests/${created.body.data._id}`)
      .set('Authorization', `Bearer ${clientB.token}`);
    expect(forbidden.status).toBe(403);

    const adminView = await api()
      .get(`/api/requests/${created.body.data._id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(adminView.status).toBe(200);
  });

  it('allows admin to delete activity logs but blocks non-admin', async () => {
    const admin = await createAndLogin(ROLES.ADMIN);
    const client = await createAndLogin(ROLES.CLIENT);

    const clientAttempt = await api()
      .delete('/api/activity')
      .set('Authorization', `Bearer ${client.token}`);
    expect(clientAttempt.status).toBe(403);

    const adminAttempt = await api()
      .delete('/api/activity')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(adminAttempt.status).toBe(200);
    expect(adminAttempt.body.success).toBe(true);
  });
});
