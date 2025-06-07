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

## Environment Setup

Create `.env.local` in the project root with your API keys:

```bash
# OpenDota API Configuration - HIGHLY RECOMMENDED
# Get your API key from: https://www.opendota.com/api-keys
VITE_OPENDOTA_API_KEY="your_opendota_api_key_here"

# Without API key: 60 requests/minute (free tier)
# With API key: 60,000 requests/hour (registered tier)

# Steam API Configuration (optional)
VITE_STEAM_API_KEY="your_steam_api_key_here"

# Authentication Mode
VITE_AUTH_MODE=development
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
- OpenDota API key support for enhanced rate limits (60,000 requests/hour vs 60/minute)
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
- OpenDota API rate limit: 60 requests/minute (free) / 60,000/hour (with API key)
- Steam API requires `VITE_STEAM_API_KEY` in `.env.local`
- All API calls use real data - no mocks in production
- Heroes endpoint cached separately with longer TTL
- Data fetching centralized in `DataContext.jsx` with automatic retry logic

### Widget Development Requirements
1. Must use `useData()` hook from DataContext
2. Implement loading states with Ant Design Spin
3. Handle empty states with Ant Design Empty component
4. Support responsive design across all breakpoints
5. Add to `WIDGET_COMPONENTS` map in AntDashboard.jsx
6. Wrap with `WidgetWrapper` for error boundaries and consistent styling

### Authentication System
- Dual-mode authentication: Development (Account ID) / Production (Steam OpenID)
- Mode controlled by `VITE_AUTH_MODE` environment variable
- Session persistence via localStorage with 24-hour TTL
- Steam callback handled at `/auth/steam/callback` route
- Development mode bypasses Steam for easier testing

### Routing & Navigation
- Simple client-side routing via `SimpleRouter` component in App.jsx
- Special routes:
  - `/auth/steam/callback` - Steam authentication callback handler
  - `/asset-test` - Asset verification page (no auth required)
  - All other routes go to main application
- Navigation state managed in `AppContent` component
- Match analysis accessible via `onMatchClick` callback system

### Code Style & Linting
- ESLint allows unused vars starting with uppercase (`^[A-Z_]`)
- React 19 hooks rules strictly enforced - all hooks before conditional returns
- No comments should be added unless explicitly requested
- Prefer editing existing files over creating new ones

### Common Gotchas
- Tailwind 4.x uses `@tailwindcss/postcss` plugin (not legacy `tailwindcss`)
- Tests may fail with API 429 errors due to rate limiting
- Bundle size warnings are expected (~2.7MB due to Ant Design + charts)
- React 19 requires careful migration of legacy patterns
- Vite 6.x configuration may differ from earlier versions
- **Asset URLs**: Always use `new URL(path, import.meta.url).href` for Vite asset compatibility
- Use `/asset-test` route to debug asset loading issues
- **CRITICAL**: Always run `npm run lint` after making changes to ensure code quality

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

## Asset Management & Debugging

**Asset Structure:** Heroes (PNG), abilities (WebP), items (PNG/WebP), runes, facets in `public/assets/`

**Asset Helper Functions (`src/utils/assetHelpers.js`):**
```javascript
// ✅ CORRECT: Public asset paths for Vite production builds
const assetPath = `/assets/heroes/icons/${heroName}.png`;

// Functions with fallbacks:
getHeroIcon(heroName, animated) // → default fallback
getAbilityIcon(abilityName)     // → ability_default fallback  
getItemIcon(itemName, format)   // → format fallback → item_default
normalizeHeroName(heroName)     // OpenDota API mapping
```

**Asset Debugging:**
- `/asset-test` route - Visual asset verification with load status
- `DEBUG_ASSETS = true` - Console logging for troubleshooting
- Multi-level fallback system prevents broken images
- Assets properly included in `dist/` folder during build

## Changelog

### v4.6.1 - Production Asset Loading Fix (June 5, 2025)

**Critical Vercel Deployment Resolution:**
- **Asset Location Fix**: Moved assets from `src/assets/` to `public/assets/` for proper Vite build inclusion
- **URL Generation Update**: Changed asset helpers to use public paths (`/assets/...`) instead of relative imports
- **Production Compatibility**: Assets now properly deploy to Vercel and other static hosts
- **Complete Asset Coverage**: All hero icons, abilities, items, runes, and facets working in production
- **Debug System**: Enhanced logging to track asset URL generation in production
- **Fallback System**: Maintained robust fallback mechanism for missing assets

**Technical Details:**
- Root issue: Vite only includes assets that are explicitly imported or in `public/` folder
- Solution: Moved assets to `public/assets/` and updated helper functions to use absolute paths
- Result: Assets properly included in `dist/` build and accessible in production deployments

### v4.5.0 - Complete Match Analysis Module (June 5, 2025)

**Advanced Coaching & Analytics System:**
- **Match Analysis Interface**: Complete 7-tab analysis system with Overview, Performance, Laning Phase, Economy & Items, Combat Intel, Vision & Map Control, and Insights & Coaching
- **Professional Coaching Features**: AI-powered coaching analysis with mistake identification, improvement suggestions, and actionable coaching points
- **Vision Warfare Analysis**: Advanced ward efficiency metrics, coverage calculations, dewarding effectiveness, and map control scoring
- **Performance Grading**: S-D ranking system across all gameplay metrics with benchmark comparisons and personalized grades
- **Combat Intelligence**: Detailed teamfight analysis, positioning evaluation, and damage distribution breakdowns
- **Asset Integration**: Complete Dota 2 visual assets throughout analysis with hero portraits, item icons, and ability displays
- **Professional UI**: Dark gaming theme with responsive design, breadcrumb navigation, and comprehensive statistics display

This release transforms the application into a professional-grade coaching platform that provides Dota 2 players with detailed performance analysis and actionable improvement insights comparable to premium esports analytics platforms.

### v4.4.1 - React Hooks Compliance Fix (June 5, 2025)

**Code Quality Improvements:**
- **React Hooks Rules Compliance**: Fixed all React Hooks violations in MatchAnalysis.jsx component
- **Hook Placement**: Moved all useMemo calls before conditional early returns in component functions
- **Affected Components**: LaningPhaseTab, EconomyResourcesTab, CombatIntelligenceTab, VisionMapControlTab, ImprovementInsightsTab
- **Safety Checks**: Added null/undefined guards within useMemo callbacks to handle missing data gracefully
- **Unused Variables**: Cleaned up all unused variables to improve code quality and linting compliance

This fix ensures proper React Hooks usage patterns, preventing potential runtime errors and maintaining component lifecycle integrity according to React's Rules of Hooks.

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

## Memories

- Remember to run the linter if you've edited any file, to ensure there are no errors before moving on to the next task in the to do.