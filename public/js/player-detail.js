// =========================================================================
// PLAYER DETAIL APPLICATION SCRIPT (VnExpress Thể Thao)
// Handles SEO routing, Tab Switching, Profile, Compact Stats after Item 3,
// and Positional In-Depth Statistics.
// =========================================================================

const state = {
  playerSlug: 'lamine-yamal-386828',
  activeTab: 'tong-quan', // 'tong-quan' | 'thong-ke'
  data: null,
  newsPage: 1,
  newsPerPage: 20
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  parsePlayerUrlRoute();
  initHeaderClock();
  loadPlayerDetailData();
});

// Parse SEO URL Route: /cau-thu/:slug or /cau-thu/:slug/:tab
function parsePlayerUrlRoute() {
  const path = window.location.pathname;
  const match = path.match(/\/cau-thu\/([^/]+)(?:\/([^/]+))?/);

  if (match) {
    state.playerSlug = match[1] || 'lamine-yamal-386828';
    const subTab = match[2];
    if (subTab === 'thong-ke') {
      state.activeTab = 'thong-ke';
    } else {
      state.activeTab = 'tong-quan';
    }
  } else {
    state.playerSlug = 'lamine-yamal-386828';
    state.activeTab = 'tong-quan';
  }
}

// Fetch Player Detail Data from API
async function loadPlayerDetailData() {
  try {
    const res = await fetch(`/api/player-detail?slug=${encodeURIComponent(state.playerSlug)}`);
    if (!res.ok) throw new Error('Failed to fetch player data');
    const data = await res.json();
    state.data = data;

    // Render components
    renderPlayerHero(data.player, data.totals);
    renderPlayerSidebar(data.player);
    renderNewsFeed();
    renderCompactStatsWidget(data.compactStats, data.player);
    renderTournamentBreakdown(data.tournaments, data.totals, data.player);
    renderDeepStatCategories(data.statCategories, data.player);

    // Activate the targeted tab
    switchPlayerTab(state.activeTab, null, false);

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error loading player detail:', err);
  }
}

// Switch between Tab 1 ('tong-quan') and Tab 2 ('thong-ke')
function switchPlayerTab(tabKey, evt = null, pushHistory = true) {
  if (evt) evt.preventDefault();
  state.activeTab = tabKey;

  // Update Subnav button states
  document.querySelectorAll('.vne-subnav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`subnav-${tabKey}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Toggle Tab Panes
  const paneTongQuan = document.getElementById('tab-pane-tong-quan');
  const paneThongKe = document.getElementById('tab-pane-thong-ke');

  if (tabKey === 'thong-ke') {
    if (paneTongQuan) paneTongQuan.style.display = 'none';
    if (paneThongKe) paneThongKe.style.display = 'block';
  } else {
    if (paneTongQuan) paneTongQuan.style.display = 'block';
    if (paneThongKe) paneThongKe.style.display = 'none';
  }

  // Update URL using PushState
  if (pushHistory) {
    const targetUrl = tabKey === 'thong-ke' ? `/cau-thu/${state.playerSlug}/thong-ke` : `/cau-thu/${state.playerSlug}`;
    window.history.pushState({ tab: tabKey }, '', targetUrl);
  }

  updatePlayerPageTitle();
  if (window.lucide) lucide.createIcons();
}

// Listen to Browser Back / Forward buttons
window.addEventListener('popstate', () => {
  parsePlayerUrlRoute();
  switchPlayerTab(state.activeTab, null, false);
});

// Update Page Title based on active tab
function updatePlayerPageTitle() {
  const pName = state.data?.player?.name || 'Hồ sơ cầu thủ';
  if (state.activeTab === 'thong-ke') {
    document.title = `${pName} - Thống kê chi tiết mùa giải 2025/2026 - VnExpress Thể Thao`;
  } else {
    document.title = `${pName} - Tổng quan & Tin tức mới nhất - VnExpress Thể Thao`;
  }
}

// 1. Render Hero Player Profile
function renderPlayerHero(player, totals) {
  if (!player) return;

  // Avatar & Number
  const avatarEl = document.getElementById('player-avatar');
  if (avatarEl) {
    avatarEl.src = player.photo || 'https://media.api-sports.io/football/players/386828.png';
    avatarEl.alt = player.name;
  }
  const jerseyNumEl = document.getElementById('player-jersey-number');
  if (jerseyNumEl) jerseyNumEl.innerText = player.number || '10';

  // Name
  const nameEl = document.getElementById('player-name');
  if (nameEl) nameEl.innerText = player.name;

  // Club Chip
  const clubChip = document.getElementById('player-club-chip');
  const clubLogo = document.getElementById('player-club-logo');
  const clubName = document.getElementById('player-club-name');
  if (clubChip && player.club) {
    clubChip.href = `/doi-bong/${player.club.slug || 'barcelona-529'}`;
    if (clubLogo) clubLogo.src = player.club.logo || '';
    if (clubName) clubName.innerText = player.club.name || 'CLB';
  }

  // National Team Chip
  const natLogo = document.getElementById('player-nat-flag');
  const natName = document.getElementById('player-nat-name');
  if (player.nationalTeam) {
    if (natLogo) natLogo.src = player.nationalTeam.flag || player.nationalTeam.logo || '';
    if (natName) natName.innerText = player.nationalTeam.name || 'ĐTQG';
  }

  // Position Badge
  const posBadge = document.getElementById('player-position-badge');
  if (posBadge) posBadge.innerText = player.positionVn || 'Tiền đạo';

  // Quick specs
  const ageEl = document.getElementById('player-age');
  if (ageEl) ageEl.innerText = `${player.age} tuổi`;

  const dobEl = document.getElementById('player-dob');
  if (dobEl) dobEl.innerText = player.birthDate || '13/07/2007';

  const pobEl = document.getElementById('player-pob');
  if (pobEl) pobEl.innerText = player.birthPlace || player.nationality;

  const physiqueEl = document.getElementById('player-physique');
  if (physiqueEl) physiqueEl.innerText = `${player.height} / ${player.weight}`;

  const footEl = document.getElementById('player-foot');
  if (footEl) footEl.innerText = player.foot || 'Chân phải';

  // Highlight Cards
  const appsEl = document.getElementById('hero-stat-apps');
  if (appsEl) appsEl.innerText = totals?.appearences || 28;

  const goalsEl = document.getElementById('hero-stat-goals');
  const goalsLabelEl = document.getElementById('hero-stat-goals-label');
  const assistsEl = document.getElementById('hero-stat-assists');
  const assistsLabelEl = document.getElementById('hero-stat-assists-label');
  const ratingEl = document.getElementById('hero-stat-rating');

  if (player.positionGroup === 'GOALKEEPER') {
    if (goalsEl) goalsEl.innerText = totals?.saves || 86;
    if (goalsLabelEl) goalsLabelEl.innerText = 'Cứu thua';
    if (assistsEl) assistsEl.innerText = totals?.cleanSheets || 12;
    if (assistsLabelEl) assistsLabelEl.innerText = 'Sạch lưới';
  } else if (player.positionGroup === 'DEFENDER') {
    if (goalsEl) goalsEl.innerText = totals?.tacklesWon || 46;
    if (goalsLabelEl) goalsLabelEl.innerText = 'Tắc bóng';
    if (assistsEl) assistsEl.innerText = totals?.interceptions || 42;
    if (assistsLabelEl) assistsLabelEl.innerText = 'Cắt bóng';
  } else {
    if (goalsEl) goalsEl.innerText = totals?.goals || 17;
    if (goalsLabelEl) goalsLabelEl.innerText = 'Bàn thắng';
    if (assistsEl) assistsEl.innerText = totals?.assists || 12;
    if (assistsLabelEl) assistsLabelEl.innerText = 'Kiến tạo';
  }

  if (ratingEl) ratingEl.innerText = totals?.rating || '7.96';
}

// 2. Render News Feed with Injected Compact Stats
function renderNewsFeed() {
  const news = state.data?.news || [];
  const heroContainer = document.getElementById('player-news-hero-container');
  const topListContainer = document.getElementById('player-news-top-list');
  const restListContainer = document.getElementById('player-news-rest-list');
  const rangeInfo = document.getElementById('player-news-range-info');
  const pagination = document.getElementById('player-news-pagination');

  if (news.length === 0) {
    if (topListContainer) topListContainer.innerHTML = '<div style="padding: var(--vds-spacing-sm);color: var(--vds-text-subdued);">Đang cập nhật tin tức...</div>';
    return;
  }

  const page = state.newsPage;
  const perPage = state.newsPerPage;
  const startIdx = (page - 1) * perPage;
  const pageItems = news.slice(startIdx, startIdx + perPage);

  if (page === 1) {
    // Item 1: Hero article
    const hero = pageItems[0];
    if (heroContainer && hero) {
      heroContainer.style.display = 'block';
      heroContainer.innerHTML = `
        <article class="vne-league-hero-card" style="margin-bottom: var(--vds-spacing-sm);">
          <div class="vne-league-hero-thumb-wrapper">
            <a href="${getArticleUrl(hero.link)}">
              <img src="${hero.thumbnail}" class="vne-league-hero-thumb" alt="${hero.title}" onerror="this.src='https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png'">
            </a>
          </div>
          <div class="vne-league-hero-body">
            <h2 class="vne-league-hero-title">
              <a href="${getArticleUrl(hero.link)}">${hero.title}</a>
            </h2>
            <p class="vne-league-hero-lead">${hero.description}</p>
            <div class="vne-league-hero-footer">
              <span class="vne-news-time">${hero.timeAgo}</span>
              <span class="vne-news-comments">💬 ${hero.commentsCount || 42}</span>
            </div>
          </div>
        </article>
      `;
    }

    // Items 2 & 3: Rendered right before the compact stats box
    const items2and3 = pageItems.slice(1, 3);
    if (topListContainer) {
      topListContainer.innerHTML = items2and3.map(item => renderNewsCardHtml(item)).join('');
    }

    // Items 4+: Rendered below the compact stats box
    const restItems = pageItems.slice(3);
    if (restListContainer) {
      restListContainer.innerHTML = restItems.map(item => renderNewsCardHtml(item)).join('');
    }
  } else {
    // If on other pages, hide hero and render all in rest list
    if (heroContainer) heroContainer.style.display = 'none';
    if (topListContainer) topListContainer.innerHTML = '';
    if (restListContainer) {
      restListContainer.innerHTML = pageItems.map(item => renderNewsCardHtml(item)).join('');
    }
  }

  // Update Range Info
  const startItem = startIdx + 1;
  const endItem = Math.min(startIdx + perPage, news.length);
  if (rangeInfo) {
    rangeInfo.innerText = `Hiển thị ${startItem} - ${endItem} trên tổng số ${news.length} tin bài`;
  }

  // Update Pagination Buttons
  const totalPages = Math.ceil(news.length / perPage) || 1;
  if (pagination) {
    let pagesHtml = '';
    pagesHtml += `
      <button class="vne-page-btn" ${page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : `onclick="changePlayerNewsPage(${page - 1})"`}>
        ‹ Trước
      </button>
    `;
    for (let p = 1; p <= totalPages; p++) {
      pagesHtml += `
        <button class="vne-page-btn ${p === page ? 'active' : ''}" onclick="changePlayerNewsPage(${p})">
          ${p}
        </button>
      `;
    }
    pagesHtml += `
      <button class="vne-page-btn" ${page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : `onclick="changePlayerNewsPage(${page + 1})"`}>
        Sau ›
      </button>
    `;
    pagination.innerHTML = pagesHtml;
  }
}

function changePlayerNewsPage(p) {
  state.newsPage = p;
  renderNewsFeed();
  window.scrollTo({ top: 380, behavior: 'smooth' });
}

// 3. Render Compact Stats Widget (Positioned after News Item #3)
function renderCompactStatsWidget(compact, player) {
  if (!compact) return;

  const badgeEl = document.getElementById('compact-badge-pos');
  if (badgeEl) badgeEl.innerText = compact.positionBadge || player?.positionVn || 'Cầu thủ';

  const titleEl = document.getElementById('compact-title');
  if (titleEl) titleEl.innerText = `Thống kê mùa giải ${compact.season || '2025/2026'} - ${player?.name || ''}`;

  const matchesEl = document.getElementById('compact-matches-played');
  if (matchesEl) {
    matchesEl.innerHTML = `Đã thi đấu: <strong>${compact.totalMatchesText} (${compact.totalMinutesText})</strong>`;
  }

  const gridEl = document.getElementById('compact-metrics-grid');
  if (gridEl && compact.metrics) {
    gridEl.innerHTML = compact.metrics.map(m => `
      <div class="vne-compact-metric-item">
        <div class="vne-compact-metric-val ${m.highlight ? 'highlight' : ''}">${m.value}</div>
        <div class="vne-compact-metric-label">${m.label}</div>
        ${m.sub ? `<div class="vne-compact-metric-sub">${m.sub}</div>` : ''}
      </div>
    `).join('');
  }
}

// 4. Render Sidebar
function renderPlayerSidebar(player) {
  if (!player) return;

  // Club widget
  if (player.club) {
    const clubLogo = document.getElementById('sidebar-club-logo');
    if (clubLogo) clubLogo.src = player.club.logo || '';

    const clubName = document.getElementById('sidebar-club-name');
    if (clubName) {
      clubName.innerText = player.club.name;
      clubName.href = `/doi-bong/${player.club.slug || 'barcelona-529'}`;
    }

    const clubLeague = document.getElementById('sidebar-club-league');
    if (clubLeague) clubLeague.innerText = `${player.club.league || 'La Liga'} • ${player.club.country || 'Tây Ban Nha'}`;

    const clubCoach = document.getElementById('sidebar-club-coach');
    if (clubCoach) clubCoach.innerText = player.club.coach || 'Hansi Flick';

    const clubStadium = document.getElementById('sidebar-club-stadium');
    if (clubStadium) clubStadium.innerText = player.club.stadium || 'Spotify Camp Nou';

    const clubLink = document.getElementById('sidebar-club-link');
    if (clubLink) clubLink.href = `/doi-bong/${player.club.slug || 'barcelona-529'}`;
  }

  // National team widget
  if (player.nationalTeam) {
    const natLogo = document.getElementById('sidebar-nat-logo');
    if (natLogo) natLogo.src = player.nationalTeam.flag || player.nationalTeam.logo || '';

    const natName = document.getElementById('sidebar-nat-name');
    if (natName) natName.innerText = player.nationalTeam.name || 'ĐTQG';

    const natRole = document.getElementById('sidebar-nat-role');
    if (natRole) natRole.innerText = `Số áo đội tuyển: #${player.nationalTeam.number || '19'}`;
  }

  // Bio specs widget
  const bioName = document.getElementById('sidebar-bio-fullname');
  if (bioName) bioName.innerText = player.lastname ? `${player.firstname} ${player.lastname}` : player.name;

  const bioDob = document.getElementById('sidebar-bio-dob');
  if (bioDob) bioDob.innerText = player.birthDate || '13/07/2007';

  const bioPob = document.getElementById('sidebar-bio-pob');
  if (bioPob) bioPob.innerText = player.birthPlace || 'Tây Ban Nha';

  const bioVal = document.getElementById('sidebar-bio-value');
  if (bioVal) bioVal.innerText = player.marketValue || '€150 triệu';

  const bioStatus = document.getElementById('sidebar-bio-status');
  if (bioStatus) bioStatus.innerText = player.status || 'Khỏe mạnh';
}

// 5. TAB 2: Render Tournament Breakdown Table
function renderTournamentBreakdown(tournaments, totals, player) {
  const tbody = document.getElementById('tournament-stats-tbody');
  const summaryEl = document.getElementById('table-total-matches-summary');

  if (summaryEl && totals) {
    summaryEl.innerText = `Tổng cộng: ${totals.appearences || 28} trận (${(totals.minutes || 2179).toLocaleString('vi-VN')} phút) • Đánh giá TB: ${totals.rating || '7.96'}`;
  }

  // Adjust table headers based on position
  const isGk = player?.positionGroup === 'GOALKEEPER';
  const isDf = player?.positionGroup === 'DEFENDER';

  const thGoals = document.getElementById('th-stat-goals');
  const thAssists = document.getElementById('th-stat-assists');
  const thShots = document.getElementById('th-stat-shots');
  const thDuels = document.getElementById('th-stat-duels');

  if (isGk) {
    if (thGoals) thGoals.innerText = 'Cứu thua';
    if (thAssists) thAssists.innerText = 'Sạch lưới';
    if (thShots) thShots.innerText = 'Bàn thua';
    if (thDuels) thDuels.innerText = 'Cản 11m';
  } else if (isDf) {
    if (thGoals) thGoals.innerText = 'Bàn thắng';
    if (thAssists) thAssists.innerText = 'Tắc bóng';
    if (thShots) thShots.innerText = 'Cắt bóng';
    if (thDuels) thDuels.innerText = 'Tranh chấp %';
  } else {
    if (thGoals) thGoals.innerText = 'Bàn thắng';
    if (thAssists) thAssists.innerText = 'Kiến tạo';
    if (thShots) thShots.innerText = 'Sút (Trúng đích)';
    if (thDuels) thDuels.innerText = 'Tranh chấp %';
  }

  if (!tbody || !tournaments) return;

  const rowsHtml = tournaments.map(t => {
    const isHigh = parseFloat(t.games.rating) >= 7.8;
    let colGoalsVal = t.goals.total;
    let colAssistsVal = t.goals.assists;
    let colShotsVal = `${t.goals.shotsTotal || 0} (${t.goals.shotsOn || 0})`;
    let colDuelsVal = `${t.defense.duelsWonPct || 50}%`;

    if (isGk) {
      colGoalsVal = t.defense.saves || 0;
      colAssistsVal = t.defense.cleanSheets || 0;
      colShotsVal = t.defense.conceded || 0;
      colDuelsVal = `${t.defense.cleanSheets || 0} trận`;
    } else if (isDf) {
      colGoalsVal = t.goals.total;
      colAssistsVal = t.defense.tackles || 0;
      colShotsVal = t.defense.interceptions || 0;
      colDuelsVal = `${t.defense.duelsWonPct || 70}%`;
    }

    return `
      <tr>
        <td class="td-left">
          <div class="vne-stats-league-cell">
            <img src="${t.league.logo || ''}" alt="" class="vne-stats-league-logo" onerror="this.style.display='none'">
            <span>${t.league.vnName || t.league.name}</span>
          </div>
        </td>
        <td class="td-left">${t.team.name}</td>
        <td><strong>${t.games.appearences}</strong> <span style="font-size: var(--vds-typography-font-size-100);color: var(--vds-text-subdued);">(${t.games.lineups})</span></td>
        <td>${(t.games.minutes || 0).toLocaleString('vi-VN')}'</td>
        <td style="font-weight:800; color:${colGoalsVal > 0 ? 'var(--vne-red)' : 'inherit'};">${colGoalsVal}</td>
        <td style="font-weight:700;">${colAssistsVal}</td>
        <td>${colShotsVal}</td>
        <td>${t.passes.accuracy}% <span style="font-size: var(--vds-typography-font-size-100);color: var(--vds-text-subdued);">(${t.passes.key || 0})</span></td>
        <td>${colDuelsVal}</td>
        <td>
          <span class="vne-rating-pill ${isHigh ? 'high' : ''}">${t.games.rating}</span>
        </td>
      </tr>
    `;
  }).join('');

  // Season Total Row
  let totGoals = totals?.goals || 0;
  let totAssists = totals?.assists || 0;
  let totShots = `${totals?.shotsTotal || 0} (${totals?.shotsOn || 0})`;
  let totDuels = `${totals?.duelWinPct || 50}%`;

  if (isGk) {
    totGoals = totals?.saves || 86;
    totAssists = totals?.cleanSheets || 12;
    totShots = totals?.conceded || 22;
    totDuels = `${totals?.cleanSheets || 12} trận`;
  } else if (isDf) {
    totGoals = totals?.goals || 2;
    totAssists = totals?.tacklesWon || 46;
    totShots = totals?.interceptions || 42;
    totDuels = `${totals?.duelWinPct || 71}%`;
  }

  const totalRowHtml = `
    <tr class="total-row">
      <td class="td-left" style="font-weight:800;">TỔNG CỘNG MÙA GIẢI</td>
      <td class="td-left">-</td>
      <td><strong>${totals?.appearences || 28}</strong> (${totals?.lineups || 27})</td>
      <td>${(totals?.minutes || 2179).toLocaleString('vi-VN')}'</td>
      <td style="font-weight:800; color:var(--vne-red);">${totGoals}</td>
      <td style="font-weight:800;">${totAssists}</td>
      <td>${totShots}</td>
      <td>${totals?.passAccuracyPct || 81}% (${totals?.keyPasses || 0})</td>
      <td>${totDuels}</td>
      <td>
        <span class="vne-rating-pill high">${totals?.rating || '7.96'}</span>
      </td>
    </tr>
  `;

  tbody.innerHTML = rowsHtml + totalRowHtml;
}

// 6. TAB 2: Render In-Depth Metric Categories (Strict Ordering by Position)
function renderDeepStatCategories(categories, player) {
  const container = document.getElementById('deep-categories-grid');
  const badgeEl = document.getElementById('categories-ordering-badge');

  if (badgeEl && player) {
    if (player.positionGroup === 'GOALKEEPER') {
      badgeEl.innerText = 'Thứ tự ưu tiên: Cứu thua & Kiểm soát vòng cấm lên đầu';
    } else if (player.positionGroup === 'DEFENDER') {
      badgeEl.innerText = 'Thứ tự ưu tiên: Phòng ngự & Cắt bóng & Tranh chấp lên đầu';
    } else {
      badgeEl.innerText = 'Thứ tự ưu tiên: Tấn công & Ghi bàn & Sáng tạo lên đầu';
    }
  }

  if (!container || !categories) return;

  container.innerHTML = categories.map(cat => `
    <div class="vne-deep-cat-card ${cat.isPrimary ? 'primary' : ''}">
      <h3 class="vne-deep-cat-title">
        <i data-lucide="${cat.icon || 'star'}" style="width: 17px; height: 17px; color: ${cat.isPrimary ? 'var(--vne-red)' : '#64748b'};"></i>
        <span>${cat.title}</span>
      </h3>
      <div class="vne-deep-stat-list">
        ${cat.stats.map(s => `
          <div class="vne-deep-stat-row">
            <div class="vne-deep-stat-left">
              <div class="vne-deep-stat-name">${s.label}</div>
              ${s.sub ? `<div class="vne-deep-stat-sub">${s.sub}</div>` : ''}
            </div>
            <div class="vne-deep-stat-val">${s.value}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Helper: News Card HTML
function renderNewsCardHtml(item) {
  return `
    <article class="vne-league-news-card" style="margin-bottom: var(--vds-spacing-sm);">
      <div class="vne-league-news-thumb-col">
        <a href="${getArticleUrl(item.link)}">
          <img src="${item.thumbnail}" class="vne-league-news-thumb" alt="${item.title}" onerror="this.src='https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png'">
        </a>
      </div>
      <div class="vne-league-news-body-col">
        <h3 class="vne-league-news-heading">
          <a href="${getArticleUrl(item.link)}">${item.title}</a>
        </h3>
        <p class="vne-league-news-lead">${item.description}</p>
        <div class="vne-league-news-footer">
          <span class="vne-news-time">${item.timeAgo}</span>
          <span class="vne-news-comments">💬 ${item.commentsCount || 25}</span>
        </div>
      </div>
    </article>
  `;
}

// Helper: Transform URL to local article format
function getArticleUrl(link) {
  if (!link) return '#';
  try {
    const clean = link.split('?')[0].split('#')[0];
    const match = clean.match(/\/([a-zA-Z0-9_-]+-\d+\.html)$/);
    if (match) return '/' + match[1];
  } catch (e) {}
  return link;
}

// Helper: Header Clock in Vietnam Time
function initHeaderClock() {
  const clockEl = document.getElementById('current-datetime-display');
  if (!clockEl) return;
  const update = () => {
    const now = new Date();
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dStr = days[now.getDay()];
    const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).replace(/(^|\/)0(\d)/g, '$1$2');
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
    clockEl.innerText = `${dStr}, ${dateStr} • ${timeStr} GMT+7`;
  };
  update();
  setInterval(update, 30000);
}
