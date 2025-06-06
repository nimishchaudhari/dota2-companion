import React, { useMemo, useState } from 'react';
import { Typography, Space, Empty, Spin, Input, Select, Card, Progress, Tag, Tooltip, Modal } from 'antd';
import { SearchOutlined, FireOutlined, TrophyOutlined, StarOutlined } from '@ant-design/icons';
import { useData } from '../../../contexts/DataContext.jsx';
import { gamingColors } from '../../../theme/antdTheme.js';
import { getHeroIcon, normalizeHeroName } from '../../../utils/assetHelpers.js';
import { 
  calculateHeroMastery, 
  calculateNextTierRequirements, 
  getMasteryBadge,
  sortHeroesByMastery,
  MASTERY_TIERS 
} from '../../../utils/masteryCalculations.js';
import { 
  analyzeHeroStreak, 
  getOverallMomentum,
  getStreakDisplay 
} from '../../../utils/streakAnalysis.js';
import { 
  checkHeroAchievements, 
  getRecentAchievements,
  calculateAchievementCompletion 
} from '../../../utils/achievementSystem.js';

const { Title, Text } = Typography;

export const HeroMasteryProgressionWidget = () => {
  const { heroStats, heroMap, recentMatches, loading } = useData();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('mastery');
  const [selectedHero, setSelectedHero] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Transform hero data with mastery calculations
  const heroMasteryData = useMemo(() => {
    if (!heroStats || !heroMap) return [];
    
    const heroesWithMastery = heroStats
      .filter(hero => hero.games >= 1) // Include all heroes with at least 1 game
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

    // Apply search filter
    let filtered = heroesWithMastery;
    if (searchText) {
      filtered = filtered.filter(hero =>
        hero.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'mastery':
        return sortHeroesByMastery(filtered);
      case 'games':
        return filtered.sort((a, b) => b.games - a.games);
      case 'winrate': {
        const getWinRate = (hero) => hero.games > 0 ? (hero.win / hero.games * 100) : 0;
        return filtered.sort((a, b) => getWinRate(b) - getWinRate(a));
      }
      case 'streak': {
        return filtered.sort((a, b) => {
          if (a.streakData.streakType === 'win' && b.streakData.streakType !== 'win') return -1;
          if (b.streakData.streakType === 'win' && a.streakData.streakType !== 'win') return 1;
          return b.streakData.currentStreak - a.streakData.currentStreak;
        });
      }
      default:
        return filtered;
    }
  }, [heroStats, heroMap, recentMatches, searchText, sortBy]);

  // Get momentum indicators for header
  const momentumData = useMemo(() => {
    if (!heroStats || !recentMatches) return null;
    return getOverallMomentum(recentMatches, heroStats);
  }, [heroStats, recentMatches]);

  // Get recent achievements
  const recentAchievements = useMemo(() => {
    if (!heroMasteryData) return [];
    const allAchievements = heroMasteryData.flatMap(hero => 
      hero.achievements.map(ach => ({ ...ach, heroName: hero.name }))
    );
    return getRecentAchievements(allAchievements, 3);
  }, [heroMasteryData]);


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
          Track your expertise and improvement
        </Text>
      </div>

      {/* Momentum Indicators */}
      {momentumData && (
        <div className="mb-4 flex flex-wrap gap-2">
          {momentumData.hotStreak && (
            <Tooltip title={`${momentumData.hotStreak.streak} game win streak`}>
              <Tag 
                color="success" 
                icon={<FireOutlined />}
                className="text-xs"
              >
                🔥 Hot: {momentumData.hotStreak.heroName} ({momentumData.hotStreak.streak}W)
              </Tag>
            </Tooltip>
          )}
          {momentumData.coldSpell && (
            <Tooltip title={`${momentumData.coldSpell.streak} game loss streak`}>
              <Tag 
                color="processing" 
                className="text-xs"
              >
                🧊 Cold: {momentumData.coldSpell.heroName} ({momentumData.coldSpell.streak}L)
              </Tag>
            </Tooltip>
          )}
        </div>
      )}

      {/* Controls */}
      <Space className="mb-4" style={{ width: '100%' }}>
        <Input
          placeholder="Search heroes..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 180 }}
          size="small"
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 120 }}
          size="small"
          options={[
            { label: 'Mastery', value: 'mastery' },
            { label: 'Games', value: 'games' },
            { label: 'Win Rate', value: 'winrate' },
            { label: 'Streak', value: 'streak' },
          ]}
        />
      </Space>

      {/* Recent Achievement */}
      {recentAchievements.length > 0 && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
          <Space>
            <TrophyOutlined style={{ color: gamingColors.electric.yellow, fontSize: '16px' }} />
            <div>
              <Text className="text-white font-bold text-sm">
                🏆 Recent Achievement:
              </Text>
              <div className="text-xs text-gray-300">
                "{recentAchievements[0].name}" - {recentAchievements[0].heroName}
              </div>
            </div>
          </Space>
        </div>
      )}

      {/* Hero List */}
      <div className="flex-1 overflow-auto space-y-3">
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
            description="No hero mastery data available"
            className="h-full flex flex-col justify-center"
          />
        )}
      </div>

      {/* View All Button */}
      {heroMasteryData.length > 8 && (
        <div className="mt-4 text-center">
          <Text 
            type="secondary" 
            className="cursor-pointer hover:text-cyan-400 text-xs"
            onClick={() => {/* Could expand to show all heroes */}}
          >
            View All {heroMasteryData.length} Heroes
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
                <span className="text-white">{selectedHero.name} - Mastery Details</span>
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

// Hero Mastery Card Component
const HeroMasteryCard = ({ hero, onClick }) => {
  const masteryBadge = getMasteryBadge(hero.mastery.tier);
  const streakDisplay = getStreakDisplay(hero.streakData);
  const winrate = hero.games > 0 ? Math.round((hero.win / hero.games) * 100) : 0;
  const kda = hero.games > 0 ? 
    Math.round((((hero.sum_kills + hero.sum_assists) / Math.max(hero.sum_deaths, 1)) / hero.games) * 100) / 100 : 0;

  return (
    <Card
      size="small"
      className="cursor-pointer hover:border-cyan-400 transition-colors"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {/* Hero Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
            <img
              src={getHeroIcon(normalizeHeroName(hero.name))}
              alt={hero.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Hero Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Text strong className="text-white text-sm truncate">
              {hero.name}
            </Text>
            <Tag 
              color={masteryBadge.color}
              className="text-xs"
              style={{ fontSize: '10px', padding: '0 4px' }}
            >
              {masteryBadge.shortName} {masteryBadge.emoji}
            </Tag>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>{hero.games} games</span>
            <span className={winrate >= 60 ? 'text-green-400' : winrate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
              {winrate}% WR
            </span>
            <span className={kda >= 2.5 ? 'text-green-400' : kda >= 1.5 ? 'text-yellow-400' : 'text-red-400'}>
              {kda} KDA
            </span>
          </div>
        </div>

        {/* Progress & Status */}
        <div className="flex-shrink-0 text-right">
          {/* Mastery Progress */}
          <div className="mb-2">
            <Progress
              percent={hero.mastery.progress}
              size="small"
              strokeColor={MASTERY_TIERS[hero.mastery.tier]?.color || gamingColors.electric.cyan}
              trailColor="rgba(255, 255, 255, 0.1)"
              showInfo={false}
              style={{ width: '80px' }}
            />
            <div className="text-xs text-gray-400 mt-1">
              {hero.mastery.progress}% → {hero.nextRequirements?.nextTier || 'Max'}
            </div>
          </div>

          {/* Streak Indicator */}
          {hero.streakData.streakType !== 'none' && (
            <Tag 
              style={{ 
                backgroundColor: streakDisplay.bgColor,
                borderColor: streakDisplay.color,
                color: streakDisplay.color,
                fontSize: '10px',
                padding: '0 4px'
              }}
            >
              {streakDisplay.emoji} {streakDisplay.text}
            </Tag>
          )}

          {/* Achievement Count */}
          {hero.achievements.length > 0 && (
            <div className="text-xs text-yellow-400 mt-1">
              <StarOutlined /> {hero.achievements.length}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Hero Detail View Component
const HeroDetailView = ({ hero }) => {
  const masteryBadge = getMasteryBadge(hero.mastery.tier);
  const achievementCompletion = calculateAchievementCompletion(hero.achievements);
  
  return (
    <div className="space-y-6">
      {/* Mastery Overview */}
      <div className="text-center">
        <div className="text-4xl mb-2">{masteryBadge.emoji}</div>
        <Title level={4} className="text-white mb-1">
          {masteryBadge.name} Mastery
        </Title>
        <Text type="secondary">
          Level {hero.mastery.level} • {hero.mastery.progress}% to next tier
        </Text>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{hero.games}</div>
          <div className="text-xs text-gray-400">Games Played</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">{hero.mastery.stats.winrate}%</div>
          <div className="text-xs text-gray-400">Win Rate</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-cyan-400">{hero.mastery.stats.kda}</div>
          <div className="text-xs text-gray-400">KDA Ratio</div>
        </div>
      </div>

      {/* Next Requirements */}
      {hero.nextRequirements && !hero.nextRequirements.isMaxTier && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(0, 217, 255, 0.1)' }}>
          <Title level={5} className="text-cyan-400 mb-2">
            Next Milestone: {MASTERY_TIERS[hero.mastery.nextTier]?.name} Mastery
          </Title>
          <Text className="text-white">
            {hero.nextRequirements.message}
          </Text>
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

      {/* Achievements */}
      <div>
        <Title level={5} className="text-white mb-2">
          Achievements ({achievementCompletion.earned}/{achievementCompletion.total})
        </Title>
        <Progress 
          percent={achievementCompletion.percentage} 
          strokeColor={gamingColors.electric.yellow}
          className="mb-3"
        />
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {hero.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span style={{ color: achievement.color }}>{achievement.emoji}</span>
              <Text className="text-white text-sm">{achievement.name}</Text>
              <Text type="secondary" className="text-xs">
                {achievement.description}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroMasteryProgressionWidget;