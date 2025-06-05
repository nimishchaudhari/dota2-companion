# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dota 2 Companion - A professional React 19 analytics dashboard for Dota 2 players featuring real-time OpenDota API integration, Ant Design 5.x UI components, and a fully customizable widget-based interface with drag-and-drop functionality.

## Development Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173/)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run all tests once
npm run test:run src/__tests__/widgets/  # Run specific test directory
npm run test:journey # Run integration journey tests
npm run test:performance # Run performance benchmarks
npm run test:watch   # Run tests in watch mode (alias for npm test)
npm run test:coverage # Generate coverage report
npm run test:ui      # Vitest UI dashboard
```

## Architecture Overview

### Core Application Structure

**Authentication Flow:**
- Dual-mode authentication controlled by `VITE_AUTH_MODE` environment variable
- Development mode: Direct Account ID input (bypasses Steam OpenID)
- Production mode: Steam OpenID with callback at `/auth/steam/callback`
- Session persistence via localStorage with TTL management

**Data Management:**
- `DataContext` provides centralized data fetching from OpenDota API
- Heroes data exposed as both array and map formats for compatibility
- Real-time caching with 5-minute TTL for API responses
- Automatic retry logic for failed API calls

**Widget System:**
- Modular widgets in `src/components/Dashboard/widgets/`
- Each widget wrapped with error boundaries via `WidgetWrapper`
- Individual refresh capabilities and loading states
- Layout persistence to localStorage with responsive breakpoints

### Key Technical Patterns

**Ant Design 5.x Integration:**
```javascript
// Theme configuration in src/theme/antdTheme.js
ConfigProvider theme={darkTheme} // Global dark gaming theme
// Component tokens use new API: headerBg, bodyBg (not colorBgHeader, colorBgBody)
// Card components use variant="outlined" (not bordered prop)
// Message API requires App.useApp() hook for context
```

**React Grid Layout:**
```javascript
// Required CSS imports in components using grid
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
// Layouts stored per breakpoint in localStorage
```

**Data Transformation Pipeline:**
```javascript
// Raw API → dataTransforms.js → Widget components
// KDA calculations return numeric values with separate kdaString
// Hero stats filtered to 5+ games before display
```

## Critical Implementation Details

### API Integration
- OpenDota API rate limit: 60 requests/minute
- Steam API requires `VITE_STEAM_API_KEY` in `.env.local`
- All API calls use real data - no mocks in production
- Heroes endpoint cached separately with longer TTL

### Widget Development Requirements
1. Must use `useData()` hook from DataContext
2. Implement loading states with Ant Design Spin
3. Handle empty states with Ant Design Empty component
4. Support responsive design across all breakpoints
5. Add to `WIDGET_COMPONENTS` map in AntDashboard.jsx

### Common Gotchas
- ESLint allows unused vars starting with uppercase (`^[A-Z_]`)
- Tailwind 4.x uses `@tailwindcss/postcss` plugin (not legacy `tailwindcss`)
- Tests may fail with API 429 errors due to rate limiting
- Bundle size warnings are expected (~2.7MB due to Ant Design + charts)
- React 19 requires careful migration of legacy patterns
- Vite 6.x configuration may differ from earlier versions

### Testing Considerations
- All tests use real OpenDota API data
- 30-second timeout for API-dependent tests via vitest.config.js
- Journey tests validate complete user workflows
- Performance benchmarks in `src/__tests__/performance/`
- Widget tests should mock DataContext provider
- Test environment variables set via vitest config define block
- HTML and JSON test reports generated in project root

## Recent Migration Notes

**Ant Design 5.x Updates (v4.2.0):**
- Fixed `getTimeAgo` temporal dead zone in RecentMatchesWidget
- Updated deprecated Card `bordered` → `variant="outlined"`
- Migrated static `message` → `App.useApp()` hook pattern
- Fixed heroes data structure (array vs map compatibility)

**Performance Metrics:**
- Dashboard render target: < 2 seconds
- Widget refresh target: < 500ms
- Memory usage target: < 50MB increase per session

## Asset Management

**Dota 2 Game Assets (v4.4.0):**
- Complete asset library from nimishchaudhari/dota2-assets repository
- Hero icons (PNG format) in `src/assets/heroes/icons/`
- Animated hero portraits in `src/assets/heroes/animated/`
- Ability icons (WebP format) in `src/assets/abilities/`
- Item icons (PNG/WebP formats) in `src/assets/items/`
- Rune icons in `src/assets/runes/`
- Hero facet icons in `src/assets/facets/`

**Asset Helper Utilities:**
- `src/utils/assetHelpers.js` provides standardized asset access functions
- `getHeroIcon(heroName, animated)` for hero portraits
- `getAbilityIcon(abilityName)` for ability icons with fallbacks
- `getItemIcon(itemName, format)` for item icons
- `normalizeHeroName()` handles OpenDota API name mapping
- Built-in fallback handling for missing assets

## Latest Updates (v4.3.0)

**Widget Header Size Reduction:**
- All widget headers reduced to 40% of original size (14px font)
- Subtitles reduced proportionally to 10px
- Maintains professional appearance with more content space

**MMR Progression Widget Fix:**
- Now calculates estimated MMR from match history (win/loss)
- Shows progression based on last 20 matches
- Displays current estimated MMR with trend indicators

**Recent Matches Widget Redesign:**
- Widget-optimized design with compact match list
- Hero avatars with win/loss border indicators  
- Hover effects showing additional stats (GPM, XPM, Party)
- Click functionality to open detailed match analysis

**Match Analysis Page:**
- Comprehensive 5-tab analysis system:
  - Overview: Team compositions and player statistics
  - Performance: Combat metrics and efficiency ratings
  - Items & Skills: Build progression and ability order
  - Graphs: Gold/XP advantage over time
  - Combat: Damage distribution and detailed combat stats
- Professional dark theme consistency
- Breadcrumb navigation back to dashboard

## Changelog

### v4.4.0 - Dota 2 Asset Integration (June 5, 2025)

**Asset Management System:**
- **Complete Asset Library**: Integrated nimishchaudhari/dota2-assets repository
- **Asset Categories**: Heroes (icons + animated), abilities, items, runes, facets
- **Helper Utilities**: Created `src/utils/assetHelpers.js` for standardized asset access
- **Fallback System**: Built-in handling for missing or invalid asset references
- **API Integration**: Hero name normalization for OpenDota API compatibility
- **Format Support**: Mixed PNG/WebP formats optimized for different use cases

This integration provides the dashboard with comprehensive visual assets for all Dota 2 game elements, enabling rich hero portraits, ability icons, and item displays throughout the application.

### v4.2.1 - Widget Header Size Optimization (June 5, 2025)

**UI Refinement:**
- **Reduced Widget Headers**: All dashboard widget headers reduced by 40% for improved space efficiency
- **Title Components**: Changed from `Title level={4}` to `Title level={5}` with custom `fontSize: '14px'`
- **Subtitle Scaling**: Proportionally reduced subtitle text from `text-xs` to inline style `fontSize: '10px'`
- **Affected Widgets**: SessionTrackerWidget, MMRProgressionWidget, HeroPerformanceWidget, RecentMatchesWidget, PerformanceMetricsWidget

This change improves the visual density of the dashboard, allowing more content to be visible within each widget while maintaining readability and the professional gaming aesthetic.