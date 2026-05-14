// ========== STATE ==========
let allItems = [];
let sources = [];
let activeCategory = 'all';
let activeSources = new Set();
let searchQuery = '';
let viewMode = 'grid';

// ========== DOM REFS ==========
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const loadingOverlay = $('#loading-overlay');
const searchInput = $('#search-input');
const refreshBtn = $('#refresh-btn');
const articleCount = $('#article-count');
const lastUpdateEl = $('#last-update');
const heroArea = $('#hero-area');
const newsGrid = $('#news-grid');
const emptyState = $('#empty-state');
const sourceList = $('#source-list');
const modal = $('#article-modal');
const mobileSidebarToggle = $('#mobile-sidebar-toggle');
const sidebar = $('#sidebar');
const toggleAllBtn = $('#toggle-all-sources');
const feedSection = $('#feed-section');

// ========== UTILS ==========
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDate(dateStr) {
  if (!dateStr) return 'Data não disponível';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ========== FETCH ==========
async function fetchFeeds() {
  refreshBtn.classList.add('spinning');
  try {
    const res = await fetch('/api/feeds');
    const data = await res.json();
    if (data.success) {
      allItems = data.items;
      sources = data.sources;
      if (activeSources.size === 0) {
        sources.forEach((s) => activeSources.add(s.id));
      }
      updateCounts();
      renderSources();
      renderFeed();
      articleCount.textContent = allItems.length;
      lastUpdateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    refreshBtn.classList.remove('spinning');
    loadingOverlay.classList.add('fade-out');
    setTimeout(() => { loadingOverlay.style.display = 'none'; }, 600);
  }
}

// ========== FILTERING ==========
function getFilteredItems() {
  return allItems.filter((item) => {
    const catMatch = activeCategory === 'all' || item.category === activeCategory;
    const srcMatch = activeSources.has(item.sourceId);
    const searchMatch = !searchQuery || item.title.toLowerCase().includes(searchQuery) || item.description.toLowerCase().includes(searchQuery);
    return catMatch && srcMatch && searchMatch;
  });
}

function updateCounts() {
  const allFiltered = allItems.filter((i) => activeSources.has(i.sourceId) && (!searchQuery || i.title.toLowerCase().includes(searchQuery) || i.description.toLowerCase().includes(searchQuery)));
  const countAll = document.getElementById('count-all');
  if (countAll) countAll.textContent = allFiltered.length;

  ['World', 'Brasil', 'Política', 'Economia'].forEach((cat) => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = allFiltered.filter((i) => i.category === cat).length;
  });
}

// ========== RENDER SOURCES ==========
function renderSources() {
  const counts = {};
  allItems.forEach((i) => { counts[i.sourceId] = (counts[i.sourceId] || 0) + 1; });

  sourceList.innerHTML = sources.map((s) => {
    const isActive = activeSources.has(s.id);
    return `
      <div class="source-item ${isActive ? 'active' : 'dimmed'}" data-source-id="${s.id}">
        <span class="source-dot" style="color:${s.color};background:${s.color}"></span>
        <span class="source-name">${s.icon} ${s.name}</span>
        <span class="source-badge">${counts[s.id] || 0}</span>
      </div>`;
  }).join('');

  sourceList.querySelectorAll('.source-item').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.sourceId;
      if (activeSources.has(id)) activeSources.delete(id);
      else activeSources.add(id);
      updateCounts();
      renderSources();
      renderFeed();
    });
  });
}

// ========== RENDER HERO ==========
function renderHero(items) {
  const heroItems = items.filter((i) => i.image).slice(0, 3);
  if (heroItems.length === 0) {
    heroArea.innerHTML = '';
    heroArea.style.display = 'none';
    return;
  }
  heroArea.style.display = 'grid';
  heroArea.innerHTML = heroItems.map((item, idx) => `
    <div class="hero-card" data-idx="${allItems.indexOf(item)}">
      <div class="hero-card-img" style="background-image:url('${item.image}')"></div>
      <div class="hero-card-overlay">
        <span class="hero-source">${item.sourceIcon} ${item.sourceName}</span>
        <h3 class="hero-title">${item.title}</h3>
        ${idx === 0 ? `<p class="hero-desc">${item.description}</p>` : ''}
        <span class="hero-date">${timeAgo(item.pubDate)}</span>
      </div>
    </div>
  `).join('');

  heroArea.querySelectorAll('.hero-card').forEach((card) => {
    card.addEventListener('click', () => openModal(allItems[+card.dataset.idx]));
  });
}

// ========== RENDER GRID ==========
function renderGrid(items) {
  // In list mode, show ALL items (no hero exclusion)
  let gridItems;
  if (viewMode === 'list') {
    gridItems = items;
  } else {
    const heroItems = items.filter((x) => x.image).slice(0, 3);
    gridItems = items.filter((i) => !heroItems.includes(i));
  }

  if (gridItems.length === 0 && (viewMode === 'list' || items.filter((i) => i.image).slice(0, 3).length === 0)) {
    newsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  newsGrid.innerHTML = gridItems.map((item, idx) => `
    <article class="news-card" data-idx="${allItems.indexOf(item)}" style="animation-delay:${Math.min(idx * 0.03, 0.6)}s">
      <div class="card-img-wrap">
        ${item.image
          ? `<img class="card-img" src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=card-no-img>${item.sourceIcon}</div>'" />`
          : `<div class="card-no-img">${item.sourceIcon}</div>`
        }
        <span class="card-category" style="color:${item.sourceColor}">${item.category}</span>
      </div>
      <div class="card-body">
        <div class="card-source">
          <span class="card-source-dot" style="background:${item.sourceColor}"></span>
          ${item.sourceName}
        </div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-desc">${item.description}</p>
      </div>
      <div class="card-footer">
        <span class="card-date">${timeAgo(item.pubDate)}</span>
        <span class="card-read-more">Ler mais →</span>
      </div>
    </article>
  `).join('');

  newsGrid.querySelectorAll('.news-card').forEach((card) => {
    card.addEventListener('click', () => openModal(allItems[+card.dataset.idx]));
  });
}

function renderFeed() {
  const filtered = getFilteredItems();
  // Apply view mode class
  feedSection.classList.toggle('list-view', viewMode === 'list');
  if (viewMode === 'grid') {
    renderHero(filtered);
  } else {
    heroArea.innerHTML = '';
    heroArea.style.display = 'none';
  }
  renderGrid(filtered);
  articleCount.textContent = filtered.length;
}

// ========== MODAL ==========
function openModal(item) {
  if (!item) return;
  const imgWrapper = $('#modal-img-wrapper');
  const img = $('#modal-img');
  if (item.image) {
    imgWrapper.classList.remove('hidden');
    img.src = item.image;
    img.alt = item.title;
  } else {
    imgWrapper.classList.add('hidden');
  }
  $('#modal-source').textContent = `${item.sourceIcon} ${item.sourceName}`;
  $('#modal-title').textContent = item.title;
  $('#modal-date').textContent = formatDate(item.pubDate);
  $('#modal-description').textContent = item.description;
  $('#modal-link').href = item.link;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// ========== EVENT LISTENERS ==========
// Category tabs
$$('.cat-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.cat-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.category;
    renderFeed();
  });
});

// Search
let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = searchInput.value.toLowerCase().trim();
    updateCounts();
    renderFeed();
  }, 250);
});

// Ctrl+K shortcut
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape') {
    closeModal();
    searchInput.blur();
  }
});

// Refresh
refreshBtn.addEventListener('click', () => fetchFeeds());

// Modal
$('#modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// Toggle all sources
toggleAllBtn.addEventListener('click', () => {
  if (activeSources.size === sources.length) {
    activeSources.clear();
  } else {
    sources.forEach((s) => activeSources.add(s.id));
  }
  updateCounts();
  renderSources();
  renderFeed();
});

// Mobile sidebar
mobileSidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

// View toggle (grid / list)
$$('.view-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.view-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    viewMode = btn.dataset.view;
    renderFeed();
  });
});

// Header scroll effect
window.addEventListener('scroll', () => {
  $('#main-header').classList.toggle('scrolled', window.scrollY > 10);
});

// ========== INIT ==========
fetchFeeds();
// Auto-refresh every 5 minutes
setInterval(fetchFeeds, 5 * 60 * 1000);
