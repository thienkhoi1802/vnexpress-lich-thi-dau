const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Independent SEO Friendly Main Routes
app.get(['/ket-qua', '/ket-qua-bong-da'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get(['/lich-thi-dau', '/lich-thi-dau-bong-da'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/live', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SEO Friendly League Detail Routes
app.get('/giai-dau/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'league-detail.html'));
});

app.get('/giai-dau/:slug/:tab', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'league-detail.html'));
});

// SEO Friendly Team Detail Routes
app.get('/doi-bong/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'team-detail.html'));
});

app.get('/doi-bong/:slug/:tab', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'team-detail.html'));
});

// SEO Friendly Match Detail Routes (with independent sub-tab URLs)
app.get('/tran-dau/:matchSlug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'match-detail.html'));
});

app.get('/tran-dau/:matchSlug/:tab', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'match-detail.html'));
});

// Article Route matching VnExpress URL template: /slug-cua-bai-id.html
app.get(/^\/([a-zA-Z0-9_-]+)-(\d+)\.html$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'article.html'));
});

// SEO Friendly Player Detail Routes (with 2 independent sub-tab URLs)
app.get(['/cau-thu/:slug', '/cau-thu/:slug/tong-quan'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player-detail.html'));
});

app.get('/cau-thu/:slug/thong-ke', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player-detail.html'));
});

app.get('/cau-thu/:slug/:tab', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player-detail.html'));
});

// 25 Leagues configuration from prompt
const LEAGUES = [
  { id: 39, slug: 'ngoai-hang-anh', name: 'Premier League', vnName: 'Ngoại hạng Anh', country: 'Anh', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/39.png?v=1', color: '#38003c' },
  { id: 2, slug: 'champions-league', name: 'UEFA Champions League', vnName: 'Champions League', country: 'Châu Âu', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/2.png?v=1', color: '#00143c' },
  { id: 340, slug: 'v-league', name: 'V-League', vnName: 'V-League', country: 'Việt Nam', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/340.png?v=1', color: '#d32f2f' },
  { id: 140, slug: 'la-liga', name: 'La Liga', vnName: 'La Liga', country: 'Tây Ban Nha', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/140.png?v=1', color: '#ee1c25' },
  { id: 135, slug: 'serie-a', name: 'Serie A', vnName: 'Serie A', country: 'Ý', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/135.png?v=1', color: '#024494' },
  { id: 78, slug: 'bundesliga', name: 'Bundesliga', vnName: 'Bundesliga', country: 'Đức', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/78.png?v=1', color: '#d20515' },
  { id: 3, slug: 'europa-league', name: 'UEFA Europa League', vnName: 'Europa League', country: 'Châu Âu', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/3.png?v=1', color: '#f68e14' },
  { id: 61, slug: 'ligue-1', name: 'Ligue 1', vnName: 'Ligue 1', country: 'Pháp', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/61.png?v=1', color: '#091c3e' },
  { id: 307, slug: 'saudi-pro-league', name: 'Saudi Pro League', vnName: 'Saudi Pro League', country: 'Ả Rập Xê Út', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/307.png?v=1', color: '#137039' },
  { id: 253, slug: 'mls', name: 'Major League Soccer', vnName: 'MLS', country: 'Mỹ', tier: 1, logo: 'https://is.vnecdn.net/objects/leagues/253.png?v=1', color: '#002244' },
  // Tier 2 & Cups
  { id: 45, slug: 'fa-cup', name: 'FA Cup', vnName: 'FA Cup', country: 'Anh', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/45.png?v=1', color: '#d32f2f' },
  { id: 48, slug: 'carabao-cup', name: 'League Cup - Carabao Cup', vnName: 'Carabao Cup', country: 'Anh', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/48.png?v=1', color: '#00a651' },
  { id: 66, slug: 'coupe-de-france', name: 'Cup QG Pháp - Coupe de France', vnName: 'Coupe de France', country: 'Pháp', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/66.png?v=1', color: '#002060' },
  { id: 81, slug: 'dfb-pokal', name: 'Cup QG Đức', vnName: 'DFB-Pokal', country: 'Đức', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/81.png?v=1', color: '#006400' },
  { id: 143, slug: 'copa-del-rey', name: 'Cúp nhà vua - Copa del Rey', vnName: 'Copa del Rey', country: 'Tây Ban Nha', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/143.png?v=1', color: '#e53935' },
  { id: 137, slug: 'coppa-italia', name: 'Coppa Italia', vnName: 'Coppa Italia', country: 'Ý', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/137.png?v=1', color: '#004080' },
  { id: 504, slug: 'kings-cup', name: "King's Cup", vnName: "King's Cup", country: 'Ả Rập Xê Út', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/504.png?v=1', color: '#1b5e20' },
  { id: 637, slug: 'giai-hang-nhat', name: 'Giải hạng nhất', vnName: 'Giải hạng nhất', country: 'Việt Nam', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/637.png?v=1', color: '#e65100' },
  { id: 341, slug: 'cup-quoc-gia', name: 'Cúp QG', vnName: 'Cúp Quốc gia', country: 'Việt Nam', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/341.png?v=1', color: '#b71c1c' },
  { id: 848, slug: 'conference-league', name: 'UEFA Europa Conference League', vnName: 'Conference League', country: 'Châu Âu', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/848.png?v=1', color: '#008080' },
  { id: 5, slug: 'nations-league', name: 'UEFA Nations League', vnName: 'Nations League', country: 'Châu Âu', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/5.png?v=1', color: '#1a237e' },
  { id: 32, slug: 'vong-loai-wc-chau-au', name: 'World Cup - Qualification Europe', vnName: 'Vòng loại WC Châu Âu', country: 'Châu Âu', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/32.png?v=1', color: '#0d47a1' },
  { id: 34, slug: 'vong-loai-wc-nam-my', name: 'World Cup - Qualification South America', vnName: 'Vòng loại WC Nam Mỹ', country: 'Nam Mỹ', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/34.png?v=1', color: '#ffb300' },
  { id: 30, slug: 'vong-loai-wc-chau-a', name: 'World Cup - Qualification Asia', vnName: 'Vòng loại WC Châu Á', country: 'Châu Á', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/30.png?v=1', color: '#b71c1c' },
  { id: 15, slug: 'fifa-club-world-cup', name: 'FIFA Club World Cup', vnName: 'FIFA Club World Cup', country: 'Thế giới', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/15.png?v=1', color: '#2e7d32' },
  { id: 35, slug: 'asian-cup-qualification', name: 'Asian Cup - Qualification', vnName: 'Asian Cup - Qualification', country: 'Châu Á', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/35.png?v=1', color: '#e65100' },
  { id: 18, slug: 'afc-champions-league-two', name: 'AFC Champions League Two', vnName: 'AFC Champions League Two', country: 'Châu Á', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/18.png?v=1', color: '#0d47a1' },
  { id: 24, slug: 'asean-championship', name: 'ASEAN Championship', vnName: 'ASEAN Championship', country: 'Đông Nam Á', tier: 2, logo: 'https://is.vnecdn.net/objects/leagues/24.png?v=1', color: '#b71c1c' }
];

// Helper: Realtime Date Formatter in Vietnam Time (GMT+7)
function getTodayYmd() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// Top Hot Teams (from demo-final.jpeg & popular clubs)
const HOT_TEAMS = [
  { id: 42, name: 'Arsenal', country: 'Anh', logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1', leagueId: 39 },
  { id: 33, name: 'Manchester United', country: 'Anh', logo: 'https://is.vnecdn.net/objects/teams/33.png?v=1', leagueId: 39 },
  { id: 541, name: 'Real Madrid', country: 'Tây Ban Nha', logo: 'https://is.vnecdn.net/objects/teams/541.png?v=1', leagueId: 140 },
  { id: 529, name: 'Barcelona', country: 'Tây Ban Nha', logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1', leagueId: 140 },
  { id: 7471, name: 'Công An Hà Nội', country: 'Việt Nam', logo: 'https://is.vnecdn.net/objects/teams/7471.png?v=1', leagueId: 340 },
  { id: 4210, name: 'Hà Nội FC', country: 'Việt Nam', logo: 'https://is.vnecdn.net/objects/teams/4210.png?v=1', leagueId: 340 },
  // Extended teams (shown when clicking "Xem thêm")
  { id: 50, name: 'Man City', country: 'Anh', logo: 'https://is.vnecdn.net/objects/teams/50.png?v=1', leagueId: 39 },
  { id: 40, name: 'Liverpool', country: 'Anh', logo: 'https://is.vnecdn.net/objects/teams/40.png?v=1', leagueId: 39 },
  { id: 49, name: 'Chelsea', country: 'Anh', logo: 'https://is.vnecdn.net/objects/teams/49.png?v=1', leagueId: 39 },
  { id: 157, name: 'Bayern Munich', country: 'Đức', logo: 'https://is.vnecdn.net/objects/teams/157.png?v=1', leagueId: 78 },
  { id: 165, name: 'Borussia Dortmund', country: 'Đức', logo: 'https://is.vnecdn.net/objects/teams/165.png?v=1', leagueId: 78 },
  { id: 496, name: 'Juventus', country: 'Ý', logo: 'https://is.vnecdn.net/objects/teams/496.png?v=1', leagueId: 135 },
  { id: 505, name: 'Inter Milan', country: 'Ý', logo: 'https://is.vnecdn.net/objects/teams/505.png?v=1', leagueId: 135 },
  { id: 489, name: 'AC Milan', country: 'Ý', logo: 'https://is.vnecdn.net/objects/teams/489.png?v=1', leagueId: 135 },
  { id: 85, name: 'PSG', country: 'Pháp', logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1', leagueId: 61 },
  { id: 2939, name: 'Al-Nassr', country: 'Ả Rập Xê Út', logo: 'https://is.vnecdn.net/objects/teams/2939.png?v=1', leagueId: 307 },
  { id: 16035, name: 'Inter Miami', country: 'Mỹ', logo: 'https://is.vnecdn.net/objects/teams/16035.png?v=1', leagueId: 253 },
  { id: 4212, name: 'Thể Công - Viettel', country: 'Việt Nam', logo: 'https://is.vnecdn.net/objects/teams/4212.png?v=1', leagueId: 340 }
];

// In-memory cache
const cache = {
  fixtures: {}, // league_id -> { data, timestamp }
  standings: {}, // league_id -> { data, timestamp }
  topscorers: {}, // league_id -> { data, timestamp }
  news: { data: [], timestamp: 0 },
  simulatedLiveMatches: [], // for live mode demo simulation
  articles: {} // article_id -> { data, timestamp }
};

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// =========================================================================
// REALTIME FIXTURE CRAWL SERVICE FOR ALL 28 FOOTBALL LEAGUES (2-HOUR RECURRING CRAWL)
// Cập nhật realtime toàn bộ 28 giải bóng đá trong ứng dụng mỗi 2 tiếng một lần
// Thời gian ứng dụng chạy theo thời gian thực (Real-Time)
// =========================================================================
const REALTIME_SYNC_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

const syncState = {
  lastSyncTime: null,
  nextSyncTime: null,
  status: 'initialized',
  totalLeagues: 28,
  syncedLeaguesCount: 0,
  totalMatches: 0,
  finishedMatches: 0,
  upcomingMatches: 0,
  leagueMetrics: {},
  lastError: null
};

async function crawlAllLeaguesRealtime() {
  const syncStartTime = new Date();
  console.log(`[${syncStartTime.toISOString()}] [2H CRAWLER] Bắt đầu thu thập dữ liệu realtime toàn bộ ${LEAGUES.length} giải đấu...`);

  let totalMatches = 0;
  let totalFinished = 0;
  let totalUpcoming = 0;
  let syncedCount = 0;
  const metrics = {};

  // Crawl in parallel batches of 5 to maximize throughput without overwhelming network
  for (let i = 0; i < LEAGUES.length; i += 5) {
    const batch = LEAGUES.slice(i, i + 5);
    await Promise.all(batch.map(async (l) => {
      try {
        const url = `https://gw.vnexpress.net/football/fixture?league_id=${l.id}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = json?.data?.[String(l.id)]?.data || [];

        cache.fixtures[l.id] = { data: list, timestamp: Date.now() };

        const finished = list.filter(m => ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short)).length;
        const upcoming = list.length - finished;

        totalMatches += list.length;
        totalFinished += finished;
        totalUpcoming += upcoming;
        syncedCount++;

        metrics[l.id] = {
          name: l.vnName,
          slug: l.slug,
          total: list.length,
          finished,
          upcoming
        };
      } catch (err) {
        console.warn(`[2H CRAWLER] Warning khi crawl giải ${l.id} (${l.vnName}):`, err.message);
        metrics[l.id] = {
          name: l.vnName,
          slug: l.slug,
          error: err.message
        };
      }
    }));
  }

  // Preload standings & topscorers for major leagues
  const topStandingsIds = [39, 140, 135, 78, 61, 340, 307, 253, 2, 3, 848];
  for (const id of topStandingsIds) {
    getLeagueStandings(id).catch(() => {});
    getLeagueTopscorers(id).catch(() => {});
  }

  syncState.lastSyncTime = syncStartTime.toISOString();
  syncState.nextSyncTime = new Date(Date.now() + REALTIME_SYNC_INTERVAL_MS).toISOString();
  syncState.status = 'active';
  syncState.totalLeagues = LEAGUES.length;
  syncState.syncedLeaguesCount = syncedCount;
  syncState.totalMatches = totalMatches;
  syncState.finishedMatches = totalFinished;
  syncState.upcomingMatches = totalUpcoming;
  syncState.leagueMetrics = metrics;
  syncState.lastError = null;

  console.log(`[${new Date().toISOString()}] [2H CRAWLER] Đã crawl thành công ${syncedCount}/${LEAGUES.length} giải (${totalMatches} trận đấu, ${totalFinished} trận kết thúc, ${totalUpcoming} trận sắp đấu). Lượt tiếp theo lúc: ${syncState.nextSyncTime}`);
}

// Thiết lập định kỳ mỗi 2 tiếng một lần
// (Trên Vercel serverless không có tiến trình nền: cache nạp theo yêu cầu)
if (!process.env.VERCEL) setInterval(crawlAllLeaguesRealtime, REALTIME_SYNC_INTERVAL_MS);

// Fetch fixtures for a league with cache
async function getLeagueFixtures(leagueId) {
  const idNum = parseInt(leagueId);
  const now = Date.now();

  // If in cache and fresh within REALTIME_SYNC_INTERVAL_MS (2 hours)
  if (cache.fixtures[idNum] && (now - cache.fixtures[idNum].timestamp < REALTIME_SYNC_INTERVAL_MS)) {
    return cache.fixtures[idNum].data;
  }

  // Fallback fetch directly if not yet cached
  try {
    const res = await fetch(`https://gw.vnexpress.net/football/fixture?league_id=${idNum}`);
    if (res.ok) {
      const json = await res.json();
      const list = json?.data?.[String(idNum)]?.data || [];
      cache.fixtures[idNum] = { data: list, timestamp: now };
      return list;
    }
  } catch (err) {
    console.error(`Lỗi tải giải ${idNum}:`, err.message);
  }

  if (cache.fixtures[leagueId] && (now - cache.fixtures[leagueId].timestamp < CACHE_TTL)) {
    return cache.fixtures[leagueId].data;
  }

  try {
    const res = await fetch(`https://gw.vnexpress.net/football/fixture?league_id=${leagueId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    let data = json?.data?.[leagueId]?.data || [];

    // Ensure showcase matches (PSG vs Barca 1001 & Arsenal vs Porto 1002 with Penalty) in Champions League (id: 2)
    if (parseInt(leagueId) === 2 && !data.some(m => m.fixture_id === 1001)) {
      data = [
        {
          fixture_id: 1001,
          league_id: 2,
          event_date: '2026-10-16T02:00:00+07:00',
          display_header_date: 'Thứ sáu 16/10/2026, 02:00 - Lượt 3',
          event_timestamp: Math.floor(Date.now() / 1000) - 7200,
          round: 'Lượt 3',
          status: 'Match Finished',
          status_short: 'FT',
          goals_home_team: 4,
          goals_away_team: 2,
          broadcast: 'TV360',
          score: { halftime: '1 - 0', fulltime: '4 - 2' },
          league: {
            name: 'UEFA Champions League',
            country: 'Châu Âu',
            logo: 'https://is.vnecdn.net/objects/leagues/2.png?v=1'
          },
          home_team: {
            team_id: 85,
            team_name: 'PSG',
            logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1'
          },
          away_team: {
            team_id: 529,
            team_name: 'Barca',
            logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1'
          }
        },
        {
          fixture_id: 1002,
          league_id: 2,
          event_date: '2026-10-16T02:00:00+07:00',
          display_header_date: 'Thứ sáu 16/10/2026, 02:00 - Vòng 1/8',
          event_timestamp: Math.floor(Date.now() / 1000) - 7200,
          round: 'Vòng 1/8',
          status: 'Match Finished',
          status_short: 'PEN',
          goals_home_team: 1,
          goals_away_team: 1,
          penalty_home: 4,
          penalty_away: 2,
          broadcast: 'FPT Play',
          score: { halftime: '1 - 0', fulltime: '1 - 1', extra_time: '1 - 1', penalty: '4 - 2' },
          league: {
            name: 'UEFA Champions League',
            country: 'Châu Âu',
            logo: 'https://is.vnecdn.net/objects/leagues/2.png?v=1'
          },
          home_team: {
            team_id: 42,
            team_name: 'Arsenal',
            logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1'
          },
          away_team: {
            team_id: 50,
            team_name: 'Porto',
            logo: 'https://is.vnecdn.net/objects/teams/50.png?v=1'
          }
        },
        ...data
      ];
    }

    cache.fixtures[leagueId] = { data, timestamp: now };
    return data;
  } catch (err) {
    console.error(`Error fetching fixtures for league ${leagueId}:`, err.message);
    return cache.fixtures[leagueId]?.data || [];
  }
}

// Fetch standings for a league with cache
async function getLeagueStandings(leagueId) {
  const now = Date.now();
  if (cache.standings[leagueId] && (now - cache.standings[leagueId].timestamp < CACHE_TTL)) {
    return cache.standings[leagueId].data;
  }

  try {
    const res = await fetch(`https://gw.vnexpress.net/football/standing?league_id=${leagueId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json?.data?.[leagueId]?.data || [];
    cache.standings[leagueId] = { data, timestamp: now };
    return data;
  } catch (err) {
    console.error(`Error fetching standings for league ${leagueId}:`, err.message);
    return cache.standings[leagueId]?.data || [];
  }
}

// Fetch topscorers for a league with cache
async function getLeagueTopscorers(leagueId) {
  const now = Date.now();
  if (cache.topscorers[leagueId] && (now - cache.topscorers[leagueId].timestamp < CACHE_TTL)) {
    return cache.topscorers[leagueId].data;
  }

  try {
    const res = await fetch(`https://gw.vnexpress.net/football/topscorer?league_id=${leagueId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json?.data?.[leagueId]?.data || [];
    cache.topscorers[leagueId] = { data, timestamp: now };
    return data;
  } catch (err) {
    console.error(`Error fetching topscorers for league ${leagueId}:`, err.message);
    return cache.topscorers[leagueId]?.data || [];
  }
}

// Fetch football news from VnExpress RSS feed
async function getFootballNews() {
  const now = Date.now();
  if (cache.news.data.length > 0 && (now - cache.news.timestamp < CACHE_TTL)) {
    return cache.news.data;
  }

  try {
    const res = await fetch('https://vnexpress.net/rss/the-thao.rss');
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 40) {
      const itemContent = match[1];
      const title = (itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || itemContent.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').trim();
      const link = (itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/)?.[1] || itemContent.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
      const pubDateStr = (itemContent.match(/<pubDate><!\[CDATA\[([\s\S]*?)\]\]><\/pubDate>/)?.[1] || itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim();
      const descRaw = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || itemContent.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';

      const imgMatch = descRaw.match(/src="([^">]+)"/);
      const thumbnail = imgMatch ? imgMatch[1] : 'https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png';

      const cleanDesc = descRaw
        .replace(/<a[\s\S]*?<\/a>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();

      // Guess category tag from content
      let category = 'Bóng đá';
      const text = `${title} ${cleanDesc}`.toLowerCase();
      if (text.includes('premier league') || text.includes('ngoại hạng anh') || text.includes('arsenal') || text.includes('man utd') || text.includes('man city') || text.includes('liverpool') || text.includes('chelsea') || text.includes('haaland') || text.includes('tottenham')) {
        category = 'Ngoại Hạng Anh';
      } else if (text.includes('v-league') || text.includes('việt nam') || text.includes('u17') || text.includes('cahn') || text.includes('hà nội fc') || text.includes('nam định')) {
        category = 'V-League';
      } else if (text.includes('champions league') || text.includes('cúp c1') || text.includes('c1')) {
        category = 'Cúp C1 Châu Âu';
      } else if (text.includes('la liga') || text.includes('barca') || text.includes('real madrid') || text.includes('atletico') || text.includes('el clasico')) {
        category = 'La Liga';
      } else if (text.includes('serie a') || text.includes('juventus') || text.includes('inter') || text.includes('milan') || text.includes('roma')) {
        category = 'Serie A';
      } else if (text.includes('bundesliga') || text.includes('bayern') || text.includes('dortmund') || text.includes('leverkusen')) {
        category = 'Bundesliga';
      } else if (text.includes('ligue 1') || text.includes('psg') || text.includes('marseille') || text.includes('monaco')) {
        category = 'Ligue 1';
      } else if (text.includes('europa league') || text.includes('cúp c2')) {
        category = 'Europa League';
      } else if (text.includes('ronaldo') || text.includes('al-nassr') || text.includes('al-hilal') || text.includes('saudi')) {
        category = 'Saudi Pro League';
      } else if (text.includes('messi') || text.includes('mls') || text.includes('inter miami')) {
        category = 'Nhà nghề Mỹ (MLS)';
      }

      // Calculate relative time
      let timeAgo = "Gần đây";
      try {
        const pubTime = new Date(pubDateStr).getTime();
        const diffMinutes = Math.max(1, Math.floor((Date.now() - pubTime) / 60000));
        if (diffMinutes < 60) {
          timeAgo = `${diffMinutes}' trước`;
        } else if (diffMinutes < 1440) {
          timeAgo = `${Math.floor(diffMinutes / 60)}h trước`;
        } else {
          timeAgo = `${Math.floor(diffMinutes / 1440)} ngày trước`;
        }
      } catch (e) {
        timeAgo = "Hôm nay";
      }

      items.push({
        id: items.length + 1,
        title,
        link,
        thumbnail,
        description: cleanDesc,
        pubDate: pubDateStr,
        timeAgo,
        category
      });
    }

    cache.news = { data: items, timestamp: now };
    return items;
  } catch (err) {
    console.error('Error fetching football news:', err.message);
    return cache.news.data;
  }
}

// Preload all 28 football leagues on startup and trigger initial 2-hour crawl
async function preload() {
  console.log('Khởi động crawl toàn bộ 28 giải bóng đá theo thời gian thực...');
  await crawlAllLeaguesRealtime();
  getFootballNews().catch(() => {});
}
if (!process.env.VERCEL) preload();

// API: Realtime Sync Status & Manual Trigger for all 28 Football Leagues
app.get('/api/sync-realtime', async (req, res) => {
  const { force } = req.query;
  if (force === 'true') {
    await crawlAllLeaguesRealtime();
  }
  res.json({
    message: 'Dịch vụ thu thập thông tin realtime toàn bộ 28 giải bóng đá mỗi 2 tiếng một lần theo thời gian thực',
    syncState,
    cachedLeaguesCount: Object.keys(cache.fixtures).length
  });
});

// API: System Configuration & Metadata (Chạy theo thời gian thực)
app.get('/api/config', (req, res) => {
  const todayDate = getTodayYmd();
  res.json({
    currentTime: new Date().toISOString(),
    todayDate: todayDate,
    leagues: LEAGUES,
    hotTeams: HOT_TEAMS,
    syncState
  });
});

// API: Standings
app.get('/api/standings', async (req, res) => {
  const { league_id } = req.query;

  if (league_id) {
    const data = await getLeagueStandings(parseInt(league_id));
    return res.json({ league_id: parseInt(league_id), data });
  }

  // If no league_id specified, return top standings for primary leagues
  const mainLeagueIds = [39, 340, 140, 135, 78, 61, 307, 253, 3, 2];
  const standingsMap = {};

  await Promise.all(
    mainLeagueIds.map(async id => {
      const data = await getLeagueStandings(id);
      if (data && data.length > 0) {
        standingsMap[id] = data;
      }
    })
  );

  res.json({ standings: standingsMap });
});

// API: Top Scorers
app.get('/api/topscorers', async (req, res) => {
  const leagueId = parseInt(req.query.league_id) || 39;
  const data = await getLeagueTopscorers(leagueId);
  res.json({ league_id: leagueId, data });
});

// API: League Detail Bundle
app.get('/api/league-detail', async (req, res) => {
  const { slug, league_id } = req.query;
  let league;
  if (slug) {
    league = LEAGUES.find(l => l.slug === slug);
  }
  if (!league && league_id) {
    league = LEAGUES.find(l => l.id === parseInt(league_id));
  }
  if (!league) {
    league = LEAGUES[1]; // UEFA Champions League default
  }
  const leagueId = league.id;
  
  // Parallel fetch
  const [fixtures, rawStandings, topscorers, allNews] = await Promise.all([
    getLeagueFixtures(leagueId),
    getLeagueStandings(leagueId),
    getLeagueTopscorers(leagueId),
    getFootballNews()
  ]);

  // Enrich fixtures with league info
  const enrichedFixtures = (fixtures || []).map(m => ({
    ...m,
    league_meta: {
      id: league.id,
      slug: league.slug,
      name: league.name,
      vnName: league.vnName,
      country: league.country,
      logo: league.logo
    }
  }));

  // Top Widget matches: pick sorted matches (recent finished + upcoming)
  const sortedFixtures = [...enrichedFixtures].sort((a, b) => (a.event_timestamp || 0) - (b.event_timestamp || 0));
  
  const nowTs = Math.floor(Date.now() / 1000);
  const today = getTodayYmd();

  // Find current/next matches for top slider
  let upcomingIdx = sortedFixtures.findIndex(m => (m.event_timestamp || 0) >= nowTs - 24 * 3600);
  if (upcomingIdx === -1) upcomingIdx = Math.max(0, sortedFixtures.length - 10);
  
  const startIdx = Math.max(0, upcomingIdx - 2);
  const topMatches = sortedFixtures.slice(startIdx, startIdx + 12);

  // 3 matches for Prediction Widget ("Dự đoán tỷ số")
  let predictionMatches = sortedFixtures.filter(m => (m.event_timestamp || 0) >= nowTs - 12 * 3600).slice(0, 3);
  if (predictionMatches.length < 3) {
    predictionMatches = sortedFixtures.slice(0, 3);
  }

  // 1. Full Upcoming Matches (Lịch thi đấu: hôm nay đi về tương lai)
  // Sorted chronologically (kickoff earliest to latest)
  const upcomingMatches = sortedFixtures.filter(m => {
    const isFinished = ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short) || m.status === 'Match Finished';
    return !isFinished;
  }).sort((a, b) => (a.event_timestamp || 0) - (b.event_timestamp || 0));

  // 2. Full Past Results (Kết quả: hôm nay trở về quá khứ)
  // Sorted reverse-chronological (most recent finished first)
  const pastMatches = sortedFixtures.filter(m => {
    const isFinished = ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short) || m.status === 'Match Finished';
    return isFinished;
  }).sort((a, b) => (b.event_timestamp || 0) - (a.event_timestamp || 0));

  // 3. Full Detailed Standings (Bảng xếp hạng đầy đủ với nhiều cột thông số)
  const standings = (rawStandings || []).map(s => {
    const pld = s.all?.matchs_played ?? 0;
    const win = s.all?.win ?? 0;
    const pts = s.points ?? 0;
    const draw = Math.max(0, pts - (win * 3));
    const lose = Math.max(0, pld - win - draw);
    const gf = s.all?.goals_for ?? 0;
    const ga = s.all?.goals_against ?? 0;
    const gd = s.goals_diff ?? (gf - ga);
    return {
      ...s,
      calculated: {
        played: pld,
        win,
        draw,
        lose,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDiff: gd,
        points: pts,
        forme: s.forme || ''
      }
    };
  });

  // Filter or prioritize news for this league
  let leagueNews = allNews.filter(n => {
    const text = (n.title + ' ' + n.description + ' ' + n.category).toLowerCase();
    if (leagueId === 2) {
      return text.includes('champions league') || text.includes('c1') || text.includes('haaland') || text.includes('barca') || text.includes('real madrid') || text.includes('bayern') || text.includes('dortmund') || text.includes('psg') || text.includes('liverpool') || text.includes('arsenal');
    }
    if (leagueId === 39) {
      return text.includes('ngoại hạng anh') || text.includes('premier league') || text.includes('man utd') || text.includes('arsenal') || text.includes('chelsea') || text.includes('liverpool') || text.includes('man city') || text.includes('tottenham');
    }
    if (leagueId === 140) {
      return text.includes('la liga') || text.includes('real madrid') || text.includes('barca') || text.includes('atletico');
    }
    if (leagueId === 340) {
      return text.includes('v-league') || text.includes('việt nam') || text.includes('cahn') || text.includes('hà nội');
    }
    return text.includes(league.name.toLowerCase()) || text.includes(league.vnName.toLowerCase());
  });

  // Ensure at least 40 news items by filling with general football news
  const seenIds = new Set(leagueNews.map(n => n.id));
  for (const n of allNews) {
    if (!seenIds.has(n.id)) {
      leagueNews.push(n);
      seenIds.add(n.id);
    }
  }

  res.json({
    league,
    allLeagues: LEAGUES,
    topMatches,
    predictionMatches,
    upcomingMatches,
    pastMatches,
    standings,
    topscorers: topscorers || [],
    news: leagueNews,
    syncState
  });
});

// API: News with pagination
app.get('/api/news', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 20);
  const category = req.query.category;

  let allNews = await getFootballNews();
  if (category) {
    allNews = allNews.filter(n => n.category.toLowerCase().includes(category.toLowerCase()));
  }

  const total = allNews.length;
  const startIndex = (page - 1) * limit;
  const items = allNews.slice(startIndex, startIndex + limit);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    items
  });
});

// Helper: Format Vietnamese date (Thứ X, ngày DD/MM/YYYY)
function formatVietnameseDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayName = days[d.getDay()] || 'Hôm nay';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayName}, ngày ${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return 'Hôm nay';
  }
}

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

// Helper: Format Round Name
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
  if (/Round of 16/i.test(rKey)) return 'Vòng 1/8';
  if (/Quarter-finals/i.test(rKey)) return 'Tứ kết';
  if (/Semi-finals/i.test(rKey)) return 'Bán kết';
  if (/Final/i.test(rKey)) return 'Chung kết';
  return rKey;
}

// Helper: Build Embedded Match Widget (Image 2 design with no 'Xem tất cả' and direct links)
function buildEmbeddedWidgetData(fixturesList, league) {
  const nowTs = Math.floor(Date.now() / 1000);
  const finishedStatuses = ['FT', 'AET', 'PEN', 'Match Finished'];
  const list = fixturesList || [];

  const upcoming = list
    .filter(m => !finishedStatuses.includes(m.status_short) && m.status !== 'Match Finished' && (m.event_timestamp || 0) >= nowTs - 3600 * 4)
    .sort((a, b) => (a.event_timestamp || 0) - (b.event_timestamp || 0));

  let chosenMatches = [];
  let dateTitle = '';

  if (upcoming.length >= 4) {
    const firstDateStr = upcoming[0].event_date.split('T')[0];
    dateTitle = formatVietnameseDate(upcoming[0].event_date);
    const sameDate = upcoming.filter(m => m.event_date.startsWith(firstDateStr));
    if (sameDate.length >= 4) {
      chosenMatches = sameDate.slice(0, 6);
    } else {
      chosenMatches = upcoming.slice(0, 6);
    }
  } else {
    const sorted = [...list].sort((a, b) => (a.event_timestamp || 0) - (b.event_timestamp || 0));
    let nextIdx = sorted.findIndex(m => (m.event_timestamp || 0) >= nowTs - 3600 * 12);
    if (nextIdx === -1) nextIdx = Math.max(0, sorted.length - 6);
    const startIdx = Math.max(0, nextIdx - 3);
    chosenMatches = sorted.slice(startIdx, startIdx + 6);
    if (chosenMatches.length > 0) {
      dateTitle = formatVietnameseDate(chosenMatches[0].event_date);
    }
  }

  const matches = chosenMatches.map(m => {
    const isFinished = finishedStatuses.includes(m.status_short) || m.status === 'Match Finished';
    let timeOrScore = '';
    if (isFinished) {
      timeOrScore = `${m.goals_home_team ?? 0} : ${m.goals_away_team ?? 0}`;
    } else {
      const d = new Date(m.event_date);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      timeOrScore = `${hh} : ${mm}`;
    }

    const homeName = m.home_team?.team_name || 'Home';
    const awayName = m.away_team?.team_name || 'Away';
    const matchSlug = `${toSeoSlugServer(homeName)}-vs-${toSeoSlugServer(awayName)}-${m.fixture_id}`;

    return {
      fixtureId: m.fixture_id,
      round: formatRoundName(m.round),
      homeTeam: homeName,
      homeLogo: m.home_team?.logo || 'https://is.vnecdn.net/objects/teams/40.png?v=1',
      awayTeam: awayName,
      awayLogo: m.away_team?.logo || 'https://is.vnecdn.net/objects/teams/40.png?v=1',
      timeOrScore,
      isFinished,
      isLive: ['LIVE', '1H', '2H', 'HT', 'ET', 'P'].includes(m.status_short),
      matchSlug
    };
  });

  const leagueTitleName = league.vnName || league.name;

  return {
    title: `Lịch đấu – Kết quả ${leagueTitleName}`,
    dateTitle: dateTitle || 'Hôm nay',
    matches,
    resultsUrl: `/giai-dau/${league.slug}/ket-qua`,
    fixturesUrl: `/giai-dau/${league.slug}/lich-thi-dau`
  };
}

// Service: Fetch, Parse & Clean VnExpress Article (No Ads, Authentic Structure)
async function getArticleDetail(slug, id) {
  const articleId = String(id);
  const now = Date.now();
  if (cache.articles && cache.articles[articleId] && (now - cache.articles[articleId].timestamp < 30 * 60 * 1000)) {
    return cache.articles[articleId].data;
  }

  const targetUrl = `https://vnexpress.net/${slug}-${articleId}.html`;
  let html = '';
  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch (err) {
    console.error('Error fetching VnExpress article:', err.message);
  }

  let title = '', date = '', lead = '', body = '', author = '', tags = [];
  let detectedLeague = null;

  if (html) {
    // 1. Title
    title = (html.match(/<h1 class="title-detail[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').trim();
    title = title.replace(/<[^>]+>/g, '').trim();

    // 2. Date
    date = (html.match(/<span class="date"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || '').trim();

    // 3. Lead / Description
    lead = (html.match(/<p class="description"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '').trim();

    // 4. Body
    const bodyMatch = html.match(/<article class="fck_detail[^>]*>([\s\S]*?)<\/article>/i);
    body = bodyMatch ? bodyMatch[1] : '';

    // 5. Author
    const authorMatch = body.match(/<p class="Normal"[^>]*style="[^"]*text-align:\s*right[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                        body.match(/<p class="author"[^>]*>([\s\S]*?)<\/p>/i);
    if (authorMatch) {
      author = authorMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // 6. Tags
    const metaTag = html.match(/<meta property="article:tag" content="([^"]+)"/i) || html.match(/<meta name="its_tag" content="([^"]+)"/i);
    if (metaTag && metaTag[1]) {
      tags = metaTag[1].split(',').map(t => t.trim()).filter(Boolean);
    }

    // 7. League Detection via comp id
    const compIdMatch = html.match(/data-component-competition="(\d+)"/i);
    if (compIdMatch) {
      const compId = parseInt(compIdMatch[1]);
      detectedLeague = LEAGUES.find(l => l.id === compId);
    }
  }

  // Fallback to cached football news if fetch was unavailable
  if (!title) {
    const cachedItem = cache.news.data.find(n => String(n.id) === articleId || n.link.includes(articleId));
    if (cachedItem) {
      title = cachedItem.title;
      lead = cachedItem.description;
      date = cachedItem.pubDate || 'Thứ năm, 29/10/2026, 06:39 (GMT+7)';
      body = `<p class="Normal">${cachedItem.description}</p>`;
      author = 'VnExpress Thể Thao';
    } else {
      title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      lead = 'Nội dung chi tiết bài viết thể thao.';
      date = 'Thứ năm, 29/10/2026, 06:39 (GMT+7)';
      body = `<p class="Normal">Đang cập nhật nội dung chi tiết bài viết...</p>`;
    }
  }

  // Detect League from keywords if not already detected
  if (!detectedLeague) {
    const textToSearch = (title + ' ' + lead + ' ' + tags.join(' ')).toLowerCase();
    if (textToSearch.includes('afc champions league') || textToSearch.includes('c1 châu á')) {
      detectedLeague = LEAGUES.find(l => l.id === 18) || LEAGUES.find(l => l.slug === 'afc-champions-league-two');
    } else if (textToSearch.includes('carabao') || textToSearch.includes('cup liên đoàn') || textToSearch.includes('cúp liên đoàn') || textToSearch.includes('league cup')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'carabao-cup');
    } else if (textToSearch.includes('fa cup')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'fa-cup');
    } else if (textToSearch.includes('v-league') || textToSearch.includes('vleague') || textToSearch.includes('u17') || textToSearch.includes('cahn') || textToSearch.includes('hà nội fc') || textToSearch.includes('thể công') || textToSearch.includes('nam định')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'v-league');
    } else if (textToSearch.includes('la liga') || textToSearch.includes('barca') || textToSearch.includes('real madrid') || textToSearch.includes('atletico')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'la-liga');
    } else if (textToSearch.includes('serie a') || textToSearch.includes('juventus') || textToSearch.includes('inter milan') || textToSearch.includes('ac milan') || textToSearch.includes('as roma')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'serie-a');
    } else if (textToSearch.includes('bundesliga') || textToSearch.includes('bayern') || textToSearch.includes('dortmund') || textToSearch.includes('leverkusen')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'bundesliga');
    } else if (textToSearch.includes('ligue 1') || textToSearch.includes('psg') || textToSearch.includes('marseille') || textToSearch.includes('monaco')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'ligue-1');
    } else if (textToSearch.includes('champions league') || textToSearch.includes('cúp c1') || textToSearch.includes('uefa champions league')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'champions-league');
    } else if (textToSearch.includes('europa league') || textToSearch.includes('cúp c2')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'europa-league');
    } else if (textToSearch.includes('copa del rey') || textToSearch.includes('cúp nhà vua')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'copa-del-rey');
    } else if (textToSearch.includes('saudi') || textToSearch.includes('al-nassr') || textToSearch.includes('al-hilal')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'saudi-pro-league');
    } else if (textToSearch.includes('mls') || textToSearch.includes('inter miami')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'mls');
    } else if (textToSearch.includes('premier league') || textToSearch.includes('ngoại hạng anh') || textToSearch.includes('arsenal') || textToSearch.includes('chelsea') || textToSearch.includes('liverpool') || textToSearch.includes('man utd') || textToSearch.includes('man city') || textToSearch.includes('tottenham') || textToSearch.includes('haaland')) {
      detectedLeague = LEAGUES.find(l => l.slug === 'ngoai-hang-anh');
    } else {
      detectedLeague = LEAGUES.find(l => l.slug === 'ngoai-hang-anh') || LEAGUES[0];
    }
  }

  // Strict cleaning: Strip ALL advertising, tracking, banners, iframes
  body = body.replace(/<h1 class="title-detail[\s\S]*?<\/h1>/gi, '');
  body = body.replace(/<p class="description"[\s\S]*?<\/p>/gi, '');
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  body = body.replace(/<!--[\s\S]*?-->/g, '');
  body = body.replace(/<div[^>]*class="[^"]*(box-advertising|banner|banner_ads|ad-container|box-ad|eclick|adv_|beacon_|sponsor)[^"]*"[\s\S]*?<\/div>/gi, '');
  body = body.replace(/<div[^>]*id="[^"]*(ad_|banner_|adv_|beacon_|google_ads|dfp_)[^"]*"[\s\S]*?<\/div>/gi, '');
  body = body.replace(/<div class="component widget_soccer"[\s\S]*?<\/div>/gi, '');

  // Convert lazy image attributes (data-src -> src) and remove 1x1 base64 gifs
  body = body.replace(/<img([^>]+)>/gi, (imgTag, attrs) => {
    let src = '';
    const dataSrcMatch = attrs.match(/data-src="([^">]+)"/i);
    const regularSrcMatch = attrs.match(/src="([^">]+)"/i);
    if (dataSrcMatch && !dataSrcMatch[1].startsWith('data:')) {
      src = dataSrcMatch[1];
    } else if (regularSrcMatch && !regularSrcMatch[1].startsWith('data:')) {
      src = regularSrcMatch[1];
    }
    if (src) {
      let altMatch = attrs.match(/alt="([^">]*)"/i);
      let alt = altMatch ? altMatch[1] : '';
      return `<img src="${src}" alt="${alt}" loading="lazy" class="vne-article-img">`;
    }
    return imgTag;
  });

  // Convert VnExpress article links to local links
  body = body.replace(/https:\/\/vnexpress\.net\/([a-zA-Z0-9_-]+-\d+\.html)/gi, '/$1');

  // Build the Embedded Match Widget Data (fallback to Ngoại hạng Anh if league has 0 fixtures)
  let leagueFixtures = await getLeagueFixtures(detectedLeague.id);
  let widgetLeague = detectedLeague;
  if (!leagueFixtures || leagueFixtures.length === 0) {
    const epl = LEAGUES.find(l => l.slug === 'ngoai-hang-anh') || LEAGUES[0];
    leagueFixtures = await getLeagueFixtures(epl.id);
    widgetLeague = epl;
  }
  const widgetData = buildEmbeddedWidgetData(leagueFixtures, widgetLeague);

  // Top 5 "Xem nhiều" sports news
  const allNews = await getFootballNews();
  const mostViewed = allNews.slice(0, 5).map(n => ({
    title: n.title,
    link: getArticleUrl(n.link),
    timeAgo: n.timeAgo,
    thumbnail: n.thumbnail
  }));

  // 4 Related news items for "Tin cùng chuyên mục"
  const relatedNews = allNews.filter(n => String(n.id) !== articleId).slice(0, 4).map(n => ({
    title: n.title,
    link: getArticleUrl(n.link),
    timeAgo: n.timeAgo,
    thumbnail: n.thumbnail,
    category: n.category
  }));

  const result = {
    id: articleId,
    slug,
    title,
    date,
    lead,
    body,
    author,
    tags,
    league: {
      id: detectedLeague.id,
      name: detectedLeague.name,
      vnName: detectedLeague.vnName || detectedLeague.name,
      slug: detectedLeague.slug,
      logo: detectedLeague.logo
    },
    widget: widgetData,
    mostViewed,
    relatedNews
  };

  if (!cache.articles) cache.articles = {};
  cache.articles[articleId] = { data: result, timestamp: now };
  return result;
}

// API: Article Detail Endpoint
app.get('/api/article', async (req, res) => {
  const { slug, id, url } = req.query;
  let targetSlug = slug;
  let targetId = id;

  if (url && (!targetSlug || !targetId)) {
    const match = url.match(/\/([a-zA-Z0-9_-]+)-(\d+)\.html$/);
    if (match) {
      targetSlug = match[1];
      targetId = match[2];
    }
  }

  if (!targetSlug || !targetId) {
    targetSlug = 'liverpool-thang-chelsea-luan-luu-o-cup-lien-doan';
    targetId = '5138105';
  }

  try {
    const article = await getArticleDetail(targetSlug, targetId);
    res.json(article);
  } catch (err) {
    console.error('Error serving article API:', err);
    res.status(500).json({ error: 'Không thể tải bài viết: ' + err.message });
  }
});

// API: Fixtures and Results
// Query params:
// - mode: 'future' (Lịch thi đấu) | 'past' (Kết quả) | 'live' (LIVE) | 'all'
// - date: 'YYYY-MM-DD' (specific date filter)
// - league_id: filter by specific league
// - team_id: filter by team
// - search: search term
app.get('/api/fixtures', async (req, res) => {
  const { mode = 'future', date, league_id, team_id, search } = req.query;
  const today = getTodayYmd();

  let targetLeagues = LEAGUES;
  if (league_id) {
    targetLeagues = LEAGUES.filter(l => l.id === parseInt(league_id));
  }

  let allMatches = [];

  for (const l of targetLeagues) {
    const fixtures = await getLeagueFixtures(l.id);
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
    const chList = defaultBroadcasts[l.id] || ['TV360', 'FPT Play', 'K+ SPORT 1', 'VTVcab'];

    for (const m of fixtures) {
      const broadcastChannel = m.broadcast || chList[(m.fixture_id || 0) % chList.length];
      // Enrich with broadcast channel and league metadata
      allMatches.push({
        ...m,
        broadcast: broadcastChannel,
        league_meta: {
          id: l.id,
          slug: l.slug,
          name: l.name,
          vnName: l.vnName,
          country: l.country,
          logo: l.logo
        }
      });
    }
  }

  const nowTs = Math.floor(Date.now() / 1000);
  const twelveHoursSec = 12 * 3600;

  // Filter according to rules
  let filtered = allMatches.filter(m => {
    const matchDate = m.event_date ? m.event_date.split('T')[0] : '';
    const matchTs = m.event_timestamp || Math.floor(new Date(m.event_date).getTime() / 1000);
    const isFinished = ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short) || m.status === 'Match Finished';
    const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'P'].includes(m.status_short);
    const isUpcoming = ['NS', 'Not Started', 'TBD', 'PST'].includes(m.status_short) || (!isFinished && !isLive);

    if (mode === 'future') {
      const isScheduled = ['NS', 'Not Started', 'TBD'].includes(m.status_short || m.status);
      return isScheduled && !isFinished && !isLive && matchTs > nowTs &&
        (!date || date === 'all' || matchDate === date);
    }

    // Rule 1: LIVE
    if (mode === 'live') {
      return isLive;
    }

    // Specific date filter: Tab 'Hôm nay' (date === today)
    if (date === today) {
      if (mode === 'past') {
        // Trang Kết quả, tab 'Hôm nay':
        // - Kết quả các trận đã đấu trong ngày hôm nay
        // - VÀ lịch thi đấu các trận trong 12 tiếng tới so với thời điểm hiện tại
        if (isFinished && matchDate === today) return true;
        if (isLive) return true;
        if (isUpcoming && (matchTs >= nowTs - 300 && matchTs <= nowTs + twelveHoursSec)) return true;
        return false;
      }

      return matchDate === today;
    }

    // Other specific date filters (e.g. 2026-10-17, 2026-10-15...)
    if (date && date !== 'all') {
      if (matchDate !== date) return false;

      if (mode === 'past') {
        // In "Kết quả", only show matches that have finished (results)
        return isFinished;
      }

      return true;
    }

    // Rule 3: Kết quả (today into the past when no specific date)
    if (mode === 'past') {
      if (matchDate < today && isFinished) return true;
      if (matchDate === today) {
        if (isFinished || (isUpcoming && matchTs >= nowTs - 300 && matchTs <= nowTs + twelveHoursSec)) return true;
      }
      return false;
    }

    return true;
  });

  // Filter by team_id
  if (team_id) {
    const tid = parseInt(team_id);
    filtered = filtered.filter(m => m.home_team?.team_id === tid || m.away_team?.team_id === tid);
  }

  // Search filter
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter(m => 
      m.home_team?.team_name?.toLowerCase().includes(s) ||
      m.away_team?.team_name?.toLowerCase().includes(s) ||
      m.league?.name?.toLowerCase().includes(s) ||
      m.league_meta?.vnName?.toLowerCase().includes(s)
    );
  }

  // Sorting
  if (date === today) {
    if (mode === 'past') {
      // For Kết quả tab 'Hôm nay': Finished matches of today first, then upcoming fixtures in next 12 hours
      filtered.sort((a, b) => {
        const aFin = ['FT', 'AET', 'PEN', 'Match Finished'].includes(a.status_short) ? 0 : 1;
        const bFin = ['FT', 'AET', 'PEN', 'Match Finished'].includes(b.status_short) ? 0 : 1;
        if (aFin !== bFin) return aFin - bFin;
        return (a.event_timestamp || 0) - (b.event_timestamp || 0);
      });
    } else {
      // For Lịch thi đấu tab 'Hôm nay': sort chronologically by kickoff time
      filtered.sort((a, b) =>
        (a.event_timestamp || Date.parse(a.event_date) / 1000) -
        (b.event_timestamp || Date.parse(b.event_date) / 1000)
      );
    }
  } else if (mode === 'future') {
    filtered.sort((a, b) =>
      (a.event_timestamp || Date.parse(a.event_date) / 1000) -
      (b.event_timestamp || Date.parse(b.event_date) / 1000)
    );
  } else if (mode === 'past') {
    // Results: reverse-chronological (most recent first)
    filtered.sort((a, b) => (b.event_timestamp || 0) - (a.event_timestamp || 0));
  } else {
    filtered.sort((a, b) => (b.event_timestamp || 0) - (a.event_timestamp || 0));
  }

  // Group by league and date for frontend convenience
  const groupedByLeague = {};
  filtered.forEach(m => {
    const lid = m.league_id;
    if (!groupedByLeague[lid]) {
      groupedByLeague[lid] = {
        league: m.league_meta || m.league,
        matches: []
      };
    }
    groupedByLeague[lid].matches.push(m);
  });

  res.json({
    mode,
    date: date || (mode === 'future' ? 'future' : mode === 'past' ? 'past' : 'live'),
    totalMatches: filtered.length,
    groups: Object.values(groupedByLeague),
    matches: filtered.slice(0, 150) // limit for safety
  });
});

// API: Toggle or simulate a LIVE match for demonstration
let simulationEnabled = false;
app.get('/api/simulation/toggle', (req, res) => {
  simulationEnabled = !simulationEnabled;
  res.json({ simulationEnabled });
});

app.get('/api/live-matches', (req, res) => {
  // Check if real live matches exist, or if demo simulation is active
  const liveMatches = [
    {
      fixture_id: 999001,
      league_id: 39,
      event_date: '2026-10-16T13:30:00+07:00',
      event_timestamp: Math.floor(Date.now() / 1000) - 3900,
      round: 'Regular Season - 8',
      status: '2nd Half',
      status_short: '2H',
      elapsed: 68,
      goals_home_team: 2,
      goals_away_team: 1,
      league: {
        name: 'Premier League',
        country: 'England',
        logo: 'https://is.vnecdn.net/objects/leagues/39.png?v=1'
      },
      league_meta: {
        id: 39,
        name: 'Premier League',
        vnName: 'Ngoại hạng Anh',
        country: 'Anh',
        logo: 'https://is.vnecdn.net/objects/leagues/39.png?v=1'
      },
      home_team: {
        team_id: 42,
        team_name: 'Arsenal',
        logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1'
      },
      away_team: {
        team_id: 49,
        team_name: 'Chelsea',
        logo: 'https://is.vnecdn.net/objects/teams/49.png?v=1'
      },
      score: {
        halftime: '1-0',
        fulltime: '2-1'
      }
    }
  ];

  res.json({
    count: liveMatches.length,
    matches: liveMatches
  });
});

// =========================================================================
// MATCH DETAIL ENGINE & API (/api/match-detail)
// =========================================================================

function toSeoSlugServer(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatVietnameseMatchHeader(dateStr, roundStr) {
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const d = dateStr ? new Date(dateStr) : new Date('2026-10-21T02:00:00+07:00');
  const dayName = days[d.getDay()] || 'Thứ tư';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  let cleanRound = roundStr || 'Lượt 3';
  cleanRound = cleanRound
    .replace(/Regular Season -\s*/i, 'Vòng ')
    .replace(/League Stage -\s*/i, 'Lượt ')
    .replace(/Group Stage -\s*/i, 'Lượt ');

  return `${dayName} ${dd}/${mm}/${yyyy}, ${hh}:${min} - ${cleanRound}`;
}

// Curated Squad Presets for realistic lineups across top clubs
const TEAM_SQUADS = {
  85: { // PSG
    formation: '4-3-3',
    starters: [
      { number: 39, name: 'M. Safonov', fullName: 'Matvey Safonov', pos: 'Thủ môn', line: 0 },
      { number: 2, name: 'A. Hakimi', fullName: 'Achraf Hakimi', pos: 'Hậu vệ', line: 1 },
      { number: 5, name: 'Marquinhos', fullName: 'Marcos Aoás Corrêa', pos: 'Hậu vệ', line: 1 },
      { number: 51, name: 'W. Pacho', fullName: 'Willian Pacho', pos: 'Hậu vệ', line: 1 },
      { number: 21, name: 'L. Hernández', fullName: 'Lucas Hernández', pos: 'Hậu vệ', line: 1 },
      { number: 87, name: 'J. Neves', fullName: 'João Neves', pos: 'Tiền vệ', line: 2 },
      { number: 17, name: 'Vitinha', fullName: 'Vitinha', pos: 'Tiền vệ', line: 2 },
      { number: 8, name: 'F. Ruiz', fullName: 'Fabián Ruiz', pos: 'Tiền vệ', line: 2 },
      { number: 14, name: 'D. Doué', fullName: 'Désiré Doue', pos: 'Tiền đạo', line: 3 },
      { number: 10, name: 'O. Dembélé', fullName: 'Ousmane Dembélé', pos: 'Tiền đạo', line: 3 },
      { number: 7, name: 'K. Kvaratskhelia', fullName: 'Khvicha Kvaratskhelia', pos: 'Tiền đạo', line: 3 }
    ],
    subs: [
      { number: 11, name: 'M. Akliouche', pos: 'Tiền vệ' },
      { number: 30, name: 'L. Chevalier', pos: 'Thủ môn' },
      { number: 12, name: 'L. Digne', pos: 'Hậu vệ' },
      { number: 4, name: 'Beraldo', pos: 'Hậu vệ' },
      { number: 33, name: 'W. Zaïre-Emery', pos: 'Tiền vệ' },
      { number: 29, name: 'B. Barcola', pos: 'Tiền đạo' },
      { number: 9, name: 'G. Ramos', pos: 'Tiền đạo' }
    ]
  },
  529: { // Barca
    formation: '4-2-3-1',
    starters: [
      { number: 1, name: 'J. García', fullName: 'Joan García', pos: 'Thủ môn', line: 0 },
      { number: 12, name: 'X. Espart', fullName: 'Xavi Espart', pos: 'Hậu vệ', line: 1 },
      { number: 5, name: 'P. Cubarsí Paredes', fullName: 'Pau Cubarsí Paredes', pos: 'Hậu vệ', line: 1 },
      { number: 18, name: 'G. Martín', fullName: 'Gerard Martín', pos: 'Hậu vệ', line: 1 },
      { number: 2, name: 'J. Cancelo', fullName: 'João Cancelo', pos: 'Hậu vệ', line: 1 },
      { number: 22, name: 'M. Bernal', fullName: 'Marc Bernal', pos: 'Tiền vệ', line: 2 },
      { number: 8, name: 'Pedri', fullName: 'Pedri', pos: 'Tiền vệ', line: 2 },
      { number: 10, name: 'L. Yamal', fullName: 'Lamine Yamal', pos: 'Tiền vệ', line: 3 },
      { number: 20, name: 'D. Olmo', fullName: 'Daniel Olmo Carvajal', pos: 'Tiền vệ', line: 3 },
      { number: 17, name: 'A. Gordon', fullName: 'Anthony Gordon', pos: 'Tiền vệ', line: 3 },
      { number: 11, name: 'Raphinha', fullName: 'Raphael Dias Belloli', pos: 'Tiền đạo', line: 4 }
    ],
    subs: [
      { number: 3, name: 'A. Balde', pos: 'Hậu vệ' },
      { number: 41, name: 'A. Campos', pos: 'Hậu vệ' },
      { number: 21, name: 'F. de Jong', pos: 'Tiền vệ' },
      { number: 4, name: 'B. Farinas', pos: 'Tiền vệ' },
      { number: 6, name: 'Gavi', pos: 'Tiền vệ' },
      { number: 9, name: 'R. Lewandowski', pos: 'Tiền đạo' },
      { number: 7, name: 'F. Torres', pos: 'Tiền đạo' }
    ]
  },
  42: { // Arsenal
    formation: '4-3-3',
    starters: [
      { number: 22, name: 'D. Raya', fullName: 'David Raya', pos: 'Thủ môn', line: 0 },
      { number: 4, name: 'B. White', fullName: 'Ben White', pos: 'Hậu vệ', line: 1 },
      { number: 2, name: 'W. Saliba', fullName: 'William Saliba', pos: 'Hậu vệ', line: 1 },
      { number: 6, name: 'Gabriel', fullName: 'Gabriel Magalhães', pos: 'Hậu vệ', line: 1 },
      { number: 12, name: 'J. Timber', fullName: 'Jurriën Timber', pos: 'Hậu vệ', line: 1 },
      { number: 41, name: 'D. Rice', fullName: 'Declan Rice', pos: 'Tiền vệ', line: 2 },
      { number: 8, name: 'M. Ødegaard', fullName: 'Martin Ødegaard', pos: 'Tiền vệ', line: 2 },
      { number: 23, name: 'M. Merino', fullName: 'Mikel Merino', pos: 'Tiền vệ', line: 2 },
      { number: 7, name: 'B. Saka', fullName: 'Bukayo Saka', pos: 'Tiền đạo', line: 3 },
      { number: 29, name: 'K. Havertz', fullName: 'Kai Havertz', pos: 'Tiền đạo', line: 3 },
      { number: 11, name: 'G. Martinelli', fullName: 'Gabriel Martinelli', pos: 'Tiền đạo', line: 3 }
    ],
    subs: [
      { number: 19, name: 'L. Trossard', pos: 'Tiền đạo' },
      { number: 9, name: 'G. Jesus', pos: 'Tiền đạo' },
      { number: 5, name: 'T. Partey', pos: 'Tiền vệ' },
      { number: 33, name: 'R. Calafiori', pos: 'Hậu vệ' },
      { number: 15, name: 'J. Kiwior', pos: 'Hậu vệ' },
      { number: 20, name: 'Jorginho', pos: 'Tiền vệ' },
      { number: 32, name: 'Neto', pos: 'Thủ môn' }
    ]
  },
  49: { // Chelsea
    formation: '4-2-3-1',
    starters: [
      { number: 1, name: 'R. Sánchez', fullName: 'Robert Sánchez', pos: 'Thủ môn', line: 0 },
      { number: 27, name: 'M. Gusto', fullName: 'Malo Gusto', pos: 'Hậu vệ', line: 1 },
      { number: 29, name: 'W. Fofana', fullName: 'Wesley Fofana', pos: 'Hậu vệ', line: 1 },
      { number: 6, name: 'L. Colwill', fullName: 'Levi Colwill', pos: 'Hậu vệ', line: 1 },
      { number: 3, name: 'M. Cucurella', fullName: 'Marc Cucurella', pos: 'Hậu vệ', line: 1 },
      { number: 25, name: 'M. Caicedo', fullName: 'Moisés Caicedo', pos: 'Tiền vệ', line: 2 },
      { number: 8, name: 'E. Fernández', fullName: 'Enzo Fernández', pos: 'Tiền vệ', line: 2 },
      { number: 11, name: 'N. Madueke', fullName: 'Noni Madueke', pos: 'Tiền vệ', line: 3 },
      { number: 20, name: 'C. Palmer', fullName: 'Cole Palmer', pos: 'Tiền vệ', line: 3 },
      { number: 7, name: 'P. Neto', fullName: 'Pedro Neto', pos: 'Tiền vệ', line: 3 },
      { number: 15, name: 'N. Jackson', fullName: 'Nicolas Jackson', pos: 'Tiền đạo', line: 4 }
    ],
    subs: [
      { number: 18, name: 'C. Nkunku', pos: 'Tiền đạo' },
      { number: 19, name: 'J. Sancho', pos: 'Tiền vệ' },
      { number: 14, name: 'J. Félix', pos: 'Tiền đạo' },
      { number: 45, name: 'R. Lavia', pos: 'Tiền vệ' },
      { number: 24, name: 'R. James', pos: 'Hậu vệ' },
      { number: 4, name: 'T. Adarabioyo', pos: 'Hậu vệ' },
      { number: 12, name: 'F. Jörgensen', pos: 'Thủ môn' }
    ]
  }
};

function generateGenericSquad(teamId, teamName, isAway = false) {
  if (TEAM_SQUADS[teamId]) return TEAM_SQUADS[teamId];
  const seed = (parseInt(teamId) || 100) + (isAway ? 37 : 13);
  const firstInitials = ['M.', 'A.', 'L.', 'J.', 'R.', 'D.', 'K.', 'P.', 'C.', 'F.', 'S.', 'N.', 'G.', 'V.', 'E.', 'B.', 'T.', 'H.'];
  const lastNamesHome = ['Silva', 'Martinez', 'Santos', 'Costa', 'Fernandez', 'Alvarez', 'Pereira', 'Gomez', 'Ribeiro', 'Navarro', 'Moreno', 'Torres', 'Lopes', 'Mendes', 'Castro', 'Ortega', 'Delgado', 'Vargas'];
  const lastNamesAway = ['Walker', 'Bellingham', 'Valverde', 'Musiala', 'Wirtz', 'Diaby', 'thuram', 'Barella', 'Bastoni', 'Leao', 'Theo', 'Zirkzee', 'Simons', 'Grimaldo', 'Frimpong', 'Tah', 'Andrich', 'Openda'];
  const pool = isAway ? lastNamesAway : lastNamesHome;

  const pickName = (idx) => {
    const fi = firstInitials[(seed + idx * 3) % firstInitials.length];
    const ln = pool[(seed + idx * 5) % pool.length];
    const capLn = ln.charAt(0).toUpperCase() + ln.slice(1);
    return { short: `${fi} ${capLn}`, full: `${fi} ${capLn}` };
  };

  if (!isAway) {
    return {
      formation: '4-3-3',
      starters: [
        { number: 1, name: pickName(0).short, fullName: pickName(0).full, pos: 'Thủ môn', line: 0 },
        { number: 2, name: pickName(1).short, fullName: pickName(1).full, pos: 'Hậu vệ', line: 1 },
        { number: 4, name: pickName(2).short, fullName: pickName(2).full, pos: 'Hậu vệ', line: 1 },
        { number: 5, name: pickName(3).short, fullName: pickName(3).full, pos: 'Hậu vệ', line: 1 },
        { number: 3, name: pickName(4).short, fullName: pickName(4).full, pos: 'Hậu vệ', line: 1 },
        { number: 6, name: pickName(5).short, fullName: pickName(5).full, pos: 'Tiền vệ', line: 2 },
        { number: 8, name: pickName(6).short, fullName: pickName(6).full, pos: 'Tiền vệ', line: 2 },
        { number: 10, name: pickName(7).short, fullName: pickName(7).full, pos: 'Tiền vệ', line: 2 },
        { number: 7, name: pickName(8).short, fullName: pickName(8).full, pos: 'Tiền đạo', line: 3 },
        { number: 9, name: pickName(9).short, fullName: pickName(9).full, pos: 'Tiền đạo', line: 3 },
        { number: 11, name: pickName(10).short, fullName: pickName(10).full, pos: 'Tiền đạo', line: 3 }
      ],
      subs: [
        { number: 14, name: pickName(11).short, pos: 'Tiền vệ' },
        { number: 13, name: pickName(12).short, pos: 'Thủ môn' },
        { number: 15, name: pickName(13).short, pos: 'Hậu vệ' },
        { number: 18, name: pickName(14).short, pos: 'Hậu vệ' },
        { number: 20, name: pickName(15).short, pos: 'Tiền vệ' },
        { number: 21, name: pickName(16).short, pos: 'Tiền đạo' },
        { number: 19, name: pickName(17).short, pos: 'Tiền đạo' }
      ]
    };
  } else {
    return {
      formation: '4-2-3-1',
      starters: [
        { number: 1, name: pickName(0).short, fullName: pickName(0).full, pos: 'Thủ môn', line: 0 },
        { number: 12, name: pickName(1).short, fullName: pickName(1).full, pos: 'Hậu vệ', line: 1 },
        { number: 5, name: pickName(2).short, fullName: pickName(2).full, pos: 'Hậu vệ', line: 1 },
        { number: 18, name: pickName(3).short, fullName: pickName(3).full, pos: 'Hậu vệ', line: 1 },
        { number: 2, name: pickName(4).short, fullName: pickName(4).full, pos: 'Hậu vệ', line: 1 },
        { number: 22, name: pickName(5).short, fullName: pickName(5).full, pos: 'Tiền vệ', line: 2 },
        { number: 8, name: pickName(6).short, fullName: pickName(6).full, pos: 'Tiền vệ', line: 2 },
        { number: 10, name: pickName(7).short, fullName: pickName(7).full, pos: 'Tiền vệ', line: 3 },
        { number: 20, name: pickName(8).short, fullName: pickName(8).full, pos: 'Tiền vệ', line: 3 },
        { number: 17, name: pickName(9).short, fullName: pickName(9).full, pos: 'Tiền vệ', line: 3 },
        { number: 11, name: pickName(10).short, fullName: pickName(10).full, pos: 'Tiền đạo', line: 4 }
      ],
      subs: [
        { number: 3, name: pickName(11).short, pos: 'Hậu vệ' },
        { number: 41, name: pickName(12).short, pos: 'Hậu vệ' },
        { number: 21, name: pickName(13).short, pos: 'Tiền vệ' },
        { number: 4, name: pickName(14).short, pos: 'Tiền vệ' },
        { number: 6, name: pickName(15).short, pos: 'Tiền vệ' },
        { number: 9, name: pickName(16).short, pos: 'Tiền đạo' },
        { number: 7, name: pickName(17).short, pos: 'Tiền đạo' }
      ]
    };
  }
}

// Showcase Champions League Standings from Image 3
const SHOWCASE_UCL_STANDINGS = [
  { rank: 1, team_id: 85, team_name: 'PSG', logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1', played: 3, win: 3, draw: 0, lose: 0, gf: 14, ga: 5, gd: 9, points: 9, forme: 'WWW' },
  { rank: 2, team_id: 40, team_name: 'Liverpool', logo: 'https://is.vnecdn.net/objects/teams/40.png?v=1', played: 3, win: 3, draw: 0, lose: 0, gf: 12, ga: 7, gd: 5, points: 9, forme: 'WWW' },
  { rank: 3, team_id: 172, team_name: 'Stuttgart', logo: 'https://is.vnecdn.net/objects/teams/172.png?v=1', played: 3, win: 2, draw: 1, lose: 0, gf: 7, ga: 2, gd: 5, points: 7, forme: 'DWW' },
  { rank: 4, team_id: 66, team_name: 'Aston Villa', logo: 'https://is.vnecdn.net/objects/teams/66.png?v=1', played: 2, win: 2, draw: 0, lose: 0, gf: 9, ga: 2, gd: 7, points: 6, forme: 'WW' },
  { rank: 5, team_id: 529, team_name: 'Barca', logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1', played: 3, win: 2, draw: 0, lose: 1, gf: 11, ga: 6, gd: 5, points: 6, forme: 'LWW' },
  { rank: 6, team_id: 50, team_name: 'Man City', logo: 'https://is.vnecdn.net/objects/teams/50.png?v=1', played: 3, win: 2, draw: 0, lose: 1, gf: 9, ga: 5, gd: 4, points: 6, forme: 'WLW' },
  { rank: 7, team_id: 228, team_name: 'Sporting CP', logo: 'https://is.vnecdn.net/objects/teams/228.png?v=1', played: 2, win: 2, draw: 0, lose: 0, gf: 5, ga: 1, gd: 4, points: 6, forme: 'WW' },
  { rank: 8, team_id: 42, team_name: 'Arsenal', logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1', played: 2, win: 2, draw: 0, lose: 0, gf: 4, ga: 0, gd: 4, points: 6, forme: 'WW' },
  { rank: 9, team_id: 541, team_name: 'Real Madrid', logo: 'https://is.vnecdn.net/objects/teams/541.png?v=1', played: 2, win: 2, draw: 0, lose: 0, gf: 6, ga: 4, gd: 2, points: 6, forme: 'WW' },
  { rank: 10, team_id: 543, team_name: 'Real Betis', logo: 'https://is.vnecdn.net/objects/teams/543.png?v=1', played: 2, win: 2, draw: 0, lose: 0, gf: 6, ga: 4, gd: 2, points: 6, forme: 'WW' }
];

app.get('/api/match-detail', async (req, res) => {
  const { slug = '', fixture_id } = req.query;

  // Extract fixture_id from slug if present (e.g. psg-vs-barca-1001 -> 1001)
  let targetId = fixture_id ? parseInt(fixture_id) : null;
  if (!targetId && slug) {
    const idMatch = String(slug).match(/-(\d+)$/);
    if (idMatch) targetId = parseInt(idMatch[1]);
  }

  // Search across all leagues for this fixture
  let foundMatch = null;
  let foundLeague = null;

  // Check simulated live match 999001
  if (targetId === 999001) {
    foundLeague = LEAGUES.find(l => l.id === 39);
    foundMatch = {
      fixture_id: 999001,
      league_id: 39,
      event_date: '2026-10-16T13:30:00+07:00',
      round: 'Vòng 8',
      status: '2nd Half',
      status_short: '2H',
      elapsed: 68,
      goals_home_team: 2,
      goals_away_team: 1,
      home_team: { team_id: 42, team_name: 'Arsenal', logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1' },
      away_team: { team_id: 49, team_name: 'Chelsea', logo: 'https://is.vnecdn.net/objects/teams/49.png?v=1' }
    };
  }

  // Search cached fixtures first
  if (!foundMatch && targetId) {
    for (const l of LEAGUES) {
      const list = cache.fixtures[l.id]?.data || [];
      const m = list.find(x => x.fixture_id === targetId);
      if (m) {
        foundMatch = m;
        foundLeague = l;
        break;
      }
    }
  }

  // If not in cache yet, fetch top leagues
  if (!foundMatch && targetId && targetId !== 1001) {
    for (const l of LEAGUES) {
      if (!cache.fixtures[l.id]) {
        const list = await getLeagueFixtures(l.id);
        const m = (list || []).find(x => x.fixture_id === targetId);
        if (m) {
          foundMatch = m;
          foundLeague = l;
          break;
        }
      }
    }
  }

  // Check if this is the canonical showcase match PSG vs Barca (fixture 1001 or slug psg-vs-barca)
  const slugLower = String(slug).toLowerCase();
  const isPsgBarca =
    targetId === 1001 ||
    (slugLower.includes('psg') && slugLower.includes('barca')) ||
    (foundMatch &&
      ((foundMatch.home_team?.team_id === 85 && foundMatch.away_team?.team_id === 529) ||
        (foundMatch.home_team?.team_name?.toLowerCase().includes('psg') &&
          foundMatch.away_team?.team_name?.toLowerCase().includes('barca'))));

  if (isPsgBarca || !foundMatch) {
    // Check if slug encodes two other teams (e.g. from clicking a recent form card like strasbourg-vs-psg-5001)
    if (!isPsgBarca && slugLower.includes('-vs-')) {
      const cleanSlug = slugLower.replace(/-\d+$/, '');
      const [hPart, aPart] = cleanSlug.split('-vs-');
      // Try to find matching teams in our known teams/fixtures
      const allKnownTeams = [];
      HOT_TEAMS.forEach(t => allKnownTeams.push({ team_id: t.id, team_name: t.name, logo: t.logo, leagueId: t.leagueId }));
      SHOWCASE_UCL_STANDINGS.forEach(t => allKnownTeams.push({ team_id: t.team_id, team_name: t.team_name, logo: t.logo, leagueId: 2 }));
      Object.values(cache.fixtures).forEach(entry => {
        (entry.data || []).forEach(m => {
          if (m.home_team) allKnownTeams.push({ ...m.home_team, leagueId: m.league_id });
          if (m.away_team) allKnownTeams.push({ ...m.away_team, leagueId: m.league_id });
        });
      });

      const hTeam = allKnownTeams.find(t => toSeoSlugServer(t.team_name) === hPart) || {
        team_id: 95,
        team_name: hPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        logo: 'https://is.vnecdn.net/objects/teams/95.png?v=1',
        leagueId: 2
      };
      const aTeam = allKnownTeams.find(t => toSeoSlugServer(t.team_name) === aPart) || {
        team_id: 85,
        team_name: aPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1',
        leagueId: 2
      };

      foundLeague = LEAGUES.find(l => l.id === (hTeam.leagueId || aTeam.leagueId || 2)) || LEAGUES[1];
      foundMatch = {
        fixture_id: targetId || 5001,
        league_id: foundLeague.id,
        event_date: '2026-10-16T02:00:00+07:00',
        round: 'Lượt 3',
        status: 'Match Finished',
        status_short: 'FT',
        goals_home_team: 1,
        goals_away_team: 3,
        home_team: hTeam,
        away_team: aTeam
      };
    }
  }

  // 1. Showcase Match 1002: Arsenal 1 - 1 Porto (Pen 4 - 2)
  if (targetId === 1002 || (slugLower.includes('arsenal') && slugLower.includes('porto'))) {
    const uclLeague = LEAGUES.find(l => l.id === 2) || LEAGUES[1];
    return res.json({
      match: {
        fixture_id: 1002,
        slug: 'arsenal-vs-porto-1002',
        headerDateText: 'Thứ sáu 16/10/2026, 02:00 - Vòng 1/8',
        statusBadge: 'Kết thúc',
        isLive: false,
        isFinished: true,
        isPen: true,
        broadcast: 'FPT Play',
        home_team: {
          team_id: 42,
          team_name: 'Arsenal',
          logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1'
        },
        away_team: {
          team_id: 50,
          team_name: 'Porto',
          logo: 'https://is.vnecdn.net/objects/teams/50.png?v=1'
        },
        homeScore: 1,
        awayScore: 1,
        penaltyScore: '4 - 2',
        penalty_home: 4,
        penalty_away: 2,
        halftimeText: 'Hiệp 1: 1 - 0 | 120 phút: 1 - 1 | Pen: 4 - 2',
        homeScorers: [
          { player: 'Leandro Trossard', minute: "41'" }
        ],
        awayScorers: [
          { player: 'Galeno', minute: "68'" }
        ],
        penalties: [
          { order: 1, team: 'home', player: 'Martin Ødegaard', scored: true },
          { order: 2, team: 'away', player: 'Pepê', scored: true },
          { order: 3, team: 'home', player: 'Kai Havertz', scored: true },
          { order: 4, team: 'away', player: 'Wendell', scored: false },
          { order: 5, team: 'home', player: 'Bukayo Saka', scored: true },
          { order: 6, team: 'away', player: 'Marko Grujić', scored: true },
          { order: 7, team: 'home', player: 'Declan Rice', scored: true },
          { order: 8, team: 'away', player: 'Galeno', scored: false }
        ]
      },
      league: uclLeague,
      allLeagues: LEAGUES,
      hotTeams: HOT_TEAMS,
      events: [
        { minute: 41, side: 'home', type: 'goal', player: 'Leandro Trossard' },
        { minute: 68, side: 'away', type: 'goal', player: 'Galeno' },
        { minute: 120, side: 'home', type: 'whistle', player: 'Hết hiệp phụ 1 - 1, bước vào luân lưu 11m' },
        { minute: 121, side: 'home', type: 'penalty_shootout', player: 'Loạt sút luân lưu 11m kết thúc: Arsenal thắng 4 - 2' }
      ],
      stats: [
        { label: 'Tỉ lệ kiểm soát bóng', home: '58%', away: '42%' },
        { label: 'Dứt điểm hướng mục tiêu', home: '8', away: '3' },
        { label: 'Số lần dứt điểm', home: '19', away: '10' },
        { label: 'Số đường chuyền', home: '612', away: '430' },
        { label: 'Phạt đền (Shootout)', home: '4', away: '2' },
        { label: 'Phạt góc', home: '7', away: '2' }
      ],
      standingsGroupTitle: 'Vòng 1/8',
      standings: SHOWCASE_UCL_STANDINGS,
      lineups: {
        home: TEAM_SQUADS[85] || [],
        away: TEAM_SQUADS[529] || []
      },
      recentForm: {
        home: [{ fixture_id: 91, home_team: { team_name: 'Arsenal' }, away_team: { team_name: 'Brentford' }, score: '2 - 1' }],
        away: [{ fixture_id: 92, home_team: { team_name: 'Porto' }, away_team: { team_name: 'Benfica' }, score: '5 - 0' }]
      }
    });
  }

  // 1. Canonical Showcase Match: PSG 4 - 2 Barca (Exact 100% match to all 5 images)
  if (isPsgBarca || !foundMatch) {
    const uclLeague = LEAGUES.find(l => l.id === 2) || LEAGUES[1];
    return res.json({
      match: {
        fixture_id: 1001,
        slug: 'psg-vs-barca-1001',
        headerDateText: 'Thứ tư 21/10/2026, 02:00 - Lượt 3',
        statusBadge: 'Kết thúc',
        isLive: false,
        isFinished: true,
        home_team: {
          team_id: 85,
          team_name: 'PSG',
          logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1'
        },
        away_team: {
          team_id: 529,
          team_name: 'Barca',
          logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1'
        },
        homeScore: 4,
        awayScore: 2,
        halftimeText: 'Hiệp một: 1 - 0',
        homeScorers: [
          { player: 'Désiré Doue', minute: "38'" },
          { player: 'Vitinha', minute: "81'" },
          { player: 'Lucas Hernández', minute: "72'" },
          { player: 'Fabián Ruiz', minute: "86'" }
        ],
        awayScorers: [
          { player: 'Xavi Espart', minute: "55'" },
          { player: 'Lamine Yamal', minute: "79'" }
        ]
      },
      league: uclLeague,
      allLeagues: LEAGUES,
      hotTeams: HOT_TEAMS,
      // Tab 1: Diễn biến (Exact 15 events from Image 2)
      events: [
        { minute: 17, side: 'away', type: 'yellow_card', player: 'João Cancelo' },
        { minute: 59, side: 'home', type: 'sub', playerIn: 'Khvicha Kvaratskhelia', playerOut: 'Substitution 3' },
        { minute: 38, side: 'home', type: 'goal', player: 'Désiré Doue' },
        { minute: 59, side: 'home', type: 'sub', playerIn: 'Marcos Aoás Corrêa', playerOut: 'Substitution 2' },
        { minute: 60, side: 'away', type: 'sub', playerIn: 'Raphael Dias Belloli', playerOut: 'Substitution 2' },
        { minute: 81, side: 'home', type: 'goal', player: 'Vitinha' },
        { minute: 20, side: 'home', type: 'sub', playerIn: 'Ousmane Dembélé', playerOut: 'Substitution 1' },
        { minute: 74, side: 'away', type: 'sub', playerIn: 'Xavi Espart', playerOut: 'Substitution 5' },
        { minute: 72, side: 'home', type: 'goal', player: 'Lucas Hernández' },
        { minute: 60, side: 'away', type: 'sub', playerIn: 'Pedri', playerOut: 'Substitution 3' },
        { minute: 55, side: 'away', type: 'goal', player: 'Xavi Espart' },
        { minute: 78, side: 'home', type: 'sub', playerIn: 'Désiré Doue', playerOut: 'Substitution 5' },
        { minute: 27, side: 'away', type: 'sub', playerIn: 'Daniel Olmo Carvajal', playerOut: 'Substitution 1' },
        { minute: 79, side: 'away', type: 'goal', player: 'Lamine Yamal' },
        { minute: 60, side: 'away', type: 'sub', playerIn: 'Marc Bernal', playerOut: 'Substitution 4' }
      ],
      // Tab 2: Thống kê (Exact 9 stats from Image 3)
      stats: [
        { label: 'Tỉ lệ kiểm soát bóng', home: '47%', away: '53%' },
        { label: 'Dứt điểm hướng mục tiêu', home: '14', away: '5' },
        { label: 'Số lần dứt điểm', home: '22', away: '18' },
        { label: 'Số đường chuyền', home: '477', away: '539' },
        { label: 'Phạm lỗi', home: '11', away: '10' },
        { label: 'Thẻ vàng', home: '0', away: '1' },
        { label: 'Thẻ đỏ', home: '0', away: '0' },
        { label: 'Việt vị', home: '2', away: '1' },
        { label: 'Phạt góc', home: '2', away: '3' }
      ],
      standingsGroupTitle: 'Bảng e',
      standings: SHOWCASE_UCL_STANDINGS.map(s => ({
        ...s,
        isHome: s.team_id === 85,
        isAway: s.team_id === 529
      })),
      // Tab 3: Đội hình ra sân (Exact lineups & pitch formation from Image 4)
      lineups: {
        home: TEAM_SQUADS[85],
        away: TEAM_SQUADS[529]
      },
      // Tab 4: Kết quả gần đây (Exact 5 recent matches per team from Image 5)
      recentForm: {
        home: [
          { fixture_id: 5001, home_team: { team_id: 95, team_name: 'Strasbourg', logo: 'https://is.vnecdn.net/objects/teams/95.png?v=1' }, away_team: { team_id: 85, team_name: 'PSG', logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1' }, score: '1 - 3' },
          { fixture_id: 5002, home_team: { team_id: 50, team_name: 'Man City', logo: 'https://is.vnecdn.net/objects/teams/50.png?v=1' }, away_team: { team_id: 85, team_name: 'PSG', logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1' }, score: '2 - 4' },
          { fixture_id: 5003, home_team: { team_id: 85, team_name: 'PSG', logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1' }, away_team: { team_id: 114, team_name: 'Le Mans', logo: 'https://is.vnecdn.net/objects/teams/114.png?v=1' }, score: '3 - 1' },
          { fixture_id: 5004, home_team: { team_id: 81, team_name: 'Marseille', logo: 'https://is.vnecdn.net/objects/teams/81.png?v=1' }, away_team: { team_id: 85, team_name: 'PSG', logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1' }, score: '1 - 2' },
          { fixture_id: 5005, home_team: { team_id: 106, team_name: 'Brest', logo: 'https://is.vnecdn.net/objects/teams/106.png?v=1' }, away_team: { team_id: 85, team_name: 'PSG', logo: 'https://is.vnecdn.net/objects/teams/85.png?v=1' }, score: '0 - 1' }
        ],
        away: [
          { fixture_id: 5006, home_team: { team_id: 543, team_name: 'Real Betis', logo: 'https://is.vnecdn.net/objects/teams/543.png?v=1' }, away_team: { team_id: 529, team_name: 'Barca', logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1' }, score: '2 - 5' },
          { fixture_id: 5007, home_team: { team_id: 645, team_name: 'Galatasaray', logo: 'https://is.vnecdn.net/objects/teams/645.png?v=1' }, away_team: { team_id: 529, team_name: 'Barca', logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1' }, score: '1 - 4' },
          { fixture_id: 5008, home_team: { team_id: 529, team_name: 'Barca', logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1' }, away_team: { team_id: 546, team_name: 'Getafe', logo: 'https://is.vnecdn.net/objects/teams/546.png?v=1' }, score: '3 - 0' },
          { fixture_id: 5009, home_team: { team_id: 536, team_name: 'Sevilla', logo: 'https://is.vnecdn.net/objects/teams/536.png?v=1' }, away_team: { team_id: 529, team_name: 'Barca', logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1' }, score: '1 - 3' },
          { fixture_id: 5010, home_team: { team_id: 529, team_name: 'Barca', logo: 'https://is.vnecdn.net/objects/teams/529.png?v=1' }, away_team: { team_id: 4665, team_name: 'Racing Santander', logo: 'https://is.vnecdn.net/objects/teams/4665.png?v=1' }, score: '7 - 2' }
        ]
      }
    });
  }

  // 2. Dynamic Generator for any other clicked match
  const league = foundLeague || LEAGUES.find(l => l.id === foundMatch.league_id) || LEAGUES[0];
  const fid = foundMatch.fixture_id || 2001;
  const homeTeam = foundMatch.home_team || { team_id: 42, team_name: 'Arsenal', logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1' };
  const awayTeam = foundMatch.away_team || { team_id: 49, team_name: 'Chelsea', logo: 'https://is.vnecdn.net/objects/teams/49.png?v=1' };

  // Determine scores (use real scores if available, or simulated scores so the UI is rich like the 5 screenshots)
  const simScores = [
    [3, 1], [2, 1], [4, 2], [2, 0], [1, 2], [3, 2], [2, 2], [1, 3]
  ];
  const pickedScore = simScores[fid % simScores.length];
  const hasRealScore = foundMatch.goals_home_team !== null && foundMatch.goals_home_team !== undefined;
  const homeScore = hasRealScore ? foundMatch.goals_home_team : pickedScore[0];
  const awayScore = hasRealScore ? foundMatch.goals_away_team : pickedScore[1];

  const htHome = Math.min(homeScore, Math.ceil(homeScore / 2));
  const htAway = Math.min(awayScore, Math.floor(awayScore / 2));
  const halftimeText = `Hiệp một: ${htHome} - ${htAway}`;

  const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'P'].includes(foundMatch.status_short);
  const statusBadge = isLive ? `Trực tiếp ${foundMatch.elapsed || 68}'` : 'Kết thúc';

  // Squads
  const homeSquad = generateGenericSquad(homeTeam.team_id, homeTeam.team_name, false);
  const awaySquad = generateGenericSquad(awayTeam.team_id, awayTeam.team_name, true);

  // Build Goalscorers & Timeline Events matching homeScore & awayScore
  const homeScorers = [];
  const awayScorers = [];
  const events = [];

  const homeGoalMinutes = [18, 38, 64, 72, 81, 86];
  const awayGoalMinutes = [29, 55, 79, 84, 89];

  for (let i = 0; i < homeScore; i++) {
    const p = homeSquad.starters[10 - (i % 5)] || homeSquad.starters[9];
    const min = homeGoalMinutes[i % homeGoalMinutes.length];
    homeScorers.push({ player: p.fullName || p.name, minute: `${min}'` });
    events.push({ minute: min, side: 'home', type: 'goal', player: p.fullName || p.name });
  }

  for (let i = 0; i < awayScore; i++) {
    const p = awaySquad.starters[10 - (i % 5)] || awaySquad.starters[10];
    const min = awayGoalMinutes[i % awayGoalMinutes.length];
    awayScorers.push({ player: p.fullName || p.name, minute: `${min}'` });
    events.push({ minute: min, side: 'away', type: 'goal', player: p.fullName || p.name });
  }

  // Add yellow cards & substitutions to match Image 2 density
  events.push({ minute: 17, side: 'away', type: 'yellow_card', player: awaySquad.starters[4]?.fullName || awaySquad.starters[4]?.name });
  events.push({ minute: 34, side: 'home', type: 'yellow_card', player: homeSquad.starters[5]?.fullName || homeSquad.starters[5]?.name });
  events.push({ minute: 58, side: 'home', type: 'sub', playerIn: homeSquad.starters[10]?.fullName || homeSquad.starters[10]?.name, playerOut: 'Substitution 1' });
  events.push({ minute: 60, side: 'away', type: 'sub', playerIn: awaySquad.starters[10]?.fullName || awaySquad.starters[10]?.name, playerOut: 'Substitution 1' });
  events.push({ minute: 65, side: 'home', type: 'sub', playerIn: homeSquad.starters[8]?.fullName || homeSquad.starters[8]?.name, playerOut: 'Substitution 2' });
  events.push({ minute: 71, side: 'away', type: 'sub', playerIn: awaySquad.starters[7]?.fullName || awaySquad.starters[7]?.name, playerOut: 'Substitution 2' });
  events.push({ minute: 76, side: 'home', type: 'sub', playerIn: homeSquad.starters[6]?.fullName || homeSquad.starters[6]?.name, playerOut: 'Substitution 3' });
  events.push({ minute: 82, side: 'away', type: 'sub', playerIn: awaySquad.starters[8]?.fullName || awaySquad.starters[8]?.name, playerOut: 'Substitution 3' });

  // Sort events by minute ascending
  events.sort((a, b) => a.minute - b.minute);

  // Build 9 Match Statistics
  const homePoss = 45 + (fid % 14);
  const awayPoss = 100 - homePoss;
  const homeSot = Math.max(homeScore + 3, 6 + (fid % 8));
  const awaySot = Math.max(awayScore + 2, 4 + ((fid + 3) % 6));
  const homeShots = homeSot + 5 + (fid % 7);
  const awayShots = awaySot + 4 + ((fid + 2) % 8);
  const homePasses = 390 + (fid % 180);
  const awayPasses = 410 + ((fid * 3) % 170);

  const stats = [
    { label: 'Tỉ lệ kiểm soát bóng', home: `${homePoss}%`, away: `${awayPoss}%` },
    { label: 'Dứt điểm hướng mục tiêu', home: `${homeSot}`, away: `${awaySot}` },
    { label: 'Số lần dứt điểm', home: `${homeShots}`, away: `${awayShots}` },
    { label: 'Số đường chuyền', home: `${homePasses}`, away: `${awayPasses}` },
    { label: 'Phạm lỗi', home: `${9 + (fid % 5)}`, away: `${8 + ((fid + 2) % 6)}` },
    { label: 'Thẻ vàng', home: '1', away: '1' },
    { label: 'Thẻ đỏ', home: '0', away: '0' },
    { label: 'Việt vị', home: `${1 + (fid % 3)}`, away: `${1 + ((fid + 1) % 3)}` },
    { label: 'Phạt góc', home: `${3 + (fid % 6)}`, away: `${3 + ((fid + 4) % 5)}` }
  ];

  // Fetch League Standings and highlight the 2 teams
  const rawStandings = await getLeagueStandings(league.id);
  let formattedStandings = (rawStandings || []).map((s, idx) => {
    const pld = s.all?.matchs_played ?? 0;
    const win = s.all?.win ?? 0;
    const pts = s.points ?? 0;
    const draw = Math.max(0, pts - win * 3);
    const lose = Math.max(0, pld - win - draw);
    const gf = s.all?.goals_for ?? 0;
    const ga = s.all?.goals_against ?? 0;
    const gd = s.goals_diff ?? (gf - ga);
    const isHome = s.team_id === homeTeam.team_id || (s.team_name && homeTeam.team_name && s.team_name.toLowerCase() === homeTeam.team_name.toLowerCase());
    const isAway = s.team_id === awayTeam.team_id || (s.team_name && awayTeam.team_name && s.team_name.toLowerCase() === awayTeam.team_name.toLowerCase());
    return {
      rank: s.rank || idx + 1,
      team_id: s.team_id,
      team_name: s.team_name,
      logo: s.logo || s.team_logo,
      played: pld,
      win,
      draw,
      lose,
      gf,
      ga,
      gd,
      points: pts,
      forme: s.forme || 'WWDWL',
      isHome,
      isAway
    };
  });

  if (formattedStandings.length === 0) {
    formattedStandings = SHOWCASE_UCL_STANDINGS.map(s => ({ ...s, isHome: false, isAway: false }));
  }

  // Ensure both homeTeam and awayTeam are present and highlighted in formattedStandings
  if (!formattedStandings.some(s => s.isHome)) {
    formattedStandings[0] = {
      ...formattedStandings[0],
      team_id: homeTeam.team_id,
      team_name: homeTeam.team_name,
      logo: homeTeam.logo,
      isHome: true
    };
  }
  if (!formattedStandings.some(s => s.isAway)) {
    const targetIdx = Math.min(4, formattedStandings.length - 1);
    formattedStandings[targetIdx] = {
      ...formattedStandings[targetIdx],
      team_id: awayTeam.team_id,
      team_name: awayTeam.team_name,
      logo: awayTeam.logo,
      isAway: true
    };
  }

  // Build Recent Form (5 matches for homeTeam, 5 matches for awayTeam)
  const leagueFixtures = await getLeagueFixtures(league.id);
  const buildTeamRecent = (teamObj, isAwaySide) => {
    const realFinished = (leagueFixtures || []).filter(m =>
      (['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short) || m.status === 'Match Finished') &&
      (m.home_team?.team_id === teamObj.team_id || m.away_team?.team_id === teamObj.team_id)
    ).slice(0, 5);

    const results = realFinished.map(m => ({
      fixture_id: m.fixture_id,
      home_team: m.home_team,
      away_team: m.away_team,
      score: `${m.goals_home_team ?? 1} - ${m.goals_away_team ?? 1}`
    }));

    // Fill remaining up to 5 using opponents from standings
    let oppIdx = 0;
    while (results.length < 5) {
      const opp = formattedStandings[(oppIdx + (isAwaySide ? 3 : 1)) % formattedStandings.length];
      oppIdx++;
      if (!opp || opp.team_id === teamObj.team_id) continue;
      const isTeamHome = results.length % 2 === 0;
      const g1 = 1 + ((fid + results.length) % 3);
      const g2 = (fid + results.length * 2) % 3;
      results.push({
        fixture_id: fid * 10 + results.length + (isAwaySide ? 50 : 10),
        home_team: isTeamHome ? teamObj : { team_id: opp.team_id, team_name: opp.team_name, logo: opp.logo },
        away_team: isTeamHome ? { team_id: opp.team_id, team_name: opp.team_name, logo: opp.logo } : teamObj,
        score: isTeamHome ? `${g1} - ${g2}` : `${g2} - ${g1}`
      });
    }
    return results;
  };

  const matchSlug = `${toSeoSlugServer(homeTeam.team_name)}-vs-${toSeoSlugServer(awayTeam.team_name)}-${fid}`;

  res.json({
    match: {
      fixture_id: fid,
      slug: matchSlug,
      headerDateText: foundMatch.display_header_date || formatVietnameseMatchHeader(foundMatch.event_date, foundMatch.round),
      statusBadge,
      isLive,
      isFinished: !isLive,
      home_team: homeTeam,
      away_team: awayTeam,
      homeScore,
      awayScore,
      halftimeText,
      homeScorers,
      awayScorers
    },
    league,
    allLeagues: LEAGUES,
    hotTeams: HOT_TEAMS,
    events,
    stats,
    standingsGroupTitle: league.id === 2 ? 'Bảng e' : league.vnName || league.name,
    standings: formattedStandings,
    lineups: {
      home: homeSquad,
      away: awaySquad
    },
    recentForm: {
      home: buildTeamRecent(homeTeam, false),
      away: buildTeamRecent(awayTeam, true)
    }
  });
});

// =========================================================================
// TEAM DETAIL ENGINE & API (/api/team-detail)
// =========================================================================

const TEAM_META_PRESETS = {
  42: { coach: 'Mikel Arteta', coachNat: 'Tây Ban Nha', stadium: 'Emirates Stadium (60,704 chỗ)', founded: 1886, marketValue: '€1.18 tỷ', leagueId: 39 },
  33: { coach: 'Ruben Amorim', coachNat: 'Bồ Đào Nha', stadium: 'Old Trafford (74,310 chỗ)', founded: 1878, marketValue: '€855 triệu', leagueId: 39 },
  50: { coach: 'Pep Guardiola', coachNat: 'Tây Ban Nha', stadium: 'Etihad Stadium (53,400 chỗ)', founded: 1880, marketValue: '€1.26 tỷ', leagueId: 39 },
  40: { coach: 'Arne Slot', coachNat: 'Hà Lan', stadium: 'Anfield (61,276 chỗ)', founded: 1892, marketValue: '€965 triệu', leagueId: 39 },
  49: { coach: 'Enzo Maresca', coachNat: 'Ý', stadium: 'Stamford Bridge (40,341 chỗ)', founded: 1905, marketValue: '€1.02 tỷ', leagueId: 39 },
  541: { coach: 'Carlo Ancelotti', coachNat: 'Ý', stadium: 'Santiago Bernabéu (81,044 chỗ)', founded: 1902, marketValue: '€1.36 tỷ', leagueId: 140 },
  529: { coach: 'Hansi Flick', coachNat: 'Đức', stadium: 'Spotify Camp Nou (99,354 chỗ)', founded: 1899, marketValue: '€940 triệu', leagueId: 140 },
  85: { coach: 'Luis Enrique', coachNat: 'Tây Ban Nha', stadium: 'Parc des Princes (47,929 chỗ)', founded: 1970, marketValue: '€890 triệu', leagueId: 61 },
  157: { coach: 'Vincent Kompany', coachNat: 'Bỉ', stadium: 'Allianz Arena (75,024 chỗ)', founded: 1900, marketValue: '€945 triệu', leagueId: 78 },
  165: { coach: 'Nuri Şahin', coachNat: 'Thổ Nhĩ Kỳ', stadium: 'Signal Iduna Park (81,365 chỗ)', founded: 1909, marketValue: '€480 triệu', leagueId: 78 },
  496: { coach: 'Thiago Motta', coachNat: 'Ý', stadium: 'Allianz Stadium (41,507 chỗ)', founded: 1897, marketValue: '€590 triệu', leagueId: 135 },
  505: { coach: 'Simone Inzaghi', coachNat: 'Ý', stadium: 'Giuseppe Meazza (75,817 chỗ)', founded: 1908, marketValue: '€675 triệu', leagueId: 135 },
  489: { coach: 'Paulo Fonseca', coachNat: 'Bồ Đào Nha', stadium: 'San Siro (75,817 chỗ)', founded: 1899, marketValue: '€560 triệu', leagueId: 135 },
  7471: { coach: 'Mano Polking', coachNat: 'Brazil / Đức', stadium: 'SVĐ Hàng Đẫy (22,500 chỗ)', founded: 1956, marketValue: '€5.8 triệu', leagueId: 340 },
  4210: { coach: 'Lê Đức Tuấn', coachNat: 'Việt Nam', stadium: 'SVĐ Hàng Đẫy (22,500 chỗ)', founded: 2006, marketValue: '€4.9 triệu', leagueId: 340 }
};

const FULL_TEAM_ROSTERS = {
  33: [ // Manchester United
    { number: 24, fullName: 'André Onana', pos: 'Thủ môn', role: 'Thủ môn bắt chính', nat: 'Cameroon', age: 29, height: '190 cm', foot: 'Phải' },
    { number: 1, fullName: 'Altay Bayındır', pos: 'Thủ môn', role: 'Thủ môn', nat: 'Thổ Nhĩ Kỳ', age: 27, height: '198 cm', foot: 'Phải' },
    { number: 22, fullName: 'Tom Heaton', pos: 'Thủ môn', role: 'Thủ môn', nat: 'Anh', age: 39, height: '188 cm', foot: 'Phải' },
    { number: 20, fullName: 'Diogo Dalot', pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', nat: 'Bồ Đào Nha', age: 26, height: '183 cm', foot: 'Phải' },
    { number: 4, fullName: 'Matthijs de Ligt', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Hà Lan', age: 26, height: '189 cm', foot: 'Phải' },
    { number: 6, fullName: 'Lisandro Martínez', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Argentina', age: 27, height: '175 cm', foot: 'Trái' },
    { number: 3, fullName: 'Noussair Mazraoui', pos: 'Hậu vệ', role: 'Hậu vệ cánh', nat: 'Morocco', age: 27, height: '183 cm', foot: 'Phải' },
    { number: 5, fullName: 'Harry Maguire', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Anh', age: 32, height: '194 cm', foot: 'Phải' },
    { number: 15, fullName: 'Leny Yoro', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Pháp', age: 19, height: '190 cm', foot: 'Phải' },
    { number: 23, fullName: 'Luke Shaw', pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', nat: 'Anh', age: 30, height: '178 cm', foot: 'Trái' },
    { number: 2, fullName: 'Victor Lindelöf', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Thụy Điển', age: 31, height: '187 cm', foot: 'Phải' },
    { number: 8, fullName: 'Bruno Fernandes', pos: 'Tiền vệ', role: 'Tiền vệ tấn công (Đội trưởng)', nat: 'Bồ Đào Nha', age: 31, height: '179 cm', foot: 'Phải' },
    { number: 37, fullName: 'Kobbie Mainoo', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Anh', age: 20, height: '175 cm', foot: 'Phải' },
    { number: 25, fullName: 'Manuel Ugarte', pos: 'Tiền vệ', role: 'Tiền vệ phòng ngự', nat: 'Uruguay', age: 24, height: '182 cm', foot: 'Phải' },
    { number: 18, fullName: 'Casemiro', pos: 'Tiền vệ', role: 'Tiền vệ phòng ngự', nat: 'Brazil', age: 33, height: '185 cm', foot: 'Phải' },
    { number: 7, fullName: 'Mason Mount', pos: 'Tiền vệ', role: 'Tiền vệ tấn công', nat: 'Anh', age: 26, height: '181 cm', foot: 'Phải' },
    { number: 14, fullName: 'Christian Eriksen', pos: 'Tiền vệ', role: 'Tiền vệ kiến thiết', nat: 'Đan Mạch', age: 33, height: '182 cm', foot: 'Phải' },
    { number: 16, fullName: 'Amad Diallo', pos: 'Tiền đạo', role: 'Tiền đạo cánh phải', nat: 'Bờ Biển Ngà', age: 23, height: '173 cm', foot: 'Trái' },
    { number: 17, fullName: 'Alejandro Garnacho', pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', nat: 'Argentina', age: 21, height: '180 cm', foot: 'Phải' },
    { number: 10, fullName: 'Marcus Rashford', pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', nat: 'Anh', age: 28, height: '185 cm', foot: 'Phải' },
    { number: 9, fullName: 'Rasmus Højlund', pos: 'Tiền đạo', role: 'Tiền đạo cắm', nat: 'Đan Mạch', age: 22, height: '191 cm', foot: 'Trái' },
    { number: 11, fullName: 'Joshua Zirkzee', pos: 'Tiền đạo', role: 'Tiền đạo cắm', nat: 'Hà Lan', age: 24, height: '193 cm', foot: 'Phải' },
    { number: 21, fullName: 'Antony', pos: 'Tiền đạo', role: 'Tiền đạo cánh phải', nat: 'Brazil', age: 25, height: '174 cm', foot: 'Trái' }
  ],
  50: [ // Man City
    { number: 31, fullName: 'Ederson Moraes', pos: 'Thủ môn', role: 'Thủ môn bắt chính', nat: 'Brazil', age: 32, height: '188 cm', foot: 'Trái' },
    { number: 18, fullName: 'Stefan Ortega', pos: 'Thủ môn', role: 'Thủ môn', nat: 'Đức', age: 32, height: '185 cm', foot: 'Phải' },
    { number: 33, fullName: 'Scott Carson', pos: 'Thủ môn', role: 'Thủ môn', nat: 'Anh', age: 39, height: '188 cm', foot: 'Phải' },
    { number: 2, fullName: 'Kyle Walker', pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', nat: 'Anh', age: 35, height: '183 cm', foot: 'Phải' },
    { number: 3, fullName: 'Rúben Dias', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Bồ Đào Nha', age: 28, height: '187 cm', foot: 'Phải' },
    { number: 25, fullName: 'Manuel Akanji', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Thụy Sĩ', age: 30, height: '188 cm', foot: 'Phải' },
    { number: 24, fullName: 'Joško Gvardiol', pos: 'Hậu vệ', role: 'Hậu vệ cánh trái / Trung vệ', nat: 'Croatia', age: 23, height: '185 cm', foot: 'Trái' },
    { number: 5, fullName: 'John Stones', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Anh', age: 31, height: '188 cm', foot: 'Phải' },
    { number: 6, fullName: 'Nathan Aké', pos: 'Hậu vệ', role: 'Trung vệ / Hậu vệ trái', nat: 'Hà Lan', age: 30, height: '180 cm', foot: 'Trái' },
    { number: 82, fullName: 'Rico Lewis', pos: 'Hậu vệ', role: 'Hậu vệ phải', nat: 'Anh', age: 20, height: '169 cm', foot: 'Phải' },
    { number: 16, fullName: 'Rodri', pos: 'Tiền vệ', role: 'Tiền vệ mỏ neo', nat: 'Tây Ban Nha', age: 29, height: '191 cm', foot: 'Phải' },
    { number: 17, fullName: 'Kevin De Bruyne', pos: 'Tiền vệ', role: 'Tiền vệ kiến thiết (Đội trưởng)', nat: 'Bỉ', age: 34, height: '181 cm', foot: 'Phải' },
    { number: 20, fullName: 'Bernardo Silva', pos: 'Tiền vệ', role: 'Tiền vệ tấn công', nat: 'Bồ Đào Nha', age: 31, height: '173 cm', foot: 'Trái' },
    { number: 8, fullName: 'Mateo Kovačić', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Croatia', age: 31, height: '176 cm', foot: 'Phải' },
    { number: 19, fullName: 'İlkay Gündoğan', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Đức', age: 34, height: '180 cm', foot: 'Phải' },
    { number: 27, fullName: 'Matheus Nunes', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Bồ Đào Nha', age: 27, height: '183 cm', foot: 'Phải' },
    { number: 47, fullName: 'Phil Foden', pos: 'Tiền đạo', role: 'Tiền đạo cánh / Hộ công', nat: 'Anh', age: 25, height: '171 cm', foot: 'Trái' },
    { number: 9, fullName: 'Erling Haaland', pos: 'Tiền đạo', role: 'Tiền đạo cắm', nat: 'Na Uy', age: 25, height: '195 cm', foot: 'Trái' },
    { number: 11, fullName: 'Jérémy Doku', pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', nat: 'Bỉ', age: 23, height: '173 cm', foot: 'Phải' },
    { number: 26, fullName: 'Savinho', pos: 'Tiền đạo', role: 'Tiền đạo cánh phải', nat: 'Brazil', age: 21, height: '176 cm', foot: 'Trái' },
    { number: 10, fullName: 'Jack Grealish', pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', nat: 'Anh', age: 30, height: '180 cm', foot: 'Phải' }
  ],
  40: [ // Liverpool
    { number: 1, fullName: 'Alisson Becker', pos: 'Thủ môn', role: 'Thủ môn bắt chính', nat: 'Brazil', age: 33, height: '193 cm', foot: 'Phải' },
    { number: 62, fullName: 'Caoimhín Kelleher', pos: 'Thủ môn', role: 'Thủ môn', nat: 'CH Ireland', age: 26, height: '188 cm', foot: 'Phải' },
    { number: 56, fullName: 'Vítězslav Jaroš', pos: 'Thủ môn', role: 'Thủ môn', nat: 'CH Séc', age: 24, height: '190 cm', foot: 'Phải' },
    { number: 66, fullName: 'Trent Alexander-Arnold', pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', nat: 'Anh', age: 27, height: '180 cm', foot: 'Phải' },
    { number: 4, fullName: 'Virgil van Dijk', pos: 'Hậu vệ', role: 'Trung vệ (Đội trưởng)', nat: 'Hà Lan', age: 34, height: '195 cm', foot: 'Phải' },
    { number: 5, fullName: 'Ibrahima Konaté', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Pháp', age: 26, height: '194 cm', foot: 'Phải' },
    { number: 26, fullName: 'Andrew Robertson', pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', nat: 'Scotland', age: 31, height: '178 cm', foot: 'Trái' },
    { number: 2, fullName: 'Joe Gomez', pos: 'Hậu vệ', role: 'Trung vệ / Hậu vệ cánh', nat: 'Anh', age: 28, height: '188 cm', foot: 'Phải' },
    { number: 21, fullName: 'Kostas Tsimikas', pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', nat: 'Hy Lạp', age: 29, height: '179 cm', foot: 'Trái' },
    { number: 84, fullName: 'Conor Bradley', pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', nat: 'Bắc Ireland', age: 22, height: '180 cm', foot: 'Phải' },
    { number: 38, fullName: 'Ryan Gravenberch', pos: 'Tiền vệ', role: 'Tiền vệ phòng ngự', nat: 'Hà Lan', age: 23, height: '190 cm', foot: 'Phải' },
    { number: 10, fullName: 'Alexis Mac Allister', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Argentina', age: 26, height: '176 cm', foot: 'Phải' },
    { number: 8, fullName: 'Dominik Szoboszlai', pos: 'Tiền vệ', role: 'Tiền vệ tấn công', nat: 'Hungary', age: 25, height: '186 cm', foot: 'Phải' },
    { number: 17, fullName: 'Curtis Jones', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Anh', age: 24, height: '185 cm', foot: 'Phải' },
    { number: 19, fullName: 'Harvey Elliott', pos: 'Tiền vệ', role: 'Tiền vệ tấn công', nat: 'Anh', age: 22, height: '170 cm', foot: 'Trái' },
    { number: 3, fullName: 'Wataru Endo', pos: 'Tiền vệ', role: 'Tiền vệ phòng ngự', nat: 'Nhật Bản', age: 32, height: '178 cm', foot: 'Phải' },
    { number: 11, fullName: 'Mohamed Salah', pos: 'Tiền đạo', role: 'Tiền đạo cánh phải', nat: 'Ai Cập', age: 33, height: '175 cm', foot: 'Trái' },
    { number: 7, fullName: 'Luis Díaz', pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', nat: 'Colombia', age: 28, height: '178 cm', foot: 'Phải' },
    { number: 20, fullName: 'Diogo Jota', pos: 'Tiền đạo', role: 'Tiền đạo cắm', nat: 'Bồ Đào Nha', age: 28, height: '178 cm', foot: 'Phải' },
    { number: 9, fullName: 'Darwin Núñez', pos: 'Tiền đạo', role: 'Tiền đạo cắm', nat: 'Uruguay', age: 26, height: '187 cm', foot: 'Phải' },
    { number: 18, fullName: 'Cody Gakpo', pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', nat: 'Hà Lan', age: 26, height: '193 cm', foot: 'Phải' },
    { number: 14, fullName: 'Federico Chiesa', pos: 'Tiền đạo', role: 'Tiền đạo cánh', nat: 'Ý', age: 28, height: '175 cm', foot: 'Phải' }
  ],
  541: [ // Real Madrid
    { number: 1, fullName: 'Thibaut Courtois', pos: 'Thủ môn', role: 'Thủ môn bắt chính', nat: 'Bỉ', age: 33, height: '200 cm', foot: 'Trái' },
    { number: 13, fullName: 'Andriy Lunin', pos: 'Thủ môn', role: 'Thủ môn', nat: 'Ukraine', age: 26, height: '191 cm', foot: 'Phải' },
    { number: 2, fullName: 'Dani Carvajal', pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', nat: 'Tây Ban Nha', age: 33, height: '173 cm', foot: 'Phải' },
    { number: 22, fullName: 'Antonio Rüdiger', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Đức', age: 32, height: '190 cm', foot: 'Phải' },
    { number: 3, fullName: 'Éder Militão', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Brazil', age: 27, height: '186 cm', foot: 'Phải' },
    { number: 23, fullName: 'Ferland Mendy', pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', nat: 'Pháp', age: 30, height: '180 cm', foot: 'Trái' },
    { number: 4, fullName: 'David Alaba', pos: 'Hậu vệ', role: 'Trung vệ', nat: 'Áo', age: 33, height: '180 cm', foot: 'Trái' },
    { number: 17, fullName: 'Lucas Vázquez', pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', nat: 'Tây Ban Nha', age: 34, height: '173 cm', foot: 'Phải' },
    { number: 20, fullName: 'Fran García', pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', nat: 'Tây Ban Nha', age: 26, height: '169 cm', foot: 'Trái' },
    { number: 8, fullName: 'Federico Valverde', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Uruguay', age: 27, height: '182 cm', foot: 'Phải' },
    { number: 5, fullName: 'Jude Bellingham', pos: 'Tiền vệ', role: 'Tiền vệ tấn công', nat: 'Anh', age: 22, height: '186 cm', foot: 'Phải' },
    { number: 14, fullName: 'Aurélien Tchouaméni', pos: 'Tiền vệ', role: 'Tiền vệ phòng ngự', nat: 'Pháp', age: 25, height: '188 cm', foot: 'Phải' },
    { number: 6, fullName: 'Eduardo Camavinga', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Pháp', age: 22, height: '182 cm', foot: 'Trái' },
    { number: 10, fullName: 'Luka Modrić', pos: 'Tiền vệ', role: 'Tiền vệ kiến thiết (Đội trưởng)', nat: 'Croatia', age: 40, height: '172 cm', foot: 'Phải' },
    { number: 15, fullName: 'Arda Güler', pos: 'Tiền vệ', role: 'Tiền vệ tấn công', nat: 'Thổ Nhĩ Kỳ', age: 20, height: '175 cm', foot: 'Trái' },
    { number: 19, fullName: 'Dani Ceballos', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Tây Ban Nha', age: 29, height: '179 cm', foot: 'Phải' },
    { number: 7, fullName: 'Vinícius Júnior', pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', nat: 'Brazil', age: 25, height: '176 cm', foot: 'Phải' },
    { number: 9, fullName: 'Kylian Mbappé', pos: 'Tiền đạo', role: 'Tiền đạo cắm', nat: 'Pháp', age: 26, height: '178 cm', foot: 'Phải' },
    { number: 11, fullName: 'Rodrygo Goes', pos: 'Tiền đạo', role: 'Tiền đạo cánh phải', nat: 'Brazil', age: 24, height: '174 cm', foot: 'Phải' },
    { number: 21, fullName: 'Brahim Díaz', pos: 'Tiền đạo', role: 'Hộ công / Cánh phải', nat: 'Morocco', age: 26, height: '170 cm', foot: 'Phải' },
    { number: 16, fullName: 'Endrick', pos: 'Tiền đạo', role: 'Tiền đạo cắm', nat: 'Brazil', age: 19, height: '173 cm', foot: 'Trái' }
  ]
};

function buildFullTeamSquad(teamId, teamName, country = 'Châu Âu') {
  const tid = parseInt(teamId) || 42;
  const meta = TEAM_META_PRESETS[tid] || {
    coach: country === 'Việt Nam' ? 'HLV Vũ Hồng Việt' : 'HLV Trưởng CLB',
    coachNat: country || 'Châu Âu',
    stadium: `${teamName} Arena (42,000 chỗ)`,
    founded: 1904 + (tid % 85),
    marketValue: country === 'Việt Nam' ? '€4.5 triệu' : `€${180 + (tid % 450)} triệu`
  };

  let rawPlayers = FULL_TEAM_ROSTERS[tid];

  if (!rawPlayers && TEAM_SQUADS[tid]) {
    const sq = TEAM_SQUADS[tid];
    const combined = [...(sq.starters || []), ...(sq.subs || [])];
    const defaultNats = {
      42: ['Tây Ban Nha', 'Anh', 'Pháp', 'Brazil', 'Hà Lan', 'Anh', 'Na Uy', 'Tây Ban Nha', 'Anh', 'Đức', 'Brazil', 'Bỉ', 'Brazil', 'Ghana', 'Ý', 'Ba Lan', 'Ý', 'Brazil'],
      49: ['Tây Ban Nha', 'Pháp', 'Pháp', 'Anh', 'Tây Ban Nha', 'Ecuador', 'Argentina', 'Anh', 'Anh', 'Bồ Đào Nha', 'Senegal', 'Pháp', 'Anh', 'Bồ Đào Nha', 'Bỉ', 'Anh', 'Anh', 'Đan Mạch'],
      85: ['Nga', 'Morocco', 'Brazil', 'Ecuador', 'Pháp', 'Bồ Đào Nha', 'Bồ Đào Nha', 'Tây Ban Nha', 'Pháp', 'Pháp', 'Georgia', 'Pháp', 'Pháp', 'Pháp', 'Brazil', 'Pháp', 'Pháp', 'Bồ Đào Nha'],
      529: ['Tây Ban Nha', 'Tây Ban Nha', 'Tây Ban Nha', 'Tây Ban Nha', 'Bồ Đào Nha', 'Tây Ban Nha', 'Tây Ban Nha', 'Tây Ban Nha', 'Tây Ban Nha', 'Anh', 'Brazil', 'Tây Ban Nha', 'Tây Ban Nha', 'Hà Lan', 'Tây Ban Nha', 'Tây Ban Nha', 'Ba Lan', 'Tây Ban Nha']
    }[tid] || ['Anh', 'Pháp', 'Tây Ban Nha', 'Brazil', 'Đức', 'Bồ Đào Nha', 'Ý', 'Hà Lan', 'Argentina'];

    rawPlayers = combined.map((p, idx) => ({
      number: p.number,
      fullName: p.fullName || p.name,
      pos: p.pos,
      role: p.pos === 'Thủ môn' ? (idx === 0 ? 'Thủ môn bắt chính' : 'Thủ môn') :
            p.pos === 'Hậu vệ' ? (idx % 2 === 0 ? 'Trung vệ' : 'Hậu vệ cánh') :
            p.pos === 'Tiền vệ' ? (idx % 2 === 0 ? 'Tiền vệ trung tâm' : 'Tiền vệ tấn công') : 'Tiền đạo',
      nat: defaultNats[idx % defaultNats.length],
      age: 21 + ((tid + idx * 3) % 11),
      height: p.pos === 'Thủ môn' ? '191 cm' : `${174 + ((idx * 5) % 18)} cm`,
      foot: idx % 4 === 0 ? 'Trái' : 'Phải',
      isStarter: idx < 11,
      line: p.line
    }));

    // Ensure at least 3 GK, 7 DF, 7 MF, 5 FW (22+ players)
    const extraPool = [
      { number: 31, fullName: 'K. Hein', pos: 'Thủ môn', role: 'Thủ môn dự bị', nat: 'Estonia', age: 23, height: '193 cm', foot: 'Phải' },
      { number: 17, fullName: 'O. Zinchenko', pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', nat: 'Ukraine', age: 28, height: '175 cm', foot: 'Trái' },
      { number: 18, fullName: 'T. Tomiyasu', pos: 'Hậu vệ', role: 'Hậu vệ đa năng', nat: 'Nhật Bản', age: 26, height: '188 cm', foot: 'Phải' },
      { number: 49, fullName: 'M. Lewis-Skelly', pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', nat: 'Anh', age: 19, height: '178 cm', foot: 'Trái' },
      { number: 53, fullName: 'E. Nwaneri', pos: 'Tiền vệ', role: 'Tiền vệ tấn công', nat: 'Anh', age: 18, height: '176 cm', foot: 'Trái' },
      { number: 30, fullName: 'R. Sterling', pos: 'Tiền đạo', role: 'Tiền đạo cánh', nat: 'Anh', age: 30, height: '172 cm', foot: 'Phải' }
    ];
    extraPool.forEach((ep, eIdx) => {
      if (!rawPlayers.some(rp => rp.number === ep.number)) {
        rawPlayers.push({ ...ep, isStarter: false });
      }
    });
  }

  if (!rawPlayers) {
    const gen = generateGenericSquad(tid, teamName, false);
    const isVN = country === 'Việt Nam';
    const vnNames = [
      'Nguyễn Филип', 'Đặng Văn Lâm', 'Trần Nguyên Mạnh',
      'Bùi Hoàng Việt Anh', 'Đoàn Văn Hậu', 'Vũ Văn Thanh', 'Hồ Tấn Tài', 'Nguyễn Thành Chung', 'Đỗ Duy Mạnh', 'Quế Ngọc Hải', 'Phan Tuấn Tài',
      'Nguyễn Quang Hải', 'Nguyễn Hoàng Đức', 'Đỗ Hùng Dũng', 'Nguyễn Tuấn Anh', 'Lê Phạm Thành Long', 'Nguyễn Thái Sơn', 'Khuất Văn Khang',
      'Nguyễn Tiến Linh', 'Phạm Tuấn Hải', 'Nguyễn Văn Toàn', 'Nguyễn Đình Bắc', 'Bùi Vĩ Hào', 'Nguyễn Văn Quyết'
    ];
    const intlFirst = ['Lucas', 'Mateo', 'Gabriel', 'Marco', 'Alejandro', 'Rafael', 'Julian', 'Carlos', 'Diego', 'Hugo', 'Victor', 'Adrian', 'Bruno', 'Martin', 'Daniel', 'David', 'thomas', 'Alex', 'Nicolas', 'Samuel', 'Christian', 'Oscar', 'Leo', 'Ivan'];
    const intlLast = ['Silva', 'Martinez', 'Santos', 'Costa', 'Fernandez', 'Alvarez', 'Pereira', 'Gomez', 'Ribeiro', 'Navarro', 'Moreno', 'Torres', 'Lopes', 'Mendes', 'Castro', 'Ortega', 'Delgado', 'Vargas', 'Romero', 'Suarez', 'Molina', 'Herrera', 'Medina', 'Aguilar'];
    const nats = isVN ? ['Việt Nam', 'Việt Nam', 'Việt Nam', 'Brazil', 'Việt Nam'] : ['Anh', 'Tây Ban Nha', 'Pháp', 'Brazil', 'Bồ Đào Nha', 'Đức', 'Ý', 'Hà Lan', 'Argentina'];

    const posTemplate = [
      { number: 1, pos: 'Thủ môn', role: 'Thủ môn bắt chính', isStarter: true, line: 0 },
      { number: 13, pos: 'Thủ môn', role: 'Thủ môn', isStarter: false },
      { number: 25, pos: 'Thủ môn', role: 'Thủ môn', isStarter: false },
      { number: 2, pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', isStarter: true, line: 1 },
      { number: 4, pos: 'Hậu vệ', role: 'Trung vệ', isStarter: true, line: 1 },
      { number: 5, pos: 'Hậu vệ', role: 'Trung vệ', isStarter: true, line: 1 },
      { number: 3, pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', isStarter: true, line: 1 },
      { number: 15, pos: 'Hậu vệ', role: 'Trung vệ', isStarter: false },
      { number: 18, pos: 'Hậu vệ', role: 'Hậu vệ cánh phải', isStarter: false },
      { number: 22, pos: 'Hậu vệ', role: 'Hậu vệ cánh trái', isStarter: false },
      { number: 24, pos: 'Hậu vệ', role: 'Trung vệ', isStarter: false },
      { number: 6, pos: 'Tiền vệ', role: 'Tiền vệ phòng ngự', isStarter: true, line: 2 },
      { number: 8, pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', isStarter: true, line: 2 },
      { number: 10, pos: 'Tiền vệ', role: 'Tiền vệ kiến thiết (Đội trưởng)', isStarter: true, line: 2 },
      { number: 14, pos: 'Tiền vệ', role: 'Tiền vệ trung tâm', isStarter: false },
      { number: 16, pos: 'Tiền vệ', role: 'Tiền vệ phòng ngự', isStarter: false },
      { number: 20, pos: 'Tiền vệ', role: 'Tiền vệ tấn công', isStarter: false },
      { number: 21, pos: 'Tiền vệ', role: 'Tiền vệ cánh', isStarter: false },
      { number: 7, pos: 'Tiền đạo', role: 'Tiền đạo cánh phải', isStarter: true, line: 3 },
      { number: 9, pos: 'Tiền đạo', role: 'Tiền đạo cắm', isStarter: true, line: 3 },
      { number: 11, pos: 'Tiền đạo', role: 'Tiền đạo cánh trái', isStarter: true, line: 3 },
      { number: 17, pos: 'Tiền đạo', role: 'Tiền đạo cánh', isStarter: false },
      { number: 19, pos: 'Tiền đạo', role: 'Tiền đạo cắm', isStarter: false },
      { number: 29, pos: 'Tiền đạo', role: 'Tiền đạo cắm', isStarter: false }
    ];

    rawPlayers = posTemplate.map((pt, idx) => {
      const fName = isVN
        ? vnNames[idx % vnNames.length]
        : `${intlFirst[(tid + idx * 3) % intlFirst.length]} ${intlLast[(tid + idx * 5) % intlLast.length]}`;
      return {
        number: pt.number,
        fullName: fName,
        pos: pt.pos,
        role: pt.role,
        nat: nats[(tid + idx) % nats.length],
        age: 20 + ((tid + idx * 3) % 13),
        height: pt.pos === 'Thủ môn' ? '189 cm' : `${173 + ((idx * 4) % 19)} cm`,
        foot: idx % 4 === 0 ? 'Trái' : 'Phải',
        isStarter: pt.isStarter,
        line: pt.line
      };
    });
  }

  // Enrich players with season stats & posCode
  const players = rawPlayers.map((p, idx) => {
    const posCode = p.pos === 'Thủ môn' ? 'GK' : p.pos === 'Hậu vệ' ? 'DF' : p.pos === 'Tiền vệ' ? 'MF' : 'FW';
    const isStarter = p.isStarter !== undefined ? p.isStarter : idx < 11;
    const appearances = isStarter ? 22 + (idx % 7) : 8 + (idx % 12);
    let goals = 0;
    let assists = 0;
    if (posCode === 'FW') {
      goals = isStarter ? 9 + ((tid + idx * 3) % 11) : 2 + (idx % 5);
      assists = isStarter ? 4 + ((tid + idx) % 7) : 1 + (idx % 3);
    } else if (posCode === 'MF') {
      goals = isStarter ? 3 + ((tid + idx * 2) % 6) : 1 + (idx % 3);
      assists = isStarter ? 5 + ((tid + idx * 3) % 8) : 1 + (idx % 4);
    } else if (posCode === 'DF') {
      goals = (idx % 3 === 0) ? 1 + (idx % 3) : 0;
      assists = isStarter ? 1 + (idx % 4) : (idx % 2);
    }
    const ratingNum = isStarter ? (7.05 + ((tid + idx * 7) % 115) / 100) : (6.65 + ((tid + idx * 5) % 65) / 100);
    const shortParts = String(p.fullName).trim().split(/\s+/);
    const shortName = shortParts.length > 1 ? `${shortParts[0].charAt(0)}. ${shortParts.slice(-1)[0]}` : p.fullName;

    return {
      id: tid * 100 + p.number,
      number: p.number,
      name: shortName,
      fullName: p.fullName,
      pos: p.pos,
      posCode,
      role: p.role || p.pos,
      nationality: p.nat || 'Châu Âu',
      age: p.age || 25,
      height: p.height || '182 cm',
      foot: p.foot || 'Phải',
      appearances,
      goals,
      assists,
      yellowCards: posCode === 'DF' || posCode === 'MF' ? 1 + (idx % 5) : (idx % 3),
      rating: ratingNum.toFixed(2),
      isStarter
    };
  });

  // Build 11 starters for visual pitch formation (1 GK, 4 DF, 3 MF, 3 FW)
  const gks = players.filter(p => p.posCode === 'GK');
  const dfs = players.filter(p => p.posCode === 'DF');
  const mfs = players.filter(p => p.posCode === 'MF');
  const fws = players.filter(p => p.posCode === 'FW');

  const pitchStarters = [
    ...(gks.slice(0, 1).map(p => ({ ...p, line: 0 }))),
    ...(dfs.slice(0, 4).map(p => ({ ...p, line: 1 }))),
    ...(mfs.slice(0, 3).map(p => ({ ...p, line: 2 }))),
    ...(fws.slice(0, 3).map(p => ({ ...p, line: 3 })))
  ];

  const avgAge = (players.reduce((acc, p) => acc + (p.age || 25), 0) / Math.max(1, players.length)).toFixed(1);
  const foreignCount = players.filter(p => p.nationality.toLowerCase() !== (country || '').toLowerCase()).length;

  return {
    formation: '4-3-3',
    coach: {
      name: meta.coach,
      nationality: meta.coachNat,
      preferredFormation: '4-3-3 Attacking'
    },
    overview: {
      totalPlayers: players.length,
      avgAge,
      foreignPlayers: foreignCount,
      marketValue: meta.marketValue,
      stadium: meta.stadium,
      founded: meta.founded
    },
    starters: pitchStarters,
    players
  };
}

app.get('/api/team-detail', async (req, res) => {
  const { slug = '', team_id } = req.query;

  // Parse teamId from slug (e.g. arsenal-42 -> 42) or query param
  let targetId = team_id ? parseInt(team_id) : null;
  if (!targetId && slug) {
    const m = String(slug).match(/-(\d+)$/);
    if (m) targetId = parseInt(m[1]);
  }
  const cleanSlug = toSeoSlugServer(String(slug).replace(/-\d+$/, ''));

  // Ensure major leagues are loaded in cache
  const majorIds = [39, 140, 135, 78, 61, 340, 307, 253, 2, 3];
  await Promise.all(majorIds.map(async lid => {
    if (!cache.fixtures[lid]) await getLeagueFixtures(lid).catch(() => {});
    if (!cache.standings[lid]) await getLeagueStandings(lid).catch(() => {});
  }));

  // Collect candidate teams across HOT_TEAMS, standings, and fixtures
  let foundTeam = null;
  let primaryLeagueId = null;

  // 1. Check HOT_TEAMS first
  const hotMatch = HOT_TEAMS.find(t =>
    (targetId && t.id === targetId) ||
    (cleanSlug && toSeoSlugServer(t.name) === cleanSlug)
  );
  if (hotMatch) {
    foundTeam = {
      id: hotMatch.id,
      name: hotMatch.name,
      logo: hotMatch.logo,
      country: hotMatch.country
    };
    primaryLeagueId = hotMatch.leagueId;
  }

  // 2. Search across domestic & continental standings
  const orderedLeagues = [
    ...LEAGUES.filter(l => l.tier === 1 && l.id !== 2 && l.id !== 3),
    ...LEAGUES.filter(l => l.id === 2 || l.id === 3),
    ...LEAGUES.filter(l => l.tier !== 1)
  ];

  if (!foundTeam) {
    for (const l of orderedLeagues) {
      const stList = cache.standings[l.id]?.data || [];
      const stTeam = stList.find(s =>
        (targetId && s.team_id === targetId) ||
        (cleanSlug && toSeoSlugServer(s.team_name) === cleanSlug)
      );
      if (stTeam) {
        foundTeam = {
          id: stTeam.team_id,
          name: stTeam.team_name,
          logo: stTeam.logo || stTeam.team_logo || `https://is.vnecdn.net/objects/teams/${stTeam.team_id}.png?v=1`,
          country: l.country
        };
        primaryLeagueId = l.id;
        break;
      }
    }
  }

  // 3. Search across all cached fixtures
  if (!foundTeam) {
    for (const l of orderedLeagues) {
      const fxList = cache.fixtures[l.id]?.data || [];
      for (const fx of fxList) {
        const ht = fx.home_team;
        const at = fx.away_team;
        if (ht && ((targetId && ht.team_id === targetId) || (cleanSlug && toSeoSlugServer(ht.team_name) === cleanSlug))) {
          foundTeam = { id: ht.team_id, name: ht.team_name, logo: ht.logo, country: l.country };
          primaryLeagueId = l.id;
          break;
        }
        if (at && ((targetId && at.team_id === targetId) || (cleanSlug && toSeoSlugServer(at.team_name) === cleanSlug))) {
          foundTeam = { id: at.team_id, name: at.team_name, logo: at.logo, country: l.country };
          primaryLeagueId = l.id;
          break;
        }
      }
      if (foundTeam) break;
    }
  }

  // 4. Search SHOWCASE_UCL_STANDINGS or fallback to Arsenal / parsed name
  if (!foundTeam) {
    const sc = SHOWCASE_UCL_STANDINGS.find(s =>
      (targetId && s.team_id === targetId) ||
      (cleanSlug && toSeoSlugServer(s.team_name) === cleanSlug)
    );
    if (sc) {
      foundTeam = { id: sc.team_id, name: sc.team_name, logo: sc.logo, country: 'Châu Âu' };
      primaryLeagueId = TEAM_META_PRESETS[sc.team_id]?.leagueId || 2;
    } else if (cleanSlug) {
      const prettyName = cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      foundTeam = {
        id: targetId || 42,
        name: prettyName,
        logo: `https://is.vnecdn.net/objects/teams/${targetId || 42}.png?v=1`,
        country: 'Anh'
      };
      primaryLeagueId = 39;
    } else {
      foundTeam = { id: 42, name: 'Arsenal', logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1', country: 'Anh' };
      primaryLeagueId = 39;
    }
  }

  // Prefer domestic league if preset exists
  if (TEAM_META_PRESETS[foundTeam.id]?.leagueId) {
    primaryLeagueId = TEAM_META_PRESETS[foundTeam.id].leagueId;
  }

  const primaryLeague = LEAGUES.find(l => l.id === primaryLeagueId) || LEAGUES[0];
  foundTeam.slug = `${toSeoSlugServer(foundTeam.name)}-${foundTeam.id}`;
  foundTeam.country = foundTeam.country || primaryLeague.country;

  // Parallel fetch standings, topscorers, and news for the primary league
  const [rawStandings, rawTopscorers, allNews] = await Promise.all([
    getLeagueStandings(primaryLeague.id),
    getLeagueTopscorers(primaryLeague.id),
    getFootballNews()
  ]);

  // Collect ALL fixtures for this team across all 28 leagues
  const teamFixturesMap = new Map();
  const teamSlugNorm = toSeoSlugServer(foundTeam.name);

  for (const l of LEAGUES) {
    const list = cache.fixtures[l.id]?.data || [];
    for (const m of list) {
      const isHome = m.home_team?.team_id === foundTeam.id || (m.home_team?.team_name && toSeoSlugServer(m.home_team.team_name) === teamSlugNorm);
      const isAway = m.away_team?.team_id === foundTeam.id || (m.away_team?.team_name && toSeoSlugServer(m.away_team.team_name) === teamSlugNorm);
      if ((isHome || isAway) && !teamFixturesMap.has(m.fixture_id)) {
        teamFixturesMap.set(m.fixture_id, {
          ...m,
          league_meta: {
            id: l.id,
            slug: l.slug,
            name: l.name,
            vnName: l.vnName,
            country: l.country,
            logo: l.logo
          }
        });
      }
    }
  }

  let teamFixtures = Array.from(teamFixturesMap.values());

  // Format standings & ensure current team is present and flagged
  let standings = (rawStandings || []).map((s, idx) => {
    const pld = s.all?.matchs_played ?? 0;
    const win = s.all?.win ?? 0;
    const pts = s.points ?? 0;
    const draw = Math.max(0, pts - (win * 3));
    const lose = Math.max(0, pld - win - draw);
    const gf = s.all?.goals_for ?? 0;
    const ga = s.all?.goals_against ?? 0;
    const gd = s.goals_diff ?? (gf - ga);
    const isCurrentTeam = s.team_id === foundTeam.id || toSeoSlugServer(s.team_name) === teamSlugNorm;
    return {
      ...s,
      rank: s.rank || idx + 1,
      isCurrentTeam,
      calculated: {
        played: pld,
        win,
        draw,
        lose,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDiff: gd,
        points: pts,
        forme: s.forme || 'WWDWW'
      }
    };
  });

  if (standings.length === 0) {
    standings = SHOWCASE_UCL_STANDINGS.map((s, idx) => ({
      rank: s.rank || idx + 1,
      team_id: s.team_id,
      team_name: s.team_name,
      logo: s.logo,
      points: s.points,
      goals_diff: s.gd,
      forme: s.forme,
      isCurrentTeam: s.team_id === foundTeam.id || toSeoSlugServer(s.team_name) === teamSlugNorm,
      calculated: {
        played: s.played,
        win: s.win,
        draw: s.draw,
        lose: s.lose,
        goalsFor: s.gf,
        goalsAgainst: s.ga,
        goalDiff: s.gd,
        points: s.points,
        forme: s.forme
      }
    }));
  }

  if (!standings.some(s => s.isCurrentTeam) && standings.length > 0) {
    standings[0] = {
      ...standings[0],
      team_id: foundTeam.id,
      team_name: foundTeam.name,
      logo: foundTeam.logo,
      isCurrentTeam: true
    };
  }

  // Split into upcomingMatches and pastMatches
  let upcomingMatches = teamFixtures.filter(m => {
    const isFinished = ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short) || m.status === 'Match Finished';
    return !isFinished;
  }).sort((a, b) => (a.event_timestamp || 0) - (b.event_timestamp || 0));

  let pastMatches = teamFixtures.filter(m => {
    const isFinished = ['FT', 'AET', 'PEN', 'Match Finished'].includes(m.status_short) || m.status === 'Match Finished';
    return isFinished;
  }).sort((a, b) => (b.event_timestamp || 0) - (a.event_timestamp || 0));

  // Ensure at least 9 upcoming matches across distinct future dates and 9 past matches across distinct past dates
  // so the Date Menu ("3 ngày gần nhất" + 4th, 5th, 6th, 7th, 8th, 9th dates) is always richly populated!
  const opponents = standings.filter(s => !s.isCurrentTeam && s.team_id !== foundTeam.id);
  const nowSec = Math.floor(Date.now() / 1000);

  if (upcomingMatches.length < 9 && opponents.length > 0) {
    const lastUpTs = upcomingMatches.length > 0
      ? (upcomingMatches[upcomingMatches.length - 1].event_timestamp || nowSec + 86400 * 3)
      : nowSec + 86400 * 2;
    const needed = 9 - upcomingMatches.length;
    for (let i = 0; i < needed; i++) {
      const opp = opponents[(i + foundTeam.id) % opponents.length];
      const matchTs = lastUpTs + (i + 1) * 86400 * 4; // every 4 days
      const d = new Date(matchTs * 1000);
      d.setHours(21 - (i % 3) * 2, i % 2 === 0 ? 0 : 30, 0, 0);
      const isoDate = d.toISOString();
      const isHome = i % 2 === 0;
      const roundNum = 10 + upcomingMatches.length + i;
      upcomingMatches.push({
        fixture_id: 800000 + foundTeam.id * 100 + i,
        league_id: primaryLeague.id,
        event_date: isoDate,
        event_timestamp: Math.floor(d.getTime() / 1000),
        round: `Vòng ${roundNum}`,
        status: 'Not Started',
        status_short: 'NS',
        goals_home_team: null,
        goals_away_team: null,
        league: {
          name: primaryLeague.name,
          country: primaryLeague.country,
          logo: primaryLeague.logo
        },
        league_meta: {
          id: primaryLeague.id,
          slug: primaryLeague.slug,
          name: primaryLeague.name,
          vnName: primaryLeague.vnName,
          country: primaryLeague.country,
          logo: primaryLeague.logo
        },
        home_team: isHome
          ? { team_id: foundTeam.id, team_name: foundTeam.name, logo: foundTeam.logo }
          : { team_id: opp.team_id, team_name: opp.team_name, logo: opp.logo || opp.team_logo },
        away_team: isHome
          ? { team_id: opp.team_id, team_name: opp.team_name, logo: opp.logo || opp.team_logo }
          : { team_id: foundTeam.id, team_name: foundTeam.name, logo: foundTeam.logo }
      });
    }
    upcomingMatches.sort((a, b) => (a.event_timestamp || 0) - (b.event_timestamp || 0));
  }

  if (pastMatches.length < 9 && opponents.length > 0) {
    const earliestPastTs = pastMatches.length > 0
      ? (pastMatches[pastMatches.length - 1].event_timestamp || nowSec - 86400 * 3)
      : nowSec - 86400 * 2;
    const needed = 9 - pastMatches.length;
    const scorePairs = [[2, 1], [3, 0], [1, 1], [2, 0], [3, 1], [1, 2], [4, 1], [2, 2], [1, 0]];
    for (let i = 0; i < needed; i++) {
      const opp = opponents[(i + 2 + foundTeam.id) % opponents.length];
      const matchTs = earliestPastTs - (i + 1) * 86400 * 4; // every 4 days backward
      const d = new Date(matchTs * 1000);
      d.setHours(21 - (i % 3) * 2, i % 2 === 0 ? 0 : 30, 0, 0);
      const isoDate = d.toISOString();
      const isHome = i % 2 === 0;
      const roundNum = Math.max(1, 9 - pastMatches.length - i);
      const sc = scorePairs[(foundTeam.id + i) % scorePairs.length];
      const gh = isHome ? sc[0] : sc[1];
      const ga = isHome ? sc[1] : sc[0];
      pastMatches.push({
        fixture_id: 700000 + foundTeam.id * 100 + i,
        league_id: primaryLeague.id,
        event_date: isoDate,
        event_timestamp: Math.floor(d.getTime() / 1000),
        round: `Vòng ${roundNum}`,
        status: 'Match Finished',
        status_short: 'FT',
        goals_home_team: gh,
        goals_away_team: ga,
        score: {
          halftime: `${Math.min(gh, 1)} - ${Math.min(ga, 1)}`,
          fulltime: `${gh} - ${ga}`
        },
        league: {
          name: primaryLeague.name,
          country: primaryLeague.country,
          logo: primaryLeague.logo
        },
        league_meta: {
          id: primaryLeague.id,
          slug: primaryLeague.slug,
          name: primaryLeague.name,
          vnName: primaryLeague.vnName,
          country: primaryLeague.country,
          logo: primaryLeague.logo
        },
        home_team: isHome
          ? { team_id: foundTeam.id, team_name: foundTeam.name, logo: foundTeam.logo }
          : { team_id: opp.team_id, team_name: opp.team_name, logo: opp.logo || opp.team_logo },
        away_team: isHome
          ? { team_id: opp.team_id, team_name: opp.team_name, logo: opp.logo || opp.team_logo }
          : { team_id: foundTeam.id, team_name: foundTeam.name, logo: foundTeam.logo }
      });
    }
    pastMatches.sort((a, b) => (b.event_timestamp || 0) - (a.event_timestamp || 0));
  }

  // Top schedule slider: 4 recent finished matches + 8 upcoming matches
  const recentFourChron = pastMatches.slice(0, 4).reverse();
  const nextEightChron = upcomingMatches.slice(0, 8);
  const topMatches = [...recentFourChron, ...nextEightChron];

  // Prediction widget: 3 next upcoming matches of this team
  const predictionMatches = upcomingMatches.slice(0, 3);

  // Squad data for Tab "Đội hình"
  const squad = buildFullTeamSquad(foundTeam.id, foundTeam.name, foundTeam.country);

  // Prioritize news mentioning the team or its league, and ensure at least 40 items
  const tNameLower = foundTeam.name.toLowerCase();
  const lNameLower = (primaryLeague.vnName || primaryLeague.name).toLowerCase();
  const directTeamNews = [];
  const leagueRelatedNews = [];
  const otherFootballNews = [];

  for (const n of allNews) {
    const text = `${n.title} ${n.description} ${n.category}`.toLowerCase();
    if (text.includes(tNameLower)) {
      directTeamNews.push({ ...n, category: foundTeam.name });
    } else if (text.includes(lNameLower)) {
      leagueRelatedNews.push(n);
    } else {
      otherFootballNews.push(n);
    }
  }

  const teamNews = [...directTeamNews, ...leagueRelatedNews, ...otherFootballNews];

  // Build topscorers list: include real league topscorers + team top scorers so team's players are represented
  let topscorers = rawTopscorers || [];
  if (topscorers.length === 0 && squad.players) {
    topscorers = [...squad.players]
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)
      .map(p => ({
        player_id: p.id,
        player_name: p.fullName,
        firstname: p.name,
        lastname: '',
        position: p.pos,
        nationality: p.nationality,
        team_id: foundTeam.id,
        team_name: foundTeam.name,
        team_logo: foundTeam.logo,
        goals: { total: p.goals, assists: p.assists },
        games: { appearences: p.appearances }
      }));
  }

  res.json({
    team: {
      ...foundTeam,
      coach: squad.coach.name,
      stadium: squad.overview.stadium,
      founded: squad.overview.founded,
      marketValue: squad.overview.marketValue
    },
    league: primaryLeague,
    allLeagues: LEAGUES,
    topMatches,
    predictionMatches,
    upcomingMatches,
    pastMatches,
    standings,
    topscorers,
    news: teamNews,
    squad,
    syncState
  });
});

// =========================================================================
// PLAYER DETAIL API (/api/player-detail)
// =========================================================================
const playerService = require('./player-service');

app.get('/api/player-detail', async (req, res) => {
  try {
    const { slug = '', player_id, team_id } = req.query;
    const cleanSlug = playerService.toSlug(slug || '');
    const idNum = player_id ? parseInt(player_id) : (cleanSlug.match(/-(\d+)$/) ? parseInt(cleanSlug.match(/-(\d+)$/)[1]) : null);

    // Fetch site news to enrich player articles
    const rawNews = await getFootballNews().catch(() => []);

    // Check if Yamal requested (default or matching slug)
    const isYamal = !cleanSlug ||
                    cleanSlug.includes('yamal') ||
                    cleanSlug.includes('386828') ||
                    idNum === 386828;

    let playerData;
    if (isYamal) {
      playerData = playerService.getRealYamalData();
    } else {
      // Find candidate player name from slug
      let cleanNamePart = cleanSlug.replace(/-\d+$/, '');
      let extractedName = cleanNamePart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!extractedName || extractedName.length < 2) extractedName = 'Cầu thủ';

      // Attempt to look up player in club squads
      let matchedTeam = null;
      if (team_id && TEAM_META_PRESETS[team_id]) {
        const sq = buildFullTeamSquad(team_id, 'CLB');
        matchedTeam = {
          id: parseInt(team_id),
          name: sq.overview?.stadium?.split(' ')[0] || 'CLB',
          logo: `https://is.vnecdn.net/objects/teams/${team_id}.png?v=1`,
          slug: `doi-bong-${team_id}`,
          league: 'Giải đấu',
          leagueSlug: 'ngoai-hang-anh',
          stadium: sq.overview?.stadium,
          coach: sq.coach?.name
        };
      }

      playerData = playerService.generatePlayerData(extractedName, idNum, matchedTeam);
    }

    // Attach contextual news
    const news = playerService.generatePlayerNews(playerData.profile.name, playerData.profile.club.name, rawNews);

    res.json({
      player: playerData.profile,
      compactStats: playerData.compactStats,
      statCategories: playerData.statCategories,
      tournaments: playerData.tournaments,
      totals: playerData.totals,
      news
    });
  } catch (err) {
    console.error('Error in /api/player-detail:', err);
    res.status(500).json({ error: 'Internal server error loading player detail' });
  }
});

if (!process.env.VERCEL) app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`VnExpress Football Fixtures & Results Server Running`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = app;
