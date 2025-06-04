// Data transformation utilities for converting API responses to dashboard format

// Game mode mappings
const GAME_MODES = {
  0: 'All Pick',
  1: 'Single Draft',
  2: 'All Random',
  3: 'Random Draft',
  4: 'Single Draft',
  5: 'All Random',
  16: 'Captains Mode',
  22: 'All Pick Ranked',
  23: 'Turbo',
};

// Skill bracket mappings
const SKILL_BRACKETS = {
  1: 'Normal Skill',
  2: 'High Skill',
  3: 'Very High Skill',
};

// Rank tier mappings
const RANK_TIERS = {
  10: 'Herald [1]', 11: 'Herald [2]', 12: 'Herald [3]', 13: 'Herald [4]', 14: 'Herald [5]',
  20: 'Guardian [1]', 21: 'Guardian [2]', 22: 'Guardian [3]', 23: 'Guardian [4]', 24: 'Guardian [5]',
  30: 'Crusader [1]', 31: 'Crusader [2]', 32: 'Crusader [3]', 33: 'Crusader [4]', 34: 'Crusader [5]',
  40: 'Archon [1]', 41: 'Archon [2]', 42: 'Archon [3]', 43: 'Archon [4]', 44: 'Archon [5]',
  50: 'Legend [1]', 51: 'Legend [2]', 52: 'Legend [3]', 53: 'Legend [4]', 54: 'Legend [5]',
  60: 'Ancient [1]', 61: 'Ancient [2]', 62: 'Ancient [3]', 63: 'Ancient [4]', 64: 'Ancient [5]',
  70: 'Divine [1]', 71: 'Divine [2]', 72: 'Divine [3]', 73: 'Divine [4]', 74: 'Divine [5]',
  80: 'Immortal',
};

// Utility functions
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const getGameMode = (gameModeId) => {
  return GAME_MODES[gameModeId] || `Mode ${gameModeId}`;
};

export const getSkillBracket = (skillId) => {
  return SKILL_BRACKETS[skillId] || 'Unknown Skill';
};

export const getRankName = (rankTier) => {
  if (!rankTier) return 'Unranked';
  return RANK_TIERS[rankTier] || `Rank ${rankTier}`;
};

export const isWin = (match) => {
  const playerSlot = match.player_slot || 0;
  const isRadiant = playerSlot < 128;
  return match.radiant_win === isRadiant;
};

// Transform OpenDota matches to dashboard format
export const transformMatches = (matches, heroMap = {}) => {
  if (!matches || !Array.isArray(matches)) return [];
  
  return matches.slice(0, 20).map(match => {
    const hero = heroMap[match.hero_id];
    const playerWin = isWin(match);
    
    return {
      id: match.match_id,
      hero: hero?.localized_name || hero?.name || `Hero ${match.hero_id}`,
      heroIcon: hero ? `https://cdn.dota2.com${hero.icon}` : null,
      result: playerWin ? 'Victory' : 'Defeat',
      kda: `${match.kills || 0}/${match.deaths || 0}/${match.assists || 0}`,
      gpm: match.gold_per_min || 0,
      xpm: match.xp_per_min || 0,
      duration: formatDuration(match.duration || 0),
      mode: getGameMode(match.game_mode),
      skillBracket: getSkillBracket(match.skill),
      avgMmr: match.average_rank || null,
      impactScore: calculateImpactScore(match),
      laneOutcome: getLaneOutcome(match),
      partySize: match.party_size || 1,
      radiantSide: (match.player_slot || 0) < 128,
      date: new Date(match.start_time * 1000),
      keyStats: {
        heroDmg: match.hero_damage || 0,
        towerDmg: match.tower_damage || 0,
        healed: match.hero_healing || 0,
        lastHits: match.last_hits || 0,
        denies: match.denies || 0
      }
    };
  });
};

// Calculate impact score from match data
const calculateImpactScore = (match) => {
  const kills = match.kills || 0;
  const deaths = match.deaths || 0;
  const assists = match.assists || 0;
  const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  
  if (kda >= 4) return 'MVP';
  if (kda >= 2.5) return 'Great';
  if (kda >= 1.5) return 'Good';
  if (kda >= 0.8) return 'Average';
  return 'Poor';
};

const getLaneOutcome = (match) => {
  // Simplified lane outcome based on KDA and GPM
  const kda = (match.kills + match.assists) / (match.deaths || 1);
  const gpm = match.gold_per_min || 0;
  
  if (kda >= 2 && gpm >= 500) return 'Won';
  if (kda >= 1 && gpm >= 350) return 'Drew';
  return 'Lost';
};

// Calculate today's session from recent matches
export const calculateTodaySession = (matches) => {
  if (!matches || !Array.isArray(matches)) {
    return { wins: 0, losses: 0, mmrChange: 0, currentStreak: 0, gamesUntilBehaviorUpdate: 15 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime() / 1000;

  const todayMatches = matches.filter(match => 
    match.start_time >= todayTimestamp
  ).sort((a, b) => b.start_time - a.start_time);

  const wins = todayMatches.filter(match => isWin(match)).length;
  const losses = todayMatches.length - wins;

  // Calculate MMR change (estimate)
  const mmrChange = (wins * 25) - (losses * 25);

  // Calculate current streak
  let currentStreak = 0;
  let lastResult = null;
  
  for (const match of todayMatches) {
    const won = isWin(match);
    if (lastResult === null) {
      lastResult = won;
      currentStreak = 1;
    } else if (lastResult === won) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    wins,
    losses,
    mmrChange,
    currentStreak,
    gamesUntilBehaviorUpdate: Math.max(0, 15 - todayMatches.length)
  };
};

// Transform hero stats to dashboard format
export const transformHeroStats = (heroes, heroMap = {}) => {
  if (!heroes || !Array.isArray(heroes)) return [];

  return heroes
    .filter(h => h.games >= 5) // Only heroes with 5+ games
    .sort((a, b) => b.games - a.games)
    .slice(0, 10) // Top 10 heroes
    .map(hero => {
      const heroData = heroMap[hero.hero_id];
      const winrate = hero.games > 0 ? (hero.win / hero.games * 100) : 0;
      
      return {
        name: heroData?.localized_name || heroData?.name || `Hero ${hero.hero_id}`,
        icon: heroData ? `https://cdn.dota2.com${heroData.icon}` : null,
        matches: hero.games,
        winrate: Math.round(winrate),
        kda: `${(hero.sum_kills/hero.games || 0).toFixed(1)}/${(hero.sum_deaths/hero.games || 0).toFixed(1)}/${(hero.sum_assists/hero.games || 0).toFixed(1)}`,
        gpm: Math.round(hero.sum_gold_per_min / hero.games || 0),
        xpm: Math.round(hero.sum_xp_per_min / hero.games || 0),
        lastHits: Math.round(hero.sum_last_hits / hero.games || 0),
        performance: {
          fight: Math.min(100, Math.round((hero.sum_kills + hero.sum_assists) / hero.games * 10)),
          farm: Math.min(100, Math.round((hero.sum_last_hits / hero.games) / 5)),
          push: Math.min(100, Math.round((hero.sum_tower_damage / hero.games) / 1000)),
          support: Math.min(100, Math.round((hero.sum_hero_healing + hero.sum_assists) / hero.games * 5)),
          versatility: Math.min(100, Math.round(winrate))
        },
        recentRecord: {
          wins: hero.win || 0,
          losses: (hero.games || 0) - (hero.win || 0)
        }
      };
    });
};

// Transform ratings to MMR history
export const transformRatings = (ratings) => {
  if (!ratings || !Array.isArray(ratings)) return [];

  return ratings
    .filter(rating => rating.solo_competitive_rank || rating.competitive_rank)
    .slice(-10) // Last 10 data points
    .map(rating => ({
      date: formatDate(rating.time),
      mmr: rating.solo_competitive_rank || rating.competitive_rank || 0,
      solo: rating.solo_competitive_rank || 0,
      party: rating.competitive_rank || 0,
      mode: rating.solo_competitive_rank ? 'solo' : 'party'
    }));
};

// Calculate core metrics from player data
export const calculateCoreMetrics = (user, winLoss, playerTotals, recentMatches) => {
  const metrics = [];

  // KDA Ratio
  if (recentMatches && recentMatches.length > 0) {
    const totalKills = recentMatches.reduce((sum, m) => sum + (m.kills || 0), 0);
    const totalDeaths = recentMatches.reduce((sum, m) => sum + (m.deaths || 0), 0);
    const totalAssists = recentMatches.reduce((sum, m) => sum + (m.assists || 0), 0);
    const kda = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists;
    
    metrics.push({
      label: 'KDA Ratio',
      value: parseFloat(kda.toFixed(2)),
      trend: 'up', // Could be calculated from recent trends
      suffix: '',
      icon: 'Target',
      color: 'from-green-500 to-emerald-600'
    });
  }

  // Win Rate
  if (winLoss) {
    const totalGames = winLoss.win + winLoss.lose;
    const winRate = totalGames > 0 ? (winLoss.win / totalGames * 100) : 0;
    
    metrics.push({
      label: 'Win Rate',
      value: parseFloat(winRate.toFixed(1)),
      trend: winRate >= 55 ? 'up' : winRate >= 45 ? 'same' : 'down',
      suffix: '%',
      icon: 'Trophy',
      color: 'from-green-500 to-emerald-600'
    });
  }

  // GPM (from recent matches or totals)
  if (recentMatches && recentMatches.length > 0) {
    const avgGpm = recentMatches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / recentMatches.length;
    
    metrics.push({
      label: 'GPM',
      value: Math.round(avgGpm),
      trend: avgGpm >= 500 ? 'up' : avgGpm >= 400 ? 'same' : 'down',
      suffix: '',
      icon: 'Coins',
      color: 'from-yellow-500 to-orange-600'
    });
  }

  // XPM (from recent matches)
  if (recentMatches && recentMatches.length > 0) {
    const avgXpm = recentMatches.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / recentMatches.length;
    
    metrics.push({
      label: 'XPM',
      value: Math.round(avgXpm),
      trend: avgXpm >= 600 ? 'up' : avgXpm >= 500 ? 'same' : 'down',
      suffix: '',
      icon: 'Star',
      color: 'from-purple-500 to-pink-600'
    });
  }

  // Last Hits per minute
  if (recentMatches && recentMatches.length > 0) {
    const matchesWithDuration = recentMatches.filter(m => m.duration > 0);
    if (matchesWithDuration.length > 0) {
      const avgLastHitsPerMin = matchesWithDuration.reduce((sum, m) => {
        return sum + ((m.last_hits || 0) / (m.duration / 60));
      }, 0) / matchesWithDuration.length;
      
      metrics.push({
        label: 'CS/Min',
        value: parseFloat(avgLastHitsPerMin.toFixed(1)),
        trend: avgLastHitsPerMin >= 60 ? 'up' : avgLastHitsPerMin >= 40 ? 'same' : 'down',
        suffix: '',
        icon: 'Target',
        color: 'from-blue-500 to-cyan-600'
      });
    }
  }

  return metrics;
};

// Default/fallback data
export const getDefaultMetrics = () => [
  { label: 'KDA Ratio', value: 0, trend: 'same', suffix: '', icon: 'Target', color: 'from-gray-500 to-gray-600' },
  { label: 'Win Rate', value: 0, trend: 'same', suffix: '%', icon: 'Trophy', color: 'from-gray-500 to-gray-600' },
  { label: 'GPM', value: 0, trend: 'same', suffix: '', icon: 'Coins', color: 'from-gray-500 to-gray-600' },
  { label: 'XPM', value: 0, trend: 'same', suffix: '', icon: 'Star', color: 'from-gray-500 to-gray-600' },
];

export const getDefaultHeroStats = () => [
  { name: 'No Data', matches: 0, winrate: 0, kda: '0/0/0' }
];