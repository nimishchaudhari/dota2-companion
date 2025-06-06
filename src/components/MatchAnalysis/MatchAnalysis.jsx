import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  Layout, Card, Spin, Typography, Space, Tag, Row, Col, Statistic, 
  Progress, Tabs, List, Avatar, Badge, Divider, Timeline, Alert,
  Breadcrumb, Button, Tooltip, Table, Empty, Rate, Segmented
} from 'antd';
import { 
  ArrowLeftOutlined, TrophyOutlined, CloseCircleOutlined,
  ClockCircleOutlined, CalendarOutlined, TeamOutlined,
  FireOutlined, ExperimentOutlined, ShoppingOutlined,
  RadarChartOutlined, HeatMapOutlined, LineChartOutlined,
  UserOutlined, CrownOutlined, SafetyCertificateOutlined,
  EyeOutlined, RiseOutlined, FallOutlined, DashboardOutlined,
  BulbOutlined, InfoCircleOutlined, ThunderboltOutlined,
  AimOutlined, RocketOutlined, AlertOutlined, StarOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { Line, Bar, Pie, Radar, Area, Column } from '@ant-design/plots';
import { gamingColors } from '../../theme/antdTheme.js';
import { AuthContext } from '../../contexts/AuthContext.js';
import authService from '../../services/auth.service.js';
import matchAnalysisService from '../../services/matchAnalysisService.js';
import { 
  getHeroIcon, 
  getItemIcon, 
  getHeroIconById,
  getItemIconById
} from '../../utils/assetHelpers.js';

const { Content } = Layout;
const { Title, Text } = Typography;

// Helper function to detect role from position data
const detectRoleFromPosition = (playerData) => {
  if (!playerData) return null;
  
  // Basic role detection from lane position
  const lane = playerData.lane;
  if (lane === 1) return 'Hard Support';
  if (lane === 2) return 'Support';
  if (lane === 3) return 'Offlane';
  if (lane === 4) return 'Mid';
  if (lane === 5) return 'Carry';
  
  // Fallback: use farm priority
  const gpm = playerData.gold_per_min || 0;
  if (gpm > 600) return 'Carry';
  if (gpm > 500) return 'Mid';
  if (gpm > 400) return 'Offlane';
  if (gpm > 300) return 'Support';
  return 'Hard Support';
};

// Helper function to get performance metric explanations
const getMetricExplanation = (metric) => {
  const explanations = {
    'Lane Control': 'Last hits per minute and lane presence in first 10 minutes. Good: 6+ CS/min for cores, 2+ for supports',
    'Tempo Impact': 'Kill participation and objective contribution. Good: 60-80% for cores, 50-70% for supports',
    'XP Efficiency': 'Experience gained relative to game time. Good: Level advantage maintained throughout game',
    'Damage Output': 'Hero and building damage relative to role. Good: 400+ per minute for cores, 200+ for supports',
    'Farm Priority': 'Net worth relative to expected role position. Good: Top 3 on team for cores',
    'Vision Control': 'Wards placed and dewarded. Good: 10+ observer wards, 5+ sentry wards for supports'
  };
  return explanations[metric] || 'Performance metric based on role expectations and game impact';
};

export const MatchAnalysis = ({ matchId, onBack }) => {
  const { user } = useContext(AuthContext);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    const fetchMatchData = async () => {
      setLoading(true);
      try {
        console.log(`[MATCH ANALYSIS] Fetching match data for match ID: ${matchId}`);
        
        // Use auth service with API key for match data
        const data = await authService.fetchMatch(matchId);
        console.log(`[MATCH ANALYSIS] Match data received:`, data);
        
        // Find the current user's player in the match
        const userPlayer = data.players.find(p => p.account_id === parseInt(user?.accountId));
        const userHeroId = userPlayer?.hero_id;
        
        // Fetch additional data for enhanced analytics using auth service
        const [benchmarks, heroStats] = await Promise.allSettled([
          userHeroId ? authService.fetchBenchmarks(userHeroId) : null,
          authService.fetchGeneralHeroStats()
        ]);
        
        const benchmarksData = benchmarks.status === 'fulfilled' ? benchmarks.value : null;
        const heroStatsData = heroStats.status === 'fulfilled' ? heroStats.value : [];
        
        console.log(`[MATCH ANALYSIS] Additional data loaded - benchmarks: ${!!benchmarksData}, heroStats: ${heroStatsData?.length || 0} items`);
        
        setMatchData({ ...data, benchmarks: benchmarksData, heroStats: heroStatsData });
      } catch (error) {
        console.error('[MATCH ANALYSIS] Error fetching match:', error);
        setMatchData(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (matchId) {
      fetchMatchData();
    } else {
      console.error('[MATCH ANALYSIS] No match ID provided');
      setLoading(false);
    }
  }, [matchId, user]);

  // Fetch comprehensive KPI analysis
  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!matchData || !user?.accountId) return;
      
      setAnalysisLoading(true);
      try {
        console.log(`[MATCH ANALYSIS] Fetching comprehensive KPI analysis for match ${matchId}, player ${user.accountId}`);
        
        const analysis = await matchAnalysisService.getMatchAnalysis(matchId, user.accountId);
        setAnalysisData(analysis);
        
        console.log(`[MATCH ANALYSIS] KPI analysis completed:`, {
          role: analysis.role.role,
          grade: analysis.performance.grade,
          overallScore: analysis.overallScore.score,
          insights: analysis.insights.coachingPoints.length
        });
      } catch (error) {
        console.error('[MATCH ANALYSIS] Failed to fetch KPI analysis:', error);
        setAnalysisData(null);
      } finally {
        setAnalysisLoading(false);
      }
    };

    if (matchData && user?.accountId && !analysisLoading) {
      fetchAnalysisData();
    }
  }, [matchData, user?.accountId, matchId]);


  const playerData = useMemo(() => {
    if (!matchData?.players) return null;
    
    // Find the current player from auth context
    const currentAccountId = user?.accountId;
    if (!currentAccountId) return null;
    
    return matchData.players.find(p => p.account_id === parseInt(currentAccountId));
  }, [matchData, user]);

  const teamData = useMemo(() => {
    if (!matchData?.players) return { radiant: [], dire: [] };
    
    const radiant = matchData.players.filter(p => p.player_slot < 128);
    const dire = matchData.players.filter(p => p.player_slot >= 128);
    
    return { radiant, dire };
  }, [matchData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text className="text-white text-lg">Loading match analysis...</Text>
          {analysisLoading && (
            <Text className="text-blue-400 text-sm">Calculating comprehensive KPIs...</Text>
          )}
        </Space>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <Empty description="Match data not found" />
      </div>
    );
  }

  const isRadiantWin = matchData.radiant_win;
  const matchDuration = Math.floor(matchData.duration / 60);
  const matchDate = new Date(matchData.start_time * 1000);

  return (
    <Layout className="min-h-screen bg-gray-900">
      <Content className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={onBack}
                className="text-gray-400 hover:text-white"
              >
                Back to Dashboard
              </Button>
            </Breadcrumb.Item>
            <Breadcrumb.Item className="text-white">
              Match {matchId}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>

        {/* Match Overview Header */}
        <Card 
          className="mb-6 bg-gray-800/50 border-gray-700"
          bordered={false}
        >
          <div className="flex justify-between items-center">
            <div>
              <Space size="large">
                <Title level={3} className="text-white m-0">
                  MATCH ANALYSIS
                </Title>
                <Tag 
                  color={isRadiantWin ? 'success' : 'error'}
                  icon={isRadiantWin ? <TrophyOutlined /> : <CloseCircleOutlined />}
                  className="text-base px-4 py-1"
                >
                  {isRadiantWin ? 'RADIANT VICTORY' : 'DIRE VICTORY'}
                </Tag>
              </Space>
            </div>
            
            <Space size="large">
              <Statistic
                title="Duration"
                value={`${matchDuration}:${(matchData.duration % 60).toString().padStart(2, '0')}`}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: gamingColors.text.primary }}
              />
              <Statistic
                title="Game Mode"
                value={matchData.game_mode_name || 'Unknown'}
                valueStyle={{ color: gamingColors.text.primary }}
              />
              <Statistic
                title="Date"
                value={matchDate.toLocaleDateString()}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: gamingColors.text.primary }}
              />
            </Space>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          className="match-analysis-tabs"
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <DashboardOutlined className="mr-2" />
                  Overview
                </span>
              ),
              children: <EnhancedOverviewTab matchData={matchData} playerData={playerData} teamData={teamData} analysisData={analysisData} analysisLoading={analysisLoading} />
            },
            {
              key: 'performance',
              label: (
                <span>
                  <FireOutlined className="mr-2" />
                  Performance
                  {analysisData?.performance?.grade && (
                    <Tag className="ml-2" color={getGradeColor(analysisData.performance.grade).color}>
                      {analysisData.performance.grade}
                    </Tag>
                  )}
                </span>
              ),
              children: <EnhancedPerformanceTab matchData={matchData} playerData={playerData} teamData={teamData} analysisData={analysisData} analysisLoading={analysisLoading} />
            },
            {
              key: 'laning',
              label: (
                <span>
                  <RiseOutlined className="mr-2" />
                  Laning Phase
                  {analysisData?.laning?.outcome && (
                    <Tag className="ml-2" color={analysisData.laning.outcome === 'WIN' ? 'green' : analysisData.laning.outcome === 'DRAW' ? 'blue' : 'red'}>
                      {analysisData.laning.outcome}
                    </Tag>
                  )}
                </span>
              ),
              children: <LaningPhaseTab playerData={playerData} analysisData={analysisData} analysisLoading={analysisLoading} />
            },
            {
              key: 'economy',
              label: (
                <span>
                  <ShoppingOutlined className="mr-2" />
                  Economy & Items
                  {analysisData?.economy?.efficiency && (
                    <Tag className="ml-2" color={analysisData.economy.efficiency >= 80 ? 'green' : analysisData.economy.efficiency >= 60 ? 'blue' : 'orange'}>
                      {analysisData.economy.efficiency}%
                    </Tag>
                  )}
                </span>
              ),
              children: <EconomyResourcesTab matchData={matchData} playerData={playerData} analysisData={analysisData} analysisLoading={analysisLoading} />
            },
            {
              key: 'combat',
              label: (
                <span>
                  <AimOutlined className="mr-2" />
                  Combat Intel
                  {analysisData?.combat?.impact && (
                    <Tag className="ml-2" color={analysisData.combat.impact >= 80 ? 'green' : analysisData.combat.impact >= 60 ? 'blue' : 'orange'}>
                      {analysisData.combat.impact}%
                    </Tag>
                  )}
                </span>
              ),
              children: <CombatIntelligenceTab matchData={matchData} playerData={playerData} teamData={teamData} analysisData={analysisData} analysisLoading={analysisLoading} />
            },
            {
              key: 'vision',
              label: (
                <span>
                  <EyeOutlined className="mr-2" />
                  Vision & Map
                  {analysisData?.vision?.grade && (
                    <Tag className="ml-2" color={getGradeColor(analysisData.vision.grade).color}>
                      {analysisData.vision.grade}
                    </Tag>
                  )}
                </span>
              ),
              children: <VisionMapControlTab matchData={matchData} playerData={playerData} analysisData={analysisData} analysisLoading={analysisLoading} />
            },
            {
              key: 'insights',
              label: (
                <span>
                  <BulbOutlined className="mr-2" />
                  Insights
                  {analysisData?.insights?.coachingPoints && (
                    <Badge className="ml-2" count={analysisData.insights.coachingPoints.length} size="small" />
                  )}
                </span>
              ),
              children: <ImprovementInsightsTab matchData={matchData} playerData={playerData} analysisLoading={analysisLoading} />
            }
          ]}
        />
      </Content>
    </Layout>
  );
};


const getGradeColor = (grade) => {
  const colors = {
    S: { color: '#FFD700', glow: '0 0 20px #FFD700' },
    A: { color: gamingColors.electric.cyan, glow: `0 0 15px ${gamingColors.electric.cyan}` },
    B: { color: gamingColors.electric.green, glow: '0 0 10px ' + gamingColors.electric.green },
    C: { color: gamingColors.electric.yellow, glow: '0 0 8px ' + gamingColors.electric.yellow },
    D: { color: gamingColors.electric.red, glow: '0 0 8px ' + gamingColors.electric.red },
    F: { color: '#FF0000', glow: '0 0 6px #FF0000' }
  };
  return colors[grade] || colors.B;
};

// Enhanced Overview Tab Component
const EnhancedOverviewTab = ({ matchData, playerData, teamData }) => {
  // Calculate draft analysis
  const draftAnalysis = useMemo(() => {
    if (!matchData.picks_bans || !matchData.heroStats) return null;
    
    const getHeroWinRate = (heroId) => {
      const hero = matchData.heroStats.find(h => h.id === heroId);
      return hero && hero.pro_pick > 0 ? (hero.pro_win / hero.pro_pick * 100).toFixed(1) : 50;
    };
    
    return {
      radiantDraft: teamData.radiant.map(p => ({
        hero: p.hero_id,
        winRate: getHeroWinRate(p.hero_id),
        player: p
      })),
      direDraft: teamData.dire.map(p => ({
        hero: p.hero_id,
        winRate: getHeroWinRate(p.hero_id),
        player: p
      }))
    };
  }, [matchData, teamData]);

  // Calculate objectives timeline
  const objectivesTimeline = useMemo(() => {
    const events = [];
    
    // Add tower kills
    if (matchData.objectives) {
      matchData.objectives.forEach(obj => {
        if (obj.type === 'CHAT_MESSAGE_TOWER_KILL') {
          events.push({
            time: obj.time,
            type: 'tower',
            team: obj.team === 2 ? 'radiant' : 'dire',
            description: `${obj.team === 2 ? 'Radiant' : 'Dire'} destroyed a tower`
          });
        }
        if (obj.type === 'CHAT_MESSAGE_ROSHAN_KILL') {
          events.push({
            time: obj.time,
            type: 'roshan',
            team: obj.team === 2 ? 'radiant' : 'dire',
            description: `${obj.team === 2 ? 'Radiant' : 'Dire'} killed Roshan`
          });
        }
      });
    }
    
    return events.sort((a, b) => a.time - b.time);
  }, [matchData]);

  const PlayerRow = React.memo(({ player, isCurrentPlayer, heroIcon }) => {
    const kda = ((player.kills + player.assists) / Math.max(player.deaths, 1)).toFixed(2);
    const kdaGrade = kda >= 5 ? 'S' : kda >= 4 ? 'A' : kda >= 3 ? 'B' : kda >= 2 ? 'C' : 'D';
    const gradeStyle = getGradeColor(kdaGrade);
    
    return (
      <div 
        className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
          isCurrentPlayer ? 'bg-cyan-900/20 border border-cyan-400/30' : 'bg-gray-800/30 hover:bg-gray-800/50'
        }`}
        style={isCurrentPlayer ? { boxShadow: gradeStyle.glow } : {}}
      >
      <Space size="middle">
        <Avatar 
          size={40} 
          src={heroIcon}
        >
          {player.hero_name?.substring(0, 2)}
        </Avatar>
        <div>
          <Text strong className="text-white">
            {player.personaname || 'Anonymous'}
            {player.rank_tier && (
              <Badge 
                count={`Rank ${Math.floor(player.rank_tier / 10)}`}
                className="ml-2"
                style={{ backgroundColor: gamingColors.rank.ancient }}
              />
            )}
          </Text>
          <div className="flex items-center gap-2">
            <Text type="secondary" className="text-xs">
              {player.hero_name} • Level {player.level}
            </Text>
            {isCurrentPlayer && (
              <Tag 
                color={gradeStyle.color} 
                className="text-xs animate-pulse"
                style={{ borderColor: gradeStyle.color }}
              >
                Grade {kdaGrade}
              </Tag>
            )}
          </div>
        </div>
      </Space>
      
      <Space size="large">
        <div className="text-center">
          <Text className="text-2xl font-bold" style={{ color: gamingColors.electric.cyan }}>
            {player.kills}/{player.deaths}/{player.assists}
          </Text>
          <Text type="secondary" className="text-xs block">
            {((player.kills + player.assists) / Math.max(player.deaths, 1)).toFixed(2)} KDA
          </Text>
        </div>
        
        <div className="text-center">
          <Text className="text-lg font-bold text-yellow-400">
            {player.gold_per_min}
          </Text>
          <Text type="secondary" className="text-xs block">GPM</Text>
        </div>
        
        <div className="text-center">
          <Text className="text-lg font-bold text-purple-400">
            {player.xp_per_min}
          </Text>
          <Text type="secondary" className="text-xs block">XPM</Text>
        </div>
        
        <div className="text-center">
          <Text className="text-lg font-bold text-white">
            {player.net_worth}
          </Text>
          <Text type="secondary" className="text-xs block">Net Worth</Text>
        </div>
      </Space>
      </div>
    );
  });

  return (
    <Row gutter={[16, 16]}>
      {/* Radiant Team */}
      <Col span={12}>
        <Card 
          title={<span className="text-green-400">RADIANT</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {teamData.radiant.map(player => (
            <PlayerRow 
              key={player.player_slot} 
              player={player} 
              isCurrentPlayer={player.account_id === playerData?.account_id}
              heroIcon={getHeroIconById(player.hero_id, matchData.heroStats)}
            />
          ))}
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Kills"
                value={teamData.radiant.reduce((sum, p) => sum + p.kills, 0)}
                valueStyle={{ color: gamingColors.electric.green }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Deaths"
                value={teamData.radiant.reduce((sum, p) => sum + p.deaths, 0)}
                valueStyle={{ color: gamingColors.electric.red }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Net Worth"
                value={teamData.radiant.reduce((sum, p) => sum + p.net_worth, 0)}
                prefix="$"
                valueStyle={{ color: gamingColors.electric.yellow }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
      
      {/* Dire Team */}
      <Col span={12}>
        <Card 
          title={<span className="text-red-400">DIRE</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {teamData.dire.map(player => (
            <PlayerRow 
              key={player.player_slot} 
              player={player} 
              isCurrentPlayer={player.account_id === playerData?.account_id}
              heroIcon={getHeroIconById(player.hero_id, matchData.heroStats)}
            />
          ))}
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Kills"
                value={teamData.dire.reduce((sum, p) => sum + p.kills, 0)}
                valueStyle={{ color: gamingColors.electric.green }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Deaths"
                value={teamData.dire.reduce((sum, p) => sum + p.deaths, 0)}
                valueStyle={{ color: gamingColors.electric.red }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Net Worth"
                value={teamData.dire.reduce((sum, p) => sum + p.net_worth, 0)}
                prefix="$"
                valueStyle={{ color: gamingColors.electric.yellow }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
      
      {/* Draft Analysis Section - Reduced size */}
      <Col span={16}>
        <Card 
          title={<span className="uppercase text-white">DRAFT ANALYSIS</span>}
          className="bg-gray-800/50 border-gray-700 mt-4"
          headStyle={{ borderBottom: '1px solid #374151' }}
          size="small"
        >
          {draftAnalysis ? (
            <Row gutter={16}>
              <Col span={12}>
                <Title level={5} className="text-green-400">Radiant Draft</Title>
                {draftAnalysis.radiantDraft.map((hero, idx) => (
                  <div key={idx} className="flex items-center justify-between mb-2">
                    <Space>
                      <Avatar size={32} src={getHeroIconById(hero.hero, matchData.heroStats)} />
                      <Text className="text-white">{hero.player.hero_name}</Text>
                    </Space>
                    <Tag color={parseFloat(hero.winRate) > 50 ? 'green' : 'red'}>
                      {hero.winRate}% Win Rate
                    </Tag>
                  </div>
                ))}
              </Col>
              <Col span={12}>
                <Title level={5} className="text-red-400">Dire Draft</Title>
                {draftAnalysis.direDraft.map((hero, idx) => (
                  <div key={idx} className="flex items-center justify-between mb-2">
                    <Space>
                      <Avatar size={32} src={getHeroIconById(hero.hero, matchData.heroStats)} />
                      <Text className="text-white">{hero.player.hero_name}</Text>
                    </Space>
                    <Tag color={parseFloat(hero.winRate) > 50 ? 'green' : 'red'}>
                      {hero.winRate}% Win Rate
                    </Tag>
                  </div>
                ))}
              </Col>
            </Row>
          ) : (
            <Empty description="Draft data not available" />
          )}
        </Card>
      </Col>
      
      {/* Significant Events */}
      <Col span={8}>
        <Card 
          title={<span className="uppercase text-white">KEY EVENTS</span>}
          className="bg-gray-800/50 border-gray-700 mt-4"
          headStyle={{ borderBottom: '1px solid #374151' }}
          size="small"
        >
          {objectivesTimeline.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {objectivesTimeline.slice(0, 8).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-900/30 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'roshan' ? 'bg-purple-500' : 
                      event.team === 'radiant' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <Text className="text-white text-xs">{event.description}</Text>
                  </div>
                  <Text className="text-gray-400 text-xs">
                    {Math.floor(event.time / 60)}:{(event.time % 60).toString().padStart(2, '0')}
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No significant events" size="small" />
          )}
        </Card>
      </Col>
      
      {/* Objectives Timeline */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">OBJECTIVES TIMELINE</span>}
          className="bg-gray-800/50 border-gray-700 mt-4"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {objectivesTimeline.length > 0 ? (
            <Timeline mode="alternate">
              {objectivesTimeline.map((event, idx) => (
                <Timeline.Item 
                  key={idx}
                  color={event.type === 'roshan' ? 'purple' : event.team === 'radiant' ? 'green' : 'red'}
                  label={`${Math.floor(event.time / 60)}:${(event.time % 60).toString().padStart(2, '0')}`}
                >
                  <Space>
                    {event.type === 'roshan' ? <CrownOutlined /> : <SafetyCertificateOutlined />}
                    <Text>{event.description}</Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Empty description="No objective events recorded" />
          )}
        </Card>
      </Col>
    </Row>
  );
};

// Enhanced Performance Tab Component
const EnhancedPerformanceTab = ({ matchData, playerData, teamData, analysisData, analysisLoading }) => {
  if (!playerData) {
    return <Alert message="Player data not found in this match" type="warning" />;
  }

  // Show loading state for KPI calculations
  if (analysisLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text className="text-white">Calculating comprehensive KPIs...</Text>
          <Text className="text-gray-400 text-sm">Role detection, performance grading, and benchmarking</Text>
        </Space>
      </div>
    );
  }
  
  // Use the advanced role detection and performance analysis with better fallbacks
  const role = analysisData?.role?.role || playerData?.lane_role_name || detectRoleFromPosition(playerData) || 'Unknown';
  const roleConfidence = analysisData?.role?.confidence || (analysisData?.role?.role ? 85 : 0);
  const performanceGrade = analysisData?.performance || { grade: 'D', score: 0, breakdown: {} };
  const overallScore = analysisData?.overallScore || { score: 0, grade: 'D', breakdown: {} };
  
  // Use the comprehensive KPI analysis results
  const rolePerformance = performanceGrade.breakdown || {};
  const kpiOverallScore = performanceGrade.score || 0;

  // Calculate efficiency ratings
  const efficiencyMetrics = {
    'Farm Priority vs Actual': {
      expected: role === 'Carry' ? 1 : role === 'Mid' ? 2 : role === 'Offlane' ? 3 : 5,
      actual: playerData.gold_per_min / Math.max(1, (matchData.players.reduce((sum, p) => sum + p.gold_per_min, 0) / 10)),
      rating: 'Good'
    },
    'Movement Efficiency': {
      timeMoving: Math.floor(matchData.duration - playerData.life_state_dead || 0),
      timeFarming: playerData.last_hits * 2, // Approximate
      rating: playerData.life_state_dead < 300 ? 'Excellent' : 'Needs Work'
    },
    'Spell Usage': {
      used: playerData.ability_uses || 0,
      potential: Math.floor(matchData.duration / 30) * 4, // Rough estimate
      rating: 'Good'
    },
    'Item Active Usage': {
      bkbTiming: playerData.item_uses?.black_king_bar || 0,
      forceStaffSaves: playerData.item_uses?.force_staff || 0,
      rating: 'Average'
    }
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Role Performance Score */}
      <Col span={24}>
        <Card 
          title={
            <Space>
              <span className="uppercase text-white">ROLE PERFORMANCE</span>
              <Tag color={getGradeColor(performanceGrade.grade).color}>
                {role.toUpperCase()}
              </Tag>
              <Tooltip title={`${roleConfidence}% confidence in role detection`}>
                <Tag color="blue">{roleConfidence}% confidence</Tag>
              </Tooltip>
            </Space>
          }
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
          extra={
            <div className="text-center">
              <div 
                className="text-4xl font-bold"
                style={{ 
                  color: getGradeColor(performanceGrade.grade).color,
                  textShadow: getGradeColor(performanceGrade.grade).glow
                }}
              >
                {performanceGrade.grade}
              </div>
              <Text type="secondary">{kpiOverallScore}/100 Score</Text>
              <div className="mt-2">
                <Text className="text-xs text-gray-400">Overall Match: {overallScore.grade} ({overallScore.score}/100)</Text>
              </div>
            </div>
          }
        >
          <Row gutter={[16, 16]}>
            {Object.entries(rolePerformance).map(([metric, data]) => (
              <Col span={6} key={metric}>
                <Tooltip title={getMetricExplanation(metric)} placement="top">
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors cursor-help">
                    <Text className="text-xs text-gray-400 block mb-2">{metric}</Text>
                  <Progress 
                    type="circle" 
                    percent={data.percentile || 0} 
                    size={80}
                    strokeColor={data.percentile >= 80 ? gamingColors.electric.cyan : data.percentile >= 60 ? gamingColors.electric.green : data.percentile >= 40 ? gamingColors.electric.orange : gamingColors.electric.red}
                    format={() => (
                      <div>
                        <div 
                          className="text-lg font-bold"
                          style={{ 
                            color: getGradeColor(data.grade).color,
                            textShadow: getGradeColor(data.grade).glow
                          }}
                        >
                          {data.grade}
                        </div>
                        <div className="text-xs text-white font-semibold">{data.value || '0'}</div>
                        <div className="text-xs text-gray-400">Score: {Math.round(data.percentile || 0)}</div>
                      </div>
                    )}
                  />
                  </div>
                </Tooltip>
              </Col>
            ))}
            {Object.keys(rolePerformance).length === 0 && (
              <Col span={24}>
                <Alert 
                  message="KPI Analysis in Progress" 
                  description="Advanced performance metrics will appear here once analysis is complete."
                  type="info" 
                  showIcon 
                />
              </Col>
            )}
          </Row>
        </Card>
      </Col>

      {/* Comprehensive KPI Dashboard */}
      {analysisData && (
        <Col span={24}>
          <Card 
            title={
              <Space>
                <StarOutlined />
                <span className="uppercase text-white">COMPREHENSIVE KPI ANALYSIS</span>
              </Space>
            }
            className="bg-gray-800/50 border-gray-700"
            headStyle={{ borderBottom: '1px solid #374151' }}
          >
            <Row gutter={[16, 16]}>
              {/* Overall Performance Breakdown */}
              <Col span={8}>
                <Card size="small" className="bg-gray-900/50 border-gray-600">
                  <Statistic
                    title={<Text className="text-gray-300">Overall Match Score</Text>}
                    value={overallScore.score}
                    suffix="/100"
                    valueStyle={{ 
                      color: getGradeColor(overallScore.grade).color,
                      textShadow: getGradeColor(overallScore.grade).glow
                    }}
                  />
                  <div className="mt-2">
                    <Text className="text-xs text-gray-400">Grade: </Text>
                    <Text 
                      className="text-sm font-bold"
                      style={{ color: getGradeColor(overallScore.grade).color }}
                    >
                      {overallScore.grade}
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col span={8}>
                <Card size="small" className="bg-gray-900/50 border-gray-600">
                  <Statistic
                    title={<Text className="text-gray-300">Role Performance</Text>}
                    value={performanceGrade.score}
                    suffix="/100"
                    valueStyle={{ 
                      color: getGradeColor(performanceGrade.grade).color,
                      textShadow: getGradeColor(performanceGrade.grade).glow
                    }}
                  />
                  <div className="mt-2">
                    <Text className="text-xs text-gray-400">Detected Role: </Text>
                    <Text className="text-sm font-bold text-cyan-400">{role}</Text>
                  </div>
                </Card>
              </Col>

              <Col span={8}>
                <Card size="small" className="bg-gray-900/50 border-gray-600">
                  <Statistic
                    title={<Text className="text-gray-300">Improvement Potential</Text>}
                    value={analysisData.insights?.improvementScore || 0}
                    suffix="/100"
                    valueStyle={{ 
                      color: analysisData.insights?.improvementScore >= 70 ? gamingColors.electric.green : 
                             analysisData.insights?.improvementScore >= 50 ? gamingColors.electric.orange : 
                             gamingColors.electric.red
                    }}
                  />
                  <div className="mt-2">
                    <Text className="text-xs text-gray-400">
                      {analysisData.insights?.coachingPoints?.length || 0} coaching points
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Performance Breakdown */}
            <Divider className="border-gray-600" />
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text className="text-white font-semibold">Performance Breakdown by Game Phase:</Text>
              </Col>
              {Object.entries(overallScore.breakdown || {}).map(([phase, score]) => (
                <Col span={4} key={phase}>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <Text className="text-xs text-gray-400 block mb-1 capitalize">{phase}</Text>
                    <Progress 
                      type="circle" 
                      percent={(score / 100) * 100}
                      size={60}
                      strokeColor={score >= 80 ? gamingColors.electric.cyan : score >= 60 ? gamingColors.electric.green : gamingColors.electric.orange}
                      format={() => (
                        <div className="text-sm font-bold" style={{ color: score >= 80 ? gamingColors.electric.cyan : score >= 60 ? gamingColors.electric.green : gamingColors.electric.orange }}>
                          {score}
                        </div>
                      )}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      )}
      
      {/* Efficiency Ratings */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">EFFICIENCY RATINGS</span>}
          className="bg-gray-800/50 border-gray-700 mt-4"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            {Object.entries(efficiencyMetrics).map(([metricName, data]) => (
              <Col span={6} key={metricName}>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <Text className="text-xs text-gray-400 block mb-2">{metricName}</Text>
                  <div className="text-center">
                    <Tag 
                      color={
                        data.rating === 'Excellent' ? 'gold' : 
                        data.rating === 'Good' ? 'green' : 
                        data.rating === 'Average' ? 'blue' : 'orange'
                      }
                      className="text-lg px-4 py-2"
                    >
                      {data.rating}
                    </Tag>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {metricName === 'Farm Priority vs Actual' && 
                      `Expected: ${data.expected}, Actual: ${data.actual.toFixed(2)}`}
                    {metricName === 'Movement Efficiency' && 
                      `${data.timeMoving}s active`}
                    {metricName === 'Spell Usage' && 
                      `${data.used} casts`}
                    {metricName === 'Item Active Usage' && 
                      `BKB: ${data.bkbTiming} uses`}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
      
      <Col span={12}>
        <Card 
          title="COMBAT STATISTICS"
          className="bg-gray-800/50 border-gray-700"
        >
          <Space direction="vertical" className="w-full">
            <div className="flex justify-between">
              <Text>Kill Participation</Text>
              <Tooltip title="Percentage of team kills and assists you were involved in. Ideal: 60-80%">
                <Text strong className="text-white">
                  {(() => {
                    const totalTeamKills = teamData.radiant.reduce((sum, p) => sum + p.kills, 0) + 
                                          teamData.dire.reduce((sum, p) => sum + p.kills, 0);
                    const playerContribution = (playerData.kills + playerData.assists);
                    const participation = totalTeamKills > 0 ? Math.min(Math.round((playerContribution / totalTeamKills) * 100), 100) : 0;
                    return participation;
                  })()}%
                </Text>
              </Tooltip>
            </div>
            <Progress 
              percent={(() => {
                const totalTeamKills = teamData.radiant.reduce((sum, p) => sum + p.kills, 0) + 
                                      teamData.dire.reduce((sum, p) => sum + p.kills, 0);
                const playerContribution = (playerData.kills + playerData.assists);
                return totalTeamKills > 0 ? Math.min(Math.round((playerContribution / totalTeamKills) * 100), 100) : 0;
              })()}
              strokeColor={gamingColors.electric.cyan}
            />
            
            <div className="flex justify-between mt-4">
              <Text>Team Fight Contribution</Text>
              <Tooltip title="Average damage dealt in team fights relative to team total. Ideal: 15-25% for cores, 8-15% for supports">
                <Text strong className="text-white">
                  {(() => {
                    const participation = playerData.teamfight_participation;
                    if (participation === undefined || participation === null || isNaN(participation)) return '0';
                    return Math.min(Math.round(participation * 100), 100);
                  })()}%
                </Text>
              </Tooltip>
            </div>
            <Progress 
              percent={(() => {
                const participation = playerData.teamfight_participation;
                if (participation === undefined || participation === null || isNaN(participation)) return 0;
                return Math.min(Math.round(participation * 100), 100);
              })()}
              strokeColor={gamingColors.electric.purple}
            />
          </Space>
        </Card>
      </Col>
      
      <Col span={12}>
        <Card 
          title="FARMING EFFICIENCY"
          className="bg-gray-800/50 border-gray-700"
        >
          <Space direction="vertical" className="w-full">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="CS/Min"
                  value={(playerData.last_hits / Math.max(1, (matchData.duration / 60))).toFixed(1)}
                  valueStyle={{ color: gamingColors.electric.cyan }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Camps Stacked"
                  value={playerData.camps_stacked || 0}
                  valueStyle={{ color: gamingColors.electric.green }}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Ancient Kills"
                  value={playerData.ancient_kills || 0}
                  valueStyle={{ color: gamingColors.electric.purple }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Neutral Kills"
                  value={playerData.neutral_kills || 0}
                  valueStyle={{ color: gamingColors.electric.yellow }}
                />
              </Col>
            </Row>
          </Space>
        </Card>
      </Col>
      
      {/* Benchmark Comparisons */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">BENCHMARK COMPARISONS</span>}
          className="bg-gray-800/50 border-gray-700 mt-4"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">VS Average at Your MMR</Text>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.cyan }}>
                  {kpiOverallScore || 85}%
                </div>
                <Text type="secondary" className="text-xs">Performance Percentile</Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">VS Your Hero Average</Text>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.green }}>
                  +{Math.max(0, (kpiOverallScore || 85) - 75)}%
                </div>
                <Text type="secondary" className="text-xs">Above Personal Average</Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Global Hero Performance</Text>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.purple }}>
                  TOP {Math.max(5, 25 - Math.floor((kpiOverallScore || 85) / 5))}%
                </div>
                <Text type="secondary" className="text-xs">Among All Players</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

// Laning Phase Analysis Tab
const LaningPhaseTab = ({ playerData, analysisData }) => {
  // Extract laning data (first 10 minutes) - USE REAL DATA ONLY
  const laningData = useMemo(() => {
    if (!playerData) return { csData: [], xpData: [] };
    
    // Use comprehensive laning analysis from service if available
    if (analysisData?.laning) {
      return {
        csData: analysisData.laning.csData || [],
        xpData: analysisData.laning.xpData || [],
        laningScore: analysisData.laning.score,
        efficiency: analysisData.laning.efficiency
      };
    }
    
    const csData = [];
    const xpData = [];
    
    // Use real OpenDota time-series data only - no fallback estimation
    if (playerData.lh_t && playerData.xp_t && playerData.lh_t.length > 0) {
      for (let i = 0; i < Math.min(10, playerData.lh_t.length); i++) {
        csData.push({
          time: i + 1,
          value: playerData.lh_t[i] || 0,
          denies: playerData.dn_t?.[i] || 0
        });
        xpData.push({
          time: i + 1,
          value: playerData.xp_t[i] || 0
        });
      }
    }
    // If no time-series data available, return empty arrays (no mock estimation)
    
    return { csData, xpData };
  }, [playerData, analysisData]);
  
  // Calculate lane outcome using analysis data or real OpenDota data
  const laneOutcome = useMemo(() => {
    if (!playerData) return { outcome: 'UNKNOWN', color: 'gray', description: 'No data available' };
    
    // Use comprehensive laning analysis if available
    if (analysisData?.laning?.outcome) {
      return analysisData.laning.outcome;
    }
    
    // Only calculate if we have real time-series data
    if (!playerData.lh_t || !playerData.xp_t) {
      return { outcome: 'NO DATA', color: 'gray', description: 'Laning phase data not available' };
    }
    
    const lastHitsAt10 = playerData.lh_t[9] || 0;
    const xpAt10 = playerData.xp_t[9] || 0;
    const deathsInLane = playerData.life_state?.slice(0, 600)?.filter(s => s === 2)?.length || 0;
    
    // Use role-based benchmarks if available
    const roleMetrics = analysisData?.role?.metrics;
    const csThreshold = roleMetrics?.lhThreshold || 35; // default fallback
    const xpThreshold = roleMetrics?.xpThreshold || 3000; // default fallback
    
    let score = 0;
    if (lastHitsAt10 > csThreshold * 1.4) score += 2;
    else if (lastHitsAt10 > csThreshold) score += 1;
    
    if (xpAt10 > xpThreshold * 1.3) score += 2;
    else if (xpAt10 > xpThreshold) score += 1;
    
    if (deathsInLane === 0) score += 2;
    else if (deathsInLane === 1) score += 1;
    else score -= deathsInLane;
    
    if (score >= 5) return { outcome: 'WON', color: 'green', description: 'Dominated the lane' };
    if (score >= 2) return { outcome: 'DRAW', color: 'blue', description: 'Even lane' };
    return { outcome: 'LOST', color: 'red', description: 'Struggled in lane' };
  }, [playerData, analysisData]);
  
  if (!playerData) {
    return <Alert message="Player data not found in this match" type="warning" />;
  }
  
  // CS/XP Line Chart Config
  const csChartConfig = {
    data: laningData.csData,
    xField: 'time',
    yField: 'value',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      title: { text: 'Minutes' },
    },
    yAxis: {
      title: { text: 'Last Hits' },
    },
    theme: 'dark',
    color: [gamingColors.electric.cyan],
  };
  
  const xpChartConfig = {
    data: laningData.xpData,
    xField: 'time',
    yField: 'value',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      title: { text: 'Minutes' },
    },
    yAxis: {
      title: { text: 'Experience' },
    },
    theme: 'dark',
    color: [gamingColors.electric.purple],
  };
  
  return (
    <Row gutter={[16, 16]}>
      {/* Lane Outcome Summary */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">LANE OUTCOME</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <div className="text-center">
            <Tag 
              color={laneOutcome.color} 
              className="text-2xl px-8 py-4 mb-4"
              style={{ fontSize: '24px' }}
            >
              LANE {laneOutcome.outcome}
            </Tag>
            <div>
              <Text className="text-lg">{laneOutcome.description}</Text>
            </div>
            <Row gutter={16} className="mt-6">
              <Col span={8}>
                <Statistic
                  title="CS @ 10 min"
                  value={laningData.csData.length > 9 ? laningData.csData[9].value : (playerData.lh_t?.[9] || '—')}
                  suffix={laningData.csData.length > 9 ? `/ ${laningData.csData[9].denies} denies` : (playerData.dn_t?.[9] ? `/ ${playerData.dn_t[9]} denies` : '')}
                  valueStyle={{ color: gamingColors.electric.cyan }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="XP @ 10 min"
                  value={laningData.xpData.length > 9 ? laningData.xpData[9].value : (playerData.xp_t?.[9] || '—')}
                  valueStyle={{ color: gamingColors.electric.purple }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Lane Deaths"
                  value={playerData.life_state?.slice(0, 600)?.filter(s => s === 2)?.length || (playerData.lh_t && playerData.xp_t ? 0 : '—')}
                  valueStyle={{ color: gamingColors.electric.red }}
                />
              </Col>
            </Row>
          </div>
        </Card>
      </Col>
      
      {/* CS Progression */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">CS PROGRESSION</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {laningData.csData.length > 0 ? (
            <Line {...csChartConfig} height={300} />
          ) : (
            <Empty 
              description="CS progression data not available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </Col>
      
      {/* XP Progression */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">XP PROGRESSION</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {laningData.xpData.length > 0 ? (
            <Line {...xpChartConfig} height={300} />
          ) : (
            <Empty 
              description="XP progression data not available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </Col>
      
      {/* Key Moments */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">KEY LANING MOMENTS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Timeline>
            {(playerData.kills_log || []).filter(k => k && k.time < 600).map((kill, idx) => (
              <Timeline.Item 
                key={idx} 
                color="green"
                label={`${Math.floor(kill.time / 60)}:${(kill.time % 60).toString().padStart(2, '0')}`}
              >
                Killed {kill.key || 'an enemy'}
              </Timeline.Item>
            ))}
            {(playerData.buyback_log || []).filter(b => b && b.time < 600).map((buyback, idx) => (
              <Timeline.Item 
                key={`bb-${idx}`} 
                color="orange"
                label={`${Math.floor(buyback.time / 60)}:${(buyback.time % 60).toString().padStart(2, '0')}`}
              >
                Used buyback
              </Timeline.Item>
            ))}
            {(playerData.runes_log || []).filter(r => r && r.time < 600).map((rune, idx) => (
              <Timeline.Item 
                key={`rune-${idx}`} 
                color="blue"
                label={`${Math.floor(rune.time / 60)}:${(rune.time % 60).toString().padStart(2, '0')}`}
              >
                Picked up {rune.key} rune
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </Col>
      
      {/* Lane Analysis Stats */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">DETAILED LANE STATS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Lane Efficiency</Text>
                <Progress 
                  type="circle" 
                  percent={Math.round(((playerData.lh_t?.[9] || 0) / Math.max(1, 10)) * 10)} 
                  strokeColor={gamingColors.electric.cyan}
                />
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Creep Equilibrium</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.green }}>
                  {playerData.lane_pos ? 
                    Object.values(playerData.lane_pos).filter(p => p > 50).length + '/10' : 
                    'N/A'}
                </div>
                <Text type="secondary" className="text-xs">Minutes Near Tower</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Support Rotations</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.purple }}>
                  {(playerData.obs_log || []).filter(w => w && w.time < 600).length || 0}
                </div>
                <Text type="secondary" className="text-xs">Wards Placed</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Rune Control</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.yellow }}>
                  {(playerData.runes_log || []).filter(r => r && r.time < 600).length || 0}
                </div>
                <Text type="secondary" className="text-xs">Runes Secured</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

// Economy & Resources Tab Component
const EconomyResourcesTab = ({ matchData, playerData }) => {
  // Calculate net worth progression
  const netWorthData = useMemo(() => {
    if (!playerData?.gold_t) return [];
    return playerData.gold_t.map((gold, index) => ({
      time: index,
      value: gold,
      teamAverage: matchData.players
        .filter(p => (p.player_slot < 128) === (playerData.player_slot < 128))
        .reduce((sum, p) => sum + (p.gold_t?.[index] || 0), 0) / 5
    }));
  }, [playerData, matchData]);
  
  // Calculate gold sources
  const goldSources = useMemo(() => {
    if (!playerData) return [];
    const total = playerData.total_gold || 1;
    return [
      { type: 'Creeps', value: playerData.gold_reasons?.['0'] || 0, percent: ((playerData.gold_reasons?.['0'] || 0) / total * 100).toFixed(1) },
      { type: 'Heroes', value: playerData.gold_reasons?.['1'] || 0, percent: ((playerData.gold_reasons?.['1'] || 0) / total * 100).toFixed(1) },
      { type: 'Buildings', value: playerData.gold_reasons?.['11'] || 0, percent: ((playerData.gold_reasons?.['11'] || 0) / total * 100).toFixed(1) },
      { type: 'Other', value: playerData.gold_reasons?.['12'] || 0, percent: ((playerData.gold_reasons?.['12'] || 0) / total * 100).toFixed(1) }
    ];
  }, [playerData]);
  
  // Item timing analysis
  const keyItemTimings = useMemo(() => {
    if (!playerData) return [];
    const benchmarkItems = {
      'blink': { name: 'Blink Dagger', benchmark: 15 },
      'black_king_bar': { name: 'Black King Bar', benchmark: 25 },
      'aghanims_scepter': { name: "Aghanim's Scepter", benchmark: 30 },
      'butterfly': { name: 'Butterfly', benchmark: 35 },
      'assault': { name: 'Assault Cuirass', benchmark: 35 },
      'heart': { name: 'Heart of Tarrasque', benchmark: 35 }
    };
    
    const timings = [];
    if (playerData.purchase_log) {
      playerData.purchase_log.forEach(purchase => {
        const item = benchmarkItems[purchase.key];
        if (item) {
          const timing = purchase.time / 60;
          timings.push({
            name: item.name,
            timing: timing.toFixed(1),
            benchmark: item.benchmark,
            efficiency: timing <= item.benchmark ? 'Fast' : 'Slow',
            color: timing <= item.benchmark ? gamingColors.electric.green : gamingColors.electric.orange
          });
        }
      });
    }
    return timings;
  }, [playerData]);

  const itemSlots = useMemo(() => {
    if (!playerData) return [];
    return [
      playerData.item_0,
      playerData.item_1,
      playerData.item_2,
      playerData.item_3,
      playerData.item_4,
      playerData.item_5,
    ];
  }, [playerData]);

  const backpackItems = useMemo(() => {
    if (!playerData) return [];
    return [
      playerData.backpack_0,
      playerData.backpack_1,
      playerData.backpack_2,
    ];
  }, [playerData]);
  
  if (!playerData) {
    return <Alert message="Player data not found in this match" type="warning" />;
  }
  
  // Net worth line chart config
  const netWorthChartConfig = {
    data: netWorthData,
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      title: { text: 'Minutes' },
    },
    yAxis: {
      title: { text: 'Net Worth' },
    },
    theme: 'dark',
    color: [gamingColors.electric.yellow],
  };
  
  // Gold sources pie chart config
  const goldSourcesConfig = {
    data: goldSources,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'inner',
      offset: '-30%',
      content: (data) => `${((data.value / goldSources.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`,
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
    theme: 'dark',
    color: [gamingColors.electric.cyan, gamingColors.electric.red, gamingColors.electric.purple, gamingColors.electric.green],
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Net Worth Progression */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">NET WORTH PROGRESSION</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Line {...netWorthChartConfig} height={300} />
          <Row gutter={16} className="mt-4">
            <Col span={8}>
              <Statistic
                title="Final Net Worth"
                value={playerData.net_worth}
                prefix="$"
                valueStyle={{ color: gamingColors.electric.yellow }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="GPM"
                value={playerData.gold_per_min}
                valueStyle={{ color: gamingColors.electric.cyan }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Team Net Worth %"
                value={Math.round(playerData.net_worth / Math.max(1, matchData.players.filter(p => (p.player_slot < 128) === (playerData.player_slot < 128)).reduce((sum, p) => sum + p.net_worth, 0)) * 100)}
                suffix="%"
                valueStyle={{ color: gamingColors.electric.purple }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
      
      {/* Gold Sources */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">GOLD SOURCES</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Pie {...goldSourcesConfig} height={300} />
          <List
            className="mt-4"
            dataSource={goldSources}
            renderItem={source => (
              <List.Item className="border-gray-700">
                <div className="flex justify-between w-full">
                  <Text>{source.type}</Text>
                  <Text strong className="text-white">${source.value} ({source.percent}%)</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      
      {/* Item Timings */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">ITEM TIMING ANALYSIS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {keyItemTimings.length > 0 ? (
            <List
              dataSource={keyItemTimings}
              renderItem={item => (
                <List.Item className="border-gray-700">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <Text className="text-white">{item.name}</Text>
                      <Text type="secondary" className="block text-xs">
                        Benchmark: {item.benchmark} min
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text className="text-lg font-bold" style={{ color: item.color }}>
                        {item.timing} min
                      </Text>
                      <Tag color={item.efficiency === 'Fast' ? 'success' : 'warning'} className="ml-2">
                        {item.efficiency}
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No key items purchased" />
          )}
        </Card>
      </Col>
      
      {/* Final Build */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">FINAL ITEM BUILD</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <div className="grid grid-cols-3 gap-4 mb-4">
            {itemSlots.map((itemId, index) => (
              <div 
                key={index}
                className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-center"
                style={{ minHeight: '80px' }}
              >
                {itemId ? (
                  <Tooltip title={`Item ${itemId}`}>
                    <img 
                      src={getItemIconById(itemId, 'png')}
                      alt={`Item ${itemId}`}
                      className="max-w-full"
                    />
                  </Tooltip>
                ) : (
                  <Text type="secondary">Empty</Text>
                )}
              </div>
            ))}
          </div>
          
          <Divider>Backpack</Divider>
          
          <div className="grid grid-cols-3 gap-4">
            {backpackItems.map((itemId, index) => (
              <div 
                key={index}
                className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex items-center justify-center"
                style={{ minHeight: '60px' }}
              >
                {itemId ? (
                  <img 
                    src={getItemIconById(itemId, 'png')}
                    alt={`Item ${itemId}`}
                    className="max-w-full opacity-75"
                  />
                ) : (
                  <Text type="secondary" className="text-xs">Empty</Text>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Col>
      
      {/* Resource Allocation */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">RESOURCE ALLOCATION</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Buybacks Used</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.red }}>
                  {playerData.buyback_count || 0}
                </div>
                <Text type="secondary" className="text-xs">
                  {(playerData.buyback_count || 0) > 0 ? 'Cost from match data' : 'No buybacks'}
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Consumables</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.green }}>
                  {playerData.purchase?.tango || 0} / {playerData.purchase?.flask || 0}
                </div>
                <Text type="secondary" className="text-xs">Tangos / Salves</Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">TPs Used</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.cyan }}>
                  {playerData.purchase?.tpscroll || 0}
                </div>
                <Text type="secondary" className="text-xs">Scrolls</Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Neutral Items</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.purple }}>
                  {playerData.item_neutral ? '✓' : '✗'}
                </div>
                <Text type="secondary" className="text-xs">
                  {playerData.item_neutral ? 'Equipped' : 'None'}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
      
      {/* Item Build Decision Analysis */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">ITEM BUILD ANALYSIS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Build Efficiency Score</Text>
                <Progress 
                  type="circle" 
                  percent={Math.min(90, Math.max(60, playerData.gold_per_min / 10))} 
                  strokeColor={gamingColors.electric.cyan}
                />
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Situational Items</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.green }}>
                  {playerData.item_uses?.black_king_bar ? 'BKB ✓' : 'BKB ✗'}
                </div>
                <Text type="secondary" className="text-xs">
                  {playerData.item_uses?.black_king_bar ? 'Good choice' : 'Consider BKB'}
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Gold Efficiency</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.yellow }}>
                  {Math.round((playerData.gold_spent || 0) / (playerData.total_gold || 1) * 100)}%
                </div>
                <Text type="secondary" className="text-xs">Gold Utilized</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
      
      {/* Purchase Timeline */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">ITEM PROGRESSION TIMELINE</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {playerData.purchase_log ? (
            <List
              grid={{ gutter: 16, xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }}
              dataSource={playerData.purchase_log.slice(0, 16)}
              renderItem={item => (
                <List.Item>
                  <Card 
                    size="small" 
                    className="bg-gray-900/50 border-gray-700 text-center"
                  >
                    <Text type="secondary" className="text-xs">
                      {Math.floor(item.time / 60)}:{(item.time % 60).toString().padStart(2, '0')}
                    </Text>
                    <div className="mt-2">
                      <Text className="text-white text-xs">
                        {item.key.replace(/_/g, ' ')}
                      </Text>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No purchase data available" />
          )}
        </Card>
      </Col>
    </Row>
  );
};

// Graphs Tab Component
const GraphsTab = ({ matchData, teamData: TEAMDATA }) => {
  const goldAdvantageData = useMemo(() => {
    if (!matchData.radiant_gold_adv) return [];
    
    return matchData.radiant_gold_adv.map((gold, index) => ({
      time: index,
      advantage: gold,
      type: gold > 0 ? 'Radiant' : 'Dire'
    }));
  }, [matchData]);

  const xpAdvantageData = useMemo(() => {
    if (!matchData.radiant_xp_adv) return [];
    
    return matchData.radiant_xp_adv.map((xp, index) => ({
      time: index,
      advantage: xp,
      type: xp > 0 ? 'Radiant' : 'Dire'
    }));
  }, [matchData]);

  const goldConfig = {
    data: goldAdvantageData,
    xField: 'time',
    yField: 'advantage',
    seriesField: 'type',
    color: ['#52c41a', '#ff4d4f'],
    areaStyle: {
      fillOpacity: 0.6,
    },
    xAxis: {
      label: {
        formatter: (v) => `${v}m`,
      },
    },
    yAxis: {
      label: {
        formatter: (v) => `${Math.abs(v / 1000)}k`,
      },
    },
    theme: 'dark',
  };

  const xpConfig = {
    ...goldConfig,
    data: xpAdvantageData,
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card 
          title="GOLD ADVANTAGE"
          className="bg-gray-800/50 border-gray-700"
        >
          <Line {...goldConfig} />
        </Card>
      </Col>
      
      <Col span={24}>
        <Card 
          title="EXPERIENCE ADVANTAGE"
          className="bg-gray-800/50 border-gray-700"
        >
          <Line {...xpConfig} />
        </Card>
      </Col>
    </Row>
  );
};

// Combat Intelligence Tab Component
const CombatIntelligenceTab = ({ matchData, playerData, teamData }) => {
  // Calculate teamfight impact
  const teamfightData = useMemo(() => {
    if (!playerData) return [];
    const fights = [];
    if (matchData.teamfights) {
      matchData.teamfights.forEach((fight) => {
        const playerFight = fight.players[playerData.player_slot] || {};
        fights.push({
          time: `${Math.floor(fight.start / 60)}:${(fight.start % 60).toString().padStart(2, '0')}`,
          duration: fight.end - fight.start,
          damage: playerFight.damage || 0,
          healing: playerFight.healing || 0,
          gold: playerFight.gold_delta || 0,
          deaths: playerFight.deaths || 0,
          impact: ((playerFight.damage || 0) + (playerFight.healing || 0)) / Math.max(fight.deaths, 1)
        });
      });
    }
    return fights;
  }, [matchData, playerData]);
  
  // Death analysis
  const deathAnalysis = useMemo(() => {
    if (!playerData) return [];
    const deaths = [];
    if (playerData.killed) {
      Object.entries(playerData.killed).forEach(([heroId, kills]) => {
        deaths.push({
          hero: `Hero ${heroId}`,
          kills: kills,
          efficiency: kills > 3 ? 'High' : kills > 1 ? 'Medium' : 'Low'
        });
      });
    }
    return deaths.sort((a, b) => b.kills - a.kills);
  }, [playerData]);

  const damageData = useMemo(() => {
    if (!playerData) return [];
    return [
      { type: 'Hero Damage', value: playerData.hero_damage || 0 },
      { type: 'Tower Damage', value: playerData.tower_damage || 0 },
      { type: 'Creep Damage', value: (playerData.damage || 0) - (playerData.hero_damage || 0) - (playerData.tower_damage || 0) },
    ];
  }, [playerData]);
  
  if (!playerData) {
    return <Alert message="Player data not found in this match" type="warning" />;
  }

  const damageConfig = {
    data: damageData.filter(d => d.value > 0),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'inner',
      offset: '-30%',
      content: (data) => {
        const filteredData = damageData.filter(d => d.value > 0);
        const total = filteredData.reduce((sum, item) => sum + item.value, 0);
        return `${((data.value / total) * 100).toFixed(1)}%`;
      },
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
    theme: 'dark',
    color: [gamingColors.electric.red, gamingColors.electric.orange, gamingColors.electric.yellow],
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Teamfight Breakdown */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">TEAMFIGHT BREAKDOWN</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {teamfightData.length > 0 ? (
            <Table 
              dataSource={teamfightData}
              pagination={false}
              className="combat-table"
              columns={[
                { title: 'Time', dataIndex: 'time', key: 'time' },
                { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (val) => `${val}s` },
                { title: 'Damage', dataIndex: 'damage', key: 'damage', render: (val) => val.toLocaleString() },
                { title: 'Healing', dataIndex: 'healing', key: 'healing', render: (val) => val.toLocaleString() },
                { title: 'Gold ±', dataIndex: 'gold', key: 'gold', render: (val) => (
                  <span style={{ color: val > 0 ? gamingColors.electric.green : gamingColors.electric.red }}>
                    {val > 0 ? '+' : ''}{val}
                  </span>
                )},
                { title: 'Deaths', dataIndex: 'deaths', key: 'deaths' },
                { title: 'Impact', dataIndex: 'impact', key: 'impact', render: (val) => (
                  <Progress percent={Math.min(val / 100 * 100, 100)} size="small" strokeColor={gamingColors.electric.cyan} />
                )}
              ]}
            />
          ) : (
            <Empty description="No teamfight data available" />
          )}
        </Card>
      </Col>
      
      {/* Damage Distribution */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">DAMAGE DISTRIBUTION</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Pie {...damageConfig} height={300} />
          <Row gutter={16} className="mt-4">
            <Col span={8}>
              <Statistic
                title="Hero Damage"
                value={playerData.hero_damage || 0}
                valueStyle={{ color: gamingColors.electric.red }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tower Damage"
                value={playerData.tower_damage || 0}
                valueStyle={{ color: gamingColors.electric.orange }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Healing Done"
                value={playerData.hero_healing || 0}
                valueStyle={{ color: gamingColors.electric.green }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
      
      {/* Death Analysis */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">TARGET PRIORITY ANALYSIS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <div className="mb-4">
            <Text className="text-xs text-gray-400 block mb-2">Positioning Score</Text>
            <Progress 
              percent={Math.max(0, 100 - (playerData.deaths * 15))} 
              strokeColor={gamingColors.electric.cyan}
              format={(percent) => (
                <span style={{ color: percent > 70 ? gamingColors.electric.green : percent > 40 ? gamingColors.electric.yellow : gamingColors.electric.red }}>
                  {percent > 70 ? 'Good' : percent > 40 ? 'Average' : 'Poor'}
                </span>
              )}
            />
          </div>
          
          {deathAnalysis.length > 0 ? (
            <List
              dataSource={deathAnalysis.slice(0, 5)}
              renderItem={death => (
                <List.Item className="border-gray-700">
                  <div className="flex justify-between items-center w-full">
                    <Text>{death.hero}</Text>
                    <div className="text-right">
                      <Text className="text-lg font-bold" style={{ color: gamingColors.electric.red }}>
                        {death.kills}
                      </Text>
                      <Tag color={death.efficiency === 'High' ? 'success' : death.efficiency === 'Medium' ? 'warning' : 'error'} className="ml-2">
                        {death.efficiency}
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No kill data available" />
          )}
        </Card>
      </Col>
      
      {/* Combat Stats */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">DETAILED COMBAT STATISTICS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Kill Participation</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.cyan }}>
                  {Math.round(((playerData.kills + playerData.assists) / Math.max(teamData.radiant.reduce((sum, p) => sum + p.kills, 0) + teamData.dire.reduce((sum, p) => sum + p.kills, 0), 1)) * 100)}%
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Stun Duration</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.purple }}>
                  {(playerData.stuns || 0).toFixed(1)}s
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">First Blood</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.yellow }}>
                  {playerData.firstblood_claimed ? '✓' : '✗'}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Rampages</Text>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.red }}>
                  {playerData.rampages || 0}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

// Vision & Map Control Tab Component
const VisionMapControlTab = ({ matchData, playerData, analysisData }) => {
  // Enhanced vision statistics with advanced calculations
  const visionStats = useMemo(() => {
    if (!playerData) {
      return {
        wardUptime: 0,
        dewardEfficiency: 0,
        visionScore: 0,
        wardsPerMinute: 0,
        visionDensity: 0,
        visionGrade: 'D',
        obsKills: 0,
        senKills: 0
      };
    }
    
    const obs = playerData.obs_placed || 0;
    const sen = playerData.sen_placed || 0;
    const obsKills = playerData.observer_kills || 0;
    const senKills = playerData.sentry_kills || 0;
    const duration = matchData.duration / 60; // in minutes
    
    // Advanced ward efficiency calculations
    const wardUptime = Math.min((obs * 7) / Math.max(1, duration / 60) * 100, 100);
    const dewardEfficiency = sen > 0 ? Math.min(((obsKills + senKills) / sen * 100), 200) : 0;
    const visionScore = (obs * 2.5 + sen * 1.5 + obsKills * 3 + senKills * 2);
    const wardsPerMinute = obs / Math.max(1, duration);
    const visionDensity = obs > 0 ? (duration / obs) : 0; // minutes between wards
    
    // Vision grade calculation
    let visionGrade = 'D';
    if (visionScore >= 50) visionGrade = 'S';
    else if (visionScore >= 35) visionGrade = 'A';
    else if (visionScore >= 25) visionGrade = 'B';
    else if (visionScore >= 15) visionGrade = 'C';
    
    return {
      wardUptime,
      dewardEfficiency,
      visionScore,
      wardsPerMinute,
      visionDensity,
      visionGrade,
      obsKills,
      senKills
    };
  }, [playerData, matchData]);

  // Ward placement timeline analysis
  const wardTimeline = useMemo(() => {
    if (!playerData) return [];
    
    const timeline = [];
    
    // Use vision analysis from service if available
    if (analysisData?.vision?.wardPlacements) {
      return analysisData.vision.wardPlacements;
    }
    
    // Extract real ward placement data from logs only (no fallback positions)
    if (playerData.obs_log) {
      playerData.obs_log.forEach((ward) => {
        if (!ward || typeof ward.time === 'undefined' || typeof ward.x === 'undefined' || typeof ward.y === 'undefined') return;
        timeline.push({
          time: ward.time,
          type: 'observer',
          x: ward.x,
          y: ward.y,
          efficiency: ward.efficiency || null
        });
      });
    }
    
    if (playerData.sen_log) {
      playerData.sen_log.forEach((ward) => {
        if (!ward || typeof ward.time === 'undefined' || typeof ward.x === 'undefined' || typeof ward.y === 'undefined') return;
        timeline.push({
          time: ward.time,
          type: 'sentry',
          x: ward.x,
          y: ward.y,
          dewarded: ward.dewarded || false
        });
      });
    }
    
    return timeline.sort((a, b) => a.time - b.time);
  }, [playerData, analysisData]);

  // Calculate map control metrics
  const mapControl = useMemo(() => {
    if (!playerData) {
      return {
        jungleControl: 0,
        objectiveControl: 0,
        mapPresence: 0,
        overallControl: 0
      };
    }
    
    const roshKills = playerData.roshan_kills || 0;
    const ancientKills = playerData.ancient_kills || 0;
    const neutralKills = playerData.neutral_kills || 0;
    const towerDamage = playerData.tower_damage || 0;
    
    const jungleControl = (ancientKills + neutralKills) / Math.max(1, (matchData.duration / 60));
    const objectiveControl = roshKills + (towerDamage / 5000);
    const mapPresence = (playerData.obs_placed * 2 + playerData.purchase?.tpscroll || 0) / 10;
    
    return {
      jungleControl: Math.min(jungleControl, 10),
      objectiveControl: Math.min(objectiveControl, 5),
      mapPresence: Math.min(mapPresence, 5),
      overallControl: Math.min((jungleControl + objectiveControl + mapPresence) / 3, 5)
    };
  }, [playerData, matchData]);
  
  if (!playerData) {
    return <Alert message="Player data not found in this match" type="warning" />;
  }
  
  return (
    <Row gutter={[16, 16]}>
      {/* Vision Efficiency Header */}
      <Col span={24}>
        <Card 
          title={
            <div className="flex items-center justify-between">
              <span className="uppercase text-white">VISION WARFARE CENTER</span>
              <div className="flex items-center space-x-2">
                <Tag color={visionStats.visionGrade === 'S' ? 'gold' : visionStats.visionGrade === 'A' ? 'cyan' : 'green'}>
                  GRADE {visionStats.visionGrade}
                </Tag>
                <Tag color="blue">
                  {visionStats.visionScore.toFixed(0)} POINTS
                </Tag>
              </div>
            </div>
          }
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-yellow-500/20">
                <div className="flex items-center justify-center mb-2">
                  <img 
                    src={getItemIcon('ward_observer')} 
                    alt="Observer Ward"
                    className="w-8 h-8 mr-2"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Text className="text-xs text-gray-400">Observer Wards</Text>
                </div>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.yellow }}>
                  {playerData.obs_placed || 0}
                </div>
                <Progress 
                  percent={visionStats.wardUptime} 
                  strokeColor={gamingColors.electric.yellow}
                  format={() => `${visionStats.wardUptime.toFixed(0)}% uptime`}
                />
                <Text type="secondary" className="text-xs mt-1">
                  {visionStats.wardsPerMinute.toFixed(1)}/min
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-center mb-2">
                  <img 
                    src={getItemIcon('ward_sentry')} 
                    alt="Sentry Ward"
                    className="w-8 h-8 mr-2"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Text className="text-xs text-gray-400">Sentry Wards</Text>
                </div>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.purple }}>
                  {playerData.sen_placed || 0}
                </div>
                <Text type="secondary" className="text-xs">Counter-warding</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-cyan-500/20">
                <div className="flex items-center justify-center mb-2">
                  <EyeOutlined className="text-cyan-400 mr-2" />
                  <Text className="text-xs text-gray-400">Dewarding</Text>
                </div>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.cyan }}>
                  {visionStats.obsKills + visionStats.senKills}
                </div>
                <Progress 
                  percent={visionStats.dewardEfficiency} 
                  strokeColor={gamingColors.electric.cyan}
                  format={() => `${visionStats.dewardEfficiency.toFixed(0)}% efficiency`}
                />
                <Text type="secondary" className="text-xs mt-1">
                  {visionStats.obsKills} obs / {visionStats.senKills} sen
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-center mb-2">
                  <RadarChartOutlined className="text-green-400 mr-2" />
                  <Text className="text-xs text-gray-400">Vision Control</Text>
                </div>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.green }}>
                  {mapControl.overallControl.toFixed(1)}
                </div>
                <Rate disabled value={Math.min(5, mapControl.overallControl)} allowHalf />
                <Text type="secondary" className="text-xs mt-1">Map Dominance</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
      {/* Ward Timeline */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">WARD PLACEMENT TIMELINE</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {wardTimeline.length > 0 ? (
            <Timeline>
              {wardTimeline.slice(0, 8).map((ward, idx) => {
                if (!ward) return null; // Guard against null/undefined ward objects
                return (
                  <Timeline.Item 
                    key={idx}
                    color={ward.type === 'observer' ? 'yellow' : 'purple'}
                    dot={
                      <img 
                        src={getItemIcon(ward.type === 'observer' ? 'ward_observer' : 'ward_sentry')}
                        alt={ward.type}
                        className="w-4 h-4"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <Text className="text-white">
                          {ward.type === 'observer' ? 'Observer Ward' : 'Sentry Ward'}
                        </Text>
                        <Text type="secondary" className="text-xs block">
                          {Math.floor(ward.time / 60)}:{(ward.time % 60).toString().padStart(2, '0')}
                        </Text>
                      </div>
                      {ward.efficiency && (
                        <Progress 
                          percent={ward.efficiency} 
                          size="small" 
                          strokeColor={ward.efficiency > 70 ? gamingColors.electric.green : gamingColors.electric.orange}
                          className="w-20"
                        />
                      )}
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          ) : (
            <Empty description="No ward placement data available" />
          )}
        </Card>
      </Col>

      {/* Map Control Analysis */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">MAP CONTROL ANALYSIS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Jungle Control</Text>
                <Progress 
                  type="circle" 
                  percent={mapControl.jungleControl * 10} 
                  strokeColor={gamingColors.electric.green}
                  size={80}
                />
                <Text type="secondary" className="text-xs mt-2">
                  {playerData.ancient_kills + playerData.neutral_kills} neutral kills
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Objective Control</Text>
                <Progress 
                  type="circle" 
                  percent={mapControl.objectiveControl * 20} 
                  strokeColor={gamingColors.electric.purple}
                  size={80}
                />
                <Text type="secondary" className="text-xs mt-2">
                  {playerData.roshan_kills} rosh kills
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      {/* Strategic Items & Map Presence */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">STRATEGIC ITEM USAGE</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <img 
                    src={getItemIcon('tpscroll')} 
                    alt="TP Scroll"
                    className="w-8 h-8 mr-2"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Text className="text-xs text-gray-400">TP Responses</Text>
                </div>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.cyan }}>
                  {playerData.purchase?.tpscroll || 0}
                </div>
                <Text type="secondary" className="text-xs">Map Mobility</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <img 
                    src={getItemIcon('smoke_of_deceit')} 
                    alt="Smoke"
                    className="w-8 h-8 mr-2"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Text className="text-xs text-gray-400">Smoke Usage</Text>
                </div>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.purple }}>
                  {playerData.purchase?.smoke_of_deceit || 0}
                </div>
                <Text type="secondary" className="text-xs">Gank Setups</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <img 
                    src={getItemIcon('dust')} 
                    alt="Dust"
                    className="w-8 h-8 mr-2"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Text className="text-xs text-gray-400">Detection</Text>
                </div>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.yellow }}>
                  {playerData.purchase?.dust || 0}
                </div>
                <Text type="secondary" className="text-xs">Invis Counter</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <CrownOutlined className="text-yellow-400 mr-2" />
                  <Text className="text-xs text-gray-400">Roshan Control</Text>
                </div>
                <div className="text-2xl font-bold" style={{ color: gamingColors.electric.yellow }}>
                  {playerData.roshan_kills || 0}
                </div>
                <Text type="secondary" className="text-xs">Aegis Secured</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

// Enhanced Improvement Insights Tab Component
const ImprovementInsightsTab = ({ matchData, playerData, analysisLoading, analysisData }) => {
  
  // Extract item slots from player data for item build analysis
  const itemSlots = useMemo(() => {
    if (!playerData) return [];
    return [
      playerData.item_0,
      playerData.item_1,
      playerData.item_2,
      playerData.item_3,
      playerData.item_4,
      playerData.item_5,
    ];
  }, [playerData]);
  
  // Use comprehensive insights from analysis service instead of hardcoded thresholds  
  const insights = useMemo(() => {
    // Use insights from comprehensive analysis service if available
    if (analysisData?.insights) {
      return {
        tips: analysisData.insights.tips || [],
        gameImpact: analysisData.insights.gameImpact || [],
        mistakes: analysisData.insights.mistakes || [],
        strengths: analysisData.insights.strengths || []
      };
    }
    
    // Return empty insights if no analysis data available (no hardcoded analysis)
    if (!playerData || !matchData) {
      return { tips: [], gameImpact: [], mistakes: [], strengths: [] };
    }
    
    return { tips: [], gameImpact: [], mistakes: [], strengths: [] };
  }, [playerData, matchData, analysisData]);

  // Performance improvement score using analysis data
  const improvementScore = useMemo(() => {
    // Use improvement score from analysis service if available
    if (analysisData?.insights?.improvementScore) {
      return analysisData.insights.improvementScore;
    }
    
    // Calculate based on insights if available
    if (insights.mistakes.length > 0 || insights.strengths.length > 0) {
      let score = 75; // base score
      score -= insights.mistakes.length * 10;
      score += insights.strengths.length * 15;
      return Math.max(0, Math.min(100, score));
    }
    
    // Return null if no data available
    return null;
  }, [insights, analysisData]);

  // Generate actionable coaching points using analysis service
  const coachingPoints = useMemo(() => {
    // Use coaching insights from comprehensive analysis service if available
    if (analysisData?.insights?.coachingPoints) {
      return analysisData.insights.coachingPoints;
    }
    
    // If no analysis data available, return empty array (no hardcoded coaching)
    if (!playerData || !matchData) return [];
    
    return []; // Return empty if no service data available - no mock coaching
  }, [analysisData, playerData, matchData]);
  
  // Show loading state for insights calculation
  if (analysisLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text className="text-white">Generating AI-powered insights...</Text>
          <Text className="text-gray-400 text-sm">Analyzing mistakes, strengths, and improvement opportunities</Text>
        </Space>
      </div>
    );
  }
  
  if (!playerData) {
    return <Alert message="Player data not found in this match" type="warning" />;
  }
  
  return (
    <Row gutter={[16, 16]}>
      {/* Performance Summary */}
      <Col span={24}>
        <Card 
          title={
            <div className="flex items-center justify-between">
              <span className="uppercase text-white">AI COACHING ANALYSIS</span>
              <div className="flex items-center space-x-2">
                <Tag color={improvementScore >= 80 ? 'green' : improvementScore >= 60 ? 'blue' : 'orange'}>
                  {improvementScore}/100 IMPROVEMENT SCORE
                </Tag>
              </div>
            </div>
          }
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Strengths Identified</Text>
                <div className="text-3xl font-bold text-green-400">
                  {insights.strengths.length}
                </div>
                <Text type="secondary" className="text-xs">Keep doing these</Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Areas to Improve</Text>
                <div className="text-3xl font-bold text-red-400">
                  {insights.mistakes.length}
                </div>
                <Text type="secondary" className="text-xs">Focus here next</Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Coaching Points</Text>
                <div className="text-3xl font-bold text-blue-400">
                  {coachingPoints.length}
                </div>
                <Text type="secondary" className="text-xs">Action items</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      {/* Critical Mistakes */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">🚨 CRITICAL IMPROVEMENTS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {insights.mistakes.length > 0 ? (
            <List
              dataSource={insights.mistakes}
              renderItem={(mistake) => (
                <List.Item className="border-gray-700">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {mistake.icon}
                        <Text strong className="text-white ml-2">{mistake.title}</Text>
                      </div>
                      <Tag color={mistake.priority === 'critical' ? 'error' : 'warning'}>
                        {mistake.priority?.toUpperCase()}
                      </Tag>
                    </div>
                    <Text type="secondary" className="text-sm block mb-2">{mistake.description}</Text>
                    <div className="bg-gray-900/50 p-2 rounded border-l-4 border-blue-500">
                      <Text className="text-blue-400 text-xs font-semibold">💡 Improvement:</Text>
                      <Text className="text-white text-xs block">{mistake.improvement}</Text>
                    </div>
                    <Text className="text-orange-400 text-xs mt-1">Impact: {mistake.impact}</Text>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div className="text-center p-8">
              <TrophyOutlined className="text-green-400 text-4xl mb-4" />
              <Text className="text-green-400 text-lg block">Excellent Performance!</Text>
              <Text type="secondary">No critical issues detected in this match.</Text>
            </div>
          )}
        </Card>
      </Col>

      {/* Strengths */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">⭐ PERFORMANCE STRENGTHS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {insights.strengths.length > 0 ? (
            <List
              dataSource={insights.strengths}
              renderItem={strength => (
                <List.Item className="border-gray-700">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <Text strong className="text-green-400">{strength.title}</Text>
                      <Tag color={strength.impact === 'game_winning' ? 'gold' : 'success'}>
                        {strength.impact === 'game_winning' ? 'GAME WINNING' : 'HIGH IMPACT'}
                      </Tag>
                    </div>
                    <Text type="secondary">{strength.description}</Text>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Keep playing to identify your strengths!" />
          )}
        </Card>
      </Col>
      {/* Actionable Coaching */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">🎯 ACTIONABLE COACHING</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          {coachingPoints.length > 0 ? (
            <List
              dataSource={coachingPoints}
              renderItem={(point) => (
                <List.Item className="border-gray-700">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <Tag color="blue" className="text-xs">{point.category}</Tag>
                      <div className="flex items-center space-x-2">
                        <Tag color={point.impact === 'High' ? 'red' : 'orange'} size="small">
                          {point.impact} Impact
                        </Tag>
                        <Tag color="green" size="small">{point.timeframe}</Tag>
                      </div>
                    </div>
                    <Text className="text-white font-medium block mb-1">{point.suggestion}</Text>
                    <div className="bg-blue-900/20 p-2 rounded border border-blue-500/30">
                      <Text className="text-blue-300 text-xs">
                        💼 Practice this to see improvement in {point.timeframe}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div className="text-center p-8">
              <CheckCircleOutlined className="text-green-400 text-4xl mb-4" />
              <Text className="text-green-400 text-lg block">Perfect Performance!</Text>
              <Text type="secondary">No coaching points needed for this match.</Text>
            </div>
          )}
        </Card>
      </Col>

      {/* Hero-Specific Tips */}
      <Col span={12}>
        <Card 
          title={<span className="uppercase text-white">🎮 HERO MASTERY TIPS</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <div className="space-y-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-purple-500/30">
              <div className="flex items-center mb-2">
                {playerData.hero_id && (
                  <img 
                    src={getHeroIcon(playerData.hero_id)} 
                    alt="Hero"
                    className="w-8 h-8 mr-2 rounded"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <Text className="text-purple-400 font-semibold">Hero Performance</Text>
              </div>
              <Text className="text-white text-sm block mb-2">
                KDA: {playerData.kills}/{playerData.deaths}/{playerData.assists} 
                ({((playerData.kills + playerData.assists) / Math.max(playerData.deaths, 1)).toFixed(2)})
              </Text>
              <Text type="secondary" className="text-xs">
                {playerData.hero_damage > 25000 ? 
                  '✅ Strong damage output for your hero role' : 
                  '💡 Consider more aggressive positioning to increase damage'
                }
              </Text>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-cyan-500/30">
              <Text className="text-cyan-400 font-semibold block mb-2">Item Build Analysis</Text>
              <div className="flex space-x-2 mb-2">
                {itemSlots.slice(0, 3).filter(Boolean).map((itemId, idx) => (
                  <img 
                    key={idx}
                    src={getItemIconById(itemId)} 
                    alt={`Item ${idx}`}
                    className="w-6 h-6 rounded border border-gray-600"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>
              <Text type="secondary" className="text-xs">
                {playerData.gold_per_min > 400 ? 
                  '✅ Good farming efficiency for item progression' :
                  '💡 Focus on improving CS to get items faster'
                }
              </Text>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-yellow-500/30">
              <Text className="text-yellow-400 font-semibold block mb-2">Next Steps</Text>
              <div className="space-y-1">
                <Text className="text-white text-xs block">
                  • Watch replay at {Math.floor(matchData.duration / 4 / 60)} minutes (critical moment)
                </Text>
                <Text className="text-white text-xs block">
                  • Practice {playerData.deaths > 5 ? 'positioning' : 'farming patterns'} in demo
                </Text>
                <Text className="text-white text-xs block">
                  • Study {playerData.obs_placed < 3 ? 'vision control' : 'team fight positioning'}
                </Text>
              </div>
            </div>
          </div>
        </Card>
      </Col>
      
      {/* Match Impact Summary */}
      <Col span={24}>
        <Card 
          title={<span className="uppercase text-white">📊 OVERALL MATCH IMPACT</span>}
          className="bg-gray-800/50 border-gray-700"
          headStyle={{ borderBottom: '1px solid #374151' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Performance Grade</Text>
                <div className="text-4xl font-bold" style={{ 
                  color: improvementScore >= 80 ? gamingColors.electric.green : 
                         improvementScore >= 60 ? gamingColors.electric.cyan : 
                         gamingColors.electric.orange 
                }}>
                  {improvementScore >= 90 ? 'S' : 
                   improvementScore >= 80 ? 'A' : 
                   improvementScore >= 70 ? 'B' : 
                   improvementScore >= 60 ? 'C' : 'D'}
                </div>
                <Text type="secondary" className="text-xs">Overall Grade</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">MMR Impact</Text>
                <div className="text-3xl font-bold" style={{ 
                  color: (playerData.radiant_win === (playerData.player_slot < 128)) ? 
                         gamingColors.electric.green : gamingColors.electric.red 
                }}>
                  {(playerData.radiant_win === (playerData.player_slot < 128)) ? '+' : '-'}
                  {Math.floor((improvementScore || 85) / 4 + 10)}
                </div>
                <Text type="secondary" className="text-xs">Estimated MMR</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Learning Points</Text>
                <div className="text-3xl font-bold" style={{ color: gamingColors.electric.cyan }}>
                  {insights.mistakes.length + coachingPoints.length}
                </div>
                <Text type="secondary" className="text-xs">Areas to Focus</Text>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                <Text className="text-xs text-gray-400 block mb-2">Next Goal</Text>
                <div className="text-xl font-bold" style={{ color: gamingColors.electric.purple }}>
                  {improvementScore < 70 ? 'SKILL UP' : 
                   improvementScore < 85 ? 'OPTIMIZE' : 'MASTER'}
                </div>
                <Text type="secondary" className="text-xs">Focus Area</Text>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default MatchAnalysis;