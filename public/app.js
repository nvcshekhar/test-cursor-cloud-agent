(() => {
  'use strict';

  const listEl = document.getElementById('todo-list');
  const emptyEl = document.getElementById('empty-state');
  const formEl = document.getElementById('new-todo-form');
  const inputEl = document.getElementById('new-todo-input');
  const errorEl = document.getElementById('error-banner');
  const celebrationEl = document.getElementById('celebration');
  const confettiCanvas = document.getElementById('confetti');

  const ORDER_KEY = 'playful-todo-order-v1';
  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Local state: cached todos so we can reorder and animate optimistically. */
  let todos = [];
  let lastAllDone = false;

  // ---------- Order persistence (localStorage) ----------

  function loadOrder() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  function saveOrder(ids) {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
    } catch {
      // ignore quota / private-mode errors
    }
  }

  /** Reorder a list of todos by saved order; unknown ids go at the end in original order. */
  function applySavedOrder(items) {
    const savedOrder = loadOrder();
    if (savedOrder.length === 0) return items.slice();
    const byId = new Map(items.map((t) => [t.id, t]));
    const result = [];
    for (const id of savedOrder) {
      if (byId.has(id)) {
        result.push(byId.get(id));
        byId.delete(id);
      }
    }
    for (const t of items) {
      if (byId.has(t.id)) result.push(t);
    }
    return result;
  }

  // ---------- API ----------

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

  // ---------- Error banner ----------

  let errorTimer = null;
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      errorEl.hidden = true;
    }, 4500);
  }

  function clearError() {
    if (errorTimer) clearTimeout(errorTimer);
    errorEl.hidden = true;
  }

  // ---------- Rendering ----------

  function renderTodo(todo, opts = {}) {
    const li = document.createElement('li');
    li.className = 'todo' + (todo.completed ? ' is-completed' : '');
    li.dataset.id = todo.id;
    li.setAttribute('role', 'listitem');
    li.draggable = true;

    if (opts.entering && !reduceMotion) {
      li.classList.add('is-entering');
      li.addEventListener(
        'animationend',
        () => li.classList.remove('is-entering'),
        { once: true }
      );
    }

    // Drag handle
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'todo__handle';
    handle.setAttribute('aria-label', 'Drag to reorder');
    handle.title = 'Drag to reorder';
    handle.textContent = '⋮⋮';
    handle.tabIndex = -1;

    // Custom round checkbox
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'todo__check';
    checkBtn.setAttribute('role', 'checkbox');
    checkBtn.setAttribute('aria-checked', String(todo.completed));
    checkBtn.setAttribute(
      'aria-label',
      todo.completed ? 'Mark as not done' : 'Mark as done'
    );
    checkBtn.innerHTML =
      '<svg viewBox="0 0 18 18" aria-hidden="true">' +
      '<path class="todo__check-path" d="M3 9.5 L7.5 14 L15 5" />' +
      '</svg>';
    checkBtn.addEventListener('click', () => toggle(todo));

    // Title
    const title = document.createElement('span');
    title.className = 'todo__title';
    title.textContent = todo.title;

    // Reorder buttons (a11y fallback for drag)
    const reorder = document.createElement('span');
    reorder.className = 'todo__reorder';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'todo__reorder-btn';
    upBtn.textContent = '▲';
    upBtn.setAttribute('aria-label', 'Move up');
    upBtn.title = 'Move up';
    upBtn.addEventListener('click', () => moveTodo(todo.id, -1));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'todo__reorder-btn';
    downBtn.textContent = '▼';
    downBtn.setAttribute('aria-label', 'Move down');
    downBtn.title = 'Move down';
    downBtn.addEventListener('click', () => moveTodo(todo.id, 1));

    reorder.append(upBtn, downBtn);

    // Delete
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'todo__delete';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Delete todo');
    del.title = 'Delete';
    del.addEventListener('click', () => remove(todo));

    li.append(handle, checkBtn, title, reorder, del);

    attachDnD(li);

    return li;
  }

  function render() {
    listEl.innerHTML = '';
    if (todos.length === 0) {
      emptyEl.hidden = false;
    } else {
      emptyEl.hidden = true;
      for (const t of todos) listEl.appendChild(renderTodo(t));
      updateReorderButtonStates();
    }
    updateCelebration();
  }

  function updateReorderButtonStates() {
    const rows = listEl.querySelectorAll('.todo');
    rows.forEach((row, i) => {
      const upBtn = row.querySelector('.todo__reorder-btn:nth-child(1)');
      const downBtn = row.querySelector('.todo__reorder-btn:nth-child(2)');
      if (upBtn) upBtn.disabled = i === 0;
      if (downBtn) downBtn.disabled = i === rows.length - 1;
    });
  }

  // ---------- Celebration ----------

  function updateCelebration() {
    const allDone = todos.length > 0 && todos.every((t) => t.completed);
    if (allDone && !lastAllDone) {
      celebrationEl.hidden = false;
      // Reset animation by forcing reflow
      celebrationEl.style.animation = 'none';
      // eslint-disable-next-line no-unused-expressions
      celebrationEl.offsetHeight;
      celebrationEl.style.animation = '';
      if (!reduceMotion) burstConfetti();
    } else if (!allDone) {
      celebrationEl.hidden = true;
    }
    lastAllDone = allDone;
  }

  // ---------- Confetti (inline canvas, no deps) ----------

  function burstConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = (confettiCanvas.width = window.innerWidth * dpr);
    const h = (confettiCanvas.height = window.innerHeight * dpr);
    confettiCanvas.style.width = window.innerWidth + 'px';
    confettiCanvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);

    const colors = ['#ff6b6b', '#ffce5c', '#7c5cff', '#34c79a', '#ff8fab', '#5cd1ff'];
    const particles = [];
    const count = 110;
    // Origin near top of the celebration card
    const rect = celebrationEl.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + 12;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * (i / count)) - Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      const speed = 6 + Math.random() * 6;
      particles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        size: 5 + Math.random() * 6,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        life: 0,
      });
    }

    const maxLife = 110;
    let raf = 0;

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = 0;
      for (const p of particles) {
        if (p.life > maxLife) continue;
        alive++;
        p.vy += 0.22; // gravity
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        cancelAnimationFrame(raf);
      }
    }
    raf = requestAnimationFrame(tick);
  }

  // ---------- Mutations ----------

  async function load() {
    try {
      const fetched = await api('/api/todos');
      todos = applySavedOrder(fetched);
      saveOrder(todos.map((t) => t.id));
      render();
      clearError();
    } catch (err) {
      console.error(err);
      showError('Could not load your todos. Try refreshing in a moment.');
    }
  }

  async function add(title) {
    try {
      const created = await api('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      todos.push(created);
      saveOrder(todos.map((t) => t.id));
      // Insert with entering animation
      emptyEl.hidden = true;
      const li = renderTodo(created, { entering: true });
      listEl.appendChild(li);
      updateReorderButtonStates();
      updateCelebration();
      clearError();
    } catch (err) {
      console.error(err);
      showError(err.message || 'Could not add that todo.');
    }
  }

  async function toggle(todo) {
    const idx = todos.findIndex((t) => t.id === todo.id);
    if (idx === -1) return;
    const previous = todos[idx].completed;
    const next = !previous;
    // Optimistic: update local + DOM right away for instant animation
    todos[idx] = { ...todos[idx], completed: next };
    const li = listEl.querySelector(`li[data-id="${CSS.escape(todo.id)}"]`);
    if (li) {
      li.classList.toggle('is-completed', next);
      const checkBtn = li.querySelector('.todo__check');
      if (checkBtn) {
        checkBtn.setAttribute('aria-checked', String(next));
        checkBtn.setAttribute(
          'aria-label',
          next ? 'Mark as not done' : 'Mark as done'
        );
      }
    }
    updateCelebration();
    try {
      const updated = await api(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: next }),
      });
      todos[idx] = applyOrderUpdate(todos[idx], updated);
      clearError();
    } catch (err) {
      console.error(err);
      // Roll back
      todos[idx] = { ...todos[idx], completed: previous };
      if (li) {
        li.classList.toggle('is-completed', previous);
        const checkBtn = li.querySelector('.todo__check');
        if (checkBtn) checkBtn.setAttribute('aria-checked', String(previous));
      }
      updateCelebration();
      showError(err.message || 'Could not update that todo.');
    }
  }

  function applyOrderUpdate(localTodo, serverTodo) {
    return { ...localTodo, ...serverTodo };
  }

  async function remove(todo) {
    const li = listEl.querySelector(`li[data-id="${CSS.escape(todo.id)}"]`);
    const proceed = () => {
      todos = todos.filter((t) => t.id !== todo.id);
      saveOrder(todos.map((t) => t.id));
      if (li && li.parentNode) li.parentNode.removeChild(li);
      if (todos.length === 0) {
        emptyEl.hidden = false;
      } else {
        updateReorderButtonStates();
      }
      updateCelebration();
    };

    // Animate out first (unless reduced motion)
    if (li && !reduceMotion) {
      li.classList.add('is-leaving');
    }

    try {
      await api(`/api/todos/${todo.id}`, { method: 'DELETE' });
      if (li && !reduceMotion) {
        li.addEventListener('animationend', proceed, { once: true });
        // Safety: if animation never fires (rare), still complete
        setTimeout(() => {
          if (li.parentNode) proceed();
        }, 280);
      } else {
        proceed();
      }
      clearError();
    } catch (err) {
      console.error(err);
      if (li) li.classList.remove('is-leaving');
      showError(err.message || 'Could not delete that todo.');
    }
  }

  // ---------- Reorder helpers ----------

  function moveTodo(id, delta) {
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= todos.length) return;
    const [item] = todos.splice(idx, 1);
    todos.splice(newIdx, 0, item);
    saveOrder(todos.map((t) => t.id));
    // Reorder DOM without rebuilding to keep animations smooth
    const rows = Array.from(listEl.querySelectorAll('.todo'));
    const moving = rows[idx];
    if (!moving) {
      render();
      return;
    }
    if (delta < 0) {
      const ref = rows[newIdx];
      listEl.insertBefore(moving, ref);
    } else {
      const ref = rows[newIdx];
      if (ref.nextSibling) {
        listEl.insertBefore(moving, ref.nextSibling);
      } else {
        listEl.appendChild(moving);
      }
    }
    updateReorderButtonStates();
    // Focus the appropriate button on the moved row
    const targetBtn = moving.querySelector(
      delta < 0 ? '.todo__reorder-btn:nth-child(1)' : '.todo__reorder-btn:nth-child(2)'
    );
    if (targetBtn && !targetBtn.disabled) targetBtn.focus();
    else {
      const fallback = moving.querySelector('.todo__reorder-btn:not([disabled])');
      if (fallback) fallback.focus();
    }
  }

  // ---------- Drag and drop ----------

  let dragId = null;

  function attachDnD(li) {
    li.addEventListener('dragstart', (e) => {
      dragId = li.dataset.id;
      li.classList.add('is-dragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragId);
      } catch {
        // ignore
      }
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('is-dragging');
      dragId = null;
      listEl
        .querySelectorAll('.is-drop-target')
        .forEach((el) => el.classList.remove('is-drop-target'));
      // Persist the new order from the DOM
      const newOrder = Array.from(listEl.querySelectorAll('.todo')).map(
        (n) => n.dataset.id
      );
      const byId = new Map(todos.map((t) => [t.id, t]));
      todos = newOrder.map((id) => byId.get(id)).filter(Boolean);
      saveOrder(newOrder);
      updateReorderButtonStates();
    });
    li.addEventListener('dragover', (e) => {
      if (!dragId || dragId === li.dataset.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = li.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      const moving = listEl.querySelector(`li[data-id="${CSS.escape(dragId)}"]`);
      if (!moving || moving === li) return;
      if (before) {
        if (moving.nextSibling !== li) listEl.insertBefore(moving, li);
      } else {
        if (li.nextSibling !== moving)
          listEl.insertBefore(moving, li.nextSibling);
      }
      listEl
        .querySelectorAll('.is-drop-target')
        .forEach((el) => el.classList.remove('is-drop-target'));
      li.classList.add('is-drop-target');
    });
    li.addEventListener('dragleave', () => {
      li.classList.remove('is-drop-target');
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('is-drop-target');
    });
  }

  // ---------- Event wiring ----------

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = inputEl.value.trim();
    if (!title) return;
    inputEl.value = '';
    inputEl.focus();
    await add(title);
  });

  // Initial load
  load();
})();
