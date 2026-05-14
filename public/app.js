/* =============================================================================
 * Power-user todo UI
 *
 * - Filter tabs (all/active/completed) with persisted state
 * - Debounced substring search that composes with the filter
 * - Inline edit on double-click (Enter saves, Esc cancels, blur saves)
 * - Bulk actions: toggle-all (respects current filter+search) and clear completed
 * - Full keyboard nav (n, /, j/k, arrows, x, e, d, ?, Esc, 1/2/3)
 * - Optimistic mutations that roll back on server error
 * ============================================================================= */

(() => {
  const $ = (id) => document.getElementById(id);

  const listEl = $('todo-list');
  const emptyEl = $('empty-state');
  const formEl = $('new-todo-form');
  const inputEl = $('new-todo-input');
  const searchEl = $('search-input');
  const toggleAllEl = $('toggle-all');
  const clearCompletedEl = $('clear-completed');
  const errorBannerEl = $('error-banner');
  const cheatsheetEl = $('cheatsheet');
  const cheatsheetCloseEl = $('cheatsheet-close');
  const helpBtnEl = $('help-btn');
  const filterTabs = Array.from(document.querySelectorAll('.filter-tab'));
  const countEls = {
    all: document.querySelector('[data-count="all"]'),
    active: document.querySelector('[data-count="active"]'),
    completed: document.querySelector('[data-count="completed"]'),
    total: $('count-total'),
    activeStatus: $('count-active'),
    completedStatus: $('count-completed'),
  };

  // ------- State -------
  const FILTER_KEY = 'todo.power.filter';
  /** @type {{id:string,title:string,completed:boolean}[]} */
  let todos = [];
  let filter = loadFilter();
  let search = '';
  let focusedId = null; // id of the currently focused row
  let editingId = null; // id of the row being edited (if any)

  function loadFilter() {
    try {
      const v = localStorage.getItem(FILTER_KEY);
      if (v === 'active' || v === 'completed') return v;
    } catch (_) {}
    return 'all';
  }
  function saveFilter() {
    try { localStorage.setItem(FILTER_KEY, filter); } catch (_) {}
  }

  // ------- API helpers -------
  async function api(path, options = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok && res.status !== 204) {
      let msg = `Request failed: ${res.status}`;
      try {
        const body = await res.json();
        if (body && body.error) msg = body.error;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  function showError(msg) {
    errorBannerEl.textContent = msg;
    errorBannerEl.hidden = false;
  }
  function clearError() {
    errorBannerEl.hidden = true;
    errorBannerEl.textContent = '';
  }

  // ------- Derived selectors -------
  function matchesFilter(t) {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  }
  function matchesSearch(t) {
    if (!search) return true;
    return t.title.toLowerCase().includes(search);
  }
  function visibleTodos() {
    return todos.filter((t) => matchesFilter(t) && matchesSearch(t));
  }

  // ------- Rendering -------
  function render() {
    const visible = visibleTodos();

    // Ensure focusedId is still in the visible list, else fall back to first.
    if (focusedId && !visible.some((t) => t.id === focusedId)) {
      focusedId = visible.length ? visible[0].id : null;
    }
    if (!focusedId && visible.length) focusedId = visible[0].id;

    // Toggle-all state: checked iff all visible are completed (and there are some).
    if (visible.length === 0) {
      toggleAllEl.checked = false;
      toggleAllEl.indeterminate = false;
      toggleAllEl.disabled = true;
    } else {
      toggleAllEl.disabled = false;
      const allDone = visible.every((t) => t.completed);
      const noneDone = visible.every((t) => !t.completed);
      toggleAllEl.checked = allDone;
      toggleAllEl.indeterminate = !allDone && !noneDone;
    }

    // Filter tab a11y state
    for (const tab of filterTabs) {
      const isSel = tab.dataset.filter === filter;
      tab.setAttribute('aria-selected', isSel ? 'true' : 'false');
    }

    // Counts (server truth; filter counts ignore search by design)
    const totalCount = todos.length;
    const activeCount = todos.filter((t) => !t.completed).length;
    const completedCount = totalCount - activeCount;
    countEls.all.textContent = String(totalCount);
    countEls.active.textContent = String(activeCount);
    countEls.completed.textContent = String(completedCount);
    countEls.total.textContent = String(totalCount);
    countEls.activeStatus.textContent = String(activeCount);
    countEls.completedStatus.textContent = String(completedCount);

    clearCompletedEl.disabled = completedCount === 0;

    // List
    listEl.innerHTML = '';
    if (visible.length === 0) {
      emptyEl.hidden = false;
      const title = emptyEl.querySelector('.empty-title');
      if (title) {
        if (todos.length === 0) title.textContent = 'No todos yet.';
        else if (search) title.textContent = 'No matches for your search.';
        else if (filter === 'active') title.textContent = 'Nothing active — nice.';
        else if (filter === 'completed') title.textContent = 'Nothing completed yet.';
        else title.textContent = 'No todos yet.';
      }
      return;
    }
    emptyEl.hidden = true;

    const frag = document.createDocumentFragment();
    visible.forEach((todo, i) => frag.appendChild(renderRow(todo, i)));
    listEl.appendChild(frag);
  }

  function renderRow(todo, index) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', focusedId === todo.id ? 'true' : 'false');
    if (todo.completed) li.classList.add('completed');
    if (focusedId === todo.id) li.classList.add('focused');

    // Checkbox cell
    const cbWrap = document.createElement('label');
    cbWrap.className = 'checkbox-wrap';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = todo.completed;
    cb.setAttribute('aria-label', `Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`);
    cb.addEventListener('change', () => {
      toggleOne(todo.id, cb.checked);
    });
    cb.addEventListener('focus', () => setFocused(todo.id, false));
    cbWrap.appendChild(cb);

    // Title cell
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = todo.title;
    titleSpan.addEventListener('dblclick', () => beginEdit(todo.id));

    // ID badge (compact, monospace)
    const idEl = document.createElement('span');
    idEl.className = 'id';
    idEl.textContent = `#${String(index + 1).padStart(2, '0')}`;
    idEl.title = todo.id;

    // Delete button
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete';
    del.textContent = '✕';
    del.title = 'Delete (d)';
    del.setAttribute('aria-label', `Delete "${todo.title}"`);
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      removeOne(todo.id);
    });

    li.addEventListener('click', (e) => {
      if (e.target === cb || e.target === del) return;
      setFocused(todo.id, false);
    });

    li.append(cbWrap, titleSpan, idEl, del);

    // If this is the row currently being edited, swap in the editor immediately.
    if (editingId === todo.id) {
      mountEditor(li, titleSpan, todo);
    }

    return li;
  }

  function setFocused(id, scroll = true) {
    if (id === focusedId) return;
    focusedId = id;
    for (const li of listEl.querySelectorAll('li')) {
      const on = li.dataset.id === id;
      li.classList.toggle('focused', on);
      li.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && scroll) li.scrollIntoView({ block: 'nearest' });
    }
  }

  // ------- Mutations (optimistic with rollback) -------
  async function addTodo(title) {
    title = title.trim();
    if (!title) return;
    const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
    const optimistic = { id: tempId, title, completed: false };
    todos.push(optimistic);
    focusedId = tempId;
    render();
    try {
      const created = await api('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      // Replace temp entry with server entry, preserving position.
      const idx = todos.findIndex((t) => t.id === tempId);
      if (idx !== -1) todos[idx] = created;
      if (focusedId === tempId) focusedId = created.id;
      clearError();
    } catch (err) {
      todos = todos.filter((t) => t.id !== tempId);
      showError(`Add failed: ${err.message}`);
    }
    render();
  }

  async function toggleOne(id, completed) {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    const prev = t.completed;
    t.completed = completed;
    render();
    try {
      const updated = await api(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });
      Object.assign(t, updated);
      clearError();
    } catch (err) {
      t.completed = prev;
      showError(`Update failed: ${err.message}`);
    }
    render();
  }

  async function editTitle(id, newTitle) {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    newTitle = newTitle.trim();
    if (!newTitle) {
      // Treat empty edit as a delete (TodoMVC convention).
      return removeOne(id);
    }
    if (newTitle === t.title) return;
    const prev = t.title;
    t.title = newTitle;
    render();
    try {
      const updated = await api(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle }),
      });
      Object.assign(t, updated);
      clearError();
    } catch (err) {
      t.title = prev;
      showError(`Edit failed: ${err.message}`);
    }
    render();
  }

  async function removeOne(id) {
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const [removed] = todos.splice(idx, 1);
    // Pick a sensible next focus target.
    const vis = visibleTodos();
    focusedId = vis.length ? vis[Math.min(idx, vis.length - 1)].id : null;
    render();
    try {
      await api(`/api/todos/${id}`, { method: 'DELETE' });
      clearError();
    } catch (err) {
      todos.splice(idx, 0, removed);
      focusedId = id;
      showError(`Delete failed: ${err.message}`);
      render();
    }
  }

  async function toggleAllVisible(targetCompleted) {
    const visible = visibleTodos();
    const changed = visible.filter((t) => t.completed !== targetCompleted);
    if (changed.length === 0) return;
    const prevStates = changed.map((t) => ({ id: t.id, prev: t.completed }));
    for (const t of changed) t.completed = targetCompleted;
    render();
    try {
      await Promise.all(
        changed.map((t) =>
          api(`/api/todos/${t.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ completed: targetCompleted }),
          })
        )
      );
      clearError();
    } catch (err) {
      for (const { id, prev } of prevStates) {
        const t = todos.find((x) => x.id === id);
        if (t) t.completed = prev;
      }
      showError(`Bulk update failed: ${err.message}`);
    }
    render();
  }

  async function clearCompleted() {
    const completed = todos.filter((t) => t.completed);
    if (completed.length === 0) return;
    const snapshot = todos.slice();
    todos = todos.filter((t) => !t.completed);
    render();
    try {
      // Prefer the additive bulk endpoint when available; fall back to N DELETEs.
      const res = await fetch('/api/todos/clear-completed', { method: 'POST' });
      if (!res.ok) {
        // Fallback: DELETE each completed todo individually.
        await Promise.all(
          completed.map((t) =>
            api(`/api/todos/${t.id}`, { method: 'DELETE' })
          )
        );
      } else {
        const body = await res.json().catch(() => null);
        if (body && Array.isArray(body.todos)) {
          todos = body.todos;
        }
      }
      clearError();
    } catch (err) {
      todos = snapshot;
      showError(`Clear completed failed: ${err.message}`);
    }
    render();
  }

  // ------- Inline edit -------
  function beginEdit(id) {
    if (editingId === id) return;
    editingId = id;
    const li = listEl.querySelector(`li[data-id="${cssEscape(id)}"]`);
    if (!li) return;
    const titleSpan = li.querySelector('.title');
    const todo = todos.find((t) => t.id === id);
    if (!titleSpan || !todo) return;
    mountEditor(li, titleSpan, todo);
  }

  function mountEditor(li, titleSpan, todo) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'title-edit';
    input.value = todo.title;
    input.setAttribute('aria-label', 'Edit todo title');

    let resolved = false;
    const finish = (commit) => {
      if (resolved) return;
      resolved = true;
      editingId = null;
      const next = input.value;
      // Re-render to drop the editor and restore the row first…
      render();
      // …then perform the network call (which itself re-renders on rollback).
      if (commit) editTitle(todo.id, next);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finish(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
      e.stopPropagation();
    });
    input.addEventListener('blur', () => finish(true));

    titleSpan.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"');
  }

  // ------- Filter handling -------
  function setFilter(name) {
    if (filter === name) return;
    filter = name;
    saveFilter();
    render();
  }

  // ------- Search (debounced) -------
  let searchTimer = null;
  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const next = searchEl.value.trim().toLowerCase();
      if (next !== search) {
        search = next;
        render();
      }
    }, 150);
  }

  // ------- Keyboard nav -------
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function moveFocus(delta) {
    const vis = visibleTodos();
    if (vis.length === 0) return;
    let i = vis.findIndex((t) => t.id === focusedId);
    if (i === -1) i = 0;
    else i = Math.min(Math.max(i + delta, 0), vis.length - 1);
    setFocused(vis[i].id, true);
  }

  function focusedTodo() {
    return todos.find((t) => t.id === focusedId) || null;
  }

  function openCheatsheet() {
    cheatsheetEl.hidden = false;
    cheatsheetCloseEl.focus();
  }
  function closeCheatsheet() {
    if (cheatsheetEl.hidden) return;
    cheatsheetEl.hidden = true;
    helpBtnEl.focus();
  }

  document.addEventListener('keydown', (e) => {
    // Always-on: Esc closes cheat sheet (capture before other handling).
    if (e.key === 'Escape' && !cheatsheetEl.hidden) {
      e.preventDefault();
      closeCheatsheet();
      return;
    }

    // ? toggles the cheat sheet from anywhere except the inline edit input.
    if (e.key === '?') {
      // Don't hijack inside the inline edit input.
      if (e.target && e.target.classList && e.target.classList.contains('title-edit')) return;
      e.preventDefault();
      if (cheatsheetEl.hidden) openCheatsheet(); else closeCheatsheet();
      return;
    }

    // If user is typing somewhere, only Esc/Enter are special (handled per-input).
    if (isTypingTarget(e.target)) {
      // Allow Esc to blur the search/new-todo input.
      if (e.key === 'Escape') {
        if (e.target === searchEl || e.target === inputEl) {
          e.target.blur();
        }
      }
      return;
    }

    // Numeric filter quick-switch.
    if (e.key === '1') { e.preventDefault(); setFilter('all'); return; }
    if (e.key === '2') { e.preventDefault(); setFilter('active'); return; }
    if (e.key === '3') { e.preventDefault(); setFilter('completed'); return; }

    switch (e.key) {
      case 'n':
      case '/':
        e.preventDefault();
        inputEl.focus();
        inputEl.select();
        return;
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(1);
        return;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(-1);
        return;
      case 'x':
      case ' ': {
        const t = focusedTodo();
        if (!t) return;
        e.preventDefault();
        toggleOne(t.id, !t.completed);
        return;
      }
      case 'e':
      case 'Enter': {
        const t = focusedTodo();
        if (!t) return;
        e.preventDefault();
        beginEdit(t.id);
        return;
      }
      case 'd':
      case 'Backspace':
      case 'Delete': {
        const t = focusedTodo();
        if (!t) return;
        e.preventDefault();
        removeOne(t.id);
        return;
      }
    }
  });

  // ------- Wire up events -------
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = inputEl.value;
    if (!title.trim()) return;
    inputEl.value = '';
    addTodo(title);
  });

  searchEl.addEventListener('input', onSearchInput);

  toggleAllEl.addEventListener('change', () => {
    const visible = visibleTodos();
    if (visible.length === 0) return;
    const allDone = visible.every((t) => t.completed);
    // Match TodoMVC: if all complete -> mark all active, else mark all complete.
    toggleAllVisible(!allDone);
  });

  clearCompletedEl.addEventListener('click', () => {
    clearCompleted();
  });

  helpBtnEl.addEventListener('click', () => {
    if (cheatsheetEl.hidden) openCheatsheet(); else closeCheatsheet();
  });
  cheatsheetCloseEl.addEventListener('click', closeCheatsheet);
  cheatsheetEl.addEventListener('click', (e) => {
    if (e.target === cheatsheetEl) closeCheatsheet();
  });

  for (const tab of filterTabs) {
    tab.addEventListener('click', () => setFilter(tab.dataset.filter));
  }

  // ------- Boot -------
  (async function load() {
    try {
      const data = await api('/api/todos');
      todos = Array.isArray(data) ? data : [];
      clearError();
    } catch (err) {
      showError(`Failed to load todos: ${err.message}`);
    }
    render();
  })();
})();
