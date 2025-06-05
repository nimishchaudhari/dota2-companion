import React, { useMemo, useState } from 'react';
import { Table, Tag, Space, Typography, Empty, Spin, Input, Select } from 'antd';
import { SearchOutlined, FireOutlined } from '@ant-design/icons';
import { useData } from '../../../contexts/DataContext.jsx';
import { transformHeroStats } from '../../../utils/dataTransforms.js';
import { gamingColors } from '../../../theme/antdTheme.js';

const { Title, Text } = Typography;

export const HeroPerformanceWidget = () => {
  const { heroStats, heroMap, loading } = useData();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('games');

  const heroData = useMemo(() => {
    if (!heroStats || !heroMap) return [];
    
    const transformed = transformHeroStats(heroStats, heroMap);
    
    // Apply search filter
    let filtered = transformed;
    if (searchText) {
      filtered = filtered.filter(hero =>
        hero.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'winrate':
          return b.winrate - a.winrate;
        case 'kda':
          return b.kda - a.kda;
        case 'games':
        default:
          return b.matches - a.matches;
      }
    });
  }, [heroStats, heroMap, searchText, sortBy]);

  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return gamingColors.performance.excellent;
    if (winRate >= 60) return gamingColors.performance.good;
    if (winRate >= 50) return gamingColors.performance.average;
    if (winRate >= 40) return gamingColors.performance.poor;
    return gamingColors.performance.terrible;
  };

  const getKDAColor = (kda) => {
    if (kda >= 4) return gamingColors.performance.excellent;
    if (kda >= 3) return gamingColors.performance.good;
    if (kda >= 2) return gamingColors.performance.average;
    if (kda >= 1) return gamingColors.performance.poor;
    return gamingColors.performance.terrible;
  };

  const columns = [
    {
      title: 'Hero',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
      render: (name, record) => (
        <Space>
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <Text strong className="text-white block">{name}</Text>
            <Text type="secondary" className="text-xs">
              {record.matches} games
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Win Rate',
      dataIndex: 'winrate',
      key: 'winrate',
      width: '20%',
      align: 'center',
      render: (winrate) => (
        <Tag 
          color={getWinRateColor(winrate)}
          className="font-bold min-w-[60px] text-center"
        >
          {winrate}%
        </Tag>
      ),
    },
    {
      title: 'KDA',
      dataIndex: 'kda',
      key: 'kda',
      width: '20%',
      align: 'center',
      render: (kda) => (
        <span 
          className="font-mono font-bold"
          style={{ color: getKDAColor(kda) }}
        >
          {kda.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Impact',
      key: 'impact',
      width: '20%',
      align: 'center',
      render: (_, record) => {
        const impact = (record.winrate * record.matches) / 100;
        const stars = Math.min(5, Math.ceil(impact / 2));
        
        return (
          <Space>
            {[...Array(stars)].map((_, i) => (
              <FireOutlined 
                key={i} 
                style={{ 
                  color: gamingColors.electric.yellow,
                  fontSize: '14px'
                }} 
              />
            ))}
          </Space>
        );
      },
    },
  ];

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
          HERO PERFORMANCE
        </Title>
        <Text type="secondary" className="uppercase tracking-wider" style={{ fontSize: '10px' }}>
          Your hero mastery statistics
        </Text>
      </div>

      {/* Controls */}
      <Space className="mb-4" style={{ width: '100%' }}>
        <Input
          placeholder="Search heroes..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 120 }}
          options={[
            { label: 'Most Played', value: 'games' },
            { label: 'Win Rate', value: 'winrate' },
            { label: 'KDA', value: 'kda' },
          ]}
        />
      </Space>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {heroData.length > 0 ? (
          <Table
            columns={columns}
            dataSource={heroData.slice(0, 20)}
            rowKey="hero_id"
            pagination={false}
            size="small"
            className="hero-performance-table"
            style={{
              '--table-header-bg': '#1a1a1a',
              '--table-row-hover-bg': '#262626',
            }}
          />
        ) : (
          <Empty
            description="No hero data available"
            className="h-full flex flex-col justify-center"
          />
        )}
      </div>

      {/* Summary Stats */}
      {heroData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Space size="large" className="w-full justify-center">
            <div className="text-center">
              <Text type="secondary" className="text-xs">Total Heroes</Text>
              <div className="text-xl font-bold text-white">{heroData.length}</div>
            </div>
            <div className="text-center">
              <Text type="secondary" className="text-xs">Avg Win Rate</Text>
              <div className="text-xl font-bold" style={{ color: gamingColors.electric.cyan }}>
                {(heroData.reduce((acc, h) => acc + h.winrate, 0) / heroData.length).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <Text type="secondary" className="text-xs">Most Played</Text>
              <div className="text-xl font-bold text-white">
                {heroData[0]?.name || 'N/A'}
              </div>
            </div>
          </Space>
        </div>
      )}
    </div>
  );
};

export default HeroPerformanceWidget;