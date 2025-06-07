/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Esports Color Palette
        'space': {
          'black': '#0A0A0A',
          'dark': '#111111',
          'medium': '#1A1A1A',
          'light': '#2A2A2A',
        },
        'electric': {
          'cyan': '#00D9FF',
          'blue': '#0099CC',
          'dark': '#005577',
        },
        'neon': {
          'green': '#39FF14',
          'red': '#FF4444',
          'yellow': '#FFFF00',
          'purple': '#9370DB',
        },
        // Dota 2 Rank Colors
        'rank': {
          'herald': '#8B7355',
          'guardian': '#A0A0A0', 
          'crusader': '#FFD700',
          'archon': '#87CEEB',
          'legend': '#4169E1',
          'ancient': '#9370DB',
          'divine': '#FF1493',
          'immortal': '#FF6347',
        },
        // Performance States
        'performance': {
          'excellent': '#39FF14',
          'good': '#00D9FF',
          'average': '#FFFF00',
          'poor': '#FF8C00',
          'terrible': '#FF4444',
        },
        // Mental State Colors
        'mental': {
          'flow': '#00FFFF',
          'focused': '#00D9FF',
          'neutral': '#87CEEB',
          'tilting': '#FF8C00',
          'danger': '#FF4444',
        }
      },
      fontFamily: {
        // Typography System
        'header': ['Rajdhani', 'sans-serif'],
        'futuristic': ['Orbitron', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xxs': '0.625rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
        '8xl': '6rem',
        '9xl': '8rem',
        // Mobile-optimized font scales with line heights
        'mobile-xs': ['12px', { lineHeight: '16px', letterSpacing: '0.025em' }],
        'mobile-sm': ['14px', { lineHeight: '20px', letterSpacing: '0.025em' }],
        'mobile-base': ['16px', { lineHeight: '24px', letterSpacing: '0.025em' }],
        'mobile-lg': ['18px', { lineHeight: '28px', letterSpacing: '0.025em' }],
        'mobile-xl': ['20px', { lineHeight: '32px', letterSpacing: '0.025em' }],
        'mobile-2xl': ['24px', { lineHeight: '36px', letterSpacing: '0.025em' }],
        // Touch-optimized button text
        'touch-button': ['16px', { lineHeight: '20px', fontWeight: '500' }],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'tilt-warning': 'tilt-warning 1s ease-in-out infinite',
        'victory': 'victory 0.8s ease-out',
        'defeat': 'defeat 0.8s ease-out',
        // Mobile-optimized touch animations
        'touch-bounce': 'touch-bounce 0.15s ease-out',
        'touch-press': 'touch-press 0.1s ease-out',
        'slide-in-bottom': 'slide-in-bottom 0.3s ease-out',
        'slide-out-bottom': 'slide-out-bottom 0.2s ease-in',
        'fade-in-scale': 'fade-in-scale 0.2s ease-out',
        'mobile-shake': 'mobile-shake 0.5s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { 
            'box-shadow': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
            transform: 'scale(1)'
          },
          '100%': { 
            'box-shadow': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
            transform: 'scale(1.02)'
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'tilt-warning': {
          '0%, 100%': { 
            'border-color': '#FF4444',
            'box-shadow': '0 0 20px rgba(255, 68, 68, 0.5)'
          },
          '50%': { 
            'border-color': '#FF8C00',
            'box-shadow': '0 0 30px rgba(255, 140, 0, 0.7)'
          }
        },
        victory: {
          '0%': { transform: 'scale(1)', 'background-color': 'currentColor' },
          '50%': { transform: 'scale(1.1)', 'background-color': '#39FF14' },
          '100%': { transform: 'scale(1)', 'background-color': 'currentColor' }
        },
        defeat: {
          '0%': { transform: 'scale(1)', 'background-color': 'currentColor' },
          '50%': { transform: 'scale(0.9)', 'background-color': '#FF4444' },
          '100%': { transform: 'scale(1)', 'background-color': 'currentColor' }
        },
        // Mobile touch interaction keyframes
        'touch-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' }
        },
        'touch-press': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.98)', opacity: '0.8' }
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-out-bottom': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' }
        },
        'fade-in-scale': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'mobile-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 217, 255, 0.5)',
        'glow-lg': '0 0 40px rgba(0, 217, 255, 0.6)',
        'neon': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        'rank': '0 0 25px rgba(255, 215, 0, 0.6)',
        'danger': '0 0 25px rgba(255, 68, 68, 0.6)',
        'success': '0 0 25px rgba(57, 255, 20, 0.6)',
      },
      screens: {
        // Mobile-first responsive breakpoints
        'xs': '480px',
        'sm': '640px', 
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px',
        // Touch device specific breakpoints
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
        // Orientation breakpoints
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
      },
      spacing: {
        // Touch-friendly spacing utilities
        'touch-target': '44px', // Minimum touch target size (44px is Apple/Google standard)
        'touch-safe': '8px',    // Safe spacing for touch interactions
        'mobile-safe': '16px',  // Safe margin for mobile screens
        'nav-mobile': '64px',   // Height for mobile navigation
        'safe-area-top': 'env(safe-area-inset-top)',
        'safe-area-bottom': 'env(safe-area-inset-bottom)',
        'safe-area-left': 'env(safe-area-inset-left)',
        'safe-area-right': 'env(safe-area-inset-right)',
      },
      // Mobile-optimized heights and widths
      height: {
        'screen-mobile': '100vh',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'mobile-nav': '64px',
        'touch-target': '44px',
      },
      minHeight: {
        'screen-mobile': '100vh',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'touch-target': '44px',
      },
      // Touch interaction utilities
      cursor: {
        'touch': 'pointer',
      },
      transitionProperty: {
        'touch': 'transform, opacity, background-color',
      },
      scale: {
        '98': '0.98',
        '102': '1.02',
      }
    },
  },
  plugins: [],
}