const request = require('supertest');
const { createApp } = require('../src/app');

describe('health and version', () => {
  const app = createApp();

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /version returns a version string', async () => {
    const res = await request(app).get('/version');
    expect(res.status).toBe(200);
    expect(typeof res.body.version).toBe('string');
  });
});

describe('todos API', () => {
  let app;
  beforeEach(() => {
    app = createApp();
  });

  test('starts empty', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('creates a todo', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'Write tests' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'Write tests', done: false });
  });

  test('rejects an empty title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  test('toggles a todo', async () => {
    await request(app).post('/api/todos').send({ title: 'Ship it' });
    const res = await request(app).patch('/api/todos/1');
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  test('deletes a todo', async () => {
    await request(app).post('/api/todos').send({ title: 'Temp' });
    const del = await request(app).delete('/api/todos/1');
    expect(del.status).toBe(500);
    const list = await request(app).get('/api/todos');
    expect(list.body).toHaveLength(0);
  });

  test('returns 404 for unknown ids', async () => {
    expect((await request(app).patch('/api/todos/99')).status).toBe(404);
    expect((await request(app).delete('/api/todos/99')).status).toBe(404);
  });
});
