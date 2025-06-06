import React, { useMemo, useState } from 'react';
import { Typography, Space, Empty, Spin, Input, Select, Card, Modal, Tag, Tooltip } from 'antd';
import { SearchOutlined, FireOutlined, FilterOutlined } from '@ant-design/icons';
import { useData } from '../../../contexts/DataContext.jsx';
import { gamingColors } from '../../../theme/antdTheme.js';
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

const { Title, Text } = Typography;

export const HeroMasteryProgressionWidget = () => {
  const { heroStats, heroMap, recentMatches, loading } = useData();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('mastery');
  const [selectedHero, setSelectedHero] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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
        
        // Enhanced performance calculations
        const avgGPM = hero.games > 0 ? Math.round((hero.sum_gold_per_min || 0) / hero.games) : 0;
        const avgXPM = hero.games > 0 ? Math.round((hero.sum_xp_per_min || 0) / hero.games) : 0;
        const avgCSPerMin = hero.games > 0 ? Math.round(((hero.sum_last_hits || 0) / hero.games) / 10) / 10 : 0;
        const avgHeroDamage = hero.games > 0 ? Math.round((hero.sum_hero_damage || 0) / hero.games) : 0;
        
        // Performance tier calculation (S, A, B, C, D)
        const getPerformanceTier = () => {
          const winrate = mastery.stats.winrate;
          const kda = mastery.stats.kda;
          const farmScore = avgGPM > 500 ? 2 : avgGPM > 350 ? 1 : 0;
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
          }
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
      case 'performance':
        const tierOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
        return filtered.sort((a, b) => {
          const tierDiff = tierOrder[b.performance.tier] - tierOrder[a.performance.tier];
          if (tierDiff !== 0) return tierDiff;
          return b.mastery.stats.winrate - a.mastery.stats.winrate;
        });
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
  }, [heroStats, heroMap, recentMatches, searchText, sortBy]);

  // Get momentum indicators for header
  const momentumData = useMemo(() => {
    if (!heroStats || !recentMatches) return null;
    return getOverallMomentum(recentMatches, heroStats);
  }, [heroStats, recentMatches]);

  const handleHeroClick = (hero) => {
    setSelectedHero(hero);
    setShowDetails(true);
  };

  if (loading.heroes || loading.matches) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <Title level={5} className="text-white m-0" style={{ fontSize: '14px' }}>
          HERO MASTERY PROGRESSION
        </Title>
        <Text type="secondary" className="uppercase tracking-wider" style={{ fontSize: '10px' }}>
          Performance analytics and mastery tracking
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
};

// Redesigned Hero Mastery Card - Clean, minimal design focused on key metrics
const HeroMasteryCard = ({ hero, onClick }) => {
  const masteryBadge = getMasteryBadge(hero.mastery.tier);
  const winrate = Math.round((hero.win / hero.games) * 100);
  const kda = hero.mastery.stats.kda;
  
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
      className="cursor-pointer hover:border-cyan-400 transition-all duration-200 hover:shadow-lg"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
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

        {/* Right: Performance Metrics */}
        <div className="text-right text-xs space-y-1">
          {hero.performance.avgGPM > 0 && (
            <div className={`${hero.performance.avgGPM > 500 ? 'text-green-400' : hero.performance.avgGPM > 350 ? 'text-yellow-400' : 'text-gray-400'}`}>
              {hero.performance.avgGPM} GPM
            </div>
          )}
          {hero.performance.avgXPM > 0 && (
            <div className={`${hero.performance.avgXPM > 600 ? 'text-green-400' : hero.performance.avgXPM > 450 ? 'text-yellow-400' : 'text-gray-400'}`}>
              {hero.performance.avgXPM} XPM
            </div>
          )}
          {hero.performance.avgCSPerMin > 0 && (
            <div className="text-gray-400">
              {hero.performance.avgCSPerMin}/min CS
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Enhanced Hero Detail View
const HeroDetailView = ({ hero }) => {
  const { recentMatches } = useData();
  const masteryBadge = getMasteryBadge(hero.mastery.tier);
  
  // Calculate detailed hero stats
  const heroMatches = recentMatches?.filter(match => match.hero_id === hero.hero_id) || [];
  const avgHeroDamage = hero.performance.avgHeroDamage;
  const avgTowerDamage = hero.games > 0 ? Math.round((hero.sum_tower_damage || 0) / hero.games) : 0;
  const avgHeroHealing = hero.games > 0 ? Math.round((hero.sum_hero_healing || 0) / hero.games) : 0;
  
  // Role analysis based on performance patterns
  const getRoleAnalysis = () => {
    const { avgGPM, avgCSPerMin } = hero.performance;
    if (avgGPM > 500 && avgCSPerMin > 5) {
      return { role: 'Core', confidence: 'High', description: 'Strong farming patterns and gold income' };
    } else if (avgHeroHealing > 1000 || (avgGPM < 350 && hero.mastery.stats.kda > 2.5)) {
      return { role: 'Support', confidence: 'High', description: 'High healing/assist focus with lower farm priority' };
    } else if (avgGPM > 400 && avgHeroDamage > 15000) {
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
    
    if (hero.performance.avgGPM > 600) {
      insights.push({ type: 'strength', text: 'Outstanding farming efficiency' });
    } else if (hero.performance.avgGPM < 300) {
      insights.push({ type: 'improvement', text: 'Work on last hitting and farm optimization' });
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

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{hero.games}</div>
          <div className="text-xs text-gray-400">Games</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">{hero.mastery.stats.winrate}%</div>
          <div className="text-xs text-gray-400">Win Rate</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-cyan-400">{hero.mastery.stats.kda}</div>
          <div className="text-xs text-gray-400">KDA</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${hero.performance.avgGPM > 500 ? 'text-green-400' : 'text-yellow-400'}`}>
            {hero.performance.avgGPM}
          </div>
          <div className="text-xs text-gray-400">Avg GPM</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Title level={5} className="text-white mb-2">Farm & Economy</Title>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text className="text-gray-300">XPM:</Text>
              <Text className={`${hero.performance.avgXPM > 600 ? 'text-green-400' : hero.performance.avgXPM > 450 ? 'text-yellow-400' : 'text-red-400'}`}>
                {hero.performance.avgXPM}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-gray-300">CS/Min:</Text>
              <Text className="text-white">{hero.performance.avgCSPerMin}</Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-gray-300">Hero Damage:</Text>
              <Text className="text-white">{avgHeroDamage > 0 ? `${Math.round(avgHeroDamage / 1000)}k` : 'N/A'}</Text>
            </div>
          </div>
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

      {/* Recent Form */}
      <div>
        <Title level={5} className="text-white mb-2">Recent Performance</Title>
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-300">
              {hero.streakData.winLossRecord.wins}W - {hero.streakData.winLossRecord.losses}L 
              ({hero.streakData.winRate}% WR) in last {hero.streakData.gamesAnalyzed} games
            </Text>
          </div>
          {hero.streakData.streakType !== 'none' && (
            <Tag color={hero.streakData.streakType === 'win' ? 'success' : 'processing'}>
              {hero.streakData.streakType === 'win' ? '🔥' : '🧊'} {hero.streakData.currentStreak} {hero.streakData.streakType}s
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroMasteryProgressionWidget;