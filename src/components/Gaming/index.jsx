import React from 'react';
import { Badge, Statistic, Avatar, Tag, Tooltip, Space } from 'antd';
import { TrophyOutlined, FireOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
// import { motion } from 'framer-motion';
import { rankColors, gamingColors } from '../../theme/antdTheme.js';

// Animated MMR Counter using Ant Design Statistic
export const MMRCounter = ({ value, prefix = '', suffix = '', loading = false, trend = null }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpOutlined style={{ color: gamingColors.electric.green }} />;
    if (trend === 'down') return <ArrowDownOutlined style={{ color: gamingColors.electric.red }} />;
    return null;
  };

  return (
    <div>
      <Statistic
        title="MMR"
        value={value}
        prefix={prefix}
        suffix={
          <Space>
            {suffix}
            {getTrendIcon()}
          </Space>
        }
        loading={loading}
        valueStyle={{ 
          color: trend === 'up' ? gamingColors.electric.green : 
                 trend === 'down' ? gamingColors.electric.red : 
                 gamingColors.electric.cyan,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 'bold'
        }}
      />
    </div>
  );
};

// Rank Badge Component
export const RankBadge = ({ rank, tier, className = '' }) => {
  const getRankInfo = (rankTier) => {
    if (!rankTier) return { name: 'Unranked', color: '#666666' };
    
    const ranks = {
      1: { name: 'Herald', color: rankColors.herald },
      2: { name: 'Guardian', color: rankColors.guardian },
      3: { name: 'Crusader', color: rankColors.crusader },
      4: { name: 'Archon', color: rankColors.archon },
      5: { name: 'Legend', color: rankColors.legend },
      6: { name: 'Ancient', color: rankColors.ancient },
      7: { name: 'Divine', color: rankColors.divine },
      8: { name: 'Immortal', color: rankColors.immortal },
    };
    
    const majorRank = Math.floor(rankTier / 10) + 1;
    const minorRank = (rankTier % 10) + 1;
    
    const rankInfo = ranks[majorRank] || ranks[1];
    return {
      ...rankInfo,
      fullName: `${rankInfo.name} ${minorRank}`,
      stars: minorRank
    };
  };

  const rankInfo = getRankInfo(tier || rank);
  
  return (
    <div className={`inline-block ${className}`}>
      <Badge
        count={rankInfo.stars || 0}
        showZero={false}
        color={rankInfo.color}
      >
        <Tooltip title={rankInfo.fullName}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xs border-2"
            style={{
              backgroundColor: `${rankInfo.color}20`,
              borderColor: rankInfo.color,
              boxShadow: `0 0 20px ${rankInfo.color}30`
            }}
          >
            {rankInfo.name.substring(0, 2).toUpperCase()}
          </div>
        </Tooltip>
      </Badge>
    </div>
  );
};

// Hero Avatar Component
export const HeroAvatar = ({ heroId, heroName, size = 48, showName = false }) => {
  const heroInitials = heroName ? 
    heroName.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2) :
    'H' + (heroId || '1').toString().substring(0, 1);

  return (
    <Space direction={showName ? 'horizontal' : undefined} align="center">
      <Avatar
        size={size}
        style={{
          backgroundColor: gamingColors.electric.cyan,
          border: `2px solid ${gamingColors.electric.blue}`,
          fontWeight: 'bold'
        }}
      >
        {heroInitials}
      </Avatar>
      {showName && (
        <span className="text-white font-medium">{heroName || `Hero ${heroId}`}</span>
      )}
    </Space>
  );
};

// Win/Loss Indicator
export const WinLossIndicator = ({ isWin, size = 'default' }) => {
  return (
    <Tag
      color={isWin ? 'success' : 'error'}
      className={`font-bold ${size === 'large' ? 'text-lg px-4 py-2' : ''}`}
      style={{
        backgroundColor: isWin ? 
          `${gamingColors.electric.green}20` : 
          `${gamingColors.electric.red}20`,
        borderColor: isWin ? 
          gamingColors.electric.green : 
          gamingColors.electric.red,
        color: isWin ? 
          gamingColors.electric.green : 
          gamingColors.electric.red
      }}
    >
      {isWin ? 'WIN' : 'LOSS'}
    </Tag>
  );
};

// Performance Trend Component
export const PerformanceTrend = ({ trend, value, label }) => {
  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return {
          icon: <ArrowUpOutlined />,
          color: gamingColors.performance.excellent,
          text: 'Improving'
        };
      case 'down':
        return {
          icon: <ArrowDownOutlined />,
          color: gamingColors.performance.terrible,
          text: 'Declining'
        };
      default:
        return {
          icon: null,
          color: gamingColors.performance.average,
          text: 'Stable'
        };
    }
  };

  const config = getTrendConfig();

  return (
    <Space direction="vertical" size={0} className="text-center">
      <Space style={{ color: config.color }}>
        {config.icon}
        <span className="font-mono font-bold">{value}</span>
      </Space>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-xs" style={{ color: config.color }}>
        {config.text}
      </div>
    </Space>
  );
};

// Tilt Meter Component
export const TiltMeter = ({ level, status, message, className = '' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'flow': return gamingColors.mental.flow;
      case 'good': return gamingColors.mental.focused;
      case 'neutral': return gamingColors.mental.neutral;
      case 'warning': return gamingColors.mental.tilting;
      case 'danger': return gamingColors.mental.danger;
      default: return gamingColors.mental.neutral;
    }
  };

  return (
    <div className={`text-center ${className}`}>
      <Tooltip title={message}>
        <div
          className="w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-2"
          style={{
            borderColor: getStatusColor(),
            backgroundColor: `${getStatusColor()}10`
          }}
        >
          <span 
            className="text-2xl font-bold font-mono"
            style={{ color: getStatusColor() }}
          >
            {level}
          </span>
        </div>
      </Tooltip>
      <div className="text-xs text-gray-400 uppercase tracking-wider">
        TILT-O-METER™
      </div>
      <div 
        className="text-xs font-bold mt-1"
        style={{ color: getStatusColor() }}
      >
        {status.toUpperCase()}
      </div>
    </div>
  );
};

// Session Status Component
export const SessionStatus = ({ wins, losses, mmrChange, streak }) => {
  const getStreakIcon = () => {
    if (streak > 0) return <FireOutlined style={{ color: gamingColors.electric.green }} />;
    if (streak < 0) return <FireOutlined style={{ color: gamingColors.electric.red }} />;
    return null;
  };

  return (
    <Space direction="vertical" size="small" className="text-center">
      <div className="text-sm font-mono text-gray-400">SESSION</div>
      <Space size="large">
        <Statistic
          title="Record"
          value={`${wins}-${losses}`}
          valueStyle={{ 
            fontSize: '16px', 
            fontFamily: "'JetBrains Mono', monospace",
            color: wins > losses ? gamingColors.electric.green : 
                   losses > wins ? gamingColors.electric.red : 
                   gamingColors.electric.cyan
          }}
        />
        <Statistic
          title="MMR"
          value={mmrChange}
          prefix={mmrChange > 0 ? '+' : ''}
          valueStyle={{ 
            fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            color: mmrChange > 0 ? gamingColors.electric.green : 
                   mmrChange < 0 ? gamingColors.electric.red : 
                   gamingColors.electric.cyan
          }}
        />
        {Math.abs(streak) > 1 && (
          <Space direction="vertical" size={0} className="text-center">
            <div className="text-xs text-gray-400">STREAK</div>
            <Space>
              {getStreakIcon()}
              <span 
                className="font-bold font-mono"
                style={{ 
                  color: streak > 0 ? gamingColors.electric.green : gamingColors.electric.red 
                }}
              >
                {Math.abs(streak)}
              </span>
            </Space>
          </Space>
        )}
      </Space>
    </Space>
  );
};

export default {
  MMRCounter,
  RankBadge,
  HeroAvatar,
  WinLossIndicator,
  PerformanceTrend,
  TiltMeter,
  SessionStatus
};