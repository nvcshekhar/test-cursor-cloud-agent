const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'todos.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // If the file is corrupted, reset it rather than crash the server.
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    return [];
  }
}

function writeAll(todos) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

function listTodos() {
  return readAll();
}

function getTodo(id) {
  return readAll().find((t) => t.id === id) || null;
}

function createTodo({ title }) {
  const todos = readAll();
  const todo = {
    id: crypto.randomUUID(),
    title: String(title).trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  todos.push(todo);
  writeAll(todos);
  return todo;
}

function updateTodo(id, patch) {
  const todos = readAll();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const current = todos[idx];
  const next = {
    ...current,
    ...('title' in patch ? { title: String(patch.title).trim() } : {}),
    ...('completed' in patch ? { completed: Boolean(patch.completed) } : {}),
    updatedAt: new Date().toISOString(),
  };
  todos[idx] = next;
  writeAll(todos);
  return next;
}

function deleteTodo(id) {
  const todos = readAll();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  todos.splice(idx, 1);
  writeAll(todos);
  return true;
}

module.exports = {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
};
