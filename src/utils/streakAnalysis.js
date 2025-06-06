/**
 * Streak Analysis Utilities
 * Provides functions for analyzing winning/losing streaks and momentum patterns
 */

import { isWin } from './dataTransforms.js';

/**
 * Analyze recent match streaks for a specific hero
 * @param {Array} recentMatches - Recent matches from OpenDota API
 * @param {number} heroId - Hero ID to analyze
 * @param {number} lookbackGames - Number of recent games to analyze (default: 10)
 * @returns {Object} Streak analysis data
 */
export const analyzeHeroStreak = (recentMatches, heroId, lookbackGames = 10) => {
  if (!recentMatches || !Array.isArray(recentMatches)) {
    return {
      currentStreak: 0,
      streakType: 'none',
      recentForm: 'unknown',
      winLossRecord: { wins: 0, losses: 0 },
      momentum: 'neutral'
    };
  }

  // Filter matches for this hero and get recent games
  const heroMatches = recentMatches
    .filter(match => match.hero_id === heroId)
    .slice(0, lookbackGames)
    .sort((a, b) => b.start_time - a.start_time); // Most recent first

  if (heroMatches.length === 0) {
    return {
      currentStreak: 0,
      streakType: 'none',
      recentForm: 'no_data',
      winLossRecord: { wins: 0, losses: 0 },
      momentum: 'neutral'
    };
  }

  // Calculate current streak
  let currentStreak = 0;
  let streakType = 'none';
  
  if (heroMatches.length > 0) {
    const mostRecentWin = isWin(heroMatches[0]);
    streakType = mostRecentWin ? 'win' : 'loss';
    
    for (const match of heroMatches) {
      const matchWin = isWin(match);
      if (matchWin === mostRecentWin) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate recent form (W/L record)
  const wins = heroMatches.filter(match => isWin(match)).length;
  const losses = heroMatches.length - wins;
  const winRate = heroMatches.length > 0 ? (wins / heroMatches.length) * 100 : 0;

  // Determine recent form status
  let recentForm = 'average';
  if (winRate >= 70) recentForm = 'excellent';
  else if (winRate >= 60) recentForm = 'good';
  else if (winRate >= 40) recentForm = 'average';
  else if (winRate >= 30) recentForm = 'poor';
  else recentForm = 'terrible';

  // Calculate momentum based on recent trend
  let momentum = 'neutral';
  if (heroMatches.length >= 4) {
    const recentHalf = heroMatches.slice(0, Math.floor(heroMatches.length / 2));
    const olderHalf = heroMatches.slice(Math.floor(heroMatches.length / 2));
    
    const recentWinRate = recentHalf.filter(m => isWin(m)).length / recentHalf.length;
    const olderWinRate = olderHalf.filter(m => isWin(m)).length / olderHalf.length;
    
    if (recentWinRate > olderWinRate + 0.2) momentum = 'improving';
    else if (recentWinRate < olderWinRate - 0.2) momentum = 'declining';
  }

  return {
    currentStreak,
    streakType,
    recentForm,
    winLossRecord: { wins, losses },
    momentum,
    winRate: Math.round(winRate),
    gamesAnalyzed: heroMatches.length
  };
};

/**
 * Find heroes currently on hot streaks
 * @param {Array} recentMatches - Recent matches
 * @param {Array} heroStats - Hero statistics
 * @param {number} minStreak - Minimum streak length to consider "hot" (default: 3)
 * @returns {Array} Heroes on hot streaks
 */
export const findHotStreakHeroes = (recentMatches, heroStats, minStreak = 3) => {
  if (!heroStats || !Array.isArray(heroStats)) {
    return [];
  }

  const hotHeroes = [];

  heroStats.forEach(hero => {
    const streakData = analyzeHeroStreak(recentMatches, hero.hero_id);
    
    if (streakData.streakType === 'win' && streakData.currentStreak >= minStreak) {
      hotHeroes.push({
        heroId: hero.hero_id,
        heroName: hero.name || `Hero ${hero.hero_id}`,
        streak: streakData.currentStreak,
        recentForm: streakData.recentForm,
        winRate: streakData.winRate,
        momentum: streakData.momentum
      });
    }
  });

  // Sort by streak length (longest first)
  return hotHeroes.sort((a, b) => b.streak - a.streak);
};

/**
 * Find heroes currently on cold spells
 * @param {Array} recentMatches - Recent matches
 * @param {Array} heroStats - Hero statistics
 * @param {number} minStreak - Minimum loss streak to consider "cold" (default: 3)
 * @returns {Array} Heroes on cold spells
 */
export const findColdSpellHeroes = (recentMatches, heroStats, minStreak = 3) => {
  if (!heroStats || !Array.isArray(heroStats)) {
    return [];
  }

  const coldHeroes = [];

  heroStats.forEach(hero => {
    const streakData = analyzeHeroStreak(recentMatches, hero.hero_id);
    
    if (streakData.streakType === 'loss' && streakData.currentStreak >= minStreak) {
      coldHeroes.push({
        heroId: hero.hero_id,
        heroName: hero.name || `Hero ${hero.hero_id}`,
        streak: streakData.currentStreak,
        recentForm: streakData.recentForm,
        winRate: streakData.winRate,
        momentum: streakData.momentum
      });
    }
  });

  // Sort by streak length (longest first)
  return coldHeroes.sort((a, b) => b.streak - a.streak);
};

/**
 * Get overall momentum indicators for dashboard header
 * @param {Array} recentMatches - Recent matches
 * @param {Array} heroStats - Hero statistics
 * @returns {Object} Overall momentum status
 */
export const getOverallMomentum = (recentMatches, heroStats) => {
  const hotHeroes = findHotStreakHeroes(recentMatches, heroStats);
  const coldHeroes = findColdSpellHeroes(recentMatches, heroStats);
  
  // Get the best performing hero
  const topHotHero = hotHeroes.length > 0 ? hotHeroes[0] : null;
  
  // Get the worst performing hero
  const topColdHero = coldHeroes.length > 0 ? coldHeroes[0] : null;

  return {
    hotStreak: topHotHero,
    coldSpell: topColdHero,
    totalHotHeroes: hotHeroes.length,
    totalColdHeroes: coldHeroes.length,
    momentum: hotHeroes.length > coldHeroes.length ? 'positive' : 
              coldHeroes.length > hotHeroes.length ? 'negative' : 'neutral'
  };
};

/**
 * Analyze performance trends over time for a hero
 * @param {Array} recentMatches - Recent matches
 * @param {number} heroId - Hero ID
 * @param {number} windowSize - Size of moving window for trend analysis
 * @returns {Object} Trend analysis
 */
export const analyzeTrend = (recentMatches, heroId, windowSize = 5) => {
  if (!recentMatches || !Array.isArray(recentMatches)) {
    return {
      trend: 'stable',
      direction: 'none',
      strength: 0,
      confidence: 'low'
    };
  }

  const heroMatches = recentMatches
    .filter(match => match.hero_id === heroId)
    .slice(0, windowSize * 2) // Get enough data for comparison
    .sort((a, b) => b.start_time - a.start_time);

  if (heroMatches.length < windowSize) {
    return {
      trend: 'insufficient_data',
      direction: 'none',
      strength: 0,
      confidence: 'low'
    };
  }

  // Compare recent window vs older window
  const recentWindow = heroMatches.slice(0, windowSize);
  const olderWindow = heroMatches.slice(windowSize, windowSize * 2);

  if (olderWindow.length < windowSize) {
    return {
      trend: 'stable',
      direction: 'none',
      strength: 0,
      confidence: 'low'
    };
  }

  const recentWinRate = recentWindow.filter(m => isWin(m)).length / recentWindow.length;
  const olderWinRate = olderWindow.filter(m => isWin(m)).length / olderWindow.length;

  const difference = recentWinRate - olderWinRate;
  const absDifference = Math.abs(difference);

  let trend = 'stable';
  let direction = 'none';
  let strength = 0;
  let confidence = 'medium';

  if (absDifference >= 0.4) {
    strength = 3; // Strong trend
    confidence = 'high';
  } else if (absDifference >= 0.2) {
    strength = 2; // Moderate trend
    confidence = 'medium';
  } else if (absDifference >= 0.1) {
    strength = 1; // Weak trend
    confidence = 'low';
  }

  if (difference > 0.1) {
    trend = 'improving';
    direction = 'up';
  } else if (difference < -0.1) {
    trend = 'declining';
    direction = 'down';
  }

  return {
    trend,
    direction,
    strength,
    confidence,
    recentWinRate: Math.round(recentWinRate * 100),
    olderWinRate: Math.round(olderWinRate * 100),
    improvement: Math.round(difference * 100)
  };
};

/**
 * Get streak display information for UI
 * @param {Object} streakData - Streak analysis data
 * @returns {Object} Display information
 */
export const getStreakDisplay = (streakData) => {
  if (!streakData || streakData.streakType === 'none') {
    return {
      text: 'No streak',
      emoji: '➖',
      color: '#666666',
      bgColor: 'rgba(102, 102, 102, 0.1)'
    };
  }

  const { currentStreak, streakType } = streakData;
  
  if (streakType === 'win') {
    return {
      text: `${currentStreak}W`,
      emoji: '🔥',
      color: '#52c41a',
      bgColor: 'rgba(82, 196, 26, 0.1)',
      description: `${currentStreak} game win streak`
    };
  } else {
    return {
      text: `${currentStreak}L`,
      emoji: '🧊',
      color: '#1890ff',
      bgColor: 'rgba(24, 144, 255, 0.1)',
      description: `${currentStreak} game loss streak`
    };
  }
};

/**
 * Get momentum display information for UI
 * @param {string} momentum - Momentum status
 * @returns {Object} Display information
 */
export const getMomentumDisplay = (momentum) => {
  const displays = {
    improving: {
      text: 'Improving',
      emoji: '📈',
      color: '#52c41a',
      bgColor: 'rgba(82, 196, 26, 0.1)'
    },
    declining: {
      text: 'Declining',
      emoji: '📉',
      color: '#ff4d4f',
      bgColor: 'rgba(255, 77, 79, 0.1)'
    },
    neutral: {
      text: 'Stable',
      emoji: '➖',
      color: '#fadb14',
      bgColor: 'rgba(250, 219, 20, 0.1)'
    }
  };

  return displays[momentum] || displays.neutral;
};