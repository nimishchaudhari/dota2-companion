import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Layout, Space, Button, Select, DatePicker, Tooltip, Spin, App } from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  UndoOutlined, 
  SettingOutlined,
  DashboardOutlined,
  DownloadOutlined,
  FilterOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { AnimatePresence } from 'framer-motion';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useData } from '../../contexts/DataContext.jsx';
import { AuthContext } from '../../contexts/AuthContext.js';
import { useContext } from 'react';
import WidgetWrapper from './WidgetWrapper.jsx';
import WidgetLibrary, { WIDGET_DEFINITIONS } from './WidgetLibrary.jsx';
import useResponsiveWidget from '../../hooks/useResponsiveWidget.js';
import { 
  generateResponsiveLayouts, 
  RESPONSIVE_WIDGET_CONFIGS,
  getPerformanceConfig 
} from '../../utils/responsiveWidgets.js';

// Import all widgets
import SessionTrackerWidget from './widgets/SessionTrackerWidget.jsx';
import MMRProgressionWidget from './widgets/MMRProgressionWidget.jsx';
import HeroPerformanceWidget from './widgets/HeroPerformanceWidget.jsx';
import RecentMatchesWidget from './widgets/RecentMatchesWidget.jsx';
import PerformanceMetricsWidget from './widgets/PerformanceMetricsWidget.jsx';

const { Content } = Layout;
const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget component mapping
const WIDGET_COMPONENTS = {
  'session-tracker': SessionTrackerWidget,
  'mmr-chart': MMRProgressionWidget,
  'hero-stats': HeroPerformanceWidget,
  'recent-matches': RecentMatchesWidget,
  'performance-metrics': PerformanceMetricsWidget,
};

// Mobile-optimized dashboard layouts for different breakpoints
const defaultLayouts = {
  lg: [
    { i: 'session-tracker', x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'mmr-chart', x: 4, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
    { i: 'hero-stats', x: 0, y: 5, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'recent-matches', x: 6, y: 5, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'performance-metrics', x: 0, y: 11, w: 12, h: 4, minW: 8, minH: 3 }
  ],
  md: [
    // Tablet layout - optimized for touch interaction
    { i: 'session-tracker', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'mmr-chart', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'hero-stats', x: 0, y: 4, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'recent-matches', x: 6, y: 4, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'performance-metrics', x: 0, y: 9, w: 12, h: 3, minW: 6, minH: 3 }
  ],
  sm: [
    // Small tablet/large phone layout - single column with better spacing
    { i: 'session-tracker', x: 0, y: 0, w: 6, h: 3, minW: 6, minH: 3 },
    { i: 'mmr-chart', x: 0, y: 3, w: 6, h: 4, minW: 6, minH: 3 },
    { i: 'hero-stats', x: 0, y: 7, w: 6, h: 4, minW: 6, minH: 3 },
    { i: 'recent-matches', x: 0, y: 11, w: 6, h: 4, minW: 6, minH: 3 },
    { i: 'performance-metrics', x: 0, y: 15, w: 6, h: 3, minW: 6, minH: 3 }
  ],
  xs: [
    // Mobile layout - optimized for single-handed use with proper touch spacing
    { i: 'session-tracker', x: 0, y: 0, w: 4, h: 3, minW: 4, minH: 3 },
    { i: 'mmr-chart', x: 0, y: 3, w: 4, h: 4, minW: 4, minH: 3 },
    { i: 'hero-stats', x: 0, y: 7, w: 4, h: 4, minW: 4, minH: 3 },
    { i: 'recent-matches', x: 0, y: 11, w: 4, h: 4, minW: 4, minH: 3 },
    { i: 'performance-metrics', x: 0, y: 15, w: 4, h: 3, minW: 4, minH: 3 }
  ],
  xxs: [
    // Ultra-small mobile layout for very small screens
    { i: 'session-tracker', x: 0, y: 0, w: 2, h: 3, minW: 2, minH: 3 },
    { i: 'mmr-chart', x: 0, y: 3, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'hero-stats', x: 0, y: 7, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'recent-matches', x: 0, y: 11, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'performance-metrics', x: 0, y: 15, w: 2, h: 3, minW: 2, minH: 3 }
  ]
};

// Dashboard presets
const dashboardPresets = [
  { value: 'main', label: 'Main Dashboard' },
  { value: 'competitive', label: 'Competitive Focus' },
  { value: 'analytics', label: 'Deep Analytics' },
  { value: 'casual', label: 'Casual Gaming' },
  { value: 'streamer', label: 'Streamer Layout' }
];

// Time range presets
const timeRangePresets = [
  { label: 'Last 24 Hours', value: [new Date(Date.now() - 24 * 60 * 60 * 1000), new Date()] },
  { label: 'Last 7 Days', value: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()] },
  { label: 'Last 30 Days', value: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()] },
  { label: 'Last 3 Months', value: [new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()] }
];

const AntDashboard = ({ onMatchClick }) => {
  const { user: USER } = useContext(AuthContext);
  const { loading, recentMatches, winLoss, heroStats, ratings } = useData();
  const { message } = App.useApp();
  
  // Responsive system integration
  const responsive = useResponsiveWidget('dashboard');
  const { device, windowSize, dimensions, utils } = responsive;
  
  // Dashboard state
  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('dashboard-layouts');
    if (saved) return JSON.parse(saved);
    
    // Generate responsive layouts based on current device
    const responsiveLayoutData = generateResponsiveLayouts(device, windowSize, 
      ['session-tracker', 'mmr-chart', 'hero-stats', 'recent-matches', 'performance-metrics']
    );
    return responsiveLayoutData.layouts;
  });
  
  const [activeWidgets, setActiveWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : ['session-tracker', 'mmr-chart', 'hero-stats', 'recent-matches', 'performance-metrics'];
  });
  
  const [CURRENT_BREAKPOINT, SET_CURRENT_BREAKPOINT] = useState('lg');
  const [fullscreenWidget, setFullscreenWidget] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const [dashboardPreset, setDashboardPreset] = useState('main');
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Save layouts to localStorage with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('dashboard-layouts', JSON.stringify(layouts));
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [layouts]);

  // Save active widgets to localStorage
  const saveActiveWidgets = useCallback((widgets) => {
    setActiveWidgets(widgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, []);

  // Regenerate layouts when device characteristics change
  useEffect(() => {
    const responsiveLayoutData = generateResponsiveLayouts(device, windowSize, activeWidgets);
    
    // Only update if this is a significant device change
    const shouldUpdate = 
      !layouts[device.type] || // No layout for current device type
      Object.keys(layouts).length === 0 || // No layouts at all
      (device.type === 'mobile' && Object.keys(layouts).some(key => key !== 'mobile')); // Switched to mobile
    
    if (shouldUpdate) {
      setLayouts(prev => ({
        ...prev,
        ...responsiveLayoutData.layouts
      }));
    }
  }, [device.type, device.orientation, windowSize.width, activeWidgets, device, windowSize, layouts]);

  // Handle layout change
  const handleLayoutChange = useCallback((layout, allLayouts) => {
    setLayouts(allLayouts);
  }, []);

  // Handle breakpoint change
  const handleBreakpointChange = useCallback((breakpoint) => {
    SET_CURRENT_BREAKPOINT(breakpoint);
  }, []);

  // Widget management functions
  const handleWidgetRefresh = useCallback(async (widgetId) => {
    console.log('Refreshing widget:', widgetId);
    message.info(`Refreshing ${widgetId}...`);
    // In a real implementation, this would trigger specific data refresh
  }, [message]);

  const handleWidgetRemove = useCallback((widgetId) => {
    const newWidgets = activeWidgets.filter(id => id !== widgetId);
    saveActiveWidgets(newWidgets);
    
    // Remove from layouts too
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== widgetId);
    });
    setLayouts(newLayouts);
    
    message.success('Widget removed');
  }, [activeWidgets, saveActiveWidgets, layouts, message]);

  const handleWidgetFullscreen = useCallback((widgetId) => {
    setFullscreenWidget(fullscreenWidget === widgetId ? null : widgetId);
  }, [fullscreenWidget]);

  const handleAddWidget = useCallback((widgetId) => {
    if (!activeWidgets.includes(widgetId)) {
      // Add widget to active list
      saveActiveWidgets([...activeWidgets, widgetId]);
      
      // Add to layouts with default position
      const newLayouts = { ...layouts };
      Object.keys(newLayouts).forEach(breakpoint => {
        const existing = newLayouts[breakpoint];
        const maxY = existing.reduce((max, item) => Math.max(max, item.y + item.h), 0);
        
        newLayouts[breakpoint].push({
          i: widgetId,
          x: 0,
          y: maxY,
          w: breakpoint === 'lg' ? 6 : breakpoint === 'md' ? 5 : breakpoint === 'sm' ? 6 : 4,
          h: 4,
          minW: 3,
          minH: 3
        });
      });
      setLayouts(newLayouts);
      
      message.success('Widget added to dashboard');
    } else {
      message.info('Widget already on dashboard');
    }
  }, [activeWidgets, saveActiveWidgets, layouts, message]);

  // Reset layout
  const handleResetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    saveActiveWidgets(['session-tracker', 'mmr-chart', 'hero-stats', 'recent-matches', 'performance-metrics']);
    message.success('Dashboard reset to default');
  }, [saveActiveWidgets, message]);

  // Save current layout as preset
  const handleSaveLayout = useCallback(() => {
    const layoutData = {
      layouts,
      widgets: activeWidgets,
      preset: dashboardPreset,
      timestamp: Date.now()
    };
    localStorage.setItem(`dashboard-preset-${dashboardPreset}`, JSON.stringify(layoutData));
    message.success('Layout saved successfully');
  }, [layouts, activeWidgets, dashboardPreset, message]);

  // Load preset
  const handlePresetChange = useCallback((preset) => {
    setDashboardPreset(preset);
    
    const saved = localStorage.getItem(`dashboard-preset-${preset}`);
    if (saved) {
      const { layouts: savedLayouts, widgets } = JSON.parse(saved);
      setLayouts(savedLayouts);
      saveActiveWidgets(widgets);
      message.success(`Loaded ${preset} preset`);
    }
  }, [saveActiveWidgets, message]);

  // Export dashboard
  const handleExportDashboard = useCallback(() => {
    // Future: Export as image/PDF
    message.info('Export functionality coming soon');
  }, [message]);

  // Toggle dashboard fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Get widget configurations for active widgets
  const activeWidgetConfigs = useMemo(() => {
    return activeWidgets.map(widgetId => ({
      id: widgetId,
      component: WIDGET_COMPONENTS[widgetId],
      config: WIDGET_DEFINITIONS.find(w => w.id === widgetId) || {}
    })).filter(widget => widget.component);
  }, [activeWidgets]);

  // Check if we have any data
  const hasData = recentMatches || winLoss || heroStats || ratings;
  const isLoading = loading.matches && loading.heroes && loading.ratings && loading.winLoss;

  // Dashboard toolbar
  const DashboardToolbar = () => (
    <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Space size="middle" wrap>
          <Select
            value={dashboardPreset}
            onChange={handlePresetChange}
            style={{ width: 200 }}
            options={dashboardPresets}
            prefix={<DashboardOutlined />}
          />
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowWidgetLibrary(true)}
          >
            Add Widget
          </Button>
          
          <DatePicker.RangePicker 
            presets={timeRangePresets}
            value={timeRange}
            onChange={setTimeRange}
            placeholder={['Start Date', 'End Date']}
          />
        </Space>

        <Space size="middle" wrap>
          <Tooltip title="Filter Data">
            <Button icon={<FilterOutlined />} />
          </Tooltip>
          
          <Tooltip title="Export Dashboard">
            <Button icon={<DownloadOutlined />} onClick={handleExportDashboard} />
          </Tooltip>
          
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <Button 
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
              onClick={toggleFullscreen}
            />
          </Tooltip>
          
          <Space.Compact>
            <Tooltip title="Save Layout">
              <Button icon={<SaveOutlined />} onClick={handleSaveLayout} />
            </Tooltip>
            <Tooltip title="Reset Layout">
              <Button icon={<UndoOutlined />} onClick={handleResetLayout} />
            </Tooltip>
          </Space.Compact>
          
          <Tooltip title="Dashboard Settings">
            <Button icon={<SettingOutlined />} />
          </Tooltip>
        </Space>
      </div>
    </div>
  );

  // Show loading state if data is still loading
  if (isLoading && !hasData) {
    return (
      <Layout className="min-h-screen bg-gray-900">
        <DashboardToolbar />
        <Content className="flex items-center justify-center">
          <Spin size="large" tip="Loading dashboard data..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen bg-gray-900">
      <DashboardToolbar />
      
      <Content className="p-6 overflow-auto">
        <AnimatePresence>
          <div 
            className="h-full"
          >
            <ResponsiveGridLayout
              className={`layout dashboard-grid ${utils.getResponsiveClass()}`}
              layouts={layouts}
              breakpoints={{ 
                lg: 1200, 
                md: 996, 
                sm: 768, 
                xs: 480, 
                xxs: 0 
              }}
              cols={{ 
                lg: 12, 
                md: device.type === 'tablet' && device.orientation === 'portrait' ? 6 : 12, 
                sm: 6, 
                xs: 4, 
                xxs: 2 
              }}
              rowHeight={dimensions.dynamicSize.md / 4} // Intelligent row height based on content
              onLayoutChange={handleLayoutChange}
              onBreakpointChange={handleBreakpointChange}
              draggableHandle={device.touchCapable ? null : ".widget-drag-handle"} // Disable drag on touch devices
              useCSSTransforms={getPerformanceConfig(device).animations}
              compactType="vertical"
              preventCollision={false}
              margin={[utils.getSpacing('normal'), utils.getSpacing('normal')]}
              containerPadding={[utils.getSpacing('compact'), utils.getSpacing('compact')]}
              resizeHandles={device.type === 'mobile' ? [] : ['se']} // No resize on mobile
              allowOverlap={false}
              isDraggable={!device.touchCapable} // Disable dragging on touch devices
              isResizable={device.type !== 'mobile'} // Disable resizing on mobile
            >
              {activeWidgetConfigs.map(({ id, component: WidgetComponent, config }) => (
                <div key={id} className="dashboard-widget">
                  <WidgetWrapper
                    id={id}
                    title={config.title || id}
                    icon={config.icon}
                    component={WidgetComponent}
                    loading={loading.matches || loading.heroes || loading.ratings}
                    onRefresh={handleWidgetRefresh}
                    onRemove={handleWidgetRemove}
                    onFullscreen={handleWidgetFullscreen}
                    isFullscreen={fullscreenWidget === id}
                    className={fullscreenWidget === id ? 'z-50' : ''}
                    timeRange={timeRange}
                    onMatchClick={id === 'recent-matches' ? onMatchClick : undefined}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>

            {/* Empty state */}
            {activeWidgets.length === 0 && (
              <div className="h-96 flex items-center justify-center text-center">
                <Space direction="vertical" size="large">
                  <DashboardOutlined style={{ fontSize: '64px', color: '#00d9ff' }} />
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">Welcome to your Command Center</h3>
                    <p className="text-gray-400">Add widgets to start tracking your Dota 2 performance</p>
                  </div>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setShowWidgetLibrary(true)}
                  >
                    Add Your First Widget
                  </Button>
                </Space>
              </div>
            )}
          </div>
        </AnimatePresence>
      </Content>

      {/* Widget Library Modal */}
      <WidgetLibrary
        open={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        onAddWidget={handleAddWidget}
        activeWidgets={activeWidgets}
      />

      {/* Fullscreen overlay backdrop */}
      {fullscreenWidget && (
        <div 
          className="fixed inset-0 bg-black/80 z-40"
          onClick={() => setFullscreenWidget(null)}
        />
      )}
    </Layout>
  );
};

export default AntDashboard;