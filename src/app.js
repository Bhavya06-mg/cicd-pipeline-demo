const express = require('express');
const path = require('path');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  let todos = [];
  let nextId = 1;

  // Liveness/readiness probe used by Docker and Kubernetes
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Shows which commit is running, which is handy for verifying a deploy
  app.get('/version', (_req, res) =>
    res.json({ version: process.env.GIT_SHA || 'dev' })
  );

  app.get('/api/todos', (_req, res) => res.json(todos));

  app.post('/api/todos', (req, res) => {
    const title = (req.body && req.body.title ? String(req.body.title) : '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });
    const todo = { id: nextId++, title, done: false };
    todos.push(todo);
    return res.status(201).json(todo);
  });

  app.patch('/api/todos/:id', (req, res) => {
    const todo = todos.find((t) => t.id === Number(req.params.id));
    if (!todo) return res.status(404).json({ error: 'not found' });
    todo.done = !todo.done;
    return res.json(todo);
  });

  app.delete('/api/todos/:id', (req, res) => {
    const before = todos.length;
    todos = todos.filter((t) => t.id !== Number(req.params.id));
    if (todos.length === before) return res.status(404).json({ error: 'not found' });
    return res.status(204).end();
  });

  return app;
}

module.exports = { createApp };
