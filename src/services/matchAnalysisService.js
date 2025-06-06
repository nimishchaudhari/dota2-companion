/**
 * Match Analysis Service
 * Complete analysis pipeline with role detection, benchmarking, and comprehensive match processing
 */

import openDotaAPI from './opendotaAPI.js';
import { detectPlayerRole, getRoleMetrics } from '../utils/roleDetection.js';
import { 
  calculatePerformanceGrade, 
  analyzeLaningPhase, 
  analyzeEconomy, 
  analyzeCombat, 
  analyzeVision 
} from '../utils/performanceCalculations.js';

class MatchAnalysisService {
  constructor() {
    this.cache = new Map();
    this.processingQueue = new Map();
  }

  /**
   * Get comprehensive match analysis
   */
  async getMatchAnalysis(matchId, accountId) {
    const cacheKey = `${matchId}-${accountId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`[Match Analysis] Returning cached analysis for ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    // Check if already processing
    if (this.processingQueue.has(cacheKey)) {
      console.log(`[Match Analysis] Waiting for ongoing analysis ${cacheKey}`);
      return this.processingQueue.get(cacheKey);
    }

    // Start new analysis
    const analysisPromise = this._performAnalysis(matchId, accountId);
    this.processingQueue.set(cacheKey, analysisPromise);

    try {
      const result = await analysisPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.processingQueue.delete(cacheKey);
    }
  }

  /**
   * Perform comprehensive match analysis
   */
  async _performAnalysis(matchId, accountId) {
    console.log(`[Match Analysis] Starting comprehensive analysis for match ${matchId}, player ${accountId}`);
    
    try {
      // Get all required data
      const data = await openDotaAPI.getMatchAnalysisData(matchId, accountId);
      
      if (!data.match || !data.userPlayer) {
        throw new Error('Required match or player data not available');
      }

      // Detect player role
      const roleAnalysis = detectPlayerRole(data.userPlayer, data.match);
      console.log(`[Match Analysis] Detected role: ${roleAnalysis.role} (${roleAnalysis.confidence}% confidence)`);

      // Calculate performance metrics
      const performanceGrade = calculatePerformanceGrade(
        data.userPlayer, 
        data.benchmarks, 
        roleAnalysis.role
      );

      // Analyze different game phases
      const laningAnalysis = analyzeLaningPhase(data.userPlayer);
      const economyAnalysis = analyzeEconomy(data.userPlayer, data.match);
      const combatAnalysis = analyzeCombat(data.userPlayer, data.match);
      const visionAnalysis = analyzeVision(data.userPlayer, data.match);

      // Generate insights and coaching points
      const insights = this._generateInsights(data, roleAnalysis, {
        performance: performanceGrade,
        laning: laningAnalysis,
        economy: economyAnalysis,
        combat: combatAnalysis,
        vision: visionAnalysis
      });

      // Calculate overall match score
      const overallScore = this._calculateOverallScore({
        performance: performanceGrade,
        laning: laningAnalysis,
        economy: economyAnalysis,
        combat: combatAnalysis,
        vision: visionAnalysis
      });

      const analysisResult = {
        matchId,
        accountId,
        timestamp: Date.now(),
        
        // Core data
        match: data.match,
        player: data.userPlayer,
        role: roleAnalysis,
        
        // Performance analysis
        performance: performanceGrade,
        overallScore,
        
        // Phase analysis
        laning: laningAnalysis,
        economy: economyAnalysis,
        combat: combatAnalysis,
        vision: visionAnalysis,
        
        // Insights and recommendations
        insights,
        
        // Additional data
        benchmarks: data.benchmarks,
        heroStats: data.heroStats,
        warnings: data.warnings || []
      };

      console.log(`[Match Analysis] Analysis completed:`, {
        matchId,
        role: roleAnalysis.role,
        grade: performanceGrade.grade,
        overallScore: overallScore.score,
        insights: insights.coachingPoints.length
      });

      return analysisResult;
      
    } catch (error) {
      console.error(`[Match Analysis] Analysis failed for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Generate AI coaching insights
   */
  _generateInsights(data, roleAnalysis, analyses) {
    const insights = {
      criticalMistakes: [],
      strengths: [],
      coachingPoints: [],
      improvementScore: 0
    };

    // Analyze critical mistakes
    insights.criticalMistakes = this._identifyMistakes(data.userPlayer, roleAnalysis.role, analyses);
    
    // Identify strengths
    insights.strengths = this._identifyStrengths(data.userPlayer, roleAnalysis.role, analyses);
    
    // Generate coaching points
    insights.coachingPoints = this._generateCoachingPoints(data.userPlayer, roleAnalysis.role, analyses);
    
    // Calculate improvement score
    insights.improvementScore = this._calculateImprovementScore(analyses);

    return insights;
  }

  /**
   * Identify critical mistakes
   */
  _identifyMistakes(playerData, role, analyses) {
    const mistakes = [];

    // High death count
    if (playerData.deaths > 8) {
      mistakes.push({
        type: 'critical',
        title: 'High Death Count',
        description: `${playerData.deaths} deaths indicates positioning and decision-making issues`,
        improvement: 'Focus on map awareness, positioning, and avoid risky plays without proper backup',
        impact: 'High MMR Loss Risk',
        priority: 'high'
      });
    }

    // Poor laning phase
    if (analyses.laning.score < 40) {
      mistakes.push({
        type: 'critical',
        title: 'Poor Laning Performance',
        description: `Laning phase score of ${analyses.laning.score} is well below average`,
        improvement: 'Practice last-hitting, creep equilibrium management, and laning fundamentals',
        impact: 'Sets team behind early',
        priority: 'high'
      });
    }

    // Low farm efficiency for cores
    if (['Carry', 'Mid'].includes(role) && (playerData.gold_per_min || 0) < 400) {
      mistakes.push({
        type: 'major',
        title: 'Low Farm Efficiency',
        description: `${playerData.gold_per_min} GPM is too low for a ${role}`,
        improvement: 'Optimize farming patterns, use time efficiently between fights',
        impact: 'Reduced late-game impact',
        priority: 'high'
      });
    }

    // Poor vision for supports
    if (['Support', 'Hard Support'].includes(role) && (playerData.obs_placed || 0) < 10) {
      mistakes.push({
        type: 'major',
        title: 'Insufficient Warding',
        description: `Only ${playerData.obs_placed || 0} observer wards placed`,
        improvement: 'Maintain consistent ward coverage, prioritize key areas',
        impact: 'Team lacks vision advantage',
        priority: 'medium'
      });
    }

    // Low damage output
    if ((playerData.hero_damage || 0) < 15000) {
      mistakes.push({
        type: 'minor',
        title: 'Low Damage Output',
        description: `${playerData.hero_damage || 0} hero damage is below expected threshold`,
        improvement: 'Focus on positioning to deal more damage safely in teamfights',
        impact: 'Reduced teamfight effectiveness',
        priority: 'medium'
      });
    }

    return mistakes.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Identify player strengths
   */
  _identifyStrengths(playerData, role, analyses) {
    const strengths = [];

    // Good KDA
    const kda = playerData.deaths > 0 ? 
      ((playerData.kills || 0) + (playerData.assists || 0)) / playerData.deaths : 10;
    
    if (kda >= 3) {
      strengths.push({
        title: 'Excellent KDA',
        description: `Strong ${kda.toFixed(1)} KDA shows good decision-making`,
        impact: 'Consistent performance contributor'
      });
    }

    // High performance grade
    if (analyses.performance.score >= 80) {
      strengths.push({
        title: 'Strong Overall Performance',
        description: `${analyses.performance.grade} grade performance across key metrics`,
        impact: 'Reliable team member'
      });
    }

    // Good laning
    if (analyses.laning.score >= 75) {
      strengths.push({
        title: 'Solid Laning Phase',
        description: `${analyses.laning.outcome} laning with ${analyses.laning.score} score`,
        impact: 'Early game advantage'
      });
    }

    // Excellent vision (for supports)
    if (['Support', 'Hard Support'].includes(role) && analyses.vision.score >= 80) {
      strengths.push({
        title: 'Excellent Vision Control',
        description: `${analyses.vision.grade} grade vision management`,
        impact: 'Strong team support'
      });
    }

    // High farm efficiency (for cores)
    if (['Carry', 'Mid', 'Offlane'].includes(role) && (playerData.gold_per_min || 0) >= 550) {
      strengths.push({
        title: 'Efficient Farming',
        description: `${playerData.gold_per_min} GPM shows excellent farm efficiency`,
        impact: 'Strong economic advantage'
      });
    }

    return strengths;
  }

  /**
   * Generate specific coaching points
   */
  _generateCoachingPoints(playerData, role, analyses) {
    const coachingPoints = [];

    // Role-specific coaching
    const roleMetrics = getRoleMetrics(role);
    
    Object.entries(roleMetrics).forEach(([metricName]) => {
      const metricScore = analyses.performance.breakdown[metricName];
      
      if (metricScore && metricScore.percentile < 60) {
        coachingPoints.push({
          category: 'Role Performance',
          title: `Improve ${metricName}`,
          description: `Currently at ${metricScore.percentile}th percentile`,
          actionItems: this._getMetricActionItems(metricName),
          priority: metricScore.percentile < 30 ? 'high' : 'medium'
        });
      }
    });

    // Laning phase coaching
    if (analyses.laning.score < 70) {
      coachingPoints.push({
        category: 'Laning Phase',
        title: 'Strengthen Early Game',
        description: `Laning outcome: ${analyses.laning.outcome}`,
        actionItems: [
          'Practice last-hitting in demo mode daily',
          'Learn creep equilibrium and wave management',
          'Study matchup-specific trading patterns',
          'Improve map awareness during laning'
        ],
        priority: 'high'
      });
    }

    // Economy coaching
    if (analyses.economy.efficiency < 70) {
      coachingPoints.push({
        category: 'Economy',
        title: 'Optimize Resource Management',
        description: `${analyses.economy.efficiency}% gold efficiency`,
        actionItems: [
          'Plan item builds based on game state',
          'Avoid unnecessary item purchases',
          'Use buybacks strategically',
          'Maximize farm uptime between objectives'
        ],
        priority: 'medium'
      });
    }

    // Combat coaching
    if (analyses.combat.impact < 60) {
      coachingPoints.push({
        category: 'Teamfighting',
        title: 'Enhance Combat Effectiveness',
        description: `${analyses.combat.impact}% teamfight impact`,
        actionItems: [
          'Focus on positioning before fights',
          'Target prioritization in teamfights',
          'Coordinate with team for better synergy',
          'Practice ability combos and timing'
        ],
        priority: 'high'
      });
    }

    return coachingPoints.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get specific action items for metrics
   */
  _getMetricActionItems(metricName) {
    const actionItems = {
      'Farm Efficiency': [
        'Optimize farming patterns and routes',
        'Stack neutral camps efficiently',
        'Balance farming with team participation',
        'Learn to farm safely under pressure'
      ],
      'Vision Control': [
        'Place wards in high-value locations',
        'Maintain consistent ward coverage',
        'Coordinate warding with team movements',
        'Learn optimal ward spots for each game phase'
      ],
      'Team Support': [
        'Position for maximum assist potential',
        'Use abilities to enable team kills',
        'Communicate enemy positions and intentions',
        'Prioritize team objectives over individual plays'
      ],
      'Survivability': [
        'Improve positioning awareness',
        'Build appropriate defensive items',
        'Learn escape routes and safe positions',
        'Practice threat assessment in fights'
      ]
    };

    return actionItems[metricName] || [
      'Practice this aspect in unranked games',
      'Watch professional players for techniques',
      'Review replays to identify improvement areas'
    ];
  }

  /**
   * Calculate overall match score
   */
  _calculateOverallScore(analyses) {
    const weights = {
      performance: 0.4,
      laning: 0.2,
      economy: 0.15,
      combat: 0.15,
      vision: 0.1
    };

    let totalScore = 0;
    totalScore += analyses.performance.score * weights.performance;
    totalScore += analyses.laning.score * weights.laning;
    totalScore += analyses.economy.efficiency * weights.economy;
    totalScore += analyses.combat.impact * weights.combat;
    totalScore += analyses.vision.score * weights.vision;

    const grade = this._getGradeFromScore(totalScore);

    return {
      score: Math.round(totalScore),
      grade,
      breakdown: {
        performance: Math.round(analyses.performance.score * weights.performance),
        laning: Math.round(analyses.laning.score * weights.laning),
        economy: Math.round(analyses.economy.efficiency * weights.economy),
        combat: Math.round(analyses.combat.impact * weights.combat),
        vision: Math.round(analyses.vision.score * weights.vision)
      }
    };
  }

  /**
   * Calculate improvement score based on mistakes and strengths
   */
  _calculateImprovementScore(analyses) {
    // Start with base score from performance
    let score = analyses.performance.score || 50;
    
    // Adjust based on critical issues
    if (analyses.laning.score < 40) score -= 15;
    if (analyses.economy.efficiency < 50) score -= 10;
    if (analyses.combat.impact < 40) score -= 15;
    if (analyses.vision.score < 30) score -= 10;
    
    // Boost for excellence
    if (analyses.performance.grade === 'S') score += 10;
    if (analyses.laning.score >= 85) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Convert score to grade
   */
  _getGradeFromScore(score) {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[Match Analysis] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cached: this.cache.size,
      processing: this.processingQueue.size,
      memory: this._estimateCacheSize()
    };
  }

  /**
   * Estimate cache memory usage
   */
  _estimateCacheSize() {
    let size = 0;
    this.cache.forEach(value => {
      size += JSON.stringify(value).length;
    });
    return `${Math.round(size / 1024)}KB`;
  }
}

// Create singleton instance
const matchAnalysisService = new MatchAnalysisService();

export default matchAnalysisService;