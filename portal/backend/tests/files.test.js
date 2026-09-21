import { jest } from '@jest/globals';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { api, createAndLogin } from './helpers.js';
import { ROLES } from '../src/constants/index.js';

jest.setTimeout(60000);

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const createRequestFor = async (token) =>
  api()
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Brochure design',
      description: 'An eight page brochure for the spring product line.',
      serviceType: 'GRAPHIC_DESIGN',
    });

describe('File management', () => {
  it('uploads a file against a request and lets the owner download it', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    const created = await createRequestFor(client.token);

    const upload = await api()
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${client.token}`)
      .field('requestId', String(created.body.data._id))
      .attach('files', Buffer.from('brief contents'), { filename: 'brief.txt', contentType: 'text/plain' });

    expect(upload.status).toBe(201);
    expect(upload.body.data[0].originalName).toBe('brief.txt');

    const download = await api()
      .get(`/api/files/${upload.body.data[0]._id}/download`)
      .set('Authorization', `Bearer ${client.token}`);
    expect(download.status).toBe(200);
  });

  it('rejects an unsupported file type', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    const created = await createRequestFor(client.token);

    const upload = await api()
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${client.token}`)
      .field('requestId', String(created.body.data._id))
      .attach('files', Buffer.from('MZ binary'), { filename: 'virus.exe', contentType: 'application/x-msdownload' });

    expect(upload.status).toBe(400);
  });

  it('stops another client from reading the file', async () => {
    const client = await createAndLogin(ROLES.CLIENT);
    const stranger = await createAndLogin(ROLES.CLIENT);
    const created = await createRequestFor(client.token);

    const upload = await api()
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${client.token}`)
      .field('requestId', String(created.body.data._id))
      .attach('files', Buffer.from('private'), { filename: 'private.txt', contentType: 'text/plain' });

    const res = await api()
      .get(`/api/files/${upload.body.data[0]._id}`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(res.status).toBe(403);
  });
});
