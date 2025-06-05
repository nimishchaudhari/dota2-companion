// Benchmark comparison utilities for percentile calculations

/**
 * Calculate percentile score against benchmarks
 * @param {number} playerValue - Player's actual value for the metric
 * @param {Object} benchmarks - Benchmark data from OpenDota API
 * @param {string} metric - The metric name to compare
 * @param {number} weight - Weight for this metric in overall calculation
 * @returns {Object} Percentile information and score
 */
export async function calculateBenchmarkComparison(playerValue, benchmarks, metric, weight = 1.0) {
  // Handle missing benchmarks
  if (!benchmarks?.result?.[metric]) {
    console.warn(`[BENCHMARKS] No benchmark data available for ${metric}`);
    return getBenchmarkFallback(playerValue, metric, weight);
  }

  const benchmarkData = benchmarks.result[metric];
  const percentile = calculatePercentile(playerValue, benchmarkData);
  const grade = percentileToGrade(percentile);
  const comparison = getComparisonText(percentile);

  return {
    metric,
    playerValue,
    percentile,
    grade,
    comparison,
    weight,
    weightedScore: percentile * weight,
    benchmarkData: {
      p10: benchmarkData[0]?.value || 0,
      p25: benchmarkData[1]?.value || 0,
      p50: benchmarkData[2]?.value || 0,
      p75: benchmarkData[3]?.value || 0,
      p90: benchmarkData[4]?.value || 0,
      p99: benchmarkData[7]?.value || 0
    },
    interpretation: getPerformanceInterpretation(percentile, metric)
  };
}

/**
 * Calculate percentile based on benchmark distribution
 */
function calculatePercentile(playerValue, benchmarkData) {
  if (!benchmarkData || !Array.isArray(benchmarkData)) {
    return 50; // Default to 50th percentile
  }

  // OpenDota benchmark format: array of objects with percentile and value
  // Find where player value fits in the distribution
  for (let i = 0; i < benchmarkData.length; i++) {
    const benchmark = benchmarkData[i];
    if (playerValue <= benchmark.value) {
      // Interpolate between percentiles for more accuracy
      if (i === 0) {
        return Math.min(benchmark.percentile, (playerValue / benchmark.value) * benchmark.percentile);
      }
      
      const prevBenchmark = benchmarkData[i - 1];
      const range = benchmark.value - prevBenchmark.value;
      const position = playerValue - prevBenchmark.value;
      const percentileRange = benchmark.percentile - prevBenchmark.percentile;
      
      return prevBenchmark.percentile + (position / range) * percentileRange;
    }
  }

  // If player value exceeds all benchmarks, extrapolate
  const highestBenchmark = benchmarkData[benchmarkData.length - 1];
  if (playerValue > highestBenchmark.value) {
    // Cap at 99th percentile for extremely high values
    return Math.min(99, highestBenchmark.percentile + 
      ((playerValue - highestBenchmark.value) / highestBenchmark.value) * 10);
  }

  return 50; // Fallback
}

/**
 * Convert percentile to letter grade
 */
function percentileToGrade(percentile) {
  if (percentile >= 90) return 'S';
  if (percentile >= 80) return 'A';
  if (percentile >= 70) return 'B';
  if (percentile >= 50) return 'C';
  return 'D';
}

/**
 * Get comparison text for percentile
 */
function getComparisonText(percentile) {
  if (percentile >= 95) return 'Exceptional';
  if (percentile >= 90) return 'Excellent';
  if (percentile >= 80) return 'Very Good';
  if (percentile >= 70) return 'Good';
  if (percentile >= 60) return 'Above Average';
  if (percentile >= 40) return 'Average';
  if (percentile >= 25) return 'Below Average';
  if (percentile >= 10) return 'Poor';
  return 'Very Poor';
}

/**
 * Get detailed performance interpretation
 */
function getPerformanceInterpretation(percentile, metric) {
  const interpretations = {
    'last_hits': {
      high: 'Excellent farming efficiency - maintaining strong CS throughout the game',
      medium: 'Decent farming with room for improvement in CS consistency',
      low: 'Focus on improving last-hitting mechanics and farming patterns'
    },
    'gold_per_min': {
      high: 'Outstanding farm priority and resource acquisition',
      medium: 'Solid economy management with potential for optimization',
      low: 'Need to improve farming efficiency and resource utilization'
    },
    'xp_per_min': {
      high: 'Excellent positioning and experience gain optimization',
      medium: 'Good experience acquisition with room for improvement',
      low: 'Focus on staying in experience range and efficient rotations'
    },
    'hero_damage': {
      high: 'Exceptional damage output and team fight contribution',
      medium: 'Solid damage dealing with potential for higher impact',
      low: 'Need to improve positioning and damage output in fights'
    },
    'tower_damage': {
      high: 'Great objective focus and structure damage',
      medium: 'Good objective participation',
      low: 'Increase focus on taking towers and objectives'
    },
    'hero_healing': {
      high: 'Outstanding support contribution and teammate sustainability',
      medium: 'Good healing output for team preservation',
      low: 'Consider items or abilities that provide team healing'
    },
    'obs_placed': {
      high: 'Excellent vision control and map awareness',
      medium: 'Good vision contribution with room for more wards',
      low: 'Significantly increase ward placement for map control'
    },
    'sen_placed': {
      high: 'Great counter-warding and vision denial',
      medium: 'Decent dewarding efforts',
      low: 'Invest more in sentry wards to deny enemy vision'
    },
    'assists': {
      high: 'Exceptional team fight participation and support',
      medium: 'Good team contribution',
      low: 'Increase team fight participation and positioning'
    },
    'kills': {
      high: 'Outstanding kill securing and impact',
      medium: 'Good kill participation',
      low: 'Work on positioning for kill opportunities'
    }
  };

  const metricInterpretations = interpretations[metric] || {
    high: 'Strong performance in this area',
    medium: 'Average performance with room for growth',
    low: 'Area needing significant improvement'
  };

  if (percentile >= 75) return metricInterpretations.high;
  if (percentile >= 40) return metricInterpretations.medium;
  return metricInterpretations.low;
}

/**
 * Get fallback benchmarks when API data is unavailable
 */
function getBenchmarkFallback(playerValue, metric, weight) {
  const staticBenchmarks = {
    'last_hits': { excellent: 300, good: 200, average: 120, poor: 60 },
    'gold_per_min': { excellent: 600, good: 450, average: 350, poor: 250 },
    'xp_per_min': { excellent: 650, good: 500, average: 400, poor: 300 },
    'hero_damage': { excellent: 40000, good: 25000, average: 15000, poor: 8000 },
    'tower_damage': { excellent: 5000, good: 2500, average: 1200, poor: 500 },
    'hero_healing': { excellent: 15000, good: 8000, average: 4000, poor: 1000 },
    'obs_placed': { excellent: 20, good: 12, average: 8, poor: 3 },
    'sen_placed': { excellent: 15, good: 8, average: 5, poor: 2 },
    'assists': { excellent: 25, good: 15, average: 10, poor: 5 },
    'kills': { excellent: 15, good: 8, average: 5, poor: 2 },
    'deaths': { excellent: 3, good: 5, average: 8, poor: 12, inverse: true }
  };

  const benchmarks = staticBenchmarks[metric];
  if (!benchmarks) {
    return {
      metric,
      playerValue,
      percentile: 50,
      grade: 'C',
      comparison: 'Average',
      weight,
      weightedScore: 50 * weight,
      source: 'fallback',
      interpretation: 'Unable to determine performance level'
    };
  }

  let percentile;
  if (benchmarks.inverse) {
    // For metrics where lower is better (like deaths)
    if (playerValue <= benchmarks.excellent) percentile = 95;
    else if (playerValue <= benchmarks.good) percentile = 75;
    else if (playerValue <= benchmarks.average) percentile = 50;
    else if (playerValue <= benchmarks.poor) percentile = 25;
    else percentile = 10;
  } else {
    // For metrics where higher is better
    if (playerValue >= benchmarks.excellent) percentile = 95;
    else if (playerValue >= benchmarks.good) percentile = 75;
    else if (playerValue >= benchmarks.average) percentile = 50;
    else if (playerValue >= benchmarks.poor) percentile = 25;
    else percentile = 10;
  }

  return {
    metric,
    playerValue,
    percentile,
    grade: percentileToGrade(percentile),
    comparison: getComparisonText(percentile),
    weight,
    weightedScore: percentile * weight,
    benchmarkData: benchmarks,
    source: 'static',
    interpretation: getPerformanceInterpretation(percentile, metric)
  };
}

/**
 * Calculate overall performance score from multiple benchmarks
 */
export function calculateOverallPerformanceScore(benchmarkResults) {
  if (!benchmarkResults.length) return 0;

  const totalWeight = benchmarkResults.reduce((sum, result) => sum + result.weight, 0);
  const weightedSum = benchmarkResults.reduce((sum, result) => sum + result.weightedScore, 0);

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Get role-specific benchmark weights
 */
export function getRoleBenchmarkWeights(role) {
  const roleWeights = {
    'Carry': {
      'last_hits': 0.25,
      'gold_per_min': 0.25,
      'hero_damage': 0.20,
      'tower_damage': 0.15,
      'deaths': 0.15
    },
    'Mid': {
      'xp_per_min': 0.25,
      'hero_damage': 0.25,
      'kills': 0.20,
      'last_hits': 0.15,
      'gold_per_min': 0.15
    },
    'Offlane': {
      'assists': 0.25,
      'tower_damage': 0.20,
      'hero_damage': 0.20,
      'deaths': 0.20,
      'gold_per_min': 0.15
    },
    'Support': {
      'obs_placed': 0.30,
      'assists': 0.25,
      'hero_healing': 0.20,
      'sen_placed': 0.15,
      'deaths': 0.10
    },
    'Hard Support': {
      'obs_placed': 0.35,
      'sen_placed': 0.25,
      'assists': 0.20,
      'hero_healing': 0.15,
      'deaths': 0.05
    }
  };

  return roleWeights[role] || roleWeights['Support'];
}

/**
 * Compare performance across multiple matches
 */
export function comparePerformanceAcrossMatches(matchBenchmarks) {
  const metrics = {};
  
  // Aggregate data across matches
  matchBenchmarks.forEach(match => {
    Object.entries(match.benchmarks).forEach(([metric, data]) => {
      if (!metrics[metric]) {
        metrics[metric] = {
          values: [],
          percentiles: [],
          grades: []
        };
      }
      
      metrics[metric].values.push(data.playerValue);
      metrics[metric].percentiles.push(data.percentile);
      metrics[metric].grades.push(data.grade);
    });
  });

  // Calculate trends and improvements
  const analysis = {};
  Object.entries(metrics).forEach(([metric, data]) => {
    const recent = data.percentiles.slice(-5); // Last 5 matches
    const earlier = data.percentiles.slice(-10, -5); // 5 matches before that

    analysis[metric] = {
      current: data.percentiles[data.percentiles.length - 1] || 0,
      average: data.percentiles.reduce((sum, p) => sum + p, 0) / data.percentiles.length,
      trend: calculateTrend(recent, earlier),
      consistency: calculateConsistency(data.percentiles),
      improvement: calculateImprovement(data.percentiles)
    };
  });

  return analysis;
}

/**
 * Calculate performance trend
 */
function calculateTrend(recent, earlier) {
  if (!recent.length || !earlier.length) return 'stable';
  
  const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, p) => sum + p, 0) / earlier.length;
  
  const difference = recentAvg - earlierAvg;
  
  if (difference > 10) return 'improving';
  if (difference < -10) return 'declining';
  return 'stable';
}

/**
 * Calculate performance consistency
 */
function calculateConsistency(percentiles) {
  if (percentiles.length < 2) return 100;
  
  const average = percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length;
  const variance = percentiles.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / percentiles.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Lower standard deviation = higher consistency
  const consistencyScore = Math.max(0, 100 - standardDeviation);
  return Math.round(consistencyScore);
}

/**
 * Calculate improvement rate
 */
function calculateImprovement(percentiles) {
  if (percentiles.length < 3) return 0;
  
  // Linear regression to find improvement slope
  const n = percentiles.length;
  const xSum = (n * (n + 1)) / 2; // Sum of 1, 2, 3, ..., n
  const ySum = percentiles.reduce((sum, p) => sum + p, 0);
  const xySum = percentiles.reduce((sum, p, i) => sum + p * (i + 1), 0);
  const x2Sum = (n * (n + 1) * (2 * n + 1)) / 6; // Sum of 1², 2², 3², ..., n²
  
  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  
  return Math.round(slope * 10) / 10; // Round to 1 decimal place
}

/**
 * Generate benchmark-based recommendations
 */
export function generateBenchmarkRecommendations(benchmarkResults, role) {
  const recommendations = [];
  const roleWeights = getRoleBenchmarkWeights(role);
  
  // Find weakest performing metrics
  const weakestMetrics = benchmarkResults
    .filter(result => result.percentile < 50)
    .sort((a, b) => (a.percentile * (roleWeights[a.metric] || 0.1)) - 
                    (b.percentile * (roleWeights[b.metric] || 0.1)))
    .slice(0, 3); // Top 3 weakest areas

  weakestMetrics.forEach(metric => {
    const recommendation = getMetricRecommendation(metric.metric, metric.percentile, role);
    if (recommendation) {
      recommendations.push({
        priority: metric.percentile < 25 ? 'High' : 'Medium',
        category: getMetricCategory(metric.metric),
        metric: metric.metric,
        currentPercentile: metric.percentile,
        recommendation: recommendation.suggestion,
        actionable: recommendation.actionable,
        timeframe: recommendation.timeframe
      });
    }
  });

  return recommendations;
}

/**
 * Get specific recommendations for metrics
 */
function getMetricRecommendation(metric, percentile, role) {
  const recommendations = {
    'last_hits': {
      suggestion: 'Practice last-hitting in demo mode daily. Focus on creep aggro mechanics and timing.',
      actionable: ['Spend 10 minutes in demo mode before playing', 'Learn creep wave manipulation', 'Use audio cues for last-hit timing'],
      timeframe: '1-2 weeks of practice'
    },
    'gold_per_min': {
      suggestion: 'Improve farming patterns and efficiency. Focus on farming dangerous areas when safe.',
      actionable: ['Farm jungle camps between waves', 'Stack camps when possible', 'Avoid idle time'],
      timeframe: '2-3 weeks'
    },
    'xp_per_min': {
      suggestion: 'Stay in experience range more often. Avoid unnecessary rotations.',
      actionable: ['Position safely in team fights', 'Share experience in lane when possible', 'Avoid deaths that lose experience'],
      timeframe: '1-2 weeks'
    },
    'hero_damage': {
      suggestion: 'Improve positioning in team fights. Build more damage-oriented items.',
      actionable: ['Stay at maximum spell/attack range', 'Focus priority targets', 'Build damage items appropriate for role'],
      timeframe: '2-4 weeks'
    },
    'obs_placed': {
      suggestion: 'Place wards more frequently. Focus on high-impact ward spots.',
      actionable: ['Ward before objectives', 'Place aggressive wards when ahead', 'Maintain vision on key areas'],
      timeframe: '1 week'
    },
    'sen_placed': {
      suggestion: 'Invest more in sentry wards for dewarding. Counter enemy vision.',
      actionable: ['Buy sentries before taking objectives', 'Deward common ward spots', 'Use sentries to protect key areas'],
      timeframe: '1-2 weeks'
    },
    'assists': {
      suggestion: 'Participate more in team fights. Improve positioning to help teammates.',
      actionable: ['Follow team rotations', 'Use spells to help teammates escape', 'Join fights earlier'],
      timeframe: '1-2 weeks'
    },
    'deaths': {
      suggestion: 'Focus on positioning and map awareness. Avoid risky plays.',
      actionable: ['Check minimap every 3-5 seconds', 'Retreat when outnumbered', 'Buy defensive items when behind'],
      timeframe: '2-3 weeks'
    }
  };

  return recommendations[metric];
}

/**
 * Get metric category for organization
 */
function getMetricCategory(metric) {
  const categories = {
    'last_hits': 'Farming',
    'gold_per_min': 'Economy',
    'xp_per_min': 'Experience',
    'hero_damage': 'Combat',
    'tower_damage': 'Objectives',
    'hero_healing': 'Support',
    'obs_placed': 'Vision',
    'sen_placed': 'Vision',
    'assists': 'Team Fighting',
    'kills': 'Combat',
    'deaths': 'Survivability'
  };

  return categories[metric] || 'General';
}