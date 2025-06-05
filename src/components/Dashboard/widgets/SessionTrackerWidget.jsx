import React, { useMemo } from 'react';
import { Space, Statistic, Progress, Tag, Alert, Typography, Row, Col, Divider } from 'antd';
import { FireOutlined, TrophyOutlined, ClockCircleOutlined, AimOutlined } from '@ant-design/icons';
// import { motion } from 'framer-motion';
import { useData } from '../../../contexts/DataContext.jsx';
import { getItemIcon, getRuneIcon } from '../../../utils/assetHelpers.js';
import { calculateTodaySession } from '../../../utils/dataTransforms.js';
import { MMRCounter, SessionStatus, TiltMeter } from '../../Gaming/index.jsx';
import { gamingColors } from '../../../theme/antdTheme.js';

const { Title, Text } = Typography;

export const SessionTrackerWidget = () => {
  const { recentMatches, loading } = useData();

  // Calculate today's session data using existing utility
  const todaySession = useMemo(() => {
    if (!recentMatches || recentMatches.length === 0) {
      return { 
        wins: 0, 
        losses: 0, 
        mmrChange: 0, 
        currentStreak: 0, 
        gamesPlayed: 0,
        winRate: 0,
        averageKDA: 0,
        averageDuration: 0
      };
    }
    
    const sessionData = calculateTodaySession(recentMatches);
    
    // Calculate additional metrics
    const gamesPlayed = sessionData.wins + sessionData.losses;
    const winRate = gamesPlayed > 0 ? (sessionData.wins / gamesPlayed) * 100 : 0;
    
    // Calculate average KDA and duration for today's games
    const todayGames = recentMatches.slice(0, gamesPlayed);
    const avgKDA = todayGames.length > 0 ? 
      todayGames.reduce((acc, match) => {
        const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
        return acc + kda;
      }, 0) / todayGames.length : 0;
    
    const avgDuration = todayGames.length > 0 ?
      todayGames.reduce((acc, match) => acc + (match.duration || 0), 0) / todayGames.length / 60 : 0;

    return {
      ...sessionData,
      gamesPlayed,
      winRate,
      averageKDA: avgKDA,
      averageDuration: avgDuration
    };
  }, [recentMatches]);

  // Calculate tilt level based on recent performance
  const tiltLevel = useMemo(() => {
    if (!recentMatches || recentMatches.length < 3) {
      return { level: 50, status: 'neutral', message: 'Not enough data' };
    }

    const recent5 = recentMatches.slice(0, 5);
    const winRate = recent5.filter(match => 
      match.radiant_win === (match.player_slot < 128)
    ).length / recent5.length;
    
    const avgKDA = recent5.reduce((acc, match) => {
      const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
      return acc + kda;
    }, 0) / recent5.length;

    // Simple tilt calculation
    let tiltScore = 50;
    tiltScore += (winRate - 0.5) * 60; // Win rate impact
    tiltScore += Math.min((avgKDA - 2) * 15, 20); // KDA impact (capped)
    tiltScore = Math.max(0, Math.min(100, tiltScore));

    let status, message;
    if (tiltScore >= 80) {
      status = 'flow';
      message = 'In the zone! Keep playing!';
    } else if (tiltScore >= 60) {
      status = 'good';
      message = 'Playing well, maintain focus';
    } else if (tiltScore >= 40) {
      status = 'neutral';
      message = 'Stable performance';
    } else if (tiltScore >= 20) {
      status = 'warning';
      message = 'Consider taking a break';
    } else {
      status = 'danger';
      message = 'Stop playing now!';
    }

    return { level: Math.round(tiltScore), status, message };
  }, [recentMatches]);

  const getAlertType = () => {
    if (todaySession.currentStreak >= 3) return 'success';
    if (todaySession.currentStreak <= -3) return 'error';
    if (todaySession.winRate >= 70) return 'success';
    if (todaySession.winRate <= 30) return 'warning';
    return 'info';
  };

  const getAlertMessage = () => {
    if (todaySession.currentStreak >= 3) return `${todaySession.currentStreak} game win streak! You're on fire!`;
    if (todaySession.currentStreak <= -3) return `${Math.abs(todaySession.currentStreak)} game loss streak. Consider taking a break.`;
    if (todaySession.winRate >= 70) return 'Excellent win rate today! Keep it up!';
    if (todaySession.winRate <= 30) return 'Tough session. Focus on fundamentals.';
    return 'Balanced session. Stay focused!';
  };

  if (loading.matches) {
    return (
      <div className="h-full flex items-center justify-center">
        <Space direction="vertical" align="center">
          <ClockCircleOutlined style={{ fontSize: '48px', color: gamingColors.electric.cyan }} />
          <Text className="text-gray-400">Loading session data...</Text>
        </Space>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="text-center">
        <Title level={5} className="text-white m-0 mb-2" style={{ fontSize: '14px' }}>
          SESSION TRACKER
        </Title>
        <Text type="secondary" className="uppercase tracking-wider" style={{ fontSize: '10px' }}>
          Today's Performance
        </Text>
      </div>

      {/* Main Stats Grid */}
      <Row gutter={[16, 16]} className="h-32">
        <Col span={8}>
          <div className="text-center">
            <MMRCounter
              value={todaySession.mmrChange}
              prefix={todaySession.mmrChange > 0 ? '+' : ''}
              trend={todaySession.mmrChange > 0 ? 'up' : todaySession.mmrChange < 0 ? 'down' : null}
            />
          </div>
        </Col>
        
        <Col span={8}>
          <div className="text-center">
            <Statistic
              title="Win Rate"
              value={todaySession.winRate}
              suffix="%"
              precision={1}
              valueStyle={{ 
                color: todaySession.winRate >= 60 ? gamingColors.electric.green : 
                       todaySession.winRate <= 40 ? gamingColors.electric.red : 
                       gamingColors.electric.cyan,
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
          </div>
        </Col>
        
        <Col span={8}>
          <TiltMeter 
            level={tiltLevel.level}
            status={tiltLevel.status}
            message={tiltLevel.message}
          />
        </Col>
      </Row>

      <Divider className="border-gray-700 my-4" />

      {/* Session Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src={getItemIcon('aegis')} 
              alt="Session Progress" 
              className="w-4 h-4" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Text strong className="text-white">Session Progress</Text>
          </div>
          <Space>
            <Tag color="success">{todaySession.wins}W</Tag>
            <Tag color="error">{todaySession.losses}L</Tag>
          </Space>
        </div>
        
        <Progress
          percent={todaySession.winRate}
          strokeColor={{
            '0%': todaySession.winRate >= 60 ? gamingColors.electric.green : gamingColors.electric.red,
            '100%': todaySession.winRate >= 60 ? gamingColors.performance.excellent : gamingColors.performance.terrible,
          }}
          format={(percent) => `${percent?.toFixed(1)}% WR`}
          className="mb-2"
        />
      </div>

      {/* Additional Stats */}
      <Row gutter={[16, 8]} className="text-center">
        <Col span={12}>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <img 
              src={getItemIcon('abyssal_blade')} 
              alt="KDA" 
              className="w-3 h-3" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <Statistic
            title="Avg KDA"
            value={todaySession.averageKDA}
            precision={2}
            valueStyle={{ 
              fontSize: '14px',
              color: todaySession.averageKDA >= 2 ? gamingColors.electric.green : gamingColors.electric.cyan
            }}
          />
        </Col>
        <Col span={12}>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <img 
              src={getRuneIcon('haste')} 
              alt="Duration" 
              className="w-3 h-3" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <Statistic
            title="Avg Duration"
            value={todaySession.averageDuration}
            suffix="min"
            precision={0}
            valueStyle={{ 
              fontSize: '14px',
              color: gamingColors.electric.cyan
            }}
          />
        </Col>
      </Row>

      {/* Streak Status */}
      {todaySession.currentStreak !== 0 && (
        <div className="text-center">
          <Space>
            <img 
              src={getRuneIcon(todaySession.currentStreak > 0 ? 'double_damage' : 'regeneration')} 
              alt="Streak" 
              className="w-4 h-4" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <FireOutlined 
              style={{ 
                color: todaySession.currentStreak > 0 ? 
                  gamingColors.electric.green : 
                  gamingColors.electric.red 
              }} 
            />
            <Text 
              strong 
              style={{ 
                color: todaySession.currentStreak > 0 ? 
                  gamingColors.electric.green : 
                  gamingColors.electric.red 
              }}
            >
              {Math.abs(todaySession.currentStreak)} Game {todaySession.currentStreak > 0 ? 'Win' : 'Loss'} Streak
            </Text>
          </Space>
        </div>
      )}

      {/* Alert/Recommendation */}
      <Alert
        message={getAlertMessage()}
        type={getAlertType()}
        showIcon
        icon={todaySession.currentStreak >= 3 ? <FireOutlined /> : <AimOutlined />}
        className="text-sm"
      />

      {/* No Data State */}
      {todaySession.gamesPlayed === 0 && (
        <div className="text-center py-8">
          <TrophyOutlined style={{ fontSize: '48px', color: gamingColors.electric.cyan }} />
          <div className="mt-4">
            <Text strong className="text-white">No games played today</Text>
            <br />
            <Text type="secondary" className="text-sm">Start your session to track performance!</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionTrackerWidget;