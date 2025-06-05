import React, { useState, ErrorBoundary } from 'react';
import { Card, Button, Dropdown, Skeleton, Space, Typography, Tooltip } from 'antd';
import { 
  MoreOutlined, 
  ReloadOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined,
  DragOutlined,
  SettingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
// import { motion } from 'framer-motion';

const { Text } = Typography;

// Error Boundary Component for Individual Widgets
class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center text-center p-4">
          <Space direction="vertical" size="middle">
            <ExclamationCircleOutlined 
              style={{ fontSize: '48px', color: '#ff4d4f' }} 
            />
            <div>
              <Text strong className="text-white">Widget Error</Text>
              <br />
              <Text type="secondary" className="text-sm">
                This widget encountered an error and couldn't load.
              </Text>
            </div>
            <Button 
              type="primary" 
              size="small"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onRetry?.();
              }}
            >
              Retry
            </Button>
          </Space>
        </div>
      );
    }

    return this.props.children;
  }
}

// Widget Wrapper Component
export const WidgetWrapper = ({ 
  id, 
  title, 
  icon, 
  component, 
  loading = false,
  onRefresh,
  onRemove,
  onConfigure,
  onFullscreen,
  isFullscreen = false,
  className = '',
  onMatchClick,
  ...props 
}) => {
  const Component = component;
  const [localLoading, setLocalLoading] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setLocalLoading(true);
    try {
      await onRefresh(id);
    } catch (error) {
      console.error('Widget refresh failed:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const menuItems = [
    {
      key: 'refresh',
      icon: <ReloadOutlined />,
      label: 'Refresh',
      onClick: handleRefresh,
      disabled: localLoading || loading,
    },
    {
      key: 'configure',
      icon: <SettingOutlined />,
      label: 'Configure',
      onClick: () => onConfigure?.(id),
      disabled: !onConfigure,
    },
    {
      type: 'divider',
    },
    {
      key: 'fullscreen',
      icon: isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
      label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
      onClick: () => onFullscreen?.(id),
      disabled: !onFullscreen,
    },
    {
      type: 'divider',
    },
    {
      key: 'remove',
      icon: <DeleteOutlined />,
      label: 'Remove',
      onClick: () => onRemove?.(id),
      disabled: !onRemove,
      danger: true,
    },
  ];

  const cardTitle = (
    <div className="flex items-center justify-between w-full">
      <Space size="small">
        <span className="widget-drag-handle cursor-move">
          <DragOutlined className="text-gray-500 hover:text-cyan-400 transition-colors" />
        </span>
        <Space size="small">
          {icon && <span className="text-cyan-400">{icon}</span>}
          <Text strong className="text-white text-sm">
            {title}
          </Text>
        </Space>
      </Space>
      
      <Space size="small">
        <Tooltip title="Refresh">
          <Button 
            type="text" 
            size="small"
            icon={<ReloadOutlined spin={localLoading || loading} />}
            onClick={handleRefresh}
            disabled={localLoading || loading || !onRefresh}
            className="text-gray-400 hover:text-cyan-400"
          />
        </Tooltip>
        
        <Tooltip title="Fullscreen">
          <Button
            type="text"
            size="small" 
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={() => onFullscreen?.(id)}
            disabled={!onFullscreen}
            className="text-gray-400 hover:text-cyan-400"
          />
        </Tooltip>
        
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button 
            type="text" 
            size="small" 
            icon={<MoreOutlined />}
            className="text-gray-400 hover:text-cyan-400"
          />
        </Dropdown>
      </Space>
    </div>
  );

  return (
    <div className={`h-full ${isFullscreen ? 'fixed inset-0 z-50 m-0' : ''} ${className}`}>
      <Card
        title={cardTitle}
        className="h-full widget-card"
        styles={{
          body: { 
            height: 'calc(100% - 48px)',
            padding: '16px',
            overflow: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          },
          header: {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            minHeight: 48,
            padding: '8px 16px'
          }
        }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px'
        }}
      >
        <WidgetErrorBoundary onRetry={handleRefresh}>
          {loading || localLoading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton 
                active 
                paragraph={{ rows: 4 }}
                className="w-full"
              />
            </div>
          ) : (
            <Component {...props} onMatchClick={onMatchClick} />
          )}
        </WidgetErrorBoundary>
      </Card>
    </div>
  );
};

// Loading Skeleton for Widgets
export const WidgetSkeleton = ({ rows = 4 }) => (
  <div className="h-full flex items-center justify-center">
    <Skeleton 
      active 
      paragraph={{ rows }}
      className="w-full"
      style={{
        '.ant-skeleton-content .ant-skeleton-title': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)'
        },
        '.ant-skeleton-content .ant-skeleton-paragraph > li': {
          backgroundColor: 'rgba(255, 255, 255, 0.06)'
        }
      }}
    />
  </div>
);

export default WidgetWrapper;