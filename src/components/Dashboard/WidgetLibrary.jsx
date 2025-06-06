import React, { useState } from 'react';
import { Modal, Card, Row, Col, Input, Space, Tag, Button, Typography, Empty } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined,
  DashboardOutlined,
  LineChartOutlined,
  TableOutlined,
  HistoryOutlined,
  BarChartOutlined,
  RadarChartOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { gamingColors } from '../../theme/antdTheme.js';

const { Title, Text, Paragraph } = Typography;

// Widget definitions
export const WIDGET_DEFINITIONS = [
  {
    id: 'session-tracker',
    title: 'Session Tracker',
    description: 'Track your current gaming session with real-time performance metrics',
    icon: <DashboardOutlined style={{ fontSize: '32px', color: gamingColors.electric.cyan }} />,
    category: 'core',
    tags: ['real-time', 'session', 'tilt'],
    preview: '/widget-previews/session-tracker.png'
  },
  {
    id: 'mmr-chart',
    title: 'MMR Progression',
    description: 'Visualize your MMR changes over time with interactive charts',
    icon: <LineChartOutlined style={{ fontSize: '32px', color: gamingColors.electric.green }} />,
    category: 'analytics',
    tags: ['mmr', 'chart', 'progression'],
    preview: '/widget-previews/mmr-chart.png'
  },
  {
    id: 'hero-stats',
    title: 'Hero Performance',
    description: 'Detailed statistics for all your played heroes with win rates and KDA',
    icon: <TableOutlined style={{ fontSize: '32px', color: gamingColors.electric.purple }} />,
    category: 'performance',
    tags: ['heroes', 'win rate', 'kda'],
    preview: '/widget-previews/hero-stats.png'
  },
  {
    id: 'recent-matches',
    title: 'Recent Matches',
    description: 'Timeline view of your recent matches with detailed performance data',
    icon: <HistoryOutlined style={{ fontSize: '32px', color: gamingColors.electric.yellow }} />,
    category: 'core',
    tags: ['matches', 'history', 'timeline'],
    preview: '/widget-previews/recent-matches.png'
  },
  {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    description: 'Core statistics overview including win rate, GPM, XPM, and KDA',
    icon: <BarChartOutlined style={{ fontSize: '32px', color: gamingColors.electric.blue }} />,
    category: 'core',
    tags: ['statistics', 'metrics', 'overview'],
    preview: '/widget-previews/performance-metrics.png'
  },
  {
    id: 'hero-mastery',
    title: 'Hero Mastery Progression',
    description: 'Gamified hero mastery system with tier progression, streaks, and achievements',
    icon: <TrophyOutlined style={{ fontSize: '32px', color: gamingColors.electric.yellow }} />,
    category: 'performance',
    tags: ['mastery', 'achievements', 'progression', 'streaks'],
    preview: '/widget-previews/hero-mastery.png'
  },
  {
    id: 'role-analytics',
    title: 'Role Analytics',
    description: 'Analyze your performance across different roles and positions',
    icon: <RadarChartOutlined style={{ fontSize: '32px', color: gamingColors.electric.orange }} />,
    category: 'analytics',
    tags: ['roles', 'positions', 'analysis'],
    preview: '/widget-previews/role-analytics.png',
    comingSoon: true
  }
];

const categories = [
  { key: 'all', label: 'All Widgets', color: 'default' },
  { key: 'core', label: 'Core', color: 'cyan' },
  { key: 'performance', label: 'Performance', color: 'green' },
  { key: 'analytics', label: 'Analytics', color: 'blue' }
];

export const WidgetLibrary = ({ 
  open, 
  onClose, 
  onAddWidget, 
  activeWidgets = [] 
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredWidgets = WIDGET_DEFINITIONS.filter(widget => {
    const matchesSearch = !searchText || 
      widget.title.toLowerCase().includes(searchText.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchText.toLowerCase()) ||
      widget.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddWidget = (widgetId) => {
    onAddWidget(widgetId);
    // Don't close modal to allow adding multiple widgets
  };

  const isWidgetActive = (widgetId) => activeWidgets.includes(widgetId);

  return (
    <Modal
      title={
        <Title level={4} className="m-0">
          Widget Library
        </Title>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      className="widget-library-modal"
    >
      {/* Search and Filters */}
      <Space direction="vertical" size="large" className="w-full">
        <div>
          <Input
            placeholder="Search widgets..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            className="mb-4"
          />
          
          <Space wrap>
            {categories.map(cat => (
              <Tag
                key={cat.key}
                color={selectedCategory === cat.key ? cat.color : 'default'}
                className="cursor-pointer px-4 py-1"
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.label}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Widget Grid */}
        {filteredWidgets.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredWidgets.map(widget => (
              <Col xs={24} sm={12} md={8} key={widget.id}>
                <Card
                  hoverable
                  className={`
                    bg-gray-800 border-gray-700 h-full
                    ${isWidgetActive(widget.id) ? 'border-cyan-400 opacity-75' : 'hover:border-cyan-400/50'}
                    ${widget.comingSoon ? 'opacity-50' : ''}
                  `}
                  cover={
                    <div className="p-6 bg-gray-900/50 text-center">
                      {widget.icon}
                    </div>
                  }
                  actions={[
                    <Button
                      type={isWidgetActive(widget.id) ? 'default' : 'primary'}
                      icon={<PlusOutlined />}
                      onClick={() => handleAddWidget(widget.id)}
                      disabled={isWidgetActive(widget.id) || widget.comingSoon}
                    >
                      {widget.comingSoon ? 'Coming Soon' : 
                       isWidgetActive(widget.id) ? 'Already Added' : 'Add Widget'}
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        <Text strong className="text-white">
                          {widget.title}
                        </Text>
                        {widget.comingSoon && (
                          <Tag color="orange" className="ml-2">Soon</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph className="text-gray-400 mb-2" ellipsis={{ rows: 2 }}>
                          {widget.description}
                        </Paragraph>
                        <Space wrap size="small">
                          {widget.tags.map(tag => (
                            <Tag key={tag} color="default" className="text-xs">
                              {tag}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="No widgets found"
            className="py-8"
          />
        )}
      </Space>
    </Modal>
  );
};

export default WidgetLibrary;