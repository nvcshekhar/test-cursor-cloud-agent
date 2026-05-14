/* Focus — minimal keyboard-driven todo app
   Talks to /api/todos. Stores filter in localStorage. */

(() => {
  'use strict';

  // ----- DOM -----
  const $ = (id) => document.getElementById(id);
  const listEl = $('todo-list');
  const formEl = $('new-todo-form');
  const inputEl = $('new-todo-input');
  const loadingEl = $('loading-state');
  const errorEl = $('error-state');
  const retryBtn = $('retry-button');
  const emptyEl = $('empty-state');
  const emptyMsg = $('empty-message');
  const listRegion = $('list-region');
  const filtersEl = $('filters');
  const filterTabs = Array.from(
    filtersEl.querySelectorAll('.filters__tab'),
  );
  const countEls = {
    all: filtersEl.querySelector('[data-count="all"]'),
    active: filtersEl.querySelector('[data-count="active"]'),
    completed: filtersEl.querySelector('[data-count="completed"]'),
  };
  const itemTemplate = $('todo-item-template');
  const toastEl = $('toast');
  const toastMsg = $('toast-message');
  const toastAction = $('toast-action');

  // ----- State -----
  const FILTER_KEY = 'focus.todos.filter';
  const FILTERS = ['all', 'active', 'completed'];
  const EMPTY_TEXT = {
    all: 'Your list is empty. Add something above to get started.',
    active: 'Nothing active — enjoy the silence.',
    completed: 'Nothing completed yet. Small steps.',
  };

  /** @type {{ id: string, title: string, completed: boolean }[]} */
  let todos = [];
  let filter = loadFilter();
  let focusedId = null;
  let editingId = null;
  let toastTimer = null;

  // ----- API -----
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

  // ----- Storage -----
  function loadFilter() {
    try {
      const v = localStorage.getItem(FILTER_KEY);
      return FILTERS.includes(v) ? v : 'all';
    } catch (_) {
      return 'all';
    }
  }

  function saveFilter(v) {
    try {
      localStorage.setItem(FILTER_KEY, v);
    } catch (_) {}
  }

  // ----- Derived -----
  function filterTodos(list, f) {
    if (f === 'active') return list.filter((t) => !t.completed);
    if (f === 'completed') return list.filter((t) => t.completed);
    return list.slice();
  }

  function counts(list) {
    let active = 0;
    let completed = 0;
    for (const t of list) {
      if (t.completed) completed++;
      else active++;
    }
    return { all: list.length, active, completed };
  }

  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/([^\w-])/g, '\\$1');
  }

  function visibleTodos() {
    return filterTodos(todos, filter);
  }

  // ----- Rendering -----
  function setLoading(loading) {
    listRegion.setAttribute('aria-busy', loading ? 'true' : 'false');
    loadingEl.hidden = !loading;
    if (loading) {
      errorEl.hidden = true;
      emptyEl.hidden = true;
      listEl.hidden = true;
    } else {
      listEl.hidden = false;
    }
  }

  function setError(message) {
    errorEl.hidden = false;
    listEl.hidden = true;
    emptyEl.hidden = true;
    loadingEl.hidden = true;
    const msgEl = errorEl.querySelector('.state__message');
    if (msgEl) msgEl.textContent = message || "Couldn't load todos.";
  }

  function updateFilterTabs() {
    const c = counts(todos);
    countEls.all.textContent = String(c.all);
    countEls.active.textContent = String(c.active);
    countEls.completed.textContent = String(c.completed);
    for (const tab of filterTabs) {
      const selected = tab.dataset.filter === filter;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    }
  }

  function buildItem(todo) {
    const node = itemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = todo.id;
    const check = node.querySelector('.todo__check');
    const titleEl = node.querySelector('.todo__title');
    const delBtn = node.querySelector('.todo__delete');

    check.setAttribute('aria-checked', todo.completed ? 'true' : 'false');
    check.setAttribute(
      'aria-label',
      todo.completed ? 'Mark as not completed' : 'Mark as completed',
    );
    titleEl.textContent = todo.title;
    titleEl.setAttribute('aria-label', `Edit: ${todo.title}`);

    // Selecting the row by clicking empty area
    node.addEventListener('mousedown', (e) => {
      if (e.target === delBtn || delBtn.contains(e.target)) return;
      if (e.target === check || check.contains(e.target)) return;
      if (e.target === titleEl) return;
      e.preventDefault();
      setFocused(todo.id, { focus: true });
    });

    check.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCompleted(todo.id);
    });

    titleEl.addEventListener('click', () => {
      setFocused(todo.id, { focus: false });
      startEdit(todo.id);
    });

    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteWithUndo(todo.id);
    });

    node.addEventListener('focus', () => {
      focusedId = todo.id;
      reflectFocused();
    });

    return node;
  }

  function render() {
    updateFilterTabs();

    const visible = filterTodos(todos, filter);

    const existing = new Map();
    for (const el of Array.from(listEl.children)) {
      existing.set(el.dataset.id, el);
    }

    const visibleIds = new Set(visible.map((t) => t.id));
    for (const [id, el] of existing) {
      if (!visibleIds.has(id)) el.remove();
    }

    let prev = null;
    for (const todo of visible) {
      let node = existing.get(todo.id);
      if (!node) {
        node = buildItem(todo);
      } else {
        const check = node.querySelector('.todo__check');
        const titleEl = node.querySelector('.todo__title');
        check.setAttribute(
          'aria-checked',
          todo.completed ? 'true' : 'false',
        );
        check.setAttribute(
          'aria-label',
          todo.completed ? 'Mark as not completed' : 'Mark as completed',
        );
        if (editingId !== todo.id) {
          if (titleEl.textContent !== todo.title) {
            titleEl.textContent = todo.title;
          }
          titleEl.setAttribute('aria-label', `Edit: ${todo.title}`);
        }
      }

      const expectedAfter = prev ? prev.nextSibling : listEl.firstChild;
      if (node !== expectedAfter) {
        listEl.insertBefore(node, expectedAfter);
      }
      prev = node;
    }

    if (visible.length === 0) {
      emptyMsg.textContent = EMPTY_TEXT[filter];
      emptyEl.hidden = false;
      listEl.hidden = true;
    } else {
      emptyEl.hidden = true;
      listEl.hidden = false;
    }

    if (focusedId && !visible.some((t) => t.id === focusedId)) {
      focusedId = visible[0]?.id ?? null;
    }
    reflectFocused();
  }

  // ----- Focus / selection management -----
  function reflectFocused() {
    for (const el of listEl.children) {
      const sel = el.dataset.id === focusedId;
      el.setAttribute('aria-selected', sel ? 'true' : 'false');
      el.tabIndex = sel ? 0 : -1;
    }
  }

  function setFocused(id, { focus } = { focus: false }) {
    focusedId = id || null;
    reflectFocused();
    if (focus && focusedId) {
      const el = listEl.querySelector(`[data-id="${cssEscape(focusedId)}"]`);
      if (el) el.focus();
    }
  }

  function focusByOffset(delta) {
    const vis = visibleTodos();
    if (vis.length === 0) return;
    const idx = vis.findIndex((t) => t.id === focusedId);
    let next;
    if (idx === -1) {
      next = delta > 0 ? 0 : vis.length - 1;
    } else {
      next = Math.min(vis.length - 1, Math.max(0, idx + delta));
    }
    setFocused(vis[next].id, { focus: true });
  }

  function focusFirstOrLast(end) {
    const vis = visibleTodos();
    if (vis.length === 0) return;
    setFocused(vis[end ? vis.length - 1 : 0].id, { focus: true });
  }

  // ----- Mutations -----
  async function addTodo(title) {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const created = await api('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title: trimmed }),
      });
      todos.push(created);
      render();
    } catch (err) {
      flashToast(`Couldn't add: ${err.message}`);
    }
  }

  async function toggleCompleted(id) {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    const next = !t.completed;
    t.completed = next;
    render();
    try {
      const updated = await api(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: next }),
      });
      Object.assign(t, updated);
      render();
    } catch (err) {
      t.completed = !next;
      render();
      flashToast(`Couldn't update: ${err.message}`);
    }
  }

  async function saveTitle(id, title) {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === t.title) {
      return;
    }
    const prev = t.title;
    t.title = trimmed;
    render();
    try {
      const updated = await api(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: trimmed }),
      });
      Object.assign(t, updated);
      render();
    } catch (err) {
      t.title = prev;
      render();
      flashToast(`Couldn't save title: ${err.message}`);
    }
  }

  /** Optimistic delete with an undo toast. Server delete only fires
   *  if the user does not undo before the toast disappears. */
  function deleteWithUndo(id) {
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const [removed] = todos.splice(idx, 1);

    const vis = visibleTodos();
    const nextFocus =
      vis[Math.min(idx, vis.length - 1)] || vis[idx - 1] || null;
    focusedId = nextFocus ? nextFocus.id : null;
    render();

    let undone = false;
    const commit = async () => {
      if (undone) return;
      try {
        await api(`/api/todos/${id}`, { method: 'DELETE' });
      } catch (err) {
        todos.splice(idx, 0, removed);
        render();
        flashToast(`Couldn't delete: ${err.message}`);
      }
    };

    showUndoToast(`Deleted "${truncate(removed.title, 40)}"`, () => {
      undone = true;
      todos.splice(idx, 0, removed);
      focusedId = removed.id;
      render();
      hideToast();
    });

    toastTimer = window.setTimeout(() => {
      hideToast();
      commit();
    }, 4500);
  }

  function truncate(s, n) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  // ----- Toast -----
  function showUndoToast(message, onUndo) {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toastMsg.textContent = message;
    toastAction.hidden = false;
    toastAction.onclick = (e) => {
      e.preventDefault();
      onUndo();
    };
    toastEl.hidden = false;
    void toastEl.offsetHeight;
    toastEl.dataset.visible = 'true';
  }

  function flashToast(message) {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toastMsg.textContent = message;
    toastAction.hidden = true;
    toastAction.onclick = null;
    toastEl.hidden = false;
    void toastEl.offsetHeight;
    toastEl.dataset.visible = 'true';
    toastTimer = window.setTimeout(hideToast, 3000);
  }

  function hideToast() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toastEl.dataset.visible = 'false';
    setTimeout(() => {
      if (toastEl.dataset.visible !== 'true') {
        toastEl.hidden = true;
      }
    }, 200);
  }

  // ----- Inline editing -----
  function startEdit(id) {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    const el = listEl.querySelector(`[data-id="${cssEscape(id)}"]`);
    if (!el) return;
    const titleEl = el.querySelector('.todo__title');

    editingId = id;
    titleEl.setAttribute('contenteditable', 'plaintext-only');
    if (titleEl.getAttribute('contenteditable') !== 'plaintext-only') {
      titleEl.setAttribute('contenteditable', 'true');
    }
    titleEl.spellcheck = true;
    titleEl.textContent = t.title;
    titleEl.focus();
    placeCaretAtEnd(titleEl);

    const finish = async (commit) => {
      if (editingId !== id) return;
      editingId = null;
      titleEl.removeAttribute('contenteditable');
      titleEl.removeEventListener('keydown', onKey);
      titleEl.removeEventListener('blur', onBlur);
      if (commit) {
        const text = titleEl.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
          await saveTitle(id, text);
        } else {
          titleEl.textContent = t.title;
        }
      } else {
        titleEl.textContent = t.title;
      }
      const row = listEl.querySelector(`[data-id="${cssEscape(id)}"]`);
      if (row) setFocused(id, { focus: true });
    };

    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finish(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    };
    const onBlur = () => {
      finish(true);
    };
    titleEl.addEventListener('keydown', onKey);
    titleEl.addEventListener('blur', onBlur);
  }

  function placeCaretAtEnd(el) {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ----- Load / retry -----
  async function load() {
    setLoading(true);
    try {
      todos = await api('/api/todos');
      if (!Array.isArray(todos)) todos = [];
      setLoading(false);
      render();
    } catch (err) {
      setLoading(false);
      setError(`Couldn't load todos: ${err.message}`);
    }
  }

  // ----- Events -----
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = inputEl.value;
    if (!title.trim()) return;
    inputEl.value = '';
    await addTodo(title);
  });

  retryBtn.addEventListener('click', () => {
    errorEl.hidden = true;
    load();
  });

  filtersEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.filters__tab');
    if (!tab) return;
    const next = tab.dataset.filter;
    if (!FILTERS.includes(next)) return;
    filter = next;
    saveFilter(filter);
    render();
  });

  filtersEl.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const idx = FILTERS.indexOf(filter);
    let next = idx;
    if (e.key === 'ArrowLeft') next = (idx - 1 + FILTERS.length) % FILTERS.length;
    if (e.key === 'ArrowRight') next = (idx + 1) % FILTERS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = FILTERS.length - 1;
    filter = FILTERS[next];
    saveFilter(filter);
    render();
    filterTabs[next].focus();
    e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const inField =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);

    if (e.key === '/' && !inField && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      inputEl.focus();
      inputEl.select();
      return;
    }

    if (e.key === 'Escape' && target === inputEl) {
      inputEl.blur();
      return;
    }

    const row = target && target.closest && target.closest('.todo');
    if (row && !target.isContentEditable && target.tagName !== 'INPUT') {
      const id = row.dataset.id;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusByOffset(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusByOffset(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusFirstOrLast(false);
      } else if (e.key === 'End') {
        e.preventDefault();
        focusFirstOrLast(true);
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleCompleted(id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        startEdit(id);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteWithUndo(id);
      }
      return;
    }

    if (!inField && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      const vis = visibleTodos();
      if (vis.length > 0) {
        e.preventDefault();
        setFocused(
          focusedId ?? (e.key === 'ArrowDown' ? vis[0].id : vis[vis.length - 1].id),
          { focus: true },
        );
      }
    }
  });

  // Boot
  load();
})();
