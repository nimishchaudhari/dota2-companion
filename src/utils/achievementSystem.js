/**
 * Achievement System Utilities
 * Provides functions for detecting and managing hero-based achievements
 */

import { MASTERY_TIERS } from './masteryCalculations.js';

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS = {
  // Games played achievements
  specialist: {
    id: 'specialist',
    name: 'Hero Specialist',
    description: 'Play 25+ games with a hero',
    emoji: '🎓',
    color: '#1890ff',
    category: 'experience',
    check: (heroStats, _masteryData) => heroStats.games >= 25
  },
  
  expert: {
    id: 'expert',
    name: 'Hero Expert',
    description: 'Play 50+ games with a hero',
    emoji: '🔬',
    color: '#722ed1',
    category: 'experience',
    check: (heroStats, _masteryData) => heroStats.games >= 50
  },
  
  master: {
    id: 'master',
    name: 'Hero Master',
    description: 'Play 100+ games with a hero',
    emoji: '👑',
    color: '#fa8c16',
    category: 'experience',
    check: (heroStats, _masteryData) => heroStats.games >= 100
  },

  // Win rate achievements
  consistent: {
    id: 'consistent',
    name: 'Consistent Performer',
    description: '70%+ win rate with 10+ games',
    emoji: '🎯',
    color: '#52c41a',
    category: 'performance',
    check: (heroStats, _masteryData) => {
      const winrate = heroStats.games > 0 ? (heroStats.win / heroStats.games * 100) : 0;
      return heroStats.games >= 10 && winrate >= 70;
    }
  },
  
  reliable: {
    id: 'reliable',
    name: 'Reliable Hero',
    description: '65%+ win rate with 20+ games',
    emoji: '⚡',
    color: '#00d9ff',
    category: 'performance',
    check: (heroStats, _masteryData) => {
      const winrate = heroStats.games > 0 ? (heroStats.win / heroStats.games * 100) : 0;
      return heroStats.games >= 20 && winrate >= 65;
    }
  },

  // KDA achievements
  clutch: {
    id: 'clutch',
    name: 'Clutch Player',
    description: '3.0+ KDA with 15+ games',
    emoji: '💪',
    color: '#fa541c',
    category: 'skill',
    check: (heroStats, _masteryData) => {
      if (heroStats.games < 15) return false;
      const kda = ((heroStats.sum_kills + heroStats.sum_assists) / Math.max(heroStats.sum_deaths, 1)) / heroStats.games;
      return kda >= 3.0;
    }
  },
  
  dominator: {
    id: 'dominator',
    name: 'Hero Dominator',
    description: '4.0+ KDA with 20+ games',
    emoji: '🔥',
    color: '#f5222d',
    category: 'skill',
    check: (heroStats, _masteryData) => {
      if (heroStats.games < 20) return false;
      const kda = ((heroStats.sum_kills + heroStats.sum_assists) / Math.max(heroStats.sum_deaths, 1)) / heroStats.games;
      return kda >= 4.0;
    }
  },

  // Mastery tier achievements
  bronze_mastery: {
    id: 'bronze_mastery',
    name: 'Bronze Mastery',
    description: 'Achieve Bronze mastery level',
    emoji: '🥉',
    color: '#CD7F32',
    category: 'mastery',
    check: (_heroStats, masteryData) => masteryData.level >= 1
  },
  
  silver_mastery: {
    id: 'silver_mastery',
    name: 'Silver Mastery',
    description: 'Achieve Silver mastery level',
    emoji: '🥈',
    color: '#C0C0C0',
    category: 'mastery',
    check: (_heroStats, masteryData) => masteryData.level >= 2
  },
  
  gold_mastery: {
    id: 'gold_mastery',
    name: 'Gold Mastery',
    description: 'Achieve Gold mastery level',
    emoji: '🥇',
    color: '#FFD700',
    category: 'mastery',
    check: (_heroStats, masteryData) => masteryData.level >= 3
  },
  
  platinum_mastery: {
    id: 'platinum_mastery',
    name: 'Platinum Mastery',
    description: 'Achieve Platinum mastery level',
    emoji: '⭐',
    color: '#E5E4E2',
    category: 'mastery',
    check: (_heroStats, masteryData) => masteryData.level >= 4
  },
  
  diamond_mastery: {
    id: 'diamond_mastery',
    name: 'Diamond Mastery',
    description: 'Achieve Diamond mastery level',
    emoji: '💎',
    color: '#B9F2FF',
    category: 'mastery',
    check: (_heroStats, masteryData) => masteryData.level >= 5
  },

  // Special achievements
  improving: {
    id: 'improving',
    name: 'Rising Star',
    description: '+20% win rate improvement over 20 games',
    emoji: '🌟',
    color: '#fadb14',
    category: 'progress',
    check: (_heroStats, _masteryData, _trends) => {
      // This would require trend data to implement properly
      // For now, we'll use a simpler heuristic
      return false; // Placeholder - would need historical data
    }
  },
  
  comeback_king: {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Turn around a losing streak',
    emoji: '👑',
    color: '#eb2f96',
    category: 'mentality',
    check: (_heroStats, _masteryData, _trends) => {
      // Would need streak history to implement
      return false; // Placeholder
    }
  },

  // Farm achievements
  farmer: {
    id: 'farmer',
    name: 'Efficient Farmer',
    description: '60+ last hits per game average (15+ games)',
    emoji: '🌾',
    color: '#52c41a',
    category: 'farming',
    check: (heroStats, _masteryData) => {
      if (heroStats.games < 15) return false;
      const avgLastHits = heroStats.sum_last_hits / heroStats.games;
      return avgLastHits >= 60;
    }
  },
  
  // GPM achievements
  economist: {
    id: 'economist',
    name: 'Gold Economist',
    description: '500+ GPM average (15+ games)',
    emoji: '💰',
    color: '#fadb14',
    category: 'economy',
    check: (heroStats, _masteryData) => {
      if (heroStats.games < 15) return false;
      const avgGpm = heroStats.sum_gold_per_min / heroStats.games;
      return avgGpm >= 500;
    }
  }
};

/**
 * Check which achievements a hero has earned
 * @param {Object} heroStats - Hero statistics from OpenDota
 * @param {Object} masteryData - Calculated mastery data
 * @param {Object} trends - Optional trend data
 * @returns {Array} Array of earned achievements
 */
export const checkHeroAchievements = (heroStats, masteryData, trends = null) => {
  if (!heroStats || !masteryData) {
    return [];
  }

  const earnedAchievements = [];
  
  Object.values(ACHIEVEMENT_DEFINITIONS).forEach(achievement => {
    try {
      if (achievement.check(heroStats, masteryData, trends)) {
        earnedAchievements.push({
          ...achievement,
          heroId: heroStats.hero_id,
          earnedAt: new Date().toISOString() // In a real app, this would come from persistent storage
        });
      }
    } catch (error) {
      console.warn(`Error checking achievement ${achievement.id}:`, error);
    }
  });

  return earnedAchievements;
};

/**
 * Get achievements sorted by category
 * @param {Array} achievements - Array of earned achievements
 * @returns {Object} Achievements grouped by category
 */
export const groupAchievementsByCategory = (achievements) => {
  const grouped = {
    mastery: [],
    performance: [],
    skill: [],
    experience: [],
    farming: [],
    economy: [],
    progress: [],
    mentality: []
  };

  achievements.forEach(achievement => {
    const category = achievement.category || 'experience';
    if (grouped[category]) {
      grouped[category].push(achievement);
    }
  });

  return grouped;
};

/**
 * Get the most recent achievements (for notifications)
 * @param {Array} allHeroesAchievements - All achievements across heroes
 * @param {number} limit - Number of recent achievements to return
 * @returns {Array} Most recent achievements
 */
export const getRecentAchievements = (allHeroesAchievements, limit = 5) => {
  if (!allHeroesAchievements || !Array.isArray(allHeroesAchievements)) {
    return [];
  }

  return allHeroesAchievements
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
    .slice(0, limit);
};

/**
 * Calculate achievement completion percentage for a hero
 * @param {Array} earnedAchievements - Achievements earned by this hero
 * @returns {Object} Completion statistics
 */
export const calculateAchievementCompletion = (earnedAchievements) => {
  const totalAchievements = Object.keys(ACHIEVEMENT_DEFINITIONS).length;
  const earnedCount = earnedAchievements.length;
  const completionPercentage = totalAchievements > 0 ? (earnedCount / totalAchievements) * 100 : 0;

  // Group by category for detailed breakdown
  const byCategory = groupAchievementsByCategory(earnedAchievements);
  const categoryStats = {};

  Object.keys(byCategory).forEach(category => {
    const categoryTotal = Object.values(ACHIEVEMENT_DEFINITIONS)
      .filter(ach => ach.category === category).length;
    const categoryEarned = byCategory[category].length;
    
    categoryStats[category] = {
      earned: categoryEarned,
      total: categoryTotal,
      percentage: categoryTotal > 0 ? (categoryEarned / categoryTotal) * 100 : 0
    };
  });

  return {
    earned: earnedCount,
    total: totalAchievements,
    percentage: Math.round(completionPercentage),
    byCategory: categoryStats
  };
};

/**
 * Get next achievable achievements for a hero
 * @param {Object} heroStats - Hero statistics
 * @param {Object} masteryData - Mastery data
 * @param {Array} earnedAchievements - Already earned achievements
 * @returns {Array} Next achievements that can be earned
 */
export const getNextAchievements = (heroStats, masteryData, earnedAchievements) => {
  const earnedIds = new Set(earnedAchievements.map(ach => ach.id));
  const availableAchievements = [];

  Object.values(ACHIEVEMENT_DEFINITIONS).forEach(achievement => {
    if (!earnedIds.has(achievement.id)) {
      // Calculate how close the hero is to earning this achievement
      let progress = 0;
      let requirement = '';

      switch (achievement.id) {
        case 'specialist':
          progress = Math.min(100, (heroStats.games / 25) * 100);
          requirement = `${Math.max(0, 25 - heroStats.games)} more games`;
          break;
        case 'expert':
          progress = Math.min(100, (heroStats.games / 50) * 100);
          requirement = `${Math.max(0, 50 - heroStats.games)} more games`;
          break;
        case 'master':
          progress = Math.min(100, (heroStats.games / 100) * 100);
          requirement = `${Math.max(0, 100 - heroStats.games)} more games`;
          break;
        case 'consistent':
          if (heroStats.games >= 10) {
            const winrate = (heroStats.win / heroStats.games * 100);
            progress = Math.min(100, (winrate / 70) * 100);
            requirement = winrate >= 70 ? 'Ready!' : `${(70 - winrate).toFixed(1)}% WR needed`;
          } else {
            requirement = `${10 - heroStats.games} more games + 70% WR`;
          }
          break;
        // Add more cases as needed
      }

      if (progress > 50) { // Only show achievements that are > 50% complete
        availableAchievements.push({
          ...achievement,
          progress: Math.round(progress),
          requirement
        });
      }
    }
  });

  // Sort by progress (closest to completion first)
  return availableAchievements.sort((a, b) => b.progress - a.progress);
};

/**
 * Get achievement rarity information
 * @param {string} achievementId - Achievement ID
 * @returns {Object} Rarity information
 */
export const getAchievementRarity = (achievementId) => {
  // This would typically be calculated from actual player data
  // For now, we'll provide estimated rarities
  const rarities = {
    specialist: { rarity: 'common', percentage: 45 },
    expert: { rarity: 'uncommon', percentage: 20 },
    master: { rarity: 'rare', percentage: 8 },
    consistent: { rarity: 'uncommon', percentage: 25 },
    reliable: { rarity: 'rare', percentage: 12 },
    clutch: { rarity: 'rare', percentage: 15 },
    dominator: { rarity: 'epic', percentage: 5 },
    bronze_mastery: { rarity: 'common', percentage: 60 },
    silver_mastery: { rarity: 'uncommon', percentage: 35 },
    gold_mastery: { rarity: 'rare', percentage: 20 },
    platinum_mastery: { rarity: 'epic', percentage: 10 },
    diamond_mastery: { rarity: 'legendary', percentage: 3 },
    farmer: { rarity: 'uncommon', percentage: 30 },
    economist: { rarity: 'rare', percentage: 18 }
  };

  return rarities[achievementId] || { rarity: 'unknown', percentage: 0 };
};