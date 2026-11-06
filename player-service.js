// =========================================================================
// PLAYER SERVICE (HỒ SƠ VÀ THỐNG KÊ CHI TIẾT CẦU THỦ)
// Handles API data parsing from profile-players.txt, squad-players.txt, stats-players.txt
// and generates rich positional data for Attackers, Midfielders, Defenders & Goalkeepers.
// =========================================================================

const fs = require('fs');
const path = require('path');

// Safe file parser for JSON-like API response files
function parseApiFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) return null;
    let txt = fs.readFileSync(filePath, 'utf8');
    let cleaned = txt
      .replace(/("|\d+|true|false|null)\s*[\r\n]+\s*([a-zA-Z0-9_]+)\s*:/g, '$1,\n$2:')
      .replace(/\}\s*[\r\n]+\s*([a-zA-Z0-9_]+)\s*:/g, '},\n$1:')
      .replace(/\}\s*[\r\n]+\s*\{/g, '},\n{');
    const obj = eval('({' + cleaned + '})');
    return obj.response || null;
  } catch (err) {
    console.error(`Error parsing ${filename}:`, err.message);
    return null;
  }
}

// Convert string to SEO Slug
function toSlug(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse Real API Data for Lamine Yamal (id: 386828)
function getRealYamalData() {
  const rawProfiles = parseApiFile('profile-players.txt');
  const rawSquads = parseApiFile('squad-players.txt');
  const rawStatsList = parseApiFile('stats-players.txt');

  const rawProfile = (rawProfiles && rawProfiles[0]?.player) || {
    id: 386828,
    name: "Lamine Yamal",
    firstname: "Lamine",
    lastname: "Yamal Nasraoui Ebana",
    age: 19,
    birth: { date: "2007-07-13", place: "Mataró", country: "Spain" },
    nationality: "Spain",
    height: "179",
    weight: "72",
    number: 10,
    position: "Attacker",
    photo: "https://media.api-sports.io/football/players/386828.png"
  };

  const rawStats = (rawStatsList && rawStatsList[0]?.statistics) || [];

  // Squad teams
  let clubTeam = {
    id: 529,
    name: "Barcelona",
    logo: "https://media.api-sports.io/football/teams/529.png",
    slug: "barcelona-529",
    league: "La Liga",
    leagueSlug: "la-liga",
    stadium: "Spotify Camp Nou",
    coach: "Hansi Flick"
  };

  let nationalTeam = {
    id: 9,
    name: "Tây Ban Nha",
    logo: "https://media.api-sports.io/football/teams/9.png",
    flag: "https://media.api-sports.io/flags/es.svg",
    number: 19
  };

  if (rawSquads && Array.isArray(rawSquads)) {
    const foundClub = rawSquads.find(s => s.team?.id === 529);
    if (foundClub) {
      clubTeam.name = foundClub.team.name || clubTeam.name;
      clubTeam.logo = foundClub.team.logo || clubTeam.logo;
    }
    const foundNat = rawSquads.find(s => s.team?.id === 9);
    if (foundNat) {
      nationalTeam.name = "Tây Ban Nha";
      nationalTeam.logo = foundNat.team.logo || nationalTeam.logo;
    }
  }

  // Calculate totals across tournaments
  let totalApps = 0, totalStarts = 0, totalMins = 0;
  let totalGoals = 0, totalAssists = 0;
  let totalShots = 0, totalShotsOn = 0;
  let totalPasses = 0, totalKeyPasses = 0;
  let totalTackles = 0, totalBlocks = 0, totalInterceptions = 0;
  let totalDuels = 0, totalDuelsWon = 0;
  let totalDribbles = 0, totalDribblesSuccess = 0;
  let totalFoulsDrawn = 0, totalFoulsCommitted = 0;
  let totalYellow = 0, totalRed = 0;
  let totalPenWon = 0, totalPenScored = 0, totalPenMissed = 0;
  let ratingWeightedSum = 0;

  const tournaments = rawStats.map(st => {
    const apps = st.games?.appearences || 0;
    const starts = st.games?.lineups || 0;
    const mins = st.games?.minutes || 0;
    const rating = parseFloat(st.games?.rating) || 7.0;
    const goals = st.goals?.total || 0;
    const assists = st.goals?.assists || 0;
    const shots = st.shots?.total || 0;
    const shotsOn = st.shots?.on || 0;
    const passes = st.passes?.total || 0;
    const keyPasses = st.passes?.key || 0;
    const passAcc = st.passes?.accuracy || 80;
    const tackles = st.tackles?.total || 0;
    const blocks = st.tackles?.blocks || 0;
    const interc = st.tackles?.interceptions || 0;
    const duels = st.duels?.total || 0;
    const duelsWon = st.duels?.won || 0;
    const dribbles = st.dribbles?.attempts || 0;
    const dribblesSuccess = st.dribbles?.success || 0;
    const foulsDrawn = st.fouls?.drawn || 0;
    const foulsCommitted = st.fouls?.committed || 0;
    const yellow = st.cards?.yellow || 0;
    const red = (st.cards?.red || 0) + (st.cards?.yellowred || 0);
    const penWon = st.penalty?.won || 0;
    const penScored = st.penalty?.scored || 0;
    const penMissed = st.penalty?.missed || 0;

    totalApps += apps;
    totalStarts += starts;
    totalMins += mins;
    totalGoals += goals;
    totalAssists += assists;
    totalShots += shots;
    totalShotsOn += shotsOn;
    totalPasses += passes;
    totalKeyPasses += keyPasses;
    totalTackles += tackles;
    totalBlocks += blocks;
    totalInterceptions += interc;
    totalDuels += duels;
    totalDuelsWon += duelsWon;
    totalDribbles += dribbles;
    totalDribblesSuccess += dribblesSuccess;
    totalFoulsDrawn += foulsDrawn;
    totalFoulsCommitted += foulsCommitted;
    totalYellow += yellow;
    totalRed += red;
    totalPenWon += penWon;
    totalPenScored += penScored;
    totalPenMissed += penMissed;
    ratingWeightedSum += (rating * (mins || 90));

    return {
      league: {
        id: st.league.id,
        name: st.league.name,
        vnName: getLeagueVnName(st.league.name),
        country: st.league.country,
        logo: st.league.logo,
        season: st.league.season || 2026
      },
      team: {
        id: st.team.id,
        name: st.team.name,
        logo: st.team.logo
      },
      games: {
        appearences: apps,
        lineups: starts,
        minutes: mins,
        rating: rating.toFixed(2),
        subIn: st.substitutes?.in || 0,
        subOut: st.substitutes?.out || 0
      },
      goals: {
        total: goals,
        assists: assists,
        shotsTotal: shots,
        shotsOn: shotsOn,
        penWon,
        penScored,
        penMissed
      },
      passes: {
        total: passes,
        key: keyPasses,
        accuracy: passAcc
      },
      defense: {
        tackles,
        blocks,
        interceptions: interc,
        duelsTotal: duels,
        duelsWon,
        duelsWonPct: duels > 0 ? Math.round((duelsWon / duels) * 100) : 0
      },
      dribbles: {
        attempts: dribbles,
        success: dribblesSuccess,
        successPct: dribbles > 0 ? Math.round((dribblesSuccess / dribbles) * 100) : 0
      },
      discipline: {
        foulsDrawn,
        foulsCommitted,
        yellow,
        red
      }
    };
  });

  const avgRating = totalMins > 0 ? (ratingWeightedSum / totalMins).toFixed(2) : '7.96';
  const shotAccuracyPct = totalShots > 0 ? Math.round((totalShotsOn / totalShots) * 100) : 0;
  const dribbleSuccessPct = totalDribbles > 0 ? Math.round((totalDribblesSuccess / totalDribbles) * 100) : 0;
  const duelWinPct = totalDuels > 0 ? Math.round((totalDuelsWon / totalDuels) * 100) : 0;
  const minsPerGoal = totalGoals > 0 ? Math.round(totalMins / totalGoals) : 0;

  // Position group: ATTACKER
  const positionGroup = 'ATTACKER';

  // Compact Stats Widget (To be placed directly under news item #3 on both PC and Mobile)
  const compactStats = {
    positionGroup: 'ATTACKER',
    positionBadge: 'Tiền đạo cánh',
    season: '2025/2026',
    totalMatchesText: `${totalApps} trận`,
    totalMinutesText: `${totalMins.toLocaleString('vi-VN')} phút`,
    totalStarts: totalStarts,
    averageRating: avgRating,
    metrics: [
      { label: 'Bàn thắng', value: totalGoals, highlight: true },
      { label: 'Kiến tạo', value: totalAssists, highlight: true },
      { label: 'Sút trúng đích', value: `${totalShotsOn}/${totalShots}`, sub: `${shotAccuracyPct}% chính xác` },
      { label: 'Rê bóng qua người', value: totalDribblesSuccess, sub: `${dribbleSuccessPct}% thành công` },
      { label: 'Tạo cơ hội (Key pass)', value: totalKeyPasses, sub: `${(totalKeyPasses/Math.max(1, totalApps)).toFixed(1)} lần/trận` },
      { label: 'Điểm số TB', value: avgRating, highlight: true, sub: 'Phong độ đỉnh cao' }
    ]
  };

  // Detailed Ordered Category Cards for Tab 2 ('Thống kê')
  // Requirement: Attacker/Midfielder -> Attacking metrics first!
  const statCategories = [
    {
      id: 'attacking',
      title: 'Tấn công & Ghi bàn',
      icon: 'flame',
      isPrimary: true,
      stats: [
        { label: 'Tổng bàn thắng', value: totalGoals, sub: `Hiệu suất: ${minsPerGoal} phút/bàn` },
        { label: 'Bàn thắng phạt đền', value: `${totalPenScored}/${totalPenScored + totalPenMissed}`, sub: 'Tỷ lệ sút phạt đền thành công 50%' },
        { label: 'Tổng cú dứt điểm', value: totalShots, sub: `${(totalShots / Math.max(1, totalApps)).toFixed(1)} cú sút/trận` },
        { label: 'Dứt điểm trúng đích', value: totalShotsOn, sub: `Tỷ lệ trúng đích: ${shotAccuracyPct}%` },
        { label: 'Kiếm về phạt đền', value: totalPenWon, sub: 'Mang lại 2 quả 11m' },
        { label: 'Hiệu suất ghi bàn/trận', value: (totalGoals / Math.max(1, totalApps)).toFixed(2), sub: 'Bàn thắng trung bình mỗi trận' }
      ]
    },
    {
      id: 'playmaking',
      title: 'Kiến tạo & Sáng tạo lối chơi',
      icon: 'sparkles',
      isPrimary: true,
      stats: [
        { label: 'Tổng kiến tạo', value: totalAssists, sub: `${(totalAssists / Math.max(1, totalApps)).toFixed(2)} kiến tạo/trận` },
        { label: 'Đường chuyền quyết định (Key pass)', value: totalKeyPasses, sub: 'Tạo cơ hội ghi bàn nguy hiểm' },
        { label: 'Tổng số đường chuyền', value: totalPasses.toLocaleString('vi-VN'), sub: `${(totalPasses / Math.max(1, totalApps)).toFixed(0)} đường chuyền/trận` },
        { label: 'Độ chính xác đường chuyền', value: '81.2%', sub: 'Tỷ lệ chuyền bóng chính xác' }
      ]
    },
    {
      id: 'dribbling',
      title: 'Kỹ năng cá nhân & Tranh chấp',
      icon: 'zap',
      isPrimary: false,
      stats: [
        { label: 'Số lần rê bóng thành công', value: totalDribblesSuccess, sub: `Thực hiện ${totalDribbles} lần (${dribbleSuccessPct}%)` },
        { label: 'Tổng số lần tranh chấp', value: totalDuels, sub: `${(totalDuels / Math.max(1, totalApps)).toFixed(1)} pha tranh chấp/trận` },
        { label: 'Tranh chấp tay đôi thắng', value: `${totalDuelsWon} (${duelWinPct}%)`, sub: 'Tỷ lệ thắng tay đôi vượt trội' },
        { label: 'Số lần bị phạm lỗi', value: totalFoulsDrawn, sub: `${(totalFoulsDrawn / Math.max(1, totalApps)).toFixed(1)} lần bị đối phương phạm lỗi/trận` }
      ]
    },
    {
      id: 'defending_discipline',
      title: 'Hỗ trợ phòng ngự & Kỷ luật',
      icon: 'shield',
      isPrimary: false,
      stats: [
        { label: 'Tắc bóng thành công', value: totalTackles, sub: 'Hỗ trợ áp sát từ tuyến trên' },
        { label: 'Cắt bóng (Interceptions)', value: totalInterceptions, sub: 'Đọc tình huống thông minh' },
        { label: 'Chặn bóng nguy hiểm', value: totalBlocks, sub: 'Lăn xả cản phá' },
        { label: 'Số lần phạm lỗi', value: totalFoulsCommitted, sub: `${(totalFoulsCommitted / Math.max(1, totalApps)).toFixed(1)} lần/trận` },
        { label: 'Thẻ vàng', value: totalYellow, sub: 'Lối đá fair-play' },
        { label: 'Thẻ đỏ', value: totalRed, sub: 'Chưa phải nhận thẻ đỏ nào' }
      ]
    }
  ];

  return {
    profile: {
      id: rawProfile.id,
      name: rawProfile.name,
      slug: 'lamine-yamal-386828',
      firstname: rawProfile.firstname,
      lastname: rawProfile.lastname,
      age: rawProfile.age || 19,
      birthDate: "13/07/2007",
      birthPlace: `${rawProfile.birth?.place || 'Mataró'}, ${rawProfile.birth?.country || 'Tây Ban Nha'}`,
      nationality: "Tây Ban Nha",
      nationalityCode: "es",
      nationalityFlag: "https://media.api-sports.io/flags/es.svg",
      height: "179 cm",
      weight: "72 kg",
      number: 10,
      positionVn: "Tiền đạo cánh phải",
      positionGroup: "ATTACKER",
      foot: "Chân trái",
      photo: rawProfile.photo || "https://media.api-sports.io/football/players/386828.png",
      marketValue: "€150 triệu",
      status: "Khỏe mạnh (Sẵn sàng thi đấu)",
      club: clubTeam,
      nationalTeam: nationalTeam
    },
    compactStats,
    statCategories,
    tournaments,
    totals: {
      appearences: totalApps,
      lineups: totalStarts,
      minutes: totalMins,
      goals: totalGoals,
      assists: totalAssists,
      shotsTotal: totalShots,
      shotsOn: totalShotsOn,
      shotAccuracyPct,
      passesTotal: totalPasses,
      keyPasses: totalKeyPasses,
      passAccuracyPct: 81,
      tackles: totalTackles,
      blocks: totalBlocks,
      interceptions: totalInterceptions,
      duelsTotal: totalDuels,
      duelsWon: totalDuelsWon,
      duelWinPct,
      dribblesAttempts: totalDribbles,
      dribblesSuccess: totalDribblesSuccess,
      dribbleSuccessPct,
      foulsDrawn: totalFoulsDrawn,
      foulsCommitted: totalFoulsCommitted,
      yellow: totalYellow,
      red: totalRed,
      rating: avgRating
    }
  };
}

// Generate Realistic Positional Data for other players (Attackers, Midfielders, Defenders, Goalkeepers)
function generatePlayerData(playerName, playerId, teamInfo = null) {
  const normName = playerName.toLowerCase();
  const playerSlug = `${toSlug(playerName)}-${playerId || '101'}`;

  // Determine Position Group
  let posGroup = 'ATTACKER';
  let posVn = 'Tiền đạo';
  let role = 'Tiền đạo';
  let foot = 'Chân phải';
  let number = 10;
  let height = '183 cm';
  let weight = '76 kg';
  let age = 24;
  let nationality = 'Anh';
  let natFlag = 'https://media.api-sports.io/flags/gb.svg';

  // Goalkeepers
  if (normName.includes('raya') || normName.includes('onana') || normName.includes('garcia') || normName.includes('alisson') || normName.includes('ederson') || normName.includes('courtois') || normName.includes('neuer') || normName.includes('heaton') || normName.includes('ortega')) {
    posGroup = 'GOALKEEPER';
    posVn = 'Thủ môn';
    role = 'Thủ môn bắt chính';
    height = '190 cm';
    weight = '84 kg';
    number = 1;
    foot = 'Chân phải';
    age = 29;
    nationality = normName.includes('raya') || normName.includes('garcia') ? 'Tây Ban Nha' : normName.includes('onana') ? 'Cameroon' : normName.includes('alisson') || normName.includes('ederson') ? 'Brazil' : 'Tây Ban Nha';
  }
  // Defenders
  else if (normName.includes('saliba') || normName.includes('gabriel') || normName.includes('dijk') || normName.includes('cubarsi') || normName.includes('martinez') || normName.includes('dias') || normName.includes('akanji') || normName.includes('gvardiol') || normName.includes('rudiger') || normName.includes('white') || normName.includes('dalot') || normName.includes('shaw') || normName.includes('stones') || normName.includes('konate') || normName.includes('robertson') || normName.includes('trent') || normName.includes('espart') || normName.includes('cancelo')) {
    posGroup = 'DEFENDER';
    posVn = normName.includes('dalot') || normName.includes('shaw') || normName.includes('robertson') || normName.includes('trent') || normName.includes('white') ? 'Hậu vệ cánh' : 'Trung vệ';
    role = posVn;
    height = '192 cm';
    weight = '85 kg';
    number = normName.includes('saliba') ? 2 : normName.includes('cubarsi') ? 5 : normName.includes('dijk') ? 4 : 3;
    foot = normName.includes('martinez') || normName.includes('shaw') || normName.includes('robertson') || normName.includes('gvardiol') ? 'Chân trái' : 'Chân phải';
    age = normName.includes('cubarsi') ? 19 : 25;
    nationality = normName.includes('saliba') ? 'Pháp' : normName.includes('cubarsi') ? 'Tây Ban Nha' : normName.includes('dijk') ? 'Hà Lan' : 'Tây Ban Nha';
  }
  // Midfielders
  else if (normName.includes('odegaard') || normName.includes('pedri') || normName.includes('rodri') || normName.includes('de bruyne') || normName.includes('fernandes') || normName.includes('rice') || normName.includes('bellingham') || normName.includes('valverde') || normName.includes('bernal') || normName.includes('mainoo') || normName.includes('gundogan') || normName.includes('szoboszlai') || normName.includes('mac allister') || normName.includes('casemiro')) {
    posGroup = 'MIDFIELDER';
    posVn = normName.includes('rodri') || normName.includes('rice') || normName.includes('casemiro') || normName.includes('bernal') ? 'Tiền vệ phòng ngự' : 'Tiền vệ tấn công';
    role = posVn;
    height = '178 cm';
    weight = '72 kg';
    number = normName.includes('odegaard') ? 8 : normName.includes('pedri') ? 8 : normName.includes('rodri') ? 16 : 8;
    foot = normName.includes('odegaard') ? 'Chân trái' : 'Chân phải';
    age = normName.includes('pedri') ? 23 : 26;
    nationality = normName.includes('odegaard') ? 'Na Uy' : normName.includes('pedri') || normName.includes('rodri') ? 'Tây Ban Nha' : normName.includes('fernandes') ? 'Bồ Đào Nha' : 'Tây Ban Nha';
  }
  // Attackers
  else {
    posGroup = 'ATTACKER';
    posVn = normName.includes('haaland') || normName.includes('hojlund') || normName.includes('lewandowski') || normName.includes('nunez') || normName.includes('zirkzee') ? 'Tiền đạo cắm' : 'Tiền đạo cánh';
    role = posVn;
    height = normName.includes('haaland') ? '195 cm' : '178 cm';
    weight = normName.includes('haaland') ? '88 kg' : '74 kg';
    number = normName.includes('saka') ? 7 : normName.includes('haaland') ? 9 : normName.includes('rashford') ? 10 : 7;
    foot = normName.includes('saka') || normName.includes('haaland') || normName.includes('foden') ? 'Chân trái' : 'Chân phải';
    age = normName.includes('saka') ? 24 : normName.includes('haaland') ? 25 : 26;
    nationality = normName.includes('haaland') ? 'Na Uy' : normName.includes('saka') || normName.includes('rashford') || normName.includes('foden') ? 'Anh' : 'Tây Ban Nha';
  }

  // Club details
  const club = teamInfo || {
    id: 42,
    name: 'Arsenal',
    logo: 'https://is.vnecdn.net/objects/teams/42.png?v=1',
    slug: 'arsenal-42',
    league: 'Premier League',
    leagueSlug: 'ngoai-hang-anh',
    stadium: 'Emirates Stadium',
    coach: 'Mikel Arteta'
  };

  const nationalTeam = {
    id: 1,
    name: nationality,
    logo: `https://is.vnecdn.net/objects/teams/1.png?v=1`,
    flag: natFlag,
    number: number
  };

  // Generate realistic stats based on position group
  let compactStats = {};
  let statCategories = [];
  let tournaments = [];
  let totals = {};

  if (posGroup === 'GOALKEEPER') {
    const apps = 26, starts = 26, mins = 2340;
    const saves = 86, savesInBox = 52, conceded = 22;
    const cleanSheets = 12;
    const penSaved = 2, penFaced = 4;
    const savePct = Math.round((saves / (saves + conceded)) * 100);
    const passes = 840, passAcc = 82;
    const rating = '7.38';

    compactStats = {
      positionGroup: 'GOALKEEPER',
      positionBadge: 'Thủ môn',
      season: '2025/2026',
      totalMatchesText: `${apps} trận`,
      totalMinutesText: `${mins.toLocaleString('vi-VN')} phút`,
      totalStarts: starts,
      averageRating: rating,
      metrics: [
        { label: 'Số pha cứu thua', value: saves, highlight: true },
        { label: 'Trận sạch lưới', value: `${cleanSheets}/${apps}`, highlight: true, sub: `${Math.round((cleanSheets/apps)*100)}% số trận` },
        { label: 'Tỷ lệ cứu thua', value: `${savePct}%`, sub: `${saves} lần cứu bóng` },
        { label: 'Bàn thua nhận', value: conceded, sub: `${(conceded/apps).toFixed(2)} bàn/trận` },
        { label: 'Cản phạt đền', value: `${penSaved}/${penFaced}`, sub: 'Tỷ lệ cản 50%' },
        { label: 'Điểm số TB', value: rating, highlight: true, sub: 'Chốt chặn vững chắc' }
      ]
    };

    // Ordering for Goalkeeper: Goalkeeping & Saves first!
    statCategories = [
      {
        id: 'goalkeeping',
        title: 'Cứu thua & Phản xạ',
        icon: 'hand',
        isPrimary: true,
        stats: [
          { label: 'Tổng số pha cứu thua', value: saves, sub: `${(saves/apps).toFixed(1)} pha cứu thua/trận` },
          { label: 'Cứu thua trong vòng cấm', value: savesInBox, sub: 'Phản xạ cự ly gần xuất thần' },
          { label: 'Tỷ lệ cứu thua thành công', value: `${savePct}%`, sub: 'Thuộc top đầu giải đấu' },
          { label: 'Bàn thua nhận', value: conceded, sub: `Trung bình ${(conceded/apps).toFixed(2)} bàn/trận` },
          { label: 'Cản phá penalty', value: `${penSaved}/${penFaced}`, sub: 'Đọc hướng sút xuất sắc' }
        ]
      },
      {
        id: 'box_command',
        title: 'Kiểm soát vòng cấm & Giữ sạch lưới',
        icon: 'shield',
        isPrimary: true,
        stats: [
          { label: 'Trận giữ sạch lưới', value: cleanSheets, sub: `Chiếm ${Math.round((cleanSheets/apps)*100)}% tổng số trận` },
          { label: 'Bắt bóng bổng (High claims)', value: 31, sub: 'Làm chủ không gian trên không' },
          { label: 'Đấm bóng giải nguy', value: 16, sub: 'Hóa giải bóng bổng nguy hiểm' },
          { label: 'Lao ra phá bóng (Sweeper keeper)', value: 24, sub: 'Bọc lót hoàn hảo sau lưng trung vệ' }
        ]
      },
      {
        id: 'distribution',
        title: 'Phát động & Phân phối bóng',
        icon: 'share-2',
        isPrimary: false,
        stats: [
          { label: 'Tổng số đường chuyền', value: passes, sub: `${(passes/apps).toFixed(0)} đường chuyền/trận` },
          { label: 'Độ chính xác chuyền bóng', value: `${passAcc}%`, sub: 'Tự tin phát động từ sân nhà' },
          { label: 'Đường chuyền dài chính xác', value: 132, sub: 'Mở ra cơ hội phản công nhanh' }
        ]
      },
      {
        id: 'discipline',
        title: 'Kỷ luật & Thời gian thi đấu',
        icon: 'clock',
        isPrimary: false,
        stats: [
          { label: 'Số phút thi đấu', value: `${mins}'`, sub: 'Đá chính trọn vẹn mọi trận' },
          { label: 'Thẻ vàng', value: 1, sub: 'Lỗi câu giờ' },
          { label: 'Thẻ đỏ', value: 0, sub: 'Không dính thẻ đỏ' }
        ]
      }
    ];

    tournaments = [
      {
        league: { id: 39, name: club.league || 'Premier League', vnName: club.league || 'Giải VĐQG', logo: 'https://is.vnecdn.net/objects/leagues/39.png?v=1', season: 2026 },
        team: { id: club.id, name: club.name, logo: club.logo },
        games: { appearences: 20, lineups: 20, minutes: 1800, rating: '7.40' },
        goals: { total: 0, assists: 0, shotsTotal: 0, shotsOn: 0 },
        passes: { total: 640, key: 0, accuracy: 83 },
        defense: { tackles: 0, blocks: 0, interceptions: 18, cleanSheets: 9, saves: 68, conceded: 16 },
        discipline: { foulsDrawn: 4, foulsCommitted: 0, yellow: 1, red: 0 }
      },
      {
        league: { id: 2, name: 'UEFA Champions League', vnName: 'Champions League', logo: 'https://is.vnecdn.net/objects/leagues/2.png?v=1', season: 2026 },
        team: { id: club.id, name: club.name, logo: club.logo },
        games: { appearences: 6, lineups: 6, minutes: 540, rating: '7.35' },
        goals: { total: 0, assists: 0, shotsTotal: 0, shotsOn: 0 },
        passes: { total: 200, key: 0, accuracy: 80 },
        defense: { tackles: 0, blocks: 0, interceptions: 6, cleanSheets: 3, saves: 18, conceded: 6 },
        discipline: { foulsDrawn: 1, foulsCommitted: 0, yellow: 0, red: 0 }
      }
    ];

    totals = {
      appearences: apps, lineups: starts, minutes: mins, goals: 0, assists: 0,
      saves, cleanSheets, conceded, savePct, rating
    };
  }
  else if (posGroup === 'DEFENDER') {
    const apps = 27, starts = 27, mins = 2415;
    const tackles = 58, tacklesWon = 46;
    const interceptions = 42, blocks = 24, clearances = 88;
    const duels = 172, duelsWon = 122;
    const aerialDuels = 86, aerialWon = 64;
    const cleanSheets = 12;
    const goals = 2, assists = 1;
    const passes = 1840, passAcc = 92;
    const yellow = 3, red = 0;
    const rating = '7.52';

    compactStats = {
      positionGroup: 'DEFENDER',
      positionBadge: posVn,
      season: '2025/2026',
      totalMatchesText: `${apps} trận`,
      totalMinutesText: `${mins.toLocaleString('vi-VN')} phút`,
      totalStarts: starts,
      averageRating: rating,
      metrics: [
        { label: 'Tắc bóng thành công', value: `${tacklesWon}/${tackles}`, highlight: true, sub: `${Math.round((tacklesWon/tackles)*100)}% thành công` },
        { label: 'Cắt bóng (Interceptions)', value: interceptions, highlight: true, sub: `${(interceptions/apps).toFixed(1)} lần/trận` },
        { label: 'Tranh chấp thắng', value: `${Math.round((duelsWon/duels)*100)}%`, sub: `${duelsWon}/${duels} lần thắng thế` },
        { label: 'Không chiến thắng', value: `${Math.round((aerialWon/aerialDuels)*100)}%`, sub: `${aerialWon}/${aerialDuels} lần chiến thắng` },
        { label: 'Giải nguy & Chặn bóng', value: clearances + blocks, sub: `${clearances} phá bóng, ${blocks} chắn sút` },
        { label: 'Điểm số TB', value: rating, highlight: true, sub: 'Bức tường vững chắc' }
      ]
    };

    // Ordering for Defender: Defending & Duels first!
    statCategories = [
      {
        id: 'defending',
        title: 'Phòng ngự & Thu hồi bóng',
        icon: 'shield',
        isPrimary: true,
        stats: [
          { label: 'Tắc bóng thành công', value: tacklesWon, sub: `Thực hiện ${tackles} lần (${Math.round((tacklesWon/tackles)*100)}%)` },
          { label: 'Cắt bóng thành công (Interceptions)', value: interceptions, sub: `${(interceptions/apps).toFixed(1)} lần/trận` },
          { label: 'Chặn cú dứt điểm nguy hiểm', value: blocks, sub: 'Lăn xả bảo vệ khung thành' },
          { label: 'Phá bóng giải nguy (Clearances)', value: clearances, sub: `${(clearances/apps).toFixed(1)} lần/trận` },
          { label: 'Thu hồi bóng (Ball recoveries)', value: 148, sub: 'Tái chiếm quyền kiểm soát' },
          { label: 'Số trận giữ sạch lưới', value: `${cleanSheets}/${apps}`, sub: 'Góp công lớn cho hàng thủ' }
        ]
      },
      {
        id: 'duels_aerial',
        title: 'Tranh chấp & Không chiến',
        icon: 'swords',
        isPrimary: true,
        stats: [
          { label: 'Tỷ lệ thắng tranh chấp tay đôi', value: `${Math.round((duelsWon/duels)*100)}%`, sub: `Thắng ${duelsWon}/${duels} lần đối đầu` },
          { label: 'Tỷ lệ thắng không chiến', value: `${Math.round((aerialWon/aerialDuels)*100)}%`, sub: `Thắng ${aerialWon}/${aerialDuels} pha không chiến` },
          { label: 'Không chiến giải nguy', value: 54, sub: 'Hóa giải tình huống cố định' }
        ]
      },
      {
        id: 'buildup',
        title: 'Chuyền bóng & Triển khai phát động',
        icon: 'share-2',
        isPrimary: false,
        stats: [
          { label: 'Tổng số đường chuyền', value: passes.toLocaleString('vi-VN'), sub: `${(passes/apps).toFixed(0)} đường chuyền/trận` },
          { label: 'Tỷ lệ chuyền chính xác', value: `${passAcc}%`, sub: 'Chuyền bóng chuẩn xác hàng đầu' },
          { label: 'Chuyền dài chuẩn xác', value: 88, sub: 'Chuyển trạng thái tấn công sắc bén' }
        ]
      },
      {
        id: 'attack_discipline',
        title: 'Đóng góp tấn công & Kỷ luật',
        icon: 'award',
        isPrimary: false,
        stats: [
          { label: 'Bàn thắng', value: goals, sub: 'Đánh đầu trong phạt góc' },
          { label: 'Kiến tạo', value: assists, sub: 'Đường chuyền dài kiến tạo' },
          { label: 'Thẻ vàng', value: yellow, sub: 'Phạm lỗi chiến thuật cần thiết' },
          { label: 'Thẻ đỏ', value: red, sub: 'Chưa từng bị truất quyền thi đấu' }
        ]
      }
    ];

    tournaments = [
      {
        league: { id: 39, name: club.league || 'Premier League', vnName: club.league || 'Giải VĐQG', logo: 'https://is.vnecdn.net/objects/leagues/39.png?v=1', season: 2026 },
        team: { id: club.id, name: club.name, logo: club.logo },
        games: { appearences: 21, lineups: 21, minutes: 1875, rating: '7.55' },
        goals: { total: 2, assists: 1, shotsTotal: 12, shotsOn: 5 },
        passes: { total: 1420, key: 8, accuracy: 92 },
        defense: { tackles: 46, blocks: 19, interceptions: 33, cleanSheets: 10 },
        discipline: { foulsDrawn: 18, foulsCommitted: 12, yellow: 2, red: 0 }
      },
      {
        league: { id: 2, name: 'UEFA Champions League', vnName: 'Champions League', logo: 'https://is.vnecdn.net/objects/leagues/2.png?v=1', season: 2026 },
        team: { id: club.id, name: club.name, logo: club.logo },
        games: { appearences: 6, lineups: 6, minutes: 540, rating: '7.45' },
        goals: { total: 0, assists: 0, shotsTotal: 3, shotsOn: 1 },
        passes: { total: 420, key: 2, accuracy: 91 },
        defense: { tackles: 12, blocks: 5, interceptions: 9, cleanSheets: 2 },
        discipline: { foulsDrawn: 4, foulsCommitted: 3, yellow: 1, red: 0 }
      }
    ];

    totals = {
      appearences: apps, lineups: starts, minutes: mins, goals, assists,
      tackles, tacklesWon, interceptions, blocks, clearances, duelsWon, cleanSheets, rating
    };
  }
  else {
    // Attackers and Midfielders
    const isMid = posGroup === 'MIDFIELDER';
    const apps = 26, starts = 25, mins = 2180;
    const goals = isMid ? 8 : 16;
    const assists = isMid ? 13 : 9;
    const shots = isMid ? 56 : 78;
    const shotsOn = isMid ? 26 : 38;
    const keyPasses = isMid ? 72 : 44;
    const dribbles = isMid ? 54 : 96;
    const dribblesSuccess = isMid ? 36 : 56;
    const passes = isMid ? 1580 : 740;
    const passAcc = isMid ? 88 : 82;
    const rating = isMid ? '7.88' : '7.92';

    compactStats = {
      positionGroup: posGroup,
      positionBadge: posVn,
      season: '2025/2026',
      totalMatchesText: `${apps} trận`,
      totalMinutesText: `${mins.toLocaleString('vi-VN')} phút`,
      totalStarts: starts,
      averageRating: rating,
      metrics: [
        { label: 'Bàn thắng', value: goals, highlight: true },
        { label: 'Kiến tạo', value: assists, highlight: true },
        { label: 'Sút trúng đích', value: `${shotsOn}/${shots}`, sub: `${Math.round((shotsOn/shots)*100)}% chính xác` },
        { label: 'Rê bóng qua người', value: dribblesSuccess, sub: `${Math.round((dribblesSuccess/dribbles)*100)}% thành công` },
        { label: 'Tạo cơ hội (Key pass)', value: keyPasses, sub: `${(keyPasses/apps).toFixed(1)} lần/trận` },
        { label: 'Điểm số TB', value: rating, highlight: true, sub: 'Nhạc trưởng trên sân' }
      ]
    };

    // Ordering for Attacker & Midfielder: Attacking & Playmaking first!
    statCategories = [
      {
        id: 'attacking',
        title: 'Tấn công & Ghi bàn',
        icon: 'flame',
        isPrimary: true,
        stats: [
          { label: 'Tổng bàn thắng', value: goals, sub: `Hiệu suất: ${Math.round(mins/goals)} phút/bàn` },
          { label: 'Tổng cú sút', value: shots, sub: `${(shots/apps).toFixed(1)} cú sút/trận` },
          { label: 'Sút trúng đích', value: shotsOn, sub: `Tỷ lệ trúng đích: ${Math.round((shotsOn/shots)*100)}%` },
          { label: 'Bàn thắng mở tỷ số', value: 4, sub: 'Khai thông bế tắc cho đội' }
        ]
      },
      {
        id: 'playmaking',
        title: 'Kiến tạo & Sáng tạo lối chơi',
        icon: 'sparkles',
        isPrimary: true,
        stats: [
          { label: 'Tổng kiến tạo', value: assists, sub: `${(assists/apps).toFixed(2)} kiến tạo/trận` },
          { label: 'Đường chuyền tạo cơ hội (Key pass)', value: keyPasses, sub: 'Tạo cơ hội nguy hiểm' },
          { label: 'Tổng số đường chuyền', value: passes.toLocaleString('vi-VN'), sub: `${(passes/apps).toFixed(0)} đường chuyền/trận` },
          { label: 'Tỷ lệ chuyền chính xác', value: `${passAcc}%`, sub: 'Chuyền bóng kiểm soát xuất sắc' }
        ]
      },
      {
        id: 'dribbling',
        title: 'Kỹ năng cá nhân & Tranh chấp',
        icon: 'zap',
        isPrimary: false,
        stats: [
          { label: 'Rê bóng thành công', value: dribblesSuccess, sub: `Thực hiện ${dribbles} lần (${Math.round((dribblesSuccess/dribbles)*100)}%)` },
          { label: 'Số lần bị phạm lỗi', value: 42, sub: 'Gây sức ép lên hàng thủ đối phương' }
        ]
      },
      {
        id: 'defending_discipline',
        title: 'Hỗ trợ phòng ngự & Kỷ luật',
        icon: 'shield',
        isPrimary: false,
        stats: [
          { label: 'Tắc bóng thành công', value: isMid ? 38 : 18, sub: 'Tích cực tranh cướp bóng' },
          { label: 'Cắt bóng', value: isMid ? 24 : 11, sub: 'Ngăn chặn phản công' },
          { label: 'Thẻ vàng', value: 2, sub: 'Hạn chế phạm lỗi nguy hiểm' },
          { label: 'Thẻ đỏ', value: 0, sub: 'Chưa từng bị phạt thẻ đỏ' }
        ]
      }
    ];

    tournaments = [
      {
        league: { id: 39, name: club.league || 'Premier League', vnName: club.league || 'Giải VĐQG', logo: 'https://is.vnecdn.net/objects/leagues/39.png?v=1', season: 2026 },
        team: { id: club.id, name: club.name, logo: club.logo },
        games: { appearences: 20, lineups: 19, minutes: 1680, rating: rating },
        goals: { total: Math.round(goals * 0.75), assists: Math.round(assists * 0.75), shotsTotal: Math.round(shots * 0.75), shotsOn: Math.round(shotsOn * 0.75) },
        passes: { total: Math.round(passes * 0.75), key: Math.round(keyPasses * 0.75), accuracy: passAcc },
        defense: { tackles: 24, blocks: 4, interceptions: 14 },
        discipline: { foulsDrawn: 30, foulsCommitted: 14, yellow: 2, red: 0 }
      },
      {
        league: { id: 2, name: 'UEFA Champions League', vnName: 'Champions League', logo: 'https://is.vnecdn.net/objects/leagues/2.png?v=1', season: 2026 },
        team: { id: club.id, name: club.name, logo: club.logo },
        games: { appearences: 6, lineups: 6, minutes: 500, rating: (parseFloat(rating) + 0.1).toFixed(2) },
        goals: { total: Math.max(1, Math.round(goals * 0.25)), assists: Math.max(1, Math.round(assists * 0.25)), shotsTotal: Math.round(shots * 0.25), shotsOn: Math.round(shotsOn * 0.25) },
        passes: { total: Math.round(passes * 0.25), key: Math.round(keyPasses * 0.25), accuracy: passAcc },
        defense: { tackles: 8, blocks: 2, interceptions: 5 },
        discipline: { foulsDrawn: 12, foulsCommitted: 4, yellow: 0, red: 0 }
      }
    ];

    totals = {
      appearences: apps, lineups: starts, minutes: mins, goals, assists,
      shotsTotal: shots, shotsOn, keyPasses, passesTotal: passes, passAccuracyPct: passAcc,
      dribblesSuccess, rating
    };
  }

  return {
    profile: {
      id: playerId || 101,
      name: playerName,
      slug: playerSlug,
      firstname: playerName.split(' ')[0] || '',
      lastname: playerName.split(' ').slice(1).join(' ') || '',
      age,
      birthDate: "15/06/2001",
      birthPlace: nationality,
      nationality,
      nationalityCode: "intl",
      nationalityFlag: natFlag,
      height,
      weight,
      number,
      positionVn: posVn,
      positionGroup: posGroup,
      foot,
      photo: `https://is.vnecdn.net/objects/players/${playerId || 101}.png?v=1`,
      marketValue: "€85 triệu",
      status: "Khỏe mạnh (Sẵn sàng thi đấu)",
      club,
      nationalTeam
    },
    compactStats,
    statCategories,
    tournaments,
    totals
  };
}

// Generate tailored news feed for a player
function generatePlayerNews(playerName, clubName, rawNews = []) {
  const customItems = [
    {
      title: `${playerName} bùng nổ, đưa ${clubName} tiến sát đỉnh bảng`,
      description: `Màn trình diễn đỉnh cao với những pha xử lý bóng đẳng cấp của ${playerName} đã mang về 3 điểm quý giá cho ${clubName} trong trận cầu tâm điểm.`,
      timeAgo: '2 giờ trước',
      thumbnail: 'https://vne-media.vnecdn.net/2024/10/28/yamal-barca-real-1730076231.jpg',
      link: `/${toSlug(playerName)}-toa-sang-ruc-ro-giup-${toSlug(clubName)}-chien-thang-5138201.html`,
      commentsCount: 68
    },
    {
      title: `HLV ${clubName} hết lời ca ngợi sự trưởng thành vượt bậc của ${playerName}`,
      description: `Trong buổi họp báo sau trận, ban huấn luyện khẳng định ${playerName} đang là mắt xích không thể thay thế trong sơ đồ chiến thuật hiện tại.`,
      timeAgo: '5 giờ trước',
      thumbnail: 'https://vne-media.vnecdn.net/2024/10/27/hansi-flick-barca-1730030580.jpg',
      link: `/hlv-${toSlug(clubName)}-khen-ngoi-phong-do-cua-${toSlug(playerName)}-5138202.html`,
      commentsCount: 42
    },
    {
      title: `${playerName} lập kỷ lục vô tiền khoáng hậu tại mùa giải 2025/2026`,
      description: `Với những thông số thống kê ấn tượng, ngôi sao này tiếp tục chứng minh vị thế của một trong những nhân tố xuất sắc nhất châu Âu ở thời điểm này.`,
      timeAgo: '1 ngày trước',
      thumbnail: 'https://vne-media.vnecdn.net/2024/10/26/yamal-elclasico-1729977821.jpg',
      link: `/${toSlug(playerName)}-lap-ky-luc-an-tuong-tai-mua-giai-moi-5138203.html`,
      commentsCount: 89
    },
    {
      title: `Phân tích chiến thuật: Vai trò sống còn của ${playerName} tại ${clubName}`,
      description: `Chuyên gia thể thao phân tích cách ${playerName} tạo đột biến, thu hút hậu vệ đối phương và mở ra khoảng trống mênh mông cho các đồng đội.`,
      timeAgo: '2 ngày trước',
      thumbnail: 'https://vne-media.vnecdn.net/2024/10/25/barca-tactics-1729864221.jpg',
      link: `/phan-tich-chien-thuat-vai-tro-cua-${toSlug(playerName)}-5138204.html`,
      commentsCount: 35
    },
    {
      title: `${playerName} lọt đề cử cầu thủ xuất sắc nhất tháng: Xứng danh trụ cột`,
      description: `Ban tổ chức giải đấu vừa công bố danh sách rút gọn cho giải thưởng tháng, trong đó ${playerName} đang dẫn đầu số phiếu bình chọn từ giới chuyên môn.`,
      timeAgo: '3 ngày trước',
      thumbnail: 'https://vne-media.vnecdn.net/2024/10/24/potm-nomination-1729789012.jpg',
      link: `/${toSlug(playerName)}-lot-de-cu-cau-thu-xuat-sac-nhat-thang-5138205.html`,
      commentsCount: 51
    },
    {
      title: `Chuyện hậu trường: Hành trình vươn lên thành ngôi sao hàng đầu của ${playerName}`,
      description: `Những câu chuyện xúc động về sự khổ luyện, tinh thần chuyên nghiệp và khát khao cống hiến không ngừng nghỉ từ những ngày đầu khởi nghiệp.`,
      timeAgo: '4 ngày trước',
      thumbnail: 'https://vne-media.vnecdn.net/2024/10/22/yamal-childhood-1729601245.jpg',
      link: `/hanh-trinh-vuon-len-thanh-ngoi-sao-cua-${toSlug(playerName)}-5138206.html`,
      commentsCount: 77
    }
  ];

  // Enrich with raw news if available
  const enrichedRawNews = (rawNews || []).slice(0, 14).map((n, idx) => ({
    title: n.title,
    description: n.description || '',
    timeAgo: n.timeAgo || `${idx + 2} ngày trước`,
    thumbnail: n.thumbnail || customItems[idx % customItems.length].thumbnail,
    link: n.link || `/tin-bong-da-moi-nhat-${5138300 + idx}.html`,
    commentsCount: Math.floor(Math.random() * 60 + 10)
  }));

  return [...customItems, ...enrichedRawNews];
}

function getLeagueVnName(name) {
  if (!name) return 'Giải đấu';
  const m = {
    'World Cup': 'FIFA World Cup',
    'UEFA Nations League': 'UEFA Nations League',
    'Friendlies': 'Giao hữu quốc tế',
    'UEFA Champions League': 'Champions League',
    'La Liga': 'La Liga',
    'Premier League': 'Ngoại hạng Anh',
    'Serie A': 'Serie A',
    'Bundesliga': 'Bundesliga'
  };
  return m[name] || name;
}

module.exports = {
  getRealYamalData,
  generatePlayerData,
  generatePlayerNews,
  toSlug
};
