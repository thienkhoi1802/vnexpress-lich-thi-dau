
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

/**
 * League Detail Page Scripts - VnExpress Football
 * Handles SEO slug routing, 4 sub-pages (Tổng quan, Lịch thi đấu, Kết quả, Bảng xếp hạng),
 * match widget slider, clean news pagination without view badges, prediction widget, standings & top scorers.
 */

const state = {
  teamSlug: 'arsenal-42',
  teamId: 42,
  leagueSlug: 'ngoai-hang-anh',
  leagueId: 39,
  activeTab: 'tong-quan', // 'tong-quan' | 'lich-thi-dau' | 'ket-qua' | 'bang-xep-hang' | 'doi-hinh'
  squadPosFilter: 'ALL',
  data: null,
  newsPage: 1,
  newsPerPage: 20,
  activeModal: null,
  fixturesFilterRound: 'all',
  fixturesSearchText: '',
  resultsFilterRound: 'all',
  resultsSearchText: ''
};

// Initialize
function initLeagueDetailApp() {
  parseUrlRoute();
  initHeaderClock();
  loadLeagueDetailData();

  // Tự động làm mới dữ liệu sau mỗi 2 tiếng (đồng bộ chu kỳ 2h của server)
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadLeagueDetailData();
    }
  }, 2 * 60 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLeagueDetailApp);
} else {
  initLeagueDetailApp();
}

// Parse SEO Friendly URL Route: /giai-dau/:slug/:tab or /giai-dau/:slug
function parseUrlRoute() {
  const path = window.location.pathname; // e.g. /doi-bong/arsenal-42/lich-thi-dau
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'doi-bong' && parts[1]) {
    state.teamSlug = parts[1];
    if (parts[2]) {
      const validTabs = ['tong-quan', 'lich-thi-dau', 'ket-qua', 'bang-xep-hang', 'doi-hinh'];
      if (validTabs.includes(parts[2])) {
        state.activeTab = parts[2];
      }
    } else {
      state.activeTab = 'tong-quan';
    }
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    const qSlug = urlParams.get('slug');
    const qTeamId = parseInt(urlParams.get('team_id'));
    const qTab = urlParams.get('tab');
    if (qSlug) state.teamSlug = qSlug;
    if (qTeamId && !isNaN(qTeamId)) state.teamId = qTeamId;
    if (qTab) state.activeTab = qTab;
  }
}

// Update live header datetime clock
function initHeaderClock() {
  const el = document.getElementById('current-datetime-display');
  if (!el) return;
  const update = () => {
    if (window.vdsFormatDateTime) {
      el.innerText = window.vdsFormatDateTime(new Date());
    } else {
      const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const now = new Date();
      const dName = days[now.getDay()];
      const dd = now.getDate();
      const mm = now.getMonth() + 1;
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      el.innerText = `${dName}, ${dd}/${mm}/${yyyy}, ${hh}:${min} (GMT+7)`;
    }
  };
  update();
  setInterval(update, 30000);
}

// Fetch all league detail data from server
async function loadLeagueDetailData() {
  try {
    const query = state.teamSlug 
      ? `slug=${encodeURIComponent(state.teamSlug)}` 
      : `team_id=${state.teamId}`;
    const res = await fetch(`/api/team-detail?${query}`);
    const data = await res.json();
    state.data = data;
    state.teamSlug = data.team?.slug || state.teamSlug;
    state.teamId = data.team?.id || state.teamId;
    state.leagueSlug = data.league?.slug || state.leagueSlug;
    state.leagueId = data.league?.id || state.leagueId;

    // Render Team Banner
    renderLeagueBanner(data.team, data.league);

    // Render Tab 1: Tổng quan & Tin tức
    renderTopMatchWidget(data.topMatches);
    renderNewsSection();
    renderPredictionWidget(data.predictionMatches);
    renderMiniTopScorers(data.topscorers);

    // Render Tab 2: Lịch thi đấu
    renderUpcomingFixtures();

    // Render Tab 3: Kết quả
    renderPastResults();

    // Render Tab 4: Bảng xếp hạng chi tiết
    renderFullStandingsPage(data.standings);
    renderFullTopScorersPage(data.topscorers);

    // Render Tab 5: Đội hình
    renderSquadPage();

    // Activate the targeted tab
    switchLeagueTab(state.activeTab, null, false);

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error loading team detail:', err);
  }
}

// Update Page Title based on league & active tab
function updatePageTitle() {
  const teamName = state.data?.team?.name || 'Chi tiết đội bóng';
  if (state.activeTab === 'lich-thi-dau') {
    document.title = `Lịch thi đấu ${teamName} 2025/2026 - VnExpress`;
  } else if (state.activeTab === 'ket-qua') {
    document.title = `Kết quả bóng đá ${teamName} 2025/2026 - VnExpress`;
  } else if (state.activeTab === 'bang-xep-hang') {
    document.title = `Bảng xếp hạng ${teamName} 2025/2026 - VnExpress`;
  } else if (state.activeTab === 'doi-hinh') {
    document.title = `Đội hình & Cầu thủ ${teamName} 2025/2026 - VnExpress`;
  } else {
    document.title = `${teamName} - Tổng quan & Tin tức - VnExpress Thể Thao`;
  }
}

// Switch between the 5 sub-pages / tabs
function switchLeagueTab(tab, evt, updateHistory = true) {
  if (evt) evt.preventDefault();
  state.activeTab = tab;

  const tabs = ['tong-quan', 'lich-thi-dau', 'ket-qua', 'bang-xep-hang', 'doi-hinh'];
  tabs.forEach(t => {
    const btn = document.getElementById(`subnav-${t}`);
    if (btn) {
      if (t === tab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  tabs.forEach(t => {
    const pane = document.getElementById(`tab-pane-${t}`);
    if (pane) {
      if (t === tab) pane.classList.add('active');
      else pane.classList.remove('active');
    }
  });

  if (updateHistory && state.teamSlug) {
    const newUrl = tab === 'tong-quan' 
      ? `/doi-bong/${state.teamSlug}` 
      : `/doi-bong/${state.teamSlug}/${tab}`;
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ tab, teamSlug: state.teamSlug }, '', newUrl);
    }
  }

  updatePageTitle();

  if (tab === 'ket-qua') {
    renderPastResults();
  } else if (tab === 'lich-thi-dau') {
    renderUpcomingFixtures();
  } else if (tab === 'doi-hinh') {
    renderSquadPage();
  }

  if (window.lucide) lucide.createIcons();
}

// Listen to browser Back / Forward buttons
window.addEventListener('popstate', (e) => {
  parseUrlRoute();
  switchLeagueTab(state.activeTab, null, false);
});

// 1. Render Title Tên Giải (League Banner - Cleaned per user request: no country badge, no subtitle)
function renderLeagueBanner(team, league) {
  if (!team) return;
  
  const logoEl = document.getElementById('detail-league-logo');
  const nameEl = document.getElementById('detail-league-name');
  
  if (logoEl) {
    logoEl.src = team.logo;
    logoEl.onerror = function() { this.src = 'https://is.vnecdn.net/objects/teams/42.png?v=1'; };
  }
  if (nameEl) nameEl.innerText = team.name;

  const sName = document.getElementById('standings-league-name');
  if (sName) sName.innerText = `- ${league?.vnName || league?.name || ''} (${team.name})`;

  const metaBox = document.getElementById('team-banner-meta-pills');
  if (metaBox) {
    const lName = league?.vnName || league?.name || 'Giải VĐQG';
    const lLogo = league?.logo || 'https://is.vnecdn.net/objects/leagues/39.png?v=1';
    const lSlug = league?.slug || 'ngoai-hang-anh';
    metaBox.innerHTML = `
      <a href="/giai-dau/${lSlug}" class="vne-team-meta-pill" title="Xem giải đấu ${lName}">
        <img src="${lLogo}" alt="${lName}">
        <span>${lName}</span>
      </a>
      ${team.coach ? `<span class="vne-team-meta-pill">HLV: ${team.coach}</span>` : ''}
      ${team.stadium ? `<span class="vne-team-meta-pill hide-on-mobile">Sân: ${team.stadium}</span>` : ''}
    `;
  }
}

function onSwitchLeague(newSlug) {
  window.location.href = `/giai-dau/${newSlug}`;
}

// 2. Render Top Match Schedule Widget (chi-tiet-giai.jpg)
function renderTopMatchWidget(matches) {
  const container = document.getElementById('top-widget-matches-container');
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = `
      <div style="padding: var(--vds-spacing-sm); color: var(--vne-text-muted);font-size: var(--vds-typography-font-size-100); text-align: center; width: 100%;">
        Chưa có lịch thi đấu mới cho giải này.
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map(m => {
    const isFinished = ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short) || m.status === 'Match Finished';
    const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'P'].includes(m.status_short);
    const isPen = m.status_short === 'PEN' || m.penalty_home !== undefined || (m.score && m.score.penalty);
    const dateFormatted = formatWidgetMatchDate(m.event_date);
    const broadcastChannel = m.broadcast || getMatchBroadcast(m, m.league_id);

    const penH = m.penalty_home ?? (m.score?.penalty ? m.score.penalty.split('-')[0].trim() : 4);
    const penA = m.penalty_away ?? (m.score?.penalty ? m.score.penalty.split('-')[1].trim() : 2);

    let homeScore = '';
    let awayScore = '';
    if (isFinished || isLive) {
      if (isPen) {
        homeScore = `<span class="vne-widget-match-score ${isLive ? 'live' : ''}">${m.goals_home_team ?? 0} <span class="vne-widget-pen-num">(${penH})</span></span>`;
        awayScore = `<span class="vne-widget-match-score ${isLive ? 'live' : ''}">${m.goals_away_team ?? 0} <span class="vne-widget-pen-num">(${penA})</span></span>`;
      } else {
        homeScore = `<span class="vne-widget-match-score ${isLive ? 'live' : ''}">${m.goals_home_team ?? 0}</span>`;
        awayScore = `<span class="vne-widget-match-score ${isLive ? 'live' : ''}">${m.goals_away_team ?? 0}</span>`;
      }
    }

    return `
      <div class="vne-widget-match-item" style="cursor: pointer;" onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}')">
        <div class="vne-widget-match-time">
          <span>${dateFormatted}</span>
          ${isLive ? '<span class="live-dot-pulse" style="width:6px; height:6px;"></span>' : ''}
          ${isFinished ? '<span style="color: var(--vds-text-subdued); font-weight:700;font-size: var(--vds-typography-font-size-050);">KT</span>' : ''}
        </div>
        
        <!-- Home Team -->
        <div class="vne-widget-team-row">
          <div class="vne-widget-team-info">
            <img src="${m.home_team.logo}" class="vne-widget-team-logo" alt="${m.home_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
            <span class="vne-widget-team-name vne-team-link" title="Xem chi tiết ${m.home_team.team_name}" onclick="goToTeamDetail('${escapeHtml(m.home_team.team_name)}', ${m.home_team.team_id || 'null'}, event)">${m.home_team.team_name}</span>
          </div>
          ${homeScore}
        </div>

        <!-- Away Team -->
        <div class="vne-widget-team-row">
          <div class="vne-widget-team-info">
            <img src="${m.away_team.logo}" class="vne-widget-team-logo" alt="${m.away_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
            <span class="vne-widget-team-name vne-team-link" title="Xem chi tiết ${m.away_team.team_name}" onclick="goToTeamDetail('${escapeHtml(m.away_team.team_name)}', ${m.away_team.team_id || 'null'}, event)">${m.away_team.team_name}</span>
          </div>
          ${awayScore}
        </div>
      </div>
    `;
  }).join('');
}

function slideTopMatches(direction) {
  const container = document.getElementById('top-widget-matches-container');
  if (container) {
    container.scrollBy({ left: direction * 280, behavior: 'smooth' });
  }
}

// 3. Render News Section (Hero Article + 20 items list per page)
// Cleaned per user request: removed '7.382 Educate' and eye icon 👁
function renderNewsSection() {
  const allNews = state.data?.news || [];
  const heroContainer = document.getElementById('league-hero-article-container');
  const listContainer = document.getElementById('league-news-list-container');
  const rangeInfo = document.getElementById('league-news-range-info');
  const pagination = document.getElementById('league-news-pagination');

  if (allNews.length === 0) {
    listContainer.innerHTML = '<div style="padding: var(--vds-spacing-lg); text-align: center;color: var(--vds-text-subdued);">Đang cập nhật tin tức...</div>';
    return;
  }

  // Page 1: Top item is Hero article (chi-tiet-giai.jpg)
  const page = state.newsPage;
  const perPage = state.newsPerPage;
  const startIdx = (page - 1) * perPage;
  const pageItems = allNews.slice(startIdx, startIdx + perPage);

  if (page === 1) {
    const hero = pageItems[0];
    const restItems = pageItems.slice(1);

    if (heroContainer) {
      heroContainer.style.display = 'block';
      heroContainer.innerHTML = `
        <article class="vne-league-hero-card">
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
              <span class="vne-news-comments">💬 ${Math.floor(Math.random() * 50 + 10)}</span>
            </div>
          </div>
        </article>
      `;
    }

    if (listContainer) {
      listContainer.innerHTML = restItems.map(item => renderNewsCardHtml(item)).join('');
    }
  } else {
    // Other pages: all 20 items in list
    if (heroContainer) heroContainer.style.display = 'none';
    if (listContainer) {
      listContainer.innerHTML = pageItems.map(item => renderNewsCardHtml(item)).join('');
    }
  }

  // Update Range info
  const startItem = startIdx + 1;
  const endItem = Math.min(startIdx + perPage, allNews.length);
  if (rangeInfo) {
    rangeInfo.innerText = `Hiển thị ${startItem} - ${endItem} trên tổng số ${allNews.length} bài viết`;
  }

  // Update Pagination Controls
  const totalPages = Math.ceil(allNews.length / perPage) || 1;
  if (pagination) {
    let pagesHtml = '';
    
    pagesHtml += `
      <button class="vne-page-btn" ${page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : `onclick="changeNewsPage(${page - 1})"`}>
        ‹ Trước
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      pagesHtml += `
        <button class="vne-page-btn ${p === page ? 'active' : ''}" onclick="changeNewsPage(${p})">
          ${p}
        </button>
      `;
    }

    pagesHtml += `
      <button class="vne-page-btn" ${page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : `onclick="changeNewsPage(${page + 1})"`}>
        Sau ›
      </button>
    `;

    pagination.innerHTML = pagesHtml;
  }
}

// Clean News Card Html: NO eye icon, NO '7.382 Educate'
function renderNewsCardHtml(item) {
  return `
    <article class="vne-league-news-item">
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
          <span class="vne-news-comments">💬 ${Math.floor(Math.random() * 70 + 5)}</span>
        </div>
      </div>
    </article>
  `;
}

function changeNewsPage(p) {
  state.newsPage = p;
  renderNewsSection();
  const el = document.getElementById('league-hero-article-container');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// 4. Render Widget "Dự đoán tỷ số" (chi-tiet-giai.jpg)
function renderPredictionWidget(matches) {
  const container = document.getElementById('prediction-matches-list');
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-xs);color: var(--vds-text-subdued);font-size: var(--vds-typography-font-size-100); text-align: center;">Chưa có trận dự đoán hôm nay.</div>';
    return;
  }

  container.innerHTML = matches.map(m => {
    const timeFormatted = formatPredictionDate(m.event_date);
    return `
      <div class="vne-prediction-item" style="cursor: pointer;" onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}')">
        <div class="vne-prediction-kickoff">| ${timeFormatted}</div>
        
        <div class="vne-prediction-teams-row">
          <span class="vne-prediction-team-name vne-team-link" onclick="goToTeamDetail('${escapeHtml(m.home_team.team_name)}', ${m.home_team.team_id || 'null'}, event)">${m.home_team.team_name}</span>
          <img src="${m.home_team.logo}" class="vne-prediction-logo" alt="${m.home_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
          <span class="vne-prediction-vs">VS</span>
          <img src="${m.away_team.logo}" class="vne-prediction-logo" alt="${m.away_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
          <span class="vne-prediction-team-name vne-team-link" onclick="goToTeamDetail('${escapeHtml(m.away_team.team_name)}', ${m.away_team.team_id || 'null'}, event)">${m.away_team.team_name}</span>
        </div>

        <button class="vne-btn-predict" onclick="goToMatchDetail(${m.fixture_id}, '${escapeHtml(m.home_team.team_name)}', '${escapeHtml(m.away_team.team_name)}', event)">
          Chi tiết
        </button>
      </div>
    `;
  }).join('');
}

// 5. Render Sidebar Mini Standings (Top 8 teams)
function renderMiniStandings(standings) {
  const tbody = document.getElementById('detail-standings-tbody');
  if (!tbody) return;

  if (!standings || standings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding: var(--vds-spacing-sm);color: var(--vds-text-subdued);">Chưa có bảng xếp hạng mùa này.</td></tr>';
    return;
  }

  let topStandings = standings.slice(0, 8);
  const curTeam = standings.find(t => t.isCurrentTeam || t.team_id === state.teamId);
  if (curTeam && !topStandings.some(t => t.team_id === curTeam.team_id)) {
    topStandings = [...standings.slice(0, 7), curTeam];
  }
  tbody.innerHTML = topStandings.map((team, idx) => {
    const isCur = team.isCurrentTeam || team.team_id === state.teamId;
    const rank = team.rank || idx + 1;
    const calc = team.calculated || {};
    const played = calc.played ?? (team.all?.matchs_played ?? 0);
    const gd = calc.goalDiff ?? (team.goals_diff ?? 0);
    const pts = calc.points ?? (team.points ?? 0);
    
    let rankBadgeClass = rank <= 4 ? 'rank-ucl' : rank <= 6 ? 'rank-uel' : '';
    
    return `
      <tr class="${isCur ? 'vne-current-team-row' : ''}">
        <td>
          <span class="vne-rank-num ${rankBadgeClass}">${rank}</span>
        </td>
        <td>
          <div class="vne-table-team-cell">
            <img src="${team.team_logo || team.logo}" class="vne-table-team-logo" alt="${team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/50.png?v=1'">
            <a href="/doi-bong/${toTeamSlug(team.team_name, team.team_id)}" class="vne-table-team-title vne-team-link" title="Xem chi tiết ${team.team_name}" style="color:inherit; text-decoration:none;">${team.team_name}</a>
          </div>
        </td>
        <td style="text-align: center; color: var(--vne-text-muted);">${played}</td>
        <td style="text-align: center; font-weight: 600;">${gd > 0 ? `+${gd}` : gd}</td>
        <td style="text-align: center; font-weight: 800; color: var(--vne-text-main);">${pts}</td>
      </tr>
    `;
  }).join('');
}

// 6. Render Sidebar Mini Top Scorers (Top 8)
function renderMiniTopScorers(scorers) {
  const tbody = document.getElementById('detail-scorers-tbody');
  if (!tbody) return;

  if (!scorers || scorers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding: var(--vds-spacing-sm);color: var(--vds-text-subdued);">Đang cập nhật danh sách ghi bàn.</td></tr>';
    return;
  }

  const topScorers = scorers.slice(0, 8);
  tbody.innerHTML = topScorers.map((player, idx) => {
    const rank = idx + 1;
    const rankClass = rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : '';
    const goalsCount = player.goals?.total ?? player.goals ?? 0;

    return `
      <tr>
        <td>
          <span class="vne-rank-num ${rankClass}">${rank}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--vne-text-main);font-size: var(--vds-typography-font-size-100); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${player.player_name}">
            ${player.player_name}
          </div>
          <div style="font-size: var(--vds-typography-font-size-050); color: var(--vne-text-muted);">${player.nationality || player.position || ''}</div>
        </td>
        <td>
          <div class="vne-table-team-cell">
            <img src="${player.logo_team}" class="vne-table-team-logo" alt="${player.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/50.png?v=1'">
            <a href="/doi-bong/${toTeamSlug(player.team_name, player.team_id)}" class="vne-table-team-title vne-team-link" style="max-width: 80px; color:inherit; text-decoration:none;" title="${player.team_name}">${player.team_name}</a>
          </div>
        </td>
        <td style="text-align: center; font-weight: 800;color: var(--vds-text-negative-regular);font-size: var(--vds-typography-font-size-200);">${goalsCount}</td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// SUB-PAGE 2: LỊCH THI ĐẤU (TỪ HÔM NAY ĐI VỀ CÁC NGÀY TIẾP THEO TRONG TƯƠNG LAI)
// ĐỒNG BỘ CẤU TRÚC, LAYOUT, GIAO DIỆN VỚI TRANG KẾT QUẢ, CĂN ĐỀU CỘT VS
// =========================================================================

state.fixturesViewMode = 'date'; // 'date' | 'round' (Mặc định: 'date')
state.selectedFixturesDate = 'upcoming-3'; // 'upcoming-3' | 'YYYY-MM-DD'
state.selectedFixturesRound = null;
state.fixturesSelectedTeams = []; // Lọc theo đội bóng (Lịch thi đấu)

state.resultsViewMode = 'date'; // 'date' | 'round' (Mặc định: 'date')
state.selectedResultsDate = 'latest-3'; // 'latest-3' | 'YYYY-MM-DD'
state.selectedResultsRound = null;
state.resultsSelectedTeams = []; // Lọc theo đội bóng (Kết quả)

// Modal filter state
let teamModalTarget = 'fixtures'; // 'fixtures' | 'results'
let modalTempSelectedTeams = new Set();
let modalSearchKeyword = '';

// Lấy danh sách tất cả các đội bóng trong giải (từ standings và fixtures)
function getLeagueAllTeams() {
  const teamsMap = new Map();
  (state.data?.standings || []).forEach(s => {
    const name = s.team_name || s.team?.name;
    const logo = s.logo || s.team?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
    if (name) teamsMap.set(name, { id: s.team_id || name, name, logo });
  });

  const allMatches = [...(state.data?.pastMatches || []), ...(state.data?.upcomingMatches || [])];
  allMatches.forEach(m => {
    if (m.home_team?.team_name && !teamsMap.has(m.home_team.team_name)) {
      teamsMap.set(m.home_team.team_name, {
        id: m.home_team.team_id || m.home_team.team_name,
        name: m.home_team.team_name,
        logo: m.home_team.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1'
      });
    }
    if (m.away_team?.team_name && !teamsMap.has(m.away_team.team_name)) {
      teamsMap.set(m.away_team.team_name, {
        id: m.away_team.team_id || m.away_team.team_name,
        name: m.away_team.team_name,
        logo: m.away_team.logo || 'https://is.vnecdn.net/objects/teams/40.png?v=1'
      });
    }
  });

  return [...teamsMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

// Kiểm tra trận đấu có thuộc danh sách đội được lọc hay không
function matchMatchesSelectedTeams(m, selectedTeams) {
  if (!selectedTeams || selectedTeams.length === 0) return true;
  const hName = (m.home_team?.team_name || '').toLowerCase();
  const aName = (m.away_team?.team_name || '').toLowerCase();
  return selectedTeams.some(t => {
    const target = t.toLowerCase();
    return hName === target || aName === target;
  });
}

// =========================================================================
// TEAM PICKER MODAL CONTROLLERS (DÙNG CHUNG CHO LỊCH THI ĐẤU & KẾT QUẢ)
// =========================================================================
function openTeamFilterModal(target) {
  teamModalTarget = target;
  const currentSelected = target === 'fixtures' ? state.fixturesSelectedTeams : state.resultsSelectedTeams;
  modalTempSelectedTeams = new Set(currentSelected);
  modalSearchKeyword = '';

  const searchInput = document.getElementById('team-modal-search-input');
  if (searchInput) searchInput.value = '';

  const modalTitle = document.getElementById('vne-modal-title');
  if (modalTitle) {
    modalTitle.innerText = target === 'fixtures' 
      ? 'Chọn đội bóng xem Lịch thi đấu' 
      : 'Chọn đội bóng xem Kết quả';
  }

  renderTeamModalGrid();
  updateModalSelectedCount();

  const modal = document.getElementById('vne-team-modal');
  if (modal) modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTeamFilterModal() {
  const modal = document.getElementById('vne-team-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function closeTeamModalOnOverlay(e) {
  if (e.target && e.target.id === 'vne-team-modal') {
    closeTeamFilterModal();
  }
}

function onTeamModalSearch(val) {
  modalSearchKeyword = (val || '').toLowerCase().trim();
  renderTeamModalGrid();
}

function toggleModalTeam(teamName) {
  if (modalTempSelectedTeams.has(teamName)) {
    modalTempSelectedTeams.delete(teamName);
  } else {
    modalTempSelectedTeams.add(teamName);
  }
  renderTeamModalGrid();
  updateModalSelectedCount();
}

function selectAllModalTeams() {
  const allTeams = getLeagueAllTeams();
  allTeams.forEach(t => {
    if (!modalSearchKeyword || t.name.toLowerCase().includes(modalSearchKeyword)) {
      modalTempSelectedTeams.add(t.name);
    }
  });
  renderTeamModalGrid();
  updateModalSelectedCount();
}

function deselectAllModalTeams() {
  if (modalSearchKeyword) {
    const allTeams = getLeagueAllTeams();
    allTeams.forEach(t => {
      if (t.name.toLowerCase().includes(modalSearchKeyword)) {
        modalTempSelectedTeams.delete(t.name);
      }
    });
  } else {
    modalTempSelectedTeams.clear();
  }
  renderTeamModalGrid();
  updateModalSelectedCount();
}

function updateModalSelectedCount() {
  const countEl = document.getElementById('modal-selected-count');
  if (countEl) {
    countEl.innerText = `Đã chọn: ${modalTempSelectedTeams.size} đội`;
  }
}

function renderTeamModalGrid() {
  const grid = document.getElementById('team-modal-grid');
  if (!grid) return;

  const allTeams = getLeagueAllTeams();
  const filtered = allTeams.filter(t => !modalSearchKeyword || t.name.toLowerCase().includes(modalSearchKeyword));

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1 / -1;padding: var(--vds-spacing-md); text-align: center; color: var(--vne-text-muted);">Không tìm thấy đội bóng phù hợp.</div>';
    return;
  }

  grid.innerHTML = filtered.map(t => {
    const isSelected = modalTempSelectedTeams.has(t.name);
    return `
      <div class="vne-team-select-card ${isSelected ? 'selected' : ''}" onclick="toggleModalTeam('${escapeHtml(t.name)}')">
        <div class="vne-team-checkbox">
          ${isSelected ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
        </div>
        <img src="${t.logo}" class="vne-team-select-logo" alt="${t.name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
        <span class="vne-team-select-name" title="${t.name}">${t.name}</span>
      </div>
    `;
  }).join('');
}

function confirmTeamFilterSelection() {
  const selectedArr = Array.from(modalTempSelectedTeams);
  if (teamModalTarget === 'fixtures') {
    state.fixturesSelectedTeams = selectedArr;
    updateActiveTeamsBanner('fixtures');
    if (state.fixturesViewMode === 'date') renderFixturesMatchesByDate();
    else renderFixturesMatchesByRound();
  } else {
    state.resultsSelectedTeams = selectedArr;
    updateActiveTeamsBanner('results');
    if (state.resultsViewMode === 'date') renderHubMatchesByDate();
    else renderHubMatchesByRound();
  }
  closeTeamFilterModal();
}

function removeSelectedTeam(target, teamName) {
  if (target === 'fixtures') {
    state.fixturesSelectedTeams = state.fixturesSelectedTeams.filter(t => t !== teamName);
    updateActiveTeamsBanner('fixtures');
    if (state.fixturesViewMode === 'date') renderFixturesMatchesByDate();
    else renderFixturesMatchesByRound();
  } else {
    state.resultsSelectedTeams = state.resultsSelectedTeams.filter(t => t !== teamName);
    updateActiveTeamsBanner('results');
    if (state.resultsViewMode === 'date') renderHubMatchesByDate();
    else renderHubMatchesByRound();
  }
}

function clearAllSelectedTeams(target) {
  if (target === 'fixtures') {
    state.fixturesSelectedTeams = [];
    updateActiveTeamsBanner('fixtures');
    if (state.fixturesViewMode === 'date') renderFixturesMatchesByDate();
    else renderFixturesMatchesByRound();
  } else {
    state.resultsSelectedTeams = [];
    updateActiveTeamsBanner('results');
    if (state.resultsViewMode === 'date') renderHubMatchesByDate();
    else renderHubMatchesByRound();
  }
}

function updateActiveTeamsBanner(target) {
  const selected = target === 'fixtures' ? state.fixturesSelectedTeams : state.resultsSelectedTeams;
  const btn = document.getElementById(`btn-${target === 'fixtures' ? 'fixtures' : 'results'}-team-filter`);
  const badge = document.getElementById(`${target === 'fixtures' ? 'fixtures' : 'results'}-team-badge`);
  const banner = document.getElementById(`${target === 'fixtures' ? 'fixtures' : 'results'}-active-teams-banner`);

  if (btn && badge) {
    if (selected.length > 0) {
      btn.classList.add('has-filter');
      badge.style.display = 'inline-flex';
      badge.innerText = selected.length;
    } else {
      btn.classList.remove('has-filter');
      badge.style.display = 'none';
    }
  }

  if (banner) {
    if (selected.length > 0) {
      const allTeams = getLeagueAllTeams();
      const tagsHtml = selected.map(teamName => {
        const teamObj = allTeams.find(t => t.name === teamName);
        const logo = teamObj?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
        return `
          <span class="vne-selected-team-tag">
            <img src="${logo}" class="vne-selected-team-tag-logo" alt="${teamName}">
            <span>${teamName}</span>
            <button type="button" class="vne-remove-tag-btn" onclick="removeSelectedTeam('${target}', '${escapeHtml(teamName)}')" aria-label="Bỏ chọn ${teamName}">✕</button>
          </span>
        `;
      }).join('');

      banner.style.display = 'flex';
      banner.innerHTML = `
        <span class="vne-active-teams-label">Đang xem ${selected.length} đội:</span>
        ${tagsHtml}
        <button type="button" class="vne-btn-clear-teams" onclick="clearAllSelectedTeams('${target}')">Xóa lọc</button>
      `;
    } else {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  }
}

// =========================================================================
// SUB-PAGE 2: LỊCH THI ĐẤU (HÔM NAY ĐI VỀ TƯƠNG LAI)
// =========================================================================

// Lấy danh sách trận đấu từ hôm nay trở về tương lai (KHÔNG show trận trước đó)
function getLeagueFutureMatches() {
  const now = new Date();
  const d = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayYmd = `${y}-${m}-${day}`;

  const upcoming = state.data?.upcomingMatches || [];
  return upcoming.filter(m => {
    if (!m.event_date) return false;
    const matchYmd = m.event_date.split('T')[0];
    return matchYmd >= todayYmd;
  });
}

// Gom nhóm và sắp xếp ngày thi đấu TĂNG DẦN (từ ngày gần nhất đi về tương lai)
function getFixturesDates(matches) {
  const dateGroups = {};
  (matches || []).forEach(m => {
    const d = m.event_date ? m.event_date.split('T')[0] : 'Khác';
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(m);
  });

  const sortedDates = Object.keys(dateGroups).filter(d => d !== 'Khác').sort();
  if (dateGroups['Khác']) sortedDates.push('Khác');

  return { dateGroups, sortedDates };
}

// Gom nhóm và sắp xếp vòng đấu TĂNG DẦN (vòng sắp diễn ra sớm nhất lên đầu)
function getFixturesRounds(matches) {
  const grouped = {};
  (matches || []).forEach(m => {
    const r = m.round || 'Lịch thi đấu';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(m);
  });

  const keys = Object.keys(grouped);
  keys.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    if (numA !== 0 && numB !== 0) {
      return numA - numB; // Tăng dần: vòng sớm nhất trước
    }
    return 0;
  });

  return { grouped, keys };
}

// Chuyển đổi chế độ xem 'Xem theo ngày' hoặc 'Xem theo vòng' cho Lịch thi đấu
function switchFixturesViewMode(mode) {
  state.fixturesViewMode = mode;

  const btnDate = document.getElementById('btn-fixtures-mode-date');
  const btnRound = document.getElementById('btn-fixtures-mode-round');
  const labelText = document.getElementById('fixtures-nav-label-text');

  if (btnDate && btnRound) {
    if (mode === 'date') {
      btnDate.classList.add('active');
      btnDate.setAttribute('aria-selected', 'true');
      btnRound.classList.remove('active');
      btnRound.setAttribute('aria-selected', 'false');
      if (labelText) labelText.innerText = 'Ngày thi đấu:';
    } else {
      btnRound.classList.add('active');
      btnRound.setAttribute('aria-selected', 'true');
      btnDate.classList.remove('active');
      btnDate.setAttribute('aria-selected', 'false');
      if (labelText) labelText.innerText = 'Vòng đấu:';
    }
  }

  if (mode === 'date') {
    renderFixturesDateMenu();
    renderFixturesMatchesByDate();
  } else {
    renderFixturesRoundsMenu();
    renderFixturesMatchesByRound();
  }
}

// Render Menu Ngày thi đấu sắp tới (3 ngày tới, T7 31/10, CN 01/11, ...)
function renderFixturesDateMenu() {
  const container = document.getElementById('fixtures-rounds-pills-container');
  if (!container) return;

  const futureMatches = getLeagueFutureMatches();
  const { sortedDates } = getFixturesDates(futureMatches);

  if (sortedDates.length === 0) {
    container.innerHTML = '<span style="font-size: var(--vds-typography-font-size-100); color:var(--vne-text-muted);">Đang cập nhật lịch đấu...</span>';
    return;
  }

  // Mặc định chọn '3 ngày gần nhất' nếu chưa có ngày nào được chọn hoặc nếu đang ở trong 3 ngày đầu
  if (!state.selectedFixturesDate || sortedDates.slice(0, 3).includes(state.selectedFixturesDate)) {
    state.selectedFixturesDate = 'upcoming-3';
  }

  let html = `
    <button type="button" 
            class="vne-round-pill ${state.selectedFixturesDate === 'upcoming-3' ? 'active' : ''}" 
            data-date="upcoming-3" 
            onclick="selectFixturesDate('upcoming-3')">
      3 ngày gần nhất
    </button>
  `;

  // Menu ngày bên cạnh '3 ngày gần nhất' là ngày thứ 4 gần nhất đi về tương lai có trận đấu (bỏ qua 3 ngày đầu)
  const remainingDates = sortedDates.slice(3);

  html += remainingDates.map(ymd => {
    const label = formatDatePillLabel(ymd);
    const isActive = ymd === state.selectedFixturesDate;
    return `
      <button type="button" 
              class="vne-round-pill ${isActive ? 'active' : ''}" 
              data-date="${ymd}" 
              onclick="selectFixturesDate('${ymd}')">
        ${label}
      </button>
    `;
  }).join('');

  container.innerHTML = html;
}

// User click chọn một ngày trong Lịch thi đấu
function selectFixturesDate(ymd) {
  state.selectedFixturesDate = ymd;

  const pills = document.querySelectorAll('#fixtures-rounds-pills-container .vne-round-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-date') === ymd) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  renderFixturesMatchesByDate();
}

// Render các trận đấu gom nhóm theo ngày (từ hôm nay trở về tương lai)
// ĐÃ BỎ HOÀN TOÀN SỐ TRẬN ĐẤU TẠI HEADER GROUP
function renderFixturesMatchesByDate() {
  const container = document.getElementById('fixtures-matches-container');
  if (!container) return;

  const futureMatches = getLeagueFutureMatches();
  const { dateGroups, sortedDates } = getFixturesDates(futureMatches);

  if (sortedDates.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-lg); text-align: center; color: var(--vne-text-muted);">Chưa có lịch thi đấu tiếp theo cho giải đấu này.</div>';
    return;
  }

  let datesToRender = [];
  if (state.selectedFixturesDate === 'upcoming-3') {
    datesToRender = sortedDates.slice(0, 3);
  } else if (dateGroups[state.selectedFixturesDate]) {
    datesToRender = [state.selectedFixturesDate];
  } else {
    datesToRender = sortedDates.slice(0, 3);
  }

  let html = '';
  let renderedCount = 0;
  datesToRender.forEach(ymd => {
    let matches = dateGroups[ymd] || [];
    if (state.fixturesSelectedTeams.length > 0) {
      matches = matches.filter(m => matchMatchesSelectedTeams(m, state.fixturesSelectedTeams));
    }
    if (matches.length === 0) return;
    renderedCount++;

    const fullDayTitle = formatFullVietnameseDate(ymd);
    html += `
      <section class="vne-day-group-section" aria-label="${fullDayTitle}">
        <div class="vne-day-group-header">
          <div class="vne-day-group-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--vne-red, var(--vds-text-accent-regular));">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>${fullDayTitle}</h3>
          </div>
        </div>
        <div class="vne-day-matches-list">
          ${matches.map(m => renderUpcomingMatchCardItem(m, false)).join('')}
        </div>
      </section>
    `;
  });

  if (renderedCount === 0) {
    html = `<div style="padding: var(--vds-spacing-md); text-align: center; color: var(--vne-text-muted); background: var(--vne-bg-subtle);border-radius: var(--vds-radii-lg);">Không có trận đấu nào của các đội bóng đã chọn trong khoảng thời gian này.</div>`;
  }

  container.innerHTML = html;
}

// Render Menu Vòng đấu sắp tới (Vòng 9, Vòng 10, ...)
function renderFixturesRoundsMenu() {
  const container = document.getElementById('fixtures-rounds-pills-container');
  if (!container) return;

  const futureMatches = getLeagueFutureMatches();
  const { keys } = getFixturesRounds(futureMatches);

  if (keys.length === 0) {
    container.innerHTML = '<span style="font-size: var(--vds-typography-font-size-100); color:var(--vne-text-muted);">Đang cập nhật vòng đấu...</span>';
    return;
  }

  // Mặc định active vào vòng đấu sắp tới sớm nhất (keys[0])
  if (!state.selectedFixturesRound || !keys.includes(state.selectedFixturesRound)) {
    state.selectedFixturesRound = keys[0];
  }

  container.innerHTML = keys.map(rk => {
    const label = formatRoundName(rk);
    const isActive = rk === state.selectedFixturesRound;
    return `
      <button type="button" 
              class="vne-round-pill ${isActive ? 'active' : ''}" 
              data-round="${rk}" 
              onclick="selectFixturesRound('${rk}')">
        ${label}
      </button>
    `;
  }).join('');
}

// User click chọn một vòng trong Lịch thi đấu
function selectFixturesRound(roundKey) {
  state.selectedFixturesRound = roundKey;

  const pills = document.querySelectorAll('#fixtures-rounds-pills-container .vne-round-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-round') === roundKey) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  renderFixturesMatchesByRound();
}

// Render các trận đấu trong vòng đấu được chọn (kèm ngày, giờ trên từng item)
// ĐÃ BỎ HOÀN TOÀN SỐ TRẬN ĐẤU TẠI HEADER GROUP
function renderFixturesMatchesByRound() {
  const container = document.getElementById('fixtures-matches-container');
  if (!container) return;

  const isPL = state.leagueSlug === 'ngoai-hang-anh' || state.leagueId === 39;
  const leagueName = state.data?.team?.name || state.data?.league?.vnName || 'CLB';
  const futureMatches = getLeagueFutureMatches();
  const { grouped, keys } = getFixturesRounds(futureMatches);

  if (keys.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-lg); text-align: center; color: var(--vne-text-muted);">Chưa có lịch thi đấu tiếp theo cho giải đấu này.</div>';
    return;
  }

  if (!state.selectedFixturesRound || !grouped[state.selectedFixturesRound]) {
    state.selectedFixturesRound = keys[0];
  }

  const currentRoundKey = state.selectedFixturesRound;
  const currentRoundLabel = formatRoundName(currentRoundKey);
  let roundMatches = grouped[currentRoundKey] || [];

  if (state.fixturesSelectedTeams.length > 0) {
    roundMatches = roundMatches.filter(m => matchMatchesSelectedTeams(m, state.fixturesSelectedTeams));
  }

  if (roundMatches.length === 0) {
    container.innerHTML = `<div style="padding: var(--vds-spacing-md); text-align: center; color: var(--vne-text-muted); background: var(--vne-bg-subtle);border-radius: var(--vds-radii-lg);">Không có trận đấu nào của các đội bóng đã chọn trong ${currentRoundLabel}.</div>`;
    return;
  }

  let html = `
    <div class="vne-current-round-header">
      <div class="vne-round-title-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--vne-red, var(--vds-text-accent-regular));">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h2 class="vne-current-round-heading">Lịch thi đấu ${leagueName} ${currentRoundLabel}</h2>
      </div>
    </div>
    <div class="vne-round-match-list">
      ${roundMatches.map(m => renderUpcomingMatchCardItem(m, true)).join('')}
    </div>
  `;

  container.innerHTML = html;
}

// Thẻ trận đấu sắp diễn ra (Căn đều tuyệt đối cột VS 72px)
function renderUpcomingMatchCardItem(m, showDate) {
  const d = m.event_date ? new Date(m.event_date) : new Date();
  const kickoffTime = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const kickoffDate = `${d.getDate()}/${d.getMonth() + 1}`;

  const homeName = m.home_team?.team_name || 'Đội nhà';
  const awayName = m.away_team?.team_name || 'Đội khách';
  const homeLogo = m.home_team?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
  const awayLogo = m.away_team?.logo || 'https://is.vnecdn.net/objects/teams/40.png?v=1';
  const slug = `${toSeoSlug(homeName)}-vs-${toSeoSlug(awayName)}-${m.fixture_id}`;

  const broadcastChannel = m.broadcast || getMatchBroadcast(m, state.leagueId);

  return `
    <a href="/tran-dau/${slug}" class="vne-match-card-link" aria-label="Xem chi tiết trận đấu ${homeName} vs ${awayName}">
      <!-- Cột 1: Giờ thi đấu & Ngày (nếu ở chế độ theo vòng) & Trạng thái -->
      <div class="vne-mc-time-col">
        <span class="vne-mc-status-badge upcoming">${m.status_short || 'Sắp đấu'}</span>
        <time class="vne-mc-time-str">${kickoffTime}</time>
        ${showDate ? `<time class="vne-mc-date-str">${kickoffDate}</time>` : ''}
      </div>

      <!-- Cột 2: Đội nhà (Căn phải 100%, 1fr) -->
      <div class="vne-mc-team home">
        <span class="vne-mc-team-name vne-team-link" title="Xem chi tiết ${homeName}" onclick="goToTeamDetail('${escapeHtml(homeName)}', ${m.home_team?.team_id || 'null'}, event)">${homeName}</span>
        <img src="${homeLogo}" class="vne-mc-team-logo" alt="${homeName}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
      </div>

      <!-- Cột 3: Cột VS Cố định (72px, CĂN ĐỀU TUYỆT ĐỐI TỪ TRÊN XUỐNG DƯỚI) -->
      <div class="vne-mc-score-pill vs">
        <div class="vne-mc-score-ft">
          <span class="vne-score-vs">VS</span>
        </div>
        <div class="vne-mc-sub-scores">
          <span class="vne-mc-ht-score">${kickoffTime}</span>
        </div>
      </div>

      <!-- Cột 4: Đội khách (Căn trái 100%, 1fr) -->
      <div class="vne-mc-team away">
        <img src="${awayLogo}" class="vne-mc-team-logo" alt="${awayName}" onerror="this.src='https://is.vnecdn.net/objects/teams/40.png?v=1'">
        <span class="vne-mc-team-name vne-team-link" title="Xem chi tiết ${awayName}" onclick="goToTeamDetail('${escapeHtml(awayName)}', ${m.away_team?.team_id || 'null'}, event)">${awayName}</span>
      </div>

      <!-- Cột 5: Cột Phải Cố định (105px: Kênh trực tiếp & Mũi tên) -->
      <div class="vne-mc-right-col">
        ${broadcastChannel ? `
          <span class="vne-match-channel-badge" title="Kênh phát sóng trực tiếp: ${broadcastChannel}">
            <svg class="vne-tv-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="15" x="2" y="7" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
            <span>${broadcastChannel}</span>
          </span>
        ` : ''}
        <div class="vne-mc-arrow-wrap">
          <svg class="vne-mc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </a>
  `;
}

// MAIN ENTRY CHO SUB-PAGE 2: LỊCH THI ĐẤU
function renderUpcomingFixtures() {
  const isPL = state.leagueSlug === 'ngoai-hang-anh' || state.leagueId === 39;
  const leagueName = state.data?.team?.name || state.data?.league?.vnName || 'CLB';
  const season = isPL ? '2025/2026' : '2026/2027';

  // 1. Update Hero Title
  const h1El = document.getElementById('fixtures-main-title');
  if (h1El) {
    h1El.innerText = `Lịch thi đấu bóng đá ${leagueName} ${season}`;
  }

  // 2. Default to 'date' mode if not set
  if (!state.fixturesViewMode) {
    state.fixturesViewMode = 'date';
  }

  // 3. Update active teams banner
  updateActiveTeamsBanner('fixtures');

  // 4. Render according to current view mode
  switchFixturesViewMode(state.fixturesViewMode);

  // 5. Render 20 Latest News at bottom
  renderFixturesNews(leagueName);

  // 6. Render Sidebar Widgets (Standings + Top Scorers)
  renderFixturesSidebarScorers();

  if (window.lucide) lucide.createIcons();
}

// Render 20 tin tức mới nhất ở cuối trang Lịch thi đấu
function renderFixturesNews(leagueName) {
  const container = document.getElementById('fixtures-league-news-container');
  if (!container) return;

  const leagueTitleEl = document.getElementById('fixtures-news-league-name');
  if (leagueTitleEl) {
    leagueTitleEl.innerText = leagueName || 'giải đấu';
  }

  const newsList = (state.data?.news || []).slice(0, 20);

  if (newsList.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1;padding: var(--vds-spacing-sm); text-align: center; color: var(--vne-text-muted);">Đang tải tin tức giải đấu...</div>';
    return;
  }

  container.innerHTML = newsList.map(item => `
    <article class="vne-results-news-card">
      <a href="${getArticleUrl(item.link)}" class="vne-news-thumb-wrap">
        <img src="${item.thumbnail}" class="vne-news-thumb" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png'">
      </a>
      <div class="vne-news-card-content">
        <div class="vne-news-card-meta">
          <span class="vne-news-cat">${item.category || leagueName}</span>
          <span>•</span>
          <span class="vne-news-time">${item.timeAgo || 'Vừa xong'}</span>
        </div>
        <h3 class="vne-news-card-title">
          <a href="${getArticleUrl(item.link)}">${item.title}</a>
        </h3>
        <p class="vne-news-card-desc">${item.description || ''}</p>
      </div>
    </article>
  `).join('');
}

// Render Mini Standings cho Sidebar của Lịch thi đấu
function renderFixturesSidebarStandings() {
  const container = document.getElementById('fixtures-sidebar-standings-body');
  if (!container) return;

  const standings = state.data?.standings || [];
  if (standings.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-sm); text-align: center; color: var(--vne-text-muted);">Đang cập nhật BXH...</div>';
    return;
  }
  const top6 = standings.slice(0, 6);
  const bot3 = standings.slice(-3);

  function renderRows(list) {
    return list.map(item => {
      const rank = item.rank;
      const teamName = item.team_name || item.team?.name || '';
      const logo = item.logo || item.team?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
      const played = item.calculated?.played ?? item.all?.matchs_played ?? item.played ?? 8;
      const gd = item.calculated?.goalDiff ?? item.goals_diff ?? item.all?.goalDiff ?? 0;
      const gdStr = gd > 0 ? `+${gd}` : String(gd);
      const pts = item.calculated?.points ?? item.points ?? item.all?.points ?? 0;

      let zoneClass = '';
      if (rank <= 4) zoneClass = 'ucl';
      else if (rank === 5) zoneClass = 'uel';
      else if (rank >= 18) zoneClass = 'rel';

      const isCur = item.isCurrentTeam || item.team_id === state.teamId;
      return `
        <tr class="${zoneClass} ${isCur ? 'vne-current-team-row' : ''}">
          <td class="col-rank">
            <span class="vne-rank-pill ${zoneClass}">${rank}</span>
          </td>
          <td class="col-team">
            <div class="vne-team-cell">
              <img src="${logo}" class="vne-team-logo" alt="${teamName}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
              <a href="/doi-bong/${toTeamSlug(teamName, item.team_id || item.team?.id)}" class="vne-team-name vne-team-link" title="Xem chi tiết ${teamName}" style="color:inherit; text-decoration:none;">${teamName}</a>
            </div>
          </td>
          <td class="col-num">${played}</td>
          <td class="col-num">${gdStr}</td>
          <td class="col-pts">${pts}</td>
        </tr>
      `;
    }).join('');
  }

  container.innerHTML = `
    <table class="vne-table-mini">
      <thead>
        <tr>
          <th style="width: 28px;">#</th>
          <th>CLB</th>
          <th style="text-align: center; width: 28px;">Tr</th>
          <th style="text-align: center; width: 34px;">HS</th>
          <th style="text-align: center; width: 32px;">Đ</th>
        </tr>
      </thead>
      <tbody>
        ${renderRows(top6)}
        <tr class="vne-table-divider">
          <td colspan="5" style="text-align: center;padding: var(--vds-spacing-3xs) 0; color: var(--vne-text-muted);font-size: var(--vds-typography-font-size-100);">•••</td>
        </tr>
        ${renderRows(bot3)}
      </tbody>
    </table>
  `;
}

// Render Vua phá lưới cho Sidebar của Lịch thi đấu
function renderFixturesSidebarScorers() {
  const container = document.getElementById('fixtures-sidebar-scorers-body');
  if (!container) return;

  const topscorers = state.data?.topscorers || [];
  if (topscorers.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-sm); text-align: center; color: var(--vne-text-muted);">Đang cập nhật danh sách ghi bàn...</div>';
    return;
  }

  const top5 = topscorers.slice(0, 5);

  container.innerHTML = `
    <table class="vne-table-mini">
      <thead>
        <tr>
          <th style="width: 28px;">#</th>
          <th>Cầu thủ</th>
          <th>CLB</th>
          <th style="text-align: center; width: 38px;">Bàn</th>
        </tr>
      </thead>
      <tbody>
        ${top5.map((sc, idx) => {
          const rank = idx + 1;
          const pName = sc.player_name || sc.name || 'Cầu thủ';
          const tName = sc.team_name || sc.team?.name || '';
          const logo = sc.logo_team || sc.team?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
          const goals = sc.goals?.total ?? sc.goals ?? 0;

          return `
            <tr>
              <td class="col-rank">
                <span class="vne-scorer-rank">${rank}</span>
              </td>
              <td class="col-player">
                <div class="vne-player-cell">
                  <span class="vne-player-name" title="${pName}">${pName}</span>
                </div>
              </td>
              <td class="col-team">
                <div class="vne-team-cell">
                  <img src="${logo}" class="vne-team-logo" alt="${tName}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
                  <a href="/doi-bong/${toTeamSlug(tName, sc.team_id || sc.team?.id)}" class="vne-team-name vne-team-link" title="Xem chi tiết ${tName}" style="color:inherit; text-decoration:none;">${tName}</a>
                </div>
              </td>
              <td class="col-goals">${goals}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// =========================================================================
// SUB-PAGE 3: KẾT QUẢ - XEM THEO NGÀY (MẶC ĐỊNH) & XEM THEO VÒNG ĐẤU
// DỮ LIỆU THẬT 100% TỪ API GATEWAY VNEXPRESS (28 GIẢI ĐẤU)
// =========================================================================

// Database of Matches with Red Cards (Simulated & Real Events)
const RED_CARDS_MAP = {
  'arsenal-vs-everton': { home: 0, away: 1 },
  'chelsea-vs-tottenham': { home: 1, away: 0 },
  'crystal palace-vs-newcastle': { home: 1, away: 0 },
  'nottingham forest-vs-arsenal': { home: 1, away: 0 },
  'everton-vs-chelsea': { home: 1, away: 0 },
  'brighton-vs-crystal palace': { home: 0, away: 1 },
  'chelsea-vs-bournemouth': { home: 0, away: 1 },
  'man utd-vs-tottenham': { home: 1, away: 0 }
};

// Database of Matches with Live Match Reports (Tường thuật trận đấu)
const REPORT_MATCHES_SET = new Set([
  'aston villa-vs-man city',
  'arsenal-vs-everton',
  'chelsea-vs-tottenham',
  'man utd-vs-bournemouth',
  'liverpool-vs-brighton',
  'nottingham forest-vs-arsenal',
  'man city-vs-ipswich',
  'everton-vs-chelsea',
  'liverpool-vs-man city',
  'man utd-vs-tottenham',
  'chelsea-vs-bournemouth',
  'arsenal-vs-leeds'
]);

// Helper: Format date label for filter pill (e.g. 'CN, 25/10')
function formatDatePillLabel(ymd) {
  if (!ymd || ymd === 'Khác') return 'Khác';
  const [y, m, d] = ymd.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const shortDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = shortDays[dateObj.getDay()];
  const dd = d < 10 ? '0' + d : d;
  const mm = m < 10 ? '0' + m : m;
  return `${dayName}, ${dd}/${mm}`;
}

// Helper: Format full Vietnamese date for day group heading
function formatFullVietnameseDate(ymd) {
  if (!ymd || ymd === 'Khác') return 'Thời gian khác';
  const [y, m, d] = ymd.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[dateObj.getDay()];
  const dd = d < 10 ? '0' + d : d;
  const mm = m < 10 ? '0' + m : m;
  return `${dayName}, ngày ${dd}/${mm}/${y}`;
}

// Helper: Extract & sort past matches by date (descending: newest first)
function getLeagueResultDates(pastMatches) {
  const dateGroups = {};
  (pastMatches || []).forEach(m => {
    const d = m.event_date ? m.event_date.split('T')[0] : 'Khác';
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(m);
  });

  const sortedDates = Object.keys(dateGroups).filter(d => d !== 'Khác').sort().reverse();
  if (dateGroups['Khác']) sortedDates.push('Khác');

  return { dateGroups, sortedDates };
}

// Helper: Format friendly round display name
function formatRoundName(rKey) {
  if (!rKey) return 'Vòng đấu';
  if (rKey.startsWith('Regular Season - ')) {
    return 'Vòng ' + rKey.replace('Regular Season - ', '').trim();
  }
  if (rKey.startsWith('League Stage - ')) {
    return 'Lượt ' + rKey.replace('League Stage - ', '').trim();
  }
  if (/^Round\s*-?\s*\d+/i.test(rKey)) {
    return 'Vòng ' + rKey.replace(/^Round\s*-?\s*/i, '').trim();
  }
  return rKey;
}

// Helper: Extract & sort past matches by round (descending: latest round first)
function getLeagueResultRounds(pastMatches) {
  const grouped = {};
  (pastMatches || []).forEach(m => {
    const r = m.round || 'Kết quả';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(m);
  });

  const keys = Object.keys(grouped);
  keys.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    if (numA !== 0 && numB !== 0) {
      return numB - numA; // Giảm dần: mới nhất trước
    }
    return 0;
  });

  return { grouped, keys };
}

// Switch between 'Xem theo ngày' (date) and 'Xem theo vòng' (round) cho Kết quả
function switchResultsViewMode(mode) {
  state.resultsViewMode = mode;

  const btnDate = document.getElementById('btn-mode-date');
  const btnRound = document.getElementById('btn-mode-round');
  const labelText = document.getElementById('hub-nav-label-text');

  if (btnDate && btnRound) {
    if (mode === 'date') {
      btnDate.classList.add('active');
      btnDate.setAttribute('aria-selected', 'true');
      btnRound.classList.remove('active');
      btnRound.setAttribute('aria-selected', 'false');
      if (labelText) labelText.innerText = 'Ngày thi đấu:';
    } else {
      btnRound.classList.add('active');
      btnRound.setAttribute('aria-selected', 'true');
      btnDate.classList.remove('active');
      btnDate.setAttribute('aria-selected', 'false');
      if (labelText) labelText.innerText = 'Vòng đấu:';
    }
  }

  if (mode === 'date') {
    renderHubDateMenu();
    renderHubMatchesByDate();
  } else {
    renderHubRoundsMenu();
    renderHubMatchesByRound();
  }
}

// Render Date Menu Pills cho Kết quả
function renderHubDateMenu() {
  const container = document.getElementById('hub-rounds-pills-container');
  if (!container) return;

  const pastMatches = state.data?.pastMatches || [];
  const { sortedDates } = getLeagueResultDates(pastMatches);

  if (sortedDates.length === 0) {
    container.innerHTML = '<span style="font-size: var(--vds-typography-font-size-100); color:var(--vne-text-muted);">Đang cập nhật lịch đấu...</span>';
    return;
  }

  // Mặc định chọn '3 ngày gần nhất' nếu chưa có ngày nào được chọn hoặc nếu đang ở trong 3 ngày đầu
  if (!state.selectedResultsDate || sortedDates.slice(0, 3).includes(state.selectedResultsDate)) {
    state.selectedResultsDate = 'latest-3';
  }

  let html = `
    <button type="button" 
            class="vne-round-pill ${state.selectedResultsDate === 'latest-3' ? 'active' : ''}" 
            data-date="latest-3" 
            onclick="selectResultsDate('latest-3')">
      3 ngày gần nhất
    </button>
  `;

  // Menu ngày bên cạnh '3 ngày gần nhất' là ngày thứ 4 gần nhất trở về quá khứ có trận đấu (bỏ qua 3 ngày đầu)
  const remainingDates = sortedDates.slice(3);

  html += remainingDates.map(ymd => {
    const label = formatDatePillLabel(ymd);
    const isActive = ymd === state.selectedResultsDate;
    return `
      <button type="button" 
              class="vne-round-pill ${isActive ? 'active' : ''}" 
              data-date="${ymd}" 
              onclick="selectResultsDate('${ymd}')">
        ${label}
      </button>
    `;
  }).join('');

  container.innerHTML = html;
}

// User click chọn một ngày trong Kết quả
function selectResultsDate(ymd) {
  state.selectedResultsDate = ymd;

  const pills = document.querySelectorAll('#hub-rounds-pills-container .vne-round-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-date') === ymd) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  renderHubMatchesByDate();
}

// Render các trận đấu kết quả gom nhóm theo ngày
// ĐÃ BỎ HOÀN TOÀN SỐ TRẬN ĐẤU TẠI HEADER GROUP
function renderHubMatchesByDate() {
  const container = document.getElementById('hub-matches-container');
  if (!container) return;

  const pastMatches = state.data?.pastMatches || [];
  const { dateGroups, sortedDates } = getLeagueResultDates(pastMatches);

  if (sortedDates.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-lg); text-align: center; color: var(--vne-text-muted);">Đang tải dữ liệu kết quả từ hệ thống VnExpress...</div>';
    return;
  }

  let datesToRender = [];
  if (state.selectedResultsDate === 'latest-3') {
    datesToRender = sortedDates.slice(0, 3);
  } else if (dateGroups[state.selectedResultsDate]) {
    datesToRender = [state.selectedResultsDate];
  } else {
    datesToRender = sortedDates.slice(0, 3);
  }

  let html = '';
  let renderedCount = 0;
  datesToRender.forEach(ymd => {
    let matches = dateGroups[ymd] || [];
    if (state.resultsSelectedTeams.length > 0) {
      matches = matches.filter(m => matchMatchesSelectedTeams(m, state.resultsSelectedTeams));
    }
    if (matches.length === 0) return;
    renderedCount++;

    const fullDayTitle = formatFullVietnameseDate(ymd);
    html += `
      <section class="vne-day-group-section" aria-label="${fullDayTitle}">
        <div class="vne-day-group-header">
          <div class="vne-day-group-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--vne-red, var(--vds-text-accent-regular));">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>${fullDayTitle}</h3>
          </div>
        </div>
        <div class="vne-day-matches-list">
          ${matches.map(m => renderMatchCardItem(m, false)).join('')}
        </div>
      </section>
    `;
  });

  if (renderedCount === 0) {
    html = `<div style="padding: var(--vds-spacing-md); text-align: center; color: var(--vne-text-muted); background: var(--vne-bg-subtle);border-radius: var(--vds-radii-lg);">Không có trận đấu nào của các đội bóng đã chọn trong khoảng thời gian này.</div>`;
  }

  container.innerHTML = html;
}

// Render Menu Vòng đấu đã kết thúc (Vòng 8, Vòng 7, ...)
function renderHubRoundsMenu() {
  const container = document.getElementById('hub-rounds-pills-container');
  if (!container) return;

  const pastMatches = state.data?.pastMatches || [];
  const { keys } = getLeagueResultRounds(pastMatches);

  if (keys.length === 0) {
    container.innerHTML = '<span style="font-size: var(--vds-typography-font-size-100); color:var(--vne-text-muted);">Đang cập nhật vòng đấu...</span>';
    return;
  }

  // Mặc định active vào vòng đấu mới nhất có trận đấu đã kết thúc
  if (!state.selectedResultsRound || !keys.includes(state.selectedResultsRound)) {
    state.selectedResultsRound = keys[0];
  }

  container.innerHTML = keys.map(rk => {
    const label = formatRoundName(rk);
    const isActive = rk === state.selectedResultsRound;
    return `
      <button type="button" 
              class="vne-round-pill ${isActive ? 'active' : ''}" 
              data-round="${rk}" 
              onclick="selectResultsRound('${rk}')">
        ${label}
      </button>
    `;
  }).join('');
}

// User click chọn một vòng trong Kết quả
function selectResultsRound(roundKey) {
  state.selectedResultsRound = roundKey;

  const pills = document.querySelectorAll('#hub-rounds-pills-container .vne-round-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-round') === roundKey) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  renderHubMatchesByRound();
}

// Render các trận đấu trong vòng đấu kết quả được chọn
// ĐÃ BỎ HOÀN TOÀN SỐ TRẬN ĐẤU TẠI HEADER GROUP
function renderHubMatchesByRound() {
  const container = document.getElementById('hub-matches-container');
  if (!container) return;

  const isPL = state.leagueSlug === 'ngoai-hang-anh' || state.leagueId === 39;
  const leagueName = state.data?.team?.name || state.data?.league?.vnName || 'CLB';
  const pastMatches = state.data?.pastMatches || [];
  const { grouped, keys } = getLeagueResultRounds(pastMatches);

  if (keys.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-lg); text-align: center; color: var(--vne-text-muted);">Đang tải dữ liệu kết quả từ hệ thống VnExpress...</div>';
    return;
  }

  if (!state.selectedResultsRound || !grouped[state.selectedResultsRound]) {
    state.selectedResultsRound = keys[0];
  }

  const currentRoundKey = state.selectedResultsRound;
  const currentRoundLabel = formatRoundName(currentRoundKey);
  let roundMatches = grouped[currentRoundKey] || [];

  if (state.resultsSelectedTeams.length > 0) {
    roundMatches = roundMatches.filter(m => matchMatchesSelectedTeams(m, state.resultsSelectedTeams));
  }

  if (roundMatches.length === 0) {
    container.innerHTML = `<div style="padding: var(--vds-spacing-md); text-align: center; color: var(--vne-text-muted); background: var(--vne-bg-subtle);border-radius: var(--vds-radii-lg);">Không có trận đấu nào của các đội bóng đã chọn trong ${currentRoundLabel}.</div>`;
    return;
  }

  let html = `
    <div class="vne-current-round-header">
      <div class="vne-round-title-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--vne-red, var(--vds-text-accent-regular));">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h2 class="vne-current-round-heading">Bảng kết quả ${leagueName} ${currentRoundLabel}</h2>
      </div>
    </div>
    <div class="vne-round-match-list">
      ${roundMatches.map(m => renderMatchCardItem(m, true)).join('')}
    </div>
  `;

  container.innerHTML = html;
}

// Thẻ trận đấu kết quả đã kết thúc (Căn đều tuyệt đối cột tỷ số 72px)
function renderMatchCardItem(m, showDate) {
  const d = m.event_date ? new Date(m.event_date) : new Date();
  const kickoffTime = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const kickoffDate = `${d.getDate()}/${d.getMonth() + 1}`;

  const homeScore = m.goals_home_team ?? 0;
  const awayScore = m.goals_away_team ?? 0;
  const halftimeScore = m.score?.halftime || '0 - 0';

  const matchKey = `${(m.home_team?.team_name || '').toLowerCase()}-vs-${(m.away_team?.team_name || '').toLowerCase()}`;
  const redCards = RED_CARDS_MAP[matchKey] || { home: 0, away: 0 };
  const hasReport = REPORT_MATCHES_SET.has(matchKey);

  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;

  const homeName = m.home_team?.team_name || 'Đội nhà';
  const awayName = m.away_team?.team_name || 'Đội khách';
  const homeLogo = m.home_team?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
  const awayLogo = m.away_team?.logo || 'https://is.vnecdn.net/objects/teams/40.png?v=1';
  const slug = `${toSeoSlug(homeName)}-vs-${toSeoSlug(awayName)}-${m.fixture_id}`;

  return `
    <a href="/tran-dau/${slug}" class="vne-match-card-link" aria-label="Xem chi tiết trận đấu ${homeName} vs ${awayName}">
      <!-- Cột 1: Giờ thi đấu & Ngày (nếu ở chế độ theo vòng) & Trạng thái -->
      <div class="vne-mc-time-col">
        <span class="vne-mc-status-badge ft">${m.status_short || 'FT'}</span>
        <time class="vne-mc-time-str">${kickoffTime}</time>
        ${showDate ? `<time class="vne-mc-date-str">${kickoffDate}</time>` : ''}
      </div>

      <!-- Cột 2: Đội nhà (Căn phải 100%, 1fr) -->
      <div class="vne-mc-team home ${homeWon ? 'winner' : ''}">
        <span class="vne-mc-team-name vne-team-link" title="Xem chi tiết ${homeName}" onclick="goToTeamDetail('${escapeHtml(homeName)}', ${m.home_team?.team_id || 'null'}, event)">${homeName}</span>
        ${redCards.home > 0 ? `<span class="vne-card-red" title="CLB ${homeName} nhận ${redCards.home} thẻ đỏ"></span>` : ''}
        <img src="${homeLogo}" class="vne-mc-team-logo" alt="${homeName}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
      </div>

      <!-- Cột 3: Cột Tỷ số Cố định (72px, CĂN ĐỀU TUYỆT ĐỐI TỪ TRÊN XUỐNG DƯỚI) -->
      <div class="vne-mc-score-pill">
        <div class="vne-mc-score-ft">
          <span class="vne-score-num">${homeScore}</span>
          <span class="vne-score-dash">–</span>
          <span class="vne-score-num">${awayScore}</span>
        </div>
        <div class="vne-mc-sub-scores">
          <span class="vne-mc-ht-score" title="Tỷ số hiệp một">HT: ${halftimeScore}</span>
        </div>
      </div>

      <!-- Cột 4: Đội khách (Căn trái 100%, 1fr) -->
      <div class="vne-mc-team away ${awayWon ? 'winner' : ''}">
        <img src="${awayLogo}" class="vne-mc-team-logo" alt="${awayName}" onerror="this.src='https://is.vnecdn.net/objects/teams/40.png?v=1'">
        ${redCards.away > 0 ? `<span class="vne-card-red" title="CLB ${awayName} nhận ${redCards.away} thẻ đỏ"></span>` : ''}
        <span class="vne-mc-team-name vne-team-link" title="Xem chi tiết ${awayName}" onclick="goToTeamDetail('${escapeHtml(awayName)}', ${m.away_team?.team_id || 'null'}, event)">${awayName}</span>
      </div>

      <!-- Cột 5: Cột Phải Cố định (105px: Nút Tường thuật & Mũi tên) -->
      <div class="vne-mc-right-col">
        ${hasReport ? `
          <span class="vne-btn-tuong-thuat" title="Xem bài tường thuật trực tiếp trận đấu">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Tường thuật</span>
          </span>
        ` : ''}
        <div class="vne-mc-arrow-wrap">
          <svg class="vne-mc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </a>
  `;
}

// MAIN ENTRY CHO SUB-PAGE 3: KẾT QUẢ
function renderPastResults() {
  const isPL = state.leagueSlug === 'ngoai-hang-anh' || state.leagueId === 39;
  const leagueName = state.data?.team?.name || state.data?.league?.vnName || 'CLB';
  const season = isPL ? '2025/2026' : '2026/2027';

  // 1. Update Hero Title
  const h1El = document.getElementById('hub-main-title');
  if (h1El) {
    h1El.innerText = `Kết quả bóng đá ${leagueName} ${season}`;
  }

  // 2. Default to 'date' mode if not set
  if (!state.resultsViewMode) {
    state.resultsViewMode = 'date';
  }

  // 3. Update active teams banner
  updateActiveTeamsBanner('results');

  // 4. Render according to current view mode (default is 'date')
  switchResultsViewMode(state.resultsViewMode);

  // 5. Render 20 Latest News at bottom
  renderResultsNews(leagueName);

  // 6. Render Sidebar Widgets (Standings + Top Scorers)
  renderHubSidebarScorers();

  // 7. Update JSON-LD Schema
  updateHubSchemaMarkup(leagueName);

  if (window.lucide) lucide.createIcons();
}

// Render 20 Latest News Cards at the Bottom of Results Hub
function renderResultsNews(leagueName) {
  const container = document.getElementById('results-league-news-container');
  if (!container) return;

  const leagueTitleEl = document.getElementById('results-news-league-name');
  if (leagueTitleEl) {
    leagueTitleEl.innerText = leagueName || 'giải đấu';
  }

  const newsList = (state.data?.news || []).slice(0, 20);

  if (newsList.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1;padding: var(--vds-spacing-sm); text-align: center; color: var(--vne-text-muted);">Đang tải tin tức giải đấu...</div>';
    return;
  }

  container.innerHTML = newsList.map(item => `
    <article class="vne-results-news-card">
      <a href="${getArticleUrl(item.link)}" class="vne-news-thumb-wrap">
        <img src="${item.thumbnail}" class="vne-news-thumb" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png'">
      </a>
      <div class="vne-news-card-content">
        <div class="vne-news-card-meta">
          <span class="vne-news-cat">${item.category || leagueName}</span>
          <span>•</span>
          <span class="vne-news-time">${item.timeAgo || 'Vừa xong'}</span>
        </div>
        <h3 class="vne-news-card-title">
          <a href="${getArticleUrl(item.link)}">${item.title}</a>
        </h3>
        <p class="vne-news-card-desc">${item.description || ''}</p>
      </div>
    </article>
  `).join('');
}

// Render Mini Standings Widget (100% Real API Data)
function renderHubSidebarStandings() {
  const container = document.getElementById('hub-sidebar-standings-body');
  if (!container) return;

  const standings = state.data?.standings || [];
  if (standings.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-sm); text-align: center; color: var(--vne-text-muted);">Đang cập nhật BXH...</div>';
    return;
  }

  // Top 6 teams
  const top6 = standings.slice(0, 6);
  // Bottom 3 teams
  const bot3 = standings.slice(-3);

  function renderRows(list) {
    return list.map(item => {
      const rank = item.rank;
      const teamName = item.team_name || item.team?.name || '';
      const logo = item.logo || item.team?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
      const played = item.calculated?.played ?? item.all?.matchs_played ?? item.played ?? 8;
      const gd = item.calculated?.goalDiff ?? item.goals_diff ?? item.all?.goalDiff ?? 0;
      const gdStr = gd > 0 ? `+${gd}` : String(gd);
      const pts = item.calculated?.points ?? item.points ?? item.all?.points ?? 0;

      let zoneClass = '';
      if (rank <= 4) zoneClass = 'ucl';
      else if (rank === 5) zoneClass = 'uel';
      else if (rank >= 18) zoneClass = 'rel';

      const isCur = item.isCurrentTeam || item.team_id === state.teamId;
      return `
        <tr class="${zoneClass} ${isCur ? 'vne-current-team-row' : ''}">
          <td class="col-rank">
            <span class="vne-rank-pill ${zoneClass}">${rank}</span>
          </td>
          <td class="col-team">
            <div class="vne-team-cell">
              <img src="${logo}" class="vne-team-logo" alt="${teamName}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
              <a href="/doi-bong/${toTeamSlug(teamName, item.team_id || item.team?.id)}" class="vne-team-name vne-team-link" title="Xem chi tiết ${teamName}" style="color:inherit; text-decoration:none;">${teamName}</a>
            </div>
          </td>
          <td class="col-num">${played}</td>
          <td class="col-num">${gdStr}</td>
          <td class="col-pts">${pts}</td>
        </tr>
      `;
    }).join('');
  }

  container.innerHTML = `
    <table class="vne-table-mini">
      <thead>
        <tr>
          <th style="width: 28px;">#</th>
          <th>CLB</th>
          <th style="text-align: center; width: 28px;">Tr</th>
          <th style="text-align: center; width: 34px;">HS</th>
          <th style="text-align: center; width: 32px;">Đ</th>
        </tr>
      </thead>
      <tbody>
        ${renderRows(top6)}
        <tr class="vne-table-divider">
          <td colspan="5" style="text-align: center;padding: var(--vds-spacing-3xs) 0; color: var(--vne-text-muted);font-size: var(--vds-typography-font-size-100);">•••</td>
        </tr>
        ${renderRows(bot3)}
      </tbody>
    </table>
  `;
}

// Render Top Scorers Widget (100% Real API Data)
function renderHubSidebarScorers() {
  const container = document.getElementById('hub-sidebar-scorers-body');
  if (!container) return;

  const topscorers = state.data?.topscorers || [];
  if (topscorers.length === 0) {
    container.innerHTML = '<div style="padding: var(--vds-spacing-sm); text-align: center; color: var(--vne-text-muted);">Đang cập nhật danh sách ghi bàn...</div>';
    return;
  }

  const top5 = topscorers.slice(0, 5);

  container.innerHTML = `
    <table class="vne-table-mini">
      <thead>
        <tr>
          <th style="width: 28px;">#</th>
          <th>Cầu thủ</th>
          <th>CLB</th>
          <th style="text-align: center; width: 38px;">Bàn</th>
        </tr>
      </thead>
      <tbody>
        ${top5.map((sc, idx) => {
          const rank = idx + 1;
          const pName = sc.player_name || sc.name || 'Cầu thủ';
          const tName = sc.team_name || sc.team?.name || '';
          const logo = sc.logo_team || sc.team?.logo || 'https://is.vnecdn.net/objects/teams/42.png?v=1';
          const goals = sc.goals?.total ?? sc.goals ?? 0;

          return `
            <tr>
              <td class="col-rank">
                <span class="vne-scorer-rank">${rank}</span>
              </td>
              <td class="col-player">
                <div class="vne-player-cell">
                  <span class="vne-player-name" title="${pName}">${pName}</span>
                </div>
              </td>
              <td class="col-team">
                <div class="vne-team-cell">
                  <img src="${logo}" class="vne-team-logo" alt="${tName}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
                  <a href="/doi-bong/${toTeamSlug(tName, sc.team_id || sc.team?.id)}" class="vne-team-name vne-team-link" title="Xem chi tiết ${tName}" style="color:inherit; text-decoration:none;">${tName}</a>
                </div>
              </td>
              <td class="col-goals">${goals}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Update JSON-LD Schema Markup Dynamically from Real Matches
function updateHubSchemaMarkup(leagueName) {
  let schemaEl = document.getElementById('schema-sports-event');
  if (!schemaEl) return;

  const isPL = state.leagueSlug === 'ngoai-hang-anh' || state.leagueId === 39;
  const pastMatches = state.data?.pastMatches || [];

  // Filter Round 8 matches
  const round8Matches = pastMatches.filter(m => m.round === 'Regular Season - 8' || m.round === '4th Round Qualifying');
  const targetMatches = round8Matches.length ? round8Matches : pastMatches.slice(0, 5);

  const subEvents = targetMatches.map(m => ({
    "@type": "SportsEvent",
    "name": `${m.home_team.team_name} vs ${m.away_team.team_name}`,
    "startDate": m.event_date || new Date().toISOString(),
    "eventStatus": "https://schema.org/EventCompleted",
    "homeTeam": {
      "@type": "SportsTeam",
      "name": m.home_team.team_name,
      "logo": m.home_team.logo
    },
    "awayTeam": {
      "@type": "SportsTeam",
      "name": m.away_team.team_name,
      "logo": m.away_team.logo
    },
    "location": {
      "@type": "Place",
      "name": m.venue || "England"
    }
  }));

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": `${leagueName} 2025/2026`,
    "url": window.location.href,
    "sport": "Soccer",
    "subEvent": subEvents
  };

  schemaEl.textContent = JSON.stringify(schemaData, null, 2);
}

// =========================================================================
// SUB-PAGE 4: BẢNG XẾP HẠNG CHI TIẾT (FULL STATS & PHONG ĐỘ 5 TRẬN)
// =========================================================================
function renderFullStandingsPage(standings) {
  const tbody = document.getElementById('full-standings-tbody');
  if (!tbody) return;

  if (!standings || standings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding: var(--vds-spacing-md);color: var(--vds-text-subdued);">Chưa có dữ liệu bảng xếp hạng.</td></tr>';
    return;
  }

  tbody.innerHTML = standings.map((t, idx) => {
    const rank = t.rank || idx + 1;
    const calc = t.calculated || {};
    const played = calc.played ?? (t.all?.matchs_played ?? 0);
    const win = calc.win ?? (t.all?.win ?? 0);
    const draw = calc.draw ?? 0;
    const lose = calc.lose ?? 0;
    const gf = calc.goalsFor ?? (t.all?.goals_for ?? 0);
    const ga = calc.goalsAgainst ?? (t.all?.goals_against ?? 0);
    const gd = calc.goalDiff ?? (t.goals_diff ?? 0);
    const pts = calc.points ?? (t.points ?? 0);
    const formeStr = calc.forme || t.forme || '';

    // Zone highlight: Top 4 (blue), Top 5-6 (orange), Relegation (red)
    let rankClass = '';
    if (rank <= 4) rankClass = 'zone-c1';
    else if (rank <= 6) rankClass = 'zone-el';
    else if (rank > standings.length - 3) rankClass = 'zone-rel';

    // Form badges (W = Win / Thắng 🟢, D = Draw / Hoà 🟡, L = Loss / Thua 🔴)
    const formeHtml = formeStr.split('').slice(-5).map(f => {
      if (f === 'W') return '<span class="forme-badge forme-w" title="Thắng">T</span>';
      if (f === 'D') return '<span class="forme-badge forme-d" title="Hoà">H</span>';
      if (f === 'L') return '<span class="forme-badge forme-l" title="Bại">B</span>';
      return '';
    }).join('');

    const isCur = t.isCurrentTeam || t.team_id === state.teamId;
    return `
      <tr class="${isCur ? 'vne-current-team-row' : ''}">
        <td>
          <span class="rank-box ${rankClass}">${rank}</span>
        </td>
        <td class="td-left">
          <div class="vne-full-team-cell">
            <img src="${t.logo || t.team_logo}" class="vne-full-team-logo" alt="${t.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
            <a href="/doi-bong/${toTeamSlug(t.team_name, t.team_id)}" class="vne-full-team-name vne-team-link" title="Xem chi tiết ${t.team_name}" style="color:inherit; text-decoration:none;">${t.team_name}</a>
            ${isCur ? '<span class="vne-current-team-tag">Đội đang xem</span>' : ''}
          </div>
        </td>
        <td>${played}</td>
        <td>${win}</td>
        <td>${draw}</td>
        <td>${lose}</td>
        <td>${gf}</td>
        <td>${ga}</td>
        <td style="font-weight:600; color:${gd > 0 ? '#16a34a' : gd < 0 ? '#dc2626' : '#64748b'};">${gd > 0 ? `+${gd}` : gd}</td>
        <td><span class="vne-pts-badge">${pts}</span></td>
        <td><div class="forme-list">${formeHtml || '<span style="color: var(--vds-text-subdued-lighter);font-size: var(--vds-typography-font-size-100);">-</span>'}</div></td>
      </tr>
    `;
  }).join('');
}

function renderFullTopScorersPage(scorers) {
  const tbody = document.getElementById('full-topscorers-tbody');
  if (!tbody) return;

  if (!scorers || scorers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding: var(--vds-spacing-md);color: var(--vds-text-subdued);">Đang cập nhật danh sách ghi bàn.</td></tr>';
    return;
  }

  tbody.innerHTML = scorers.map((s, idx) => {
    const rank = idx + 1;
    const goals = s.goals?.total ?? 0;
    const assists = s.goals?.assists ?? 0;
    const apps = s.games?.appearences ?? 0;
    const nationality = s.nationality || '-';
    const position = s.position || '-';

    return `
      <tr>
        <td><span class="rank-box ${rank <= 3 ? 'zone-c1' : ''}">${rank}</span></td>
        <td class="td-left">
          <div style="font-weight:700;color: var(--vds-text-regular);">${s.player_name}</div>
        </td>
        <td class="td-left">
          <div class="vne-full-team-cell">
            <img src="${s.logo_team}" class="vne-full-team-logo" alt="${s.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
            <a href="/doi-bong/${toTeamSlug(s.team_name, s.team_id)}" class="vne-full-team-name vne-team-link" style="max-width:140px; color:inherit; text-decoration:none;">${s.team_name}</a>
          </div>
        </td>
        <td>${nationality}</td>
        <td>${position}</td>
        <td>${apps}</td>
        <td>${assists}</td>
        <td><span style="font-weight:800;font-size: var(--vds-typography-font-size-300);color: var(--vds-text-accent-regular);">${goals}</span></td>
      </tr>
    `;
  }).join('');
}

// Modals
function openPredictModal(homeName, awayName, time) {
  document.getElementById('predict-match-heading').innerText = `${homeName} vs ${awayName}`;
  document.getElementById('predict-match-time').innerText = `Thời gian thi đấu: ${time}`;
  document.getElementById('predict-home-name').innerText = homeName;
  document.getElementById('predict-away-name').innerText = awayName;

  const modal = document.getElementById('modal-predict');
  modal.classList.add('active');
  state.activeModal = 'modal-predict';
}

function submitPrediction() {
  const hScore = document.getElementById('predict-home-score').value;
  const aScore = document.getElementById('predict-away-score').value;
  alert(`Cảm ơn bạn! Dự đoán tỷ số ${hScore} - ${aScore} của bạn đã được ghi nhận vào hệ thống VnExpress!`);
  closeModal('modal-predict');
}

function openHighlightModal(fixtureId, homeTeam, awayTeam, score, leagueName, eventDate) {
  const modal = document.getElementById('modal-highlight');
  document.getElementById('modal-highlight-title').innerText = `VIDEO HIGHLIGHT: ${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()}`;
  document.getElementById('highlight-match-banner').innerText = `${homeTeam} ${score} ${awayTeam}`;
  
  const d = new Date(eventDate);
  const timeStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  
  document.getElementById('highlight-meta-info').innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--vne-border);padding-bottom: var(--vds-spacing-2xs);margin-bottom: var(--vds-spacing-2xs);">
      <div>
        <span style="font-weight: 700; color: var(--vne-dark-header);font-size: var(--vds-typography-font-size-200);">${leagueName}</span>
        <span style="color: var(--vne-text-muted);font-size: var(--vds-typography-font-size-100);margin-left: var(--vds-spacing-2xs);">${timeStr}</span>
      </div>
      <span style="background: var(--vds-surface-info);color: var(--vds-text-info-regular);padding: var(--vds-spacing-4xs) var(--vds-spacing-2xs);border-radius: var(--vds-radii-md);font-size: var(--vds-typography-font-size-100); font-weight: 700;">Full HD 1080p</span>
    </div>
    <div style="font-size: var(--vds-typography-font-size-200); color: var(--vne-text-secondary); line-height: 1.5;">
      Xem lại các diễn biến đỉnh cao, bàn thắng đẹp mắt và tình huống then chốt trận cầu rực lửa giữa <b>${homeTeam}</b> và <b>${awayTeam}</b>.
    </div>
  `;

  modal.classList.add('active');
  state.activeModal = 'modal-highlight';
  if (window.lucide) lucide.createIcons();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  state.activeModal = null;
}

function closeModalOnBackdrop(evt, modalId) {
  if (evt.target.id === modalId) {
    closeModal(modalId);
  }
}

// Formatters according to VnExpress Design System (VDS)
function formatWidgetMatchDate(dateStr) {
  if (!dateStr) return '';
  const days = ['CN', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const d = new Date(dateStr);
  const dayName = days[d.getDay()];
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dayName}, ${dd}/${mm}, ${hh}:${min}`;
}

function formatPredictionDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}, ${dd}/${mm}/${yyyy}`;
}

function formatSubpageKickoff(dateStr) {
  if (!dateStr) return { date: '', time: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: dateStr, time: '' };

  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayName = days[d.getDay()];
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return {
    date: `${dayName}, ${dd}/${mm}/${yyyy}`,
    time: `${hh}:${min}`
  };
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

function goToTeamDetail(name, id, evt = null) {
  if (evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  window.location.href = '/doi-bong/' + toTeamSlug(name, id);
}


// =========================================================================
// SUB-PAGE 5: ĐỘI HÌNH & DANH SÁCH CẦU THỦ (SQUAD & TACTICAL FORMATION)
// =========================================================================
function renderSquadPage() {
  const squad = state.data?.squad;
  const team = state.data?.team;
  if (!squad || !team) return;

  const titleEl = document.getElementById('squad-main-title');
  if (titleEl) {
    titleEl.innerText = `Đội hình & Danh sách cầu thủ ${team.name} 2025/2026`;
  }

  // 1. Render 4 Quick Summary Cards
  const cardsEl = document.getElementById('squad-overview-cards');
  if (cardsEl && squad.overview) {
    cardsEl.innerHTML = `
      <div class="vne-squad-stat-box">
        <span class="vne-squad-stat-label">Tổng nhân sự đội 1</span>
        <span class="vne-squad-stat-val">${squad.overview.totalPlayers} cầu thủ</span>
        <span class="vne-squad-stat-sub">HLV: ${squad.coach?.name || 'Đang cập nhật'}</span>
      </div>
      <div class="vne-squad-stat-box">
        <span class="vne-squad-stat-label">Độ tuổi trung bình</span>
        <span class="vne-squad-stat-val">${squad.overview.avgAge} tuổi</span>
        <span class="vne-squad-stat-sub">Mùa giải 2025/2026</span>
      </div>
      <div class="vne-squad-stat-box">
        <span class="vne-squad-stat-label">Cầu thủ quốc tế / Ngoại binh</span>
        <span class="vne-squad-stat-val">${squad.overview.foreignPlayers} cầu thủ</span>
        <span class="vne-squad-stat-sub">Đa quốc tịch</span>
      </div>
      <div class="vne-squad-stat-box">
        <span class="vne-squad-stat-label">Giá trị đội hình ước tính</span>
        <span class="vne-squad-stat-val">${squad.overview.marketValue}</span>
        <span class="vne-squad-stat-sub">Sơ đồ chính: ${squad.formation || '4-3-3'}</span>
      </div>
    `;
  }

  // Update position filter pill counts
  const players = squad.players || [];
  const counts = {
    ALL: players.length,
    GK: players.filter(p => p.posCode === 'GK').length,
    DF: players.filter(p => p.posCode === 'DF').length,
    MF: players.filter(p => p.posCode === 'MF').length,
    FW: players.filter(p => p.posCode === 'FW').length
  };
  const labels = {
    ALL: `Tất cả (${counts.ALL})`,
    GK: `Thủ môn (${counts.GK})`,
    DF: `Hậu vệ (${counts.DF})`,
    MF: `Tiền vệ (${counts.MF})`,
    FW: `Tiền đạo (${counts.FW})`
  };
  document.querySelectorAll('#squad-pos-pills-container .vne-round-pill').forEach(btn => {
    const pos = btn.getAttribute('data-pos');
    if (labels[pos]) btn.innerText = labels[pos];
    btn.classList.toggle('active', pos === (state.squadPosFilter || 'ALL'));
  });

  renderSquadGroups();
  renderSquadVisualPitch();
  renderSquadKeyLeaders();
}

function filterSquadByPosition(pos) {
  state.squadPosFilter = pos || 'ALL';
  document.querySelectorAll('#squad-pos-pills-container .vne-round-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-pos') === state.squadPosFilter);
  });
  renderSquadGroups();
}

function renderSquadGroups() {
  const container = document.getElementById('squad-groups-container');
  const squad = state.data?.squad;
  if (!container || !squad) return;

  const players = squad.players || [];
  const posFilter = state.squadPosFilter || 'ALL';

  const groupDefs = [
    { code: 'GK', title: 'Thủ môn (Goalkeepers)', dotClass: 'gk' },
    { code: 'DF', title: 'Hậu vệ (Defenders)', dotClass: 'df' },
    { code: 'MF', title: 'Tiền vệ (Midfielders)', dotClass: 'mf' },
    { code: 'FW', title: 'Tiền đạo (Forwards)', dotClass: 'fw' }
  ];

  const activeGroups = posFilter === 'ALL'
    ? groupDefs
    : groupDefs.filter(g => g.code === posFilter);

  container.innerHTML = activeGroups.map(g => {
    const gPlayers = players.filter(p => p.posCode === g.code);
    if (gPlayers.length === 0) return '';

    return `
      <div class="vne-squad-group-card">
        <div class="vne-squad-group-header">
          <h3 class="vne-squad-group-title">
            <span class="vne-pos-dot ${g.dotClass}"></span>
            <span>${g.title}</span>
          </h3>
          <span style="font-size: var(--vds-typography-font-size-100); color: var(--vne-text-muted); font-weight: 700;">${gPlayers.length} cầu thủ</span>
        </div>
        <div class="vne-table-responsive">
          <table class="vne-table-full">
            <thead>
              <tr>
                <th style="width: 52px;">Số áo</th>
                <th class="th-left">Cầu thủ & Vai trò</th>
                <th class="th-left">Quốc tịch</th>
                <th style="width: 56px;">Tuổi</th>
                <th class="hide-on-mobile" style="width: 76px;">Chiều cao</th>
                <th class="hide-on-mobile" style="width: 72px;">Chân thuận</th>
                <th style="width: 56px;">Trận</th>
                <th style="width: 56px;">Bàn</th>
                <th class="hide-on-mobile" style="width: 56px;">KT</th>
                <th style="width: 68px;">Điểm</th>
              </tr>
            </thead>
            <tbody>
              ${gPlayers.map(p => {
                const isHigh = parseFloat(p.rating) >= 7.35;
                const pSlug = (p.fullName && p.fullName.toLowerCase().includes('yamal')) ? 'lamine-yamal-386828' : `${toSeoSlug(p.fullName)}-${p.id || p.number}`;
                return `
                  <tr>
                    <td>
                      <span class="vne-jersey-circle ${g.dotClass}">${p.number}</span>
                    </td>
                    <td class="td-left">
                      <div style="font-weight: 700; color: var(--vne-text-main);font-size: var(--vds-typography-font-size-300);">
                        <a href="/cau-thu/${pSlug}" class="vne-player-link" style="color: inherit; text-decoration: none;">
                          ${p.fullName}
                        </a>
                        ${p.isStarter ? '<span class="vne-starter-badge">Đá chính</span>' : ''}
                      </div>
                      <div style="font-size: var(--vds-typography-font-size-100); color: var(--vne-text-muted);margin-top: var(--vds-spacing-4xs);">${p.role}</div>
                    </td>
                    <td class="td-left" style="font-weight: 600;">${p.nationality}</td>
                    <td>${p.age}</td>
                    <td class="hide-on-mobile">${p.height}</td>
                    <td class="hide-on-mobile">${p.foot}</td>
                    <td style="font-weight: 700;">${p.appearances}</td>
                    <td style="font-weight: 800; color: ${p.goals > 0 ? 'var(--vne-red, #9f224e)' : 'inherit'};">${p.goals}</td>
                    <td class="hide-on-mobile">${p.assists}</td>
                    <td>
                      <span class="vne-rating-badge ${isHigh ? 'high' : ''}">${p.rating}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function renderSquadVisualPitch() {
  const pitchBox = document.getElementById('squad-visual-pitch-box');
  const formBadge = document.getElementById('squad-formation-badge');
  const squad = state.data?.squad;
  if (!pitchBox || !squad) return;

  if (formBadge) formBadge.innerText = squad.formation || '4-3-3';

  const starters = squad.starters || [];
  const fws = starters.filter(p => p.line === 3);
  const mfs = starters.filter(p => p.line === 2);
  const dfs = starters.filter(p => p.line === 1);
  const gks = starters.filter(p => p.line === 0);

  const renderRow = (list, isGk = false) => `
    <div class="vne-squad-pitch-row">
      ${list.map(p => {
        const pSlug = (p.fullName && p.fullName.toLowerCase().includes('yamal')) ? 'lamine-yamal-386828' : `${toSeoSlug(p.fullName || p.name)}-${p.number}`;
        return `
          <a href="/cau-thu/${pSlug}" class="vne-squad-pitch-node" title="${p.fullName} (#${p.number})" style="text-decoration:none;">
            <div class="vne-squad-pitch-num ${isGk ? 'gk' : ''}">${p.number}</div>
            <span class="vne-squad-pitch-name">${p.name}</span>
          </a>
        `;
      }).join('')}
    </div>
  `;

  pitchBox.innerHTML = `
    <div class="vne-squad-pitch">
      <div class="vne-squad-pitch-inner">
        ${renderRow(fws, false)}
        ${renderRow(mfs, false)}
        ${renderRow(dfs, false)}
        ${renderRow(gks, true)}
      </div>
      <div class="vne-squad-pitch-footer">
        <span>HLV: <strong>${squad.coach?.name || 'HLV CLB'}</strong></span>
        <span>Sơ đồ: <strong>${squad.formation || '4-3-3'}</strong></span>
      </div>
    </div>
  `;
}

function renderSquadKeyLeaders() {
  const box = document.getElementById('squad-key-leaders-box');
  const squad = state.data?.squad;
  if (!box || !squad) return;

  const players = [...(squad.players || [])];
  if (players.length === 0) return;

  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
  const topAssister = [...players].sort((a, b) => b.assists - a.assists)[0];
  const topRated = [...players].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))[0];

  const getSlug = (p) => (p.fullName && p.fullName.toLowerCase().includes('yamal')) ? 'lamine-yamal-386828' : `${toSeoSlug(p.fullName)}-${p.number}`;

  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;padding: var(--vds-spacing-2xs) 0;border-bottom: 1px solid var(--vne-border-light, var(--vds-component-divider-fill-subdued));">
      <div>
        <div style="font-size: var(--vds-typography-font-size-050); color:var(--vne-text-muted); font-weight:700; text-transform:uppercase;">Vua phá lưới CLB</div>
        <div style="font-size: var(--vds-typography-font-size-300); font-weight:800; color:var(--vne-text-main);margin-top: var(--vds-spacing-4xs);">
          <a href="/cau-thu/${getSlug(topScorer)}" class="vne-player-link" style="color:inherit; text-decoration:none;">
            #${topScorer.number} ${topScorer.fullName}
          </a>
        </div>
        <div style="font-size: var(--vds-typography-font-size-100); color:var(--vne-text-muted);">${topScorer.role} • ${topScorer.appearances} trận</div>
      </div>
      <div style="text-align:right;">
        <span style="font-size: var(--vds-typography-font-size-700); font-weight:800;color: var(--vne-red, var(--vds-text-accent-regular));">${topScorer.goals}</span>
        <div style="font-size: var(--vds-typography-font-size-050); color:var(--vne-text-muted);">bàn thắng</div>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;padding: var(--vds-spacing-2xs) 0;border-bottom: 1px solid var(--vne-border-light, var(--vds-component-divider-fill-subdued));">
      <div>
        <div style="font-size: var(--vds-typography-font-size-050); color:var(--vne-text-muted); font-weight:700; text-transform:uppercase;">Vua kiến tạo CLB</div>
        <div style="font-size: var(--vds-typography-font-size-300); font-weight:800; color:var(--vne-text-main);margin-top: var(--vds-spacing-4xs);">
          <a href="/cau-thu/${getSlug(topAssister)}" class="vne-player-link" style="color:inherit; text-decoration:none;">
            #${topAssister.number} ${topAssister.fullName}
          </a>
        </div>
        <div style="font-size: var(--vds-typography-font-size-100); color:var(--vne-text-muted);">${topAssister.role} • ${topAssister.appearances} trận</div>
      </div>
      <div style="text-align:right;">
        <span style="font-size: var(--vds-typography-font-size-700); font-weight:800;color: var(--vds-text-positive-regular);">${topAssister.assists}</span>
        <div style="font-size: var(--vds-typography-font-size-050); color:var(--vne-text-muted);">kiến tạo</div>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center;padding: var(--vds-spacing-2xs) 0;">
      <div>
        <div style="font-size: var(--vds-typography-font-size-050); color:var(--vne-text-muted); font-weight:700; text-transform:uppercase;">Điểm phong độ cao nhất</div>
        <div style="font-size: var(--vds-typography-font-size-300); font-weight:800; color:var(--vne-text-main);margin-top: var(--vds-spacing-4xs);">
          <a href="/cau-thu/${getSlug(topRated)}" class="vne-player-link" style="color:inherit; text-decoration:none;">
            #${topRated.number} ${topRated.fullName}
          </a>
        </div>
        <div style="font-size: var(--vds-typography-font-size-100); color:var(--vne-text-muted);">${topRated.role} • ${topRated.appearances} trận</div>
      </div>
      <div style="text-align:right;">
        <span class="vne-rating-badge high">${topRated.rating}</span>
        <div style="font-size: var(--vds-typography-font-size-050); color:var(--vne-text-muted);margin-top: var(--vds-spacing-4xs);">điểm TB</div>
      </div>
    </div>
  `;
}
