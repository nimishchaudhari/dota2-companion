/**
 * Role Detection Algorithms
 * Multi-factor role detection with confidence scoring and weighted analysis
 */

/**
 * Detect player role using multiple factors
 */
export function detectPlayerRole(playerData, matchData) {
  if (!playerData || !matchData) {
    return { role: 'Unknown', confidence: 0, factors: {} };
  }

  const factors = {
    laneRole: analyzeLaneRole(playerData),
    farmPriority: analyzeFarmPriority(playerData, matchData),
    supportActivity: analyzeSupportActivity(playerData),
    position: analyzePosition(playerData),
    itemBuild: analyzeItemBuild(playerData)
  };

  const roleScores = calculateRoleScores(factors);
  const detectedRole = getBestRole(roleScores);
  const confidence = calculateConfidence(roleScores, factors);

  return {
    role: detectedRole,
    confidence,
    factors,
    roleScores,
    description: getRoleDescription(detectedRole)
  };
}

/**
 * Analyze lane role from API data
 */
function analyzeLaneRole(playerData) {
  const laneRole = playerData.lane_role;
  
  if (laneRole) {
    const roleMap = {
      1: 'Carry',
      2: 'Mid',
      3: 'Offlane',
      4: 'Support',
      5: 'Hard Support'
    };
    
    return {
      role: roleMap[laneRole] || 'Unknown',
      confidence: 0.9, // High confidence when API provides lane role
      source: 'api'
    };
  }
  
  return { role: null, confidence: 0, source: 'none' };
}

/**
 * Analyze farm priority relative to team
 */
function analyzeFarmPriority(playerData, matchData) {
  const teamPlayers = getTeamPlayers(playerData, matchData);
  const teamGoldAvg = teamPlayers.reduce((sum, p) => sum + (p.gold_per_min || 0), 0) / teamPlayers.length;
  
  const playerGpm = playerData.gold_per_min || 0;
  const farmPriority = teamGoldAvg > 0 ? playerGpm / teamGoldAvg : 1;
  
  let farmRole = 'Support';
  let confidence = 0.3;
  
  if (farmPriority >= 1.4) {
    farmRole = 'Carry';
    confidence = 0.8;
  } else if (farmPriority >= 1.1) {
    farmRole = 'Mid';
    confidence = 0.7;
  } else if (farmPriority >= 0.9) {
    farmRole = 'Offlane';
    confidence = 0.6;
  } else if (farmPriority >= 0.6) {
    farmRole = 'Support';
    confidence = 0.7;
  } else {
    farmRole = 'Hard Support';
    confidence = 0.8;
  }
  
  return {
    role: farmRole,
    confidence,
    farmPriority,
    playerGpm,
    teamGoldAvg
  };
}

/**
 * Analyze support activity indicators
 */
function analyzeSupportActivity(playerData) {
  const wardsPlaced = (playerData.obs_placed || 0) + (playerData.sen_placed || 0);
  const wardsPurchased = playerData.purchase_ward_observer || 0;
  const supportItems = countSupportItems(playerData);
  const healing = playerData.hero_healing || 0;
  
  const supportScore = (
    wardsPlaced * 2 +
    wardsPurchased * 1.5 +
    supportItems * 3 +
    Math.min(healing / 1000, 10) // Cap healing contribution
  );
  
  let supportLevel = 'None';
  let confidence = 0.3;
  
  if (supportScore >= 20) {
    supportLevel = 'Hard Support';
    confidence = 0.9;
  } else if (supportScore >= 10) {
    supportLevel = 'Support';
    confidence = 0.8;
  } else if (supportScore >= 5) {
    supportLevel = 'Semi-Support';
    confidence = 0.6;
  }
  
  return {
    level: supportLevel,
    confidence,
    supportScore,
    wardsPlaced,
    supportItems,
    healing
  };
}

/**
 * Analyze position based on player slot
 */
function analyzePosition(playerData) {
  const playerSlot = playerData.player_slot;
  const isRadiant = playerSlot < 128;
  const position = isRadiant ? playerSlot + 1 : (playerSlot - 128) + 1;
  
  const positionRoles = {
    1: 'Carry',
    2: 'Mid', 
    3: 'Offlane',
    4: 'Support',
    5: 'Hard Support'
  };
  
  return {
    role: positionRoles[position] || 'Unknown',
    confidence: 0.4, // Lower confidence as position is just draft order
    position,
    isRadiant
  };
}

/**
 * Analyze item build for role indicators
 */
function analyzeItemBuild(playerData) {
  const items = getAllPlayerItems(playerData);
  const itemCategories = categorizeItems(items);
  
  let roleIndicator = 'Unknown';
  let confidence = 0.3;
  
  if (itemCategories.carry >= 2) {
    roleIndicator = 'Carry';
    confidence = 0.6;
  } else if (itemCategories.mid >= 1) {
    roleIndicator = 'Mid';
    confidence = 0.5;
  } else if (itemCategories.support >= 2) {
    roleIndicator = itemCategories.support >= 3 ? 'Hard Support' : 'Support';
    confidence = 0.7;
  } else if (itemCategories.utility >= 2) {
    roleIndicator = 'Offlane';
    confidence = 0.5;
  }
  
  return {
    role: roleIndicator,
    confidence,
    itemCategories,
    totalItems: items.length
  };
}

/**
 * Calculate role scores based on all factors
 */
function calculateRoleScores(factors) {
  const roles = ['Carry', 'Mid', 'Offlane', 'Support', 'Hard Support'];
  const weights = {
    laneRole: 0.4,
    farmPriority: 0.25,
    supportActivity: 0.2,
    position: 0.1,
    itemBuild: 0.05
  };
  
  const scores = {};
  
  roles.forEach(role => {
    let score = 0;
    let totalWeight = 0;
    
    // Lane role factor
    if (factors.laneRole.role === role) {
      score += factors.laneRole.confidence * weights.laneRole;
    }
    totalWeight += weights.laneRole;
    
    // Farm priority factor
    if (factors.farmPriority.role === role) {
      score += factors.farmPriority.confidence * weights.farmPriority;
    }
    totalWeight += weights.farmPriority;
    
    // Support activity factor
    const supportMatch = getSupportActivityMatch(role, factors.supportActivity.level);
    score += supportMatch * factors.supportActivity.confidence * weights.supportActivity;
    totalWeight += weights.supportActivity;
    
    // Position factor
    if (factors.position.role === role) {
      score += factors.position.confidence * weights.position;
    }
    totalWeight += weights.position;
    
    // Item build factor
    if (factors.itemBuild.role === role) {
      score += factors.itemBuild.confidence * weights.itemBuild;
    }
    totalWeight += weights.itemBuild;
    
    scores[role] = totalWeight > 0 ? score / totalWeight : 0;
  });
  
  return scores;
}

/**
 * Get best role from scores
 */
function getBestRole(roleScores) {
  return Object.entries(roleScores)
    .reduce((best, [role, score]) => score > best.score ? { role, score } : best, 
            { role: 'Unknown', score: 0 })
    .role;
}

/**
 * Calculate confidence in role detection
 */
function calculateConfidence(roleScores, factors) {
  const scores = Object.values(roleScores);
  const maxScore = Math.max(...scores);
  const secondMaxScore = scores.sort((a, b) => b - a)[1] || 0;
  
  // Confidence based on margin between top two scores
  const margin = maxScore - secondMaxScore;
  let confidence = Math.min(maxScore + margin * 0.5, 1.0);
  
  // Boost confidence if multiple factors agree
  const factorAgreement = countFactorAgreement(factors);
  confidence = Math.min(confidence + factorAgreement * 0.1, 1.0);
  
  return Math.round(confidence * 100);
}

/**
 * Helper functions
 */
function getTeamPlayers(playerData, matchData) {
  const isRadiant = playerData.player_slot < 128;
  return matchData.players.filter(p => 
    isRadiant ? p.player_slot < 128 : p.player_slot >= 128
  );
}

function countSupportItems(playerData) {
  const supportItems = [
    'ward_observer', 'ward_sentry', 'dust', 'gem', 
    'force_staff', 'glimmer_cape', 'urn_of_shadows',
    'mekansm', 'pipe', 'medallion_of_courage'
  ];
  
  let count = 0;
  supportItems.forEach(item => {
    if (playerData.purchase && playerData.purchase[item]) {
      count++;
    }
  });
  
  return count;
}

function getAllPlayerItems(playerData) {
  const items = [];
  
  // Current items
  for (let i = 0; i < 6; i++) {
    const item = playerData[`item_${i}`];
    if (item) items.push(item);
  }
  
  // Backpack
  for (let i = 0; i < 3; i++) {
    const item = playerData[`backpack_${i}`];
    if (item) items.push(item);
  }
  
  return items;
}

function categorizeItems(items) {
  const categories = {
    carry: 0,
    mid: 0,
    support: 0,
    utility: 0
  };
  
  const itemMap = {
    // Carry items
    battle_fury: 'carry',
    daedalus: 'carry',
    divine_rapier: 'carry',
    butterfly: 'carry',
    satanic: 'carry',
    
    // Mid items
    bottle: 'mid',
    shadow_fiend: 'mid',
    orchid: 'mid',
    
    // Support items
    ward_observer: 'support',
    force_staff: 'support',
    glimmer_cape: 'support',
    mekansm: 'support',
    
    // Utility items
    blink: 'utility',
    pipe: 'utility',
    lotus_orb: 'utility'
  };
  
  items.forEach(item => {
    const category = itemMap[item];
    if (category) {
      categories[category]++;
    }
  });
  
  return categories;
}

function getSupportActivityMatch(role, supportLevel) {
  const matches = {
    'Hard Support': { 'Hard Support': 1.0, 'Support': 0.3 },
    'Support': { 'Support': 1.0, 'Hard Support': 0.7, 'Semi-Support': 0.3 },
    'Semi-Support': { 'Semi-Support': 1.0, 'Support': 0.5 },
    'None': { 'Carry': 0.8, 'Mid': 0.7, 'Offlane': 0.6 }
  };
  
  return matches[supportLevel]?.[role] || 0;
}

function countFactorAgreement(factors) {
  const roles = [factors.laneRole.role, factors.farmPriority.role, factors.position.role];
  const validRoles = roles.filter(r => r && r !== 'Unknown');
  
  if (validRoles.length < 2) return 0;
  
  const agreement = validRoles.filter(r => r === validRoles[0]).length;
  return agreement / validRoles.length;
}

function getRoleDescription(role) {
  const descriptions = {
    'Carry': 'Primary farming core, responsible for late-game damage output',
    'Mid': 'Solo mid laner, tempo controller and playmaker',
    'Offlane': 'Durable core, initiator and space creator',
    'Support': 'Team enabler, provides vision and utility',
    'Hard Support': 'Primary support, ward provider and team protector',
    'Unknown': 'Role could not be determined with confidence'
  };
  
  return descriptions[role] || descriptions['Unknown'];
}

/**
 * Get role-specific performance metrics
 */
export function getRoleMetrics(role) {
  const roleMetrics = {
    Carry: {
      'CS Efficiency': { weight: 0.4, benchmark: 'last_hits_per_min', target: 8.0 },
      'Farm Speed': { weight: 0.3, benchmark: 'gold_per_min', target: 600 },
      'Late Game Impact': { weight: 0.2, benchmark: 'hero_damage', target: 30000 },
      'Death Avoidance': { weight: 0.1, calculation: 'inverse_deaths', target: 3 }
    },
    Mid: {
      'Lane Control': { weight: 0.3, benchmark: 'last_hits_per_min', target: 7.0 },
      'Tempo Control': { weight: 0.25, benchmark: 'xp_per_min', target: 600 },
      'Ganking Impact': { weight: 0.25, benchmark: 'kills', target: 8 },
      'Damage Output': { weight: 0.2, benchmark: 'hero_damage', target: 25000 }
    },
    Offlane: {
      'Survivability': { weight: 0.3, calculation: 'inverse_deaths', target: 4 },
      'Space Creation': { weight: 0.25, benchmark: 'assists', target: 15 },
      'Farm Efficiency': { weight: 0.25, benchmark: 'gold_per_min', target: 450 },
      'Initiation': { weight: 0.2, benchmark: 'teamfight_participation', target: 0.7 }
    },
    Support: {
      'Ward Efficiency': { weight: 0.35, benchmark: 'obs_placed', target: 15 },
      'Save Plays': { weight: 0.25, benchmark: 'hero_healing', target: 8000 },
      'Space Creation': { weight: 0.25, benchmark: 'assists', target: 20 },
      'Gold Efficiency': { weight: 0.15, calculation: 'gold_spent_ratio', target: 1.1 }
    },
    'Hard Support': {
      'Vision Control': { weight: 0.4, benchmark: 'obs_placed', target: 20 },
      'Team Support': { weight: 0.3, benchmark: 'hero_healing', target: 12000 },
      'Death Efficiency': { weight: 0.2, calculation: 'assist_death_ratio', target: 3.0 },
      'Economic Impact': { weight: 0.1, calculation: 'team_gold_contribution', target: 0.15 }
    }
  };
  
  return roleMetrics[role] || roleMetrics.Support;
}