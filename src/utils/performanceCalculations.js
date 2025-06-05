// Performance calculation utilities for match analysis

/**
 * Analyze laning phase performance (0-10 minutes)
 */
export function analyzeLaningPhase(playerData, matchData, logs) {
  const laningData = {
    csProgression: playerData.lh_t?.slice(0, 10) || [],
    xpProgression: playerData.xp_t?.slice(0, 10) || [],
    goldProgression: playerData.gold_t?.slice(0, 10) || [],
    deathsInLane: countDeathsInTimeframe(playerData, 0, 600), // First 10 minutes
    firstBlood: playerData.firstblood_claimed || false,
    denies: playerData.dn_t?.slice(0, 10) || []
  };

  // Calculate lane outcome
  const laneScore = calculateLaneScore(laningData, playerData);
  const outcome = getLaneOutcome(laneScore);

  // CS efficiency analysis
  const csEfficiency = calculateCSEfficiency(laningData.csProgression);
  
  // Experience efficiency
  const xpEfficiency = calculateXPEfficiency(laningData.xpProgression);

  return {
    outcome,
    score: laneScore,
    csAt10: laningData.csProgression[9] || 0,
    xpAt10: laningData.xpProgression[9] || 0,
    goldAt10: laningData.goldProgression[9] || 0,
    deathsInLane: laningData.deathsInLane,
    firstBlood: laningData.firstBlood,
    efficiency: {
      cs: csEfficiency,
      xp: xpEfficiency,
      gold: calculateGoldEfficiency(laningData.goldProgression)
    },
    progression: {
      cs: laningData.csProgression,
      xp: laningData.xpProgression,
      gold: laningData.goldProgression,
      denies: laningData.denies
    },
    benchmarks: getLaningBenchmarks(playerData)
  };
}

/**
 * Analyze economy and resource management
 */
export function analyzeEconomy(playerData, matchData, logs) {
  const goldSources = parseGoldReasons(playerData.gold_reasons);
  const itemTimings = analyzeItemProgression(playerData.purchase_log);
  const netWorthProgression = playerData.gold_t || [];

  return {
    goldSources,
    itemTimings,
    netWorthProgression,
    resourceAllocation: {
      buybacks: playerData.buyback_count || 0,
      consumables: countConsumables(playerData.purchase_log),
      tpUsage: countTPUsage(playerData.purchase_log)
    },
    efficiency: {
      goldPerMinute: playerData.gold_per_min || 0,
      goldSpent: calculateGoldSpent(playerData.purchase_log),
      goldEfficiency: calculateOverallGoldEfficiency(playerData),
      farmDistribution: analyzeFarmDistribution(goldSources)
    },
    milestones: calculateEconomyMilestones(netWorthProgression, itemTimings),
    comparison: compareEconomyToTeam(playerData, matchData)
  };
}

/**
 * Analyze combat performance and teamfights
 */
export function analyzeCombat(playerData, matchData, logs) {
  const teamfights = analyzeTeamfights(matchData.teamfights || [], playerData);
  const damageDistribution = calculateDamageDistribution(playerData);
  const targetPriority = analyzeKillTargets(playerData.killed);

  return {
    teamfights,
    damageDistribution,
    targetPriority,
    positioning: {
      score: calculatePositioningScore(playerData),
      deaths: analyzeDeathPositions(playerData, logs),
      safetyRating: calculateSafetyRating(playerData)
    },
    efficiency: {
      killParticipation: calculateKillParticipation(playerData, matchData),
      damagePerGold: calculateDamagePerGold(playerData),
      survivalRate: calculateSurvivalRate(playerData, teamfights)
    },
    timeline: buildCombatTimeline(playerData, logs),
    strengths: identifyCombatStrengths(playerData),
    weaknesses: identifyCombatWeaknesses(playerData)
  };
}

/**
 * Analyze vision and map control
 */
export function analyzeVision(playerData, matchData, logs) {
  const wardMetrics = calculateWardMetrics(playerData, matchData);
  const visionScore = calculateVisionScore(playerData, matchData);
  const mapControl = analyzeMapControl(playerData, matchData);

  return {
    visionScore,
    grade: getVisionGrade(visionScore),
    wardMetrics,
    mapControl,
    timeline: buildWardTimeline(playerData),
    efficiency: {
      wardUptime: calculateWardUptime(playerData, matchData.duration),
      dewardEfficiency: calculateDewardEfficiency(playerData),
      visionCoverage: calculateVisionCoverage(playerData),
      goldInvestment: calculateVisionGoldInvestment(playerData)
    },
    comparison: compareVisionToRole(playerData, wardMetrics),
    recommendations: generateVisionRecommendations(playerData, wardMetrics)
  };
}

// Helper functions for laning phase analysis

function countDeathsInTimeframe(playerData, startTime, endTime) {
  if (!playerData.deaths_log) return 0;
  
  return playerData.deaths_log.filter(death => 
    death.time >= startTime && death.time <= endTime
  ).length;
}

function calculateLaneScore(laningData, playerData) {
  let score = 50; // Base score
  
  const csAt10 = laningData.csProgression[9] || 0;
  const xpAt10 = laningData.xpProgression[9] || 0;
  const deathsInLane = laningData.deathsInLane;
  
  // CS scoring (role-dependent)
  if (csAt10 >= 80) score += 25;
  else if (csAt10 >= 60) score += 15;
  else if (csAt10 >= 40) score += 5;
  else if (csAt10 < 20) score -= 15;
  
  // XP scoring
  if (xpAt10 >= 4000) score += 20;
  else if (xpAt10 >= 3000) score += 10;
  else if (xpAt10 < 2000) score -= 10;
  
  // Death penalty
  score -= deathsInLane * 15;
  
  // First blood bonus
  if (laningData.firstBlood) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function getLaneOutcome(score) {
  if (score >= 70) return 'Won';
  if (score >= 45) return 'Drew';
  return 'Lost';
}

function calculateCSEfficiency(csProgression) {
  if (!csProgression.length) return 0;
  
  const finalCS = csProgression[csProgression.length - 1] || 0;
  const timeMinutes = csProgression.length;
  
  return timeMinutes > 0 ? Math.round(finalCS / timeMinutes * 10) / 10 : 0;
}

function calculateXPEfficiency(xpProgression) {
  if (!xpProgression.length) return 0;
  
  const finalXP = xpProgression[xpProgression.length - 1] || 0;
  const timeMinutes = xpProgression.length;
  
  return timeMinutes > 0 ? Math.round(finalXP / timeMinutes) : 0;
}

function calculateGoldEfficiency(goldProgression) {
  if (!goldProgression.length) return 0;
  
  const finalGold = goldProgression[goldProgression.length - 1] || 0;
  const timeMinutes = goldProgression.length;
  
  return timeMinutes > 0 ? Math.round(finalGold / timeMinutes) : 0;
}

function getLaningBenchmarks(playerData) {
  // Role-based benchmarks for laning phase
  return {
    cs: { excellent: 80, good: 60, average: 40, poor: 20 },
    xp: { excellent: 4000, good: 3200, average: 2800, poor: 2000 },
    gold: { excellent: 2500, good: 2000, average: 1500, poor: 1000 },
    deaths: { excellent: 0, good: 1, average: 2, poor: 3 }
  };
}

// Helper functions for economy analysis

function parseGoldReasons(goldReasons) {
  if (!goldReasons) return {};
  
  const reasonMap = {
    0: 'Other',
    1: 'Death',
    2: 'Buyback', 
    3: 'Abandon',
    11: 'Structures',
    12: 'Heroes',
    13: 'Creeps',
    14: 'Neutrals',
    15: 'Roshan'
  };
  
  const sources = {};
  Object.entries(goldReasons).forEach(([reason, amount]) => {
    const sourceName = reasonMap[reason] || 'Unknown';
    sources[sourceName] = amount;
  });
  
  return sources;
}

function analyzeItemProgression(purchaseLog) {
  if (!purchaseLog) return [];
  
  const majorItems = [
    'blink', 'black_king_bar', 'butterfly', 'heart', 'satanic',
    'divine_rapier', 'assault', 'skadi', 'abyssal_blade'
  ];
  
  return purchaseLog
    .filter(purchase => majorItems.some(item => purchase.key?.includes(item)))
    .map(purchase => ({
      item: purchase.key,
      time: Math.floor(purchase.time / 60), // Convert to minutes
      cost: purchase.cost || 0
    }))
    .sort((a, b) => a.time - b.time);
}

function countConsumables(purchaseLog) {
  if (!purchaseLog) return 0;
  
  const consumables = ['tango', 'flask', 'clarity', 'enchanted_mango', 'faerie_fire'];
  
  return purchaseLog.filter(purchase => 
    consumables.some(item => purchase.key?.includes(item))
  ).length;
}

function countTPUsage(purchaseLog) {
  if (!purchaseLog) return 0;
  
  return purchaseLog.filter(purchase => 
    purchase.key?.includes('tpscroll')
  ).length;
}

function calculateGoldSpent(purchaseLog) {
  if (!purchaseLog) return 0;
  
  return purchaseLog.reduce((total, purchase) => total + (purchase.cost || 0), 0);
}

function calculateOverallGoldEfficiency(playerData) {
  const netWorth = playerData.net_worth || 0;
  const heroDamage = playerData.hero_damage || 0;
  
  return netWorth > 0 ? Math.round(heroDamage / netWorth * 100) / 100 : 0;
}

function analyzeFarmDistribution(goldSources) {
  const total = Object.values(goldSources).reduce((sum, amount) => sum + amount, 0);
  
  if (total === 0) return {};
  
  const distribution = {};
  Object.entries(goldSources).forEach(([source, amount]) => {
    distribution[source] = Math.round((amount / total) * 100);
  });
  
  return distribution;
}

function calculateEconomyMilestones(netWorthProgression, itemTimings) {
  const milestones = [];
  
  // Net worth milestones
  const targets = [5000, 10000, 15000, 20000];
  targets.forEach(target => {
    const minute = netWorthProgression.findIndex(nw => nw >= target);
    if (minute >= 0) {
      milestones.push({
        type: 'networth',
        target,
        time: minute + 1,
        description: `Reached ${target} net worth`
      });
    }
  });
  
  // Item milestones
  itemTimings.forEach(item => {
    milestones.push({
      type: 'item',
      target: item.item,
      time: item.time,
      description: `Acquired ${item.item}`
    });
  });
  
  return milestones.sort((a, b) => a.time - b.time);
}

function compareEconomyToTeam(playerData, matchData) {
  const isRadiant = playerData.player_slot < 128;
  const teammates = matchData.players.filter(p => 
    isRadiant ? p.player_slot < 128 : p.player_slot >= 128
  );
  
  const teamGoldAvg = teammates.reduce((sum, p) => sum + (p.gold_per_min || 0), 0) / teammates.length;
  const playerGold = playerData.gold_per_min || 0;
  
  return {
    teamAverage: Math.round(teamGoldAvg),
    playerGPM: playerGold,
    relativePerfomance: teamGoldAvg > 0 ? Math.round((playerGold / teamGoldAvg) * 100) : 100,
    rank: teammates.sort((a, b) => (b.gold_per_min || 0) - (a.gold_per_min || 0))
      .findIndex(p => p.account_id === playerData.account_id) + 1
  };
}

// Helper functions for combat analysis

function analyzeTeamfights(teamfights, playerData) {
  return teamfights.map(tf => {
    const playerParticipation = tf.players?.[playerData.player_slot] || {};
    
    return {
      start: tf.start,
      end: tf.end,
      duration: tf.end - tf.start,
      damage: playerParticipation.damage || 0,
      healing: playerParticipation.healing || 0,
      goldDelta: playerParticipation.gold_delta || 0,
      xpDelta: playerParticipation.xp_delta || 0,
      kills: playerParticipation.kills || 0,
      deaths: playerParticipation.deaths || 0,
      assists: playerParticipation.assists || 0,
      impact: calculateTeamfightImpact(playerParticipation)
    };
  });
}

function calculateDamageDistribution(playerData) {
  const heroDamage = playerData.hero_damage || 0;
  const towerDamage = playerData.tower_damage || 0;
  const creepDamage = (playerData.last_hits || 0) * 50; // Estimate
  
  const total = heroDamage + towerDamage + creepDamage;
  
  if (total === 0) return {};
  
  return {
    hero: Math.round((heroDamage / total) * 100),
    tower: Math.round((towerDamage / total) * 100),
    creep: Math.round((creepDamage / total) * 100),
    total
  };
}

function analyzeKillTargets(killed) {
  if (!killed) return {};
  
  const targetCounts = {};
  Object.values(killed).forEach(count => {
    // This would need more detailed data to properly analyze
    // For now, return a simplified version
  });
  
  return targetCounts;
}

function calculatePositioningScore(playerData) {
  const deaths = playerData.deaths || 0;
  const assists = playerData.assists || 0;
  const teamfightParticipation = playerData.teamfight_participation || 0;
  
  // Higher assists and participation, lower deaths = better positioning
  let score = 50;
  score += assists * 2;
  score += teamfightParticipation * 30;
  score -= deaths * 8;
  
  return Math.max(0, Math.min(100, score));
}

function analyzeDeathPositions(playerData, logs) {
  // This would require detailed log analysis
  // Return simplified data for now
  return {
    laneDeaths: 0,
    jungleDeaths: 0,
    teamfightDeaths: 0,
    soloDeaths: 0
  };
}

function calculateSafetyRating(playerData) {
  const deaths = playerData.deaths || 0;
  const duration = playerData.duration || 1800; // 30 minutes default
  const deathsPerMinute = deaths / (duration / 60);
  
  if (deathsPerMinute <= 0.1) return 'Excellent';
  if (deathsPerMinute <= 0.2) return 'Good';
  if (deathsPerMinute <= 0.3) return 'Average';
  return 'Poor';
}

function calculateKillParticipation(playerData, matchData) {
  const playerKills = (playerData.kills || 0) + (playerData.assists || 0);
  
  // Calculate team kills (would need team data)
  const isRadiant = playerData.player_slot < 128;
  const teamPlayers = matchData.players.filter(p => 
    isRadiant ? p.player_slot < 128 : p.player_slot >= 128
  );
  
  const teamKills = teamPlayers.reduce((sum, p) => sum + (p.kills || 0), 0);
  
  return teamKills > 0 ? Math.round((playerKills / teamKills) * 100) : 0;
}

function calculateDamagePerGold(playerData) {
  const heroDamage = playerData.hero_damage || 0;
  const netWorth = playerData.net_worth || 1;
  
  return Math.round(heroDamage / netWorth * 100) / 100;
}

function calculateSurvivalRate(playerData, teamfights) {
  const totalTeamfights = teamfights.length;
  const deathsInTeamfights = teamfights.reduce((sum, tf) => sum + (tf.deaths || 0), 0);
  
  return totalTeamfights > 0 ? 
    Math.round(((totalTeamfights - deathsInTeamfights) / totalTeamfights) * 100) : 100;
}

function buildCombatTimeline(playerData, logs) {
  // Simplified timeline - would need detailed logs for full implementation
  return [];
}

function identifyCombatStrengths(playerData) {
  const strengths = [];
  
  if ((playerData.hero_damage || 0) >= 25000) {
    strengths.push('High damage output');
  }
  
  if ((playerData.assists || 0) >= 15) {
    strengths.push('Strong team fight participation');
  }
  
  if ((playerData.deaths || 0) <= 3) {
    strengths.push('Excellent positioning');
  }
  
  return strengths;
}

function identifyCombatWeaknesses(playerData) {
  const weaknesses = [];
  
  if ((playerData.deaths || 0) >= 10) {
    weaknesses.push('Poor positioning and deaths');
  }
  
  if ((playerData.hero_damage || 0) < 10000) {
    weaknesses.push('Low damage output');
  }
  
  if ((playerData.assists || 0) < 5) {
    weaknesses.push('Poor team fight participation');
  }
  
  return weaknesses;
}

// Helper functions for vision analysis

function calculateWardMetrics(playerData, matchData) {
  return {
    obsPlaced: playerData.obs_placed || 0,
    senPlaced: playerData.sen_placed || 0,
    obsKills: playerData.observer_kills || 0,
    senKills: playerData.sentry_kills || 0,
    totalWards: (playerData.obs_placed || 0) + (playerData.sen_placed || 0),
    totalDewarding: (playerData.observer_kills || 0) + (playerData.sentry_kills || 0)
  };
}

function calculateVisionScore(playerData, matchData) {
  const wardMetrics = calculateWardMetrics(playerData, matchData);
  const duration = matchData.duration / 60; // Convert to minutes
  
  let score = 0;
  
  // Ward placement scoring
  score += wardMetrics.obsPlaced * 10;
  score += wardMetrics.senPlaced * 8;
  
  // Dewarding scoring
  score += wardMetrics.obsKills * 15;
  score += wardMetrics.senKills * 12;
  
  // Time-based normalization
  if (duration > 0) {
    score = score / duration * 45; // Normalize to 45-minute game
  }
  
  return Math.round(score);
}

function getVisionGrade(visionScore) {
  if (visionScore >= 150) return 'S';
  if (visionScore >= 100) return 'A';
  if (visionScore >= 70) return 'B';
  if (visionScore >= 40) return 'C';
  return 'D';
}

function analyzeMapControl(playerData, matchData) {
  // Simplified map control analysis
  const towerDamage = playerData.tower_damage || 0;
  const neutralKills = playerData.neutral_kills || 0;
  
  return {
    objectiveControl: towerDamage > 2000 ? 'High' : towerDamage > 1000 ? 'Medium' : 'Low',
    jungleControl: neutralKills > 100 ? 'High' : neutralKills > 50 ? 'Medium' : 'Low',
    mapPresence: calculateMapPresence(playerData)
  };
}

function calculateMapPresence(playerData) {
  // Based on kills + assists across the map
  const involvement = (playerData.kills || 0) + (playerData.assists || 0);
  
  if (involvement >= 20) return 'High';
  if (involvement >= 12) return 'Medium';
  return 'Low';
}

function buildWardTimeline(playerData) {
  // Simplified ward timeline
  if (!playerData.obs_log && !playerData.sen_log) return [];
  
  const timeline = [];
  
  // Observer wards
  if (playerData.obs_log) {
    playerData.obs_log.forEach(ward => {
      timeline.push({
        type: 'observer',
        time: ward.time,
        x: ward.x,
        y: ward.y,
        lifetime: 420 // 7 minutes
      });
    });
  }
  
  // Sentry wards
  if (playerData.sen_log) {
    playerData.sen_log.forEach(ward => {
      timeline.push({
        type: 'sentry',
        time: ward.time,
        x: ward.x,
        y: ward.y,
        lifetime: 300 // 5 minutes
      });
    });
  }
  
  return timeline.sort((a, b) => a.time - b.time);
}

function calculateWardUptime(playerData, matchDuration) {
  const obsPlaced = playerData.obs_placed || 0;
  const maxPossibleUptime = matchDuration; // Seconds
  const actualUptime = obsPlaced * 420; // Each ward lasts 7 minutes
  
  return Math.min(100, Math.round((actualUptime / maxPossibleUptime) * 100));
}

function calculateDewardEfficiency(playerData) {
  const wardsKilled = (playerData.observer_kills || 0) + (playerData.sentry_kills || 0);
  const sentryWardsBought = playerData.purchase?.ward_sentry || 0;
  
  return sentryWardsBought > 0 ? 
    Math.round((wardsKilled / sentryWardsBought) * 100) : 0;
}

function calculateVisionCoverage(playerData) {
  // Simplified coverage calculation based on ward count and placement
  const totalWards = (playerData.obs_placed || 0) + (playerData.sen_placed || 0);
  
  if (totalWards >= 30) return 'Excellent';
  if (totalWards >= 20) return 'Good';
  if (totalWards >= 10) return 'Average';
  return 'Poor';
}

function calculateVisionGoldInvestment(playerData) {
  const obsWards = playerData.obs_placed || 0;
  const senWards = playerData.sen_placed || 0;
  
  // Observer wards are free, sentry wards cost gold
  return senWards * 50; // Approximate cost
}

function compareVisionToRole(playerData, wardMetrics) {
  // Role-based vision expectations
  const roleExpectations = {
    'Hard Support': { minObs: 15, minSen: 10, minDewarding: 5 },
    'Support': { minObs: 8, minSen: 5, minDewarding: 3 },
    'Offlane': { minObs: 3, minSen: 2, minDewarding: 1 },
    'Mid': { minObs: 2, minSen: 1, minDewarding: 1 },
    'Carry': { minObs: 1, minSen: 0, minDewarding: 0 }
  };
  
  // Would need role detection here
  return roleExpectations['Support']; // Default
}

function generateVisionRecommendations(playerData, wardMetrics) {
  const recommendations = [];
  
  if (wardMetrics.obsPlaced < 5) {
    recommendations.push({
      priority: 'High',
      category: 'Ward Placement',
      suggestion: 'Place more observer wards to provide vision for your team'
    });
  }
  
  if (wardMetrics.totalDewarding < 3) {
    recommendations.push({
      priority: 'Medium',
      category: 'Dewarding',
      suggestion: 'Invest in sentry wards to deward enemy vision'
    });
  }
  
  return recommendations;
}

function calculateTeamfightImpact(participation) {
  const damage = participation.damage || 0;
  const healing = participation.healing || 0;
  const kills = participation.kills || 0;
  const assists = participation.assists || 0;
  const deaths = participation.deaths || 0;
  
  // Weighted impact score
  let impact = 0;
  impact += damage / 1000; // 1 point per 1000 damage
  impact += healing / 500;  // 1 point per 500 healing
  impact += kills * 10;     // 10 points per kill
  impact += assists * 5;    // 5 points per assist
  impact -= deaths * 15;    // -15 points per death
  
  return Math.max(0, Math.round(impact));
}