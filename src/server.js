const path = require('path');
const express = require('express');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/todos', (req, res) => {
  res.json(store.listTodos());
});

app.get('/api/todos/:id', (req, res) => {
  const todo = store.getTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

app.post('/api/todos', (req, res) => {
  const { title } = req.body || {};
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  const todo = store.createTodo({ title });
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const { title, completed } = req.body || {};
  const patch = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
    patch.title = title;
  }
  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }
    patch.completed = completed;
  }
  const updated = store.updateTodo(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Todo not found' });
  res.json(updated);
});

// Additive bulk endpoint used by the Power-user UI's "Clear completed" button.
// Removes all completed todos in a single request and returns the remaining list.
app.post('/api/todos/clear-completed', (req, res) => {
  const { removed, remaining } = store.clearCompleted();
  res.json({ removed, todos: remaining });
});

app.delete('/api/todos/:id', (req, res) => {
  const ok = store.deleteTodo(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Todo not found' });
  res.status(204).end();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Todo app listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
