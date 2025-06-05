import React, { useMemo, useState } from 'react';
import { Card, List, Tag, Space, Typography, Empty, Spin, Badge, Button, Tooltip, Avatar } from 'antd';
import { 
  TrophyOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  RightOutlined,
  TeamOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { useData } from '../../../contexts/DataContext.jsx';
import { gamingColors } from '../../../theme/antdTheme.js';
import { getHeroIconById } from '../../../utils/assetHelpers.js';

const { Title, Text } = Typography;

// Helper function moved outside component
const getTimeAgo = (timestamp) => {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
};

const getGameMode = (mode) => {
  const modes = {
    0: 'AP',
    1: 'CM',
    2: 'RD',
    3: 'SD',
    4: 'AR',
    5: 'ARDM',
    22: 'AP Ranked',
    23: 'Turbo',
  };
  return modes[mode] || 'Unknown';
};

export const RecentMatchesWidget = ({ onMatchClick }) => {
  const { recentMatches, heroes, loading } = useData();
  const [hoveredMatch, setHoveredMatch] = useState(null);

  const matchData = useMemo(() => {
    if (!recentMatches || recentMatches.length === 0) return [];
    
    return recentMatches.slice(0, 8).map(match => {
      const isWin = match.radiant_win === (match.player_slot < 128);
      const hero = Array.isArray(heroes) ? heroes.find(h => h.id === match.hero_id) : null;
      const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1));
      const duration = Math.floor(match.duration / 60);
      const timeAgo = getTimeAgo(match.start_time);
      
      return {
        ...match,
        isWin,
        heroName: hero?.localized_name || `Hero ${match.hero_id}`,
        heroIcon: hero ? getHeroIconById(match.hero_id, heroes) : null,
        kda,
        duration,
        timeAgo,
        kdaRaw: `${match.kills}/${match.deaths}/${match.assists}`,
        gameMode: getGameMode(match.game_mode)
      };
    });
  }, [recentMatches, heroes]);

  const getKDAColor = (kda) => {
    if (kda >= 4) return gamingColors.performance.excellent;
    if (kda >= 3) return gamingColors.performance.good;
    if (kda >= 2) return gamingColors.performance.average;
    return gamingColors.performance.poor;
  };

  const handleMatchClick = (match) => {
    if (onMatchClick) {
      onMatchClick(match.match_id);
    }
  };

  if (loading.matches) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const winCount = matchData.filter(m => m.isWin).length;
  const winRate = matchData.length > 0 ? (winCount / matchData.length * 100).toFixed(0) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <Title level={5} className="text-white m-0" style={{ fontSize: '14px' }}>
            RECENT MATCHES
          </Title>
          <Text type="secondary" style={{ fontSize: '10px' }} className="uppercase tracking-wider">
            Last {matchData.length} games
          </Text>
        </div>
        
        {matchData.length > 0 && (
          <div className="text-right">
            <Space size="small">
              <Badge status={winRate >= 50 ? "success" : "error"} />
              <Text strong className="text-white">{winRate}%</Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {winCount}W-{matchData.length - winCount}L
              </Text>
            </Space>
          </div>
        )}
      </div>

      {/* Match List */}
      <div className="flex-1 overflow-auto">
        {matchData.length > 0 ? (
          <List
            size="small"
            dataSource={matchData}
            renderItem={(match) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-800/50 transition-all px-2 py-1 rounded"
                onMouseEnter={() => setHoveredMatch(match.match_id)}
                onMouseLeave={() => setHoveredMatch(null)}
                onClick={() => handleMatchClick(match)}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    {/* Hero & Result */}
                    <Space size="small" className="flex-1">
                      <Avatar 
                        size={32}
                        src={match.heroIcon}
                        className={`border-2 ${match.isWin ? 'border-green-500' : 'border-red-500'}`}
                      >
                        {match.heroName.substring(0, 2)}
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Text strong className="text-white text-xs truncate">
                            {match.heroName}
                          </Text>
                          <Tag 
                            color={match.isWin ? 'success' : 'error'} 
                            className="text-xs"
                            icon={match.isWin ? <TrophyOutlined /> : <CloseCircleOutlined />}
                          >
                            {match.isWin ? 'WIN' : 'LOSS'}
                          </Tag>
                        </div>
                        <Space size="small" className="text-xs">
                          <Text type="secondary">{match.gameMode}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">
                            <ClockCircleOutlined className="mr-1" />
                            {match.duration}m
                          </Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">{match.timeAgo}</Text>
                        </Space>
                      </div>
                    </Space>

                    {/* KDA & Stats */}
                    <Space size="middle" align="center">
                      <div className="text-right">
                        <Text 
                          strong 
                          style={{ color: getKDAColor(match.kda), fontSize: '13px' }}
                          className="font-mono"
                        >
                          {match.kdaRaw}
                        </Text>
                        <div className="text-xs">
                          <Text type="secondary">
                            {match.kda.toFixed(2)} KDA
                          </Text>
                        </div>
                      </div>
                      
                      <Tooltip title="View match details">
                        <Button
                          type="text"
                          size="small"
                          icon={<RightOutlined />}
                          className={`transition-all ${
                            hoveredMatch === match.match_id ? 'text-cyan-400' : 'text-gray-500'
                          }`}
                        />
                      </Tooltip>
                    </Space>
                  </div>
                  
                  {/* Additional Stats on Hover */}
                  {hoveredMatch === match.match_id && (
                    <div className="mt-2 pt-2 border-t border-gray-700/50">
                      <Space size="large" className="text-xs">
                        <div>
                          <FireOutlined className="text-orange-400 mr-1" />
                          <Text type="secondary">GPM: </Text>
                          <Text className="text-white">{match.gold_per_min}</Text>
                        </div>
                        <div>
                          <FieldTimeOutlined className="text-purple-400 mr-1" />
                          <Text type="secondary">XPM: </Text>
                          <Text className="text-white">{match.xp_per_min}</Text>
                        </div>
                        <div>
                          <TeamOutlined className="text-cyan-400 mr-1" />
                          <Text type="secondary">Party: </Text>
                          <Text className="text-white">{match.party_size || 1}</Text>
                        </div>
                      </Space>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="No recent matches found"
            className="h-full flex flex-col justify-center"
          />
        )}
      </div>
    </div>
  );
};

export default RecentMatchesWidget;