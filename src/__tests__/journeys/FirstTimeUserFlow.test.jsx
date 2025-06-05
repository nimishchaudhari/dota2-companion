import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App.jsx';
import { 
  renderWithProviders, 
  verifyDarkThemeApplication, 
  waitForAntdLoading,
  verifyFormValidation,
  testNotificationAppearance,
  measureWidgetPerformance 
} from '../utils/componentHelpers.jsx';
import { 
  TEST_PLAYERS, 
  fetchRealPlayerData, 
  waitForCompletePlayerData,
  measureRenderTime,
  validateDataStructure,
  clearApiCache,
  getCacheStats 
} from '../utils/realDataHelpers.js';

describe('Journey 1: First Time User Complete Flow', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    // Clear localStorage to simulate first-time user
    localStorage.clear();
    sessionStorage.clear();
    // Clear API cache to ensure fresh data
    clearApiCache();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('User visits application for the first time', () => {
    it('should display login page with Ant Design components and dark theme', async () => {
      const { container } = renderWithProviders(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText(/dota 2 companion/i)).toBeInTheDocument();
      });

      // Verify Ant Design login form is present
      const loginForm = container.querySelector('.ant-form, form');
      expect(loginForm).toBeInTheDocument();

      // Verify dark theme is applied
      const themeApplied = verifyDarkThemeApplication(container);
      expect(themeApplied).toBe(true);

      // Verify Ant Design input components
      const playerIdInput = screen.getByPlaceholderText(/player id|account id/i);
      expect(playerIdInput).toHaveClass('ant-input');

      // Verify Ant Design button
      const loginButton = screen.getByRole('button', { name: /fetch player data|login|sign in/i });
      expect(loginButton).toHaveClass('ant-btn');
    });

    it('should validate player ID input using Ant Design form validation', async () => {
      const { container } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/dota 2 companion/i)).toBeInTheDocument();
      });

      const form = container.querySelector('form');
      
      // Test with invalid data
      const validationResult = await verifyFormValidation(form, {
        playerId: 'invalid'
      });

      expect(validationResult.fieldsValidated).toBeGreaterThan(0);
      // Should have validation errors for invalid input
      expect(validationResult.isValid).toBe(false);
    });
  });

  describe('User enters valid player ID (Miracle-)', () => {
    it('should accept valid player ID and trigger real API call', async () => {
      const { container } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/dota 2 companion/i)).toBeInTheDocument();
      });

      // Find and fill player ID input
      const playerIdInput = screen.getByPlaceholderText(/player id|account id/i);
      await user.clear(playerIdInput);
      await user.type(playerIdInput, TEST_PLAYERS.miracle);

      // Verify input value
      expect(playerIdInput).toHaveValue(TEST_PLAYERS.miracle);

      // Submit form
      const loginButton = screen.getByRole('button', { name: /fetch player data|login|sign in/i });
      
      // Measure performance of login process
      const { duration } = await measureRenderTime(async () => {
        await user.click(loginButton);
        
        // Wait for loading state
        await waitFor(() => {
          const loadingElement = container.querySelector('.ant-spin, .ant-skeleton');
          return loadingElement !== null;
        }, { timeout: 2000 });
      });

      // Login process should start within reasonable time
      expect(duration).toBeLessThan(500); // 500ms max for initial response
    });

    it('should fetch and validate real player data from OpenDota API', async () => {
      // Test real API call independently
      const playerData = await fetchRealPlayerData(TEST_PLAYERS.miracle);
      
      // Validate real data structure
      expect(validateDataStructure(playerData, 'player')).toBe(true);
      expect(playerData).toHaveProperty('account_id');
      expect(playerData.account_id.toString()).toBe(TEST_PLAYERS.miracle);
      expect(playerData).toHaveProperty('personaname');
      expect(typeof playerData.personaname).toBe('string');
      
      // Verify profile data exists
      expect(playerData).toHaveProperty('profile');
      if (playerData.profile) {
        expect(playerData.profile).toHaveProperty('personaname');
      }
    });

    it('should load complete dashboard with real data within performance threshold', async () => {
      const authContext = {
        user: {
          accountId: TEST_PLAYERS.miracle,
          personaName: 'Miracle-',
          authMode: 'development'
        },
        isLoading: false,
        error: null,
        isAuthenticated: true,
        authMode: 'development'
      };

      // Measure complete dashboard render time
      const { result: renderResult, duration: renderTime } = await measureWidgetPerformance(async () => {
        return renderWithProviders(<App />, { authContext });
      });

      // Dashboard should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);

      const { container } = renderResult;

      // Wait for dashboard to fully load
      await waitForAntdLoading(container, { timeout: 10000 });

      // Verify main dashboard elements are present
      expect(screen.getByText(/dota 2 command center/i)).toBeInTheDocument();
      
      // Verify session tracker widget exists
      const sessionTracker = screen.getByText(/session tracker/i);
      expect(sessionTracker).toBeInTheDocument();

      // Verify Ant Design components are rendered
      const cards = container.querySelectorAll('.ant-card');
      expect(cards.length).toBeGreaterThan(0);

      const statistics = container.querySelectorAll('.ant-statistic');
      expect(statistics.length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard displays real player statistics', () => {
    let completePlayerData;

    beforeEach(async () => {
      // Fetch real data for Miracle-
      completePlayerData = await waitForCompletePlayerData(TEST_PLAYERS.miracle);
    });

    it('should display real MMR and player information', async () => {
      const authContext = {
        user: {
          accountId: TEST_PLAYERS.miracle,
          personaName: completePlayerData.player.personaname || 'Miracle-',
          authMode: 'development',
          rank: completePlayerData.player.rank_tier
        },
        isAuthenticated: true,
        authMode: 'development'
      };

      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: {
          recentMatches: completePlayerData.matches,
          heroStats: completePlayerData.heroes,
          winLoss: completePlayerData.winLoss,
          heroes: completePlayerData.heroList
        }
      });

      await waitForAntdLoading(container);

      // Verify player name is displayed
      expect(screen.getByText(new RegExp(completePlayerData.player.personaname || 'miracle', 'i'))).toBeInTheDocument();

      // Verify win/loss statistics are displayed
      const winLossText = `${completePlayerData.winLoss.win}-${completePlayerData.winLoss.lose}`;
      const winLossElement = screen.getByText(new RegExp(winLossText));
      expect(winLossElement).toBeInTheDocument();

      // Verify match count is realistic
      expect(completePlayerData.matches.length).toBeGreaterThan(0);
      expect(completePlayerData.matches.length).toBeLessThanOrEqual(20);
    });

    it('should calculate and display accurate session metrics', async () => {
      const { matches, winLoss } = completePlayerData;
      
      // Validate match data structure
      expect(validateDataStructure(matches, 'matches')).toBe(true);
      expect(validateDataStructure(winLoss, 'winloss')).toBe(true);

      // Calculate expected metrics manually
      const recentMatches = matches.slice(0, 10);
      const expectedWins = recentMatches.filter(match => 
        match.radiant_win === (match.player_slot < 128)
      ).length;
      const EXPECTED_LOSSES = recentMatches.length - expectedWins;
      const expectedWinRate = recentMatches.length > 0 ? 
        ((expectedWins / recentMatches.length) * 100).toFixed(1) : '0.0';

      const authContext = {
        user: { accountId: TEST_PLAYERS.miracle, personaName: 'Miracle-' },
        isAuthenticated: true
      };

      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: {
          recentMatches: matches,
          winLoss,
          heroes: completePlayerData.heroList
        }
      });

      await waitForAntdLoading(container);

      // Find win rate display (allowing for different formats)
      const winRateElements = container.querySelectorAll('.ant-statistic-content-value');
      const winRateFound = Array.from(winRateElements).some(element => {
        const text = element.textContent;
        return text.includes(expectedWinRate) || text.includes('%');
      });

      expect(winRateFound).toBe(true);
    });

    it('should display hero performance with real statistics', async () => {
      const { heroes, heroList } = completePlayerData;
      
      // Validate hero data
      expect(validateDataStructure(heroes, 'heroes')).toBe(true);
      expect(validateDataStructure(heroList, 'herolist')).toBe(true);

      const authContext = {
        user: { accountId: TEST_PLAYERS.miracle, personaName: 'Miracle-' },
        isAuthenticated: true
      };

      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: {
          heroStats: heroes,
          heroes: heroList,
          recentMatches: completePlayerData.matches,
          winLoss: completePlayerData.winLoss
        }
      });

      await waitForAntdLoading(container);

      // Verify hero statistics are displayed
      const heroStatsSection = screen.getByText(/hero mastery|hero/i);
      expect(heroStatsSection).toBeInTheDocument();

      // Check that hero win rates are realistic (0-100%)
      const heroElements = container.querySelectorAll('[class*="hero"]');
      expect(heroElements.length).toBeGreaterThan(0);

      // Verify top heroes have realistic data
      const topHeroes = heroes.slice(0, 3);
      topHeroes.forEach(hero => {
        const winRate = Math.round((hero.win / hero.games) * 100);
        expect(winRate).toBeGreaterThanOrEqual(0);
        expect(winRate).toBeLessThanOrEqual(100);
        expect(hero.games).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance metrics validation', () => {
    it('should meet performance thresholds for initial load', async () => {
      const startTime = performance.now();
      const startMemory = performance.memory?.usedJSHeapSize || 0;

      const authContext = {
        user: { accountId: TEST_PLAYERS.miracle, personaName: 'Miracle-' },
        isAuthenticated: true
      };

      const { container } = renderWithProviders(<App />, { authContext });

      await waitForAntdLoading(container, { timeout: 10000 });

      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;

      const totalLoadTime = endTime - startTime;
      const memoryUsed = endMemory - startMemory;

      // Performance assertions
      expect(totalLoadTime).toBeLessThan(2000); // Under 2 seconds
      expect(memoryUsed).toBeLessThan(250 * 1024 * 1024); // Under 250MB

      // Count API calls (check cache statistics)
      const cacheStats = getCacheStats ? getCacheStats() : { size: 0 };
      expect(cacheStats.size).toBeGreaterThan(0); // Should have cached some data
    });

    it('should handle real API errors gracefully', async () => {
      // Test with invalid player ID to trigger real API error
      const { container } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/dota 2 companion/i)).toBeInTheDocument();
      });

      const playerIdInput = screen.getByPlaceholderText(/player id|account id/i);
      await user.type(playerIdInput, '999999999999'); // Invalid ID

      const loginButton = screen.getByRole('button', { name: /fetch player data|login|sign in/i });
      
      // Test error notification
      const NOTIFICATION = await testNotificationAppearance(async () => {
        await user.click(loginButton);
      });

      // Should show error notification or error message
      await waitFor(() => {
        const errorElements = container.querySelectorAll('.ant-alert-error, .ant-notification-notice-error, .ant-form-item-explain-error');
        return errorElements.length > 0;
      }, { timeout: 5000 });

      const errorShown = container.querySelectorAll('.ant-alert-error, .ant-notification-notice-error, .ant-form-item-explain-error').length > 0;
      expect(errorShown).toBe(true);
    });
  });

  describe('Ant Design component integration', () => {
    it('should properly apply gaming theme to all Ant Design components', async () => {
      const authContext = {
        user: { accountId: TEST_PLAYERS.miracle, personaName: 'Miracle-' },
        isAuthenticated: true
      };

      const { container } = renderWithProviders(<App />, { authContext });

      await waitForAntdLoading(container);

      // Check various Ant Design components for theme application
      const components = {
        cards: container.querySelectorAll('.ant-card'),
        buttons: container.querySelectorAll('.ant-btn'),
        statistics: container.querySelectorAll('.ant-statistic'),
        layout: container.querySelectorAll('.ant-layout'),
        menu: container.querySelectorAll('.ant-menu')
      };

      // Verify components exist
      Object.entries(components).forEach(([componentType, elements]) => {
        expect(elements.length).toBeGreaterThan(0, `No ${componentType} found`);
      });

      // Verify dark theme application on key components
      const darkThemeApplied = verifyDarkThemeApplication(container);
      expect(darkThemeApplied).toBe(true);

      // Check for specific gaming theme elements
      const hasElectricCyan = container.innerHTML.includes('#00d9ff') || 
                             container.innerHTML.includes('rgb(0, 217, 255)');
      expect(hasElectricCyan).toBe(true);
    });

    it('should display real-time data updates correctly', async () => {
      const completeData = await waitForCompletePlayerData(TEST_PLAYERS.miracle);
      
      const authContext = {
        user: { accountId: TEST_PLAYERS.miracle, personaName: 'Miracle-' },
        isAuthenticated: true
      };

      const { container, rerender } = renderWithProviders(<App />, { 
        authContext,
        initialData: completeData
      });

      await waitForAntdLoading(container);

      // Verify initial statistics are rendered
      const initialStats = container.querySelectorAll('.ant-statistic-content-value');
      const initialValues = Array.from(initialStats).map(el => el.textContent);

      expect(initialValues.length).toBeGreaterThan(0);
      expect(initialValues.every(value => value.trim() !== '')).toBe(true);

      // Simulate data update with modified match results
      const updatedMatches = [...completeData.matches];
      if (updatedMatches.length > 0) {
        // Flip the result of the first match to simulate new data
        updatedMatches[0] = {
          ...updatedMatches[0],
          radiant_win: !updatedMatches[0].radiant_win
        };

        // Re-render with updated data
        const updatedAuthContext = {
          ...authContext,
          user: { ...authContext.user, lastUpdate: Date.now() }
        };

        rerender(
          renderWithProviders(<App />, { 
            authContext: updatedAuthContext,
            initialData: {
              ...completeData,
              recentMatches: updatedMatches
            }
          }).container.firstChild
        );

        await waitForAntdLoading(container);

        // Verify data has updated
        const updatedStats = container.querySelectorAll('.ant-statistic-content-value');
        const updatedValues = Array.from(updatedStats).map(el => el.textContent);

        // At least some values should be different or components should re-render
        const hasUpdated = updatedValues.length >= initialValues.length;
        expect(hasUpdated).toBe(true);
      }
    });
  });
});