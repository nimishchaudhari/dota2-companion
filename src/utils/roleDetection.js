// Advanced role detection algorithms for Dota 2 match analysis

/**
 * Detect player role based on multiple factors
 * @param {Object} playerData - Player data from match
 * @param {Object} matchData - Full match data
 * @returns {string} Role: 'Carry', 'Mid', 'Offlane', 'Support', 'Hard Support'
 */
export function detectPlayerRole(playerData, matchData) {
  // Priority-based role detection:
  // 1. lane_role (if available): 1=Carry, 2=Mid, 3=Offlane, 4=Support, 5=Hard Support
  // 2. Farm priority: gold_per_min relative to team average
  // 3. Support indicators: obs_placed, sen_placed, support items
  // 4. Fallback: player_slot position (0-4 = Radiant pos 1-5, 128-132 = Dire pos 1-5)

  // Check if lane_role is available (most reliable)
  if (playerData.lane_role && playerData.lane_role >= 1 && playerData.lane_role <= 5) {
    const roleMap = {
      1: 'Carry',
      2: 'Mid', 
      3: 'Offlane',
      4: 'Support',
      5: 'Hard Support'
    };
    return roleMap[playerData.lane_role];
  }

  // Calculate team-based indicators
  const teamData = getTeamData(playerData, matchData);
  const farmPriority = calculateFarmPriority(playerData, teamData);
  const supportScore = calculateSupportScore(playerData);
  const laneIndicators = analyzeLaneIndicators(playerData);

  // Role scoring system
  const roleScores = {
    'Carry': calculateCarryScore(playerData, farmPriority, teamData),
    'Mid': calculateMidScore(playerData, farmPriority, laneIndicators),
    'Offlane': calculateOfflaneScore(playerData, farmPriority, teamData),
    'Support': calculateSupportScore(playerData, supportScore, farmPriority),
    'Hard Support': calculateHardSupportScore(playerData, supportScore, farmPriority)
  };

  // Return role with highest score
  const detectedRole = Object.entries(roleScores).reduce((a, b) => 
    roleScores[a[0]] > roleScores[b[0]] ? a : b
  )[0];

  console.log(`[ROLE DETECTION] Detected ${detectedRole} for player ${playerData.account_id}`, {
    scores: roleScores,
    indicators: { farmPriority, supportScore, laneIndicators }
  });

  return detectedRole;
}

/**
 * Get team data for analysis
 */
function getTeamData(playerData, matchData) {
  const isRadiant = playerData.player_slot < 128;
  const teammates = matchData.players.filter(p => 
    isRadiant ? p.player_slot < 128 : p.player_slot >= 128
  );

  const teamGoldTotal = teammates.reduce((sum, p) => sum + (p.gold_per_min || 0), 0);
  const teamXpTotal = teammates.reduce((sum, p) => sum + (p.xp_per_min || 0), 0);
  const teamGoldAvg = teamGoldTotal / teammates.length;
  const teamXpAvg = teamXpTotal / teammates.length;

  return {
    teammates,
    teamGoldAvg,
    teamXpAvg,
    teamGoldTotal,
    teamXpTotal
  };
}

/**
 * Calculate farm priority relative to team
 */
function calculateFarmPriority(playerData, teamData) {
  const playerGpm = playerData.gold_per_min || 0;
  const playerXpm = playerData.xp_per_min || 0;
  
  const gpmRatio = teamData.teamGoldAvg > 0 ? playerGpm / teamData.teamGoldAvg : 1;
  const xpmRatio = teamData.teamXpAvg > 0 ? playerXpm / teamData.teamXpAvg : 1;
  
  return (gpmRatio + xpmRatio) / 2;
}

/**
 * Calculate support indicators
 */
function calculateSupportScore(playerData) {
  const wardCount = (playerData.obs_placed || 0) + (playerData.sen_placed || 0);
  const dewarding = playerData.observer_kills || 0;
  const healing = playerData.hero_healing || 0;
  const assists = playerData.assists || 0;
  const supportItems = countSupportItems(playerData);

  // Weighted support score
  return (
    wardCount * 10 +
    dewarding * 15 +
    (healing / 1000) * 5 +
    assists * 2 +
    supportItems * 20
  );
}

/**
 * Analyze lane indicators from early game data
 */
function analyzeLaneIndicators(playerData) {
  const csAt10 = getCSAtTime(playerData, 10) || 0;
  const xpAt10 = getXPAtTime(playerData, 10) || 0;
  const goldAt10 = getGoldAtTime(playerData, 10) || 0;
  
  return {
    earlyFarm: csAt10,
    earlyXp: xpAt10,
    earlyGold: goldAt10,
    laneEfficiency: csAt10 / Math.max(1, 10) // CS per minute in first 10 min
  };
}

/**
 * Calculate carry role score
 */
function calculateCarryScore(playerData, farmPriority, teamData) {
  let score = 0;
  
  // High farm priority
  if (farmPriority >= 1.3) score += 40;
  else if (farmPriority >= 1.1) score += 20;
  
  // Low support activities
  const wardCount = (playerData.obs_placed || 0) + (playerData.sen_placed || 0);
  if (wardCount <= 2) score += 20;
  
  // High damage output
  const heroDamage = playerData.hero_damage || 0;
  if (heroDamage >= 30000) score += 20;
  else if (heroDamage >= 20000) score += 10;
  
  // Item progression (carry-focused items)
  const carryItems = countCarryItems(playerData);
  score += carryItems * 5;
  
  // Player slot (position 1 traditionally carry)
  const position = getPosition(playerData.player_slot);
  if (position === 1) score += 15;
  
  return score;
}

/**
 * Calculate mid role score
 */
function calculateMidScore(playerData, farmPriority, laneIndicators) {
  let score = 0;
  
  // Moderate to high farm priority
  if (farmPriority >= 1.2) score += 30;
  else if (farmPriority >= 1.0) score += 20;
  
  // High XP gain (mid gets solo XP)
  const xpm = playerData.xp_per_min || 0;
  if (xpm >= 650) score += 25;
  else if (xpm >= 550) score += 15;
  
  // Early game efficiency
  if (laneIndicators.laneEfficiency >= 5) score += 20;
  
  // Level advantage
  const level = playerData.level || 1;
  if (level >= 20) score += 15;
  else if (level >= 18) score += 10;
  
  // Player slot (position 2 traditionally mid)
  const position = getPosition(playerData.player_slot);
  if (position === 2) score += 15;
  
  return score;
}

/**
 * Calculate offlane role score
 */
function calculateOfflaneScore(playerData, farmPriority, teamData) {
  let score = 0;
  
  // Moderate farm priority
  if (farmPriority >= 0.8 && farmPriority <= 1.2) score += 25;
  
  // Initiation/tank items
  const initiationItems = countInitiationItems(playerData);
  score += initiationItems * 10;
  
  // Tower damage (space creation)
  const towerDamage = playerData.tower_damage || 0;
  if (towerDamage >= 3000) score += 20;
  else if (towerDamage >= 1500) score += 10;
  
  // Assists (team fight participation)
  const assists = playerData.assists || 0;
  if (assists >= 15) score += 15;
  else if (assists >= 10) score += 10;
  
  // Player slot (position 3 traditionally offlane)
  const position = getPosition(playerData.player_slot);
  if (position === 3) score += 15;
  
  return score;
}

/**
 * Calculate support role score (position 4)
 */
function calculateSupportScore(playerData, supportScore, farmPriority) {
  let score = 0;
  
  // Lower farm priority
  if (farmPriority <= 0.8) score += 30;
  else if (farmPriority <= 1.0) score += 15;
  
  // High support activities
  if (supportScore >= 100) score += 40;
  else if (supportScore >= 50) score += 25;
  else if (supportScore >= 20) score += 15;
  
  // Player slot (position 4)
  const position = getPosition(playerData.player_slot);
  if (position === 4) score += 20;
  
  return score;
}

/**
 * Calculate hard support role score (position 5)
 */
function calculateHardSupportScore(playerData, supportScore, farmPriority) {
  let score = 0;
  
  // Lowest farm priority
  if (farmPriority <= 0.6) score += 40;
  else if (farmPriority <= 0.8) score += 20;
  
  // Very high support activities
  if (supportScore >= 150) score += 50;
  else if (supportScore >= 100) score += 35;
  else if (supportScore >= 50) score += 20;
  
  // Ward placement is critical
  const wardCount = (playerData.obs_placed || 0) + (playerData.sen_placed || 0);
  if (wardCount >= 20) score += 25;
  else if (wardCount >= 10) score += 15;
  
  // Player slot (position 5)
  const position = getPosition(playerData.player_slot);
  if (position === 5) score += 20;
  
  return score;
}

/**
 * Helper functions
 */
function getPosition(playerSlot) {
  // Convert player_slot to position (1-5)
  if (playerSlot < 128) {
    return (playerSlot % 128) + 1; // Radiant: 0-4 -> 1-5
  } else {
    return ((playerSlot - 128) % 5) + 1; // Dire: 128-132 -> 1-5
  }
}

function getCSAtTime(playerData, minutes) {
  if (playerData.lh_t && playerData.lh_t.length > minutes) {
    return playerData.lh_t[minutes - 1];
  }
  return null;
}

function getXPAtTime(playerData, minutes) {
  if (playerData.xp_t && playerData.xp_t.length > minutes) {
    return playerData.xp_t[minutes - 1];
  }
  return null;
}

function getGoldAtTime(playerData, minutes) {
  if (playerData.gold_t && playerData.gold_t.length > minutes) {
    return playerData.gold_t[minutes - 1];
  }
  return null;
}

function countSupportItems(playerData) {
  const supportItems = [
    'force_staff', 'glimmer_cape', 'solar_crest', 'lotus_orb',
    'ghost_scepter', 'urn_of_shadows', 'spirit_vessel', 'medallion_of_courage',
    'ward_observer', 'ward_sentry', 'dust', 'gem'
  ];
  
  return countItemsInInventory(playerData, supportItems);
}

function countCarryItems(playerData) {
  const carryItems = [
    'satanic', 'butterfly', 'divine_rapier', 'abyssal_blade',
    'assault', 'heart', 'skadi', 'mjollnir', 'daedalus',
    'monkey_king_bar', 'bloodthorn', 'silver_edge'
  ];
  
  return countItemsInInventory(playerData, carryItems);
}

function countInitiationItems(playerData) {
  const initiationItems = [
    'blink', 'force_staff', 'lotus_orb', 'pipe',
    'crimson_guard', 'vladmir', 'drums_of_endurance',
    'black_king_bar', 'linkens_sphere'
  ];
  
  return countItemsInInventory(playerData, initiationItems);
}

function countItemsInInventory(playerData, itemList) {
  let count = 0;
  
  // Check final items (item_0 to item_5)
  for (let i = 0; i <= 5; i++) {
    const itemId = playerData[`item_${i}`];
    if (itemId && itemList.some(item => itemId.toString().includes(item))) {
      count++;
    }
  }
  
  // Check backpack (backpack_0 to backpack_2)
  for (let i = 0; i <= 2; i++) {
    const itemId = playerData[`backpack_${i}`];
    if (itemId && itemList.some(item => itemId.toString().includes(item))) {
      count++;
    }
  }
  
  return count;
}

/**
 * Get role-specific performance expectations
 */
export function getRoleExpectations(role) {
  const expectations = {
    'Carry': {
      primaryMetrics: ['gold_per_min', 'last_hits', 'hero_damage'],
      secondaryMetrics: ['deaths', 'tower_damage'],
      minGPM: 500,
      minCS: 200,
      maxDeaths: 6
    },
    'Mid': {
      primaryMetrics: ['xp_per_min', 'hero_damage', 'kills'],
      secondaryMetrics: ['last_hits', 'gold_per_min'],
      minXPM: 550,
      minHeroDamage: 20000,
      minKills: 5
    },
    'Offlane': {
      primaryMetrics: ['assists', 'tower_damage', 'hero_damage'],
      secondaryMetrics: ['deaths', 'gold_per_min'],
      minAssists: 10,
      minTowerDamage: 1500,
      maxDeaths: 8
    },
    'Support': {
      primaryMetrics: ['assists', 'obs_placed', 'hero_healing'],
      secondaryMetrics: ['deaths', 'observer_kills'],
      minAssists: 12,
      minWards: 8,
      minHealing: 5000
    },
    'Hard Support': {
      primaryMetrics: ['obs_placed', 'assists', 'observer_kills'],
      secondaryMetrics: ['deaths', 'hero_healing'],
      minWards: 15,
      minAssists: 15,
      minDewarding: 3
    }
  };

  return expectations[role] || expectations['Support'];
}

/**
 * Validate role detection with confidence score
 */
export function validateRoleDetection(playerData, matchData, detectedRole) {
  const expectations = getRoleExpectations(detectedRole);
  let confidenceScore = 50; // Base confidence
  
  // Check if primary metrics align with role
  const farmPriority = calculateFarmPriority(playerData, getTeamData(playerData, matchData));
  
  switch (detectedRole) {
    case 'Carry':
      if (farmPriority >= 1.2) confidenceScore += 20;
      if ((playerData.hero_damage || 0) >= 20000) confidenceScore += 15;
      if ((playerData.obs_placed || 0) <= 2) confidenceScore += 10;
      break;
      
    case 'Mid':
      if ((playerData.xp_per_min || 0) >= 550) confidenceScore += 20;
      if (farmPriority >= 1.0) confidenceScore += 15;
      break;
      
    case 'Support':
    case 'Hard Support':
      const wardCount = (playerData.obs_placed || 0) + (playerData.sen_placed || 0);
      if (wardCount >= 10) confidenceScore += 25;
      if (farmPriority <= 0.8) confidenceScore += 15;
      break;
  }
  
  return {
    role: detectedRole,
    confidence: Math.min(100, Math.max(0, confidenceScore)),
    expectations,
    meetsExpectations: checkExpectations(playerData, expectations)
  };
}

function checkExpectations(playerData, expectations) {
  const results = {};
  
  Object.entries(expectations).forEach(([key, value]) => {
    if (key.startsWith('min')) {
      const metric = key.replace('min', '').toLowerCase();
      const actualValue = getMetricValue(playerData, metric);
      results[key] = actualValue >= value;
    } else if (key.startsWith('max')) {
      const metric = key.replace('max', '').toLowerCase();
      const actualValue = getMetricValue(playerData, metric);
      results[key] = actualValue <= value;
    }
  });
  
  return results;
}

function getMetricValue(playerData, metric) {
  const metricMap = {
    'gpm': 'gold_per_min',
    'xpm': 'xp_per_min', 
    'cs': 'last_hits',
    'herodamage': 'hero_damage',
    'towerdamage': 'tower_damage',
    'healing': 'hero_healing',
    'wards': 'obs_placed',
    'dewarding': 'observer_kills',
    'deaths': 'deaths',
    'kills': 'kills',
    'assists': 'assists'
  };
  
  const field = metricMap[metric] || metric;
  return playerData[field] || 0;
}