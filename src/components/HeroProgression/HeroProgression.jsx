import React, { useState, useMemo } from 'react';
import { Typography, Button, Space, Card, Progress, Statistic, Row, Col, Tabs, Empty, Tag, Badge, Table, Tooltip } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined, FireOutlined, ClockCircleOutlined, CrownOutlined, ThunderboltOutlined, AimOutlined } from '@ant-design/icons';
import { useData } from '../../contexts/DataContext.jsx';
import { gamingColors } from '../../theme/antdTheme.js';
import { getHeroIcon, normalizeHeroName } from '../../utils/assetHelpers.js';
import { 
  calculateHeroMastery, 
  calculateNextTierRequirements, 
  getMasteryBadge,
  sortHeroesByMastery,
  MASTERY_TIERS 
} from '../../utils/masteryCalculations.js';
import { 
  analyzeHeroStreak, 
  getOverallMomentum,
  getStreakDisplay 
} from '../../utils/streakAnalysis.js';
import { 
  checkHeroAchievements, 
  getRecentAchievements,
  calculateAchievementCompletion 
} from '../../utils/achievementSystem.js';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const HeroProgression = ({ onBack }) => {
  const { heroStats, heroMap, recentMatches, loading } = useData();
  const [selectedHero, setSelectedHero] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Transform hero data with mastery calculations
  const heroMasteryData = useMemo(() => {
    if (!heroStats || !heroMap) return [];
    
    const heroesWithMastery = heroStats
      .filter(hero => hero.games >= 1)
      .map(hero => {
        const heroData = heroMap[hero.hero_id];
        const heroName = heroData?.localized_name || heroData?.name || `Hero ${hero.hero_id}`;
        
        // Calculate mastery
        const mastery = calculateHeroMastery(hero);
        
        // Calculate streaks
        const streakData = analyzeHeroStreak(recentMatches, hero.hero_id);
        
        // Check achievements
        const achievements = checkHeroAchievements(hero, mastery);
        
        return {
          ...hero,
          name: heroName,
          mastery,
          streakData,
          achievements,
          nextRequirements: calculateNextTierRequirements(hero, mastery)
        };
      });

    return sortHeroesByMastery(heroesWithMastery);
  }, [heroStats, heroMap, recentMatches]);

  // Get detailed hero performance data
  const getHeroAnalytics = (hero) => {
    if (!hero || !recentMatches) return null;

    const heroMatches = recentMatches.filter(match => match.hero_id === hero.hero_id);
    
    if (heroMatches.length === 0) return null;

    // Performance over time
    const performanceData = heroMatches.slice(0, 20).reverse().map((match, index) => {
      const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
      const isWin = match.radiant_win === (match.player_slot < 128);
      
      return {
        game: index + 1,
        kda: Math.round(kda * 100) / 100,
        gpm: match.gold_per_min,
        xpm: match.xp_per_min,
        winRate: isWin ? 100 : 0,
        duration: Math.round(match.duration / 60),
        date: new Date(match.start_time * 1000).toLocaleDateString(),
        hero_damage: match.hero_damage,
        tower_damage: match.tower_damage,
        hero_healing: match.hero_healing,
        last_hits: match.last_hits,
        denies: match.denies
      };
    });

    // Role performance analysis
    const roles = ['Core', 'Support', 'Jungler', 'Roamer'];
    const rolePerformance = roles.map(role => ({
      role,
      matches: Math.floor(Math.random() * heroMatches.length), // Placeholder
      winRate: 45 + Math.random() * 40, // Placeholder
      avgKDA: 1.5 + Math.random() * 2
    }));

    // Item build analysis
    const commonItems = {};
    heroMatches.forEach(match => {
      for (let i = 0; i < 6; i++) {
        const item = match[`item_${i}`];
        if (item && item !== 0) {
          commonItems[item] = (commonItems[item] || 0) + 1;
        }
      }
    });

    const topItems = Object.entries(commonItems)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([itemId, count]) => ({
        itemId: parseInt(itemId),
        count,
        winRate: 50 + Math.random() * 40 // Placeholder
      }));

    return {
      performanceData,
      rolePerformance,
      topItems,
      recentMatches: heroMatches.slice(0, 10),
      totalMatches: heroMatches.length
    };
  };

  const heroAnalytics = selectedHero ? getHeroAnalytics(selectedHero) : null;

  if (loading.heroes || loading.matches) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <Text className="text-white text-lg">Loading Hero Progression Data...</Text>
        </div>
      </div>
    );
  }

  if (!selectedHero) {
    // Hero selection grid
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Back to Dashboard
              </Button>
              <div>
                <Title level={2} className="text-white m-0">
                  Hero Progression Center
                </Title>
                <Text type="secondary">
                  Analyze your mastery and performance across all heroes
                </Text>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={12} md={6}>
              <Card className="bg-gray-800 border-gray-700">
                <Statistic
                  title={<span className="text-gray-300">Total Heroes Played</span>}
                  value={heroMasteryData.length}
                  valueStyle={{ color: gamingColors.electric.cyan }}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="bg-gray-800 border-gray-700">
                <Statistic
                  title={<span className="text-gray-300">Diamond Mastery</span>}
                  value={heroMasteryData.filter(h => h.mastery.tier === 'diamond').length}
                  valueStyle={{ color: MASTERY_TIERS.diamond.color }}
                  prefix={<CrownOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="bg-gray-800 border-gray-700">
                <Statistic
                  title={<span className="text-gray-300">Gold+ Mastery</span>}
                  value={heroMasteryData.filter(h => ['gold', 'platinum', 'diamond'].includes(h.mastery.tier)).length}
                  valueStyle={{ color: MASTERY_TIERS.gold.color }}
                  prefix={<FireOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="bg-gray-800 border-gray-700">
                <Statistic
                  title={<span className="text-gray-300">Avg Mastery Level</span>}
                  value={heroMasteryData.length > 0 ? 
                    (heroMasteryData.reduce((sum, h) => sum + h.mastery.level, 0) / heroMasteryData.length).toFixed(1) : 0}
                  valueStyle={{ color: gamingColors.electric.yellow }}
                  prefix={<AimOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Hero Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {heroMasteryData.map(hero => {
              const masteryBadge = getMasteryBadge(hero.mastery.tier);
              const winrate = hero.games > 0 ? Math.round((hero.win / hero.games) * 100) : 0;
              
              return (
                <Card
                  key={hero.hero_id}
                  hoverable
                  className="bg-gray-800 border-gray-700 cursor-pointer hover:border-cyan-400 transition-all"
                  onClick={() => setSelectedHero(hero)}
                  bodyStyle={{ padding: '12px' }}
                >
                  <div className="text-center">
                    {/* Hero Icon */}
                    <div className="relative mb-2">
                      <img
                        src={getHeroIcon(normalizeHeroName(hero.name))}
                        alt={hero.name}
                        className="w-16 h-16 mx-auto rounded-lg object-cover"
                      />
                      <Badge
                        count={masteryBadge.emoji}
                        style={{
                          backgroundColor: masteryBadge.color,
                          position: 'absolute',
                          top: -8,
                          right: -8
                        }}
                      />
                    </div>
                    
                    {/* Hero Name */}
                    <Text className="text-white text-xs font-medium block mb-1">
                      {hero.name.length > 12 ? hero.name.substring(0, 12) + '...' : hero.name}
                    </Text>
                    
                    {/* Stats */}
                    <div className="text-xs text-gray-400">
                      <div>{hero.games} games</div>
                      <div className={winrate >= 60 ? 'text-green-400' : winrate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                        {winrate}% WR
                      </div>
                    </div>
                    
                    {/* Mastery Progress */}
                    <Progress
                      percent={hero.mastery.progress}
                      size="small"
                      strokeColor={MASTERY_TIERS[hero.mastery.tier]?.color}
                      trailColor="rgba(255, 255, 255, 0.1)"
                      showInfo={false}
                      className="mt-2"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Individual hero analysis view
  const masteryBadge = getMasteryBadge(selectedHero.mastery.tier);
  const winrate = selectedHero.games > 0 ? Math.round((selectedHero.win / selectedHero.games) * 100) : 0;
  const kda = selectedHero.games > 0 ? 
    Math.round((((selectedHero.sum_kills + selectedHero.sum_assists) / Math.max(selectedHero.sum_deaths, 1)) / selectedHero.games) * 100) / 100 : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => setSelectedHero(null)}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Back to Heroes
              </Button>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={getHeroIcon(normalizeHeroName(selectedHero.name))}
                    alt={selectedHero.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div 
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: masteryBadge.color }}
                  >
                    {masteryBadge.emoji}
                  </div>
                </div>
                
                <div>
                  <Title level={2} className="text-white m-0">
                    {selectedHero.name}
                  </Title>
                  <Space>
                    <Tag color={masteryBadge.color} className="text-sm">
                      {masteryBadge.name} Mastery
                    </Tag>
                    <Text type="secondary">
                      Level {selectedHero.mastery.level} • {selectedHero.mastery.progress}% to next tier
                    </Text>
                  </Space>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{selectedHero.games}</div>
                <div className="text-xs text-gray-400">Games</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${winrate >= 60 ? 'text-green-400' : winrate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {winrate}%
                </div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${kda >= 2.5 ? 'text-green-400' : kda >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {kda}
                </div>
                <div className="text-xs text-gray-400">KDA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="hero-tabs">
          <TabPane tab="Overview" key="overview">
            <HeroOverviewTab hero={selectedHero} analytics={heroAnalytics} />
          </TabPane>
          <TabPane tab="Performance" key="performance">
            <HeroPerformanceTab hero={selectedHero} analytics={heroAnalytics} />
          </TabPane>
          <TabPane tab="Builds & Items" key="builds">
            <HeroBuildsTab hero={selectedHero} analytics={heroAnalytics} />
          </TabPane>
          <TabPane tab="Match History" key="matches">
            <HeroMatchesTab hero={selectedHero} analytics={heroAnalytics} />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

// Overview Tab Component
const HeroOverviewTab = ({ hero, analytics }) => {
  const masteryBadge = getMasteryBadge(hero.mastery.tier);
  
  return (
    <div className="space-y-6">
      {/* Mastery Progress */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Mastery Progression" className="bg-gray-800 border-gray-700">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{masteryBadge.emoji}</div>
              <Title level={3} className="text-white">
                {masteryBadge.name} Mastery
              </Title>
              <Text type="secondary">Level {hero.mastery.level}</Text>
            </div>
            
            <Progress
              percent={hero.mastery.progress}
              strokeColor={MASTERY_TIERS[hero.mastery.tier]?.color}
              className="mb-4"
            />
            
            {hero.nextRequirements && !hero.nextRequirements.isMaxTier && (
              <div className="p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
                <Title level={5} className="text-cyan-400 mb-2">
                  Next: {MASTERY_TIERS[Object.keys(MASTERY_TIERS)[Object.keys(MASTERY_TIERS).indexOf(hero.mastery.tier) + 1]]?.name} Mastery
                </Title>
                <Text className="text-white">
                  {hero.nextRequirements.message}
                </Text>
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Recent Performance" className="bg-gray-800 border-gray-700">
            {analytics?.performanceData ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.performanceData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="game" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kda"
                    stroke={gamingColors.electric.cyan}
                    strokeWidth={2}
                    dot={{ fill: gamingColors.electric.cyan }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No recent match data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Achievements */}
      <Card title="Achievements" className="bg-gray-800 border-gray-700">
        {hero.achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hero.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                <span className="text-2xl">{achievement.emoji}</span>
                <div>
                  <Text strong className="text-white">{achievement.name}</Text>
                  <div className="text-sm text-gray-400">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="No achievements earned yet" />
        )}
      </Card>
    </div>
  );
};

// Performance Tab Component  
const HeroPerformanceTab = ({ hero, analytics }) => {
  if (!analytics?.performanceData) {
    return <Empty description="No performance data available" />;
  }

  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="KDA Trend" className="bg-gray-800 border-gray-700">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics.performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="game" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kda"
                  stroke={gamingColors.electric.cyan}
                  fill={`${gamingColors.electric.cyan}20`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Farm Efficiency" className="bg-gray-800 border-gray-700">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics.performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="game" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gpm"
                  stroke={gamingColors.electric.yellow}
                  fill={`${gamingColors.electric.yellow}20`}
                />
                <Area
                  type="monotone"
                  dataKey="xpm"
                  stroke={gamingColors.electric.purple}
                  fill={`${gamingColors.electric.purple}20`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Builds Tab Component
const HeroBuildsTab = ({ hero, analytics }) => {
  if (!analytics?.topItems) {
    return <Empty description="No item build data available" />;
  }

  const columns = [
    {
      title: 'Item',
      dataIndex: 'itemId',
      key: 'item',
      render: (itemId) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-600 rounded"></div>
          <span>Item {itemId}</span>
        </div>
      )
    },
    {
      title: 'Usage',
      dataIndex: 'count',
      key: 'count',
      render: (count) => `${count} times`
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate) => (
        <span className={winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
          {Math.round(winRate)}%
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card title="Most Used Items" className="bg-gray-800 border-gray-700">
        <Table
          columns={columns}
          dataSource={analytics.topItems}
          pagination={false}
          className="dark-table"
        />
      </Card>
    </div>
  );
};

// Matches Tab Component
const HeroMatchesTab = ({ hero, analytics }) => {
  if (!analytics?.recentMatches) {
    return <Empty description="No recent matches available" />;
  }

  const columns = [
    {
      title: 'Result',
      dataIndex: 'radiant_win',
      key: 'result',
      render: (radiantWin, record) => {
        const isWin = radiantWin === (record.player_slot < 128);
        return (
          <Tag color={isWin ? 'success' : 'error'}>
            {isWin ? 'WIN' : 'LOSS'}
          </Tag>
        );
      }
    },
    {
      title: 'KDA',
      key: 'kda',
      render: (_, record) => `${record.kills}/${record.deaths}/${record.assists}`
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
    },
    {
      title: 'GPM/XPM',
      key: 'farm',
      render: (_, record) => `${record.gold_per_min}/${record.xp_per_min}`
    },
    {
      title: 'Date',
      dataIndex: 'start_time',
      key: 'date',
      render: (startTime) => new Date(startTime * 1000).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <Card title="Recent Matches" className="bg-gray-800 border-gray-700">
        <Table
          columns={columns}
          dataSource={analytics.recentMatches}
          pagination={{ pageSize: 10 }}
          className="dark-table"
          rowKey="match_id"
        />
      </Card>
    </div>
  );
};

export default HeroProgression;