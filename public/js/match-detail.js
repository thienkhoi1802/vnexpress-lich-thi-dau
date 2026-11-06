/**
 * Match Detail Page Controller - VnExpress Thể Thao
 * Supports independent sub-URLs for all 4 tabs:
 *  - /tran-dau/:slug (or /tran-dau/:slug/dien-bien) -> Diễn biến
 *  - /tran-dau/:slug/thong-ke -> Thống kê
 *  - /tran-dau/:slug/doi-hinh-ra-san -> Đội hình ra sân
 *  - /tran-dau/:slug/ket-qua-gan-day -> Kết quả gần đây
 */

const mdState = {
  matchSlug: 'psg-vs-barca-1001',
  fixtureId: null,
  activeTab: 'dien-bien', // 'dien-bien' | 'thong-ke' | 'doi-hinh-ra-san' | 'ket-qua-gan-day'
  data: null,
  showAllLeagues: false,
  showAllTeams: false,
  sidebarSearch: ''
};

// VnExpress Design System Football Event Icons
// VDS Date & Time: "Thứ năm, 5/11/2026, 00:45 - Lượt 4" (không số 0 đầu ở ngày/tháng, có dấu phẩy sau thứ)
// "Xem" + logo kênh (kênh chưa có logo: dùng logo VTV màu xám, tên kênh nằm ở alt/title)
function mdChannelPill(name) {
  const n = String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const num = (n.match(/(\d+)\s*$/) || [])[1] || '';
  let slug = '', suffix = '';
  if (n.startsWith('fpt')) slug = 'fpt-play';
  else if (n.startsWith('tv360') || n.startsWith('tv 360')) slug = 'tv360';
  else if (n.startsWith('vtvcab')) slug = '';
  else if (n.startsWith('vtv')) { slug = 'vtv'; suffix = num; }
  else if (n.startsWith('htv')) slug = 'htv';
  const esc = String(name).replace(/"/g, '&quot;');
  const img = slug
    ? `<img class="vne-md-ch-logo" src="/img/channels/${slug}.png" alt="${esc}" title="${esc}">${suffix ? `<span class="vne-md-ch-suffix">${suffix}</span>` : ''}`
    : `<img class="vne-md-ch-logo is-placeholder" src="/img/channels/vtv.png" alt="${esc}" title="${esc}">`;
  return `<span class="vne-match-channel-pill vne-md-ch-pill" title="Xem trực tiếp: ${esc}"><span>Xem</span>${img}</span>`;
}

function mdHeaderText(t) {
  const m = String(t || '').match(/^(Chủ nhật|Thứ [^\d,]+?),?\s+(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}:\d{2})(.*)$/i);
  if (!m) return t || '';
  return `${m[1]}, ${Number(m[2])}/${Number(m[3])}/${m[4]}, ${m[5].padStart(5, '0')}`; // bỏ "- Lượt N"
}
const SOCCER_BALL_SVG = `<vds-icon name="Football__Goal" aria-label="Bàn thắng" class="vne-md-ball-svg"></vds-icon>`;
const YELLOW_CARD_SVG = `<vds-icon name="Football__CardYellow" aria-label="Thẻ vàng"></vds-icon>`;
const RED_CARD_SVG = `<vds-icon name="Football__CardRed" aria-label="Thẻ đỏ"></vds-icon>`;
const SUB_SVG = `<vds-icon name="Football__Substitution" aria-label="Thay người"></vds-icon>`;

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

function parseMatchUrlRoute() {
  const path = window.location.pathname; // e.g. /tran-dau/psg-vs-barca-1001/thong-ke
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'tran-dau' && parts[1]) {
    mdState.matchSlug = parts[1];
    const idMatch = parts[1].match(/-(\d+)$/);
    if (idMatch) mdState.fixtureId = parseInt(idMatch[1]);

    const rawTab = parts[2] || 'tin-tuc';
    if (rawTab === 'thong-ke') {
      mdState.activeTab = 'thong-ke';
    } else if (rawTab === 'doi-hinh-ra-san' || rawTab === 'doi-hinh') {
      mdState.activeTab = 'doi-hinh-ra-san';
    } else if (rawTab === 'ket-qua-gan-day' || rawTab === 'phong-do') {
      mdState.activeTab = 'ket-qua-gan-day';
    } else if (rawTab === 'bang-xep-hang') {
      mdState.activeTab = 'bang-xep-hang';
    } else if (rawTab === 'tran-lien-quan') {
      mdState.activeTab = 'tran-lien-quan';
    } else if (rawTab === 'tin-tuc') {
      mdState.activeTab = 'tin-tuc';
    } else if (rawTab === 'tuong-thuat' || rawTab === 'tong-thuat' || rawTab === 'thong-tin') {
      mdState.activeTab = rawTab;
    } else {
      mdState.activeTab = 'dien-bien';
    }
  } else {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slug')) mdState.matchSlug = params.get('slug');
    if (params.get('id')) mdState.fixtureId = parseInt(params.get('id'));
    if (params.get('tab')) mdState.activeTab = params.get('tab');
  }
}

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

async function initMatchDetailApp() {
  if (window.lucide) lucide.createIcons();
  parseMatchUrlRoute();
  initHeaderClock();
  await loadMatchDetailData();
  loadMatchNews();
}

function mdArticleUrl(link) {
  if (!link) return '#';
  const clean = link.split('?')[0].split('#')[0];
  const m = clean.match(/\/([a-zA-Z0-9_-]+-\d+\.html)$/);
  return m ? '/' + m[1] : link;
}

async function loadMatchNews() {
  const box = document.getElementById('md-news-list');
  if (!box) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  try {
    const res = await fetch('/api/news?page=1&limit=10');
    const data = await res.json();
    const items = data.items || [];
    box.innerHTML = items.map(n => `
      <a href="${typeof getArticleUrl === 'function' ? getArticleUrl(n.link) : mdArticleUrl(n.link)}" class="vne-news-card">
        <div class="vne-news-thumb-col"><img src="${esc(n.thumbnail)}" class="vne-news-thumb" alt="${esc(n.title)}" loading="lazy" onerror="this.style.visibility='hidden'"></div>
        <div class="vne-news-text-col">
          <div><h3 class="vne-news-heading">${n.title}</h3><p class="vne-news-lead">${n.description || ''}</p></div>
          <div class="vne-news-meta"><span>${esc(n.timeAgo)}</span><span>•</span><span class="vne-news-category-pill">${esc(n.category)}</span></div>
        </div>
      </a>`).join('');
  } catch (e) { box.innerHTML = ''; }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMatchDetailApp);
} else {
  initMatchDetailApp();
}

async function loadMatchDetailData() {
  try {
    const qs = new URLSearchParams();
    if (mdState.matchSlug) qs.set('slug', mdState.matchSlug);
    if (mdState.fixtureId) qs.set('fixture_id', mdState.fixtureId);

    const res = await fetch(`/api/match-detail?${qs.toString()}`);
    const data = await res.json();
    mdState.data = data;

    if (data.match?.slug) {
      mdState.matchSlug = data.match.slug;
    }

    renderLeftSidebar();
    renderLeagueHeader(data.league, data.match);
    renderMatchHeader(data.match);
    updateTabLinks();
    renderTimelineTab(data.match, data.events);
    renderStatsTab(data.match, data.stats, data.standings, data.standingsGroupTitle);
    renderStandingsTab(data.standings, data.standingsGroupTitle);
    renderRelatedTab(data.match);
    renderNewsTab(data.match, data.league);
    renderLineupsTab(data.match, data.lineups);
    renderRecentFormTab(data.recentForm);

    try { await applyMatchState(data); } catch (e) { console.warn('applyMatchState', e); }

    // Activate initial tab without pushing duplicate history state
    switchMatchTab(mdState.activeTab, null, false);

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error loading match detail data:', err);
  }
}

function updateTabLinks() {
  const base = `/tran-dau/${mdState.matchSlug}`;
  const btnDienBien = document.getElementById('md-tab-btn-dien-bien');
  const btnThongKe = document.getElementById('md-tab-btn-thong-ke');
  const btnDoiHinh = document.getElementById('md-tab-btn-doi-hinh-ra-san');
  const btnKetQua = document.getElementById('md-tab-btn-ket-qua-gan-day');

  if (btnDienBien) btnDienBien.href = `${base}/dien-bien`;
  if (btnThongKe) btnThongKe.href = `${base}/thong-ke`;
  if (btnDoiHinh) btnDoiHinh.href = `${base}/doi-hinh-ra-san`;
  if (btnKetQua) btnKetQua.href = `${base}/ket-qua-gan-day`;
  const btnBxh = document.getElementById('md-tab-btn-bang-xep-hang');
  if (btnBxh) btnBxh.href = `${base}/bang-xep-hang`;
  const btnRel = document.getElementById('md-tab-btn-tran-lien-quan');
  if (btnRel) btnRel.href = `${base}/tran-lien-quan`;
  const btnNews = document.getElementById('md-tab-btn-tin-tuc');
  if (btnNews) btnNews.href = `${base}/tin-tuc`;
  ['tuong-thuat', 'tong-thuat', 'thong-tin'].forEach(t => { const b = document.getElementById(`md-tab-btn-${t}`); if (b) b.href = `${base}/${t}`; });
}

function switchMatchTab(tab, evt = null, pushUrl = true) {
  if (evt) evt.preventDefault();
  mdState.activeTab = tab;

  const tabs = ['dien-bien', 'thong-ke', 'doi-hinh-ra-san', 'ket-qua-gan-day', 'bang-xep-hang', 'tran-lien-quan', 'tin-tuc', 'tuong-thuat', 'tong-thuat', 'thong-tin'];
  tabs.forEach(t => {
    const btn = document.getElementById(`md-tab-btn-${t}`);
    const pane = document.getElementById(`md-pane-${t}`);
    const isActive = t === tab;
    if (btn) {
      btn.classList.toggle('active', isActive);
      if (isActive && btn.parentElement) {
        // Chỉ cuộn thanh tab khi tab đang chọn bị che; khi cuộn thì đặt tab cách mép trái 20px (không cuộn dọc trang)
        const bar = btn.parentElement, bl = bar.getBoundingClientRect().left;
        const l = btn.getBoundingClientRect().left - bl + bar.scrollLeft, r = l + btn.offsetWidth;
        if (l < bar.scrollLeft + 20 || r > bar.scrollLeft + bar.clientWidth - 20) bar.scrollTo({ left: Math.max(0, l - 20), behavior: 'smooth' });
      }
    }
    if (pane) pane.classList.toggle('active', isActive);
  });

  // Update page title
  const m = mdState.data?.match;
  const matchTitle = m ? `${m.home_team.team_name} ${m.homeScore} - ${m.awayScore} ${m.away_team.team_name}` : 'Chi tiết trận đấu';
  const tabLabels = {
    'dien-bien': 'Diễn biến',
    'thong-ke': 'Thống kê',
    'doi-hinh-ra-san': 'Đội hình ra sân',
    'ket-qua-gan-day': 'Kết quả gần đây',
    'bang-xep-hang': 'Bảng xếp hạng',
    'tran-lien-quan': 'Trận liên quan',
    'tin-tuc': 'Tin tức',
    'tuong-thuat': 'Tường thuật',
    'tong-thuat': 'Tổng thuật',
    'thong-tin': 'Thông tin'
  };
  document.title = `${matchTitle} | ${tabLabels[tab] || 'Chi tiết'} - VnExpress Thể Thao`;

  // Push independent sub-URL via HTML5 History API
  if (pushUrl && mdState.matchSlug) {
    const targetUrl = `/tran-dau/${mdState.matchSlug}/${tab}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ tab, matchSlug: mdState.matchSlug }, '', targetUrl);
    }
  }
}

window.addEventListener('popstate', () => {
  parseMatchUrlRoute();
  switchMatchTab(mdState.activeTab, null, false);
});

// =========================================================================
// 1. LEFT SIDEBAR (MENU CÁC GIẢI & ĐỘI BÓNG)
// =========================================================================
function renderLeftSidebar() {
  const leagues = mdState.data?.allLeagues || [];
  const hotTeams = mdState.data?.hotTeams || [];
  const currentLeagueId = mdState.data?.league?.id;
  const search = mdState.sidebarSearch.toLowerCase().trim();

  // Filter by search
  const filteredLeagues = search
    ? leagues.filter(l => l.vnName.toLowerCase().includes(search) || l.name.toLowerCase().includes(search) || l.country.toLowerCase().includes(search))
    : leagues;

  const visibleLeagues = mdState.showAllLeagues || search ? filteredLeagues : filteredLeagues.slice(0, 10);

  const leagueListEl = document.getElementById('league-filter-list');
  const leagueBadgeEl = document.getElementById('league-count-badge');
  const moreLeaguesBtn = document.getElementById('btn-toggle-more-leagues');
  const moreLeaguesTxt = document.getElementById('txt-more-leagues');

  if (leagueBadgeEl) leagueBadgeEl.innerText = `${visibleLeagues.length}/${filteredLeagues.length}`;

  if (leagueListEl) {
    leagueListEl.innerHTML = visibleLeagues.map(l => {
      const isActive = l.id === currentLeagueId;
      return `
        <li>
          <button class="vne-filter-item-btn ${isActive ? 'active' : ''}" onclick="window.location.href='/giai-dau/${l.slug}'">
            <img src="${l.logo}" class="vne-filter-icon" alt="${l.vnName}" onerror="this.src='https://is.vnecdn.net/objects/leagues/39.png?v=1'">
            <div class="vne-filter-name-col">
              <span class="vne-filter-name" title="${l.vnName}">${l.vnName}</span>
              <span class="vne-filter-sub">${l.country}</span>
            </div>
          </button>
        </li>
      `;
    }).join('');
  }

  if (moreLeaguesBtn && moreLeaguesTxt) {
    if (search || filteredLeagues.length <= 10) {
      moreLeaguesBtn.style.display = 'none';
    } else {
      moreLeaguesBtn.style.display = 'flex';
      moreLeaguesTxt.innerText = mdState.showAllLeagues
        ? '∧ Thu gọn'
        : `∨ Xem thêm (${filteredLeagues.length - 10} giải khác)`;
    }
  }

  // Teams
  const filteredTeams = search
    ? hotTeams.filter(t => t.name.toLowerCase().includes(search) || t.country.toLowerCase().includes(search))
    : hotTeams;

  const visibleTeams = mdState.showAllTeams || search ? filteredTeams : filteredTeams.slice(0, 6);
  const teamListEl = document.getElementById('team-filter-list');
  const teamBadgeEl = document.getElementById('team-count-badge');
  const moreTeamsBtn = document.getElementById('btn-toggle-more-teams');
  const moreTeamsTxt = document.getElementById('txt-more-teams');

  if (teamBadgeEl) teamBadgeEl.innerText = `${visibleTeams.length}/${filteredTeams.length}`;

  const homeId = mdState.data?.match?.home_team?.team_id;
  const awayId = mdState.data?.match?.away_team?.team_id;

  if (teamListEl) {
    teamListEl.innerHTML = visibleTeams.map(t => {
      const isActive = t.id === homeId || t.id === awayId;
      return `
        <li>
          <button class="vne-filter-item-btn ${isActive ? 'active' : ''}" onclick="window.location.href='/lich-thi-dau?team_id=${t.id}'">
            <img src="${t.logo}" class="vne-filter-icon" alt="${t.name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
            <div class="vne-filter-name-col">
              <span class="vne-filter-name" title="${t.name}">${t.name}</span>
              <span class="vne-filter-sub">${t.country}</span>
            </div>
          </button>
        </li>
      `;
    }).join('');
  }

  if (moreTeamsBtn && moreTeamsTxt) {
    if (search || filteredTeams.length <= 6) {
      moreTeamsBtn.style.display = 'none';
    } else {
      moreTeamsBtn.style.display = 'flex';
      moreTeamsTxt.innerText = mdState.showAllTeams
        ? '∧ Thu gọn'
        : `∨ Xem thêm (${filteredTeams.length - 6} đội khác)`;
    }
  }
}

function toggleMoreLeagues() {
  mdState.showAllLeagues = !mdState.showAllLeagues;
  renderLeftSidebar();
}

function toggleMoreTeams() {
  mdState.showAllTeams = !mdState.showAllTeams;
  renderLeftSidebar();
}

function onSidebarSearch(val) {
  mdState.sidebarSearch = val || '';
  renderLeftSidebar();
}

// =========================================================================
// 1.5. LEAGUE HEADER BAR (Image 1 top & Breadcrumbs)
// =========================================================================
function renderLeagueHeader(league, match) {
  const l = league || mdState.data?.league || {
    id: 2,
    slug: 'champions-league',
    name: 'UEFA Champions League',
    vnName: 'Champions League',
    logo: 'https://is.vnecdn.net/objects/leagues/2.png?v=1'
  };

  const m = match || mdState.data?.match;
  const leagueSlug = l.slug || 'champions-league';
  const leagueName = l.vnName || l.name || 'Champions League';
  const leagueFullName = l.name || l.vnName || 'UEFA Champions League';
  const leagueHref = `/giai-dau/${leagueSlug}`;

  // 1. League Bar above match date/time
  const linkEl = document.getElementById('md-league-title-link');
  const logoEl = document.getElementById('md-league-title-logo');
  const nameEl = document.getElementById('md-league-title-name');

  if (linkEl) {
    linkEl.href = leagueHref;
    linkEl.setAttribute('title', `Xem chi tiết giải đấu ${leagueFullName}`);
  }
  if (logoEl) {
    logoEl.src = l.logo || 'https://is.vnecdn.net/objects/leagues/2.png?v=1';
    logoEl.alt = leagueFullName;
  }
  if (nameEl) {
    nameEl.innerText = leagueFullName;
  }

  // 2. Breadcrumbs:
  // - 'Kết quả' (nếu đang ở trận đấu đã kết thúc) / [Tên giải của trận đấu]
  // - 'Lịch thi đấu' (Nếu đang ở trong trận đấu đang Live hoặc Chưa diễn ra) / [Tên giải của trận đấu]
  // User có thể click ngược về tên giải để đi về trang Chi tiết giải đấu
  const isFinished = m ? (m.isFinished === true || m.statusBadge === 'Kết thúc' || m.status_short === 'FT') : true;

  const parentBreadcrumbEl = document.getElementById('breadcrumb-parent-link');
  if (parentBreadcrumbEl) {
    if (isFinished) {
      parentBreadcrumbEl.href = '/ket-qua';
      parentBreadcrumbEl.innerText = 'Kết quả';
      parentBreadcrumbEl.setAttribute('title', 'Về trang Kết quả bóng đá');
    } else {
      parentBreadcrumbEl.href = '/lich-thi-dau';
      parentBreadcrumbEl.innerText = 'Lịch thi đấu';
      parentBreadcrumbEl.setAttribute('title', 'Về trang Lịch thi đấu bóng đá');
    }
  }

  const leagueBreadcrumbEl = document.getElementById('breadcrumb-league-link');
  if (leagueBreadcrumbEl) {
    leagueBreadcrumbEl.href = leagueHref;
    leagueBreadcrumbEl.innerText = leagueName;
    leagueBreadcrumbEl.setAttribute('title', `Xem chi tiết giải đấu ${leagueName}`);
  }
}

// =========================================================================
// 2. MATCH HEADER BANNER (Image 1)
// =========================================================================
function renderMatchHeader(match) {
  if (!match) return;

  const topbar = document.getElementById('md-header-date-bar');
  const isFinished = match.isFinished || match.statusBadge === 'Kết thúc' || match.status_short === 'FT' || match.status_short === 'PEN';
  const broadcastChannel = match.broadcast;

  if (topbar) {
    if (!isFinished && broadcastChannel) {
      topbar.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span>${mdHeaderText(match.headerDateText || 'Thứ sáu 16/10/2026, 02:00 - Lượt 3')}</span>
          ${mdChannelPill(broadcastChannel)}
        </div>
      `;
    } else {
      topbar.innerText = mdHeaderText(match.headerDateText || 'Thứ tư 21/10/2026, 02:00 - Lượt 3');
    }
  }

  const wmHome = document.getElementById('md-watermark-home');
  const wmAway = document.getElementById('md-watermark-away');
  if (wmHome) wmHome.src = match.home_team.logo;
  if (wmAway) wmAway.src = match.away_team.logo;

  const statusPill = document.getElementById('md-status-pill');
  if (statusPill) {
    statusPill.innerText = match.statusBadge || 'Kết thúc';
    statusPill.classList.toggle('live', !!match.isLive);
  }

  const homeName = document.getElementById('md-home-name');
  const homeLogo = document.getElementById('md-home-logo');
  const awayName = document.getElementById('md-away-name');
  const awayLogo = document.getElementById('md-away-logo');
  bindTeamNameElement(homeName, match.home_team);
  if (homeLogo) homeLogo.src = match.home_team.logo;
  bindTeamNameElement(awayName, match.away_team);
  if (awayLogo) awayLogo.src = match.away_team.logo;

  const isPen = match.isPen || !!match.penaltyScore || !!match.penalties || (match.penalty_home !== undefined);
  const scorePill = document.getElementById('md-score-pill');
  if (scorePill) {
    if (isPen) {
      const penH = match.penalty_home ?? (match.penaltyScore ? match.penaltyScore.split('-')[0].trim() : 4);
      const penA = match.penalty_away ?? (match.penaltyScore ? match.penaltyScore.split('-')[1].trim() : 2);
      scorePill.classList.add('has-pen');
      scorePill.innerHTML = `
        <div class="vne-md-score-main">
          <span id="md-home-score">${match.homeScore ?? 0}</span>
          <span class="vne-md-score-dash">–</span>
          <span id="md-away-score">${match.awayScore ?? 0}</span>
        </div>
        <div class="vne-md-penalty-sub">Pen ${penH}–${penA}</div>
      `;
    } else {
      scorePill.classList.remove('has-pen');
      scorePill.innerHTML = `
        <span id="md-home-score">${match.homeScore ?? 0}</span>
        <span class="vne-md-score-dash">–</span>
        <span id="md-away-score">${match.awayScore ?? 0}</span>
      `;
    }
  }

  const htText = document.getElementById('md-halftime-text');
  if (htText) htText.innerText = match.halftimeText || 'Hiệp một: 0 - 0';

  const homeScorersEl = document.getElementById('md-home-scorers');
  const awayScorersEl = document.getElementById('md-away-scorers');

  if (homeScorersEl) {
    homeScorersEl.innerHTML = (match.homeScorers || []).map(s => `
      <div class="vne-md-scorer-item home">
        <span class="vne-md-scorer-txt"><b>${s.player}</b><em>${String(s.minute).replace(/[()]/g,'')}</em></span>
        ${SOCCER_BALL_SVG}
      </div>
    `).join('');
  }

  if (awayScorersEl) {
    awayScorersEl.innerHTML = (match.awayScorers || []).map(s => `
      <div class="vne-md-scorer-item away">
        ${SOCCER_BALL_SVG}
        <span class="vne-md-scorer-txt"><b>${s.player}</b><em>${String(s.minute).replace(/[()]/g,'')}</em></span>
      </div>
    `).join('');
  }
}

// =========================================================================
// 3. TAB 1: DIỄN BIẾN (Image 2)
// =========================================================================
function renderTimelineTab(match, events) {
  if (!match) return;

  const tlHomeName = document.getElementById('tl-home-name');
  const tlHomeLogo = document.getElementById('tl-home-logo');
  const tlAwayName = document.getElementById('tl-away-name');
  const tlAwayLogo = document.getElementById('tl-away-logo');

  bindTeamNameElement(tlHomeName, match.home_team);
  if (tlHomeLogo) tlHomeLogo.src = match.home_team.logo;
  bindTeamNameElement(tlAwayName, match.away_team);
  if (tlAwayLogo) tlAwayLogo.src = match.away_team.logo;

  const container = document.getElementById('md-timeline-container');
  if (!container) return;

  const eventMinute = event => String(event.minute ?? 0).split('+').reduce((total, part) => total + (Number.parseFloat(part) || 0), 0);
  const list = [...(events || [])].sort((first, second) => eventMinute(first) - eventMinute(second));
  const eventsHtml = list.map((ev, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === list.length - 1;
    const isHome = ev.side === 'home';

    if (ev.type === 'whistle' || ev.type === 'penalty_shootout') {
      return `
        <div class="vne-md-tl-milestone-row">
          <div class="vne-md-tl-milestone-badge">
            <span class="vne-md-tl-milestone-min">${ev.minute}'</span>
            <span class="vne-md-tl-milestone-text">${ev.player || ev.text || 'Kết thúc trận đấu'}</span>
          </div>
        </div>
      `;
    }

    const renderEventDetail = (e, side) => {
      if (e.type === 'goal') {
        return side === 'home'
          ? `<div class="vne-tl-event-line"><span>${e.player}</span> ${SOCCER_BALL_SVG}</div>`
          : `<div class="vne-tl-event-line">${SOCCER_BALL_SVG} <span>${e.player}</span></div>`;
      }
      if (e.type === 'yellow_card') {
        return side === 'home'
          ? `<div class="vne-tl-event-line"><span>${e.player}</span> ${YELLOW_CARD_SVG}</div>`
          : `<div class="vne-tl-event-line">${YELLOW_CARD_SVG} <span>${e.player}</span></div>`;
      }
      if (e.type === 'red_card') {
        return side === 'home'
          ? `<div class="vne-tl-event-line"><span>${e.player}</span> ${RED_CARD_SVG}</div>`
          : `<div class="vne-tl-event-line">${RED_CARD_SVG} <span>${e.player}</span></div>`;
      }
      if (e.type === 'sub') {
        if (side === 'home') {
          return `
            <div class="vne-tl-sub-block home">
              <div class="vne-tl-sub-in"><span>${e.playerIn}</span> ${SUB_SVG}</div>
              <div class="vne-tl-sub-out"><span>${e.playerOut}</span></div>
            </div>
          `;
        } else {
          return `
            <div class="vne-tl-sub-block away">
              <div class="vne-tl-sub-in">${SUB_SVG} <span>${e.playerIn}</span></div>
              <div class="vne-tl-sub-out"><span>${e.playerOut}</span></div>
            </div>
          `;
        }
      }
      return '';
    };

    return `
      <div class="vne-md-tl-row">
        <div class="vne-md-tl-side home">
          ${isHome ? renderEventDetail(ev, 'home') : ''}
        </div>
        <div class="vne-md-tl-minute ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''}">
          ${ev.minute}
        </div>
        <div class="vne-md-tl-side away">
          ${!isHome ? renderEventDetail(ev, 'away') : ''}
        </div>
      </div>
    `;
  }).join('');

  let shootoutHtml = '';
  if (match.penalties && match.penalties.length > 0) {
    const penH = match.penalty_home ?? (match.penaltyScore ? match.penaltyScore.split('-')[0].trim() : 4);
    const penA = match.penalty_away ?? (match.penaltyScore ? match.penaltyScore.split('-')[1].trim() : 2);
    const winnerName = Number(penH) > Number(penA) ? match.home_team.team_name : match.away_team.team_name;

    shootoutHtml = `
      <div class="vne-md-shootout-card">
        <div class="vne-md-shootout-header">
          <div class="vne-md-shootout-title">LOẠT SÚT LUÂN LƯU 11M</div>
          <div class="vne-md-shootout-score">Tỷ số Pen: <strong>${penH} – ${penA}</strong></div>
        </div>
        <div class="vne-md-shootout-list">
          ${match.penalties.map(p => {
            const isHome = p.team === 'home';
            return `
              <div class="vne-md-shootout-row ${p.team}">
                <div class="vne-md-shootout-side home">
                  ${isHome ? `
                    <div class="vne-md-shootout-player">
                      <span class="vne-md-shootout-name">${p.player}</span>
                      <span class="vne-md-shootout-tag ${p.scored ? 'scored' : 'missed'}">
                        ${p.scored ? 'VÀO' : 'HỎNG'}
                      </span>
                    </div>
                  ` : ''}
                </div>
                <div class="vne-md-shootout-order">
                  <span class="vne-shootout-dot ${p.scored ? 'scored' : 'missed'}">${p.scored ? '✓' : '✕'}</span>
                  <span>#${p.order}</span>
                </div>
                <div class="vne-md-shootout-side away">
                  ${!isHome ? `
                    <div class="vne-md-shootout-player">
                      <span class="vne-md-shootout-tag ${p.scored ? 'scored' : 'missed'}">
                        ${p.scored ? 'VÀO' : 'HỎNG'}
                      </span>
                      <span class="vne-md-shootout-name">${p.player}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="vne-md-shootout-summary">
          <span>🏆 <strong>${winnerName}</strong> giành chiến thắng <strong>${penH} - ${penA}</strong> ở loạt sút luân lưu 11m</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = eventsHtml + shootoutHtml;
}

// =========================================================================
// 4. TAB 2: THỐNG KÊ (Image 3)
// =========================================================================
function renderStatsTab(match, stats, standings, groupTitle) {
  if (!match) return;

  const stHomeLogo = document.getElementById('st-home-logo');
  const stHomeName = document.getElementById('st-home-name');
  const stAwayLogo = document.getElementById('st-away-logo');
  const stAwayName = document.getElementById('st-away-name');

  if (stHomeLogo) stHomeLogo.src = match.home_team.logo;
  bindTeamNameElement(stHomeName, match.home_team);
  if (stAwayLogo) stAwayLogo.src = match.away_team.logo;
  bindTeamNameElement(stAwayName, match.away_team);

  const statsContainer = document.getElementById('md-stats-rows-container');
  if (statsContainer) {
    statsContainer.innerHTML = (stats || []).map(row => {
      // Calculate dual-color comparative percentage for mobile visual bar
      const hNum = parseFloat(String(row.home).replace('%', '')) || 0;
      const aNum = parseFloat(String(row.away).replace('%', '')) || 0;
      const total = hNum + aNum;
      const homePct = total > 0 ? Math.round((hNum / total) * 100) : 50;
      const awayPct = 100 - homePct;

      return `
        <div class="vne-md-stat-row ${hNum === aNum ? 'tie' : (hNum > aNum ? 'lead-home' : 'lead-away')}">
          <div class="vne-md-stat-val home">${row.home}</div>
          <div class="vne-md-stat-label-wrap">
            <span class="vne-md-stat-label">${row.label}</span>
            <div class="vne-md-stat-bar-track">
              <div class="vne-md-stat-bar-fill home" style="width: ${homePct}%;"></div>
              <div class="vne-md-stat-bar-fill away" style="width: ${awayPct}%;"></div>
            </div>
          </div>
          <div class="vne-md-stat-val away">${row.away}</div>
        </div>
      `;
    }).join('');
    initStatsReveal(statsContainer);
  }

  // Inline Standings Table inside Thống kê tab (Image 3)
  const titleEl = document.getElementById('md-inline-table-title');
  if (titleEl) titleEl.innerText = groupTitle || 'Bảng e';

  const tbody = document.getElementById('md-inline-standings-tbody');
  if (!tbody) return;

  const rows = standings || [];
  tbody.innerHTML = rows.map((s, idx) => {
    const rank = s.rank || idx + 1;
    const rankBgClass = rank <= 8 ? 'rank-blue-main' : 'rank-blue-sub';
    const isHighlighted = s.isHome || s.isAway;

    // Form badges: W -> T (green), D -> H (grey), L -> B (red)
    const formeChars = String(s.forme || 'WWW').split('').slice(-5);
    const formeHtml = formeChars.map(ch => {
      if (ch === 'W' || ch === 'T') return '<span class="vne-md-form-badge win">T</span>';
      if (ch === 'D' || ch === 'H') return '<span class="vne-md-form-badge draw">H</span>';
      return '<span class="vne-md-form-badge loss">B</span>';
    }).join('');

    return `
      <tr class="${isHighlighted ? 'vne-md-inline-row-highlight' : ''}">
        <td class="td-rank-colored ${rankBgClass}">${rank}</td>
        <td class="td-team-cell">
          <div class="vne-md-inline-team">
            <img src="${s.logo}" alt="${s.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
            <a href="/doi-bong/${toTeamSlug(s.team_name, s.team_id)}" class="${isHighlighted ? 'fw-bold' : ''} vne-team-link" style="color:inherit; text-decoration:none;">${s.team_name}</a>
          </div>
        </td>
        <td>${s.played}</td>
        <td>${s.win}</td>
        <td>${s.draw}</td>
        <td>${s.lose}</td>
        <td>${s.gf}</td>
        <td>${s.ga}</td>
        <td>${s.gd}</td>
        <td class="td-pts-bold">${s.points}</td>
        <td>
          <div class="vne-md-form-group">${formeHtml}</div>
        </td>
      </tr>
    `;
  }).join('');
  initStandingsCollapse(tbody, rows.length);
}

// Tab "Trận liên quan": 3 trận sắp diễn ra gần nhất của mỗi đội (trừ trận đang xem)
async function renderRelatedTab(match) {
  if (!match) return;
  const sides = [['home', match.home_team], ['away', match.away_team]];
  const nowSec = Math.floor(Date.now() / 1000);
  let relTotal = 0;
  await Promise.all(sides.map(async ([side, team]) => {
    const logo = document.getElementById(`rel-${side}-logo`);
    const name = document.getElementById(`rel-${side}-name`);
    if (logo) logo.src = team.logo;
    if (name) name.textContent = team.team_name;
    const col = document.getElementById(`md-rel-${side}-col`);
    if (!col) return;
    try {
      const r = await fetch(`/api/fixtures?mode=future&team_id=${team.team_id}`).then(x => x.json());
      const list = (r.matches || [])
        .filter(m => String(m.fixture_id) !== String(match.fixture_id) && (m.event_timestamp || 0) > nowSec - 3600 &&
          (m.home_team.team_id === team.team_id || m.away_team.team_id === team.team_id))
        .sort((a, b) => (a.event_timestamp || 0) - (b.event_timestamp || 0))
        .slice(0, 3);
      relTotal += list.length;
      col.innerHTML = list.length ? list.map(m => {
        const slug = `${toSeoSlug(m.home_team.team_name)}-vs-${toSeoSlug(m.away_team.team_name)}-${m.fixture_id}`;
        const lg = (m.league_meta && (m.league_meta.vnName || m.league_meta.name)) || '';
        return `
          <div class="vne-md-rel-item">
            <div class="vne-md-rel-meta"><span>${mdKickoffDate(m.event_date)}</span>${lg ? `<i></i><span>${lg}</span>` : ''}<a class="vne-md-rel-go" href="/tran-dau/${slug}" aria-label="Xem chi tiết trận ${m.home_team.team_name} vs ${m.away_team.team_name}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg></a></div>
            <div class="vne-md-recent-card" onclick="window.location.href='/tran-dau/${slug}'">
              <div class="vne-md-recent-team left">
                <img src="${m.home_team.logo}" alt="${m.home_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
                <span>${m.home_team.team_name}</span>
              </div>
              <div class="vne-md-recent-score-pill">${mdKickoffText(m.event_date)}</div>
              <div class="vne-md-recent-team right">
                <span>${m.away_team.team_name}</span>
                <img src="${m.away_team.logo}" alt="${m.away_team.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
              </div>
            </div>
          </div>`;
      }).join('') : '<div class="vne-md-rel-empty">Chưa có lịch thi đấu sắp tới</div>';
    } catch (e) { col.innerHTML = '<div class="vne-md-rel-empty">Không tải được dữ liệu</div>'; }
  }));
  // Không đội nào có trận sắp tới → tắt hẳn tab/phần "Trận liên quan"
  mdState.relEmpty = relTotal === 0;
  mdApplyRelVisibility();
}

function mdApplyRelVisibility() {
  const btn = document.getElementById('md-tab-btn-tran-lien-quan');
  if (!mdState.relEmpty) return;
  if (btn) btn.style.display = 'none';
  mdState.hiddenTabs = mdState.hiddenTabs || [];
  if (!mdState.hiddenTabs.includes('tran-lien-quan')) mdState.hiddenTabs.push('tran-lien-quan');
  if (mdState.activeTab === 'tran-lien-quan') switchMatchTab(mdState.defaultTab || 'tin-tuc', null, false);
  const pane = document.getElementById('md-pane-tran-lien-quan');
  if (pane && document.body.dataset.mdTab === 'thong-tin') pane.classList.remove('active');
}

// Tab "Bảng xếp hạng" (trận chưa diễn ra): bảng đầy đủ, tô đậm 2 đội trong trận
function renderStandingsTab(standings, groupTitle) {
  const tbody = document.getElementById('md-bxh-tbody');
  if (!tbody) return;
  const titleEl = document.getElementById('md-bxh-title');
  if (titleEl) titleEl.innerText = groupTitle || 'Bảng xếp hạng';
  tbody.innerHTML = (standings || []).map((s, idx) => {
    const rank = s.rank || idx + 1;
    const hl = s.isHome || s.isAway;
    const formeHtml = String(s.forme || '').split('').slice(-5).map(ch => {
      if (ch === 'W' || ch === 'T') return '<span class="vne-md-form-badge win">T</span>';
      if (ch === 'D' || ch === 'H') return '<span class="vne-md-form-badge draw">H</span>';
      return '<span class="vne-md-form-badge loss">B</span>';
    }).join('');
    return `<tr class="${hl ? 'vne-md-inline-row-highlight' : ''}">
      <td class="td-rank-colored ${rank <= 8 ? 'rank-blue-main' : 'rank-blue-sub'}">${rank}</td>
      <td class="td-team-cell"><div class="vne-md-inline-team"><img src="${s.logo}" alt="${s.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'"><a href="/doi-bong/${toTeamSlug(s.team_name, s.team_id)}" class="${hl ? 'fw-bold' : ''} vne-team-link" style="color:inherit; text-decoration:none;">${s.team_name}</a></div></td>
      <td>${s.played}</td><td>${s.win}</td><td>${s.draw}</td><td>${s.lose}</td><td>${s.gf}</td><td>${s.ga}</td><td>${s.gd}</td><td class="td-pts-bold">${s.points}</td>
      <td><div class="vne-md-form-group">${formeHtml}</div></td></tr>`;
  }).join('');
}

const STANDINGS_LIMIT = 5;
function initStandingsCollapse(tbody, n) {
  const wrap = tbody.closest('.vne-md-inline-standings-wrap');
  if (!wrap) return;
  wrap.querySelector('.vne-md-st-more')?.remove();
  wrap.classList.remove('is-expanded');
  if (n <= STANDINGS_LIMIT) { wrap.classList.remove('is-collapsible'); return; }
  wrap.classList.add('is-collapsible');
  [...tbody.rows].forEach((tr, i) => tr.classList.toggle('st-extra', i >= STANDINGS_LIMIT));
  const lbl = (open) => (open ? 'Thu gọn' : `Xem thêm ${n - STANDINGS_LIMIT} đội`) +
    `<vds-icon name="Chevron__${open ? 'Up' : 'Down'}__Regular__16" size="16"></vds-icon>`;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'vne-md-st-more'; btn.innerHTML = lbl(false);
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => {
    const open = wrap.classList.toggle('is-expanded');
    btn.innerHTML = lbl(open); btn.setAttribute('aria-expanded', String(open));
  });
  wrap.appendChild(btn);
}

function initStatsReveal(container) {
  const rows = [...container.querySelectorAll('.vne-md-stat-row')];
  if (!('IntersectionObserver' in window)) return;
  rows.forEach(r => r.classList.add('anim'));
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    });
  }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
  rows.forEach(r => io.observe(r));
}

// =========================================================================
// 5. TAB 3: ĐỘI HÌNH RA SÂN (Image 4)
// =========================================================================
function renderLineupsTab(match, lineups) {
  if (!match || !lineups) return;

  const home = lineups.home;
  const away = lineups.away;

  // Set team names & logos
  document.getElementById('lu-home-logo').src = match.home_team.logo;
  bindTeamNameElement(document.getElementById('lu-home-name'), match.home_team);
  document.getElementById('lu-away-logo').src = match.away_team.logo;
  bindTeamNameElement(document.getElementById('lu-away-name'), match.away_team);

  // Set Mobile Roster Switcher tabs
  const rHomeLogo = document.getElementById('roster-tab-home-logo');
  const rHomeName = document.getElementById('roster-tab-home-name');
  const rAwayLogo = document.getElementById('roster-tab-away-logo');
  const rAwayName = document.getElementById('roster-tab-away-name');
  if (rHomeLogo) rHomeLogo.src = match.home_team.logo;
  if (rHomeName) rHomeName.innerText = match.home_team.team_name;
  if (rAwayLogo) rAwayLogo.src = match.away_team.logo;
  if (rAwayName) rAwayName.innerText = match.away_team.team_name;

  // Ensure default home roster is active on mobile
  switchMobileRoster('home');

  document.getElementById('pitch-home-logo').src = match.home_team.logo;
  bindTeamNameElement(document.getElementById('pitch-home-name'), match.home_team);
  document.getElementById('pitch-home-formation').innerText = home.formation || '4-3-3';

  document.getElementById('pitch-away-logo').src = match.away_team.logo;
  bindTeamNameElement(document.getElementById('pitch-away-name'), match.away_team);
  document.getElementById('pitch-away-formation').innerText = away.formation || '4-2-3-1';

  // Left Column: Home Starters & Subs ([number] [name] ... [pos])
  const homeStartersEl = document.getElementById('lu-home-starters');
  if (homeStartersEl) {
    homeStartersEl.innerHTML = (home.starters || []).map(p => `
      <div class="vne-md-roster-row home">
        <div class="vne-md-roster-left">
          <span class="vne-md-shirt-num">${p.number}</span>
          <span class="vne-md-player-name">${p.name}</span>
        </div>
        <span class="vne-md-player-pos">${p.pos}</span>
      </div>
    `).join('');
  }

  const homeSubsEl = document.getElementById('lu-home-subs');
  if (homeSubsEl) {
    homeSubsEl.innerHTML = (home.subs || []).map(p => `
      <div class="vne-md-roster-row home">
        <div class="vne-md-roster-left">
          <span class="vne-md-shirt-num">${p.number}</span>
          <span class="vne-md-player-name">${p.name}</span>
        </div>
        <span class="vne-md-player-pos">${p.pos}</span>
      </div>
    `).join('');
  }

  // Right Column: Away Starters & Subs (Mirrored: [pos] ... [name] [number])
  const awayStartersEl = document.getElementById('lu-away-starters');
  if (awayStartersEl) {
    awayStartersEl.innerHTML = (away.starters || []).map(p => `
      <div class="vne-md-roster-row away">
        <span class="vne-md-player-pos">${p.pos}</span>
        <div class="vne-md-roster-right">
          <span class="vne-md-player-name">${p.name}</span>
          <span class="vne-md-shirt-num">${p.number}</span>
        </div>
      </div>
    `).join('');
  }

  const awaySubsEl = document.getElementById('lu-away-subs');
  if (awaySubsEl) {
    awaySubsEl.innerHTML = (away.subs || []).map(p => `
      <div class="vne-md-roster-row away">
        <span class="vne-md-player-pos">${p.pos}</span>
        <div class="vne-md-roster-right">
          <span class="vne-md-player-name">${p.name}</span>
          <span class="vne-md-shirt-num">${p.number}</span>
        </div>
      </div>
    `).join('');
  }

  // Center Column: 2D Pitch Formation Nodes
  // Home Half (Top to Middle: line 0 GK -> line 1 DF -> line 2 MF -> line 3 FW)
  const homeLines = {};
  (home.starters || []).forEach(p => {
    const l = p.line ?? 1;
    if (!homeLines[l]) homeLines[l] = [];
    homeLines[l].push(p);
  });

  const homeHalfEl = document.getElementById('pitch-home-nodes');
  if (homeHalfEl) {
    const sortedLineKeys = Object.keys(homeLines).map(Number).sort((a, b) => a - b);
    homeHalfEl.innerHTML = sortedLineKeys.map(k => `
      <div class="pitch-formation-row">
        ${homeLines[k].map(p => `
          <div class="pitch-player-node home">
            <div class="pitch-player-circle home">${p.number}</div>
            <div class="pitch-player-label">${p.name}</div>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  // Away Half (Middle to Bottom: highest line FW near center -> ... -> line 0 GK at bottom)
  const awayLines = {};
  (away.starters || []).forEach(p => {
    const l = p.line ?? 1;
    if (!awayLines[l]) awayLines[l] = [];
    awayLines[l].push(p);
  });

  const awayHalfEl = document.getElementById('pitch-away-nodes');
  if (awayHalfEl) {
    const sortedAwayKeys = Object.keys(awayLines).map(Number).sort((a, b) => b - a);
    awayHalfEl.innerHTML = sortedAwayKeys.map(k => {
      // Reverse row order for away so left/right flanks mirror properly (e.g. Cancelo #2 on left, Espart #12 on right as in Image 4)
      const rowPlayers = [...awayLines[k]].reverse();
      return `
        <div class="pitch-formation-row">
          ${rowPlayers.map(p => `
            <div class="pitch-player-node away">
              <div class="pitch-player-circle away">${p.number}</div>
              <div class="pitch-player-label">${p.name}</div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  }
  mdRosterMore();
}

// Mobile: mỗi đội chỉ hiện 5 cầu thủ đá chính; "Xem thêm" mở nốt đội hình + cầu thủ dự bị (gộp một khối), "Thu gọn" để đóng
function mdRosterMore() {
  [['md-lineup-home-col', 'lu-home-starters'], ['md-lineup-away-col', 'lu-away-starters']].forEach(([cid, sid]) => {
    const col = document.getElementById(cid), st = document.getElementById(sid);
    if (!col || !st) return;
    col.querySelectorAll(':scope > .vne-md-roster-more').forEach(b => b.remove());
    col.classList.remove('is-open');
    const subs = col.querySelector('[id$="-subs"]');
    if (st.children.length <= 5 && !(subs && subs.children.length)) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vne-md-roster-more'; b.textContent = 'Xem thêm';
    b.addEventListener('click', () => { const o = col.classList.toggle('is-open'); b.textContent = o ? 'Thu gọn' : 'Xem thêm'; });
    col.appendChild(b);
  });
}

// Switch Mobile Lineup Roster View (PSG vs Barca)
function switchMobileRoster(team) {
  const btnHome = document.getElementById('btn-roster-home');
  const btnAway = document.getElementById('btn-roster-away');
  const colHome = document.getElementById('md-lineup-home-col');
  const colAway = document.getElementById('md-lineup-away-col');

  if (btnHome) btnHome.classList.toggle('active', team === 'home');
  if (btnAway) btnAway.classList.toggle('active', team === 'away');
  if (colHome) colHome.classList.toggle('mobile-active', team === 'home');
  if (colAway) colAway.classList.toggle('mobile-active', team === 'away');
}

// =========================================================================
// 6. TAB 4: KẾT QUẢ GẦN ĐÂY (Image 5)
// =========================================================================
function renderRecentFormTab(recentForm) {
  if (!recentForm) return;

  const match = mdState.data?.match;
  if (match) {
    const hLogo = document.getElementById('recent-home-subhead-logo');
    const hName = document.getElementById('recent-home-subhead-name');
    const aLogo = document.getElementById('recent-away-subhead-logo');
    const aName = document.getElementById('recent-away-subhead-name');

    if (hLogo) hLogo.src = match.home_team.logo;
    bindTeamNameElement(hName, match.home_team);
    if (aLogo) aLogo.src = match.away_team.logo;
    bindTeamNameElement(aName, match.away_team);
  }

  const homeCol = document.getElementById('md-recent-home-col');
  const awayCol = document.getElementById('md-recent-away-col');

  const renderCard = (item) => {
    const slug = `${toSeoSlug(item.home_team.team_name)}-vs-${toSeoSlug(item.away_team.team_name)}-${item.fixture_id || 5001}`;
    const parts = String(item.score || '').split(/\s*[-–:]\s*/);
    const hs = parseInt(parts[0], 10), as = parseInt(parts[1], 10);
    const ok = !isNaN(hs) && !isNaN(as);
    const cls = (mine, other) => !ok || mine === other ? '' : (mine > other ? ' is-lead' : ' is-trail');
    const row = (t, sc, c) => `
        <div class="vne-md-recent-row${c}">
          <img src="${t.logo}" alt="${t.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
          <span class="vne-team-link" onclick="goToTeamDetail('${escapeHtml(t.team_name)}', ${t.team_id || 'null'}, event)">${t.team_name}</span>
          <b class="vne-md-recent-num">${ok ? sc : ''}</b>
        </div>`;
    return `
      <div class="vne-md-recent-card is-stacked" onclick="window.location.href='/tran-dau/${slug}'">
        ${row(item.home_team, hs, cls(hs, as))}
        ${row(item.away_team, as, cls(as, hs))}
      </div>
    `;
  };

  if (homeCol) {
    homeCol.innerHTML = (recentForm.home || []).map(renderCard).join('');
  }
  if (awayCol) {
    awayCol.innerHTML = (recentForm.away || []).map(renderCard).join('');
  }
}

// =========================================================================
// 7. RIGHT SIDEBAR: TÓM TẮT BẢNG XẾP HẠNG + HIGHLIGHT 2 ĐỘI
// =========================================================================
function renderRightSidebarStandings(league, standings, match) {
  const container = document.getElementById('match-sidebar-standings-container');
  const badgeEl = document.getElementById('sidebar-league-badge');
  if (!container) return;

  const leagueName = league?.vnName || league?.name || 'Champions League';
  const leagueSlug = league?.slug || 'champions-league';
  if (badgeEl) badgeEl.innerText = leagueName;

  const allRows = standings || [];

  // Ensure the summary list shows top teams AND always includes the 2 highlighted teams
  let displayRows = allRows.slice(0, 10);
  const homeRow = allRows.find(r => r.isHome);
  const awayRow = allRows.find(r => r.isAway);

  if (homeRow && !displayRows.some(r => r.rank === homeRow.rank)) {
    displayRows.push(homeRow);
  }
  if (awayRow && !displayRows.some(r => r.rank === awayRow.rank)) {
    displayRows.push(awayRow);
  }
  displayRows.sort((a, b) => (a.rank || 0) - (b.rank || 0));

  container.innerHTML = `
    <div class="vne-standings-card">
      <div class="vne-standings-header" style="cursor: pointer;" onclick="window.location.href='/giai-dau/${leagueSlug}/bang-xep-hang'">
        <div class="vne-standings-league-title">
          <span style="display:inline-block; width:4px; height:12px; background:var(--vne-red);border-radius: var(--vds-radii-sm);"></span>
          <span>${leagueName}</span>
        </div>
        <span class="vne-standings-season">2026/27</span>
      </div>

      <div class="vne-md-sidebar-highlight-note">
        <span class="vne-md-highlight-dot"></span>
        <span>Vị trí của <strong>${match?.home_team?.team_name || 'Đội nhà'}</strong> & <strong>${match?.away_team?.team_name || 'Đội khách'}</strong></span>
      </div>

      <table class="vne-table-mini">
        <thead>
          <tr>
            <th style="width: 22px;">#</th>
            <th>CLB</th>
            <th style="width: 24px;">Tr</th>
            <th style="width: 28px;">HS</th>
            <th style="width: 28px;">Đ</th>
          </tr>
        </thead>
        <tbody>
          ${displayRows.map(s => {
            const isMatchTeam = s.isHome || s.isAway;
            const gdFormatted = s.gd > 0 ? `+${s.gd}` : s.gd;
            return `
              <tr class="${isMatchTeam ? 'vne-sidebar-row-match-highlight' : ''}">
                <td class="vne-rank-num ${s.rank <= 4 ? 'top-rank' : ''}">${s.rank}</td>
                <td>
                  <div class="vne-standings-clb-col">
                    <img src="${s.logo}" class="vne-standings-logo" alt="${s.team_name}" onerror="this.src='https://is.vnecdn.net/objects/teams/42.png?v=1'">
                    <a href="/doi-bong/${toTeamSlug(s.team_name, s.team_id)}" class="vne-standings-name ${isMatchTeam ? 'match-team-bold' : ''} vne-team-link" title="Xem chi tiết ${s.team_name}" style="color:inherit; text-decoration:none;">${s.team_name}</a>
                  </div>
                </td>
                <td>${s.played}</td>
                <td>${gdFormatted}</td>
                <td class="vne-standings-pts">${s.points}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="vne-standings-footer">
        <a class="vne-standings-more-link" href="/giai-dau/${leagueSlug}/bang-xep-hang">
          <span>Xem chi tiết</span> &gt;
        </a>
      </div>
    </div>
  `;
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

function bindTeamNameElement(el, teamObj) {
  if (!el || !teamObj) return;
  const tUrl = '/doi-bong/' + toTeamSlug(teamObj.team_name, teamObj.team_id);
  el.innerHTML = `<a href="${tUrl}" class="vne-team-link" style="color:inherit; text-decoration:none;" title="Xem chi tiết đội ${teamObj.team_name}">${teamObj.team_name}</a>`;
}


// =========================================================================
// TRẠNG THÁI TRẬN (chưa diễn ra / đang diễn ra / đã kết thúc) — bố cục theo trạng thái
// Nguồn trạng thái thật: /api/fixtures (API match-detail luôn trả "Kết thúc" + dữ liệu mô phỏng)
// =========================================================================
var MD_LIVE = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
var MD_DONE = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
var MD_OFF = { PST: 'Hoãn', CANC: 'Hủy', SUSP: 'Tạm hoãn', ABD: 'Bỏ dở' };
var MD_TAB_LABELS = {
  'dien-bien': 'Diễn biến', 'thong-ke': 'Thống kê',
  'doi-hinh-ra-san': 'Đội hình ra sân', 'ket-qua-gan-day': 'Kết quả gần đây',
  'bang-xep-hang': 'Bảng xếp hạng', 'tran-lien-quan': 'Trận liên quan', 'tin-tuc': 'Tin tức',
  'tuong-thuat': 'Tường thuật', 'tong-thuat': 'Tổng thuật', 'thong-tin': 'Thông tin'
};

async function fetchRealFixture(data) {
  const fid = Number(data.match?.fixture_id);
  const lid = data.league?.id || data.league?.league_id;
  const urls = [];
  // Ưu tiên tra theo ngày của trận (tránh giới hạn 150 trận/lần gọi với các trận xa)
  const dm = String(data.match?.headerDateText || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dm) urls.push(`/api/fixtures?mode=all&date=${dm[3]}-${dm[2]}-${dm[1]}`);
  if (lid) urls.push(`/api/fixtures?mode=all&league_id=${lid}`);
  urls.push('/api/fixtures?mode=all');
  for (const u of urls) {
    try {
      const r = await fetch(u);
      const j = await r.json();
      const list = j.matches || j.items || j.data || [];
      const hit = list.find(m => Number(m.fixture_id) === fid);
      if (hit) return hit;
    } catch (e) { /* thử nguồn tiếp theo */ }
  }
  return null;
}

function mdKickoffText(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
}

function mdKickoffDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).formatToParts(d);
  const g = t => (p.find(x => x.type === t) || {}).value || '';
  const wd = g('weekday'); const wdc = wd ? wd.charAt(0).toUpperCase() + wd.slice(1) : '';
  return `${wdc}, ${g('day')}/${g('month')}`;
}

function mdCountdown(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (!(ms > 0)) return '';
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  if (d) return h ? `Còn ${d} ngày ${h} giờ` : `Còn ${d} ngày`;
  if (!h && m < 1) return 'Sắp bắt đầu';
  return h ? `Còn ${h} giờ ${m} phút` : `Còn ${m} phút`;
}

function mdSetTabs(visible, labels, order, defaultTab) {
  if (mdState.relEmpty) { visible = visible.filter(t => t !== 'tran-lien-quan'); if (order) order = order.filter(t => t !== 'tran-lien-quan'); }
  const bar = document.querySelector('.vne-md-tabs-bar');
  Object.keys(MD_TAB_LABELS).forEach(t => {
    const b = document.getElementById(`md-tab-btn-${t}`);
    if (!b) return;
    b.style.display = visible.includes(t) ? '' : 'none';
    b.textContent = (labels && labels[t]) || MD_TAB_LABELS[t];
  });
  const relH = document.querySelector('#md-pane-tran-lien-quan .vne-md-recent-heading');
  if (relH) { const t = (labels && labels['tran-lien-quan']) || MD_TAB_LABELS['tran-lien-quan']; relH.textContent = t; relH.dataset.orig = t; }
  if (bar && order) order.forEach(t => { const b = document.getElementById(`md-tab-btn-${t}`); if (b) bar.appendChild(b); });
  mdState.hiddenTabs = Object.keys(MD_TAB_LABELS).filter(t => !visible.includes(t));
  mdState.defaultTab = defaultTab;
  if (mdState.hiddenTabs.includes(mdState.activeTab)) {
    mdState.activeTab = defaultTab;
    if (mdState.matchSlug) history.replaceState({ tab: defaultTab, matchSlug: mdState.matchSlug }, '', `/tran-dau/${mdState.matchSlug}/${defaultTab}`);
  }
  mdApplyRelVisibility();
}

// Đang diễn ra / Đã kết thúc: bộ tab đầy đủ
const MD_LIVEDONE_TABS = ['tin-tuc', 'dien-bien', 'tuong-thuat', 'tong-thuat', 'doi-hinh-ra-san', 'ket-qua-gan-day', 'tran-lien-quan'];
const MD_LIVEDONE_LABELS = { 'doi-hinh-ra-san': 'Đội hình ra sân', 'ket-qua-gan-day': 'Phong độ', 'tran-lien-quan': 'Trận sắp tới' };

async function applyMatchState(data) {
  const match = data.match;
  const fx = await fetchRealFixture(data);
  const sh = fx ? fx.status_short : null;
  let kind = 'finished';
  if (sh) {
    if (MD_LIVE.includes(sh)) kind = 'live';
    else if (MD_DONE.includes(sh)) kind = 'finished';
    else if (MD_OFF[sh]) kind = 'off';
    else kind = 'upcoming';
  }
  mdState.real = { kind, fx };
  mdApplyState(data, kind, fx);
}

// Áp trạng thái (thật hoặc demo) lên header + tab
function mdApplyState(data, kind, fx) {
  const match = data.match;
  const sh = fx ? fx.status_short : null;
  mdState.kind = kind;
  document.body.dataset.mdState = kind;
  mdState.curEvents = data.events || [];
  if (kind === 'live' || kind === 'finished') mdEnrichGoals(data, kind, fx);

  if (kind === 'finished') { mdApplyFinished(match); mdRenderCmRecap(match, 'finished'); return; }

  // ---- Chưa diễn ra / Đang diễn ra / Hoãn-hủy ----
  const topbar = document.getElementById('md-header-date-bar');
  const channel = fx && fx.broadcast;
  if (topbar) {
    topbar.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;width:100%;gap: var(--vds-spacing-xs)">
      <span>${mdHeaderText(match.headerDateText || '')}</span>
      ${channel ? mdChannelPill(channel) : ''}
    </div>`;
  }

  const pill = document.getElementById('md-status-pill');
  const score = document.getElementById('md-score-pill');
  const ht = document.getElementById('md-halftime-text');
  const grid = document.getElementById('md-scorers-grid');
  if (grid) grid.style.display = kind === 'live' ? '' : 'none';

  if (kind === 'upcoming') {
    if (pill) { pill.textContent = 'Chưa diễn ra'; pill.classList.remove('live'); pill.classList.add('upcoming'); }
    if (score) { score.classList.remove('has-pen'); score.classList.add('is-kickoff'); score.innerHTML = `<span class="vne-md-kickoff">${mdKickoffText(fx.event_date) || '--:--'}</span><span class="vne-md-kickoff-date">${mdKickoffDate(fx.event_date)}</span>`; }
    if (ht) {
      const tick = () => { const c = mdCountdown(fx.event_date); ht.textContent = c; ht.style.display = c ? '' : 'none'; };
      tick();
      clearInterval(window.__mdCdTimer);
      window.__mdCdTimer = setInterval(tick, 30000);
    }
  } else if (kind === 'live') {
    const el = fx.elapsed ? `${fx.elapsed}'` : '';
    if (pill) { pill.textContent = sh === 'HT' ? 'Nghỉ giữa hiệp' : `Trực tiếp ${el}`.trim(); pill.classList.add('live'); }
    if (score) {
      score.classList.remove('has-pen');
      score.innerHTML = `<span id="md-home-score">${fx.goals_home_team ?? 0}</span><span class="vne-md-score-dash">–</span><span id="md-away-score">${fx.goals_away_team ?? 0}</span>`;
    }
    if (ht) {
      const g1 = (mdState.curEvents || []).filter(e => e.type === 'goal' && e.minute <= 45);
      const h1 = g1.filter(e => e.side === 'home').length, a1 = g1.length - h1;
      ht.textContent = `Hiệp một: ${h1} - ${a1}`;
      ht.style.display = (fx.elapsed || 0) > 45 || sh === 'HT' ? '' : 'none';
    }
  } else {
    if (pill) { pill.textContent = MD_OFF[sh]; pill.classList.remove('live'); pill.classList.add('upcoming'); }
    if (score) { score.classList.add('is-kickoff'); score.innerHTML = `<span class="vne-md-kickoff">–</span>`; }
    if (ht) ht.style.display = 'none';
  }

  // Tab: bỏ Diễn biến + Thống kê (chưa có dữ liệu thật); Phong độ lên đầu, đội hình là "dự kiến"
  const upTabs = kind === 'upcoming' ? ['tin-tuc', 'ket-qua-gan-day', 'doi-hinh-ra-san', 'bang-xep-hang', 'tran-lien-quan']
    : kind === 'live' ? MD_LIVEDONE_TABS
    : ['tin-tuc', 'ket-qua-gan-day', 'doi-hinh-ra-san', 'tran-lien-quan'];
  mdSetTabs(upTabs,
    kind === 'live' ? MD_LIVEDONE_LABELS : { 'ket-qua-gan-day': 'Phong độ', 'doi-hinh-ra-san': kind === 'upcoming' ? 'Đội hình dự kiến' : 'Đội hình' },
    upTabs, kind === 'live' ? 'dien-bien' : 'tin-tuc');
  if (kind === 'live') {
    mdTimelineTidy(true);
    mdRenderCmRecap(match, 'live', fx);
    if (!mdState.demoOn && !location.pathname.split('/').filter(Boolean)[2]) mdState.activeTab = 'dien-bien';
  }
}

// ---- Đã kết thúc: ưu tiên bàn thắng; HT/KT; thay người gọn, tiếng Việt ----
function mdApplyFinished(match) {
  mdSetTabs(MD_LIVEDONE_TABS, MD_LIVEDONE_LABELS, MD_LIVEDONE_TABS, 'tin-tuc');

  const goals = (match.homeScore || 0) + (match.awayScore || 0);
  const ht = document.getElementById('md-halftime-text');
  if (ht) ht.style.display = goals === 0 ? 'none' : '';
  const grid = document.getElementById('md-scorers-grid');
  if (grid) {
    grid.style.display = '';
    let nb = document.getElementById('md-no-goals');
    if (goals === 0) {
      if (!nb) { nb = document.createElement('div'); nb.id = 'md-no-goals'; nb.className = 'vne-md-no-goals'; nb.textContent = 'Không có bàn thắng'; grid.after(nb); }
    } else if (nb) nb.remove();
  }

  mdTimelineTidy(false);
}

// Chuẩn hoá dòng thời gian: tiếng Việt, đánh dấu mốc, mới → cũ. live=true: chưa có mốc "Kết thúc"
function mdTimelineTidy(live) {
  const box = document.getElementById('md-timeline-container');
  if (!box) return;
  box.querySelectorAll('.vne-tl-sub-out span').forEach(sp => {
    if (/^Substitution/i.test(sp.textContent.trim())) sp.textContent = 'Thay người';
  });
  box.querySelectorAll('.vne-md-tl-row').forEach(r => {
    if (r.querySelector('.vne-tl-sub-block')) r.classList.add('is-sub');
    if (r.querySelector('.vne-md-ball-svg')) r.classList.add('is-goal');
  });
  const mark = (txt, before) => {
    const d = document.createElement('div');
    d.className = 'vne-md-tl-milestone-row vne-md-tl-mark';
    d.innerHTML = `<div class="vne-md-tl-milestone-badge"><span class="vne-md-tl-milestone-text">${txt}</span></div>`;
    before ? before.before(d) : box.appendChild(d);
  };
  if (!box.querySelector('.vne-md-tl-mark')) {
    const rows = [...box.querySelectorAll('.vne-md-tl-row')];
    const second = rows.find(r => parseInt(r.querySelector('.vne-md-tl-minute')?.textContent, 10) > 45);
    if (second) mark('Hết hiệp 1', second);
    if (rows.length && !live) mark('Kết thúc', null);
  }
  mdOrderAndCollapse(box);
}

// Diễn biến: mới → cũ, mặc định chỉ hiện 3 tình huống + nút "Xem thêm"
const MD_TL_LIMIT = 3;
function mdOrderAndCollapse(box) {
  if (!box || box.querySelector('[data-desc]')) return;
  const kids = [...box.children];
  const isRow = el => el.classList.contains('vne-md-tl-row');
  const flow = kids.filter(el => isRow(el) || el.classList.contains('vne-md-tl-milestone-row'));
  const extra = kids.filter(el => !flow.includes(el));       // thẻ loạt luân lưu...
  if (!flow.length) return;
  flow.reverse();
  // đổi vai trò đầu/cuối của đường timeline
  const rowsOnly = flow.filter(isRow);
  rowsOnly.forEach(r => r.querySelector('.vne-md-tl-minute')?.classList.remove('first', 'last'));
  rowsOnly[0]?.querySelector('.vne-md-tl-minute')?.classList.add('first');
  rowsOnly[rowsOnly.length - 1]?.querySelector('.vne-md-tl-minute')?.classList.add('last');
  box.innerHTML = '';
  box.classList.remove('md-tl-open', 'md-tl-fade');
  box.style.maxHeight = '';
  extra.forEach(e => box.appendChild(e));
  flow.forEach(e => box.appendChild(e));
  flow[0].dataset.desc = '1';
  document.getElementById('md-tl-more')?.remove();
  if (rowsOnly.length <= MD_TL_LIMIT) return;

  let seen = 0, cutAt = -1;
  flow.forEach((el, i) => { if (isRow(el)) { seen++; if (seen === MD_TL_LIMIT) cutAt = i; } });
  const hidden = flow.slice(cutAt + 1);
  hidden.forEach(el => el.classList.add('md-tl-hidden'));
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'md-tl-more'; btn.className = 'vne-md-tl-more';
  const arrow = '<vds-icon name="Chevron__Down__Regular__16" size="16" class="vne-md-tl-arrow"></vds-icon>';
  const setLabel = open => { btn.innerHTML = (open ? 'Thu gọn' : 'Chi tiết') + arrow; btn.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
  setLabel(false);
  btn.addEventListener('click', () => {
    const open = box.classList.toggle('md-tl-open');
    setLabel(open);
    if (!open) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  box.after(btn);
}

// Tab bị ẩn theo trạng thái → chuyển về tab mặc định
(function () {
  const orig = switchMatchTab;
  switchMatchTab = function (tab, evt, pushUrl) {
    if (mdState.hiddenTabs && mdState.hiddenTabs.includes(tab)) tab = mdState.defaultTab || tab;
    const r = orig(tab, evt, pushUrl);
    document.body.dataset.mdTab = tab;
    mdInfoLayout(tab === 'thong-tin');
    const bn = document.querySelector('.vne-md-news'); if (bn) bn.style.display = tab === 'tin-tuc' ? 'none' : '';
    // Bấm tab khi thanh sticky đang dính → tự cuộn về đầu nội dung của tab đó (ngay dưới thanh sticky)
    if (evt) requestAnimationFrame(() => {
      const wrap = document.querySelector('.vne-md-dock-wrap.is-stuck'), body = document.querySelector('.vne-md-tab-body');
      if (!wrap || !body) return;
      const d = body.getBoundingClientRect().top - wrap.querySelector('.vne-md-dock').getBoundingClientRect().bottom;
      if (d < 0) window.scrollBy({ top: d, behavior: 'auto' });
    });
    const m = mdState.data && mdState.data.match;
    if (m && (mdState.kind === 'upcoming' || mdState.kind === 'off')) {
      document.title = `${m.home_team.team_name} vs ${m.away_team.team_name} | ${MD_TAB_LABELS[tab] || 'Chi tiết'} - VnExpress Thể Thao`;
    } else if (m && MD_LIVEDONE_LABELS[tab]) {
      document.title = document.title.replace(/\|[^|]*- VnExpress Thể Thao$/, `| ${MD_LIVEDONE_LABELS[tab]} - VnExpress Thể Thao`);
    }
    return r;
  };
})();

/* Dock sticky (tỷ số mini + tab) — dính xuyên suốt cột nội dung, kể cả vùng tin tức */
(function () {
  const $ = id => document.getElementById(id);
  const col = document.querySelector('.vne-content-middle');
  const hero = document.querySelector('.vne-md-hero');
  const realBar = document.querySelector('.vne-md-tabs-bar');
  if (!col || !hero || !realBar) return;
  const wrap = document.createElement('div');
  wrap.className = 'vne-md-dock-wrap';
  wrap.innerHTML = '<div class="vne-md-dock"><div class="vne-md-dock-score"><div class="vne-md-dock-team is-home"><span id="md-dock-home-name"></span><img id="md-dock-home-logo" alt=""></div><div class="vne-md-dock-mid" id="md-dock-score"></div><div class="vne-md-dock-team is-away"><img id="md-dock-away-logo" alt=""><span id="md-dock-away-name"></span></div></div><nav class="vne-md-dock-tabs" id="md-dock-tabs"></nav></div>';
  col.insertBefore(wrap, col.firstChild);
  const hdr = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vne-header-h')) || 64;
  let raf = 0, sig = '';
  function sync() {
    raf = 0;
    const stuck = hero.getBoundingClientRect().bottom <= hdr();
    wrap.classList.toggle('is-stuck', stuck);
    if (!stuck) return;
    const sp = $('md-score-pill');
    const st = document.body.dataset.mdState;
    const tb = ($('md-header-date-bar') || {}).textContent || '';
    const km = tb.match(/(\d{1,2})\/(\d{1,2})\/\d{4},?\s*(\d{1,2}:\d{2})/);
    const mid = $('md-dock-score');
    if ((st === 'upcoming' || st === 'off') && km) mid.innerHTML = `<span>${km[1]}/${km[2]}</span><i class="vne-md-dock-sep"></i><span>${km[3]}</span>`;
    else if (sp) mid.innerHTML = `<span>${sp.textContent.replace(/\s+/g, ' ').trim()}</span>`;
    const nm = (a, b) => { const x = $(a), y = $(b); if (x && y) y.textContent = x.textContent.trim(); };
    nm('md-home-name', 'md-dock-home-name'); nm('md-away-name', 'md-dock-away-name');
    const l = (a, b) => { const x = $(a), y = $(b); if (x && y && y.src !== x.src) y.src = x.src; };
    l('md-home-logo', 'md-dock-home-logo'); l('md-away-logo', 'md-dock-away-logo');
    const btns = [...realBar.querySelectorAll('.vne-md-tab-btn')].filter(b => b.style.display !== 'none');
    const nsig = btns.map(b => b.textContent.trim() + (b.classList.contains('active') ? '*' : '')).join('|');
    if (nsig !== sig) {
      sig = nsig;
      const box = $('md-dock-tabs'); box.innerHTML = '';
      btns.forEach(b => { const c = b.cloneNode(true); c.removeAttribute('id'); box.appendChild(c); });
    }
  }
  const on = () => { if (!raf) raf = requestAnimationFrame(sync); };
  window.addEventListener('scroll', on, { passive: true });
  window.addEventListener('resize', on);
  document.addEventListener('click', () => setTimeout(on, 60));
  on();
})();


/* Người ghi bàn: mới → cũ, mặc định chỉ hiện 2 tình huống gần nhất mỗi bên + nút "Xem thêm" */
(function () {
  const LIMIT = 2;
  const grid = document.getElementById('md-scorers-grid');
  if (!grid) return;
  let busy = false;
  const labelHtml = open => `${open ? 'Thu gọn' : 'Xem thêm'}<vds-icon name="Chevron__${open ? 'Up' : 'Down'}__Regular__16" size="16"></vds-icon>`;
  function collapse() {
    if (busy) return; busy = true;
    try {
      const cols = [...grid.querySelectorAll('.vne-md-scorers-col')];
      let needMore = false;
      cols.forEach(col => {
        const items = [...col.querySelectorAll('.vne-md-scorer-item')];
        if (!items.length || col.dataset.scOrdered === String(items.length)) { if (items.length > LIMIT) needMore = true; return; }
        items.reverse().forEach(it => col.appendChild(it));        // mới nhất lên đầu
        items.forEach((it, i) => it.classList.toggle('md-sc-hidden', i >= LIMIT));
        col.dataset.scOrdered = String(items.length);
        if (items.length > LIMIT) needMore = true;
      });
      let btn = document.getElementById('md-sc-more');
      if (!needMore) { btn?.remove(); return; }
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button'; btn.id = 'md-sc-more'; btn.className = 'vne-md-sc-more';
        btn.innerHTML = labelHtml(false);
        btn.addEventListener('click', () => {
          const open = grid.classList.toggle('md-sc-open');
          btn.innerHTML = labelHtml(open);
          btn.setAttribute('aria-expanded', String(open));
        });
        grid.after(btn);
      }
    } finally { setTimeout(() => { busy = false; }, 0); }
  }
  new MutationObserver(() => requestAnimationFrame(collapse)).observe(grid, { childList: true, subtree: true });
  collapse();
})();


/* Chia sẻ trận đấu */
(function () {
  const root = document.getElementById('md-share');
  if (!root) return;
  const btn = document.getElementById('md-share-btn');
  const isTouch = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
  const data = () => ({ url: location.href.split('#')[0], title: document.title.replace(/\s*-\s*VnExpress.*$/, '') });
  const setOpen = o => { root.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', String(o)); };
  btn.addEventListener('click', async e => {
    e.stopPropagation();
    const d = data();
    if (isTouch() && navigator.share) {
      try { await navigator.share({ title: d.title, text: d.title, url: d.url }); } catch (_) { /* người dùng huỷ */ }
      return;
    }
    setOpen(!root.classList.contains('is-open'));
  });
  document.addEventListener('click', e => { if (!root.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  root.querySelectorAll('[data-share]').forEach(el => {
    el.addEventListener('click', async e => {
      const d = data(), u = encodeURIComponent(d.url), t = encodeURIComponent(d.title);
      const type = el.dataset.share;
      if (type === 'copy') {
        e.preventDefault();
        try { await navigator.clipboard.writeText(d.url); } catch (_) {
          const ta = document.createElement('textarea'); ta.value = d.url; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (__) {} ta.remove();
        }
        const span = el.querySelector('span'), old = span.textContent;
        span.textContent = 'Đã sao chép'; el.classList.add('is-done');
        setTimeout(() => { span.textContent = old; el.classList.remove('is-done'); setOpen(false); }, 1400);
        return;
      }
      el.href = type === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${u}`
        : type === 'x' ? `https://twitter.com/intent/tweet?url=${u}&text=${t}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
      setOpen(false);
    });
  });
})();

/* =========================================================================
   DEMO: nút nổi chuyển nhanh 3 trạng thái của 1 trận (Chưa diễn ra / Đang diễn ra / Đã kết thúc)
   — chỉ để trình bày concept; trạng thái thật của trận vẫn được đánh dấu "Thực tế".
   ========================================================================= */
const MD_DEMO_OPTS = [
  { kind: 'upcoming', label: 'Chưa diễn ra', hint: 'Đếm ngược, Phong độ, Đội hình dự kiến, BXH' },
  { kind: 'live', label: 'Đang diễn ra', hint: 'Tỷ số trực tiếp, Phong độ, Đội hình' },
  { kind: 'finished', label: 'Đã kết thúc', hint: 'Diễn biến, Thống kê, Đội hình' }
];

function mdDemoHeaderText(base, d) {
  const wd = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][d.getDay()];
  const pad = n => String(n).padStart(2, '0');
  const tail = (String(base || '').match(/(\s-\s.*)$/) || [''])[1];
  return `${wd} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}${tail}`;
}

function mdDemoBuild(kind) {
  const data = mdState.data;
  const real = mdState.real || { kind: 'finished', fx: null };
  const base = data.match;
  if (kind === real.kind && !mdState.demoOn) return { match: base, events: data.events, fx: real.fx };
  const now = new Date();
  const round5 = d => { d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0); return d; };
  const m = Object.assign({}, base);
  const starters = side => ((data.lineups && data.lineups[side] && data.lineups[side].starters) || []).filter(p => p.line >= 2);
  const nameAt = (side, i, fb) => { const a = starters(side); return a.length ? a[i % a.length].name : fb; };

  if (kind === 'upcoming') {
    const t = real.kind === 'upcoming' && real.fx ? new Date(real.fx.event_date) : round5(new Date(now.getTime() + 27 * 3600000));
    m.headerDateText = mdDemoHeaderText(base.headerDateText, t);
    m.isFinished = false; m.isLive = false; m.statusBadge = 'Chưa diễn ra';
    return { match: m, events: data.events, fx: { status_short: 'NS', event_date: t.toISOString() } };
  }
  if (kind === 'live') {
    if (real.kind === 'live' && real.fx) return { match: base, events: data.events, fx: real.fx };
    const t = round5(new Date(now.getTime() - 67 * 60000));
    m.headerDateText = mdDemoHeaderText(base.headerDateText, t);
    m.isFinished = false; m.isLive = true; m.statusBadge = 'Đang diễn ra';
    const lg = [
      { minute: 23, side: 'home', type: 'goal', player: nameAt('home', 9, 'Cầu thủ A') },
      { minute: 41, side: 'away', type: 'goal', player: nameAt('away', 8, 'Cầu thủ B') },
      { minute: 63, side: 'home', type: 'goal', player: nameAt('home', 7, 'Cầu thủ C') }
    ];
    const lev = (data.events || []).filter(e => e.type !== 'goal' && e.minute <= 67).concat(lg).sort((a, b) => a.minute - b.minute);
    return { match: m, events: lev, fx: { status_short: '2H', elapsed: 67, goals_home_team: 2, goals_away_team: 1 } };
  }
  // finished
  if (real.kind === 'finished' && !mdState.demoOn) return { match: base, events: data.events, fx: real.fx };
  const t = round5(new Date(now.getTime() - 26 * 3600000));
  const hasScore = (base.homeScore || 0) + (base.awayScore || 0) > 0 && real.kind === 'finished';
  if (!hasScore) m.headerDateText = mdDemoHeaderText(base.headerDateText, t);
  m.isFinished = true; m.isLive = false; m.statusBadge = 'Kết thúc';
  let events = (data.events || []).filter(e => e.type !== 'goal');
  if (!hasScore) {
    const goals = [
      { minute: 23, side: 'home', type: 'goal', player: nameAt('home', 9, 'Cầu thủ A') },
      { minute: 41, side: 'away', type: 'goal', player: nameAt('away', 8, 'Cầu thủ B') },
      { minute: 67, side: 'home', type: 'goal', player: nameAt('home', 7, 'Cầu thủ C') }
    ];
    events = events.concat(goals).sort((a, b) => a.minute - b.minute);
    m.homeScore = 2; m.awayScore = 1; m.halftimeText = 'Hiệp một: 1 - 1';
    m.homeScorers = goals.filter(g => g.side === 'home').map(g => ({ player: g.player, minute: `${g.minute}'` }));
    m.awayScorers = goals.filter(g => g.side === 'away').map(g => ({ player: g.player, minute: `${g.minute}'` }));
  } else {
    events = data.events;
  }
  return { match: m, events, fx: null };
}

function mdDemoSet(kind) {
  const data = mdState.data;
  if (!data || !data.match) return;
  const b = mdDemoBuild(kind);
  mdState.demoOn = true;
  clearInterval(window.__mdCdTimer);

  // reset header
  const pill = document.getElementById('md-status-pill');
  const score = document.getElementById('md-score-pill');
  if (pill) pill.classList.remove('live', 'upcoming');
  if (score) score.classList.remove('is-kickoff', 'has-pen');
  document.getElementById('md-no-goals')?.remove();
  renderMatchHeader(b.match);

  // reset timeline (đã bị đảo thứ tự / thu gọn ở lần áp trước)
  const box = document.getElementById('md-timeline-container');
  if (box) {
    document.getElementById('md-tl-more')?.remove();
    box.classList.remove('md-tl-open', 'md-tl-fade');
    box.style.maxHeight = '';
    renderTimelineTab(b.match, b.events);
  }

  const d2 = Object.assign({}, data, { match: b.match, events: b.events });
  mdState.kind = kind;
  mdApplyState(d2, kind, b.fx);

  const tab = mdState.defaultTab || 'dien-bien';
  switchMatchTab(tab, null, false);
  try { history.replaceState({ tab, matchSlug: mdState.matchSlug }, '', `/tran-dau/${mdState.matchSlug}/${tab}`); } catch (e) {}
  {
    const hn = b.match.home_team.team_name, an = b.match.away_team.team_name;
    const ttl = kind === 'finished' ? `${hn} ${b.match.homeScore ?? 0} - ${b.match.awayScore ?? 0} ${an}` : kind === 'live' ? `${hn} ${b.fx.goals_home_team ?? 0} - ${b.fx.goals_away_team ?? 0} ${an}` : `${hn} vs ${an}`;
    document.title = `${ttl} | ${MD_TAB_LABELS[tab] || 'Chi tiết'} - VnExpress Thể Thao`;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => window.dispatchEvent(new Event('scroll')), 50);
  mdDemoSync();
}

function mdDemoSync() {
  const root = document.getElementById('md-demo-sw');
  if (!root) return;
  const cur = mdState.kind === 'off' ? 'upcoming' : mdState.kind;
  const real = mdState.real ? (mdState.real.kind === 'off' ? 'upcoming' : mdState.real.kind) : null;
  root.dataset.kind = cur;
  root.querySelectorAll('.vne-demo-opt').forEach(b => {
    b.classList.toggle('is-active', b.dataset.kind === cur);
    b.setAttribute('aria-checked', b.dataset.kind === cur ? 'true' : 'false');
    const tag = b.querySelector('.vne-demo-real');
    if (tag) tag.style.display = (!mdState.demoOn && b.dataset.kind === real) || (mdState.demoOn && b.dataset.kind === real && real !== null) ? '' : 'none';
  });
  const o = MD_DEMO_OPTS.find(x => x.kind === cur);
  const lab = root.querySelector('.vne-demo-cur');
  if (lab && o) lab.textContent = o.label;
}

function mdDemoInit() {
  if (document.getElementById('md-demo-sw')) return;
  const root = document.createElement('div');
  root.id = 'md-demo-sw';
  root.className = 'vne-demo-sw';
  root.innerHTML = `
    <button type="button" class="vne-demo-btn" aria-haspopup="true" aria-expanded="false" title="Demo trạng thái trận">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      <span class="vne-demo-cur">Trạng thái</span>
    </button>
    <div class="vne-demo-menu" role="radiogroup" aria-label="Demo trạng thái trận">
      <div class="vne-demo-title">Demo trạng thái trận</div>
      ${MD_DEMO_OPTS.map(o => `<button type="button" class="vne-demo-opt" role="radio" aria-checked="false" data-kind="${o.kind}"><i class="vne-demo-dot ${o.kind}"></i><span class="vne-demo-txt"><b>${o.label}</b><em>${o.hint}</em></span><span class="vne-demo-real" style="display:none">Thực tế</span></button>`).join('')}
    </div>`;
  document.body.appendChild(root);
  const btn = root.querySelector('.vne-demo-btn');
  const setOpen = o => { root.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(!root.classList.contains('is-open')); });
  root.querySelectorAll('.vne-demo-opt').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); mdDemoSet(b.dataset.kind); }));
  document.addEventListener('pointerdown', e => { if (!root.contains(e.target)) setOpen(false); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  mdDemoSync();
}
(function () {
  // chờ trạng thái thật được áp xong rồi mới hiện nút
  const t = setInterval(() => { if (mdState.real) { clearInterval(t); mdDemoInit(); } }, 200);
  setTimeout(() => clearInterval(t), 15000);
})();


// ---- Tab Tin tức: toàn bộ tin liên quan tới trận (2 đội / giải), không có thì hiện tin bóng đá chung ----
async function renderNewsTab(match, league) {
  const box = document.getElementById('md-news-tab-list');
  if (!box || !match) return;
  // Listing nằm NGOÀI card Overview (card bo tròn chỉ gồm header + tab)
  const pane = document.getElementById('md-pane-tin-tuc');
  const card = document.querySelector('.vne-match-detail-card');
  if (pane && card && pane.parentElement !== card.parentElement) card.after(pane);
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const keys = [match.home_team.team_name, match.home_team.team_name_full, match.away_team.team_name, match.away_team.team_name_full, league && (league.name || league.league_name)]
    .filter(Boolean).map(norm).filter((v, i, a) => v.length > 2 && a.indexOf(v) === i);
  try {
    const data = await fetch('/api/news?page=1&limit=100').then(r => r.json());
    const all = data.items || [];
    let items = all.filter(n => { const t = norm(n.title + ' ' + (n.description || '')); return keys.some(k => t.includes(k)); });
    const general = !items.length;
    if (general) items = all;
    const sub = document.getElementById('md-news-tab-sub');
    if (sub) sub.textContent = general ? 'Chưa có tin riêng về trận này — hiển thị tin bóng đá mới nhất' : `${items.length} tin liên quan đến ${match.home_team.team_name} và ${match.away_team.team_name}`;
    const html = items.map(n => `
      <a href="${typeof getArticleUrl === 'function' ? getArticleUrl(n.link) : mdArticleUrl(n.link)}" class="vne-news-card">
        <div class="vne-news-thumb-col"><img src="${esc(n.thumbnail)}" class="vne-news-thumb" alt="${esc(n.title)}" loading="lazy" onerror="this.style.visibility='hidden'"></div>
        <div class="vne-news-text-col">
          <div><h3 class="vne-news-heading">${n.title}</h3><p class="vne-news-lead">${n.description || ''}</p></div>
          <div class="vne-news-meta"><span>${esc(n.timeAgo)}</span><span>•</span><span class="vne-news-category-pill">${esc(n.category)}</span></div>
        </div>
      </a>`).join('');
    box.innerHTML = html;
    const ib = document.getElementById('md-info-news-list'); if (ib) ib.innerHTML = html;
  } catch (e) { box.innerHTML = ''; }
}

// Tab "Thông tin" (trận đang/đã diễn ra): Thống kê → Trận tiếp theo của 2 đội → Phong độ → Tin tức
function mdInfoLayout(on) {
  const ket = document.getElementById('md-pane-ket-qua-gan-day');
  const tran = document.getElementById('md-pane-tran-lien-quan');
  const info = document.getElementById('md-pane-thong-tin');
  const stat = document.getElementById('md-pane-thong-ke');
  if (!ket || !tran || !info || !stat) return;
  if (!mdState.infoInit) {
    mdState.infoInit = true;
    ket.before(tran); ket.after(info);
    const h = document.createElement('h3'); h.className = 'vne-md-recent-heading vne-md-info-h'; h.textContent = 'Thống kê'; stat.prepend(h);
    const bxh = document.getElementById('md-pane-bang-xep-hang');
    if (bxh) {
      const bh = document.createElement('h3'); bh.className = 'vne-md-recent-heading vne-md-info-h'; bh.textContent = 'Bảng xếp hạng'; bxh.prepend(bh);
      stat.after(bxh);
    }
    [stat, document.getElementById('md-pane-bang-xep-hang'), tran, ket, info].forEach(pane => { if (!pane) return;
      pane.querySelector('.vne-md-recent-heading')?.classList.add('vne-md-section-title');
    });
    const th = tran.querySelector('.vne-md-recent-heading'); if (th) { th.dataset.orig = th.textContent; th.dataset.info = 'Trận tiếp theo của hai đội'; }
  }
  const th = tran.querySelector('.vne-md-recent-heading');
  if (th && th.dataset.info) th.textContent = on ? th.dataset.info : th.dataset.orig;
  if (on) [stat, document.getElementById('md-pane-bang-xep-hang'), mdState.relEmpty ? null : tran, ket].forEach(p => p && p.classList.add('active'));
}


// ---- Tường thuật + Tổng thuật (nội dung dựng từ diễn biến trận) ----
function mdRenderCmRecap(match, kind, fx) {
  const cm = document.getElementById('md-commentary');
  const rc = document.getElementById('md-recap');
  if (!cm || !rc || !match) return;
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const H = match.home_team.team_name, A = match.away_team.team_name;
  const evs = (mdState.curEvents || []).filter(e => e.type !== 'whistle' && e.type !== 'penalty_shootout').slice().sort((a, b) => a.minute - b.minute);
  const tn = e => e.side === 'home' ? H : A;
  const elapsed = kind === 'live' ? ((fx && fx.elapsed) || 67) : 90;
  const finalH = kind === 'live' ? ((fx && fx.goals_home_team) ?? match.homeScore ?? 0) : (match.homeScore ?? 0);
  const finalA = kind === 'live' ? ((fx && fx.goals_away_team) ?? match.awayScore ?? 0) : (match.awayScore ?? 0);

  // Tường thuật: mới → cũ
  let sh = 0, sa = 0;
  const lines = [{ m: 0, t: `Trận đấu giữa ${H} và ${A} bắt đầu.`, k: 'whistle' }];
  evs.forEach(e => {
    if (e.type === 'goal') {
      e.side === 'home' ? sh++ : sa++;
      lines.push({ m: e.minute, k: 'goal', t: `Vào! ${e.player} ghi bàn cho ${tn(e)}, tỷ số là ${sh} - ${sa}.` });
    } else if (e.type === 'yellow_card') lines.push({ m: e.minute, k: 'yellow', t: `Thẻ vàng cho ${e.player} (${tn(e)}) sau pha vào bóng muộn.` });
    else if (e.type === 'red_card') lines.push({ m: e.minute, k: 'red', t: `Thẻ đỏ! ${e.player} (${tn(e)}) bị đuổi khỏi sân.` });
    else if (e.type === 'sub') lines.push({ m: e.minute, k: 'sub', t: `${tn(e)} thay người: ${e.playerIn || 'cầu thủ dự bị'} vào sân.` });
  });
  if (elapsed > 45) lines.push({ m: 45, k: 'whistle', t: 'Hết hiệp 1. Hai đội về phòng thay đồ nghỉ giải lao.' });
  if (kind === 'finished') lines.push({ m: 90, k: 'whistle', t: `Hết giờ. ${finalH === finalA ? 'Hai đội chia điểm' : (finalH > finalA ? H : A) + ' giành chiến thắng'} với tỷ số ${finalH} - ${finalA}.` });
  lines.sort((a, b) => a.m - b.m || (a.k === 'whistle' ? -1 : 0));
  cm.innerHTML = lines.slice().reverse().map(l => `<div class="vne-md-cm-row is-${l.k}"><span class="vne-md-cm-min">${l.m ? l.m + "'" : '0\''}</span><p>${esc(l.t)}</p></div>`).join('');
  if (kind === 'live') cm.insertAdjacentHTML('afterbegin', `<div class="vne-md-cm-live"><i></i>Đang cập nhật trực tiếp · phút ${elapsed}'</div>`);

  // Tổng thuật
  const goals = evs.filter(e => e.type === 'goal');
  const g1 = goals.filter(e => e.minute <= 45), g2 = goals.filter(e => e.minute > 45);
  const cards = evs.filter(e => e.type === 'yellow_card' || e.type === 'red_card');
  const list = a => a.map(e => `${e.player} (${e.minute}')`).join(', ');
  const lead = kind === 'finished'
    ? (finalH === finalA ? `${H} và ${A} chia điểm với tỷ số ${finalH} - ${finalA} trong trận đấu thuộc ${match.headerDateText ? 'khuôn khổ vòng đấu' : 'giải'} này.` : `${finalH > finalA ? H : A} đánh bại ${finalH > finalA ? A : H} với tỷ số ${Math.max(finalH, finalA)} - ${Math.min(finalH, finalA)} trong trận đấu vừa diễn ra.`)
    : `Sau ${elapsed} phút, ${H} đang ${finalH === finalA ? 'hòa' : (finalH > finalA ? 'dẫn' : 'bị dẫn bởi')} ${A} với tỷ số ${finalH} - ${finalA}.`;
  const paras = [lead];
  paras.push(g1.length ? `Hiệp một chứng kiến ${g1.length} bàn thắng: ${list(g1)}.` : 'Hiệp một diễn ra cân bằng, chưa có bàn thắng nào được ghi.');
  if (elapsed > 45) paras.push(g2.length ? `Sang hiệp hai, ${g2.length} bàn thắng nữa được ghi: ${list(g2)}.` : 'Hiệp hai tiếp tục căng thẳng nhưng chưa có thêm bàn thắng.');
  if (cards.length) paras.push(`Trọng tài rút ${cards.length} thẻ trong trận: ${cards.map(e => `${e.player} (${tn(e)}, ${e.minute}')`).join(', ')}.`);
  paras.push(kind === 'finished' ? 'Kết quả này giúp hai đội cập nhật vị trí trên bảng xếp hạng. Xem thêm diễn biến và thống kê chi tiết ở các tab bên cạnh.' : 'Tổng thuật sẽ được hoàn thiện khi trận đấu kết thúc. Theo dõi diễn biến từng phút ở tab Tường thuật.');
  rc.innerHTML = `<h3 class="vne-md-recap-title">${esc(H)} ${finalH} - ${finalA} ${esc(A)}: ${kind === 'finished' ? 'Tổng thuật trận đấu' : 'Tổng thuật tạm thời'}</h3>` + paras.map(t => `<p>${esc(t)}</p>`).join('');
}


// Đảm bảo có đủ bàn thắng khớp tỷ số (dữ liệu mock thiếu) → hiện dưới tỷ số + trong Diễn biến
function mdEnrichGoals(data, kind, fx) {
  const m = data.match;
  const H = kind === 'live' ? ((fx && fx.goals_home_team) ?? 0) : (m.homeScore || 0);
  const A = kind === 'live' ? ((fx && fx.goals_away_team) ?? 0) : (m.awayScore || 0);
  const elapsed = kind === 'live' ? ((fx && fx.elapsed) || 67) : 90;
  let ev = (data.events || []).slice();
  const have = side => ev.filter(e => e.type === 'goal' && e.side === side).length;
  const names = side => ((data.lineups && data.lineups[side] && data.lineups[side].starters) || []).filter(p => p.line >= 2).map(p => p.name);
  const seed = Number(m.fixture_id) || 7;
  const slots = [9, 18, 27, 36, 44, 52, 61, 70, 79, 87];
  let added = false;
  ['home', 'away'].forEach((side, si) => {
    const need = Math.min(8, (side === 'home' ? H : A) - have(side));
    const nm = names(side);
    for (let i = 0; i < need; i++) {
      const base = slots[(seed + i * 3 + si * 2) % slots.length];
      let minute = Math.min(base, Math.max(3, elapsed - 2 - i));
      while (ev.some(e => e.minute === minute && e.type === 'goal')) minute = Math.max(2, minute - 1);
      const team = side === 'home' ? m.home_team.team_name : m.away_team.team_name;
      ev.push({ minute, side, type: 'goal', player: nm.length ? nm[(seed + i * 2 + si) % nm.length] : `Cầu thủ ${team}` });
      added = true;
    }
  });
  if (added) {
    ev.sort((a, b) => a.minute - b.minute);
    data.events = ev;
    mdState.curEvents = ev;
    const box = document.getElementById('md-timeline-container');
    if (box) {
      document.getElementById('md-tl-more')?.remove();
      box.classList.remove('md-tl-open', 'md-tl-fade'); box.style.maxHeight = '';
      renderTimelineTab(m, ev);
    }
  }
  // Danh sách ghi bàn dưới tỷ số
  const goals = ev.filter(e => e.type === 'goal');
  const fill = (id, side) => {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = goals.filter(g => g.side === side).map(g => side === 'home'
      ? `<div class="vne-md-scorer-item home"><span class="vne-md-scorer-txt"><b>${g.player}</b><em>${g.minute}'</em></span>${SOCCER_BALL_SVG}</div>`
      : `<div class="vne-md-scorer-item away">${SOCCER_BALL_SVG}<span class="vne-md-scorer-txt"><b>${g.player}</b><em>${g.minute}'</em></span></div>`).join('');
  };
  fill('md-home-scorers', 'home'); fill('md-away-scorers', 'away');
  if (kind === 'finished') {
    const g1 = goals.filter(g => g.minute <= 45);
    const h1 = g1.filter(g => g.side === 'home').length;
    const ht = document.getElementById('md-halftime-text');
    if (ht && (m.halftimeText === undefined || /0 - 0/.test(m.halftimeText))) ht.textContent = `Hiệp một: ${h1} - ${g1.length - h1}`;
  }
}
