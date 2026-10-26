(() => {
  'use strict';

  const STORAGE_KEY = 'portfolio_builder_state_v1';
  const THEME_KEY = 'portfolio_builder_theme_v1';

  function svgToDataUri(svgString) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString.trim());
  }

  const DEFAULT_AVATAR = svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <defs>
        <linearGradient id="avatarBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="50%" stop-color="#8b5cf6"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="120" fill="url(#avatarBg)"/>
      <circle cx="120" cy="92" r="42" fill="#ffffff" fill-opacity="0.92"/>
      <path d="M48 208c10-42 42-64 72-64s62 22 72 64" fill="#ffffff" fill-opacity="0.92"/>
    </svg>
  `);

  const SAMPLE_PHOTOS = [
    {
      id: 'photo-1',
      caption: 'Design Systems & Component Architecture',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#1e293b"/>
            </linearGradient>
            <linearGradient id="accent1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38bdf8"/>
              <stop offset="100%" stop-color="#818cf8"/>
            </linearGradient>
          </defs>
          <rect width="800" height="520" fill="url(#g1)"/>
          <rect x="60" y="60" width="260" height="180" rx="16" fill="#334155" opacity="0.7"/>
          <rect x="84" y="88" width="140" height="20" rx="6" fill="url(#accent1)"/>
          <rect x="84" y="124" width="200" height="12" rx="4" fill="#94a3b8" opacity="0.6"/>
          <rect x="84" y="148" width="170" height="12" rx="4" fill="#94a3b8" opacity="0.4"/>
          <rect x="84" y="184" width="90" height="32" rx="8" fill="#38bdf8"/>
          <rect x="350" y="60" width="390" height="400" rx="20" fill="#1e293b" stroke="#475569" stroke-width="2"/>
          <circle cx="386" cy="96" r="8" fill="#f43f5e"/>
          <circle cx="412" cy="96" r="8" fill="#f59e0b"/>
          <circle cx="438" cy="96" r="8" fill="#10b981"/>
          <rect x="380" y="132" width="330" height="140" rx="12" fill="url(#accent1)" opacity="0.2"/>
          <rect x="380" y="294" width="156" height="130" rx="12" fill="#334155" opacity="0.6"/>
          <rect x="554" y="294" width="156" height="130" rx="12" fill="#334155" opacity="0.6"/>
          <rect x="60" y="270" width="260" height="190" rx="16" fill="#334155" opacity="0.5"/>
          <circle cx="130" cy="365" r="44" fill="none" stroke="#818cf8" stroke-width="12" stroke-dasharray="210 80"/>
          <rect x="196" y="338" width="96" height="14" rx="4" fill="#e2e8f0"/>
          <rect x="196" y="366" width="72" height="12" rx="4" fill="#94a3b8"/>
        </svg>
      `)
    },
    {
      id: 'photo-2',
      caption: 'Real-Time Analytics & Observability Dashboard',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
          <defs>
            <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#111827"/>
              <stop offset="100%" stop-color="#1f2937"/>
            </linearGradient>
            <linearGradient id="wave" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <rect width="800" height="520" fill="url(#g2)"/>
          <g stroke="#374151" stroke-width="1">
            <line x1="70" y1="100" x2="730" y2="100"/>
            <line x1="70" y1="190" x2="730" y2="190"/>
            <line x1="70" y1="280" x2="730" y2="280"/>
            <line x1="70" y1="370" x2="730" y2="370"/>
            <line x1="70" y1="440" x2="730" y2="440"/>
          </g>
          <path d="M70 380 Q 180 290, 270 320 T 460 200 T 620 230 T 730 130 L 730 440 L 70 440 Z" fill="url(#wave)"/>
          <path d="M70 380 Q 180 290, 270 320 T 460 200 T 620 230 T 730 130" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>
          <path d="M70 410 Q 190 360, 310 370 T 520 290 T 730 240" fill="none" stroke="#6366f1" stroke-width="4" stroke-dasharray="8 8" stroke-linecap="round"/>
          <circle cx="270" cy="320" r="7" fill="#10b981"/>
          <circle cx="460" cy="200" r="7" fill="#10b981"/>
          <circle cx="620" cy="230" r="7" fill="#10b981"/>
          <circle cx="730" cy="130" r="8" fill="#34d399"/>
        </svg>
      `)
    },
    {
      id: 'photo-3',
      caption: 'Creative Coding & Generative Geometry',
      url: svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
          <defs>
            <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#311042"/>
              <stop offset="50%" stop-color="#1e1b4b"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <linearGradient id="orb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f472b6"/>
              <stop offset="50%" stop-color="#a855f7"/>
              <stop offset="100%" stop-color="#38bdf8"/>
            </linearGradient>
          </defs>
          <rect width="800" height="520" fill="url(#g3)"/>
          <circle cx="400" cy="260" r="165" fill="url(#orb)" opacity="0.85"/>
          <circle cx="480" cy="210" r="110" fill="#f59e0b" opacity="0.35"/>
          <circle cx="310" cy="300" r="120" fill="#06b6d4" opacity="0.35"/>
          <polygon points="400,95 555,365 245,365" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3"/>
          <circle cx="400" cy="260" r="210" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="6 10"/>
        </svg>
      `)
    }
  ];

  const DEFAULT_STATE = {
    intro: {
      name: 'Alex Rivera',
      tagline: 'Full-Stack Product Engineer & Creative Technologist',
      bio: 'I design and build resilient web applications, developer tools, and tactile digital experiences. Passionate about clean architecture, accessible interfaces, and bridging design systems with production engineering.',
      avatar: DEFAULT_AVATAR
    },
    photos: SAMPLE_PHOTOS,
    links: [
      {
        id: 'link-1',
        title: 'GitHub Profile',
        url: 'https://github.com/alexrivera-dev',
        category: 'Social'
      },
      {
        id: 'link-2',
        title: 'Nebula UI — Zero-Dependency Design System',
        url: 'https://nebula-ui.example.com',
        category: 'Project'
      },
      {
        id: 'link-3',
        title: 'Building Local-First Web Apps at Scale',
        url: 'https://blog.example.com/local-first-architecture',
        category: 'Article'
      },
      {
        id: 'link-4',
        title: 'Get in Touch (Email)',
        url: 'mailto:alex.rivera@example.com',
        category: 'Contact'
      }
    ]
  };

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneDefaultState();
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return cloneDefaultState();
      }
      return {
        intro: {
          name:
            parsed.intro && typeof parsed.intro.name === 'string'
              ? parsed.intro.name
              : DEFAULT_STATE.intro.name,
          tagline:
            parsed.intro && typeof parsed.intro.tagline === 'string'
              ? parsed.intro.tagline
              : DEFAULT_STATE.intro.tagline,
          bio:
            parsed.intro && typeof parsed.intro.bio === 'string'
              ? parsed.intro.bio
              : DEFAULT_STATE.intro.bio,
          avatar:
            parsed.intro && typeof parsed.intro.avatar === 'string' && parsed.intro.avatar.trim()
              ? parsed.intro.avatar
              : DEFAULT_STATE.intro.avatar
        },
        photos: Array.isArray(parsed.photos)
          ? parsed.photos.filter(
              (p) => p && typeof p.id === 'string' && typeof p.url === 'string'
            )
          : cloneDefaultState().photos,
        links: Array.isArray(parsed.links)
          ? parsed.links.filter(
              (l) => l && typeof l.id === 'string' && typeof l.title === 'string' && typeof l.url === 'string'
            )
          : cloneDefaultState().links
      };
    } catch (err) {
      console.warn('Failed to load portfolio state from localStorage:', err);
      return cloneDefaultState();
    }
  }

  function saveState(currentState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (err) {
      console.warn('Failed to save portfolio state to localStorage:', err);
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  function normalizeUrl(rawUrl) {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('#')
    ) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  let state = loadState();
  let pendingAvatarDataUrl = '';
  let pendingPhotoDataUrl = '';

  function renderIntro() {
    const { name, tagline, bio, avatar } = state.intro;

    const displayName = document.getElementById('display-name');
    const displayTagline = document.getElementById('display-tagline');
    const displayBio = document.getElementById('display-bio');
    const displayAvatar = document.getElementById('display-avatar');

    if (displayName) displayName.textContent = name || 'Untitled Portfolio';
    if (displayTagline) displayTagline.textContent = tagline || '';
    if (displayBio) displayBio.textContent = bio || '';
    if (displayAvatar) {
      displayAvatar.src = avatar || DEFAULT_AVATAR;
      displayAvatar.alt = `${name || 'Profile'} avatar`;
    }
  }

  function syncIntroFormInputs() {
    const { name, tagline, bio, avatar } = state.intro;
    const inputName = document.getElementById('input-name');
    const inputTagline = document.getElementById('input-tagline');
    const inputBio = document.getElementById('input-bio');
    const inputAvatar = document.getElementById('input-avatar');

    if (inputName && document.activeElement !== inputName) {
      inputName.value = name || '';
    }
    if (inputTagline && document.activeElement !== inputTagline) {
      inputTagline.value = tagline || '';
    }
    if (inputBio && document.activeElement !== inputBio) {
      inputBio.value = bio || '';
    }
    if (inputAvatar && document.activeElement !== inputAvatar) {
      inputAvatar.value = avatar && !avatar.startsWith('data:') ? avatar : '';
    }
  }

  function renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    galleryGrid.innerHTML = '';

    if (!state.photos.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No pictures in your gallery yet. Use the editor to add one!';
      galleryGrid.appendChild(empty);
      return;
    }

    state.photos.forEach((photo) => {
      const card = document.createElement('article');
      card.className = 'gallery-card';
      card.dataset.photoId = photo.id;

      const mediaButton = document.createElement('button');
      mediaButton.type = 'button';
      mediaButton.className = 'gallery-card-trigger';
      mediaButton.setAttribute('aria-label', `View ${photo.caption || 'gallery image'} in lightbox`);

      const img = document.createElement('img');
      img.className = 'gallery-card-img';
      img.src = photo.url;
      img.alt = photo.caption || 'Portfolio gallery image';
      img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox(photo));

      mediaButton.appendChild(img);
      mediaButton.addEventListener('click', (e) => {
        if (e.target === img) return;
        openLightbox(photo);
      });

      const footer = document.createElement('div');
      footer.className = 'gallery-card-footer';

      const captionEl = document.createElement('p');
      captionEl.className = 'gallery-card-caption';
      captionEl.textContent = photo.caption || 'Untitled snapshot';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'gallery-card-remove btn-remove';
      removeBtn.setAttribute('data-remove-photo', photo.id);
      removeBtn.setAttribute('aria-label', `Remove ${photo.caption || 'photo'}`);
      removeBtn.textContent = 'Remove';

      footer.appendChild(captionEl);
      footer.appendChild(removeBtn);

      card.appendChild(mediaButton);
      card.appendChild(footer);
      galleryGrid.appendChild(card);
    });
  }

  function renderLinks() {
    const linksList = document.getElementById('links-list');
    if (!linksList) return;

    linksList.innerHTML = '';

    if (!state.links.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No links added yet. Add your social profiles, projects, or articles!';
      linksList.appendChild(empty);
      return;
    }

    state.links.forEach((link) => {
      const card = document.createElement('article');
      card.className = 'link-card';
      card.dataset.linkId = link.id;
      if (link.category) {
        card.dataset.category = link.category;
      }

      const mainLink = document.createElement('a');
      mainLink.className = 'link-card-anchor';
      mainLink.href = normalizeUrl(link.url);
      if (!mainLink.href.startsWith('mailto:') && !mainLink.href.startsWith('tel:')) {
        mainLink.target = '_blank';
        mainLink.rel = 'noopener noreferrer';
      }

      const header = document.createElement('div');
      header.className = 'link-card-header';

      const badge = document.createElement('span');
      badge.className = `link-badge badge-${String(link.category || 'Social').toLowerCase()}`;
      badge.textContent = link.category || 'Social';

      const titleEl = document.createElement('h3');
      titleEl.className = 'link-card-title';
      titleEl.textContent = link.title;

      const urlEl = document.createElement('span');
      urlEl.className = 'link-card-url';
      urlEl.textContent = link.url;

      header.appendChild(badge);
      header.appendChild(titleEl);
      mainLink.appendChild(header);
      mainLink.appendChild(urlEl);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'link-card-remove btn-remove';
      removeBtn.setAttribute('data-remove-link', link.id);
      removeBtn.setAttribute('aria-label', `Remove link ${link.title}`);
      removeBtn.textContent = 'Remove';

      card.appendChild(mainLink);
      card.appendChild(removeBtn);
      linksList.appendChild(card);
    });
  }

  function renderAll({ syncInputs = true } = {}) {
    renderIntro();
    if (syncInputs) {
      syncIntroFormInputs();
    }
    renderGallery();
    renderLinks();
  }

  function openLightbox(photo) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    if (!modal || !img) return;

    img.src = photo.url;
    img.alt = photo.caption || 'Enlarged gallery photo';
    if (caption) {
      caption.textContent = photo.caption || '';
    }

    modal.hidden = false;
    modal.classList.add('is-open', 'active', 'open');
    modal.setAttribute('aria-hidden', 'false');
    if (typeof modal.showModal === 'function' && modal.tagName === 'DIALOG' && !modal.open) {
      try {
        modal.showModal();
      } catch (_) {
        modal.setAttribute('open', '');
      }
    }
  }

  function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    if (!modal) return;

    modal.hidden = true;
    modal.classList.remove('is-open', 'active', 'open');
    modal.setAttribute('aria-hidden', 'true');
    if (typeof modal.close === 'function' && modal.tagName === 'DIALOG' && modal.open) {
      try {
        modal.close();
      } catch (_) {
        modal.removeAttribute('open');
      }
    }
    if (img) {
      img.src = '';
    }
  }

  function applyTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(normalized === 'dark'));
      themeToggle.dataset.currentTheme = normalized;
    }
    try {
      localStorage.setItem(THEME_KEY, normalized);
    } catch (_) {
      // Ignore storage errors in restricted environments
    }
  }

  function initTheme() {
    let initial = document.documentElement.getAttribute('data-theme');
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        initial = saved;
      }
    } catch (_) {
      // Ignore storage access errors
    }
    if (initial !== 'dark' && initial !== 'light') {
      const prefersDark =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      initial = prefersDark ? 'dark' : 'light';
    }
    applyTheme(initial);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function toggleEditorPanel() {
    const panel = document.getElementById('editor-panel');
    const toggleBtn = document.getElementById('edit-toggle');
    if (!panel) return;

    const currentlyHidden =
      panel.hidden ||
      panel.classList.contains('is-hidden') ||
      panel.classList.contains('collapsed') ||
      panel.getAttribute('aria-hidden') === 'true';

    const nextVisible = currentlyHidden;

    panel.hidden = !nextVisible;
    panel.classList.toggle('is-open', nextVisible);
    panel.classList.toggle('open', nextVisible);
    panel.classList.toggle('active', nextVisible);
    panel.classList.toggle('is-hidden', !nextVisible);
    panel.classList.toggle('collapsed', !nextVisible);
    panel.setAttribute('aria-hidden', String(!nextVisible));
    document.body.classList.toggle('editor-open', nextVisible);

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(nextVisible));
    }
  }

  function resetPortfolio() {
    state = cloneDefaultState();
    pendingAvatarDataUrl = '';
    pendingPhotoDataUrl = '';
    saveState(state);

    const avatarFile = document.getElementById('input-avatar-file');
    const photoForm = document.getElementById('photo-form');
    const linkForm = document.getElementById('link-form');
    if (avatarFile) avatarFile.value = '';
    if (photoForm && typeof photoForm.reset === 'function') photoForm.reset();
    if (linkForm && typeof linkForm.reset === 'function') linkForm.reset();

    renderAll({ syncInputs: true });
  }

  function bindIntroEvents() {
    const introForm = document.getElementById('intro-form');
    const inputName = document.getElementById('input-name');
    const inputTagline = document.getElementById('input-tagline');
    const inputBio = document.getElementById('input-bio');
    const inputAvatar = document.getElementById('input-avatar');
    const inputAvatarFile = document.getElementById('input-avatar-file');

    const updateIntroFromFields = () => {
      if (inputName) state.intro.name = inputName.value.trim() || DEFAULT_STATE.intro.name;
      if (inputTagline) state.intro.tagline = inputTagline.value.trim();
      if (inputBio) state.intro.bio = inputBio.value.trim();
      if (pendingAvatarDataUrl) {
        state.intro.avatar = pendingAvatarDataUrl;
      } else if (inputAvatar && inputAvatar.value.trim()) {
        state.intro.avatar = normalizeUrl(inputAvatar.value.trim());
      }
      saveState(state);
      renderIntro();
    };

    [inputName, inputTagline, inputBio].forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        if (inputName) state.intro.name = inputName.value;
        if (inputTagline) state.intro.tagline = inputTagline.value;
        if (inputBio) state.intro.bio = inputBio.value;
        saveState(state);
        renderIntro();
      });
    });

    if (inputAvatar) {
      inputAvatar.addEventListener('input', () => {
        const val = inputAvatar.value.trim();
        if (val) {
          pendingAvatarDataUrl = '';
          state.intro.avatar = normalizeUrl(val);
          saveState(state);
          renderIntro();
        }
      });
    }

    if (inputAvatarFile) {
      inputAvatarFile.addEventListener('change', async () => {
        const file = inputAvatarFile.files && inputAvatarFile.files[0];
        if (!file) return;
        try {
          const dataUrl = await readFileAsDataURL(file);
          if (dataUrl) {
            pendingAvatarDataUrl = dataUrl;
            state.intro.avatar = dataUrl;
            if (inputAvatar) inputAvatar.value = '';
            saveState(state);
            renderIntro();
          }
        } catch (err) {
          console.error('Error reading avatar file:', err);
        }
      });
    }

    if (introForm) {
      introForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateIntroFromFields();
      });
    }
  }

  function bindPhotoEvents() {
    const photoForm = document.getElementById('photo-form');
    const inputPhotoUrl = document.getElementById('input-photo-url');
    const inputPhotoFile = document.getElementById('input-photo-file');
    const inputPhotoCaption = document.getElementById('input-photo-caption');
    const galleryGrid = document.getElementById('gallery-grid');

    if (inputPhotoFile) {
      inputPhotoFile.addEventListener('change', async () => {
        const file = inputPhotoFile.files && inputPhotoFile.files[0];
        if (!file) {
          pendingPhotoDataUrl = '';
          return;
        }
        try {
          pendingPhotoDataUrl = await readFileAsDataURL(file);
        } catch (err) {
          console.error('Error reading gallery photo file:', err);
          pendingPhotoDataUrl = '';
        }
      });
    }

    if (photoForm) {
      photoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let finalUrl = pendingPhotoDataUrl;
        const file = inputPhotoFile && inputPhotoFile.files && inputPhotoFile.files[0];
        if (!finalUrl && file) {
          try {
            finalUrl = await readFileAsDataURL(file);
          } catch (err) {
            console.error('Error reading gallery photo file on submit:', err);
          }
        }

        if (!finalUrl && inputPhotoUrl && inputPhotoUrl.value.trim()) {
          finalUrl = normalizeUrl(inputPhotoUrl.value.trim());
        }

        if (!finalUrl) return;

        const caption =
          (inputPhotoCaption && inputPhotoCaption.value.trim()) ||
          (file && file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Portfolio Snapshot');

        const newPhoto = {
          id: generateId('photo'),
          url: finalUrl,
          caption
        };

        state.photos.unshift(newPhoto);
        saveState(state);
        renderGallery();

        pendingPhotoDataUrl = '';
        if (typeof photoForm.reset === 'function') {
          photoForm.reset();
        } else {
          if (inputPhotoUrl) inputPhotoUrl.value = '';
          if (inputPhotoFile) inputPhotoFile.value = '';
          if (inputPhotoCaption) inputPhotoCaption.value = '';
        }
      });
    }

    if (galleryGrid) {
      galleryGrid.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-photo]');
        if (removeBtn) {
          e.stopPropagation();
          const idToRemove = removeBtn.getAttribute('data-remove-photo');
          if (!idToRemove) return;
          state.photos = state.photos.filter((p) => p.id !== idToRemove);
          saveState(state);
          renderGallery();
          return;
        }

        const card = e.target.closest('.gallery-card');
        if (card && !e.target.closest('button[data-remove-photo]')) {
          const photoId = card.dataset.photoId;
          const photo = state.photos.find((p) => p.id === photoId);
          if (photo) {
            openLightbox(photo);
          }
        }
      });
    }
  }

  function bindLinkEvents() {
    const linkForm = document.getElementById('link-form');
    const inputTitle = document.getElementById('input-link-title');
    const inputUrl = document.getElementById('input-link-url');
    const inputCategory = document.getElementById('input-link-category');
    const linksList = document.getElementById('links-list');

    if (linkForm) {
      linkForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = inputTitle ? inputTitle.value.trim() : '';
        const rawUrl = inputUrl ? inputUrl.value.trim() : '';
        const category =
          inputCategory && inputCategory.value ? inputCategory.value.trim() : 'Social';

        if (!title || !rawUrl) return;

        const newLink = {
          id: generateId('link'),
          title,
          url: normalizeUrl(rawUrl),
          category
        };

        state.links.push(newLink);
        saveState(state);
        renderLinks();

        if (typeof linkForm.reset === 'function') {
          linkForm.reset();
        } else {
          if (inputTitle) inputTitle.value = '';
          if (inputUrl) inputUrl.value = '';
          if (inputCategory) inputCategory.value = 'Social';
        }
      });
    }

    if (linksList) {
      linksList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-link]');
        if (!removeBtn) return;
        e.preventDefault();
        e.stopPropagation();
        const idToRemove = removeBtn.getAttribute('data-remove-link');
        if (!idToRemove) return;
        state.links = state.links.filter((l) => l.id !== idToRemove);
        saveState(state);
        renderLinks();
      });
    }
  }

  function bindHeaderAndModalEvents() {
    const themeToggle = document.getElementById('theme-toggle');
    const editToggle = document.getElementById('edit-toggle');
    const resetBtn = document.getElementById('reset-portfolio');
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxClose = document.getElementById('lightbox-close');

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    if (editToggle) {
      editToggle.addEventListener('click', toggleEditorPanel);
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetPortfolio();
      });
    }
    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
          closeLightbox();
        }
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    });
  }

  function init() {
    initTheme();
    saveState(state);
    renderAll({ syncInputs: true });
    bindIntroEvents();
    bindPhotoEvents();
    bindLinkEvents();
    bindHeaderAndModalEvents();
  }

  if (typeof window !== 'undefined') {
    window.PortfolioApp = {
      STORAGE_KEY,
      getState: () => JSON.parse(JSON.stringify(state)),
      resetPortfolio,
      openLightbox,
      closeLightbox,
      toggleTheme,
      toggleEditorPanel,
      renderAll
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
