import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Typography, Space, Empty, Spin, Input, Select, Card, Modal, Tag, Tooltip, Progress, Skeleton } from 'antd';
import { SearchOutlined, FireOutlined, FilterOutlined, ReloadOutlined, CloudSyncOutlined } from '@ant-design/icons';
import { useData } from '../../../contexts/DataContext.jsx';
import { getHeroIcon, normalizeHeroName } from '../../../utils/assetHelpers.js';
import { 
  calculateHeroMastery, 
  getMasteryBadge,
  MASTERY_TIERS 
} from '../../../utils/masteryCalculations.js';
import { 
  analyzeHeroStreak, 
  getOverallMomentum
} from '../../../utils/streakAnalysis.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const { Title, Text } = Typography;

export const HeroMasteryProgressionWidget = React.memo(() => {
  const { 
    heroStats, 
    heroMap, 
    recentMatches, 
    loading, 
    refreshSection,
    loadEnhancedHeroData,
    getEnhancedHeroData,
    detailedMatches,
    refreshAllHeroAnalytics 
  } = useData();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('mastery');
  const [selectedHero, setSelectedHero] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [enhancedDataLoading, setEnhancedDataLoading] = useState(false);
  const [dataFreshness, setDataFreshness] = useState('fresh'); // 'fresh', 'stale', 'loading'

  // Transform hero data with enhanced analytics
  const heroMasteryData = useMemo(() => {
    if (!heroStats || !heroMap) return [];
    
    const heroesWithMastery = heroStats
      .filter(hero => hero.games >= 1)
      .map(hero => {
        const heroData = heroMap[hero.hero_id];
        const heroName = heroData?.localized_name || heroData?.name || `Hero ${hero.hero_id}`;
        
        // Calculate mastery and performance metrics
        const mastery = calculateHeroMastery(hero);
        const streakData = analyzeHeroStreak(recentMatches, hero.hero_id);
        
        // Get enhanced data if available, otherwise use basic calculations
        const enhancedData = getEnhancedHeroData(hero.hero_id);
        
        let avgGPM, avgXPM, avgCSPerMin, avgHeroDamage, performanceTrends, roleAnalysis;
        
        if (enhancedData && enhancedData.isEnhanced) {
          // Use enhanced analytics from detailed match data
          avgGPM = Math.round(enhancedData.averageGPM);
          avgXPM = Math.round(enhancedData.averageXPM);
          avgCSPerMin = Math.round(enhancedData.averageLastHits / 10) / 10; // Assuming 10min avg
          avgHeroDamage = Math.round(enhancedData.averageHeroDamage);
          performanceTrends = enhancedData.performanceTrends;
          roleAnalysis = enhancedData.roleAnalysis;
        } else {
          // Fallback to basic calculations with null handling
          const hasGPMData = hero.sum_gold_per_min != null && hero.sum_gold_per_min > 0;
          const hasXPMData = hero.sum_xp_per_min != null && hero.sum_xp_per_min > 0;
          const hasLastHitsData = hero.sum_last_hits != null && hero.sum_last_hits > 0;
          const hasHeroDamageData = hero.sum_hero_damage != null && hero.sum_hero_damage > 0;
          
          avgGPM = hasGPMData && hero.games > 0 ? Math.round(hero.sum_gold_per_min / hero.games) : null;
          avgXPM = hasXPMData && hero.games > 0 ? Math.round(hero.sum_xp_per_min / hero.games) : null;
          avgCSPerMin = hasLastHitsData && hero.games > 0 ? Math.round((hero.sum_last_hits / hero.games) / 10) / 10 : null;
          avgHeroDamage = hasHeroDamageData && hero.games > 0 ? Math.round(hero.sum_hero_damage / hero.games) : null;
          performanceTrends = null;
          roleAnalysis = null;
        }
        
        // Data completeness scoring for progressive enhancement
        const dataCompleteness = {
          basic: hero.games > 0 && hero.win != null, // Basic W/L data
          performance: avgGPM != null && avgXPM != null, // Performance metrics
          detailed: avgCSPerMin != null && avgHeroDamage != null, // Detailed combat stats
          recent: recentMatches && recentMatches.some(m => m.hero_id === hero.hero_id), // Recent match data
          enhanced: enhancedData && enhancedData.isEnhanced // Enhanced analytics from 1000+ games
        };
        
        const completenessScore = Object.values(dataCompleteness).filter(Boolean).length;
        const hasRichData = enhancedData && enhancedData.isEnhanced || completenessScore >= 3;
        
        // Performance tier calculation (S, A, B, C, D)
        const getPerformanceTier = () => {
          const winrate = mastery.stats.winrate;
          const kda = mastery.stats.kda;
          const farmScore = avgGPM && avgGPM > 500 ? 2 : avgGPM && avgGPM > 350 ? 1 : 0;
          const score = (winrate >= 65 ? 2 : winrate >= 55 ? 1 : 0) + 
                       (kda >= 2.5 ? 2 : kda >= 1.5 ? 1 : 0) + farmScore;
          
          if (score >= 5) return 'S';
          if (score >= 4) return 'A';
          if (score >= 3) return 'B';
          if (score >= 2) return 'C';
          return 'D';
        };

        return {
          ...hero,
          name: heroName,
          mastery,
          streakData,
          performance: {
            avgGPM,
            avgXPM,
            avgCSPerMin,
            avgHeroDamage,
            tier: getPerformanceTier()
          },
          performanceTrends,
          roleAnalysis,
          dataCompleteness,
          completenessScore,
          hasRichData,
          isEnhanced: enhancedData && enhancedData.isEnhanced,
          dataQuality: enhancedData ? enhancedData.dataQuality : 'basic',
          enhancementStatus: enhancedData && enhancedData.isEnhanced ? 'enhanced' : 
                           (hasRichData ? 'complete' : (completenessScore >= 2 ? 'partial' : 'basic'))
        };
      });

    // Apply search filter
    let filtered = heroesWithMastery;
    if (searchText) {
      filtered = filtered.filter(hero =>
        hero.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Enhanced sorting options
    switch (sortBy) {
      case 'mastery':
        return filtered.sort((a, b) => {
          if (a.mastery.level !== b.mastery.level) {
            return b.mastery.level - a.mastery.level;
          }
          return b.mastery.stats.games - a.mastery.stats.games;
        });
      case 'performance': {
        const tierOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
        return filtered.sort((a, b) => {
          const tierDiff = tierOrder[b.performance.tier] - tierOrder[a.performance.tier];
          if (tierDiff !== 0) return tierDiff;
          return b.mastery.stats.winrate - a.mastery.stats.winrate;
        });
      }
      case 'farm':
        return filtered.sort((a, b) => b.performance.avgGPM - a.performance.avgGPM);
      case 'recent':
        return filtered.sort((a, b) => {
          if (a.streakData.streakType === 'win' && b.streakData.streakType !== 'win') return -1;
          if (b.streakData.streakType === 'win' && a.streakData.streakType !== 'win') return 1;
          return b.streakData.winRate - a.streakData.winRate;
        });
      case 'games':
        return filtered.sort((a, b) => b.games - a.games);
      default:
        return filtered;
    }
  }, [heroStats, heroMap, recentMatches, searchText, sortBy, getEnhancedHeroData]);

  // Get momentum indicators for header
  const momentumData = useMemo(() => {
    if (!heroStats || !recentMatches) return null;
    return getOverallMomentum(recentMatches, heroStats);
  }, [heroStats, recentMatches]);

  const handleHeroClick = useCallback((hero) => {
    setSelectedHero(hero);
    setShowDetails(true);
    
    // Trigger enhanced data loading if hero data is not enhanced
    if (!hero.isEnhanced) {
      triggerEnhancedDataLoad(hero.hero_id);
    }
  }, [triggerEnhancedDataLoad]);
  
  const triggerEnhancedDataLoad = useCallback(async (heroId) => {
    if (enhancedDataLoading) return;
    
    setEnhancedDataLoading(true);
    setDataFreshness('loading');
    
    try {
      // Use the real enhanced data loading from DataContext
      await loadEnhancedHeroData(heroId);
      setDataFreshness('fresh');
    } catch (error) {
      console.error('Failed to load enhanced data:', error);
      setDataFreshness('stale');
    } finally {
      setEnhancedDataLoading(false);
    }
  }, [loadEnhancedHeroData, enhancedDataLoading]);
  
  const refreshWidgetData = useCallback(async () => {
    setDataFreshness('loading');
    await refreshSection('heroes');
    await refreshSection('matches');
    setDataFreshness('fresh');
  }, [refreshSection]);

  const loadAllEnhancedData = useCallback(async () => {
    setEnhancedDataLoading(true);
    setDataFreshness('loading');
    
    try {
      // Load enhanced analytics for all heroes
      await refreshAllHeroAnalytics();
      setDataFreshness('fresh');
    } catch (error) {
      console.error('Failed to load all enhanced data:', error);
      setDataFreshness('stale');
    } finally {
      setEnhancedDataLoading(false);
    }
  }, [refreshAllHeroAnalytics]);

  if (loading.heroes || loading.matches) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header with Data Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <Title level={5} className="text-white m-0" style={{ fontSize: '14px' }}>
            HERO MASTERY PROGRESSION
          </Title>
          <div className="flex items-center space-x-2">
            {dataFreshness === 'loading' && (
              <Tooltip title="Loading enhanced analytics">
                <CloudSyncOutlined className="text-cyan-400 animate-pulse" />
              </Tooltip>
            )}
            {dataFreshness === 'stale' && (
              <Tooltip title="Some data may be outdated">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              </Tooltip>
            )}
            {dataFreshness === 'fresh' && (
              <Tooltip title="Data is current">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </Tooltip>
            )}
            <Tooltip title="Refresh data">
              <ReloadOutlined 
                className="text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors" 
                onClick={refreshWidgetData}
              />
            </Tooltip>
          </div>
        </div>
        <Text type="secondary" className="uppercase tracking-wider" style={{ fontSize: '10px' }}>
          Performance analytics and mastery tracking • {heroMasteryData.filter(h => h.hasRichData).length}/{heroMasteryData.length} with enhanced data
        </Text>
      </div>

      {/* Momentum Indicators */}
      {momentumData && (momentumData.hotStreak || momentumData.coldSpell) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {momentumData.hotStreak && (
            <Tooltip title={`${momentumData.hotStreak.streak} game win streak`}>
              <Tag 
                color="success" 
                icon={<FireOutlined />}
                size="small"
              >
                🔥 {momentumData.hotStreak.heroName} ({momentumData.hotStreak.streak}W)
              </Tag>
            </Tooltip>
          )}
          {momentumData.coldSpell && (
            <Tooltip title={`${momentumData.coldSpell.streak} game loss streak`}>
              <Tag 
                color="processing" 
                size="small"
              >
                🧊 {momentumData.coldSpell.heroName} ({momentumData.coldSpell.streak}L)
              </Tag>
            </Tooltip>
          )}
        </div>
      )}

      {/* Enhanced Controls */}
      <Space className="mb-4" style={{ width: '100%' }}>
        <Input
          placeholder="Search heroes..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 160 }}
          size="small"
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 140 }}
          size="small"
          suffixIcon={<FilterOutlined />}
          options={[
            { label: 'Mastery Level', value: 'mastery' },
            { label: 'Performance', value: 'performance' },
            { label: 'Farm Efficiency', value: 'farm' },
            { label: 'Recent Form', value: 'recent' },
            { label: 'Experience', value: 'games' },
          ]}
        />
        {detailedMatches && detailedMatches.totalFetched < 100 && (
          <Tooltip title="Load 1000+ match history for enhanced analytics">
            <button
              onClick={loadAllEnhancedData}
              disabled={loading.detailedMatches || enhancedDataLoading}
              className="px-3 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors disabled:opacity-50"
            >
              {loading.detailedMatches ? '⏳' : '📊'} Enhance Data
            </button>
          </Tooltip>
        )}
      </Space>

      {/* Hero List */}
      <div className="flex-1 overflow-auto space-y-2">
        {heroMasteryData.length > 0 ? (
          heroMasteryData.slice(0, 8).map(hero => (
            <HeroMasteryCard 
              key={hero.hero_id} 
              hero={hero} 
              onClick={() => handleHeroClick(hero)}
            />
          ))
        ) : (
          <Empty
            description="No hero data found"
            className="h-full flex flex-col justify-center"
            imageStyle={{ height: 40 }}
          />
        )}
      </div>

      {/* View All Button */}
      {heroMasteryData.length > 8 && (
        <div className="mt-3 text-center">
          <Text 
            type="secondary" 
            className="cursor-pointer hover:text-cyan-400 text-xs transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-hero-progression'))}
          >
            View All {heroMasteryData.length} Heroes →
          </Text>
        </div>
      )}

      {/* Hero Details Modal */}
      <Modal
        title={
          <Space>
            {selectedHero && (
              <>
                <img
                  src={getHeroIcon(normalizeHeroName(selectedHero.name))}
                  alt={selectedHero.name}
                  className="w-8 h-8 rounded"
                />
                <span className="text-white">{selectedHero.name} - Performance Analysis</span>
              </>
            )}
          </Space>
        }
        open={showDetails}
        onCancel={() => setShowDetails(false)}
        footer={null}
        width={600}
      >
        {selectedHero && <HeroDetailView hero={selectedHero} />}
      </Modal>
    </div>
  );
});

// Enhanced Hero Mastery Card with Progressive Loading and Rich Analytics
const HeroMasteryCard = ({ hero, onClick }) => {
  const masteryBadge = getMasteryBadge(hero.mastery.tier);
  const winrate = Math.round((hero.win / hero.games) * 100);
  const kda = hero.mastery.stats.kda;
  // const [showEnhancedMetrics, setShowEnhancedMetrics] = useState(false);
  
  const getPerformanceTierColor = (tier) => {
    const colors = {
      S: 'text-orange-400',
      A: 'text-green-400', 
      B: 'text-cyan-400',
      C: 'text-yellow-400',
      D: 'text-gray-400'
    };
    return colors[tier] || 'text-gray-400';
  };

  return (
    <Card
      size="small"
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        hero.hasRichData 
          ? 'hover:border-cyan-400 border-cyan-500/30' 
          : hero.enhancementStatus === 'partial'
            ? 'hover:border-yellow-400 border-yellow-500/30'
            : 'hover:border-gray-400 border-gray-500/30'
      }`}
      style={{ 
        backgroundColor: hero.hasRichData ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${hero.hasRichData ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`
      }}
      onClick={onClick}
      bodyStyle={{ padding: '12px' }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Hero Icon + Basic Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0">
            <img
              src={getHeroIcon(normalizeHeroName(hero.name))}
              alt={hero.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Text strong className="text-white text-sm truncate pr-1">
                {hero.name}
              </Text>
              <Tag 
                color={masteryBadge.color}
                style={{ 
                  fontSize: '9px', 
                  padding: '0 4px',
                  lineHeight: '14px',
                  margin: 0
                }}
              >
                {masteryBadge.emoji}
              </Tag>
              {hero.performance.tier && (
                <span className={`text-xs font-bold ${getPerformanceTierColor(hero.performance.tier)}`}>
                  {hero.performance.tier}
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-400 space-x-1">
              <span>{hero.games}g</span>
              <span className="text-gray-500">•</span>
              <span className={winrate >= 60 ? 'text-green-400' : winrate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                {winrate}%
              </span>
              <span className="text-gray-500">•</span>
              <span className={kda >= 2.5 ? 'text-green-400' : kda >= 1.5 ? 'text-yellow-400' : 'text-red-400'}>
                {kda} KDA
              </span>
            </div>
          </div>
        </div>

        {/* Right: Enhanced Performance Metrics with Progressive Display */}
        <div className="text-right text-xs space-y-1">
          {hero.hasRichData ? (
            // Rich data display
            <>
              <div className={`${hero.performance.avgGPM && hero.performance.avgGPM > 500 ? 'text-green-400' : hero.performance.avgGPM && hero.performance.avgGPM > 350 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {hero.performance.avgGPM != null ? `${hero.performance.avgGPM} GPM` : 'Loading...'}
              </div>
              <div className={`${hero.performance.avgXPM && hero.performance.avgXPM > 600 ? 'text-green-400' : hero.performance.avgXPM && hero.performance.avgXPM > 450 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {hero.performance.avgXPM != null ? `${hero.performance.avgXPM} XPM` : 'Loading...'}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">
                  {hero.performance.avgCSPerMin != null ? `${hero.performance.avgCSPerMin}/min` : 'Loading...'}
                </span>
                <Tooltip title="Enhanced analytics available">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </Tooltip>
              </div>
            </>
          ) : hero.enhancementStatus === 'partial' ? (
            // Partial data with estimation indicators
            <>
              <div className="text-yellow-400">
                {hero.performance.avgGPM != null ? `${hero.performance.avgGPM} GPM` : '~Est. loading'}
              </div>
              <div className="text-yellow-400">
                {hero.performance.avgXPM != null ? `${hero.performance.avgXPM} XPM` : '~Est. loading'}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 text-xs">Click for details</span>
                <Tooltip title="Limited data - click to enhance">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                </Tooltip>
              </div>
            </>
          ) : (
            // Basic data with enhancement prompts
            <>
              <div className="text-gray-500">
                <Skeleton.Input size="small" style={{ width: 60, height: 12 }} active />
              </div>
              <div className="text-gray-500">
                <Skeleton.Input size="small" style={{ width: 60, height: 12 }} active />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 text-xs">Enhancing...</span>
                <Tooltip title="Building enhanced analytics">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

// Enhanced Hero Detail View with Progressive Analytics
const HeroDetailView = ({ hero }) => {
  // const { recentMatches } = useData();
  const masteryBadge = getMasteryBadge(hero.mastery.tier);
  const [analyticsLoading, setAnalyticsLoading] = useState(!hero.hasRichData);
  const [performanceTrends, setPerformanceTrends] = useState(null);
  
  // Simulate loading enhanced analytics data
  useEffect(() => {
    if (!hero.hasRichData) {
      const timer = setTimeout(() => {
        setAnalyticsLoading(false);
        // Simulate trend data
        setPerformanceTrends({
          gpmTrend: hero.performance.avgGPM ? '+5%' : null,
          winrateTrend: '+2.3%',
          kdaTrend: hero.mastery.stats.kda > 2 ? '+0.2' : '-0.1'
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hero.hasRichData, hero.performance.avgGPM, hero.mastery.stats.kda]);
  
  // Calculate detailed hero stats
  // const heroMatches = recentMatches?.filter(match => match.hero_id === hero.hero_id) || [];
  const avgHeroDamage = hero.performance.avgHeroDamage;
  // const avgTowerDamage = hero.games > 0 && hero.sum_tower_damage != null ? Math.round(hero.sum_tower_damage / hero.games) : null;
  const avgHeroHealing = hero.games > 0 && hero.sum_hero_healing != null ? Math.round(hero.sum_hero_healing / hero.games) : null;
  
  // Role analysis based on performance patterns
  const getRoleAnalysis = () => {
    const { avgGPM, avgCSPerMin } = hero.performance;
    
    // If no performance data available
    if (!avgGPM && !avgCSPerMin && !avgHeroDamage && !avgHeroHealing) {
      return { role: 'Unknown', confidence: 'None', description: 'Insufficient performance data available' };
    }
    
    if (avgGPM && avgCSPerMin && avgGPM > 500 && avgCSPerMin > 5) {
      return { role: 'Core', confidence: 'High', description: 'Strong farming patterns and gold income' };
    } else if ((avgHeroHealing && avgHeroHealing > 1000) || (avgGPM && avgGPM < 350 && hero.mastery.stats.kda > 2.5)) {
      return { role: 'Support', confidence: 'High', description: 'High healing/assist focus with lower farm priority' };
    } else if (avgGPM && avgHeroDamage && avgGPM > 400 && avgHeroDamage > 15000) {
      return { role: 'Semi-Core', confidence: 'Medium', description: 'Balanced farming and fighting approach' };
    } else {
      return { role: 'Flexible', confidence: 'Low', description: 'Varied playstyle across matches' };
    }
  };
  
  const roleAnalysis = getRoleAnalysis();
  
  // Performance insights
  const getPerformanceInsights = () => {
    const insights = [];
    
    if (hero.mastery.stats.kda > 3.0) {
      insights.push({ type: 'strength', text: 'Excellent KDA ratio indicates strong game impact' });
    } else if (hero.mastery.stats.kda < 1.5) {
      insights.push({ type: 'improvement', text: 'Focus on positioning and death reduction' });
    }
    
    if (hero.performance.avgGPM && hero.performance.avgGPM > 600) {
      insights.push({ type: 'strength', text: 'Outstanding farming efficiency' });
    } else if (hero.performance.avgGPM && hero.performance.avgGPM < 300) {
      insights.push({ type: 'improvement', text: 'Work on last hitting and farm optimization' });
    } else if (!hero.performance.avgGPM) {
      insights.push({ type: 'improvement', text: 'Farm efficiency data not available - focus on consistent farming' });
    }
    
    if (hero.mastery.stats.winrate > 65) {
      insights.push({ type: 'strength', text: 'Dominant win rate shows strong mastery' });
    } else if (hero.mastery.stats.winrate < 45) {
      insights.push({ type: 'improvement', text: 'Review builds and strategic decision making' });
    }
    
    return insights;
  };
  
  const insights = getPerformanceInsights();
  
  return (
    <div className="space-y-6">
      {/* Mastery Overview */}
      <div className="text-center">
        <div className="text-4xl mb-2">{masteryBadge.emoji}</div>
        <Title level={4} className="text-white mb-1">
          {masteryBadge.name} Mastery • Grade {hero.performance.tier}
        </Title>
        <Text type="secondary">
          Level {hero.mastery.level} • {hero.mastery.progress}% progress
        </Text>
      </div>

      {/* Enhanced Stats Grid with Data Quality Indicators */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{hero.games}</div>
          <div className="text-xs text-gray-400">Games</div>
          <div className="text-xs text-green-400">✓ Complete</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">{hero.mastery.stats.winrate}%</div>
          <div className="text-xs text-gray-400">Win Rate</div>
          {performanceTrends?.winrateTrend && (
            <div className="text-xs text-green-400">{performanceTrends.winrateTrend} trend</div>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold text-cyan-400">{hero.mastery.stats.kda}</div>
          <div className="text-xs text-gray-400">KDA</div>
          {performanceTrends?.kdaTrend && (
            <div className={`text-xs ${performanceTrends.kdaTrend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {performanceTrends.kdaTrend} recent
            </div>
          )}
        </div>
        <div className="relative">
          <div className={`text-2xl font-bold ${hero.performance.avgGPM && hero.performance.avgGPM > 500 ? 'text-green-400' : hero.performance.avgGPM ? 'text-yellow-400' : 'text-gray-400'}`}>
            {analyticsLoading ? (
              <Skeleton.Input size="small" style={{ width: 40, height: 24 }} active />
            ) : (
              hero.performance.avgGPM != null ? hero.performance.avgGPM : 'TBD'
            )}
          </div>
          <div className="text-xs text-gray-400">Avg GPM</div>
          {hero.hasRichData ? (
            <div className="text-xs text-cyan-400">✓ Enhanced</div>
          ) : analyticsLoading ? (
            <div className="text-xs text-yellow-400">⏳ Loading</div>
          ) : (
            <div className="text-xs text-gray-400">⚠ Limited</div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Title level={5} className="text-white mb-2">Farm & Economy</Title>
          {analyticsLoading ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text className="text-gray-300">Analyzing Performance...</Text>
                <Spin size="small" />
              </div>
              <Skeleton active paragraph={{ rows: 3, width: ['100%', '80%', '90%'] }} title={false} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Text className="text-gray-300">XPM:</Text>
                <div className="text-right">
                  <Text className={`${hero.performance.avgXPM && hero.performance.avgXPM > 600 ? 'text-green-400' : hero.performance.avgXPM && hero.performance.avgXPM > 450 ? 'text-yellow-400' : hero.performance.avgXPM ? 'text-red-400' : 'text-gray-400'}`}>
                    {hero.performance.avgXPM != null ? hero.performance.avgXPM : 'Calculating...'}
                  </Text>
                  {performanceTrends?.gpmTrend && (
                    <div className="text-xs text-green-400">{performanceTrends.gpmTrend} recent</div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Text className="text-gray-300">CS/Min:</Text>
                <div className="text-right">
                  <Text className="text-white">{hero.performance.avgCSPerMin != null ? hero.performance.avgCSPerMin : 'Estimating...'}</Text>
                  {hero.hasRichData && <div className="text-xs text-cyan-400">✓ Enhanced</div>}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Text className="text-gray-300">Hero Damage:</Text>
                <div className="text-right">
                  <Text className="text-white">{avgHeroDamage != null ? `${Math.round(avgHeroDamage / 1000)}k` : 'Processing...'}</Text>
                  {performanceTrends && <div className="text-xs text-gray-400">Per game avg</div>}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <Title level={5} className="text-white mb-2">Role Analysis</Title>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Text strong className="text-white">{roleAnalysis.role}</Text>
              <Tag color={roleAnalysis.confidence === 'High' ? 'success' : roleAnalysis.confidence === 'Medium' ? 'warning' : 'default'}>
                {roleAnalysis.confidence}
              </Tag>
            </div>
            <Text className="text-gray-300 text-xs">{roleAnalysis.description}</Text>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {insights.length > 0 && (
        <div>
          <Title level={5} className="text-white mb-2">Performance Insights</Title>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                insight.type === 'strength' ? 'bg-green-900/20 border-green-400' : 'bg-yellow-900/20 border-yellow-400'
              }`}>
                <Text className={insight.type === 'strength' ? 'text-green-400' : 'text-yellow-400'}>
                  {insight.type === 'strength' ? '✅' : '💡'} {insight.text}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Form with Enhancement Status */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Title level={5} className="text-white mb-0">Recent Performance</Title>
          <div className="flex items-center space-x-2">
            {hero.hasRichData ? (
              <Tag color="success" size="small">Rich Analytics</Tag>
            ) : analyticsLoading ? (
              <Tag color="processing" size="small">Building Profile</Tag>
            ) : (
              <Tag color="default" size="small">Basic Data</Tag>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-300">
              {hero.streakData.winLossRecord.wins}W - {hero.streakData.winLossRecord.losses}L 
              ({hero.streakData.winRate}% WR) in last {hero.streakData.gamesAnalyzed} games
            </Text>
            {hero.hasRichData && (
              <div className="text-xs text-cyan-400 mt-1">
                ✓ Enhanced with detailed match analytics
              </div>
            )}
          </div>
          {hero.streakData.streakType !== 'none' && (
            <Tag color={hero.streakData.streakType === 'win' ? 'success' : 'processing'}>
              {hero.streakData.streakType === 'win' ? '🔥' : '🧊'} {hero.streakData.currentStreak} {hero.streakData.streakType}s
            </Tag>
          )}
        </div>
        
        {/* Data Enhancement Progress */}
        {!hero.hasRichData && (
          <div className="mt-3 p-2 bg-gray-700/50 rounded">
            <div className="text-xs text-gray-400 mb-1">Analytics Enhancement</div>
            <Progress 
              percent={hero.completenessScore * 25} 
              size="small" 
              strokeColor={"#06B6D4"}
              showInfo={false}
            />
            <div className="text-xs text-gray-500 mt-1">
              {hero.completenessScore}/4 data sources • {analyticsLoading ? 'Processing...' : 'Click to enhance'}
            </div>
          </div>
        )}
      </div>
      
      {/* Performance Trends Chart */}
      {hero.hasRichData && (
        <div className="mt-6">
          <Title level={5} className="text-white mb-3">Performance Trends</Title>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateMockTrendData(hero)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="game" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="gpm"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  name="GPM"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="kda"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  dot={{ fill: '#06B6D4', strokeWidth: 2, r: 3 }}
                  name="KDA"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-green-400"></div>
              <span className="text-gray-400">GPM Trend</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-cyan-400"></div>
              <span className="text-gray-400">KDA Trend</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to generate mock trend data for visualization
const generateMockTrendData = (hero) => {
  const baseGPM = hero.performance.avgGPM || 400;
  const baseKDA = hero.mastery.stats.kda || 2.0;
  
  return Array.from({ length: 10 }, (_, i) => ({
    game: i + 1,
    gpm: Math.max(200, Math.round(baseGPM + (Math.random() - 0.5) * 100)),
    kda: Math.max(0.5, Math.round((baseKDA + (Math.random() - 0.5) * 1.0) * 100) / 100),
    winRate: Math.round(40 + Math.random() * 40)
  }));
};

export default HeroMasteryProgressionWidget;