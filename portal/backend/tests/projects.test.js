import { jest } from '@jest/globals';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';
import { api, createAndLogin } from './helpers.js';
import ActivityLog from '../src/models/ActivityLog.js';
import { ROLES, PROJECT_STATUS, ACTIVITY_ACTIONS } from '../src/constants/index.js';

jest.setTimeout(60000);

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

const setup = async () => {
  const admin = await createAndLogin(ROLES.ADMIN);
  const staff = await createAndLogin(ROLES.STAFF);
  const otherStaff = await createAndLogin(ROLES.STAFF);
  const client = await createAndLogin(ROLES.CLIENT);

  const created = await api()
    .post('/api/projects')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      client: String(client.user._id),
      title: 'Brand refresh',
      description: 'New logo, palette and brand guidelines document.',
      serviceType: 'GRAPHIC_DESIGN',
      priority: 'MEDIUM',
      budget: 2500,
    });

  return { admin, staff, otherStaff, client, project: created.body.data };
};

describe('Project workflow', () => {
  it('creates a project with a unique number', async () => {
    const { project } = await setup();
    expect(project.projectNumber).toMatch(/^PRJ-\d{4}-\d{6}$/);
    expect(project.status).toBe(PROJECT_STATUS.NOT_STARTED);
  });

  it('assigns staff and restricts unassigned staff', async () => {
    const { admin, staff, otherStaff, project } = await setup();

    const assign = await api()
      .post(`/api/projects/${project._id}/assign`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ staffIds: [String(staff.user._id)] });
    expect(assign.status).toBe(201);

    const assigned = await api()
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${staff.token}`);
    expect(assigned.status).toBe(200);

    const blocked = await api()
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${otherStaff.token}`);
    expect(blocked.status).toBe(403);

    const list = await api().get('/api/projects').set('Authorization', `Bearer ${otherStaff.token}`);
    expect(list.body.data).toHaveLength(0);
  });

  it('validates status transitions', async () => {
    const { admin, project } = await setup();

    const invalid = await api()
      .patch(`/api/projects/${project._id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: PROJECT_STATUS.COMPLETED });
    expect(invalid.status).toBe(400);

    const valid = await api()
      .patch(`/api/projects/${project._id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: PROJECT_STATUS.IN_PROGRESS });
    expect(valid.body.data.status).toBe(PROJECT_STATUS.IN_PROGRESS);
  });

  it('updates progress and logs the change', async () => {
    const { admin, staff, project } = await setup();
    await api()
      .post(`/api/projects/${project._id}/assign`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ staffIds: [String(staff.user._id)] });

    const res = await api()
      .patch(`/api/projects/${project._id}/progress`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ progress: 45 });

    expect(res.body.data.progress).toBe(45);
    const logged = await ActivityLog.findOne({
      project: project._id,
      action: ACTIVITY_ACTIONS.PROJECT_PROGRESS_UPDATED,
    });
    expect(logged).toBeTruthy();
  });

  it('runs submit, admin revision, resubmit, admin approval and client approval', async () => {
    const { admin, staff, client, project } = await setup();
    const auth = (token) => ({ Authorization: `Bearer ${token}` });

    await api().post(`/api/projects/${project._id}/assign`).set(auth(admin.token)).send({ staffIds: [String(staff.user._id)] });
    await api().patch(`/api/projects/${project._id}/status`).set(auth(staff.token)).send({ status: PROJECT_STATUS.IN_PROGRESS });

    const submitted = await api().post(`/api/projects/${project._id}/submit`).set(auth(staff.token)).send({ note: 'First draft' });
    expect(submitted.body.data.status).toBe(PROJECT_STATUS.UNDER_REVIEW);

    const revision = await api()
      .post(`/api/projects/${project._id}/review`)
      .set(auth(admin.token))
      .send({ decision: 'REQUEST_REVISION', reason: 'The palette does not match the brief.' });
    expect(revision.body.data.project.status).toBe(PROJECT_STATUS.REVISION_REQUIRED);

    const resubmitted = await api().post(`/api/projects/${project._id}/submit`).set(auth(staff.token)).send({});
    expect(resubmitted.body.data.status).toBe(PROJECT_STATUS.UNDER_REVIEW);

    const approved = await api()
      .post(`/api/projects/${project._id}/review`)
      .set(auth(admin.token))
      .send({ decision: 'APPROVE' });
    expect(approved.body.data.project.status).toBe(PROJECT_STATUS.WAITING_FOR_CLIENT);

    const clientApproval = await api()
      .post(`/api/projects/${project._id}/approve`)
      .set(auth(client.token))
      .send({ feedback: 'Happy with this.' });
    expect(clientApproval.body.data.status).toBe(PROJECT_STATUS.COMPLETED);
    expect(clientApproval.body.data.approvedAt).toBeTruthy();
  });

  it('lets a client send the work back for revision', async () => {
    const { admin, staff, client, project } = await setup();
    const auth = (token) => ({ Authorization: `Bearer ${token}` });

    await api().post(`/api/projects/${project._id}/assign`).set(auth(admin.token)).send({ staffIds: [String(staff.user._id)] });
    await api().patch(`/api/projects/${project._id}/status`).set(auth(staff.token)).send({ status: PROJECT_STATUS.IN_PROGRESS });
    await api().post(`/api/projects/${project._id}/submit`).set(auth(staff.token)).send({});
    await api().post(`/api/projects/${project._id}/review`).set(auth(admin.token)).send({ decision: 'APPROVE' });

    const res = await api()
      .post(`/api/projects/${project._id}/revisions`)
      .set(auth(client.token))
      .send({ reason: 'Please change the cover layout.' });

    expect(res.status).toBe(201);
    expect(res.body.data.project.status).toBe(PROJECT_STATUS.REVISION_REQUIRED);

    const revisions = await api().get(`/api/projects/${project._id}/revisions`).set(auth(client.token));
    expect(revisions.body.data).toHaveLength(1);
  });

  it('stops another client from approving a project', async () => {
    const { admin, staff, project } = await setup();
    const stranger = await createAndLogin(ROLES.CLIENT);
    const auth = (token) => ({ Authorization: `Bearer ${token}` });

    await api().post(`/api/projects/${project._id}/assign`).set(auth(admin.token)).send({ staffIds: [String(staff.user._id)] });
    await api().patch(`/api/projects/${project._id}/status`).set(auth(staff.token)).send({ status: PROJECT_STATUS.IN_PROGRESS });
    await api().post(`/api/projects/${project._id}/submit`).set(auth(staff.token)).send({});
    await api().post(`/api/projects/${project._id}/review`).set(auth(admin.token)).send({ decision: 'APPROVE' });

    const res = await api().post(`/api/projects/${project._id}/approve`).set(auth(stranger.token)).send({});
    expect(res.status).toBe(403);
  });

  it('records activity for status changes and assignments', async () => {
    const { admin, staff, project } = await setup();
    await api()
      .post(`/api/projects/${project._id}/assign`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ staffIds: [String(staff.user._id)] });

    const activity = await api()
      .get(`/api/projects/${project._id}/activity`)
      .set('Authorization', `Bearer ${admin.token}`);

    const actions = activity.body.data.map((entry) => entry.action);
    expect(actions).toContain(ACTIVITY_ACTIONS.STAFF_ASSIGNED);
    expect(actions).toContain(ACTIVITY_ACTIONS.PROJECT_CREATED);
  });
});
