/**
 * Hero Mastery Calculation Utilities
 * Provides algorithms for calculating mastery levels, progress, and tier assignments
 */

// Mastery tier definitions
export const MASTERY_TIERS = {
  bronze: {
    level: 1,
    name: 'Bronze',
    emoji: '🥉',
    color: '#CD7F32',
    requirements: {
      games: 5,
      winrate: 40,
      kda: 1.0
    }
  },
  silver: {
    level: 2,
    name: 'Silver',
    emoji: '🥈',
    color: '#C0C0C0',
    requirements: {
      games: 10,
      winrate: 50,
      kda: 1.5
    }
  },
  gold: {
    level: 3,
    name: 'Gold',
    emoji: '🥇',
    color: '#FFD700',
    requirements: {
      games: 15,
      winrate: 55,
      kda: 2.0
    }
  },
  platinum: {
    level: 4,
    name: 'Platinum',
    emoji: '⭐',
    color: '#E5E4E2',
    requirements: {
      games: 25,
      winrate: 60,
      kda: 2.5
    }
  },
  diamond: {
    level: 5,
    name: 'Diamond',
    emoji: '💎',
    color: '#B9F2FF',
    requirements: {
      games: 40,
      winrate: 65,
      kda: 3.0
    }
  }
};

/**
 * Calculate hero mastery level and progress
 * @param {Object} heroStats - Hero statistics from OpenDota API
 * @returns {Object} Mastery data with tier, progress, next milestone
 */
export const calculateHeroMastery = (heroStats) => {
  if (!heroStats || !heroStats.games) {
    return {
      tier: 'bronze',
      level: 0,
      progress: 0,
      nextTier: 'bronze',
      nextRequirements: MASTERY_TIERS.bronze.requirements,
      meetsRequirements: false
    };
  }

  const games = heroStats.games || 0;
  const winrate = games > 0 ? (heroStats.win / games * 100) : 0;
  const kda = games > 0 ? 
    ((heroStats.sum_kills + heroStats.sum_assists) / Math.max(heroStats.sum_deaths, 1)) / games : 0;

  // Determine current tier
  let currentTier = 'bronze';
  const tierKeys = Object.keys(MASTERY_TIERS);
  
  for (const tierKey of tierKeys.reverse()) { // Start from highest tier
    const tier = MASTERY_TIERS[tierKey];
    if (games >= tier.requirements.games && 
        winrate >= tier.requirements.winrate && 
        kda >= tier.requirements.kda) {
      currentTier = tierKey;
      break;
    }
  }

  // Calculate progress to next tier
  const currentTierIndex = tierKeys.indexOf(currentTier);
  const nextTierIndex = Math.min(currentTierIndex + 1, tierKeys.length - 1);
  const nextTier = tierKeys[nextTierIndex];
  
  let progress = 100; // Default to 100% if already at max tier
  let nextRequirements = null;
  let meetsRequirements = true;

  if (currentTierIndex < tierKeys.length - 1) {
    const nextTierData = MASTERY_TIERS[nextTier];
    nextRequirements = nextTierData.requirements;
    
    // Calculate progress towards next tier (based on the most limiting factor)
    const gameProgress = Math.min(100, (games / nextRequirements.games) * 100);
    const winrateProgress = Math.min(100, (winrate / nextRequirements.winrate) * 100);
    const kdaProgress = Math.min(100, (kda / nextRequirements.kda) * 100);
    
    // Progress is the minimum of all requirements
    progress = Math.min(gameProgress, winrateProgress, kdaProgress);
    
    meetsRequirements = games >= nextRequirements.games && 
                       winrate >= nextRequirements.winrate && 
                       kda >= nextRequirements.kda;
  }

  return {
    tier: currentTier,
    level: MASTERY_TIERS[currentTier].level,
    progress: Math.round(progress),
    nextTier: nextTier !== currentTier ? nextTier : null,
    nextRequirements,
    meetsRequirements,
    stats: {
      games,
      winrate: Math.round(winrate * 10) / 10,
      kda: Math.round(kda * 100) / 100
    }
  };
};

/**
 * Calculate what's needed to reach next mastery tier
 * @param {Object} heroStats - Hero statistics
 * @param {Object} masteryData - Current mastery data
 * @returns {Object} Requirements breakdown
 */
export const calculateNextTierRequirements = (heroStats, masteryData) => {
  if (!masteryData.nextRequirements) {
    return {
      isMaxTier: true,
      message: 'Maximum mastery level achieved!'
    };
  }

  const { stats } = masteryData;
  const requirements = masteryData.nextRequirements;
  
  const gamesNeeded = Math.max(0, requirements.games - stats.games);
  const winrateNeeded = Math.max(0, requirements.winrate - stats.winrate);
  const kdaNeeded = Math.max(0, requirements.kda - stats.kda);
  
  const improvements = [];
  
  if (gamesNeeded > 0) {
    improvements.push(`+${gamesNeeded} games`);
  }
  
  if (winrateNeeded > 0) {
    improvements.push(`+${winrateNeeded.toFixed(1)}% WR`);
  }
  
  if (kdaNeeded > 0) {
    improvements.push(`+${kdaNeeded.toFixed(2)} KDA`);
  }

  return {
    isMaxTier: false,
    improvements,
    message: improvements.length > 0 ? `Need: ${improvements.join(' AND ')}` : 'Ready for promotion!',
    canPromote: improvements.length === 0
  };
};

/**
 * Get mastery badge information for display
 * @param {string} tier - Mastery tier key
 * @returns {Object} Badge display information
 */
export const getMasteryBadge = (tier) => {
  const tierData = MASTERY_TIERS[tier] || MASTERY_TIERS.bronze;
  return {
    ...tierData,
    stars: '⭐'.repeat(tierData.level),
    displayName: `${tierData.name} Mastery ${tierData.emoji}`,
    shortName: tierData.name
  };
};

/**
 * Sort heroes by mastery score for ranking
 * @param {Array} heroesWithMastery - Heroes with calculated mastery data
 * @returns {Array} Sorted heroes by mastery score
 */
export const sortHeroesByMastery = (heroesWithMastery) => {
  return heroesWithMastery.sort((a, b) => {
    // Primary sort: Mastery level
    if (a.mastery.level !== b.mastery.level) {
      return b.mastery.level - a.mastery.level;
    }
    
    // Secondary sort: Progress towards next tier
    if (a.mastery.progress !== b.mastery.progress) {
      return b.mastery.progress - a.mastery.progress;
    }
    
    // Tertiary sort: Number of games (more experience)
    return b.mastery.stats.games - a.mastery.stats.games;
  });
};

/**
 * Calculate overall mastery summary for a player
 * @param {Array} heroesWithMastery - All heroes with mastery data
 * @returns {Object} Overall mastery summary
 */
export const calculateMasterySummary = (heroesWithMastery) => {
  if (!heroesWithMastery || heroesWithMastery.length === 0) {
    return {
      totalHeroes: 0,
      averageLevel: 0,
      tierDistribution: {},
      topTier: 'bronze',
      masteryScore: 0
    };
  }

  const tierCounts = {};
  let totalLevel = 0;
  let maxLevel = 0;
  let topTier = 'bronze';

  heroesWithMastery.forEach(hero => {
    const tier = hero.mastery.tier;
    const level = hero.mastery.level;
    
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    totalLevel += level;
    
    if (level > maxLevel) {
      maxLevel = level;
      topTier = tier;
    }
  });

  // Calculate mastery score (weighted sum of all tier levels)
  const masteryScore = Object.entries(tierCounts).reduce((score, [tier, count]) => {
    return score + (MASTERY_TIERS[tier].level * count);
  }, 0);

  return {
    totalHeroes: heroesWithMastery.length,
    averageLevel: Math.round((totalLevel / heroesWithMastery.length) * 100) / 100,
    tierDistribution: tierCounts,
    topTier,
    masteryScore,
    maxLevel
  };
};

/**
 * Get hero mastery recommendations based on current status
 * @param {Array} heroesWithMastery - Heroes with mastery data
 * @returns {Object} Recommendations for improvement
 */
export const getMasteryRecommendations = (heroesWithMastery) => {
  if (!heroesWithMastery || heroesWithMastery.length === 0) {
    return {
      practice: [],
      focus: [],
      avoid: []
    };
  }

  const sorted = sortHeroesByMastery(heroesWithMastery);
  
  // Heroes close to next tier (>75% progress)
  const practice = sorted.filter(hero => 
    hero.mastery.progress > 75 && !hero.mastery.meetsRequirements
  ).slice(0, 3);

  // Heroes with good stats but low games (potential for quick improvement)
  const focus = sorted.filter(hero => 
    hero.mastery.stats.games < 15 && 
    hero.mastery.stats.winrate > 55 && 
    hero.mastery.stats.kda > 2.0
  ).slice(0, 3);

  // Heroes with poor recent performance (to avoid temporarily)
  const avoid = sorted.filter(hero => 
    hero.mastery.stats.games >= 10 && 
    (hero.mastery.stats.winrate < 40 || hero.mastery.stats.kda < 1.0)
  ).slice(-3); // Take the worst ones

  return {
    practice: practice.map(h => h.name),
    focus: focus.map(h => h.name),
    avoid: avoid.map(h => h.name)
  };
};