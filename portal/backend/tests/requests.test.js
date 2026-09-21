import { jest } from '@jest/globals';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { api, createAndLogin } from './helpers.js';
import { ROLES, REQUEST_STATUS } from '../src/constants/index.js';

jest.setTimeout(60000);

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const newRequest = (token, overrides = {}) =>
  api()
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Landing page build',
      description: 'A single page site with a contact form and analytics.',
      serviceType: 'WEB_DEVELOPMENT',
      priority: 'HIGH',
      budget: 1200,
      ...overrides,
    });

describe('Request workflow', () => {
  it('creates a request with a unique number and NEW status', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    const first = await newRequest(client.token);
    const second = await newRequest(client.token);

    expect(first.status).toBe(201);
    expect(first.body.data.status).toBe(REQUEST_STATUS.NEW);
    expect(first.body.data.requestNumber).toMatch(/^REQ-\d{4}-\d{6}$/);
    expect(second.body.data.requestNumber).not.toBe(first.body.data.requestNumber);
  });

  it('rejects an invalid payload', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    const res = await newRequest(client.token, { title: 'x', description: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('runs review, approval and conversion to a project', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    const admin = await createAndLogin(ROLES.ADMIN);
    const created = await newRequest(client.token);
    const id = created.body.data._id;

    const review = await api()
      .post(`/api/requests/${id}/review`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: REQUEST_STATUS.UNDER_REVIEW, note: 'Checking scope' });
    expect(review.status).toBe(200);

    const approve = await api()
      .post(`/api/requests/${id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ note: 'Looks good' });
    expect(approve.body.data.status).toBe(REQUEST_STATUS.APPROVED);

    const convert = await api()
      .post(`/api/requests/${id}/convert`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({});
    expect(convert.status).toBe(201);
    expect(convert.body.data.projectNumber).toMatch(/^PRJ-\d{4}-\d{6}$/);

    const duplicate = await api()
      .post(`/api/requests/${id}/convert`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({});
    expect(duplicate.status).toBe(409);
  });

  it('records a rejection reason', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    const admin = await createAndLogin(ROLES.ADMIN);
    const created = await newRequest(client.token);

    const res = await api()
      .post(`/api/requests/${created.body.data._id}/reject`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ reason: 'Budget is below our minimum for this service.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(REQUEST_STATUS.REJECTED);
    expect(res.body.data.rejectionReason).toContain('Budget');
  });

  it('paginates and filters the request list', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    await newRequest(client.token, { title: 'Alpha site' });
    await newRequest(client.token, { title: 'Beta shop', serviceType: 'SEO' });

    const paged = await api()
      .get('/api/requests?page=1&limit=1')
      .set('Authorization', `Bearer ${client.token}`);
    expect(paged.body.data).toHaveLength(1);
    expect(paged.body.pagination.total).toBe(2);
    expect(paged.body.pagination.totalPages).toBe(2);

    const searched = await api()
      .get('/api/requests?search=Beta')
      .set('Authorization', `Bearer ${client.token}`);
    expect(searched.body.data).toHaveLength(1);

    const filtered = await api()
      .get('/api/requests?serviceType=SEO')
      .set('Authorization', `Bearer ${client.token}`);
    expect(filtered.body.data).toHaveLength(1);
  });
});
