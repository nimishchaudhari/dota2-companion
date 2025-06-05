import { theme } from 'antd';

export const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    // Brand colors
    colorPrimary: '#00d9ff', // Cyan - primary actions
    colorSuccess: '#52c41a', // Green - wins/positive
    colorError: '#ff4d4f', // Red - losses/negative  
    colorWarning: '#faad14', // Orange - warnings/caution
    colorInfo: '#1890ff', // Blue - information
    
    // Backgrounds
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#0a0a0a',
    colorBgSpotlight: '#141414',
    colorBgMask: 'rgba(0, 0, 0, 0.85)',
    
    // Text hierarchy
    colorText: 'rgba(255, 255, 255, 0.95)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
    
    // Borders
    colorBorder: '#303030',
    colorBorderSecondary: '#1f1f1f',
    
    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    
    // Spacing and sizing
    borderRadius: 8,
    controlHeight: 36,
    
    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      headerBg: '#0a0a0a',
      bodyBg: '#0a0a0a',
    },
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.04)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
      paddingLG: 24,
    },
    Button: {
      primaryShadow: '0 2px 8px rgba(0, 217, 255, 0.3)',
      defaultBorderColor: 'rgba(255, 255, 255, 0.15)',
    },
    Table: {
      colorBgContainer: 'rgba(255, 255, 255, 0.02)',
      headerBg: 'rgba(255, 255, 255, 0.04)',
      rowHoverBg: 'rgba(255, 255, 255, 0.08)',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.04)',
      colorBorder: 'rgba(255, 255, 255, 0.15)',
    },
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.04)',
      colorBorder: 'rgba(255, 255, 255, 0.15)',
    },
    Modal: {
      colorBgElevated: '#1a1a1a',
    },
    Dropdown: {
      colorBgElevated: '#1a1a1a',
    },
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
      fontFamily: "'JetBrains Mono', monospace",
    },
    Progress: {
      defaultColor: '#00d9ff',
    },
    Tag: {
      colorFillSecondary: 'rgba(255, 255, 255, 0.04)',
    },
    Alert: {
      colorInfoBg: 'rgba(24, 144, 255, 0.1)',
      colorSuccessBg: 'rgba(82, 196, 26, 0.1)',
      colorWarningBg: 'rgba(250, 173, 20, 0.1)',
      colorErrorBg: 'rgba(255, 77, 79, 0.1)',
    },
    Badge: {
      colorBgContainer: 'rgba(255, 255, 255, 0.04)',
    },
    Tooltip: {
      colorBgSpotlight: '#1a1a1a',
    },
    Skeleton: {
      gradientFromColor: 'rgba(255, 255, 255, 0.04)',
      gradientToColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
};

// Gaming-specific color palette
export const gamingColors = {
  electric: {
    cyan: '#00d9ff',
    blue: '#00b3ff',
    green: '#52c41a',
    red: '#ff4d4f',
    yellow: '#fadb14',
    purple: '#9370DB',
    orange: '#fa8c16',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.65)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    quaternary: 'rgba(255, 255, 255, 0.25)',
  },
  border: '#303030',
  performance: {
    excellent: '#52c41a',
    good: '#00d9ff',
    average: '#fadb14',
    poor: '#fa8c16',
    terrible: '#ff4d4f',
  },
  mental: {
    flow: '#52c41a',
    focused: '#00d9ff',
    neutral: '#fadb14',
    tilting: '#fa8c16',
    danger: '#ff4d4f',
  },
  rank: {
    herald: '#8B7355',
    guardian: '#A0A0A0',
    crusader: '#FFD700',
    archon: '#87CEEB',
    legend: '#4169E1',
    ancient: '#9370DB',
    divine: '#FF1493',
    immortal: '#FF6347',
  },
  space: {
    black: '#0a0a0a',
    dark: '#141414',
    medium: '#1a1a1a',
    light: '#262626',
  },
  neon: {
    green: '#39ff14',
    red: '#ff073a',
    yellow: '#ffff33',
    purple: '#bc13fe',
  },
};

// Rank-specific colors for gaming context (deprecated, use gamingColors.rank)
export const rankColors = gamingColors.rank;

// Theme switching mechanism for future light mode
export const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...darkTheme.token,
    colorBgContainer: '#ffffff',
    colorBgElevated: '#fafafa',
    colorBgLayout: '#f5f5f5',
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
  },
  components: {
    ...darkTheme.components,
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    Card: {
      colorBgContainer: '#ffffff',
      colorBorderSecondary: '#f0f0f0',
    },
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
    },
  },
};

export default { darkTheme, lightTheme, rankColors, gamingColors };