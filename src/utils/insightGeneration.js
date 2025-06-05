// AI-powered coaching insights generation for match analysis

/**
 * Generate comprehensive coaching insights for a player's match performance
 * @param {Object} playerData - Player data from match
 * @param {Object} matchData - Full match data
 * @param {string} role - Detected player role
 * @param {Object} benchmarks - Performance benchmarks
 * @returns {Object} Comprehensive insights and coaching recommendations
 */
export function generateInsights(playerData, matchData, role, _benchmarks) {
  const insights = {
    overallAssessment: generateOverallAssessment(playerData, matchData, role),
    criticalMistakes: identifyMistakes(playerData, matchData, role),
    strengths: identifyStrengths(playerData, matchData, role),
    coachingPoints: generateCoachingPoints(playerData, matchData, role),
    improvementScore: calculateImprovementScore(playerData, role),
    actionableTips: generateActionableTips(playerData, role),
    nextSteps: generateNextSteps(playerData, role),
    roleSpecificAnalysis: generateRoleSpecificAnalysis(playerData, role)
  };

  return insights;
}

/**
 * Generate overall performance assessment
 */
function generateOverallAssessment(playerData, _matchData, role) {
  const won = didPlayerWin(playerData, _matchData);
  const kda = calculateKDA(playerData);
  const impactScore = calculateImpactScore(playerData, role);
  
  let assessment = {
    result: won ? 'Victory' : 'Defeat',
    performance: getPerformanceLevel(impactScore),
    kda: `${playerData.kills}/${playerData.deaths}/${playerData.assists}`,
    kdaRatio: kda,
    impactScore,
    summary: '',
    grade: calculateOverallGrade(playerData, role, impactScore)
  };

  // Generate summary based on performance
  if (won && impactScore >= 80) {
    assessment.summary = `Excellent ${role} performance that significantly contributed to the victory. Strong execution across multiple areas.`;
  } else if (won && impactScore >= 60) {
    assessment.summary = `Solid ${role} performance that helped secure the win. Some areas for improvement identified.`;
  } else if (won && impactScore >= 40) {
    assessment.summary = `Average ${role} performance in a winning match. Focus on consistency and impact.`;
  } else if (!won && impactScore >= 60) {
    assessment.summary = `Good individual ${role} performance despite the loss. Work on team coordination.`;
  } else if (!won && impactScore >= 40) {
    assessment.summary = `Mixed ${role} performance in a losing match. Several areas need attention.`;
  } else {
    assessment.summary = `Challenging ${role} performance with significant room for improvement across multiple areas.`;
  }

  return assessment;
}

/**
 * Identify critical mistakes made during the match
 */
function identifyMistakes(playerData, _matchData, role) {
  const mistakes = [];

  // High death count analysis
  const deaths = playerData.deaths || 0;
  if (deaths >= 10) {
    mistakes.push({
      type: 'critical',
      category: 'Positioning',
      title: 'Excessive Deaths',
      description: `${deaths} deaths indicates severe positioning issues and poor decision making`,
      impact: 'High MMR Loss Risk',
      timeframes: identifyDeathTimeframes(playerData),
      improvement: 'Focus on map awareness, safe positioning, and avoiding unnecessary risks',
      priority: 1
    });
  } else if (deaths >= 7) {
    mistakes.push({
      type: 'major',
      category: 'Positioning',
      title: 'High Death Count',
      description: `${deaths} deaths suggests positioning improvements needed`,
      impact: 'Moderate Impact',
      improvement: 'Work on staying with team and checking minimap more frequently',
      priority: 2
    });
  }

  // Farm efficiency issues
  const farmMistakes = analyzeFarmMistakes(playerData, role);
  mistakes.push(...farmMistakes);

  // Team fight mistakes
  const teamfightMistakes = analyzeTeamfightMistakes(playerData, _matchData);
  mistakes.push(...teamfightMistakes);

  // Vision mistakes (for supports)
  if (['Support', 'Hard Support'].includes(role)) {
    const visionMistakes = analyzeVisionMistakes(playerData);
    mistakes.push(...visionMistakes);
  }

  // Role-specific mistakes
  const roleSpecificMistakes = analyzeRoleSpecificMistakes(playerData, role);
  mistakes.push(...roleSpecificMistakes);

  return mistakes.sort((a, b) => a.priority - b.priority);
}

/**
 * Identify player strengths and positive aspects
 */
function identifyStrengths(playerData, _matchData, role) {
  const strengths = [];

  // KDA strengths
  const kda = calculateKDA(playerData);
  if (kda >= 3.0) {
    strengths.push({
      category: 'Combat',
      title: 'Excellent KDA Ratio',
      description: `Outstanding ${kda.toFixed(1)} KDA shows strong kill participation and low deaths`,
      impact: 'Positive team contribution',
      maintainance: 'Continue focusing on positioning and smart aggression'
    });
  } else if (kda >= 2.0) {
    strengths.push({
      category: 'Combat', 
      title: 'Good KDA Management',
      description: `Solid ${kda.toFixed(1)} KDA demonstrates effective combat participation`,
      impact: 'Good individual performance',
      maintainance: 'Maintain current positioning habits'
    });
  }

  // Farm strengths
  const farmStrengths = analyzeFarmStrengths(playerData, role);
  strengths.push(...farmStrengths);

  // Impact strengths
  const impactStrengths = analyzeImpactStrengths(playerData, role);
  strengths.push(...impactStrengths);

  // Vision strengths (for supports)
  if (['Support', 'Hard Support'].includes(role)) {
    const visionStrengths = analyzeVisionStrengths(playerData);
    strengths.push(...visionStrengths);
  }

  // Role-specific strengths
  const roleSpecificStrengths = analyzeRoleSpecificStrengths(playerData, role);
  strengths.push(...roleSpecificStrengths);

  return strengths;
}

/**
 * Generate specific coaching points
 */
function generateCoachingPoints(playerData, _matchData, role) {
  const coachingPoints = [];

  // Laning phase coaching
  const laningPoints = generateLaningCoaching(playerData, role);
  coachingPoints.push(...laningPoints);

  // Mid game coaching
  const midGamePoints = generateMidGameCoaching(playerData, role);
  coachingPoints.push(...midGamePoints);

  // Late game coaching
  const lateGamePoints = generateLateGameCoaching(playerData, _matchData, role);
  coachingPoints.push(...lateGamePoints);

  // Role-specific coaching
  const rolePoints = generateRoleSpecificCoaching(playerData, role);
  coachingPoints.push(...rolePoints);

  return coachingPoints.sort((a, b) => a.priority - b.priority);
}

/**
 * Calculate improvement potential score
 */
function calculateImprovementScore(playerData, _role) {
  let score = 0;
  let maxScore = 0;

  // Analyze different areas for improvement potential
  const areas = {
    farming: analyzeFarmingImprovement(playerData, _role),
    positioning: analyzePositioningImprovement(playerData),
    teamfighting: analyzeTeamfightingImprovement(playerData),
    vision: analyzeVisionImprovement(playerData, _role),
    itemization: analyzeItemizationImprovement(playerData, _role)
  };

  Object.values(areas).forEach(area => {
    score += area.currentScore;
    maxScore += area.maxScore;
  });

  const currentPercentage = maxScore > 0 ? (score / maxScore) * 100 : 50;
  const improvementPotential = Math.max(0, 100 - currentPercentage);

  return {
    current: Math.round(currentPercentage),
    potential: Math.round(improvementPotential),
    areas,
    recommendations: generateImprovementRecommendations(areas)
  };
}

/**
 * Generate actionable tips for immediate improvement
 */
function generateActionableTips(playerData, _role) {
  const tips = [];

  // Universal tips
  tips.push({
    category: 'Map Awareness',
    tip: 'Check minimap every 3-5 seconds',
    difficulty: 'Easy',
    impact: 'High',
    timeframe: 'Immediate'
  });

  // Role-specific tips
  const roleTips = getRoleSpecificTips(_role);
  tips.push(...roleTips);

  // Performance-based tips
  const performanceTips = getPerformanceBasedTips(playerData, _role);
  tips.push(...performanceTips);

  return tips.slice(0, 8); // Limit to most important tips
}

/**
 * Generate next steps for improvement
 */
function generateNextSteps(playerData, _role) {
  const nextSteps = [];

  // Short-term goals (1-2 weeks)
  nextSteps.push({
    timeframe: 'Short-term (1-2 weeks)',
    goals: getShortTermGoals(playerData, _role),
    focus: 'Immediate skill improvements and habit formation'
  });

  // Medium-term goals (1 month)
  nextSteps.push({
    timeframe: 'Medium-term (1 month)',
    goals: getMediumTermGoals(playerData, _role),
    focus: 'Consistent performance and advanced techniques'
  });

  // Long-term goals (2-3 months)
  nextSteps.push({
    timeframe: 'Long-term (2-3 months)',
    goals: getLongTermGoals(playerData, _role),
    focus: 'Mastery and leadership development'
  });

  return nextSteps;
}

/**
 * Generate role-specific analysis
 */
function generateRoleSpecificAnalysis(playerData, _role) {
  const roleAnalysis = {
    'Carry': analyzeCarryPerformance(playerData),
    'Mid': analyzeMidPerformance(playerData),
    'Offlane': analyzeOfflanePerformance(playerData),
    'Support': analyzeSupportPerformance(playerData),
    'Hard Support': analyzeHardSupportPerformance(playerData)
  };

  return roleAnalysis[_role] || roleAnalysis['Support'];
}

// Helper functions

function didPlayerWin(playerData, _matchData) {
  const isRadiant = playerData.player_slot < 128;
  return _matchData.radiant_win === isRadiant;
}

function calculateKDA(playerData) {
  const kills = playerData.kills || 0;
  const deaths = playerData.deaths || 0;
  const assists = playerData.assists || 0;
  
  return deaths > 0 ? (kills + assists) / deaths : kills + assists;
}

function calculateImpactScore(playerData, _role) {
  let score = 50; // Base score
  
  // Role-specific impact calculation
  switch (_role) {
    case 'Carry':
      score += (playerData.hero_damage || 0) / 1000;
      score += (playerData.gold_per_min || 0) / 15;
      score -= (playerData.deaths || 0) * 5;
      break;
    case 'Mid':
      score += (playerData.hero_damage || 0) / 800;
      score += (playerData.kills || 0) * 3;
      score += (playerData.xp_per_min || 0) / 20;
      break;
    case 'Offlane':
      score += (playerData.assists || 0) * 2;
      score += (playerData.tower_damage || 0) / 200;
      score -= (playerData.deaths || 0) * 3;
      break;
    case 'Support':
    case 'Hard Support':
      score += (playerData.obs_placed || 0) * 3;
      score += (playerData.assists || 0) * 2;
      score += (playerData.hero_healing || 0) / 500;
      break;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateOverallGrade(_playerData, _role, impactScore) {
  if (impactScore >= 85) return 'S';
  if (impactScore >= 75) return 'A';
  if (impactScore >= 65) return 'B';
  if (impactScore >= 50) return 'C';
  return 'D';
}

function getPerformanceLevel(score) {
  if (score >= 85) return 'Outstanding';
  if (score >= 75) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 35) return 'Below Average';
  return 'Poor';
}

function identifyDeathTimeframes(_playerData) {
  // Simplified - would need death logs for detailed analysis
  const deaths = _playerData.deaths || 0;
  
  if (deaths >= 8) {
    return ['Early game deaths (0-15 min)', 'Mid game deaths (15-30 min)', 'Late game deaths (30+ min)'];
  } else if (deaths >= 5) {
    return ['Mid-late game deaths', 'Team fight deaths'];
  } else {
    return ['Isolated deaths'];
  }
}

function analyzeFarmMistakes(playerData, _role) {
  const mistakes = [];
  const gpm = playerData.gold_per_min || 0;
  const cs = playerData.last_hits || 0;
  
  // Role-based farm expectations
  const farmExpectations = {
    'Carry': { minGPM: 500, minCS: 200 },
    'Mid': { minGPM: 450, minCS: 150 },
    'Offlane': { minGPM: 400, minCS: 120 },
    'Support': { minGPM: 300, minCS: 50 },
    'Hard Support': { minGPM: 250, minCS: 30 }
  };

  const expectations = farmExpectations[_role] || farmExpectations['Support'];

  if (gpm < expectations.minGPM) {
    mistakes.push({
      type: 'major',
      category: 'Economy',
      title: 'Low Farm Efficiency',
      description: `${gpm} GPM is below expected ${expectations.minGPM} for ${_role}`,
      impact: 'Reduced item timings and team contribution',
      improvement: 'Focus on farming patterns, jungle efficiency, and minimizing downtime',
      priority: 2
    });
  }

  if (cs < expectations.minCS && ['Carry', 'Mid'].includes(_role)) {
    mistakes.push({
      type: 'major',
      category: 'Farming',
      title: 'Poor Last-Hit Efficiency',
      description: `${cs} last hits is below expected ${expectations.minCS} for ${_role}`,
      impact: 'Significant gold deficit',
      improvement: 'Practice last-hitting mechanics and creep aggro control',
      priority: 2
    });
  }

  return mistakes;
}

function analyzeTeamfightMistakes(playerData, _matchData) {
  const mistakes = [];
  
  const teamfightParticipation = playerData.teamfight_participation || 0;
  if (teamfightParticipation < 0.6) {
    mistakes.push({
      type: 'major',
      category: 'Team Fighting',
      title: 'Low Team Fight Participation',
      description: `${(teamfightParticipation * 100).toFixed(0)}% team fight participation is too low`,
      impact: 'Reduced team coordination and fight outcomes',
      improvement: 'Stay closer to team and participate in more fights',
      priority: 2
    });
  }

  return mistakes;
}

function analyzeVisionMistakes(_playerData) {
  const mistakes = [];
  const wardsPlaced = (_playerData.obs_placed || 0) + (_playerData.sen_placed || 0);
  
  if (wardsPlaced < 10) {
    mistakes.push({
      type: 'major',
      category: 'Vision',
      title: 'Insufficient Ward Placement',
      description: `Only ${wardsPlaced} total wards placed throughout the match`,
      impact: 'Poor map vision and team positioning',
      improvement: 'Place wards more frequently, especially before objectives',
      priority: 2
    });
  }

  return mistakes;
}

function analyzeRoleSpecificMistakes(playerData, _role) {
  const mistakes = [];
  
  switch (_role) {
    case 'Carry':
      if ((playerData.hero_damage || 0) < 20000) {
        mistakes.push({
          type: 'major',
          category: 'Damage Output',
          title: 'Low Damage Output',
          description: 'Carry should deal more damage in team fights',
          improvement: 'Focus on positioning and target prioritization',
          priority: 2
        });
      }
      break;
      
    case 'Support':
    case 'Hard Support':
      if ((playerData.assists || 0) < 10) {
        mistakes.push({
          type: 'major',
          category: 'Team Support',
          title: 'Low Assist Count',
          description: 'Support should have higher team fight participation',
          improvement: 'Stay close to team and help with kills',
          priority: 2
        });
      }
      break;
  }
  
  return mistakes;
}

function analyzeFarmStrengths(playerData, _role) {
  const strengths = [];
  const gpm = playerData.gold_per_min || 0;
  
  const farmThresholds = {
    'Carry': { excellent: 600, good: 500 },
    'Mid': { excellent: 550, good: 450 },
    'Offlane': { excellent: 500, good: 400 },
    'Support': { excellent: 400, good: 320 },
    'Hard Support': { excellent: 350, good: 280 }
  };

  const thresholds = farmThresholds[_role] || farmThresholds['Support'];

  if (gpm >= thresholds.excellent) {
    strengths.push({
      category: 'Economy',
      title: 'Excellent Farm Efficiency',
      description: `Outstanding ${gpm} GPM for ${_role} role`,
      impact: 'Strong item progression and team contribution',
      maintainance: 'Continue current farming patterns and efficiency'
    });
  } else if (gpm >= thresholds.good) {
    strengths.push({
      category: 'Economy',
      title: 'Good Farm Management',
      description: `Solid ${gpm} GPM shows effective resource acquisition`,
      impact: 'Good economic foundation',
      maintainance: 'Maintain farming priorities and patterns'
    });
  }

  return strengths;
}

function analyzeImpactStrengths(playerData, _role) {
  const strengths = [];
  
  if ((playerData.hero_damage || 0) >= 25000) {
    strengths.push({
      category: 'Combat',
      title: 'High Damage Output',
      description: 'Exceptional damage contribution to team fights',
      impact: 'Strong team fight presence',
      maintainance: 'Continue aggressive positioning and target focus'
    });
  }

  if ((playerData.tower_damage || 0) >= 3000) {
    strengths.push({
      category: 'Objectives',
      title: 'Strong Objective Focus',
      description: 'Excellent structure damage and objective participation',
      impact: 'Good map control contribution',
      maintainance: 'Continue prioritizing objectives'
    });
  }

  return strengths;
}

function analyzeVisionStrengths(_playerData) {
  const strengths = [];
  const wardsPlaced = (_playerData.obs_placed || 0) + (_playerData.sen_placed || 0);
  
  if (wardsPlaced >= 20) {
    strengths.push({
      category: 'Vision',
      title: 'Excellent Vision Control',
      description: `Outstanding ${wardsPlaced} total wards provide great map awareness`,
      impact: 'Superior team positioning and map control',
      maintainance: 'Continue prioritizing vision and ward placement'
    });
  } else if (wardsPlaced >= 15) {
    strengths.push({
      category: 'Vision',
      title: 'Good Vision Contribution',
      description: `Solid ${wardsPlaced} wards help team positioning`,
      impact: 'Good map awareness support',
      maintainance: 'Maintain current warding patterns'
    });
  }

  return strengths;
}

function analyzeRoleSpecificStrengths(playerData, _role) {
  const strengths = [];
  
  switch (_role) {
    case 'Carry':
      if ((playerData.last_hits || 0) >= 250) {
        strengths.push({
          category: 'Farming',
          title: 'Excellent CS Performance',
          description: 'Outstanding last-hit efficiency for carry role',
          impact: 'Strong economic advantage',
          maintainance: 'Continue focusing on farm efficiency'
        });
      }
      break;
      
    case 'Support':
    case 'Hard Support':
      if ((playerData.hero_healing || 0) >= 8000) {
        strengths.push({
          category: 'Support',
          title: 'Excellent Team Healing',
          description: 'Outstanding healing contribution keeps team healthy',
          impact: 'Strong team sustainability',
          maintainance: 'Continue prioritizing team healing'
        });
      }
      break;
  }
  
  return strengths;
}

// Additional helper functions for coaching and tips would continue...
// This is a comprehensive framework that can be extended with more detailed analysis

function generateLaningCoaching(_playerData, _role) {
  // Implementation for laning phase coaching
  return [];
}

function generateMidGameCoaching(_playerData, _role) {
  // Implementation for mid game coaching
  return [];
}

function generateLateGameCoaching(_playerData, _matchData, _role) {
  // Implementation for late game coaching
  return [];
}

function generateRoleSpecificCoaching(_playerData, _role) {
  // Implementation for role-specific coaching
  return [];
}

function analyzeFarmingImprovement(_playerData, _role) {
  return { currentScore: 50, maxScore: 100 };
}

function analyzePositioningImprovement(_playerData) {
  return { currentScore: 60, maxScore: 100 };
}

function analyzeTeamfightingImprovement(_playerData) {
  return { currentScore: 55, maxScore: 100 };
}

function analyzeVisionImprovement(_playerData, _role) {
  return { currentScore: 40, maxScore: 100 };
}

function analyzeItemizationImprovement(_playerData, _role) {
  return { currentScore: 70, maxScore: 100 };
}

function generateImprovementRecommendations(_areas) {
  return [];
}

function getRoleSpecificTips(_role) {
  const roleTips = {
    'Carry': [
      {
        category: 'Farming',
        tip: 'Farm jungle camps between creep waves',
        difficulty: 'Medium',
        impact: 'High',
        timeframe: '1 week'
      }
    ],
    'Support': [
      {
        category: 'Vision',
        tip: 'Place wards before objectives spawn',
        difficulty: 'Easy',
        impact: 'High',
        timeframe: 'Immediate'
      }
    ]
  };
  
  return roleTips[_role] || [];
}

function getPerformanceBasedTips(_playerData, _role) {
  return [];
}

function getShortTermGoals(_playerData, _role) {
  return ['Improve map awareness', 'Reduce deaths by 20%'];
}

function getMediumTermGoals(_playerData, _role) {
  return ['Increase farm efficiency', 'Better team fight positioning'];
}

function getLongTermGoals(_playerData, _role) {
  return ['Master role-specific mechanics', 'Develop game sense'];
}

function analyzeCarryPerformance(_playerData) {
  return {
    farmingEfficiency: 75,
    teamfightPositioning: 60,
    itemProgression: 70,
    lateGameImpact: 65
  };
}

function analyzeMidPerformance(_playerData) {
  return {
    laningPhase: 70,
    mapImpact: 60,
    teamfightDamage: 75,
    leadership: 50
  };
}

function analyzeOfflanePerformance(_playerData) {
  return {
    survivability: 65,
    initiation: 60,
    spaceCreation: 70,
    teamfightContribution: 65
  };
}

function analyzeSupportPerformance(_playerData) {
  return {
    visionControl: 60,
    teamSupport: 70,
    positioning: 65,
    itemUtility: 55
  };
}

function analyzeHardSupportPerformance(_playerData) {
  return {
    visionControl: 70,
    dewarding: 55,
    teamSupport: 75,
    sacrificial: 60
  };
}