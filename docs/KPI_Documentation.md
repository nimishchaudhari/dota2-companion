# Dota 2 Match Analysis KPI Documentation

## Overview

This document provides comprehensive documentation for all Key Performance Indicators (KPIs) used in the Dota 2 Match Analysis system. Each metric includes detailed calculation formulas, grading systems, and performance benchmarks.

## Table of Contents

1. [Core Performance Metrics](#core-performance-metrics)
2. [Role-Specific KPIs](#role-specific-kpis)
3. [Grading System](#grading-system)
4. [Benchmark Sources](#benchmark-sources)
5. [Vision Score Formula](#vision-score-formula)
6. [Coaching Algorithm](#coaching-algorithm)
7. [API Data Mapping](#api-data-mapping)

---

## Core Performance Metrics

### 1. KDA Ratio
**Formula:** `(Kills + Assists) / max(Deaths, 1)`

**Purpose:** Measures kill participation effectiveness and death avoidance
- **Excellent:** ≥ 4.0
- **Good:** 2.5 - 3.9
- **Average:** 1.5 - 2.4
- **Poor:** < 1.5

**API Source:** `playerData.kills`, `playerData.deaths`, `playerData.assists`

### 2. Gold Per Minute (GPM)
**Formula:** `Total Gold Earned / (Match Duration in Minutes)`

**Purpose:** Measures farming efficiency and economic performance
- **Role-based benchmarks:**
  - Carry: 500+ (Good), 600+ (Excellent)
  - Mid: 450+ (Good), 550+ (Excellent)
  - Offlane: 400+ (Good), 500+ (Excellent)
  - Support: 300+ (Good), 400+ (Excellent)
  - Hard Support: 250+ (Good), 350+ (Excellent)

**API Source:** `playerData.gold_per_min`

### 3. Experience Per Minute (XPM)
**Formula:** `Total Experience Gained / (Match Duration in Minutes)`

**Purpose:** Measures positioning and experience optimization
- **Excellent:** ≥ 650
- **Good:** 500-649
- **Average:** 400-499
- **Poor:** < 400

**API Source:** `playerData.xp_per_min`

### 4. Last Hits Efficiency
**Formula:** `Last Hits / (Match Duration in Minutes)`

**Purpose:** Measures farming mechanics and lane efficiency
- **Carry/Mid:**
  - Excellent: ≥ 8 CS/min
  - Good: 6-7.9 CS/min
  - Average: 4-5.9 CS/min
  - Poor: < 4 CS/min
- **Support roles have lower expectations**

**API Source:** `playerData.last_hits`

### 5. Hero Damage
**Formula:** `Total Damage to Enemy Heroes`

**Purpose:** Measures combat impact and team fight contribution
- **Role-based benchmarks:**
  - Carry/Mid: 25,000+ (Good), 40,000+ (Excellent)
  - Offlane: 20,000+ (Good), 30,000+ (Excellent)
  - Support: 15,000+ (Good), 25,000+ (Excellent)

**API Source:** `playerData.hero_damage`

---

## Role-Specific KPIs

### Carry Role Metrics

#### Farm Priority Score
**Formula:** `(Player GPM / Team Average GPM) * 100`

**Purpose:** Measures farm distribution efficiency
- **Target:** 120-150% of team average
- **Calculation:** Higher values indicate proper farm priority

#### Late Game Impact
**Formula:** `(Hero Damage + Tower Damage) / Net Worth * 100`

**Purpose:** Measures damage efficiency per gold invested
- **Excellent:** ≥ 3.0
- **Good:** 2.0-2.9
- **Poor:** < 1.5

### Support Role Metrics

#### Ward Efficiency Score
**Formula:** `(Observer Wards Placed * 10) + (Sentry Wards Placed * 8) + (Enemy Wards Destroyed * 15)`

**Purpose:** Comprehensive vision contribution measurement
- **Hard Support Target:** 150+ points
- **Support Target:** 100+ points

#### Save Performance
**Formula:** `(Hero Healing + Assists * 500) / 1000`

**Purpose:** Measures team preservation and assistance
- **Target:** 15+ for Hard Support, 10+ for Support

### Mid Role Metrics

#### Map Impact Score
**Formula:** `(Kills * 10) + (Assists * 5) + (Tower Damage / 100)`

**Purpose:** Measures influence across the map
- **Excellent:** ≥ 200
- **Good:** 150-199
- **Average:** 100-149

#### Experience Advantage
**Formula:** `Player XPM / Team Average XPM * 100`

**Purpose:** Measures solo lane efficiency
- **Target:** 110-130% of team average

### Offlane Role Metrics

#### Space Creation Score
**Formula:** `(Tower Damage / 100) + (Assists * 2) + (100 - Deaths * 10)`

**Purpose:** Measures utility and survival in difficult lane
- **Excellent:** ≥ 150
- **Good:** 100-149
- **Poor:** < 75

#### Survivability Rating
**Formula:** `max(0, 100 - Deaths * 12)`

**Purpose:** Measures death avoidance in high-risk role
- **Excellent:** ≥ 75 (≤3 deaths)
- **Good:** 50-74 (4-5 deaths)
- **Poor:** < 50 (6+ deaths)

---

## Grading System

### Overall Performance Grades

| Grade | Percentile Range | Description | Color Code |
|-------|-----------------|-------------|------------|
| S | 90-100% | Outstanding | Gold (#FFD700) |
| A | 80-89% | Excellent | Green (#00FF00) |
| B | 70-79% | Good | Blue (#00BFFF) |
| C | 50-69% | Average | Orange (#FFA500) |
| D | 0-49% | Below Average | Red (#FF4500) |

### Grade Calculation Formula
```javascript
function calculateOverallGrade(metrics, roleWeights) {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [metric, data] of Object.entries(metrics)) {
    const weight = roleWeights[metric] || 0.1;
    totalScore += data.percentile * weight;
    totalWeight += weight;
  }
  
  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 50;
  
  if (finalScore >= 90) return 'S';
  if (finalScore >= 80) return 'A';
  if (finalScore >= 70) return 'B';
  if (finalScore >= 50) return 'C';
  return 'D';
}
```

### Weighted Scoring by Role

#### Carry Weights
- CS Efficiency: 25%
- Farm Speed: 25%
- Late Game Impact: 20%
- Death Avoidance: 15%
- Objective Damage: 15%

#### Mid Weights
- Experience Gain: 25%
- Hero Damage: 25%
- Map Impact: 20%
- CS Efficiency: 15%
- Farm Speed: 15%

#### Offlane Weights
- Survivability: 30%
- Space Creation: 25%
- Team Fight Contribution: 20%
- Objective Damage: 15%
- Farm Efficiency: 10%

#### Support Weights
- Ward Efficiency: 35%
- Team Support: 25%
- Death Avoidance: 20%
- Hero Healing: 15%
- Dewarding: 5%

#### Hard Support Weights
- Vision Control: 40%
- Dewarding: 25%
- Team Support: 20%
- Hero Healing: 10%
- Survivability: 5%

---

## Benchmark Sources

### Primary: OpenDota Benchmarks API
**Endpoint:** `/benchmarks?hero_id={hero_id}`

**Data Structure:**
```json
{
  "result": {
    "metric_name": [
      {"percentile": 10, "value": 150},
      {"percentile": 25, "value": 200},
      {"percentile": 50, "value": 300},
      {"percentile": 75, "value": 450},
      {"percentile": 90, "value": 600}
    ]
  }
}
```

### Fallback: Static Benchmarks
Used when API data unavailable:

```javascript
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
```

---

## Vision Score Formula

### Complete Vision Score Calculation
```javascript
function calculateVisionScore(playerData, matchData) {
  const duration = matchData.duration / 60; // Convert to minutes
  let score = 0;
  
  // Base ward placement scoring
  score += (playerData.obs_placed || 0) * 10;
  score += (playerData.sen_placed || 0) * 8;
  
  // Dewarding scoring (higher value)
  score += (playerData.observer_kills || 0) * 15;
  score += (playerData.sentry_kills || 0) * 12;
  
  // Time-based normalization (45-minute standard)
  if (duration > 0) {
    score = score / duration * 45;
  }
  
  // Role-based multipliers
  const roleMultipliers = {
    'Hard Support': 1.0,
    'Support': 0.9,
    'Offlane': 0.7,
    'Mid': 0.6,
    'Carry': 0.5
  };
  
  const multiplier = roleMultipliers[role] || 1.0;
  score *= multiplier;
  
  return Math.round(score);
}
```

### Vision Grade Mapping
- **S Grade:** ≥ 150 points
- **A Grade:** 100-149 points
- **B Grade:** 70-99 points
- **C Grade:** 40-69 points
- **D Grade:** < 40 points

### Component Breakdown

#### Ward Uptime Calculation
```javascript
function calculateWardUptime(playerData, matchDuration) {
  const obsPlaced = playerData.obs_placed || 0;
  const wardLifetime = 420; // 7 minutes per observer ward
  
  const maxPossibleUptime = matchDuration; // seconds
  const actualUptime = obsPlaced * wardLifetime;
  
  return Math.min(100, Math.round((actualUptime / maxPossibleUptime) * 100));
}
```

#### Deward Efficiency
```javascript
function calculateDewardEfficiency(playerData) {
  const wardsKilled = (playerData.observer_kills || 0) + (playerData.sentry_kills || 0);
  const sentryWardsBought = playerData.purchase?.ward_sentry || 0;
  
  return sentryWardsBought > 0 ? 
    Math.round((wardsKilled / sentryWardsBought) * 100) : 0;
}
```

---

## Coaching Algorithm

### Insight Generation Pipeline

#### 1. Mistake Identification
```javascript
function identifyMistakes(playerData, matchData, role) {
  const mistakes = [];
  
  // Critical thresholds
  const thresholds = {
    deaths: { critical: 10, major: 7, minor: 5 },
    gpm: getRoleGPMThreshold(role),
    wardPlacement: getRoleWardThreshold(role)
  };
  
  // Death analysis
  if (playerData.deaths >= thresholds.deaths.critical) {
    mistakes.push({
      type: 'critical',
      category: 'Positioning',
      priority: 1,
      impact: 'High MMR Loss Risk',
      improvement: generateDeathAnalysis(playerData)
    });
  }
  
  return mistakes.sort((a, b) => a.priority - b.priority);
}
```

#### 2. Strength Recognition
```javascript
function identifyStrengths(playerData, role) {
  const strengths = [];
  const benchmarks = getRoleBenchmarks(role);
  
  Object.entries(benchmarks).forEach(([metric, threshold]) => {
    const playerValue = playerData[metric] || 0;
    if (playerValue >= threshold.excellent) {
      strengths.push({
        category: getMetricCategory(metric),
        metric,
        value: playerValue,
        benchmark: threshold.excellent,
        description: generateStrengthDescription(metric, playerValue)
      });
    }
  });
  
  return strengths;
}
```

#### 3. Improvement Scoring
```javascript
function calculateImprovementScore(playerData, role) {
  const areas = {
    farming: analyzeFarmingPotential(playerData, role),
    positioning: analyzePositioningPotential(playerData),
    teamfighting: analyzeTeamfightPotential(playerData),
    vision: analyzeVisionPotential(playerData, role)
  };
  
  const currentScore = Object.values(areas).reduce((sum, area) => 
    sum + area.current, 0) / Object.keys(areas).length;
    
  return {
    current: Math.round(currentScore),
    potential: Math.round(100 - currentScore),
    areas,
    priority: getImprovementPriority(areas)
  };
}
```

### Recommendation Generation

#### Priority System
1. **Critical (Priority 1):** Game-losing issues (>10 deaths, extremely low farm)
2. **Major (Priority 2):** Significant improvements (positioning, farm efficiency)
3. **Minor (Priority 3):** Optimization opportunities (advanced techniques)

#### Actionable Tips Framework
```javascript
function generateActionableTips(playerData, role) {
  return [
    {
      category: 'Map Awareness',
      tip: 'Check minimap every 3-5 seconds',
      difficulty: 'Easy',
      impact: 'High',
      timeframe: 'Immediate',
      measurement: 'Track death reduction'
    },
    {
      category: 'Farming',
      tip: 'Stack jungle camps during downtime',
      difficulty: 'Medium',
      impact: 'High',
      timeframe: '1-2 weeks',
      measurement: 'GPM improvement'
    }
  ];
}
```

---

## API Data Mapping

### OpenDota Match API Fields

#### Core Player Data
| API Field | KPI Usage | Description |
|-----------|-----------|-------------|
| `account_id` | Player identification | Unique player identifier |
| `hero_id` | Hero-specific benchmarks | Hero played in match |
| `player_slot` | Team/position detection | Radiant(0-4) or Dire(128-132) |
| `kills` | KDA calculation | Hero kills |
| `deaths` | KDA, positioning analysis | Deaths count |
| `assists` | KDA, support metrics | Kill assists |
| `last_hits` | Farm efficiency | Creep last hits |
| `gold_per_min` | Economy analysis | Gold farming rate |
| `xp_per_min` | Experience efficiency | Experience gain rate |
| `hero_damage` | Combat contribution | Damage to enemy heroes |
| `tower_damage` | Objective focus | Damage to structures |
| `hero_healing` | Support contribution | Healing provided |

#### Vision Data
| API Field | KPI Usage | Description |
|-----------|-----------|-------------|
| `obs_placed` | Vision score | Observer wards placed |
| `sen_placed` | Vision score | Sentry wards placed |
| `observer_kills` | Dewarding efficiency | Enemy observer wards destroyed |
| `sentry_kills` | Dewarding efficiency | Enemy sentry wards destroyed |

#### Advanced Metrics
| API Field | KPI Usage | Description |
|-----------|-----------|-------------|
| `teamfight_participation` | Combat analysis | Team fight involvement |
| `purchase_log` | Item analysis | All item purchases |
| `gold_t` | Economy progression | Gold over time array |
| `xp_t` | Experience progression | XP over time array |
| `lh_t` | Farm progression | Last hits over time |

#### Calculated Fields
```javascript
// Derived metrics not directly from API
const calculatedMetrics = {
  laneOutcome: calculateLaneOutcome(playerData),
  farmPriority: calculateFarmPriority(playerData, teamData),
  impactScore: calculateImpactScore(playerData, role),
  positioningScore: calculatePositioningScore(playerData),
  visionScore: calculateVisionScore(playerData, matchData),
  improvementPotential: calculateImprovementScore(playerData, role)
};
```

### Data Quality Assessment
```javascript
function assessDataQuality(matchData) {
  return {
    isParsed: !!matchData.version,
    hasDetailedLogs: !!matchData.logs,
    hasItemProgression: !!matchData.purchase_log,
    hasPositionalData: !!(matchData.gold_t && matchData.xp_t),
    qualityScore: calculateQualityScore(matchData)
  };
}
```

---

## Implementation Notes

### Performance Considerations
- All calculations cached for 10 minutes
- Benchmark API calls cached for 30 minutes
- Batch API requests when possible
- Graceful fallbacks for missing data

### Error Handling
- Static benchmarks when API unavailable
- Default values for missing player data
- Role detection fallbacks based on player_slot
- Comprehensive data validation

### Rate Limiting
- Respect OpenDota 60 requests/minute limit
- Implement exponential backoff for failures
- Queue non-critical requests
- Cache aggressively to minimize API calls

---

## Future Enhancements

### Planned Metrics
1. **Item Build Efficiency** - Compare to meta builds
2. **Spell Usage Optimization** - Ability usage timing
3. **Map Movement Efficiency** - Pathing analysis
4. **Team Coordination Score** - Synchronization metrics

### Advanced Features
1. **Machine Learning Predictions** - Win probability analysis
2. **Replay Integration** - Frame-by-frame analysis
3. **Comparative Analysis** - Cross-match comparisons
4. **Real-time Coaching** - Live match recommendations

---

*Last Updated: June 5, 2025*
*Version: 1.0.0*