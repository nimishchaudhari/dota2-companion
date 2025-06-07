/**
 * Performance Calculations
 * Comprehensive performance analysis covering all game phases
 */

/**
 * Calculate overall performance grade
 */
export function calculatePerformanceGrade(playerData, benchmarks, role) {
  if (!playerData) {
    return { grade: 'D', score: 0, breakdown: {} };
  }

  const metrics = getRoleSpecificMetrics(role);
  const scores = {};
  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(metrics).forEach(([metricName, config]) => {
    const score = calculateMetricScore(playerData, config, benchmarks);
    scores[metricName] = score;
    totalScore += score.percentile * config.weight;
    totalWeight += config.weight;
  });

  const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  const grade = getGradeFromScore(overallScore);

  return {
    grade,
    score: Math.round(overallScore),
    breakdown: scores,
    recommendations: generateImprovementTips(scores)
  };
}

/**
 * Analyze laning phase (0-10 minutes)
 */
export function analyzeLaningPhase(playerData) {
  if (!playerData) {
    return { outcome: 'UNKNOWN', score: 0, details: {} };
  }

  const laningData = {
    csProgression: playerData.lh_t?.slice(0, 10) || [],
    xpProgression: playerData.xp_t?.slice(0, 10) || [],
    goldProgression: playerData.gold_t?.slice(0, 10) || [],
    deathsInLane: countDeathsInTimeframe(playerData, 0, 600),
    firstBlood: playerData.firstblood_claimed || false,
    denies: playerData.denies || 0,
    lastHits: playerData.last_hits || 0
  };

  // Calculate lane metrics
  const laneScore = calculateLaneScore(laningData);
  const csEfficiency = calculateCSEfficiency(laningData);
  const xpAdvantage = calculateXPAdvantage(laningData);
  
  const overallScore = (laneScore + csEfficiency + xpAdvantage) / 3;
  const outcome = getLaneOutcome(overallScore);

  return {
    outcome,
    score: Math.round(overallScore),
    details: {
      ...laningData,
      csEfficiency,
      xpAdvantage,
      laneScore
    },
    recommendations: getLaningRecommendations(overallScore, laningData)
  };
}

/**
 * Analyze economy and resource management
 */
export function analyzeEconomy(playerData, matchData) {
  if (!playerData) {
    return { efficiency: 0, details: {} };
  }

  const goldSources = parseGoldReasons(playerData.gold_reasons);
  const itemTimings = analyzeItemProgression(playerData.purchase_log);
  const netWorthProgression = playerData.gold_t || [];
  
  const resourceAllocation = {
    buybacks: playerData.buyback_count || 0,
    consumables: countConsumables(playerData.purchase_log),
    tpUsage: playerData.purchase?.tp_scroll || 0
  };

  const efficiency = calculateGoldEfficiency(playerData);
  const farmDistribution = analyzeFarmDistribution(playerData, matchData);

  return {
    efficiency: Math.round(efficiency),
    goldSources,
    itemTimings,
    netWorthProgression,
    resourceAllocation,
    farmDistribution,
    recommendations: getEconomyRecommendations(efficiency, resourceAllocation)
  };
}

/**
 * Analyze combat performance and teamfights
 */
export function analyzeCombat(playerData, matchData) {
  if (!playerData) {
    return { impact: 0, details: {} };
  }

  const teamfightImpact = analyzeTeamfights(matchData.teamfights, playerData);
  const damageDistribution = {
    heroDamage: playerData.hero_damage || 0,
    towerDamage: playerData.tower_damage || 0,
    creepDamage: calculateCreepDamage(playerData)
  };

  const targetPriority = analyzeKillTargets(playerData.killed);
  const positioningScore = calculatePositioningScore(playerData);
  const combatEfficiency = calculateCombatEfficiency(playerData);

  const overallImpact = (teamfightImpact + positioningScore + combatEfficiency) / 3;

  return {
    impact: Math.round(overallImpact),
    teamfightImpact,
    damageDistribution,
    targetPriority,
    positioningScore,
    combatEfficiency,
    recommendations: getCombatRecommendations(overallImpact, damageDistribution)
  };
}

/**
 * Analyze vision and map control
 */
export function analyzeVision(playerData, matchData) {
  if (!playerData) {
    return { score: 0, grade: 'D', details: {} };
  }

  const visionMetrics = {
    wardUptime: calculateWardUptime(playerData, matchData.duration),
    dewardEfficiency: calculateDewardEfficiency(playerData),
    visionScore: calculateVisionScore(playerData),
    mapControl: analyzeMapControl(playerData, matchData)
  };

  const overallScore = (
    visionMetrics.wardUptime * 0.3 +
    visionMetrics.dewardEfficiency * 0.2 +
    visionMetrics.visionScore * 0.4 +
    visionMetrics.mapControl * 0.1
  );

  const grade = getGradeFromScore(overallScore);
  const timeline = buildWardTimeline(playerData.obs_log, playerData.sen_log);

  return {
    score: Math.round(overallScore),
    grade,
    ...visionMetrics,
    timeline,
    recommendations: getVisionRecommendations(overallScore, visionMetrics)
  };
}

/**
 * Helper calculation functions
 */
function getRoleSpecificMetrics(role) {
  const roleMetrics = {
    Carry: {
      'Farm Efficiency': { weight: 0.35, benchmark: 'gold_per_min' },
      'CS Per Minute': { weight: 0.25, benchmark: 'last_hits_per_min' },
      'Damage Output': { weight: 0.25, benchmark: 'hero_damage' },
      'Survivability': { weight: 0.15, calculation: 'death_ratio' }
    },
    Mid: {
      'Lane Control': { weight: 0.3, benchmark: 'last_hits_per_min' },
      'Tempo Impact': { weight: 0.25, benchmark: 'kills' },
      'XP Efficiency': { weight: 0.25, benchmark: 'xp_per_min' },
      'Damage Output': { weight: 0.2, benchmark: 'hero_damage' }
    },
    Offlane: {
      'Survivability': { weight: 0.3, calculation: 'death_ratio' },
      'Team Impact': { weight: 0.25, benchmark: 'assists' },
      'Farm Under Pressure': { weight: 0.25, benchmark: 'gold_per_min' },
      'Initiation': { weight: 0.2, benchmark: 'teamfight_participation' }
    },
    Support: {
      'Vision Control': { weight: 0.35, benchmark: 'obs_placed' },
      'Team Support': { weight: 0.25, benchmark: 'assists' },
      'Healing Impact': { weight: 0.2, benchmark: 'hero_healing' },
      'Efficiency': { weight: 0.2, calculation: 'gpm_efficiency' }
    },
    'Hard Support': {
      'Ward Coverage': { weight: 0.4, benchmark: 'obs_placed' },
      'Dewarding': { weight: 0.2, benchmark: 'sen_placed' },
      'Team Healing': { weight: 0.25, benchmark: 'hero_healing' },
      'Death Value': { weight: 0.15, calculation: 'assist_death_ratio' }
    }
  };

  return roleMetrics[role] || roleMetrics.Support;
}

function calculateMetricScore(playerData, config, benchmarks) {
  let value;
  
  if (config.calculation) {
    value = calculateCustomMetric(playerData, config.calculation);
  } else {
    value = playerData[config.benchmark] || 0;
  }

  // Get percentile from benchmarks
  let percentile = 50; // Default to average
  
  if (benchmarks?.result?.[config.benchmark]) {
    const benchmarkData = benchmarks.result[config.benchmark];
    percentile = calculatePercentile(value, benchmarkData);
  }

  return {
    value,
    percentile,
    grade: getGradeFromScore(percentile)
  };
}

function calculateCustomMetric(playerData, calculation) {
  switch (calculation) {
    case 'death_ratio':
      return playerData.deaths > 0 ? 
        ((playerData.kills || 0) + (playerData.assists || 0)) / playerData.deaths : 10;
    
    case 'gpm_efficiency':
      return (playerData.gold_per_min || 0) / Math.max(playerData.duration / 60, 1);
    
    case 'assist_death_ratio':
      return playerData.deaths > 0 ? (playerData.assists || 0) / playerData.deaths : 10;
    
    default:
      return 0;
  }
}

function calculatePercentile(value, benchmarkData) {
  if (!benchmarkData || !Array.isArray(benchmarkData)) return 50;
  
  // Find percentile rank
  const sortedData = [...benchmarkData].sort((a, b) => a.value - b.value);
  const index = sortedData.findIndex(item => item.value >= value);
  
  if (index === -1) return 100; // Above all benchmarks
  if (index === 0) return 0; // Below all benchmarks
  
  return Math.round((index / sortedData.length) * 100);
}

function getGradeFromScore(score) {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function calculateLaneScore(laningData) {
  const csAt10 = laningData.csProgression[9] || 0;
  const deathsInLane = laningData.deathsInLane;
  const denies = laningData.denies || 0;
  
  // Calculate score based on CS, deaths, and denies
  let score = Math.min(csAt10 / 80 * 70, 70); // Max 70 points for CS
  score += Math.max(20 - deathsInLane * 10, 0); // Lose 10 points per death
  score += Math.min(denies / 20 * 10, 10); // Max 10 points for denies
  
  return Math.min(score, 100);
}

function calculateCSEfficiency(laningData) {
  const cs10min = laningData.csProgression[9] || 0;
  const totalPossibleCS = 82; // Approximate total CS available in 10 minutes
  
  return Math.min((cs10min / totalPossibleCS) * 100, 100);
}

function calculateXPAdvantage(laningData) {
  // This would require opponent data, for now return based on XP progression
  const xpAt10 = laningData.xpProgression[9] || 0;
  const averageXpAt10 = 4000; // Rough average
  
  return Math.min((xpAt10 / averageXpAt10) * 100, 150);
}

function getLaneOutcome(score) {
  if (score >= 80) return 'WIN';
  if (score >= 60) return 'DRAW';
  return 'LOSS';
}

function countDeathsInTimeframe(playerData, startTime, endTime) {
  // This would require death time data, for now estimate
  const totalDeaths = playerData.deaths || 0;
  const matchDuration = playerData.duration || 3600;
  const timeframeDuration = endTime - startTime;
  
  return Math.round((totalDeaths * timeframeDuration) / matchDuration);
}

function parseGoldReasons(goldReasons) {
  if (!goldReasons) return {};
  
  const reasonMap = {
    0: 'Other',
    1: 'Death',
    2: 'Buyback',
    11: 'Creeps',
    12: 'Heroes',
    13: 'Buildings',
    14: 'Roshan',
    15: 'Couriers'
  };
  
  const parsed = {};
  Object.entries(goldReasons).forEach(([reason, amount]) => {
    const reasonName = reasonMap[reason] || `Unknown (${reason})`;
    parsed[reasonName] = amount;
  });
  
  return parsed;
}

function analyzeItemProgression(purchaseLog) {
  if (!purchaseLog) return [];
  
  const majorItems = [
    'blink', 'black_king_bar', 'battle_fury', 'radiance',
    'desolator', 'monkey_king_bar', 'butterfly', 'assault'
  ];
  
  return purchaseLog
    .filter(purchase => majorItems.some(item => purchase.key?.includes(item)))
    .map(purchase => ({
      item: purchase.key,
      time: Math.floor(purchase.time / 60), // Convert to minutes
      cost: purchase.charges || 0
    }))
    .sort((a, b) => a.time - b.time);
}

function calculateGoldEfficiency(playerData) {
  const goldEarned = playerData.total_gold || 0;
  const goldSpent = goldEarned - (playerData.gold || 0);
  const duration = (playerData.duration || 3600) / 60; // Convert to minutes
  
  if (duration === 0) return 0;
  
  return (goldSpent / duration) / (goldEarned / duration) * 100;
}

function analyzeTeamfights(teamfights, playerData) {
  if (!teamfights || !playerData) return 50;
  
  // Calculate participation and impact
  const playerParticipation = playerData.teamfight_participation || 0;
  
  return Math.min(playerParticipation * 100, 100);
}

function calculateCreepDamage(playerData) {
  // Estimate based on last hits and farm
  const lastHits = playerData.last_hits || 0;
  const averageDamagePerCreep = 60;
  
  return lastHits * averageDamagePerCreep;
}

function analyzeKillTargets(killedData) {
  if (!killedData) return [];
  
  return Object.entries(killedData)
    .map(([heroId, count]) => ({ heroId: parseInt(heroId), kills: count }))
    .sort((a, b) => b.kills - a.kills);
}

function calculatePositioningScore(playerData) {
  const deaths = playerData.deaths || 0;
  const assists = playerData.assists || 0;
  const kills = playerData.kills || 0;
  
  // Good positioning = high assists, low deaths
  if (deaths === 0) return 100;
  
  const ratio = (kills + assists) / deaths;
  return Math.min(ratio * 20, 100);
}

function calculateCombatEfficiency(playerData) {
  const damage = playerData.hero_damage || 0;
  const deaths = Math.max(playerData.deaths || 0, 1);
  
  return Math.min(damage / deaths / 1000, 100);
}

function calculateWardUptime(playerData, duration) {
  const wardsPlaced = playerData.obs_placed || 0;
  const wardDuration = 6 * 60; // 6 minutes per ward
  const totalWardTime = wardsPlaced * wardDuration;
  
  return Math.min((totalWardTime / duration) * 100, 100);
}

function calculateDewardEfficiency(playerData) {
  const sentryWards = playerData.sen_placed || 0;
  const dewarding = playerData.observer_kills || 0;
  
  if (sentryWards === 0) return dewarding > 0 ? 100 : 0;
  
  return Math.min((dewarding / sentryWards) * 100, 100);
}

function calculateVisionScore(playerData) {
  const obsPlaced = playerData.obs_placed || 0;
  const senPlaced = playerData.sen_placed || 0;
  const dewarding = playerData.observer_kills || 0;
  
  return Math.min((obsPlaced * 2 + senPlaced + dewarding * 3), 100);
}

function analyzeMapControl(playerData, matchData) {
  // Simplified map control based on team objectives
  const towers = playerData.tower_kills || 0;
  const roshans = matchData.objectives?.filter(obj => 
    obj.type === 'CHAT_MESSAGE_ROSHAN_KILL' && 
    obj.team === (playerData.player_slot < 128 ? 2 : 3)
  ).length || 0;
  
  return Math.min((towers * 10 + roshans * 20), 100);
}

function buildWardTimeline(obsLog, senLog) {
  const timeline = [];
  
  if (obsLog) {
    obsLog.forEach(ward => {
      timeline.push({
        type: 'Observer',
        time: ward.time,
        x: ward.x,
        y: ward.y
      });
    });
  }
  
  if (senLog) {
    senLog.forEach(ward => {
      timeline.push({
        type: 'Sentry',
        time: ward.time,
        x: ward.x,
        y: ward.y
      });
    });
  }
  
  return timeline.sort((a, b) => a.time - b.time);
}

function countConsumables(purchaseLog) {
  if (!purchaseLog) return 0;
  
  const consumables = ['tango', 'clarity', 'flask', 'bottle', 'tome'];
  
  return purchaseLog.filter(purchase => 
    consumables.some(item => purchase.key?.includes(item))
  ).length;
}

function analyzeFarmDistribution(playerData, matchData) {
  const teamGold = matchData.players
    .filter(p => (p.player_slot < 128) === (playerData.player_slot < 128))
    .reduce((sum, p) => sum + (p.total_gold || 0), 0);
  
  const playerGold = playerData.total_gold || 0;
  const farmShare = teamGold > 0 ? (playerGold / teamGold) * 100 : 0;
  
  return {
    farmShare: Math.round(farmShare),
    teamGold,
    playerGold
  };
}

/**
 * Recommendation generators
 */
function generateImprovementTips(scores) {
  const tips = [];
  
  Object.entries(scores).forEach(([metric, score]) => {
    if (score.percentile < 50) {
      tips.push(generateMetricTip(metric, score));
    }
  });
  
  return tips.slice(0, 3); // Return top 3 tips
}

function generateMetricTip(metric, score) {
  const tips = {
    'Farm Efficiency': 'Focus on last-hitting consistently and optimize farming patterns',
    'CS Per Minute': 'Practice last-hitting and maintain constant farming throughout the game',
    'Vision Control': 'Place more observer wards in key areas and maintain vision coverage',
    'Team Support': 'Stay near teammates during fights and help secure kills',
    'Survivability': 'Improve positioning and map awareness to avoid unnecessary deaths'
  };
  
  return {
    metric,
    tip: tips[metric] || 'Focus on improving this aspect of your gameplay',
    severity: score.percentile < 25 ? 'high' : 'medium'
  };
}

function getLaningRecommendations(score, laningData) {
  const recommendations = [];
  
  if (score < 60) {
    recommendations.push('Focus on last-hitting practice to improve CS efficiency');
  }
  
  if (laningData.deathsInLane > 1) {
    recommendations.push('Improve lane positioning and map awareness');
  }
  
  if ((laningData.denies || 0) < 5) {
    recommendations.push('Deny more enemy creeps to control lane equilibrium');
  }
  
  return recommendations;
}

function getEconomyRecommendations(efficiency, allocation) {
  const recommendations = [];
  
  if (efficiency < 70) {
    recommendations.push('Optimize item builds and avoid unnecessary purchases');
  }
  
  if (allocation.buybacks > 2) {
    recommendations.push('Use buybacks more strategically - avoid panic buybacks');
  }
  
  return recommendations;
}

function getCombatRecommendations(impact, damageDistribution) {
  const recommendations = [];
  
  if (impact < 60) {
    recommendations.push('Focus on teamfight positioning and target prioritization');
  }
  
  if (damageDistribution.heroDamage < 15000) {
    recommendations.push('Increase hero damage output during fights');
  }
  
  return recommendations;
}

function getVisionRecommendations(score, metrics) {
  const recommendations = [];
  
  if (score < 60) {
    recommendations.push('Place more observer wards throughout the game');
  }
  
  if (metrics.dewardEfficiency < 50) {
    recommendations.push('Use sentry wards more effectively to deward enemy vision');
  }
  
  return recommendations;
}