// Core match analysis service for processing OpenDota data
import opendotaAPI from './opendotaAPI.js';
import { analyzeVision, analyzeCombat, analyzeEconomy, analyzeLaningPhase } from '../utils/performanceCalculations.js';
import { detectPlayerRole } from '../utils/roleDetection.js';
import { calculateBenchmarkComparison } from '../utils/benchmarkComparisons.js';
import { generateInsights } from '../utils/insightGeneration.js';

class MatchAnalysisService {
  constructor() {
    this.analysisCache = new Map();
    this.cacheTTL = 600000; // 10 minutes for analysis results
  }

  // Main analysis pipeline
  async analyzeMatch(matchId, playerAccountId) {
    const cacheKey = `analysis_${matchId}_${playerAccountId}`;
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) return cached;

    try {
      console.log(`[ANALYSIS] Starting comprehensive analysis for match ${matchId}`);
      
      // Fetch all required data
      const data = await opendotaAPI.fetchMatchAnalysisData(matchId, playerAccountId);
      
      if (!data.match) {
        throw new Error('Match data not found');
      }

      // Find player data
      const playerData = this.findPlayerInMatch(data.match, playerAccountId);
      if (!playerData) {
        throw new Error('Player not found in match');
      }

      // Core analysis
      const analysis = await this.performComprehensiveAnalysis(data, playerData);
      
      // Cache results
      this.setCachedAnalysis(cacheKey, analysis);
      
      console.log(`[ANALYSIS] Analysis completed for match ${matchId}`);
      return analysis;

    } catch (error) {
      console.error(`[ANALYSIS] Failed to analyze match ${matchId}:`, error);
      throw error;
    }
  }

  // Find player data in match
  findPlayerInMatch(matchData, accountId) {
    if (!matchData.players || !accountId) return null;
    return matchData.players.find(p => p.account_id === parseInt(accountId));
  }

  // Comprehensive analysis pipeline
  async performComprehensiveAnalysis(data, playerData) {
    const { match, logs, heroStats, distributions, playerHeroes, playerRatings } = data;
    
    // Role detection
    const role = detectPlayerRole(playerData, match);
    
    // Get benchmarks for this hero
    let benchmarks = null;
    if (playerData.hero_id) {
      try {
        benchmarks = await opendotaAPI.fetchBenchmarks(playerData.hero_id);
      } catch (error) {
        console.warn('[ANALYSIS] Benchmarks not available:', error);
      }
    }

    // Perform detailed analysis
    const [
      overviewAnalysis,
      performanceAnalysis,
      laningAnalysis,
      economyAnalysis,
      combatAnalysis,
      visionAnalysis,
      insightsAnalysis
    ] = await Promise.all([
      this.analyzeOverview(match, playerData, role),
      this.analyzePerformance(playerData, role, benchmarks, heroStats),
      this.analyzeLaning(playerData, match, logs),
      this.analyzeEconomy(playerData, match, logs),
      this.analyzeCombat(playerData, match, logs),
      this.analyzeVision(playerData, match, logs),
      this.generateInsights(playerData, match, role, benchmarks)
    ]);

    return {
      matchId: match.match_id,
      playerId: playerData.account_id,
      role,
      isParsed: !!match.version,
      analysis: {
        overview: overviewAnalysis,
        performance: performanceAnalysis,
        laning: laningAnalysis,
        economy: economyAnalysis,
        combat: combatAnalysis,
        vision: visionAnalysis,
        insights: insightsAnalysis
      },
      metadata: {
        analyzedAt: new Date(),
        dataQuality: this.assessDataQuality(match, logs),
        benchmarksAvailable: !!benchmarks
      }
    };
  }

  // Overview analysis
  async analyzeOverview(match, playerData, role) {
    const teamData = this.getTeamData(match);
    const objectives = this.extractObjectives(match);
    
    return {
      matchResult: {
        won: this.didPlayerWin(playerData, match),
        duration: match.duration,
        gameMode: match.game_mode,
        avgRank: match.avg_rank_tier,
        radiantWin: match.radiant_win
      },
      draftAnalysis: await this.analyzeDraft(match),
      objectives,
      teamComposition: {
        radiant: teamData.radiant,
        dire: teamData.dire,
        playerTeam: playerData.player_slot < 128 ? 'radiant' : 'dire'
      },
      playerSummary: {
        role,
        kda: `${playerData.kills}/${playerData.deaths}/${playerData.assists}`,
        gpm: playerData.gold_per_min,
        xpm: playerData.xp_per_min,
        netWorth: playerData.net_worth,
        heroDamage: playerData.hero_damage,
        grade: this.calculateOverallGrade(playerData, role)
      }
    };
  }

  // Performance analysis
  async analyzePerformance(playerData, role, benchmarks, heroStats) {
    const metrics = this.getRoleSpecificMetrics(role);
    const scores = {};
    
    for (const [metric, config] of Object.entries(metrics)) {
      scores[metric] = await calculateBenchmarkComparison(
        playerData[config.field] || 0,
        benchmarks,
        config.field,
        config.weight
      );
    }

    const overallScore = this.calculateWeightedScore(scores, metrics);
    
    return {
      role,
      overallScore,
      grade: this.scoreToGrade(overallScore),
      metrics: scores,
      efficiency: {
        farmPriority: this.calculateFarmPriority(playerData),
        movementEfficiency: this.calculateMovementEfficiency(playerData),
        abilityUsage: this.calculateAbilityEfficiency(playerData)
      },
      combat: {
        killParticipation: this.calculateKillParticipation(playerData),
        teamfightContribution: this.calculateTeamfightContribution(playerData),
        positioning: this.calculatePositioning(playerData)
      }
    };
  }

  // Laning phase analysis
  async analyzeLaning(playerData, match, logs) {
    return analyzeLaningPhase(playerData, match, logs);
  }

  // Economy analysis
  async analyzeEconomy(playerData, match, logs) {
    return analyzeEconomy(playerData, match, logs);
  }

  // Combat analysis
  async analyzeCombat(playerData, match, logs) {
    return analyzeCombat(playerData, match, logs);
  }

  // Vision analysis
  async analyzeVision(playerData, match, logs) {
    return analyzeVision(playerData, match, logs);
  }

  // AI insights generation
  async generateInsights(playerData, match, role, benchmarks) {
    return generateInsights(playerData, match, role, benchmarks);
  }

  // Helper methods
  didPlayerWin(playerData, match) {
    const isRadiant = playerData.player_slot < 128;
    return match.radiant_win === isRadiant;
  }

  getTeamData(match) {
    const radiant = match.players.filter(p => p.player_slot < 128);
    const dire = match.players.filter(p => p.player_slot >= 128);
    return { radiant, dire };
  }

  extractObjectives(match) {
    const objectives = [];
    
    // Tower kills
    if (match.objectives) {
      match.objectives.forEach(obj => {
        if (obj.type === 'building_kill' && obj.subtype === 'tower') {
          objectives.push({
            type: 'tower',
            time: obj.time,
            team: obj.team === 2 ? 'radiant' : 'dire',
            key: obj.key
          });
        }
      });
    }
    
    // Roshan kills
    if (match.chat) {
      match.chat.forEach(chat => {
        if (chat.type === 'aegis') {
          objectives.push({
            type: 'roshan',
            time: chat.time,
            player: chat.player_slot
          });
        }
      });
    }
    
    return objectives.sort((a, b) => a.time - b.time);
  }

  async analyzeDraft(match) {
    const heroStats = await opendotaAPI.fetchHeroStats();
    const heroMap = heroStats.reduce((map, hero) => {
      map[hero.id] = hero;
      return map;
    }, {});

    const radiantHeroes = match.players.filter(p => p.player_slot < 128).map(p => ({
      heroId: p.hero_id,
      winRate: heroMap[p.hero_id]?.win_rate || 0,
      pickRate: heroMap[p.hero_id]?.pick_rate || 0
    }));

    const direHeroes = match.players.filter(p => p.player_slot >= 128).map(p => ({
      heroId: p.hero_id,
      winRate: heroMap[p.hero_id]?.win_rate || 0,
      pickRate: heroMap[p.hero_id]?.pick_rate || 0
    }));

    return {
      radiant: radiantHeroes,
      dire: direHeroes,
      draftAdvantage: this.calculateDraftAdvantage(radiantHeroes, direHeroes)
    };
  }

  calculateDraftAdvantage(radiantHeroes, direHeroes) {
    const radiantWinRate = radiantHeroes.reduce((sum, h) => sum + h.winRate, 0) / radiantHeroes.length;
    const direWinRate = direHeroes.reduce((sum, h) => sum + h.winRate, 0) / direHeroes.length;
    
    return {
      radiant: radiantWinRate,
      dire: direWinRate,
      advantage: radiantWinRate > direWinRate ? 'radiant' : 'dire',
      difference: Math.abs(radiantWinRate - direWinRate)
    };
  }

  getRoleSpecificMetrics(role) {
    const baseMetrics = {
      'Carry': {
        'CS Efficiency': { field: 'last_hits', weight: 0.4 },
        'Farm Speed': { field: 'gold_per_min', weight: 0.3 },
        'Late Game Impact': { field: 'hero_damage', weight: 0.2 },
        'Death Avoidance': { field: 'deaths', weight: 0.1, inverse: true }
      },
      'Mid': {
        'CS Efficiency': { field: 'last_hits', weight: 0.3 },
        'Experience Gain': { field: 'xp_per_min', weight: 0.3 },
        'Hero Damage': { field: 'hero_damage', weight: 0.25 },
        'Map Impact': { field: 'kills', weight: 0.15 }
      },
      'Offlane': {
        'Survivability': { field: 'deaths', weight: 0.3, inverse: true },
        'Initiation': { field: 'assists', weight: 0.25 },
        'Space Creation': { field: 'tower_damage', weight: 0.25 },
        'Farm Efficiency': { field: 'gold_per_min', weight: 0.2 }
      },
      'Support': {
        'Ward Efficiency': { field: 'obs_placed', weight: 0.35 },
        'Save Plays': { field: 'hero_healing', weight: 0.25 },
        'Space Creation': { field: 'assists', weight: 0.25 },
        'Gold Efficiency': { field: 'gold_per_min', weight: 0.15 }
      },
      'Hard Support': {
        'Vision Control': { field: 'obs_placed', weight: 0.4 },
        'Team Support': { field: 'assists', weight: 0.3 },
        'Survivability': { field: 'deaths', weight: 0.2, inverse: true },
        'Impact': { field: 'hero_healing', weight: 0.1 }
      }
    };

    return baseMetrics[role] || baseMetrics['Support'];
  }

  calculateWeightedScore(scores, metrics) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, config] of Object.entries(metrics)) {
      if (scores[metric]) {
        totalScore += scores[metric].percentile * config.weight;
        totalWeight += config.weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  scoreToGrade(score) {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  calculateOverallGrade(playerData, role) {
    // Simple grade calculation based on KDA and role performance
    const kda = ((playerData.kills || 0) + (playerData.assists || 0)) / Math.max((playerData.deaths || 1), 1);
    
    if (kda >= 4) return 'S';
    if (kda >= 2.5) return 'A';
    if (kda >= 1.5) return 'B';
    if (kda >= 0.8) return 'C';
    return 'D';
  }

  // Performance calculation helpers
  calculateFarmPriority(playerData) {
    return Math.min(100, Math.round((playerData.gold_per_min || 0) / 8));
  }

  calculateMovementEfficiency(playerData) {
    // Simplified calculation based on available data
    return Math.min(100, Math.round(((playerData.kills || 0) + (playerData.assists || 0)) * 10));
  }

  calculateAbilityEfficiency(playerData) {
    return Math.min(100, Math.round((playerData.hero_damage || 0) / 1000));
  }

  calculateKillParticipation(playerData) {
    // This would need team kill data to be accurate
    return Math.min(100, Math.round(((playerData.kills || 0) + (playerData.assists || 0)) * 5));
  }

  calculateTeamfightContribution(playerData) {
    return Math.min(100, Math.round((playerData.teamfight_participation || 0) * 100));
  }

  calculatePositioning(playerData) {
    // Inverse relationship with deaths
    const deaths = playerData.deaths || 0;
    return Math.max(0, 100 - (deaths * 15));
  }

  assessDataQuality(match, logs) {
    let quality = 0;
    
    if (match.version) quality += 40; // Parsed match
    if (logs) quality += 30; // Has detailed logs
    if (match.chat) quality += 15; // Has chat data
    if (match.objectives) quality += 15; // Has objectives
    
    return {
      score: quality,
      isParsed: !!match.version,
      hasLogs: !!logs,
      hasChat: !!match.chat,
      hasObjectives: !!match.objectives
    };
  }

  // Cache management
  setCachedAnalysis(key, analysis) {
    this.analysisCache.set(key, {
      data: analysis,
      timestamp: Date.now()
    });
  }

  getCachedAnalysis(key) {
    const item = this.analysisCache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTTL) {
      this.analysisCache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clearCache() {
    this.analysisCache.clear();
  }
}

export default new MatchAnalysisService();