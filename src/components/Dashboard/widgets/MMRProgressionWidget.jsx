import React, { useMemo } from 'react';
import { Line } from '@ant-design/plots';
import { Space, Typography, Empty, Spin, Select, Card } from 'antd';
import { RiseOutlined, FallOutlined, TrophyOutlined } from '@ant-design/icons';
import { useData } from '../../../contexts/DataContext.jsx';
import { gamingColors } from '../../../theme/antdTheme.js';
import { getRankIcon, getItemIcon } from '../../../utils/assetHelpers.js';

const { Title, Text } = Typography;

export const MMRProgressionWidget = ({ timeRange }) => {
  const { user, recentMatches, loading } = useData();
  const [selectedQueue, SETSELECTEDQUEUE] = React.useState('estimated');

  // Calculate estimated MMR from recent matches
  const mmrData = useMemo(() => {
    if (!recentMatches || recentMatches.length === 0) return [];
    
    // Get base MMR from user profile or default
    const baseMmr = user?.solo_competitive_rank || user?.competitive_rank || user?.mmr_estimate?.estimate || 2500;
    
    // Calculate MMR changes from recent matches (newest first)
    const sortedMatches = [...recentMatches].sort((a, b) => b.start_time - a.start_time).slice(0, 20);
    
    let currentMmr = baseMmr;
    const mmrHistory = [];
    
    // Work backwards through matches to calculate MMR progression
    sortedMatches.reverse().forEach((match, index) => {
      const date = new Date(match.start_time * 1000);
      const isWin = match.radiant_win === (match.player_slot < 128);
      const mmrChange = isWin ? 25 : -25; // Standard MMR change
      
      mmrHistory.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: match.start_time,
        estimated: currentMmr,
        change: index === 0 ? 0 : mmrChange,
        match_id: match.match_id,
        isWin
      });
      
      currentMmr += mmrChange;
    });
    
    // Apply time range filter if provided
    if (timeRange && timeRange.length === 2) {
      const [start, end] = timeRange;
      return mmrHistory.filter(item => {
        const date = new Date(item.timestamp * 1000);
        return date >= start && date <= end;
      });
    }
    
    return mmrHistory;
  }, [recentMatches, user, timeRange]);

  const config = useMemo(() => ({
    data: mmrData,
    xField: 'date',
    yField: selectedQueue,
    smooth: true,
    lineStyle: {
      lineWidth: 3,
    },
    color: gamingColors.electric.cyan,
    areaStyle: {
      fill: `l(270) 0:${gamingColors.electric.cyan}00 0.5:${gamingColors.electric.cyan}40 1:${gamingColors.electric.cyan}80`,
    },
    xAxis: {
      label: {
        style: {
          fill: gamingColors.text.secondary,
          fontSize: 10,
        },
        autoRotate: true,
      },
      line: {
        style: {
          stroke: gamingColors.border,
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: gamingColors.text.secondary,
          fontSize: 10,
        },
      },
      grid: {
        line: {
          style: {
            stroke: gamingColors.border,
            lineDash: [4, 4],
            opacity: 0.3,
          },
        },
      },
    },
    tooltip: {
      showTitle: true,
      title: (title) => `${title}`,
      customContent: (title, items) => {
        if (!items?.length) return null;
        const data = items[0]?.data || {};
        const value = data[selectedQueue] || 0;
        const change = data.change || 0;
        
        return (
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">{title}</div>
            <div className="text-lg font-bold text-white">{Math.round(value)} MMR</div>
            {change !== 0 && (
              <div className={`text-sm ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change > 0 ? '+' : ''}{change} from match
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {data.isWin ? 'Victory' : 'Defeat'}
            </div>
          </div>
        );
      },
    },
    theme: 'dark',
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  }), [mmrData, selectedQueue]);

  const calculateMMRChange = useMemo(() => {
    if (mmrData.length < 2) return { change: 0, trend: 'stable', current: 0 };
    
    const latest = mmrData[mmrData.length - 1]?.[selectedQueue] || 0;
    const first = mmrData[0]?.[selectedQueue] || 0;
    const change = latest - first;
    
    return {
      change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: first > 0 ? ((change / first) * 100).toFixed(2) : 0,
      current: Math.round(latest)
    };
  }, [mmrData, selectedQueue]);

  if (loading.matches) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <img 
              src={getItemIcon('aegis')} 
              alt="MMR Progression" 
              className="w-4 h-4" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Title level={5} className="text-white m-0" style={{ fontSize: '14px' }}>
              MMR PROGRESSION
            </Title>
          </div>
          <Text type="secondary" style={{ fontSize: '10px' }} className="uppercase tracking-wider">
            Estimated from match history
          </Text>
        </div>
        
        <Space size="small">
          {calculateMMRChange.current > 0 && (
            <div className="text-right">
              <div className="flex items-center">
                <img 
                  src={getRankIcon(user?.rank_tier || Math.floor(calculateMMRChange.current / 100))} 
                  alt="Current Rank" 
                  className="w-4 h-4 mr-1" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <TrophyOutlined className="mr-1 text-cyan-400" />
                <span className="font-bold text-white">
                  {calculateMMRChange.current}
                </span>
              </div>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Current MMR
              </Text>
            </div>
          )}
          
          {calculateMMRChange.change !== 0 && (
            <div className="text-right">
              <div className={`flex items-center ${calculateMMRChange.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                <img 
                  src={getItemIcon(calculateMMRChange.trend === 'up' ? 'abyssal_blade' : 'smoke_of_deceit')} 
                  alt={calculateMMRChange.trend === 'up' ? 'MMR Gain' : 'MMR Loss'} 
                  className="w-3 h-3 mr-1" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {calculateMMRChange.trend === 'up' ? <RiseOutlined /> : <FallOutlined />}
                <span className="ml-1 font-bold text-sm">
                  {calculateMMRChange.change > 0 ? '+' : ''}{calculateMMRChange.change}
                </span>
              </div>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Last {mmrData.length} games
              </Text>
            </div>
          )}
        </Space>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {mmrData.length > 0 ? (
          <Line {...config} />
        ) : (
          <Empty
            description="Play some matches to see MMR progression"
            className="h-full flex flex-col justify-center"
          />
        )}
      </div>
    </div>
  );
};

export default MMRProgressionWidget;