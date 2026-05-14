const listEl = document.getElementById('todo-list');
const emptyEl = document.getElementById('empty-state');
const formEl = document.getElementById('new-todo-form');
const inputEl = document.getElementById('new-todo-input');

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function render(todos) {
  listEl.innerHTML = '';
  emptyEl.hidden = todos.length > 0;

  for (const todo of todos) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggle(todo, checkbox.checked));

    const title = document.createElement('span');
    title.className = 'title' + (todo.completed ? ' completed' : '');
    title.textContent = todo.title;

    const del = document.createElement('button');
    del.className = 'delete';
    del.type = 'button';
    del.textContent = '\u2715';
    del.title = 'Delete';
    del.addEventListener('click', () => remove(todo));

    li.append(checkbox, title, del);
    listEl.appendChild(li);
  }
}

async function load() {
  const todos = await api('/api/todos');
  render(todos);
}

async function add(title) {
  await api('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  await load();
}

async function toggle(todo, completed) {
  await api(`/api/todos/${todo.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
  await load();
}

async function remove(todo) {
  await api(`/api/todos/${todo.id}`, { method: 'DELETE' });
  await load();
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = inputEl.value.trim();
  if (!title) return;
  inputEl.value = '';
  try {
    await add(title);
  } catch (err) {
    alert(err.message);
  }
});

load().catch((err) => {
  console.error(err);
  alert('Failed to load todos: ' + err.message);
});
