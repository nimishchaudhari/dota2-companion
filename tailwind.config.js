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
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'tilt-warning': 'tilt-warning 1s ease-in-out infinite',
        'victory': 'victory 0.8s ease-out',
        'defeat': 'defeat 0.8s ease-out',
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
        '3xl': '1920px',
        '4xl': '2560px',
      }
    },
  },
  plugins: [],
}