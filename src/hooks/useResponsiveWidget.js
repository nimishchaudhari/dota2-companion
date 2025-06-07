import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for intelligent widget sizing based on device characteristics
 * Automatically optimizes widget layout, content density, and interactions
 */
export const useResponsiveWidget = (widgetId, defaultConfig = {}) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    orientation: 'landscape',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    touchCapable: false,
  });

  // Listen for window resize and orientation changes
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        setDeviceInfo(prev => ({
          ...prev,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        }));
      }, 100);
    };

    // Detect device capabilities
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      let deviceType = 'desktop';
      if (width <= 480) {
        deviceType = 'mobile';
      } else if (width <= 768) {
        deviceType = 'tablet';
      } else if (width <= 1024) {
        deviceType = 'laptop';
      }

      setDeviceInfo({
        type: deviceType,
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio: window.devicePixelRatio || 1,
        touchCapable,
      });
    };

    // Initial detection
    detectDevice();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Listen for device pixel ratio changes (zoom)
    const mediaQuery = window.matchMedia('screen and (min-resolution: 2dppx)');
    const handlePixelRatioChange = () => detectDevice();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handlePixelRatioChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handlePixelRatioChange);
      }
    };
  }, []);

  // Calculate responsive breakpoint
  const breakpoint = useMemo(() => {
    const { width } = windowSize;
    if (width < 480) return 'xs';
    if (width < 640) return 'sm';
    if (width < 768) return 'md';
    if (width < 1024) return 'lg';
    if (width < 1280) return 'xl';
    if (width < 1536) return '2xl';
    if (width < 1920) return '3xl';
    return '4xl';
  }, [windowSize]);

  // Calculate optimal widget dimensions
  const widgetDimensions = useMemo(() => {
    const { width, height } = windowSize;
    const { type, orientation } = deviceInfo;
    
    // Base configurations for different device types
    const configs = {
      mobile: {
        minHeight: orientation === 'portrait' ? 200 : 150,
        maxHeight: orientation === 'portrait' ? 400 : 250,
        padding: 8,
        fontSize: 'mobile-sm',
        contentDensity: 'compact',
        columnsPerRow: 1,
        marginBottom: 12,
      },
      tablet: {
        minHeight: orientation === 'portrait' ? 250 : 200,
        maxHeight: orientation === 'portrait' ? 500 : 350,
        padding: 12,
        fontSize: 'mobile-base',
        contentDensity: 'normal',
        columnsPerRow: orientation === 'portrait' ? 1 : 2,
        marginBottom: 16,
      },
      laptop: {
        minHeight: 200,
        maxHeight: 400,
        padding: 16,
        fontSize: 'base',
        contentDensity: 'normal',
        columnsPerRow: 2,
        marginBottom: 20,
      },
      desktop: {
        minHeight: 250,
        maxHeight: 500,
        padding: 20,
        fontSize: 'base',
        contentDensity: 'comfortable',
        columnsPerRow: 3,
        marginBottom: 24,
      }
    };

    const baseConfig = configs[type] || configs.desktop;

    // Calculate available space per widget
    const availableWidth = width - 64; // Account for padding/margins
    const availableHeight = height - 200; // Account for header/navigation

    // Intelligent height calculation based on content and available space
    const calculatedHeight = Math.min(
      Math.max(baseConfig.minHeight, availableHeight * 0.3), // At least 30% of viewport
      baseConfig.maxHeight
    );

    return {
      ...baseConfig,
      optimalHeight: calculatedHeight,
      availableWidth,
      availableHeight,
      // Dynamic sizing based on viewport
      dynamicSize: {
        xs: Math.min(calculatedHeight * 0.8, 180),
        sm: Math.min(calculatedHeight * 0.9, 220),
        md: calculatedHeight,
        lg: Math.min(calculatedHeight * 1.1, baseConfig.maxHeight),
        xl: Math.min(calculatedHeight * 1.2, baseConfig.maxHeight),
      }
    };
  }, [windowSize, deviceInfo]);

  // Content density utilities
  const contentOptions = useMemo(() => {
    const { type, touchCapable } = deviceInfo;
    const { contentDensity } = widgetDimensions;

    return {
      // Chart configurations
      chart: {
        height: widgetDimensions.dynamicSize[breakpoint] - 100,
        margin: contentDensity === 'compact' ? [10, 10, 30, 30] : [20, 20, 40, 40],
        fontSize: contentDensity === 'compact' ? 10 : 12,
        showLegend: contentDensity !== 'compact',
        showTooltip: true,
        responsive: true,
      },
      
      // Table configurations
      table: {
        size: contentDensity === 'compact' ? 'small' : 'middle',
        pageSize: {
          xs: 3,
          sm: 5,
          md: 8,
          lg: 10,
          xl: 12,
        }[breakpoint] || 8,
        scroll: { 
          y: widgetDimensions.dynamicSize[breakpoint] - 150,
          x: type === 'mobile' ? 300 : undefined 
        },
        showHeader: contentDensity !== 'compact',
      },

      // List configurations  
      list: {
        size: contentDensity === 'compact' ? 'small' : 'default',
        itemLayout: type === 'mobile' ? 'vertical' : 'horizontal',
        grid: type === 'mobile' ? { gutter: 8, column: 1 } : { gutter: 16, column: widgetDimensions.columnsPerRow },
        pagination: {
          pageSize: {
            xs: 4,
            sm: 6,
            md: 8,
            lg: 10,
            xl: 12,
          }[breakpoint] || 6,
          showSizeChanger: !touchCapable,
          showQuickJumper: !touchCapable,
          size: contentDensity === 'compact' ? 'small' : 'default',
        }
      },

      // Typography configurations
      typography: {
        title: {
          level: contentDensity === 'compact' ? 5 : 4,
          style: { 
            fontSize: contentDensity === 'compact' ? '14px' : '16px',
            marginBottom: widgetDimensions.padding / 2 
          }
        },
        text: {
          size: widgetDimensions.fontSize,
          lineHeight: contentDensity === 'compact' ? 1.4 : 1.6,
        }
      },

      // Card configurations
      card: {
        size: contentDensity === 'compact' ? 'small' : 'default',
        headStyle: { 
          padding: `${widgetDimensions.padding / 2}px ${widgetDimensions.padding}px`,
          minHeight: touchCapable ? '44px' : 'auto'
        },
        bodyStyle: { 
          padding: `${widgetDimensions.padding}px`,
          maxHeight: widgetDimensions.dynamicSize[breakpoint] - 60,
          overflow: 'auto'
        },
      },

      // Statistics configurations
      statistic: {
        valueStyle: { 
          fontSize: contentDensity === 'compact' ? '18px' : '24px',
          color: '#00D9FF'
        },
        precision: contentDensity === 'compact' ? 0 : 1,
      }
    };
  }, [deviceInfo, widgetDimensions, breakpoint]);

  // Responsive utilities
  const utils = useMemo(() => ({
    // Check if mobile device
    isMobile: deviceInfo.type === 'mobile',
    
    // Check if touch capable
    isTouch: deviceInfo.touchCapable,
    
    // Check if landscape orientation
    isLandscape: deviceInfo.orientation === 'landscape',
    
    // Get optimal component size
    getComponentSize: (component) => {
      const sizeMap = {
        button: deviceInfo.touchCapable ? 'large' : 'middle',
        input: deviceInfo.touchCapable ? 'large' : 'middle',
        select: deviceInfo.touchCapable ? 'large' : 'middle',
        form: deviceInfo.touchCapable ? 'large' : 'middle',
      };
      return sizeMap[component] || 'middle';
    },

    // Get responsive grid props
    getGridProps: () => ({
      gutter: [widgetDimensions.marginBottom / 2, widgetDimensions.marginBottom / 2],
      style: { margin: 0 }
    }),

    // Get optimal spacing
    getSpacing: (type = 'normal') => {
      const spacing = {
        compact: widgetDimensions.padding / 2,
        normal: widgetDimensions.padding,
        comfortable: widgetDimensions.padding * 1.5,
      };
      return spacing[type] || spacing.normal;
    },

    // CSS classes for responsive behavior
    getResponsiveClass: () => {
      const classes = ['responsive-widget'];
      classes.push(`device-${deviceInfo.type}`);
      classes.push(`orientation-${deviceInfo.orientation}`);
      classes.push(`breakpoint-${breakpoint}`);
      classes.push(`density-${widgetDimensions.contentDensity}`);
      if (deviceInfo.touchCapable) classes.push('touch-device');
      return classes.join(' ');
    },
  }), [deviceInfo, widgetDimensions, breakpoint]);

  return {
    // Device information
    device: deviceInfo,
    windowSize,
    breakpoint,
    
    // Calculated dimensions
    dimensions: widgetDimensions,
    
    // Content configurations
    content: contentOptions,
    
    // Utility functions
    utils,
    
    // Widget-specific overrides
    ...defaultConfig,
  };
};

export default useResponsiveWidget;