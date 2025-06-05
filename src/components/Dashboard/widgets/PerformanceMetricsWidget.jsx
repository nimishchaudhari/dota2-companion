import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Progress, Space, Typography } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  TrophyOutlined,
  DollarOutlined,
  RiseOutlined,
  AimOutlined
} from '@ant-design/icons';
import { useData } from '../../../contexts/DataContext.jsx';
import { AuthContext } from '../../../contexts/AuthContext.js';
import { calculateCoreMetrics } from '../../../utils/dataTransforms.js';
import { gamingColors } from '../../../theme/antdTheme.js';

const { Title, Text } = Typography;

export const PerformanceMetricsWidget = () => {
  const { recentMatches, winLoss, loading } = useData();
  const { user } = React.useContext(AuthContext);

  const metrics = useMemo(() => {
    if (!recentMatches || !winLoss) {
      return calculateCoreMetrics(user, null, null, null);
    }
    
    return calculateCoreMetrics(user, winLoss, null, recentMatches);
  }, [user, winLoss, recentMatches]);

  const getMetricIcon = (label) => {
    switch (label.toLowerCase()) {
      case 'win rate': return <TrophyOutlined />;
      case 'avg gpm': return <DollarOutlined />;
      case 'avg xpm': return <RiseOutlined />;
      case 'avg kda': return <AimOutlined />;
      default: return <TrophyOutlined />;
    }
  };

  const getMetricColor = (trend) => {
    if (trend === 'up') return gamingColors.electric.green;
    if (trend === 'down') return gamingColors.electric.red;
    return gamingColors.electric.cyan;
  };

  const calculatePerformanceScore = useMemo(() => {
    if (!recentMatches || recentMatches.length === 0) return 0;
    
    const recent10 = recentMatches.slice(0, 10);
    const wins = recent10.filter(match => 
      match.radiant_win === (match.player_slot < 128)
    ).length;
    const winRate = (wins / recent10.length) * 100;
    
    const avgKDA = recent10.reduce((acc, match) => {
      return acc + ((match.kills + match.assists) / Math.max(match.deaths, 1));
    }, 0) / recent10.length;
    
    // Simple performance score calculation
    const score = (winRate * 0.6) + (Math.min(avgKDA * 10, 40));
    return Math.min(100, Math.round(score));
  }, [recentMatches]);

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-4">
        <Title level={5} className="text-white m-0" style={{ fontSize: '14px' }}>
          PERFORMANCE METRICS
        </Title>
        <Text type="secondary" className="uppercase tracking-wider" style={{ fontSize: '10px' }}>
          Core statistics overview
        </Text>
      </div>

      {/* Metrics Grid */}
      <Row gutter={[16, 16]}>
        {metrics.slice(0, 4).map((metric, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card 
              className="bg-gray-800/50 border-gray-700 hover:border-cyan-400/50 transition-all duration-300"
              variant="outlined"
              loading={loading.matches || loading.heroes}
            >
              <Statistic
                title={
                  <Space>
                    {getMetricIcon(metric.label)}
                    <span className="text-gray-400">{metric.label}</span>
                  </Space>
                }
                value={metric.value}
                suffix={metric.suffix}
                precision={metric.label.includes('KDA') ? 2 : 0}
                valueStyle={{ 
                  color: getMetricColor(metric.trend),
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '24px'
                }}
                prefix={metric.trend === 'up' ? <ArrowUpOutlined /> : metric.trend === 'down' ? <ArrowDownOutlined /> : null}
              />
              <div className="mt-2">
                <Text type="secondary" className="text-xs">
                  {metric.trend === 'up' ? '↗ Improving' : 
                   metric.trend === 'down' ? '↘ Declining' : 
                   '→ Stable'}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Performance Score */}
      <div className="mt-6">
        <Card 
          className="bg-gray-800/50 border-gray-700"
          variant="outlined"
        >
          <div className="flex justify-between items-center mb-4">
            <Title level={5} className="text-white m-0">
              Overall Performance Score
            </Title>
            <Text type="secondary">
              Based on last 10 games
            </Text>
          </div>
          
          <Progress
            percent={calculatePerformanceScore}
            strokeColor={{
              '0%': gamingColors.electric.cyan,
              '50%': gamingColors.electric.green,
              '100%': gamingColors.performance.excellent,
            }}
            trailColor="#262626"
            format={(percent) => (
              <span style={{ 
                color: percent >= 80 ? gamingColors.performance.excellent :
                       percent >= 60 ? gamingColors.performance.good :
                       percent >= 40 ? gamingColors.performance.average :
                       gamingColors.performance.poor,
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                {percent}%
              </span>
            )}
          />
          
          <div className="mt-4 text-center">
            <Text type="secondary">
              {calculatePerformanceScore >= 80 ? 'Excellent performance! Keep it up!' :
               calculatePerformanceScore >= 60 ? 'Good performance, room for improvement.' :
               calculatePerformanceScore >= 40 ? 'Average performance, focus on fundamentals.' :
               'Need improvement, analyze your gameplay.'}
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMetricsWidget;