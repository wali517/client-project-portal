import { jest } from '@jest/globals';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { api, createAndLogin } from './helpers.js';
import { ROLES } from '../src/constants/index.js';

jest.setTimeout(60000);

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

describe('Project messaging', () => {
  it('keeps conversations inside the project the user can access', async () => {
    const admin = await createAndLogin(ROLES.ADMIN);
    const client = await createAndLogin(ROLES.CLIENT);
    const stranger = await createAndLogin(ROLES.CLIENT);

    const project = await api()
      .post('/api/projects')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        client: String(client.user._id),
        title: 'Monthly SEO retainer',
        description: 'Ongoing keyword work and monthly reporting for the storefront.',
        serviceType: 'SEO',
      });

    const sent = await api()
      .post(`/api/projects/${project.body.data._id}/messages`)
      .set('Authorization', `Bearer ${client.token}`)
      .send({ message: 'Can we add the blog to the scope?' });
    expect(sent.status).toBe(201);

    const read = await api()
      .get(`/api/projects/${project.body.data._id}/messages`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(read.body.data).toHaveLength(1);

    const blocked = await api()
      .get(`/api/projects/${project.body.data._id}/messages`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(blocked.status).toBe(403);
  });
});
