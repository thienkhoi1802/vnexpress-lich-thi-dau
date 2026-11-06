
// Helper: Convert VnExpress news link to local app article URL
function getArticleUrl(link) {
  if (!link) return '#';
  try {
    const clean = link.split('?')[0].split('#')[0];
    const match = clean.match(/\/([a-zA-Z0-9_-]+-\d+\.html)$/);
    if (match) {
      return '/' + match[1];
    }
  } catch (e) {}
  return link;
}


function getMatchBroadcast(match, leagueId) {
  if (match.broadcast) return match.broadcast;
  if (match.channels && match.channels.length) return match.channels[0];
  const id = Number(leagueId || match.league_id || match.league_meta?.id || 0);
  const fid = Number(match.fixture_id || 0);
  const defaultBroadcasts = {
    39: ['K+ SPORT 1', 'K+ SPORT 2', 'TV360', 'ON Football'],
    2: ['TV360', 'FPT Play'],
    3: ['TV360', 'FPT Play'],
    340: ['FPT Play', 'VTV5', 'HTV Thể Thao', 'TV360'],
    140: ['SCTV15', 'VTVcab', 'K+'],
    135: ['ON Football', 'VTVcab'],
    78: ['ON Sports News', 'VTVcab'],
    61: ['ON Sports', 'VTVcab']
  };
  const chs = defaultBroadcasts[id] || ['TV360', 'FPT Play', 'K+ SPORT 1', 'VTVcab'];
  return chs[fid % chs.length];
}

// Realtime dynamic date (GMT+7)
function getClientTodayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
let TODAY_DATE = getClientTodayYmd();

// Standard VDS Date & Time Formatters (Follows https://vnexpress-design-system.vne-designops.workers.dev/content/time/)
function formatTemplateDateTime(eventDateStr) {
  if (window.vdsFormatDateTime) {
    return window.vdsFormatDateTime(eventDateStr);
  }
  if (!eventDateStr) return '';
  const d = new Date(eventDateStr);
  if (isNaN(d.getTime())) return eventDateStr;

  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayName = dayNames[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${dayName}, ${day}/${month}/${year}, ${hours}:${minutes} (GMT+7)`;
}

// Match Item Time Formatter: "16/10, 02:00"
function formatMatchItemTime(eventDateStr) {
  if (window.vdsFormatMatchItemTime) {
    return window.vdsFormatMatchItemTime(eventDateStr);
  }
  if (!eventDateStr) return '';
  const d = new Date(eventDateStr);
  if (isNaN(d.getTime())) return eventDateStr;

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}, ${hours}:${minutes}`;
}

function formatTemplateDateOnly(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00+07:00`);
  if (isNaN(d.getTime())) return dateStr;

  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayName = dayNames[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  return `${dayName}, ${day}/${month}/${year}`;
}

// Detect initial mode from independent SEO URL or query param
function detectInitialMode() {
  const path = window.location.pathname.toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');

  if (path === '/ket-qua' || path === '/ket-qua-bong-da' || modeParam === 'past') {
    return 'past';
  } else if (path === '/live' || modeParam === 'live') {
    return 'live';
  } else {
    return 'future';
  }
}

// Application State
const state = {
  currentMode: detectInitialMode(), // 'future' | 'past' | 'live'
  selectedDate: TODAY_DATE, // Active 'Hôm nay' immediately on access
  selectedLeague: null,
  selectedTeam: null,
  searchQuery: '',
  viewMode: 'timeline', // 'timeline' (demo-final.jpeg) | 'scs' (scs.jpeg)
  newsPage: 1,
  newsLimit: 20,
  filterPickerType: 'leagues',
  favMode: false,
  pickerExpand: { teams: false, leagues: false },
  rangeType: 'day',     // 'day' | 'weekend' | 'week' | 'round'
  rangeOffset: 0,       // lệch theo tuần so với tuần hiện tại
  rangeRound: null,
  rounds: [],
  rangeSub: '',
  matchDays: null,      // { 'YYYY-MM-DD': số trận } theo bộ lọc hiện tại
  matchDaysKey: '',
  config: null,
  allFixtures: [],
  standingsMap: {},
  liveMatches: []
};

// ---------------- Đội của tôi (theo dõi đội yêu thích, lưu localStorage) ----------------
const FAV_STORAGE_KEY = 'vne_fav_teams';
function loadFavTeams() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(Number).filter(Number.isFinite) : [];
  } catch (e) { return []; }
}
function saveFavTeams(ids) {
  try { localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(ids)); } catch (e) { /* bỏ qua */ }
}
state.favTeams = loadFavTeams();
function isFavTeam(id) { return state.favTeams.includes(Number(id)); }
function applyFavFilter(list) {
  if (!state.favMode) return list;
  return list.filter(m => state.favTeams.includes(Number(m.home_team?.team_id)) || state.favTeams.includes(Number(m.away_team?.team_id)));
}
function toggleFavTeam(teamId) {
  const id = Number(teamId);
  state.favTeams = isFavTeam(id) ? state.favTeams.filter(x => x !== id) : [...state.favTeams, id];
  saveFavTeams(state.favTeams);
  if (state.favMode && !state.favTeams.length) state.favMode = false;
  renderLeagueTabs();
  renderFilterPickerOptions();
  if (state.favMode) loadFixtures();
}
function selectFavMode() {
  if (!state.favTeams.length) { toggleFavPanel(); return; }
  state.favMode = !state.favMode;
  state.favPanel = false; // bấm vào tab chỉ bật/tắt lọc; popup quản lý mở bằng nút bánh răng
  state.selectedLeague = null;
  state.selectedTeam = null;
  renderSidebarFilters();
  loadFixtures();
}

let filterPickerTrigger = null;
let filterPickerBodyOverflow = '';
let fixturesRequestId = 0;

// Initialize
async function initApp() {
  if (window.lucide) lucide.createIcons();
  setupEventListeners();

  const headerDateEl = document.getElementById('current-datetime-display');
  function updateHeaderClock() {
    if (headerDateEl) {
      headerDateEl.innerText = formatTemplateDateTime(new Date().toISOString());
    }
  }
  updateHeaderClock();
  setInterval(() => {
    updateHeaderClock();
    if (document.visibilityState === 'visible' && state.currentMode !== 'past' && state.config) {
      renderMatches();
    }
  }, 30000);

  // Tự động cập nhật lại lịch thi đấu và kết quả mỗi 2 tiếng
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadFixtures();
    }
  }, 2 * 60 * 60 * 1000);

  updateModeUI(state.currentMode, false);
  await loadConfig();

  // Support incoming ?team_id= or ?league_id= from Match Detail sidebar
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('team_id')) {
    state.selectedTeam = parseInt(urlParams.get('team_id'));
    state.selectedDate = null;
    renderSidebarFilters();
  } else if (urlParams.get('league_id')) {
    state.selectedLeague = parseInt(urlParams.get('league_id'));
    state.selectedDate = null;
    renderSidebarFilters();
  }

  generateDateTabs();
  await Promise.all([
    loadFixtures(),
    loadStandings(),
    loadNews()
  ]);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Event Listeners
function setupEventListeners() {
  // Phím tắt ⌘K / Ctrl+K: mở ô tìm kiếm đội bóng, giải đấu
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
  const kbd = document.getElementById('search-kbd');
  if (kbd) kbd.textContent = isMac ? '⌘K' : 'Ctrl K';
  document.querySelectorAll('.vne-mod-key').forEach(k => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const modal = document.getElementById('modal-filter-picker');
      if (modal.classList.contains('open')) document.getElementById('filter-picker-search').select();
      else openFilterPicker('leagues');
    }
  });
  document.getElementById('filter-picker-search').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.querySelector('#filter-picker-options .vne-filter-item-btn')?.click();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      document.querySelector('#filter-picker-options .vne-filter-item-btn')?.focus();
    }
  });
  document.getElementById('filter-picker-options').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = [...document.querySelectorAll('#filter-picker-options .vne-filter-item-btn, #filter-picker-options .vne-pick-more')];
    const i = items.indexOf(document.activeElement);
    if (i === -1) return;
    event.preventDefault();
    if (event.key === 'ArrowUp' && i === 0) document.getElementById('filter-picker-search').focus();
    else items[Math.max(0, Math.min(items.length - 1, i + (event.key === 'ArrowDown' ? 2 : -2)))]?.focus();
  });
  const dateSlider = document.getElementById('date-slider-container');
  dateSlider.addEventListener('scroll', updateDateNavigation, { passive: true });
  window.addEventListener('resize', updateDateNavigation);

  document.getElementById('modal-filter-picker').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal('modal-filter-picker');
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll('button, input')];
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl.focus();
    }
  });

}

// Fetch System Configuration
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    state.config = await res.json();
    renderSidebarFilters();
  } catch (err) {
    console.error('Error loading config:', err);
  }
}

// Render Left Sidebar Leagues & Hot Teams
function renderSidebarFilters() {
  if (!state.config) return;

  const leagueListEl = document.getElementById('league-filter-list');
  const teamListEl = document.getElementById('team-filter-list');
  const q = state.searchQuery;

  // Filter leagues
  let leagues = state.config.leagues || [];
  if (q) {
    leagues = leagues.filter(l => l.name.toLowerCase().includes(q) || l.vnName.toLowerCase().includes(q) || l.country.toLowerCase().includes(q));
  }
  const visibleLeagues = leagues.slice(0, 4);
  document.getElementById('league-count-badge').innerText = `${visibleLeagues.length}/${leagues.length}`;
  document.getElementById('txt-more-leagues').innerText = `Xem thêm (${leagues.length - visibleLeagues.length} giải khác)`;
  document.getElementById('btn-toggle-more-leagues').style.display = leagues.length <= 4 ? 'none' : 'flex';

  leagueListEl.innerHTML = visibleLeagues.map(l => {
    const isActive = state.selectedLeague === l.id;
    return `
      <li>
        <button class="vne-filter-item-btn ${isActive ? 'active' : ''}" onclick="selectLeague(${l.id})">
          <img src="${l.logo}" class="vne-filter-icon" alt="${l.vnName}" onerror="this.src='https://is.vnecdn.net/objects/leagues/39.png?v=1'">
          <div class="vne-filter-name-col">
            <span class="vne-filter-name" title="${l.vnName}">${l.vnName}</span>
            <span class="vne-filter-sub">${l.country}</span>
          </div>
        </button>
      </li>
    `;
  }).join('');

  // Filter hot teams
  let teams = state.config.hotTeams || [];
  if (q) {
    teams = teams.filter(t => t.name.toLowerCase().includes(q) || t.country.toLowerCase().includes(q));
  }
  const visibleTeams = teams.slice(0, 6);
  document.getElementById('team-count-badge').innerText = `${visibleTeams.length}/${teams.length}`;
  document.getElementById('txt-more-teams').innerText = `Xem thêm (${teams.length - visibleTeams.length} đội khác)`;
  document.getElementById('btn-toggle-more-teams').style.display = teams.length <= 6 ? 'none' : 'flex';

  teamListEl.innerHTML = visibleTeams.map(t => {
    const isActive = state.selectedTeam === t.id;
    return `
      <li>
        <button class="vne-filter-item-btn ${isActive ? 'active' : ''}" onclick="selectTeam(${t.id})" title="${t.name}" aria-pressed="${isActive}">
          <img src="${t.logo}" class="vne-filter-icon" alt="" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
          <span class="vne-filter-name">${t.name}</span>
        </button>
      </li>
    `;
  }).join('');

  // Show/hide reset filter box
  const hasFilter = state.favMode || state.selectedLeague !== null || state.selectedTeam !== null || state.searchQuery !== '';
  document.getElementById('reset-filter-box').style.display = hasFilter ? 'block' : 'none';

  // Also render mobile quick league chips
  renderMobileLeagueChips();
  renderLeagueTabs();
}

function renderLeagueTabs() {
  const container = document.getElementById('league-tabs');
  if (!container || !state.config) return;

  const featuredLeagues = [
    { id: 39, label: 'Ngoại hạng Anh', short: 'NHA' },
    { id: 2, label: 'C1' },
    { id: 340, label: 'V-League' },
    { id: 140, label: 'La Liga' }
  ].map(item => ({
    ...item,
    league: state.config.leagues.find(league => league.id === item.id)
  })).filter(item => item.league);
  const featuredIds = new Set(featuredLeagues.map(item => item.id));
  const otherLeagues = state.config.leagues.filter(league => !featuredIds.has(league.id));
  const selectedOther = otherLeagues.find(league => league.id === state.selectedLeague);

  const selTeam = state.selectedTeam ? ((state.selectedTeamMeta && state.selectedTeamMeta.id === state.selectedTeam ? state.selectedTeamMeta : null) || favTeamPool().find(t => t.id === state.selectedTeam) || (state.config.hotTeams || []).find(t => t.id === state.selectedTeam)) : null;
  const teamChip = state.selectedTeam ? `
    <button type="button" class="vne-league-tab vne-team-filter active" onclick="clearFilters()" title="Bỏ lọc đội này" aria-label="Bỏ lọc ${selTeam ? String(selTeam.name).replace(/"/g, '') : 'đội'}">
      ${selTeam && selTeam.logo ? `<img src="${selTeam.logo}" alt="" onerror="this.hidden=true">` : ''}<span>${selTeam ? selTeam.name : 'Đội đã chọn'}</span><span class="vne-team-filter-x" aria-hidden="true">✕</span>
    </button>` : '';
  container.innerHTML = `
    <button type="button" class="vne-league-tab ${!state.favMode && state.selectedLeague === null && state.selectedTeam === null ? 'active' : ''}" onclick="selectLeagueTab(null)">Tất cả</button>${teamChip}
    <div class="vne-fav-group ${state.favMode ? 'active' : ''}${state.favPanel ? ' panel-open' : ''}${state.favTeams.length ? '' : ' is-empty'}">
      <button type="button" class="vne-fav-main" title="Đội của tôi" aria-label="Đội của tôi${state.favTeams.length ? ` (${state.favTeams.length})` : ''}" onclick="selectFavMode()" aria-pressed="${state.favMode}">
        <span aria-hidden="true" class="vne-fav-star-ic">${state.favTeams.length ? '★' : '☆'}</span><span class="vne-fav-label">Đội của tôi</span>${state.favTeams.length ? `<span class="vne-fav-count">${state.favTeams.length}</span>` : ''}${state.favMode ? `<span class="vne-tab-sep" aria-hidden="true"></span><span class="vne-tab-x" role="button" tabindex="0" aria-label="Bỏ lọc, về mặc định" title="Bỏ lọc" onclick="event.stopPropagation();selectFavMode()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();selectFavMode()}">✕</span>` : ''}
      </button>
      ${state.favTeams.length ? `<button type="button" class="vne-fav-gear" onclick="toggleFavPanel()" aria-haspopup="dialog" aria-expanded="${!!state.favPanel}" aria-controls="fav-bar" title="Quản lý đội theo dõi" aria-label="Quản lý đội theo dõi">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>` : ''}
    </div>
    ${featuredLeagues.map(item => `
      <button type="button" class="vne-league-tab ${state.selectedLeague === item.id ? 'active' : ''}" onclick="selectLeagueTab(${item.id})">
        <img src="${item.league.logo}" alt="" onerror="this.hidden=true">
        <span class="vne-lg-full">${item.label}</span><span class="vne-lg-short" aria-hidden="true">${item.short || item.label}</span>${state.selectedLeague === item.id ? `<span class="vne-tab-x" role="button" tabindex="0" aria-label="Bỏ lọc, về mặc định" title="Bỏ lọc" onclick="event.stopPropagation();selectLeagueTab(null)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();selectLeagueTab(null)}">✕</span>` : ''}
      </button>
    `).join('')}
    <button type="button" class="vne-league-tab vne-league-more ${selectedOther ? 'active' : ''}" onclick="toggleLeagueMore()" aria-haspopup="dialog" aria-expanded="${!!state.leagueMoreOpen}" aria-controls="league-more-pop">
      ${selectedOther ? `<img src="${selectedOther.logo}" alt="" onerror="this.hidden=true"><span class="vne-league-more-name">${selectedOther.vnName || selectedOther.name}</span>` : '<span>Giải khác</span>'}
      ${selectedOther ? `<span class="vne-tab-x" role="button" tabindex="0" aria-label="Bỏ lọc, về mặc định" title="Bỏ lọc" onclick="event.stopPropagation();selectLeagueTab(null)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();selectLeagueTab(null)}">✕</span>` : '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
    </button>
  `;
  container.classList.toggle('has-team', !!state.selectedTeam);
  renderFavBar();
  renderLeagueMore();
}

function otherLeagueList() {
  const featured = new Set([39, 2, 340, 140]);
  return (state.config?.leagues || []).filter(l => !featured.has(l.id));
}

function toggleLeagueMore(force) {
  state.leagueMoreOpen = typeof force === 'boolean' ? force : !state.leagueMoreOpen;
  if (state.leagueMoreOpen) state.favPanel = false;
  renderLeagueTabs();
  if (state.leagueMoreOpen) document.getElementById('league-more-search')?.focus();
  else document.querySelector('.vne-league-more')?.focus();
}

function pickMoreLeague(id) {
  state.leagueMoreOpen = false;
  selectLeagueTab(id);
}

function positionLeagueMore() {
  const pop = document.getElementById('league-more-pop');
  const anchor = document.querySelector('.vne-league-more');
  if (!pop || pop.hidden || !anchor) return;
  document.getElementById('league-more-backdrop')?.remove();
  if (window.innerWidth <= 640) {
    pop.style.left = pop.style.top = '';
    const bd = document.createElement('div');
    bd.id = 'league-more-backdrop';
    bd.className = 'vne-fav-backdrop';
    bd.addEventListener('click', () => toggleLeagueMore(false));
    pop.insertAdjacentElement('beforebegin', bd);
    return;
  }
  const r = anchor.getBoundingClientRect();
  const w = Math.min(340, window.innerWidth - 16);
  pop.style.width = w + 'px';
  pop.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + 'px';
  pop.style.top = (r.bottom + 6) + 'px';
}

function renderLeagueMore() {
  const nav = document.getElementById('league-tabs');
  if (!nav) return;
  let pop = document.getElementById('league-more-pop');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'league-more-pop';
    pop.className = 'vne-more-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Chọn giải đấu khác');
    pop.innerHTML = `<div class="vne-more-searchbox"><input id="league-more-search" type="search" autocomplete="off" placeholder="Tìm giải đấu hoặc quốc gia..." aria-label="Tìm giải đấu" oninput="renderLeagueMoreList()"></div><div class="vne-more-list" id="league-more-list"></div><div class="vne-keyhints" aria-hidden="true"><span><kbd>Esc</kbd> đóng</span><span><kbd>↑</kbd><kbd>↓</kbd> di chuyển</span><span><kbd>Enter</kbd> chọn</span></div>`;
    pop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); toggleLeagueMore(false); return; }
      if (e.key === 'Enter' && e.target.id === 'league-more-search') { e.preventDefault(); pop.querySelector('.vne-more-item')?.click(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = [...pop.querySelectorAll('.vne-more-item')];
      const i = items.indexOf(document.activeElement);
      e.preventDefault();
      if (i === -1) items[0]?.focus();
      else if (e.key === 'ArrowUp' && i === 0) document.getElementById('league-more-search').focus();
      else items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
    });
    nav.insertAdjacentElement('afterend', pop);
  }
  document.getElementById('league-more-backdrop')?.remove();
  if (!state.leagueMoreOpen) { pop.hidden = true; return; }
  pop.hidden = false;
  renderLeagueMoreList();
  positionLeagueMore();
}

function renderLeagueMoreList() {
  const list = document.getElementById('league-more-list');
  if (!list) return;
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
  const q = norm(document.getElementById('league-more-search')?.value);
  const all = otherLeagueList().filter(l => !q || norm(`${l.vnName || ''} ${l.name} ${l.country}`).includes(q));
  if (!all.length) { list.innerHTML = '<p class="vne-fav-empty">Không tìm thấy giải đấu.</p>'; return; }
  const item = l => `<button type="button" class="vne-more-item${state.selectedLeague === l.id ? ' on' : ''}" onclick="pickMoreLeague(${l.id})"><img src="${l.logo}" alt="" onerror="this.src='https://is.vnecdn.net/objects/leagues/39.png?v=1'"><span class="n">${l.vnName || l.name}</span><span class="c">${l.country || ''}</span><span class="k">${state.selectedLeague === l.id ? '✓' : ''}</span></button>`;
  const groups = new Map();
  all.sort((a, b) => (a.tier || 9) - (b.tier || 9) || String(a.country).localeCompare(String(b.country)) || (a.vnName || a.name).localeCompare(b.vnName || b.name));
  all.forEach(l => { const k = (l.tier || 9) <= 1 ? 'Giải VĐQG & châu lục' : 'Cúp & giải khác'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); });
  const sel = state.selectedLeague && all.find(l => l.id === state.selectedLeague);
  let html = '';
  if (sel && !q) html += `<div class="vne-more-head">Đang chọn</div>${item(sel)}<button type="button" class="vne-more-reset" onclick="pickMoreLeague(null)">Bỏ chọn giải</button>`;
  groups.forEach((arr, k) => { html += `<div class="vne-more-head">${q ? 'Kết quả' : k} · ${arr.length}</div>${arr.map(item).join('')}`; });
  list.innerHTML = html;
}

document.addEventListener('click', (event) => {
  if (!state.leagueMoreOpen || !event.target.isConnected) return;
  const inside = event.composedPath().some(n => n.id === 'league-more-pop' || (n.classList && n.classList.contains('vne-league-more')));
  if (!inside) toggleLeagueMore(false);
});
window.addEventListener('resize', () => positionLeagueMore());
window.addEventListener('scroll', () => positionLeagueMore(), { passive: true });

function toggleFavPanel(force) {
  state.favPanel = typeof force === 'boolean' ? force : !state.favPanel;
  if (state.favPanel) state.leagueMoreOpen = false;
  renderLeagueTabs();
  if (state.favPanel) {
    ensureAllTeams();
    document.getElementById('fav-search')?.focus();
  } else {
    document.querySelector('.vne-fav-gear')?.focus();
  }
}

function positionFavPanel() {
  const bar = document.getElementById('fav-bar');
  const anchor = document.querySelector('.vne-fav-group');
  if (!bar || bar.hidden || !anchor) return;
  if (window.innerWidth <= 640) {
    bar.style.left = bar.style.top = '';
    if (!document.getElementById('fav-backdrop')) {
      const bd = document.createElement('div');
      bd.id = 'fav-backdrop';
      bd.className = 'vne-fav-backdrop';
      bd.addEventListener('click', () => toggleFavPanel(false));
      bar.insertAdjacentElement('beforebegin', bd);
    }
    return;
  }
  const r = anchor.getBoundingClientRect();
  const w = Math.min(400, window.innerWidth - 16);
  bar.style.width = w + 'px';
  bar.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
  bar.style.top = (r.bottom + 6) + 'px';
}
window.addEventListener('resize', () => positionFavPanel());
window.addEventListener('scroll', () => positionFavPanel(), { passive: true });
document.addEventListener('click', (event) => {
  if (!state.favPanel || !event.target.isConnected) return;
  const inside = event.composedPath().some(n => n.id === 'fav-bar' || (n.classList && n.classList.contains('vne-fav-group')));
  if (!inside) toggleFavPanel(false);
});

function favTeamPool() { return state.allTeams || state.config?.hotTeams || []; }

function renderFavBar() {
  const nav = document.getElementById('league-tabs');
  if (!nav) return;
  let bar = document.getElementById('fav-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'fav-bar';
    bar.className = 'vne-fav-bar';
    nav.insertAdjacentElement('afterend', bar);
  }
  document.getElementById('fav-backdrop')?.remove();
  if (!state.favPanel) { bar.hidden = true; return; }
  bar.hidden = false;
  if (!bar.dataset.ready) {
    bar.dataset.ready = '1';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Quản lý đội theo dõi');
    bar.innerHTML = `
      <div class="vne-fav-head"><h3 class="vne-fav-heading">Đội của tôi</h3><button type="button" class="vne-fav-close" onclick="toggleFavPanel(false)" aria-label="Đóng">×</button></div>
      <div class="vne-fav-searchbox"><input id="fav-search" class="vne-fav-search" type="search" autocomplete="off" placeholder="Tìm đội hoặc giải đấu để thêm..." aria-label="Tìm đội hoặc giải đấu để thêm" oninput="renderFavResults()"></div>
      <div class="vne-fav-body">
        <section class="vne-fav-sec" id="fav-sec-follow"><div class="vne-fav-sec-head"><span id="fav-title"></span><button type="button" class="vne-fav-clear" onclick="clearFavTeams()">Xóa tất cả</button></div><div class="vne-fav-chips" id="fav-chips"></div></section>
        <section class="vne-fav-sec" id="fav-results"></section>
      </div>
      <div class="vne-keyhints" aria-hidden="true"><span><kbd>Esc</kbd> đóng</span></div>`;
    bar.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); toggleFavPanel(false); } });
  }
  positionFavPanel();
  const pool = favTeamPool();
  document.getElementById('fav-title').textContent = state.favTeams.length ? `Đang theo dõi · ${state.favTeams.length} đội` : 'Chưa theo dõi đội nào';
  document.getElementById('fav-sec-follow').classList.toggle('is-empty', !state.favTeams.length);
  document.getElementById('fav-chips').innerHTML = state.favTeams.map(id => {
    const t = pool.find(x => Number(x.id) === id);
    const name = t ? t.name : `Đội #${id}`;
    return `<span class="vne-fav-chip">${t?.logo ? `<img src="${t.logo}" alt="" onerror="this.hidden=true">` : ''}<span>${name}</span><button type="button" aria-label="Bỏ theo dõi ${name}" title="Bỏ theo dõi ${name}" onclick="toggleFavTeam(${id})">×</button></span>`;
  }).join('');
  bar.querySelector('.vne-fav-clear').hidden = state.favTeams.length < 2;
  renderFavResults();
}

function renderFavResults() {
  const box = document.getElementById('fav-results');
  if (!box) return;
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
  const q = norm(document.getElementById('fav-search')?.value);
  const leagues = state.config?.leagues || [];
  const pool = favTeamPool();
  const leagueName = id => { const l = leagues.find(x => x.id === id); return l ? (l.vnName || l.name) : ''; };
  const row = t => {
    const on = isFavTeam(t.id);
    return `<button type="button" class="vne-fav-row${on ? ' on' : ''}" onclick="toggleFavTeam(${t.id})" aria-pressed="${on}"><img src="${t.logo}" alt="" onerror="this.hidden=true"><span class="n">${t.name}</span><span class="l">${leagueName(t.leagueId)}</span><span class="s">${on ? '★' : '☆'}</span></button>`;
  };
  if (!q) {
    const sugg = pool.filter(t => t.hot !== false && !isFavTeam(t.id)).slice(0, 12);
    box.innerHTML = sugg.length ? `<div class="vne-fav-sec-head"><span>Gợi ý thêm</span></div><div class="vne-fav-sugg">${sugg.map(t => `<button type="button" class="vne-fav-sugg-item" onclick="toggleFavTeam(${t.id})"><img src="${t.logo}" alt="" onerror="this.hidden=true"><span>${t.name}</span><b>+</b></button>`).join('')}</div>` : '';
    return;
  }
  const lids = new Set(leagues.filter(l => norm(`${l.vnName || ''} ${l.name} ${l.country}`).includes(q)).map(l => l.id));
  const found = pool.filter(t => norm(`${t.name} ${t.country || ''}`).includes(q) || lids.has(t.leagueId)).slice(0, 40);
  box.innerHTML = found.length ? `<div class="vne-fav-sec-head"><span>Kết quả · ${found.length}</span></div>` + found.map(row).join('') : '<p class="vne-fav-empty">Không tìm thấy đội phù hợp.</p>';
}

function clearFavTeams() {
  if (state.favTeams.length > 1 && !confirm(`Bỏ theo dõi cả ${state.favTeams.length} đội?`)) return;
  state.favTeams = [];
  saveFavTeams([]);
  state.favMode = false;
  renderLeagueTabs();
  renderFilterPickerOptions();
  loadFixtures();
}

let lastLeagueClick = { id: undefined, at: 0 };
function selectLeagueTab(leagueId) {
  // Nhấp đúp vào giải đang chọn để bỏ chọn (về "Tất cả")
  const now = Date.now();
  if (leagueId !== null && !state.favMode && state.selectedLeague === leagueId && lastLeagueClick.id === leagueId && now - lastLeagueClick.at < 450) {
    lastLeagueClick = { id: undefined, at: 0 };
    leagueId = null;
  } else {
    lastLeagueClick = { id: leagueId, at: now };
  }
  state.favMode = false;
  state.selectedLeague = leagueId;
  state.selectedTeam = null;
  renderSidebarFilters();
  loadFixtures();
}

// Render Mobile Quick League Filter Chips
function renderMobileLeagueChips() {
  const container = document.getElementById('mobile-league-chips-container');
  if (!container || !state.config) return;

  const topLeagueIds = [39, 2, 140, 340, 78, 135, 61, 307, 3, 253];
  const leagues = state.config.leagues.filter(l => topLeagueIds.includes(l.id));

  let html = `
    <button class="vne-mobile-chip ${state.selectedLeague === null ? 'active' : ''}" onclick="selectLeague(null)">
      <span>Tất cả giải</span>
    </button>
  `;

  html += leagues.map(l => {
    const isActive = state.selectedLeague === l.id;
    return `
      <button class="vne-mobile-chip ${isActive ? 'active' : ''}" onclick="selectLeague(${l.id})">
        <img src="${l.logo}" alt="${l.vnName}" onerror="this.src='https://is.vnecdn.net/objects/leagues/39.png?v=1'">
        <span>${l.vnName}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = html;
}

function openFilterPicker(type, mode) {
  if (!state.config) return;
  state.pickerMode = mode || null;
  const modal = document.getElementById('modal-filter-picker');
  filterPickerTrigger = document.activeElement === document.body
    ? document.getElementById('schedule-search-input')
    : document.activeElement;
  filterPickerBodyOverflow = document.body.style.overflow;
  document.getElementById('filter-picker-search').value = '';
  state.pickerExpand = { teams: false, leagues: false };
  switchFilterPicker(type);
  if (state.pickerMode === 'addFav') ensureAllTeams();
  modal.inert = false;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('filter-picker-search').focus();
}

function switchFilterPicker(type) {
  state.filterPickerType = type;
  const addFav = state.pickerMode === 'addFav';
  document.getElementById('filter-picker-title').textContent = addFav ? 'Thêm đội theo dõi' : 'Tìm đội bóng, giải đấu';
  const searchInput = document.getElementById('filter-picker-search');
  searchInput.placeholder = addFav ? 'Gõ tên đội hoặc giải đấu để tìm đội...' : 'Gõ tên đội bóng hoặc giải đấu...';
  searchInput.setAttribute('aria-label', searchInput.placeholder);
  renderFilterPickerOptions();
}

// Danh sách đầy đủ đội: gộp đội phổ biến + đội lấy từ lịch của từng giải
async function ensureAllTeams() {
  if (state.allTeams || state.allTeamsLoading) return;
  state.allTeamsLoading = true;
  try {
    const hot = state.config.hotTeams || [];
    const map = new Map(hot.map(t => [Number(t.id), { ...t, id: Number(t.id), hot: true }]));
    const lists = await Promise.all((state.config.leagues || []).map(l =>
      fetchFixtures(new URLSearchParams({ mode: 'all', league_id: l.id })).then(ms => ({ l, ms })).catch(() => ({ l, ms: [] }))));
    lists.forEach(({ l, ms }) => ms.forEach(m => [m.home_team, m.away_team].forEach(t => {
      if (!t || t.team_id == null) return;
      const id = Number(t.team_id);
      const cur = map.get(id);
      if (cur) { if (cur.leagueId == null || (!cur.hot && l.tier < 3)) cur.leagueId = cur.leagueId ?? l.id; return; }
      map.set(id, { id, name: t.team_name, logo: t.logo, country: l.country || '', leagueId: l.id });
    })));
    const seen = new Set();
    state.allTeams = [...map.values()].filter(t => { const k = String(t.name).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  } catch (e) { console.error(e); }
  state.allTeamsLoading = false;
  if (state.pickerMode === 'addFav') renderFilterPickerOptions();
  renderFavBar();
}

function renderFilterPickerOptions() {
  if (!state.config) return;
  const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
  const query = normalizeSearch(document.getElementById('filter-picker-search').value);
  const container = document.getElementById('filter-picker-options');
  container.replaceChildren();

  const allTeams = (state.pickerMode === 'addFav' && state.allTeams) || state.config.hotTeams || [];
  const matchTeam = t => normalizeSearch(`${t.name} ${t.country}`).includes(query);
  const matchLeague = l => normalizeSearch(`${l.vnName || ''} ${l.name} ${l.country}`).includes(query);

  const addHeading = (text) => {
    const h = document.createElement('div');
    h.className = 'vne-pick-heading';
    h.textContent = text;
    container.append(h);
  };

  const addTeamRow = (team) => {
    const row = document.createElement('div');
    row.className = 'vne-pick-row';
    const main = document.createElement('button');
    main.type = 'button';
    const isSelected = state.selectedTeam === team.id;
    main.className = `vne-filter-item-btn${isSelected ? ' active' : ''}`;
    main.setAttribute('aria-pressed', String(isSelected));
    const logo = document.createElement('img');
    logo.className = 'vne-filter-icon';
    logo.src = team.logo;
    logo.alt = '';
    const label = document.createElement('span');
    label.className = 'vne-filter-name-col';
    const name = document.createElement('span');
    name.className = 'vne-filter-name';
    name.textContent = team.name;
    const country = document.createElement('span');
    country.className = 'vne-filter-sub';
    country.textContent = team.country || '';
    label.append(name, country);
    main.append(logo, label);
    main.addEventListener('click', () => {
      if (state.pickerMode === 'addFav') { toggleFavTeam(team.id); return; }
      state.selectedTeamMeta = team; selectTeam(team.id); closeModal('modal-filter-picker');
    });

    const fav = isFavTeam(team.id);
    const star = document.createElement('button');
    star.type = 'button';
    star.className = `vne-fav-star${fav ? ' on' : ''}`;
    star.textContent = fav ? '★' : '☆';
    star.title = fav ? `Bỏ theo dõi ${team.name}` : `Theo dõi ${team.name}`;
    star.setAttribute('aria-label', star.title);
    star.setAttribute('aria-pressed', String(fav));
    star.addEventListener('click', (e) => { e.stopPropagation(); toggleFavTeam(team.id); });
    row.append(main, star);
    container.append(row);
  };

  const addLeagueBtn = (league) => {
    const button = document.createElement('button');
    button.type = 'button';
    const isSelected = state.selectedLeague === league.id;
    button.className = `vne-filter-item-btn${isSelected ? ' active' : ''}`;
    button.setAttribute('aria-pressed', String(isSelected));
    const logo = document.createElement('img');
    logo.className = 'vne-filter-icon';
    logo.src = league.logo;
    logo.alt = '';
    const label = document.createElement('span');
    label.className = 'vne-filter-name-col';
    const name = document.createElement('span');
    name.className = 'vne-filter-name';
    name.textContent = league.vnName || league.name;
    const country = document.createElement('span');
    country.className = 'vne-filter-sub';
    country.textContent = league.country || '';
    label.append(name, country);
    button.append(logo, label);
    button.addEventListener('click', () => { selectLeague(league.id); closeModal('modal-filter-picker'); });
    container.append(button);
  };

  const teams = allTeams.filter(matchTeam);
  const leagues = (state.config.leagues || []).filter(matchLeague);

  if (state.pickerMode === 'addFav') {
    // Chỉ tìm đội; gõ tên giải sẽ ra các đội thuộc giải đó
    const leagueIds = new Set(leagues.map(l => l.id));
    if (state.allTeamsLoading) { const n = document.createElement('p'); n.className = 'vne-filter-picker-empty'; n.textContent = 'Đang tải đầy đủ các đội...'; container.append(n); }
    const found = allTeams.filter(t => !query || matchTeam(t) || leagueIds.has(t.leagueId));
    if (!found.length) {
      const message = document.createElement('p');
      message.className = 'vne-filter-picker-empty';
      message.textContent = 'Không tìm thấy đội phù hợp.';
      container.append(message);
    } else {
      const groups = new Map();
      found.forEach(t => { const k = t.leagueId; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); });
      groups.forEach((list, lid) => {
        list.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || a.name.localeCompare(b.name));
        const lg = (state.config.leagues || []).find(l => l.id === lid);
        addHeading(lg ? (lg.vnName || lg.name) : 'Khác');
        const LIM = 6;
        const open = query || (state.pickerExpand.lg || {})[lid];
        (open ? list : list.slice(0, LIM)).forEach(addTeamRow);
        if (!query && list.length > LIM) {
          const more = document.createElement('button');
          more.type = 'button';
          more.className = 'vne-pick-more';
          more.textContent = open ? 'Thu gọn ▴' : `Xem tất cả ${list.length} đội ▾`;
          more.addEventListener('click', () => { state.pickerExpand.lg = { ...(state.pickerExpand.lg || {}), [lid]: !open }; const y = container.scrollTop; renderFilterPickerOptions(); container.scrollTop = y; });
          container.append(more);
        }
      });
    }
    if (!query) return;
    container.scrollTop = 0;
    return;
  }

  if (!query) {
    const PREVIEW = 6;
    const addMore = (key, total) => {
      if (total <= PREVIEW) return;
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'vne-pick-more';
      more.textContent = state.pickerExpand[key] ? 'Thu gọn ▴' : `Xem tất cả (${total}) ▾`;
      more.addEventListener('click', () => { state.pickerExpand[key] = !state.pickerExpand[key]; renderFilterPickerOptions(); });
      container.append(more);
    };
    const favs = allTeams.filter(t => isFavTeam(t.id));
    if (favs.length) { addHeading(`★ Đội của tôi (${favs.length})`); favs.forEach(addTeamRow); }
    const popular = allTeams.filter(t => !isFavTeam(t.id));
    addHeading('Đội bóng phổ biến');
    (state.pickerExpand.teams ? popular : popular.slice(0, PREVIEW)).forEach(addTeamRow);
    addMore('teams', popular.length);
    addHeading('Giải đấu');
    (state.pickerExpand.leagues ? leagues : leagues.slice(0, PREVIEW)).forEach(addLeagueBtn);
    addMore('leagues', leagues.length);
  } else {
    if (teams.length) { addHeading(`Đội bóng (${teams.length})`); teams.forEach(addTeamRow); }
    if (leagues.length) { addHeading(`Giải đấu (${leagues.length})`); leagues.forEach(addLeagueBtn); }
    if (!teams.length && !leagues.length) {
      const message = document.createElement('p');
      message.className = 'vne-filter-picker-empty';
      message.textContent = 'Không tìm thấy kết quả phù hợp.';
      container.append(message);
    }
  }
  container.scrollTop = 0;
}

function selectLeague(leagueId) {
  state.favMode = false;
  state.selectedLeague = (state.selectedLeague === leagueId) ? null : leagueId;
  state.selectedTeam = null; // reset team when league clicked
  renderSidebarFilters();
  loadFixtures();
}

function selectTeam(teamId) {
  state.favMode = false;
  state.selectedTeam = (state.selectedTeam === teamId) ? null : teamId;
  state.selectedLeague = null; // reset league when team clicked
  renderSidebarFilters();
  loadFixtures();
}

function clearFilters() {
  state.favMode = false;
  resetRange();
  state.selectedLeague = null;
  state.selectedTeam = null;
  state.searchQuery = '';
  state.selectedDate = TODAY_DATE; // Reset to Hôm nay
  document.querySelectorAll('#schedule-search-input, #sidebar-search-input').forEach(searchInput => {
    searchInput.value = '';
  });
  renderSidebarFilters();
  generateDateTabs();
  loadFixtures();
}

// ---------------- Gợi ý ngày có lịch theo bộ lọc (giải / đội / Đội của tôi) ----------------
let matchDaysRequestId = 0;

function hasMatchFilter() {
  return !!(state.selectedLeague || state.selectedTeam || state.favMode);
}

function currentMatchDaysKey() {
  if (!hasMatchFilter() || state.currentMode === 'live') return '';
  return [state.currentMode, state.selectedLeague || '', state.selectedTeam || '', state.favMode ? state.favTeams.join(',') : ''].join('|');
}

function currentFilterLabel() {
  if (state.favMode) return 'Đội của tôi';
  if (state.selectedTeam) return (state.config?.hotTeams || []).find(t => t.id === state.selectedTeam)?.name || 'đội này';
  if (state.selectedLeague) {
    const l = (state.config?.leagues || []).find(x => x.id === state.selectedLeague);
    return l?.vnName || l?.name || 'giải này';
  }
  return '';
}

function formatDayLabel(dateStr) {
  const names = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const d = new Date(dateStr);
  const diff = Math.round((d - new Date(TODAY_DATE)) / 86400000);
  const title = diff === 0 ? 'Hôm nay' : diff === 1 ? 'Ngày mai' : diff === -1 ? 'Hôm qua' : names[d.getDay()];
  return { title, sub: `${d.getDate()}/${d.getMonth() + 1}` };
}

// Lấy danh sách ngày có trận của bộ lọc hiện tại; nếu ngày đang chọn không có trận thì tự nhảy tới ngày gần nhất
async function ensureMatchDays() {
  const key = currentMatchDaysKey();
  if (!key) {
    if (state.matchDays) { state.matchDays = null; state.matchDaysKey = ''; generateDateTabs(); }
    return;
  }
  if (key === state.matchDaysKey && state.matchDays) return;

  const requestId = ++matchDaysRequestId;
  const mode = state.currentMode === 'past' ? 'past' : 'future';
  const base = { mode };
  let urls;
  if (state.favMode) urls = state.favTeams.map(id => new URLSearchParams({ ...base, team_id: id }));
  else {
    const p = new URLSearchParams(base);
    if (state.selectedLeague) p.set('league_id', state.selectedLeague);
    if (state.selectedTeam) p.set('team_id', state.selectedTeam);
    urls = [p];
  }
  let matches = [];
  try {
    matches = (await Promise.all(urls.map(p => fetchFixtures(p)))).flat();
  } catch (err) {
    console.error('Không tải được ngày có lịch:', err);
    return;
  }
  if (requestId !== matchDaysRequestId) return;

  const days = {};
  const seen = new Set();
  matches.forEach(m => {
    const id = m.fixture_id ?? `${m.event_date}-${m.home_team?.team_id}-${m.away_team?.team_id}`;
    if (seen.has(id)) return;
    seen.add(id);
    const day = (m.event_date || '').split('T')[0];
    if (day) days[day] = (days[day] || 0) + 1;
  });
  state.matchDays = days;
  state.matchDaysKey = key;

  const list = Object.keys(days).sort();
  if (list.length && !days[state.selectedDate]) {
    // Ngày đang chọn không có trận: tự chuyển tới ngày gần nhất có trận
    state.selectedDate = mode === 'past' ? list[list.length - 1] : list[0];
  }
  generateDateTabs();
}

// ---------------- Xem theo khoảng: Cuối tuần / Tuần / Vòng ----------------
const VN_DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
function addDaysIso(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dowOf(iso) { return new Date(`${iso}T00:00:00Z`).getUTCDay(); }
function mondayOf(iso) { return addDaysIso(iso, -((dowOf(iso) + 6) % 7)); }
function fmtDM(iso) { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; }

function resetRange() {
  state.rangeType = 'day';
  state.rangeOffset = 0;
  state.rangeRound = null;
  state.rounds = [];
  state.rangeSub = '';
}

function computeRange() {
  if (state.rangeType === 'week') {
    const mon = addDaysIso(mondayOf(TODAY_DATE), 7 * state.rangeOffset);
    return { from: mon, to: addDaysIso(mon, 6) };
  }
  if (state.rangeType === 'weekend') {
    const fri = addDaysIso(mondayOf(TODAY_DATE), 4 + 7 * state.rangeOffset);
    return { from: fri, to: addDaysIso(fri, 2) };
  }
  return { from: state.selectedDate, to: state.selectedDate };
}

function weekOffsetLabel(o) {
  const past = state.currentMode === 'past';
  if (o === 0) return 'Tuần này';
  if (o === 1) return 'Tuần sau';
  if (o === 2) return 'Tuần kế tiếp';
  if (o === -1) return 'Tuần trước';
  return o > 0 ? `${o} tuần nữa` : `${-o} tuần trước`;
}

function presetDefs() {
  const past = state.currentMode === 'past';
  // Chỉ khi đang xem theo tuần mới mở rộng thêm các tuần kế tiếp
  const expanded = state.rangeType === 'week';
  const offsets = !expanded ? [0] : (past ? [0, -1, -2] : [0, 1, 2]);
  const defs = [{ key: 'today', label: 'Hôm nay', sub: fmtDM(TODAY_DATE), type: 'day' }];
  offsets.forEach(o => {
    const w = computeRangeFor('week', o);
    defs.push({ key: `week${o}`, label: weekOffsetLabel(o), sub: `${fmtDM(w.from)}–${fmtDM(w.to)}`, type: 'week', offset: o });
  });
  return defs;
}

function computeRangeFor(type, offset) {
  if (type === 'weekend') {
    const fri = addDaysIso(mondayOf(TODAY_DATE), 4 + 7 * offset);
    return { from: fri, to: addDaysIso(fri, 2) };
  }
  const mon = addDaysIso(mondayOf(TODAY_DATE), 7 * offset);
  return { from: mon, to: addDaysIso(mon, 6) };
}

function isPresetActive(def) {
  if (def.type === 'day') return state.rangeType === 'day' && state.selectedDate === TODAY_DATE;
  if (def.type === 'round') return state.rangeType === 'round';
  return state.rangeType === def.type && state.rangeOffset === def.offset;
}

function renderRangePresets() {
  const el = document.getElementById('range-presets');
  if (!el) return;
  if (state.currentMode === 'live') { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = presetDefs().map(def => `
    <button type="button" class="vne-date-item-btn vne-range-chip ${isPresetActive(def) ? 'active' : ''}" onclick="applyRangePreset('${def.key}')" aria-pressed="${isPresetActive(def)}">
      <span>${def.label}</span>${def.sub ? `<span class="date-day-sub">${def.sub}</span>` : ''}
    </button>
  `).join('');
}

// Khi đổi ngày/tuần lúc thanh timeline đang sticky: tự cuộn về đầu danh sách trận
function scrollToScheduleTop() {
  const box = document.getElementById('matches-main-container');
  const bar = document.querySelector('.vne-date-nav-bar');
  if (!box) return;
  const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vne-header-h')) || 64;
  const target = box.getBoundingClientRect().top + window.scrollY - headerH - (bar ? bar.offsetHeight : 0) - 8;
  if (window.scrollY > target + 4) window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
}

function applyRangePreset(key) {
  const def = presetDefs().find(d => d.key === key);
  if (!def) return;
  if (def.type === 'day') { selectDate(TODAY_DATE); return; }
  state.rangeType = def.type;
  state.rangeOffset = def.offset || 0;
  state.rangeRound = null;
  generateDateTabs();
  scrollToScheduleTop();
  loadFixtures();
}

function rangeNavLabel() {
  if (state.rangeType === 'round') {
    return { main: state.rangeRound != null ? `Vòng ${state.rangeRound}` : 'Vòng đấu', sub: state.rangeSub };
  }
  const { from, to } = computeRange();
  const sub = state.rangeType === 'week' ? weekOffsetLabel(state.rangeOffset) : 'Cuối tuần';
  return { main: `${fmtDM(from)} – ${fmtDM(to)}`, sub };
}

function navOff(dir) {
  if (state.rangeType === 'round') {
    const i = state.rounds.indexOf(state.rangeRound);
    return i === -1 || state.rounds[i + dir] === undefined;
  }
  const past = state.currentMode === 'past';
  return past ? (dir > 0 && state.rangeOffset >= 0) : (dir < 0 && state.rangeOffset <= 0);
}

function renderRangeNavigator(container) {
  const label = rangeNavLabel();
  container.innerHTML = `
    <button type="button" class="vne-range-step" onclick="stepRange(-1)" aria-label="Trước"${navOff(-1) ? ' disabled' : ''}>‹</button>
    <div class="vne-range-label"><strong>${label.main}</strong>${label.sub ? `<span>${label.sub}</span>` : ''}</div>
    <button type="button" class="vne-range-step" onclick="stepRange(1)" aria-label="Sau"${navOff(1) ? ' disabled' : ''}>›</button>
  `;
}

function stepRange(dir) {
  if (navOff(dir)) return;
  if (state.rangeType === 'round') {
    const i = state.rounds.indexOf(state.rangeRound);
    const next = state.rounds[i + dir];
    if (i === -1 || next === undefined) return;
    state.rangeRound = next;
  } else {
    state.rangeOffset += dir;
  }
  generateDateTabs();
  scrollToScheduleTop();
  loadFixtures();
  // Mobile: giữ bộ chọn tuần (‹ nhãn ›) nằm trọn trong khung, nút lịch cố định ngoài cùng bên phải
  requestAnimationFrame(() => {
    const bar = document.querySelector('.vne-date-nav-bar.is-range');
    if (bar && window.matchMedia('(max-width: 640px)').matches) bar.scrollTo({ left: bar.scrollWidth, behavior: 'smooth' });
  });
}

function rangeBaseParams() {
  const p = new URLSearchParams({ mode: state.currentMode === 'past' ? 'past' : 'future' });
  if (state.selectedLeague) p.set('league_id', state.selectedLeague);
  if (state.selectedTeam) p.set('team_id', state.selectedTeam);
  if (state.searchQuery) p.set('search', state.searchQuery);
  return p;
}

async function loadRangeFixtures(requestId) {
  const container = document.getElementById('matches-main-container');
  container.innerHTML = `
    <div style="text-align: center;padding: var(--vds-spacing-xl); color: var(--vne-text-muted);">
      <div class="live-dot-pulse" style="margin-bottom: var(--vds-spacing-2xs);"></div>
      <div>Đang tải dữ liệu...</div>
    </div>`;
  try {
    const base = rangeBaseParams();
    let matches = [];
    let live = [];
    if (state.rangeType === 'round') {
      const all = await fetchFixtures(base);
      const rounds = [...new Set(all.map(m => m.round_int).filter(Number.isFinite))].sort((a, b) => a - b);
      state.rounds = rounds;
      if (state.rangeRound == null || !rounds.includes(state.rangeRound)) {
        state.rangeRound = state.currentMode === 'past' ? rounds[rounds.length - 1] : rounds[0];
      }
      matches = all.filter(m => m.round_int === state.rangeRound);
      const dates = matches.map(m => (m.event_date || '').split('T')[0]).filter(Boolean).sort();
      state.rangeSub = dates.length ? (dates[0] === dates[dates.length - 1] ? fmtDM(dates[0]) : `${fmtDM(dates[0])} – ${fmtDM(dates[dates.length - 1])}`) : '';
    } else {
      const { from, to } = computeRange();
      const days = [];
      for (let d = from; d <= to; d = addDaysIso(d, 1)) days.push(d);
      const results = await Promise.all(days.map(d => {
        const p = new URLSearchParams(base);
        p.set('date', d);
        return fetchFixtures(p);
      }));
      matches = results.flat();
      if (state.currentMode === 'future' && days.includes(TODAY_DATE)) live = await loadLivePreview(base);
    }
    if (requestId !== fixturesRequestId) return;

    const seen = new Set();
    matches = matches.filter(m => { const k = m.fixture_id; if (k == null) return true; if (seen.has(k)) return false; seen.add(k); return true; });
    matches = applyFavFilter(matches);
    live = applyFavFilter(live);
    state.allFixtures = matches;
    state.liveMatches = live;
    generateDateTabs();
    renderRangeMatches(matches, live);
    checkLiveMatches();
  } catch (err) {
    if (requestId !== fixturesRequestId) return;
    console.error('Error fetching range fixtures:', err);
    container.innerHTML = `<div style="text-align: center;padding: var(--vds-spacing-lg);color: var(--vds-text-negative-regular);">Không thể tải dữ liệu lúc này. Vui lòng thử lại sau!</div>`;
  }
}

function renderRangeMatches(matches, live) {
  const container = document.getElementById('matches-main-container');
  container.replaceChildren();
  if (!matches.length && !live.length) {
    const empty = document.createElement('div');
    empty.className = 'vne-range-empty';
    empty.textContent = 'Không có trận đấu nào trong khoảng thời gian này.';
    container.append(empty);
    return;
  }
  const addSection = (title, list, isToday) => {
    const section = document.createElement('section');
    section.className = 'vne-range-day';
    const heading = document.createElement('div');
    heading.className = 'vne-day-heading';
    const [dayName, ...dateParts] = String(title).split(',');
    const nameEl = document.createElement('span'); nameEl.className = 'vne-day-name'; nameEl.textContent = dayName.trim();
    heading.append(nameEl);
    if (dateParts.length) { const dEl = document.createElement('span'); dEl.className = 'vne-day-date'; dEl.textContent = dateParts.join(',').trim(); heading.append(dEl); }
    if (isToday) heading.classList.add('is-today');
    if (isToday) {
      const tag = document.createElement('span');
      tag.className = 'vne-day-tag';
      tag.textContent = 'Hôm nay';
      heading.append(tag);
    }
    const listEl = document.createElement('div');
    const grouped = {};
    list.forEach(match => {
      const id = match.league_id;
      if (!grouped[id]) grouped[id] = { league: match.league_meta || match.league, round: match.round, matches: [] };
      grouped[id].matches.push(match);
    });
    if (state.viewMode === 'scs') renderSCSComboView(grouped, listEl);
    else renderTimelineView(grouped, listEl);
    if (listEl.querySelector('.vne-past-empty')) return; // ngày chưa có trận kết thúc: ẩn cả mục
    section.append(heading, listEl);
    container.append(section);
  };
  if (live.length) addSection('Đang diễn ra', live, false);
  const byDay = {};
  matches.forEach(m => { const d = (m.event_date || '').split('T')[0]; (byDay[d] = byDay[d] || []).push(m); });
  const days = Object.keys(byDay).sort();
  if (state.currentMode === 'past') days.reverse();
  days.forEach(d => addSection(`${VN_DAYS[dowOf(d)]}, ${fmtDM(d)}`, byDay[d], d === TODAY_DATE));
  if (!container.children.length) {
    const empty = document.createElement('div');
    empty.className = 'vne-range-empty';
    empty.textContent = 'Chưa có trận nào kết thúc trong khoảng thời gian này.';
    container.append(empty);
  }
  if (window.lucide) lucide.createIcons();
}

// ---------------- Lịch chọn ngày thông minh ----------------
state.cal = { open: false, month: '', days: null, key: '', cache: {} };

function calKey() {
  return [state.currentMode === 'past' ? 'past' : 'future', state.selectedLeague || '', state.selectedTeam || '', state.favMode ? state.favTeams.join(',') : ''].join('|');
}

async function loadCalDays() {
  const key = calKey();
  if (state.cal.cache[key]) return state.cal.cache[key];
  const mode = state.currentMode === 'past' ? 'past' : 'future';
  let urls;
  if (state.favMode && state.favTeams.length) urls = state.favTeams.map(id => new URLSearchParams({ mode, team_id: id }));
  else if (state.selectedLeague || state.selectedTeam) {
    const p = new URLSearchParams({ mode });
    if (state.selectedLeague) p.set('league_id', state.selectedLeague);
    if (state.selectedTeam) p.set('team_id', state.selectedTeam);
    urls = [p];
  } else {
    // Chưa lọc: API giới hạn 150 trận/lần gọi, nên tải theo từng giải để không thiếu ngày
    urls = (state.config?.leagues || []).map(l => new URLSearchParams({ mode, league_id: l.id }));
  }
  const lists = await Promise.all(urls.map(p => fetchFixtures(p).catch(() => [])));
  const set = new Set();
  lists.flat().forEach(m => { const d = (m.event_date || '').split('T')[0]; if (d) set.add(d); });
  state.cal.cache[key] = set;
  return set;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function toggleCalendar() {
  if (state.cal.open) closeCalendar(false); else openCalendar();
}

function openCalendar() {
  const pop = document.getElementById('cal-popover');
  const btn = document.getElementById('btn-calendar');
  if (!pop) return;
  const anchor = state.rangeType === 'week' || state.rangeType === 'weekend' ? computeRange().from : (state.selectedDate || TODAY_DATE);
  state.cal.open = true;
  state.cal.month = anchor.slice(0, 7);
  const key = calKey();
  state.cal.days = state.cal.cache[key] || null;
  state.cal.key = key;
  pop.hidden = false;
  btn?.setAttribute('aria-expanded', 'true');
  renderCalendar();
  focusCalDay(anchor);
  if (!state.cal.days) {
    loadCalDays().then(set => {
      if (!state.cal.open || state.cal.key !== calKey()) return;
      state.cal.days = set;
      const focused = document.activeElement?.dataset?.date;
      renderCalendar();
      if (focused) focusCalDay(focused);
    }).catch(err => console.error('Không tải được ngày có trận:', err));
  }
}

function closeCalendar(returnFocus = true) {
  const pop = document.getElementById('cal-popover');
  const btn = document.getElementById('btn-calendar');
  state.cal.open = false;
  if (pop) pop.hidden = true;
  btn?.setAttribute('aria-expanded', 'false');
  if (returnFocus) btn?.focus();
}

function focusCalDay(iso) {
  const el = document.querySelector(`#cal-popover [data-date="${iso}"]`);
  if (el) el.focus({ preventScroll: true });
}

function stepCalMonth(dir) {
  const cm = TODAY_DATE.slice(0, 7), past = state.currentMode === 'past';
  if ((!past && dir < 0 && state.cal.month <= cm) || (past && dir > 0 && state.cal.month >= cm)) return;
  const [y, m] = state.cal.month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + dir, 1));
  state.cal.month = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
  renderCalendar();
}

function nearestMatchDay() {
  const days = state.cal.days;
  if (!days || !days.size) return null;
  const list = [...days].sort();
  if (state.currentMode === 'past') return [...list].reverse().find(d => d <= TODAY_DATE) || null;
  return list.find(d => d >= TODAY_DATE) || null;
}

function renderCalendar() {
  const pop = document.getElementById('cal-popover');
  if (!pop) return;
  const [y, m] = state.cal.month.split('-').map(Number);
  const first = `${y}-${pad2(m)}-01`;
  const nextFirst = `${m === 12 ? y + 1 : y}-${pad2(m === 12 ? 1 : m + 1)}-01`;
  const lastDay = addDaysIso(nextFirst, -1);
  const days = state.cal.days;
  const hasData = !!(days && days.size);
  const range = state.rangeType === 'round' ? null : computeRange();
  const nearest = nearestMatchDay();
  const curM = TODAY_DATE.slice(0, 7);
  const isPast = state.currentMode === 'past';
  const prevOff = !isPast && state.cal.month <= curM;
  const nextOff = isPast && state.cal.month >= curM;

  let weeks = '';
  for (let monday = mondayOf(first); monday <= lastDay; monday = addDaysIso(monday, 7)) {
    let cells = '';
    for (let i = 0; i < 7; i++) {
      const d = addDaysIso(monday, i);
      const inMonth = d.slice(0, 7) === state.cal.month;
      const disabled = state.currentMode === 'past' ? d > TODAY_DATE : d < TODAY_DATE;
      const has = hasData && days.has(d);
      const selected = state.rangeType === 'day' && d === state.selectedDate;
      const inRange = range && state.rangeType !== 'day' && d >= range.from && d <= range.to;
      const cls = ['cal-day', inMonth ? '' : 'out', d === TODAY_DATE ? 'today' : '', has ? 'has-match' : '', hasData && !has ? 'no-match' : '', selected ? 'selected' : '', inRange ? 'in-range' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
      const label = `${VN_DAYS[dowOf(d)]}, ${fmtDM(d)}${has ? ', có trận' : hasData ? ', không có trận' : ''}`;
      cells += `<button type="button" class="${cls}" data-date="${d}" tabindex="${d === (state.selectedDate || TODAY_DATE) ? 0 : -1}" aria-label="${label}"${disabled ? ' disabled' : ''}${selected ? ' aria-pressed="true"' : ''} onclick="pickCalDay('${d}')"><span>${Number(d.slice(8))}</span></button>`;
    }
    weeks += `<div class="cal-row">${cells}</div>`;
  }

  pop.innerHTML = `
    <div class="cal-head">
      <button type="button" class="cal-nav" onclick="stepCalMonth(-1)" aria-label="Tháng trước"${prevOff ? ' disabled' : ''}>‹</button>
      <div class="cal-title" aria-live="polite">Tháng ${m}/${y}</div>
      <button type="button" class="cal-nav" onclick="stepCalMonth(1)" aria-label="Tháng sau"${nextOff ? ' disabled' : ''}>›</button>
    </div>
    <div class="cal-dow">${['T2','T3','T4','T5','T6','T7','CN'].map((n, i) => `<span class="${i > 4 ? 'we' : ''}">${n}</span>`).join('')}</div>
    <div class="cal-grid">${weeks}</div>
    <div class="cal-foot">
      <button type="button" class="cal-link" onclick="pickCalDay('${TODAY_DATE}')">Hôm nay</button>
      ${nearest ? `<button type="button" class="cal-link" onclick="pickCalDay('${nearest}')">Ngày có trận gần nhất · ${fmtDM(nearest)}</button>` : ''}
    </div>
    <div class="cal-hint"><span class="cal-dot"></span> Ngày có trận${state.selectedLeague || state.selectedTeam || state.favMode ? ' (theo bộ lọc đang chọn)' : ''}</div>
  `;
}

function pickCalDay(iso) {
  if (state.currentMode === 'past' ? iso > TODAY_DATE : iso < TODAY_DATE) return;
  closeCalendar(false);
  selectDate(iso);
}

function pickCalWeek(mondayIso) {
  closeCalendar(false);
  state.rangeType = 'week';
  state.rangeOffset = Math.round((new Date(`${mondayIso}T00:00:00Z`) - new Date(`${mondayOf(TODAY_DATE)}T00:00:00Z`)) / (7 * 86400000));
  state.rangeRound = null;
  generateDateTabs();
  loadFixtures();
}

document.addEventListener('click', (event) => {
  if (!state.cal.open) return;
  const inside = event.composedPath().some(n => n.classList && n.classList.contains('vne-cal-wrap'));
  if (!inside && event.target.isConnected) closeCalendar(false);
});
document.addEventListener('keydown', (event) => {
  if (!state.cal.open) return;
  if (event.key === 'Escape') { event.preventDefault(); closeCalendar(true); return; }
  const cur = document.activeElement?.dataset?.date;
  if (!cur || !document.activeElement.classList.contains('cal-day')) return;
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
  if (!step) return;
  event.preventDefault();
  const target = addDaysIso(cur, step);
  if (target.slice(0, 7) !== state.cal.month) { state.cal.month = target.slice(0, 7); renderCalendar(); }
  focusCalDay(target);
});

// Date Strip Tabs Generator (Không có tab "Tất cả", mặc định Hôm nay active)
function generateDateTabs() {
  generateDateTabsCore();
  if (window.innerWidth > 640) return;
  requestAnimationFrame(() => {
    const bar = document.querySelector('.vne-date-nav-bar');
    const active = bar && bar.querySelector('.vne-date-item-btn.active');
    if (!active) return;
    const target = active.offsetLeft - bar.clientWidth / 2 + active.offsetWidth / 2;
    bar.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  });
}

function generateDateTabsCore() {
  const container = document.getElementById('date-slider-container');
  const navBar = document.querySelector('.vne-date-nav-bar');
  if (state.currentMode !== 'live' && state.rangeType !== 'day') {
    navBar?.classList.add('is-range');
    renderRangeNavigator(container);
    renderRangePresets();
    return;
  }
  navBar?.classList.remove('is-range');
  const fullDayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  const baseDate = new Date(TODAY_DATE);
  const tabs = [];

  if (state.currentMode === 'future') {
    // Show today and next 7 days (Hôm nay, Ngày mai, Thứ bảy, Chủ nhật...)
    for (let i = 1; i < 8; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const day = d.getDate();
      const month = d.getMonth() + 1;
      let title = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : fullDayNames[d.getDay()];
      tabs.push({
        dateStr: iso,
        title: title,
        sub: `${day}/${month}`
      });
    }
  } else if (state.currentMode === 'past') {
    // Show today and past 7 days (Hôm nay, Hôm qua, Thứ năm, Thứ tư...)
    for (let i = 1; i < 8; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const day = d.getDate();
      const month = d.getMonth() + 1;
      let title = i === 0 ? 'Hôm nay' : i === 1 ? 'Hôm qua' : fullDayNames[d.getDay()];
      tabs.push({
        dateStr: iso,
        title: title,
        sub: `${day}/${month}`
      });
    }
  } else {
    // LIVE mode
    tabs.push({
      dateStr: TODAY_DATE,
      title: 'Hôm nay',
      sub: `${baseDate.getDate()}/${baseDate.getMonth() + 1}`
    });
  }

  // Khi đang lọc theo giải/đội: dải ngày gồm các ngày CÓ trận (gần nhất trước)
  const dayKey = currentMatchDaysKey();
  if (dayKey && state.matchDays && state.matchDaysKey === dayKey) {
    let list = Object.keys(state.matchDays).filter(d => d !== TODAY_DATE).sort();
    if (state.currentMode === 'past') list = list.reverse();
    list = list.slice(0, 8);
    if (state.selectedDate && state.selectedDate !== TODAY_DATE && !list.includes(state.selectedDate)) {
      list.push(state.selectedDate);
      list.sort();
      if (state.currentMode === 'past') list.reverse();
    }
    if (list.length) {
      tabs.length = 0;
      list.forEach(dateStr => {
        const lab = formatDayLabel(dateStr);
        tabs.push({ dateStr, title: lab.title, sub: lab.sub, count: state.matchDays[dateStr] || 0 });
      });
    }
  }

  container.innerHTML = tabs.map((tab, index) => {
    const isActive = state.selectedDate === tab.dateStr;
    const dow = dowOf(tab.dateStr);
    const weekend = dow === 0 || dow === 6;
    const newWeek = index > 0 && mondayOf(tab.dateStr) !== mondayOf(tabs[index - 1].dateStr);
    return `
      <button class="vne-date-item-btn ${isActive ? 'active' : ''}${weekend ? ' is-weekend' : ''}${newWeek ? ' week-start' : ''}" onclick="selectDate('${tab.dateStr}')">
        <span>${tab.title}</span>
        <span class="date-day-sub">${tab.sub}</span>
      </button>
    `;
  }).join('');
  renderRangePresets();
  requestAnimationFrame(updateDateNavigation);
}

function updateDateNavigation() {
  const slider = document.getElementById('date-slider-container');
  const previousButton = document.getElementById('btn-date-prev');
  if (!slider || !previousButton) return;
  previousButton.hidden = slider.scrollLeft <= 1;
  const nextButton = document.getElementById('btn-date-next');
  if (nextButton) nextButton.hidden = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 1;
}

function selectDate(dateStr) {
  state.rangeType = 'day';
  state.selectedDate = dateStr;
  generateDateTabs();
  scrollToScheduleTop();
  loadFixtures();
}

function onCustomDateSelect(dateVal) {
  if (dateVal) {
    selectDate(dateVal);
  }
}

function slideDates(direction) {
  const container = document.getElementById('date-slider-container');
  container.scrollBy({ left: direction * 140, behavior: 'smooth' });
}

// Mode Switcher (Lịch thi đấu / Kết quả / LIVE)
function switchMode(mode, updateUrl = true, evt = null) {
  if (evt) evt.preventDefault();
  state.currentMode = mode;
  state.selectedDate = TODAY_DATE; // Khi đổi tab Lịch thi đấu hoặc Kết quả, luôn active ngay 'Hôm nay'
  resetRange();

  updateModeUI(mode, updateUrl);
  generateDateTabs();
  loadFixtures();
}

// Update UI and URL according to current mode
function updateModeUI(mode, updateUrl = true) {
  const matchesContainer = document.getElementById('matches-main-container');
  if (matchesContainer) {
    matchesContainer.classList.remove('hide-broadcast-channels');
  }

  // Update tabs active state
  document.querySelectorAll('.vne-tab-btn').forEach(b => b.classList.remove('active'));
  const activeTabBtn = document.getElementById(`tab-${mode}`);
  if (activeTabBtn) activeTabBtn.classList.add('active');

  // Tab trên tiêu đề: tab đang chọn đậm, tab còn lại màu nhạt
  document.querySelectorAll('.vne-title-tab').forEach(t => {
    const on = t.dataset.titleMode === mode;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });

  // Update document title
  if (mode === 'past') {
    document.title = 'Kết quả bóng đá hôm nay - VnExpress Thể Thao';
  } else if (mode === 'live') {
    document.title = 'Trực tiếp bóng đá hôm nay (LIVE) - VnExpress Thể Thao';
  } else {
    document.title = 'Lịch thi đấu bóng đá hôm nay - VnExpress Thể Thao';
  }

  // Update browser URL using HTML5 History API without reloading
  if (updateUrl) {
    const targetUrl = mode === 'past' ? '/ket-qua' : mode === 'live' ? '/live' : '/lich-thi-dau';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ mode }, '', targetUrl);
    }
  }
}

// Support browser Back/Forward navigation between modes
window.addEventListener('popstate', (e) => {
  const newMode = detectInitialMode();
  if (newMode !== state.currentMode) {
    switchMode(newMode, false);
  }
});

// View Mode Switcher (Timeline vs SCS Combo Card)
function switchViewMode(view) {
  state.viewMode = view;
  const btnTimeline = document.getElementById('btn-view-timeline');
  if (btnTimeline) btnTimeline.classList.toggle('active', view === 'timeline');
  const btnScs = document.getElementById('btn-view-scs');
  if (btnScs) btnScs.classList.toggle('active', view === 'scs');
  renderMatches();
}

// Load Fixtures and Results from API
function isLiveMatch(match) {
  return ['1H', '2H', 'HT', 'LIVE', 'ET', 'P'].includes(match.status_short);
}

async function fetchFixtures(params) {
  // API mode=future chỉ giữ trận có giờ đá > hiện tại. Với HÔM NAY: lấy theo trạng thái
  // (NS/TBD = chưa đá) để trận chưa có kết quả vẫn hiện dù đã quá giờ dự kiến.
  let todayNs = false;
  if (params.get('mode') === 'future' && params.get('date') === TODAY_DATE) {
    params = new URLSearchParams(params);
    params.set('mode', 'all');
    todayNs = true;
  }
  const response = await fetch(`/api/fixtures?${params}`);
  if (!response.ok) throw new Error('Không thể tải lịch thi đấu');
  const data = await response.json();
  let list = data.matches || [];
  if (todayNs) list = list.filter(m => ['NS', 'Not Started', 'TBD', 'PST'].includes(m.status_short || m.status));
  return list;
}

async function loadLivePreview(params) {
  try {
    const liveParams = new URLSearchParams(params);
    liveParams.set('mode', 'live');
    return await fetchFixtures(liveParams);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
}

async function loadFixtures() {
  const requestId = ++fixturesRequestId;
  if (state.rangeType === 'round' && !state.selectedLeague) resetRange();
  if (state.rangeType !== 'day' && state.currentMode !== 'live') return loadRangeFixtures(requestId);
  await ensureMatchDays();
  if (requestId !== fixturesRequestId) return;
  const container = document.getElementById('matches-main-container');
  container.innerHTML = `
    <div style="text-align: center;padding: var(--vds-spacing-xl); color: var(--vne-text-muted);">
      <div class="live-dot-pulse" style="margin-bottom: var(--vds-spacing-2xs);"></div>
      <div>Đang tải dữ liệu...</div>
    </div>
  `;

  try {
    const params = new URLSearchParams({ mode: state.currentMode === 'live' ? 'all' : state.currentMode });
    const selectedDate = state.currentMode === 'live' ? TODAY_DATE : state.selectedDate;
    if (selectedDate) params.set('date', selectedDate);
    if (state.selectedLeague) params.set('league_id', state.selectedLeague);
    if (state.selectedTeam) params.set('team_id', state.selectedTeam);
    if (state.searchQuery) params.set('search', state.searchQuery);

    const showLivePreview = state.currentMode === 'live' ||
      (state.currentMode === 'future' && selectedDate === TODAY_DATE);
    const [fixtures, liveMatches] = await Promise.all([
      fetchFixtures(params),
      showLivePreview ? loadLivePreview(params) : Promise.resolve([])
    ]);
    if (requestId !== fixturesRequestId) return;
    state.allFixtures = applyFavFilter(fixtures);
    state.liveMatches = applyFavFilter(liveMatches);

    renderMatches();
    checkLiveMatches();
  } catch (err) {
    if (requestId !== fixturesRequestId) return;
    console.error('Error fetching fixtures:', err);
    container.innerHTML = `
      <div style="text-align: center;padding: var(--vds-spacing-lg);color: var(--vds-text-negative-regular);">
        Không thể tải dữ liệu lịch thi đấu lúc này. Vui lòng thử lại sau!
      </div>
    `;
  }
}

// Check real live matches count for header badge
async function checkLiveMatches() {
  try {
    const res = await fetch('/api/fixtures?mode=live');
    const data = await res.json();
    const count = data.totalMatches || 0;
    document.getElementById('live-count-badge').innerText = count;
  } catch (e) {
    document.getElementById('live-count-badge').innerText = state.liveMatches.length;
  }
}

// Render Matches View
// Trống → nhảy tới ngày gần nhất còn trận chưa diễn ra
async function nextMatchDayInfo() {
  // Giữ nguyên bộ lọc hiện tại (giải / đội / tìm kiếm) để chỉ nhảy tới ngày THỰC SỰ có trận
  const p = rangeBaseParams();
  p.set('mode', 'future');
  const list = await fetchFixtures(p);
  const first = list.map(m => (m.event_date || '').split('T')[0]).filter(Boolean).sort()[0];
  if (!first) return null;
  return { date: first, count: list.filter(m => (m.event_date || '').startsWith(first)).length };
}
async function labelNextMatchDay() {
  const btn = document.getElementById('btn-next-match-day');
  if (!btn) return;
  try {
    const info = await nextMatchDayInfo();
    if (info) btn.textContent = `Xem lịch ${fmtDM(info.date)} (${info.count}${info.count >= 150 ? '+' : ''} trận)`;
  } catch (e) { /* giữ nhãn mặc định */ }
}
async function goNextMatchDay() {
  try {
    const info = await nextMatchDayInfo();
    if (info) { selectDate(info.date); return; }
  } catch (e) { /* rơi xuống mặc định */ }
  clearFilters(); switchMode('future');
}

function renderMatches() {
  const container = document.getElementById('matches-main-container');
  if (state.rangeType !== 'day' && state.currentMode !== 'live') {
    renderRangeMatches(state.allFixtures, state.liveMatches);
    return;
  }
  const nowTs = Date.now() / 1000;
  const matches = state.currentMode === 'future' && (state.selectedDate || TODAY_DATE) === TODAY_DATE
    ? state.allFixtures.filter(match => ['NS', 'Not Started', 'TBD', 'PST'].includes(match.status_short || match.status))
    : state.currentMode === 'future'
    ? state.allFixtures.filter(match =>
      ['NS', 'Not Started', 'TBD'].includes(match.status_short || match.status) &&
      match.status !== 'Match Finished' &&
      (match.event_timestamp || Date.parse(match.event_date) / 1000) > nowTs
    )
    : state.currentMode === 'live'
      ? state.allFixtures.filter(match => !isLiveMatch(match)).sort((first, second) =>
        (first.event_timestamp || Date.parse(first.event_date) / 1000) -
        (second.event_timestamp || Date.parse(second.event_date) / 1000)
      )
      : state.allFixtures;
  const totalMatches = matches.length + state.liveMatches.length;

  // Summary title (if element exists)
  const summaryEl = document.getElementById('matches-summary-text');
  if (summaryEl) {
    let modeName = state.currentMode === 'future' ? 'Lịch thi đấu' : state.currentMode === 'past' ? 'Kết quả' : 'Trận đấu trực tiếp';
    const dateFormatted = formatTemplateDateOnly(state.selectedDate || TODAY_DATE);
    summaryEl.innerText = `${modeName} - ${dateFormatted} (${totalMatches} trận)`;
  }

  if (totalMatches === 0) {
    const todayEmpty = state.currentMode === 'future' && (state.selectedDate || TODAY_DATE) === TODAY_DATE && !state.selectedLeague && !state.selectedTeam && !state.favMode && !state.searchQuery;
    const emptyMsg = todayEmpty ? 'Hôm nay không còn trận nào đang diễn ra hoặc sắp diễn ra.' : 'Không tìm thấy trận đấu nào phù hợp với điều kiện lọc.';
    if (state.currentMode === 'future') setTimeout(labelNextMatchDay, 0);
    container.innerHTML = `
      <div style="background: var(--vds-surface-000); border: 1px solid var(--vne-border);border-radius: var(--vds-radii-lg);padding: var(--vds-spacing-lg) var(--vds-spacing-sm); text-align: center; color: var(--vne-text-muted);">
        <i data-lucide="info" style="width: 32px; height: 32px;margin-bottom: var(--vds-spacing-2xs); color: var(--vne-text-subtle);"></i>
        <div style="font-size: var(--vds-typography-font-size-300); font-weight: 600; color: var(--vne-text-secondary);margin-bottom: var(--vds-spacing-3xs);">Không có dữ liệu trận đấu</div>
        <div style="font-size: var(--vds-typography-font-size-100); max-width: 440px;margin: 0 auto var(--vds-spacing-sm);">${emptyMsg}</div>
        <button id="btn-next-match-day" onclick="goNextMatchDay()" style="background: var(--vne-red);color: var(--vds-text-on-color-regular); border: none;padding: var(--vds-spacing-3xs) var(--vds-spacing-xs);border-radius: var(--vds-radii-xl);font-size: var(--vds-typography-font-size-100); font-weight: 600; cursor: pointer;">
          Xem lịch thi đấu sắp tới
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const sections = [state.liveMatches, matches].filter(sectionMatches => sectionMatches.length);
  container.replaceChildren();
  sections.forEach(sectionMatches => {
    const grouped = {};
    sectionMatches.forEach(match => {
      const leagueId = match.league_id;
      if (!grouped[leagueId]) grouped[leagueId] = {
        league: match.league_meta || match.league,
        round: match.round,
        matches: []
      };
      grouped[leagueId].matches.push(match);
    });
    const section = document.createElement('section');
    section.className = 'vne-match-section';
    const matchList = document.createElement('div');
    if (state.viewMode === 'scs') renderSCSComboView(grouped, matchList);
    else renderTimelineView(grouped, matchList);
    section.append(matchList);
    container.append(section);
  });

  if (window.lucide) lucide.createIcons();
}

// Trạng thái trận: chưa đá / đang đá / đã kết thúc / hoãn-hủy
function matchState(m) {
  const sh = m.status_short, st = m.status;
  const el = m.elapsed ? `${m.elapsed}'` : '';
  let pen = '';
  if (m.score && m.score.penalty) pen = String(m.score.penalty).replace('-', '–');
  else if (m.penalty_home != null && m.penalty_away != null) pen = `${m.penalty_home}–${m.penalty_away}`;
  if (['1H', '2H', 'LIVE'].includes(sh)) return { kind: 'live', label: el || 'Đang đá' };
  if (sh === 'HT') return { kind: 'live', label: 'Nghỉ giữa hiệp' };
  if (sh === 'ET') return { kind: 'live', label: `Hiệp phụ ${el}`.trim() };
  if (sh === 'BT') return { kind: 'live', label: 'Nghỉ trước hiệp phụ' };
  if (sh === 'P') return { kind: 'live', label: 'Đá luân lưu' };
  if (sh === 'INT') return { kind: 'live', label: 'Tạm ngưng' };
  if (sh === 'AET') return { kind: 'finished', label: 'Sau hiệp phụ' };
  if (sh === 'PEN') return { kind: 'finished', label: 'Luân lưu', sub: pen };
  if (['FT', 'AWD', 'WO'].includes(sh) || st === 'Match Finished') return { kind: 'finished', label: sh === 'AWD' ? 'Xử thắng/thua' : sh === 'WO' ? 'Bỏ cuộc' : 'KT' };
  if (sh === 'PST') return { kind: 'off', label: 'Hoãn' };
  if (sh === 'CANC') return { kind: 'off', label: 'Hủy' };
  if (sh === 'SUSP') return { kind: 'off', label: 'Tạm hoãn' };
  if (sh === 'ABD') return { kind: 'off', label: 'Bỏ dở' };
  if (sh === 'TBD') return { kind: 'upcoming', label: 'Chưa rõ giờ', tbd: true };
  return { kind: 'upcoming', label: '' };
}

// Kênh phát sóng: ánh xạ tên kênh -> file logo trong /img/channels/<slug>.svg (hoặc .png)
// Chưa có file logo thì tự hiện tên kênh dạng chữ.
function channelInfo(name) {
  const n = String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const num = (n.match(/(\d+)\s*$/) || [])[1] || '';
  if (n.startsWith('fpt')) return { slug: 'fpt-play' };
  if (n.startsWith('tv360') || n.startsWith('tv 360')) return { slug: 'tv360' };
  if (n.startsWith('vtvcab')) return { slug: '' };
  if (n.startsWith('vtv')) return { slug: 'vtv', suffix: num };
  if (n.startsWith('htv')) return { slug: 'htv' };
  return { slug: '' };
}

function channelBadgeHtml(name) {
  const info = channelInfo(name);
  const esc = String(name).replace(/"/g, '&quot;');
  // Kênh chưa có logo: dùng thử logo VTV, chuyển xám + thu nhỏ (tên kênh vẫn ở alt/title)
  if (!info.slug) return `<span class="vne-ch-logo-wrap is-placeholder" data-slug="placeholder"><img class="vne-ch-logo" src="/img/channels/vtv.png" alt="${esc}" title="${esc}"></span>`;
  // Thử .svg, lỗi thì thử .png, lỗi tiếp thì hiện chữ
  return `<span class="vne-ch-logo-wrap" data-slug="${info.slug}"><img class="vne-ch-logo" src="/img/channels/${info.slug}.png" alt="${esc}" title="${esc}" onerror="channelLogoFallback(this, '${info.slug}', '${esc}')">${info.suffix ? `<span class="vne-ch-suffix">${info.suffix}</span>` : ''}</span>`;
}

function channelLogoFallback(img, slug, name) {
  const span = document.createElement('span');
  span.className = 'vne-ch-text';
  span.textContent = name;
  img.closest('.vne-ch-logo-wrap')?.replaceWith(span);
}

// Mode 1: Timeline View (demo-final.jpeg)
// Danh sách trận dài: hiện 5 trận đầu (và mọi trận đang diễn ra), phần còn lại gập sau nút "Xem thêm N trận".
const GROUP_ROWS_LIMIT = 5, GROUP_ROWS_SHOWN = 5;
const expandedGroups = new Set();
function renderGroupRows(rows, group, groupCount) {
  if (rows.length <= GROUP_ROWS_LIMIT) return rows.join('');
  const key = `${group.league.id}|${String(group.matches[0]?.event_date || '').slice(0, 10)}`;
  const open = expandedGroups.has(key);
  const shown = [], hidden = [];
  rows.forEach((r, i) => {
    const live = matchState(group.matches[i]).kind === 'live';
    (i < GROUP_ROWS_SHOWN || live ? shown : hidden).push(r);
  });
  if (!hidden.length) return rows.join('');
  return `${shown.join('')}
    <div class="vne-group-more-rows" ${open ? '' : 'hidden'}>${hidden.join('')}</div>
    <button type="button" class="vne-group-more-btn" data-key="${key}" data-count="${hidden.length}" aria-expanded="${open}" onclick="toggleGroupRows(this)">
      <span>${open ? 'Thu gọn' : `Xem thêm ${hidden.length} trận`}</span>
      <vds-icon name="Chevron__${open ? 'Up' : 'Down'}__Regular__16" size="16"></vds-icon>
    </button>`;
}
function toggleGroupRows(btn) {
  const key = btn.dataset.key, rows = btn.previousElementSibling;
  const open = rows.hasAttribute('hidden');
  if (open) { rows.removeAttribute('hidden'); expandedGroups.add(key); } else { rows.setAttribute('hidden', ''); expandedGroups.delete(key); }
  btn.setAttribute('aria-expanded', open);
  btn.innerHTML = `<span>${open ? 'Thu gọn' : `Xem thêm ${btn.dataset.count} trận`}</span><vds-icon name="Chevron__${open ? 'Up' : 'Down'}__Regular__16" size="16"></vds-icon>`;
}

function renderTimelineView(grouped, container = document.getElementById('matches-main-container')) {
  // Tab Kết quả: chỉ hiện các trận đã diễn ra (đã kết thúc)
  if (state.currentMode === 'past') {
    const only = {};
    Object.entries(grouped).forEach(([k, g]) => {
      const ms = g.matches.filter(m => matchState(m).kind === 'finished');
      if (ms.length) only[k] = { ...g, matches: ms };
    });
    grouped = only;
    if (!Object.keys(grouped).length) {
      container.innerHTML = '<div class="vne-past-empty" style="text-align:center;padding: var(--vds-spacing-xl);color: var(--vne-text-muted,var(--vds-text-subdued))">Chưa có trận nào kết thúc trong ngày này.</div>';
      return;
    }
  }

  const html = Object.values(grouped).map(group => {
    const league = group.league;
    const roundText = group.round ? group.round.replace('Regular Season - ', 'Vòng ') : '';

    const matchRows = group.matches.map(m => {
      const ms = matchState(m);
      const isLive = ms.kind === 'live';
      const isFinished = ms.kind === 'finished';
      const isOff = ms.kind === 'off';
      const broadcastChannel = m.broadcast || getMatchBroadcast(m, league.id);

      const SHOW_CHANNELS = false; // tab Lịch thi đấu: không hiển thị kênh phát sóng
      const channelPillHtml = (!SHOW_CHANNELS || !channelInfo(broadcastChannel).slug) ? '' : `
        <div class="vne-match-channel-pill" title="Kênh phát sóng trực tiếp: ${broadcastChannel}">
          <svg class="vne-tv-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="15" x="2" y="7" rx="2" ry="2"/>
            <polyline points="17 2 12 7 7 2"/>
          </svg>
          ${channelBadgeHtml(broadcastChannel)}
        </div>
      `;

      // Cột trạng thái (bên phải trên mobile)
      let timeStatusHtml = '';
      if (isLive) {
        timeStatusHtml = `
          <div class="vne-match-status-label live">
            <span class="live-dot-pulse"></span>
            <span>${ms.label}${/^\d+'$/.test(ms.label) ? ' LIVE' : ''}</span>
          </div>
          ${channelPillHtml}
        `;
      } else if (isFinished) {
        timeStatusHtml = `
          <span class="vne-match-status-label">${ms.label}</span>
          ${ms.sub ? `<span class="vne-match-status-sub">${ms.sub}</span>` : ''}
        `;
      } else if (isOff) {
        timeStatusHtml = `<span class="vne-match-status-label off">${ms.label}</span>`;
      } else {
        timeStatusHtml = state.currentMode === 'past' ? '' : `
          ${ms.tbd ? '<span class="vne-match-status-sub">Chưa rõ giờ</span>' : ''}
          ${channelPillHtml}
        `;
      }

      // Tỉ số / giờ đá (cột giữa)
      const gh = m.goals_home_team ?? 0, ga = m.goals_away_team ?? 0;
      let scoreHtml = '';
      if (isLive || isFinished) {
        const hLead = gh > ga ? ' is-lead' : gh < ga ? ' is-trail' : '';
        const aLead = ga > gh ? ' is-lead' : ga < gh ? ' is-trail' : '';
        scoreHtml = `<div class="vne-score-box${isLive ? ' live' : ''}"><span class="vne-score-num${hLead}">${gh}</span><span class="vne-score-dash">–</span><span class="vne-score-num${aLead}">${ga}</span></div>`;
      } else if (isOff) {
        const t = formatMatchItemTime(m.event_date).split(', ')[1] || '--:--';
        scoreHtml = `<div class="vne-score-box upcoming off" title="Giờ dự kiến (GMT+7)"><time datetime="${m.event_date}">${t}</time></div>`;
      } else {
        const kickoffTime = ms.tbd ? '--:--' : (formatMatchItemTime(m.event_date).split(', ')[1] || '--:--');
        scoreHtml = `<div class="vne-score-box upcoming" title="Giờ bắt đầu (GMT+7)"><time datetime="${m.event_date}">${kickoffTime}</time></div>`;
      }

      // Đội thắng / thua (chỉ khi đã kết thúc)
      let homeCls = '', awayCls = '';
      if (isLive && gh !== ga) {
        if (gh > ga) { homeCls = ' is-win'; awayCls = ' is-lose'; } else { homeCls = ' is-lose'; awayCls = ' is-win'; }
      }
      if (isFinished) {
        let hw = gh > ga, aw = ga > gh;
        if (!hw && !aw && m.score && m.score.penalty) {
          const [ph, pa] = String(m.score.penalty).split('-').map(x => parseInt(x, 10));
          if (ph > pa) hw = true; else if (pa > ph) aw = true;
        }
        if (hw) { homeCls = ' is-win'; awayCls = ' is-lose'; }
        else if (aw) { homeCls = ' is-lose'; awayCls = ' is-win'; }
      }

      const actionHtml = isFinished ? `
        <button class="vne-btn-highlight vne-match-detail-arrow" aria-label="Xem chi tiết trận đấu" onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}', event)">
          <i data-lucide="chevron-right"></i>
        </button>
      ` : `
        <button class="vne-btn-highlight vne-match-detail-arrow" aria-label="Xem chi tiết trận đấu" onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}', event)">
          <i data-lucide="chevron-right"></i>
        </button>
      `;

      return `
        <div class="vne-match-row" style="cursor: pointer;" data-status="${isLive ? 'live' : isFinished ? 'finished' : isOff ? 'off' : 'upcoming'}"${timeStatusHtml.trim() ? '' : ' data-nostatus="1"'} onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}')">
          <div class="vne-match-time-status">
            ${timeStatusHtml}
          </div>
          <div class="vne-match-teams-score">
            <div class="vne-team-side home${homeCls}">
              <span class="vne-team-name" title="${m.home_team.team_name}">${m.home_team.team_name}</span>
              <img src="${m.home_team.logo}" class="vne-team-logo" alt="${m.home_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
            </div>
            ${scoreHtml}
            <div class="vne-team-side away${awayCls}">
              <img src="${m.away_team.logo}" class="vne-team-logo" alt="${m.away_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
              <span class="vne-team-name" title="${m.away_team.team_name}">${m.away_team.team_name}</span>
            </div>
          </div>
          <div class="vne-match-action-col">
            ${actionHtml}
          </div>
        </div>
      `;
    });

    const leagueObj = state.config?.leagues?.find(x => x.id === league.id);
    const leagueSlug = league.slug || leagueObj?.slug || 'ngoai-hang-anh';

    return `
      <div class="vne-league-group">
        <div class="vne-league-group-header">
          <div class="vne-league-info-left" style="cursor: pointer;" onclick="window.location.href='/giai-dau/${leagueSlug}'">
            <img src="${league.logo}" class="vne-league-logo" alt="${league.name}" onerror="this.src='https://is.vnecdn.net/objects/leagues/39.png?v=1'">
            <span class="vne-league-name">${league.vnName || league.name}</span>
            ${roundText ? `<span class="vne-round-tag">${roundText}</span>` : ''}
          </div>
          <a class="vne-view-detail-link" href="/giai-dau/${leagueSlug}">
            <span>Xem chi tiết</span>
            <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </a>
        </div>
        <div>
          ${renderGroupRows(matchRows, group, Object.keys(grouped).length)}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// Mode 2: SCS Combo View (scs.jpeg) - Lịch đấu, Kết quả, Bảng điểm
function renderSCSComboView(grouped, container = document.getElementById('matches-main-container')) {

  const html = Object.values(grouped).map(group => {
    const league = group.league;
    const matches = group.matches;

    // Split matches into upcoming vs finished
    const upcoming = matches.filter(m => !['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short)).slice(0, 5);
    const finished = matches.filter(m => ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short)).slice(0, 5);
    const standings = state.standingsMap[league.id] || [];
    const roundText = group.round ? group.round.replace('Regular Season - ', 'Vòng ') : 'Vòng đấu';

    const leagueObj = state.config?.leagues?.find(x => x.id === league.id);
    const leagueSlug = league.slug || leagueObj?.slug || 'ngoai-hang-anh';

    return `
      <div class="vne-league-group">
        <div class="vne-league-group-header" style="background-color: var(--vds-surface-000);border-bottom: 2px solid var(--vds-component-divider-fill-regular); border-left: 5px solid var(--vne-dark-header);">
          <div class="vne-league-info-left" style="cursor: pointer;" onclick="window.location.href='/giai-dau/${leagueSlug}'">
            <img src="${league.logo}" class="vne-league-logo" alt="${league.name}" onerror="this.src='https://is.vnecdn.net/objects/leagues/39.png?v=1'">
            <span class="vne-league-name" style="font-size: var(--vds-typography-font-size-300); font-weight: 700;">${league.vnName || league.name}</span>
          </div>
          <a class="vne-view-detail-link" style="color: var(--vne-dark-header); font-weight: 700;" href="/giai-dau/${leagueSlug}">
            <span>Chi tiết giải đấu &gt;</span>
          </a>
        </div>

        <div class="vne-scs-combo-container">
          <!-- Box 1: Lịch đấu (scs.jpeg) -->
          <div class="vne-scs-box">
            <div class="vne-scs-box-header">
              <span>Lịch đấu</span>
              <span class="vne-scs-date-pill">
                <span>&lt;</span>
                <span>${formatTemplateDateOnly(state.selectedDate || TODAY_DATE)}</span>
                <span>&gt;</span>
              </span>
            </div>
            <div class="vne-scs-box-body">
              <div style="font-size: var(--vds-typography-font-size-050); font-weight: 700;color: var(--vds-text-subdued); text-align: center;padding: var(--vds-spacing-4xs) 0;border-bottom: 1px solid var(--vds-component-divider-fill-subdued);">${roundText}</div>
              ${upcoming.length === 0 ? '<div style="color: var(--vds-text-subdued-lighter);font-size: var(--vds-typography-font-size-100); text-align: center;padding: var(--vds-spacing-md) 0;">Không có trận sắp tới</div>' : 
                upcoming.map(m => `
                  <div class="vne-scs-match-item" style="cursor: pointer;" onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}')" title="${formatTemplateDateTime(m.event_date)}">
                    <span style="font-weight: 600;font-size: var(--vds-typography-font-size-100); flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.home_team.team_name}</span>
                    <span style="padding: 1px var(--vds-spacing-3xs);background: var(--vds-surface-100);border-radius: var(--vds-radii-md); font-weight: 800;font-size: var(--vds-typography-font-size-100);margin: 0 var(--vds-spacing-3xs);color: var(--vds-text-regular);">${formatMatchItemTime(m.event_date)}</span>
                    <span style="font-weight: 600;font-size: var(--vds-typography-font-size-100); flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.away_team.team_name}</span>
                  </div>
                `).join('')
              }
              <button class="vne-scs-pill-btn" onclick="filterLeague(${league.id}); switchMode('future');">Xem tất cả &gt;</button>
            </div>
          </div>

          <!-- Box 2: Kết quả (scs.jpeg) -->
          <div class="vne-scs-box">
            <div class="vne-scs-box-header">
              <span>Kết quả</span>
              <span class="vne-scs-date-pill">
                <span>&lt;</span>
                <span>${formatTemplateDateOnly(state.selectedDate || TODAY_DATE)}</span>
                <span>&gt;</span>
              </span>
            </div>
            <div class="vne-scs-box-body">
              <div style="font-size: var(--vds-typography-font-size-050); font-weight: 700;color: var(--vds-text-subdued); text-align: center;padding: var(--vds-spacing-4xs) 0;border-bottom: 1px solid var(--vds-component-divider-fill-subdued);">${roundText}</div>
              ${finished.length === 0 ? '<div style="color: var(--vds-text-subdued-lighter);font-size: var(--vds-typography-font-size-100); text-align: center;padding: var(--vds-spacing-md) 0;">Chưa có kết quả mới</div>' : 
                finished.map(m => `
                  <div class="vne-scs-match-item" style="cursor: pointer;" onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}')" title="${formatTemplateDateTime(m.event_date)}">
                    <span style="font-weight: 600;font-size: var(--vds-typography-font-size-100); flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.home_team.team_name}</span>
                    <span style="padding: 1px var(--vds-spacing-3xs);background: var(--vds-surface-200);border-radius: var(--vds-radii-md); font-weight: 800;font-size: var(--vds-typography-font-size-100);margin: 0 var(--vds-spacing-3xs);color: var(--vds-text-regular);">${m.goals_home_team}-${m.goals_away_team}</span>
                    <span style="font-weight: 600;font-size: var(--vds-typography-font-size-100); flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.away_team.team_name}</span>
                  </div>
                `).join('')
              }
              <button class="vne-scs-pill-btn" onclick="filterLeague(${league.id}); switchMode('past');">Xem tất cả &gt;</button>
            </div>
          </div>

          <!-- Box 3: Bảng điểm (scs.jpeg) -->
          <div class="vne-scs-box">
            <div class="vne-scs-box-header">
              <span>Bảng điểm</span>
              <span class="vne-scs-date-pill">Top 5</span>
            </div>
            <div class="vne-scs-box-body" style="padding: var(--vds-spacing-3xs);">
              ${standings.length === 0 ? '<div style="color: var(--vds-text-subdued-lighter);font-size: var(--vds-typography-font-size-100); text-align: center;padding: var(--vds-spacing-md) 0;">Đang cập nhật bảng xếp hạng</div>' : `
                <table class="vne-table-mini">
                  <thead>
                    <tr>
                      <th style="width: 14px;">#</th>
                      <th>CLB</th>
                      <th style="width: 20px;">Tr</th>
                      <th style="width: 24px;">HS</th>
                      <th style="width: 24px;">Đ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${standings.slice(0, 5).map(s => `
                      <tr>
                        <td class="vne-rank-num ${s.rank <= 3 ? 'top-rank' : ''}">${s.rank}</td>
                        <td>
                          <div class="vne-standings-clb-col">
                            <img src="${s.logo}" class="vne-standings-logo" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
                            <a href="/doi-bong/${toTeamSlug(s.team_name, s.team_id)}" class="vne-standings-name" style="color:inherit; text-decoration:none;" title="Xem chi tiết ${s.team_name}">${s.team_name}</a>
                          </div>
                        </td>
                        <td>${s.all?.matchs_played ?? s.all?.played ?? '-'}</td>
                        <td>${s.goals_diff >= 0 ? '+' + s.goals_diff : s.goals_diff}</td>
                        <td class="vne-standings-pts">${s.points}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
              <a class="vne-scs-pill-btn" href="/giai-dau/${leagueSlug}/bang-xep-hang" style="text-decoration:none; display:inline-block; text-align:center;">Chi tiết &gt;</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

async function loadStandings() {
  try {
    const res = await fetch('/api/standings');
    const json = await res.json();
    state.standingsMap = json.standings || {};
  } catch (err) {
    console.error('Error loading standings:', err);
  }
}

// Load Football News Feed
async function loadNews(page = 1) {
  state.newsPage = page;
  const container = document.getElementById('news-list-container');
  container.innerHTML = `
    <div style="text-align: center;padding: var(--vds-spacing-sm); color: var(--vne-text-muted);">
      Đang tải tin tức thể thao...
    </div>
  `;

  try {
    const res = await fetch(`/api/news?page=${page}&limit=${state.newsLimit}`);
    const data = await res.json();
    const items = data.items || [];

    document.getElementById('news-page-info').innerText = `Trang ${data.page} / ${data.totalPages} (${data.total} tin bài)`;
    const startRange = (data.page - 1) * data.limit + 1;
    const endRange = Math.min(data.page * data.limit, data.total);
    document.getElementById('news-display-range').innerText = `Hiển thị ${startRange} - ${endRange} trên ${data.total} bài viết`;

    container.innerHTML = items.map(news => `
      <a href="${getArticleUrl(news.link)}" class="vne-news-card">
        <div class="vne-news-thumb-col">
          <img src="${news.thumbnail}" class="vne-news-thumb" alt="${escapeHtml(news.title)}" loading="lazy" onerror="this.src='https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png'">
        </div>
        <div class="vne-news-text-col">
          <div>
            <h3 class="vne-news-heading">${news.title}</h3>
            <p class="vne-news-lead">${news.description}</p>
          </div>
          <div class="vne-news-meta">
            <span>${news.timeAgo}</span>
            <span>•</span>
            <span class="vne-news-category-pill">${news.category}</span>
          </div>
        </div>
      </a>
    `).join('');

    // Pagination buttons
    renderNewsPagination(data.page, data.totalPages);
  } catch (err) {
    console.error('Error fetching news:', err);
    container.innerHTML = `<div style="padding: var(--vds-spacing-sm); text-align: center;color: var(--vds-text-subdued-lighter);">Không thể tải tin tức bóng đá lúc này.</div>`;
  }
}

function renderNewsPagination(currentPage, totalPages) {
  const container = document.getElementById('news-pagination-controls');
  let buttons = '';

  if (currentPage > 1) {
    buttons += `<button class="vne-page-btn" onclick="loadNews(${currentPage - 1})">&lt; Trước</button>`;
  }

  for (let p = 1; p <= totalPages; p++) {
    buttons += `
      <button class="vne-page-btn ${p === currentPage ? 'active' : ''}" onclick="loadNews(${p})">
        ${p}
      </button>
    `;
  }

  if (currentPage < totalPages) {
    buttons += `<button class="vne-page-btn" onclick="loadNews(${currentPage + 1})">Sau &gt;</button>`;
  }

  container.innerHTML = buttons;
}

// Open Full League Standings
function openLeagueStandingsModal(leagueId) {
  const leagues = state.config?.leagues || [];
  const league = leagues.find(l => l.id === leagueId);
  const slug = league?.slug || 'ngoai-hang-anh';
  window.location.href = `/giai-dau/${slug}/bang-xep-hang`;
}

// Open Highlight Video Simulator Modal
function openHighlightModal(fixtureId, homeTeam, awayTeam, score, leagueName, eventDate) {
  const modal = document.getElementById('modal-highlight');
  document.getElementById('modal-highlight-title').innerText = `HIGHLIGHT: ${homeTeam.toUpperCase()} ${score} ${awayTeam.toUpperCase()}`;
  document.getElementById('highlight-match-banner').innerText = `${homeTeam} ${score} ${awayTeam}`;
  const formattedTime = formatTemplateDateTime(eventDate);
  document.getElementById('highlight-meta-info').innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--vne-border-light);padding-bottom: var(--vds-spacing-2xs);margin-bottom: var(--vds-spacing-2xs);">
      <span style="font-weight: 700;font-size: var(--vds-typography-font-size-300); color: var(--vne-dark-header);">${leagueName}</span>
      <span style="font-size: var(--vds-typography-font-size-100); font-weight: 600; color: var(--vne-text-secondary);">${formattedTime}</span>
    </div>
    <div style="font-size: var(--vds-typography-font-size-200); line-height: 1.5; color: var(--vne-text-secondary);">
      Xem lại toàn bộ những pha bóng đáng chú ý, các bàn thắng đẹp mắt và tình huống kịch tính nhất trong màn so tài đỉnh cao giữa <strong>${homeTeam}</strong> và <strong>${awayTeam}</strong>.
    </div>
  `;
  modal.classList.add('open');
  if (window.lucide) lucide.createIcons();
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
  if (modalId === 'modal-filter-picker') {
    document.getElementById(modalId).inert = true;
    document.body.style.overflow = filterPickerBodyOverflow;
    filterPickerTrigger?.focus({ preventScroll: true });
  }
}

function closeModalOnBackdrop(e, modalId) {
  if (e.target.id === modalId) {
    closeModal(modalId);
  }
}

function filterLeague(leagueId) {
  selectLeague(leagueId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function toSeoSlug(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function goToMatchDetail(fixtureId, homeName, awayName, evt = null) {
  if (evt) evt.stopPropagation();
  const hSlug = toSeoSlug(homeName) || 'home';
  const aSlug = toSeoSlug(awayName) || 'away';
  const idPart = fixtureId || 1001;
  window.location.href = `/tran-dau/${hSlug}-vs-${aSlug}-${idPart}`;
}


function toTeamSlug(name, id) {
  const base = toSeoSlug(name) || 'doi-bong';
  return id ? `${base}-${id}` : base;
}

// Mobile: chạm vào giờ đá để hiện/ẩn kênh phát sóng (không mở trang chi tiết)
document.addEventListener('click', e => {
  if (!window.matchMedia('(max-width: 640px)').matches) return;
  const box = e.target.closest('.vne-match-row .vne-score-box.upcoming');
  if (!box) return;
  const row = box.closest('.vne-match-row');
  if (!row.querySelector('.vne-match-channel-pill')) return;
  e.stopPropagation(); e.preventDefault();
  row.classList.toggle('is-ch-open');
}, true);


// Đóng popup (Đội của tôi / Giải khác) khi bấm ra ngoài: bắt ở pointerdown (trước khi DOM bị vẽ lại bởi thao tác khác)
document.addEventListener('pointerdown', (event) => {
  if (!state.favPanel && !state.leagueMoreOpen) return;
  const path = event.composedPath();
  const inFav = path.some(n => n.id === 'fav-bar' || (n.classList && (n.classList.contains('vne-fav-group') || n.classList.contains('vne-fav-backdrop'))));
  const inMore = path.some(n => n.id === 'league-more-pop' || (n.classList && n.classList.contains('vne-league-more')));
  if (state.favPanel && !inFav) {
    state.favPanel = false;
    const bar = document.getElementById('fav-bar'); if (bar) bar.hidden = true;
    document.getElementById('fav-backdrop')?.remove();
    document.querySelector('.vne-fav-group')?.classList.remove('panel-open');
  }
  if (state.leagueMoreOpen && !inMore) {
    state.leagueMoreOpen = false;
    const pop = document.getElementById('league-more-pop'); if (pop) pop.hidden = true;
    document.querySelector('.vne-league-more')?.setAttribute('aria-expanded', 'false');
  }
}, true);
