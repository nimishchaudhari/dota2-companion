# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-page React application for a Dota 2 companion app with animated UI, player statistics dashboard, and mock gaming data visualization. Built as a prototype/mockup with no backend integration.

## Mission Statement

- The community deserves to resonate with claude's supremacist coding skills and be blessed with a esports grade game companion app

## Architecture Overview

**Single-file component architecture**: All components (LoginPage, Navigation, PlayerDashboard, AnimatedNumber) are defined in `src/App.jsx` as a monolithic structure. State management is handled through React hooks with no external state management library.

**Animation-first design**: Uses Framer Motion variants (`pageTransition`, `cardAnimation`, `staggerContainer`) defined at module level for consistent animation patterns across components.

**Mock data pattern**: Static data arrays embedded within components (e.g., `mmrData`, `recentMatches`, `signatureHeroes`) simulate real API responses.

## Development Commands

- `npm run dev` - Development server (http://localhost:5173/)
- `npm run build` - Production build (outputs to `dist/`)
- `npm run lint` - ESLint validation
- `npm run preview` - Preview production build locally

## Key Technical Considerations

**Tailwind CSS 4.x setup**: Uses `@tailwindcss/postcss` plugin (not the legacy `tailwindcss` PostCSS plugin). Configuration in `postcss.config.js` must use the new plugin format.

**ESLint configuration**: Custom rules in `eslint.config.js` allow unused variables starting with uppercase letters (`varsIgnorePattern: '^[A-Z_]'`). The `motion` import requires an eslint-disable comment due to JSX usage patterns.

**Component structure**: Navigation uses conditional rendering for mobile/desktop layouts. Page routing is handled via `currentPage` state with switch statement in `renderPage()`.

**Animation patterns**: 
- Page transitions use consistent `pageTransition` variants
- Cards use `cardAnimation` with hover states
- Lists use `staggerContainer` for sequential animation timing

## Data Flow Patterns

**Login state**: `isLoggedIn` boolean controls LoginPage vs main app rendering. Login is mock - just sets state to true.

**Page routing**: `currentPage` state + `renderPage()` switch statement. Only 'dashboard' shows real content; others show placeholder divs.

**Animation integration**: AnimatePresence wraps page content with `mode="wait"` for exit/enter transitions. Individual components use Framer Motion `variants` props.

**Chart integration**: Recharts components embedded directly in dashboard with inline gradient definitions (`<defs><linearGradient>`).

## Styling Architecture

**Dark theme constants**: No CSS variables - colors hardcoded in Tailwind classes (gray-900, gray-800, cyan-400, etc.).

**Responsive breakpoints**: Desktop navigation hidden on mobile (`md:hidden`), mobile navigation shown below medium breakpoint.

**Animation performance**: Uses `requestAnimationFrame` for smooth number counting in AnimatedNumber component.

## Build Considerations

**Bundle size**: Large bundle (700kb+) due to Recharts and Framer Motion - normal for this prototype. Build shows chunk size warnings.

**PostCSS integration**: Requires `@tailwindcss/postcss` in `postcss.config.js` - different from Tailwind v3.x setup.

**ES modules**: Uses `"type": "module"` in package.json - all config files use ES import/export syntax.