/**
 * Responsive Widget Utilities
 * Provides intelligent sizing and layout optimization for all widgets
 */

/**
 * Calculate optimal grid layout dimensions based on device characteristics
 */
export const calculateOptimalGridLayout = (deviceInfo, windowSize, WIDGET_COUNT = 5) => {
  const { type, orientation } = deviceInfo;
  // Note: windowSize dimensions used in future layout calculations

  // Base grid configurations for different devices
  const gridConfigs = {
    mobile: {
      cols: 4,
      maxCols: 4,
      rowHeight: orientation === 'portrait' ? 60 : 50,
      margin: [12, 12],
      containerPadding: [8, 8],
      compactType: 'vertical',
      // Single column layout for mobile
      layoutTemplate: (widgets) => widgets.map((widget, index) => ({
        i: widget.id,
        x: 0,
        y: index * widget.heightUnits,
        w: 4,
        h: widget.heightUnits,
        minW: 4,
        minH: widget.minHeight || 3,
        maxH: widget.maxHeight || 6,
      }))
    },

    tablet: {
      cols: orientation === 'portrait' ? 6 : 8,
      maxCols: 8,
      rowHeight: 65,
      margin: [16, 16],
      containerPadding: [12, 12],
      compactType: 'vertical',
      // Two column layout for tablets
      layoutTemplate: (widgets) => {
        const colWidth = orientation === 'portrait' ? 6 : 4;
        return widgets.map((widget, index) => {
          const column = index % (orientation === 'portrait' ? 1 : 2);
          const row = Math.floor(index / (orientation === 'portrait' ? 1 : 2));
          return {
            i: widget.id,
            x: column * colWidth,
            y: row * widget.heightUnits,
            w: colWidth,
            h: widget.heightUnits,
            minW: colWidth / 2,
            minH: widget.minHeight || 3,
            maxH: widget.maxHeight || 8,
          };
        });
      }
    },

    laptop: {
      cols: 12,
      maxCols: 12,
      rowHeight: 70,
      margin: [20, 20],
      containerPadding: [16, 16],
      compactType: 'vertical',
      // Flexible layout for laptops
      layoutTemplate: (widgets) => {
        const layouts = {
          'session-tracker': { x: 0, y: 0, w: 4, h: 4 },
          'mmr-chart': { x: 4, y: 0, w: 8, h: 4 },
          'hero-stats': { x: 0, y: 4, w: 6, h: 5 },
          'recent-matches': { x: 6, y: 4, w: 6, h: 5 },
          'performance-metrics': { x: 0, y: 9, w: 12, h: 3 },
        };
        
        return widgets.map((widget, index) => {
          const defaultLayout = layouts[widget.id] || {
            x: (index % 3) * 4,
            y: Math.floor(index / 3) * 4,
            w: 4,
            h: 4
          };
          return {
            i: widget.id,
            ...defaultLayout,
            minW: 3,
            minH: widget.minHeight || 3,
            maxH: widget.maxHeight || 6,
          };
        });
      }
    },

    desktop: {
      cols: 12,
      maxCols: 12,
      rowHeight: 75,
      margin: [24, 24],
      containerPadding: [20, 20],
      compactType: 'vertical',
      // Optimal desktop layout
      layoutTemplate: (widgets) => {
        const layouts = {
          'session-tracker': { x: 0, y: 0, w: 4, h: 5 },
          'mmr-chart': { x: 4, y: 0, w: 8, h: 5 },
          'hero-stats': { x: 0, y: 5, w: 6, h: 6 },
          'recent-matches': { x: 6, y: 5, w: 6, h: 6 },
          'performance-metrics': { x: 0, y: 11, w: 12, h: 4 },
        };
        
        return widgets.map((widget) => {
          const layout = layouts[widget.id] || {
            x: 0, y: 0, w: 6, h: 4
          };
          return {
            i: widget.id,
            ...layout,
            minW: 3,
            minH: widget.minHeight || 3,
            maxH: widget.maxHeight || 8,
          };
        });
      }
    }
  };

  return gridConfigs[type] || gridConfigs.desktop;
};

/**
 * Widget configuration with responsive height units
 */
export const RESPONSIVE_WIDGET_CONFIGS = {
  'session-tracker': {
    id: 'session-tracker',
    heightUnits: 4,
    minHeight: 3,
    maxHeight: 6,
    priority: 1, // Higher priority widgets get better positioning
    contentType: 'metrics',
  },
  'mmr-chart': {
    id: 'mmr-chart',
    heightUnits: 5,
    minHeight: 4,
    maxHeight: 8,
    priority: 2,
    contentType: 'chart',
  },
  'hero-stats': {
    id: 'hero-stats',
    heightUnits: 5,
    minHeight: 4,
    maxHeight: 8,
    priority: 3,
    contentType: 'list',
  },
  'recent-matches': {
    id: 'recent-matches',
    heightUnits: 5,
    minHeight: 4,
    maxHeight: 8,
    priority: 4,
    contentType: 'table',
  },
  'performance-metrics': {
    id: 'performance-metrics',
    heightUnits: 3,
    minHeight: 3,
    maxHeight: 5,
    priority: 5,
    contentType: 'metrics',
  },
};

/**
 * Generate optimal responsive layouts for all breakpoints
 */
export const generateResponsiveLayouts = (deviceInfo, windowSize, activeWidgets = []) => {
  const widgetConfigs = activeWidgets.map(widgetId => RESPONSIVE_WIDGET_CONFIGS[widgetId]).filter(Boolean);
  const gridConfig = calculateOptimalGridLayout(deviceInfo, windowSize, widgetConfigs.length);
  
  // Sort widgets by priority for better layout
  const sortedWidgets = widgetConfigs.sort((a, b) => a.priority - b.priority);
  
  return {
    layouts: {
      [deviceInfo.type]: gridConfig.layoutTemplate(sortedWidgets)
    },
    gridProps: {
      cols: { [deviceInfo.type]: gridConfig.cols },
      breakpoints: { [deviceInfo.type]: 0 },
      rowHeight: gridConfig.rowHeight,
      margin: gridConfig.margin,
      containerPadding: gridConfig.containerPadding,
      compactType: gridConfig.compactType,
    }
  };
};

/**
 * Calculate responsive chart dimensions
 */
export const getResponsiveChartConfig = (deviceInfo, containerHeight) => {
  const { type, orientation } = deviceInfo;
  
  const baseHeight = Math.max(containerHeight - 100, 150); // Account for padding and titles
  
  const configs = {
    mobile: {
      height: Math.min(baseHeight, orientation === 'portrait' ? 200 : 150),
      margin: [10, 10, 30, 30],
      fontSize: 10,
      legend: false,
      tooltip: { 
        trigger: 'axis',
        textStyle: { fontSize: 10 }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '20%'
      }
    },
    
    tablet: {
      height: Math.min(baseHeight, 300),
      margin: [15, 15, 35, 35],
      fontSize: 11,
      legend: true,
      tooltip: { 
        trigger: 'axis',
        textStyle: { fontSize: 11 }
      },
      grid: {
        left: '12%',
        right: '12%',
        top: '15%',
        bottom: '25%'
      }
    },
    
    laptop: {
      height: Math.min(baseHeight, 350),
      margin: [20, 20, 40, 40],
      fontSize: 12,
      legend: true,
      tooltip: { 
        trigger: 'axis',
        textStyle: { fontSize: 12 }
      },
      grid: {
        left: '15%',
        right: '15%',
        top: '15%',
        bottom: '15%'
      }
    },
    
    desktop: {
      height: Math.min(baseHeight, 400),
      margin: [25, 25, 45, 45],
      fontSize: 13,
      legend: true,
      tooltip: { 
        trigger: 'axis',
        textStyle: { fontSize: 13 }
      },
      grid: {
        left: '15%',
        right: '15%',
        top: '15%',
        bottom: '15%'
      }
    }
  };
  
  return configs[type] || configs.desktop;
};

/**
 * Get responsive table configuration
 */
export const getResponsiveTableConfig = (deviceInfo, containerHeight) => {
  const { type, touchCapable } = deviceInfo;
  
  const configs = {
    mobile: {
      size: 'small',
      pageSize: 5,
      scroll: { 
        y: Math.max(containerHeight - 120, 150),
        x: 300 
      },
      showHeader: false,
      pagination: {
        size: 'small',
        showSizeChanger: false,
        showQuickJumper: false,
        simple: true,
      },
      rowClassName: () => 'mobile-table-row',
    },
    
    tablet: {
      size: 'small',
      pageSize: 8,
      scroll: { 
        y: Math.max(containerHeight - 150, 200),
      },
      showHeader: true,
      pagination: {
        size: 'small',
        showSizeChanger: false,
        showQuickJumper: false,
      },
    },
    
    laptop: {
      size: 'middle',
      pageSize: 10,
      scroll: { 
        y: Math.max(containerHeight - 150, 250),
      },
      showHeader: true,
      pagination: {
        showSizeChanger: !touchCapable,
        showQuickJumper: !touchCapable,
      },
    },
    
    desktop: {
      size: 'middle',
      pageSize: 12,
      scroll: { 
        y: Math.max(containerHeight - 150, 300),
      },
      showHeader: true,
      pagination: {
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      },
    }
  };
  
  return configs[type] || configs.desktop;
};

/**
 * Responsive breakpoint utilities
 */
export const RESPONSIVE_BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
};

export const getBreakpoint = (width) => {
  if (width < RESPONSIVE_BREAKPOINTS.xs) return 'xs';
  if (width < RESPONSIVE_BREAKPOINTS.sm) return 'sm';
  if (width < RESPONSIVE_BREAKPOINTS.md) return 'md';
  if (width < RESPONSIVE_BREAKPOINTS.lg) return 'lg';
  if (width < RESPONSIVE_BREAKPOINTS.xl) return 'xl';
  if (width < RESPONSIVE_BREAKPOINTS['2xl']) return '2xl';
  if (width < RESPONSIVE_BREAKPOINTS['3xl']) return '3xl';
  return '4xl';
};

/**
 * Performance optimization utilities
 */
export const getPerformanceConfig = (deviceInfo) => {
  const { type, pixelRatio } = deviceInfo;
  
  // Reduce performance-heavy features on lower-end devices
  const isLowEnd = type === 'mobile' || pixelRatio < 2;
  
  return {
    animations: !isLowEnd,
    shadows: !isLowEnd,
    blur: !isLowEnd,
    transitions: !isLowEnd,
    autoRefresh: type !== 'mobile', // Disable auto-refresh on mobile to save battery
    lazyLoading: type === 'mobile',
    imageOptimization: isLowEnd,
  };
};