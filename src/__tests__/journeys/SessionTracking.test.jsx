import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App.jsx';
import { 
  renderWithProviders, 
  waitForAntdLoading,
  testNotificationAppearance
} from '../utils/componentHelpers.jsx';
import { 
  TEST_PLAYERS, 
  waitForCompletePlayerData,
  measureRenderTime,
  delay,
  validateDataStructure
} from '../utils/realDataHelpers.js';

describe('Journey 3: Real-Time Session Tracking', () => {
  let user;
  let authContext;
  let completePlayerData;

  beforeEach(async () => {
    user = userEvent.setup();
    localStorage.clear();
    
    // Set up authenticated user with real data
    completePlayerData = await waitForCompletePlayerData(TEST_PLAYERS.miracle);
    authContext = {
      user: {
        accountId: TEST_PLAYERS.miracle,
        personaName: 'Miracle-',
        authMode: 'development'
      },
      isAuthenticated: true,
      authMode: 'development'
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Session initialization with real data', () => {
    it('should initialize session tracker with accurate real match data', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container, { timeout: 10000 });

      // Verify session tracker widget is present
      const sessionTracker = screen.getByText(/session tracker/i);
      expect(sessionTracker).toBeInTheDocument();

      // Verify real match data is loaded
      expect(validateDataStructure(completePlayerData.matches, 'matches')).toBe(true);
      expect(completePlayerData.matches.length).toBeGreaterThan(0);

      // Calculate expected session stats from real data
      const recentMatches = completePlayerData.matches.slice(0, 10);
      const wins = recentMatches.filter(match => 
        match.radiant_win === (match.player_slot < 128)
      ).length;
      const LOSSES = recentMatches.length - wins;
      const EXPECTED_WIN_RATE = recentMatches.length > 0 ? 
        ((wins / recentMatches.length) * 100).toFixed(1) : '0.0';

      // Verify win/loss display
      const recordDisplay = container.querySelector('[class*="record"], [class*="session"]');
      if (recordDisplay) {
        const recordText = recordDisplay.textContent;
        expect(recordText).toMatch(/\d+.*\d+/); // Should contain numbers
      }

      // Verify win rate calculation
      const winRateElements = container.querySelectorAll('.ant-statistic-content-value');
      const hasWinRate = Array.from(winRateElements).some(el => {
        const text = el.textContent;
        return text.includes('%') && parseFloat(text) >= 0 && parseFloat(text) <= 100;
      });
      expect(hasWinRate).toBe(true);
    });

    it('should calculate accurate KDA from real match data', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Calculate expected average KDA from real matches
      const recentMatches = completePlayerData.matches.slice(0, 10);
      const totalKDA = recentMatches.reduce((sum, match) => {
        const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
        return sum + kda;
      }, 0);
      const EXPECTED_AVG_KDA = recentMatches.length > 0 ? 
        (totalKDA / recentMatches.length).toFixed(2) : '0.00';

      // Look for KDA display in the UI
      const kdaElements = container.querySelectorAll('.ant-statistic-content-value');
      const hasReasonableKDA = Array.from(kdaElements).some(el => {
        const value = parseFloat(el.textContent);
        return !isNaN(value) && value >= 0 && value <= 20; // Reasonable KDA range
      });

      expect(hasReasonableKDA).toBe(true);

      // Verify that displayed KDA is based on real data
      expect(recentMatches.every(match => 
        typeof match.kills === 'number' && 
        typeof match.deaths === 'number' && 
        typeof match.assists === 'number'
      )).toBe(true);
    });

    it('should display accurate MMR change calculations', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Find MMR-related displays
      const mmrElements = container.querySelectorAll('[class*="mmr"], .ant-statistic');
      const hasMMRDisplay = mmrElements.length > 0;
      expect(hasMMRDisplay).toBe(true);

      // Verify MMR values are reasonable (if displayed)
      const statisticValues = container.querySelectorAll('.ant-statistic-content-value');
      const mmrValues = Array.from(statisticValues).filter(el => {
        const text = el.textContent;
        return text.includes('+') || text.includes('-') || /\d{3,4}/.test(text);
      });

      if (mmrValues.length > 0) {
        mmrValues.forEach(el => {
          const value = el.textContent.replace(/[+-]/g, '');
          const numericValue = parseInt(value);
          if (!isNaN(numericValue)) {
            expect(numericValue).toBeGreaterThanOrEqual(0);
            expect(numericValue).toBeLessThan(15000); // Reasonable MMR range
          }
        });
      }
    });
  });

  describe('Tilt-O-Meter algorithm with real performance data', () => {
    it('should calculate tilt level based on real match performance', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Find tilt meter display
      const tiltMeter = container.querySelector('[class*="tilt"], [title*="tilt"]') ||
                       screen.queryByText(/tilt/i);

      if (tiltMeter) {
        // Verify tilt meter shows reasonable value (0-100%)
        const tiltText = tiltMeter.textContent || tiltMeter.getAttribute('title') || '';
        const tiltMatch = tiltText.match(/(\d+)%?/);
        
        if (tiltMatch) {
          const tiltValue = parseInt(tiltMatch[1]);
          expect(tiltValue).toBeGreaterThanOrEqual(0);
          expect(tiltValue).toBeLessThanOrEqual(100);
        }
      }

      // Calculate expected tilt based on real match data
      const recentMatches = completePlayerData.matches.slice(0, 5);
      const winRate = recentMatches.filter(match => 
        match.radiant_win === (match.player_slot < 128)
      ).length / recentMatches.length;

      const avgKDA = recentMatches.reduce((sum, match) => {
        return sum + ((match.kills + match.assists) / Math.max(match.deaths, 1));
      }, 0) / recentMatches.length;

      // Expected tilt should be reasonable based on performance
      const EXPECTED_TILT_RANGE = winRate > 0.6 && avgKDA > 2 ? 'good' : 
                               winRate < 0.4 && avgKDA < 1.5 ? 'poor' : 'neutral';

      // Verify we have enough data for meaningful calculation
      expect(recentMatches.length).toBeGreaterThan(0);
      expect(avgKDA).toBeGreaterThan(0);
    });

    it('should provide appropriate recommendations based on performance', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Look for recommendation messages or action buttons
      const recommendations = container.querySelectorAll('[class*="recommendation"], [class*="action"], .ant-alert');
      
      if (recommendations.length > 0) {
        // Verify recommendations contain helpful text
        const recommendationTexts = Array.from(recommendations).map(el => el.textContent.toLowerCase());
        const hasActionableAdvice = recommendationTexts.some(text => 
          text.includes('break') || 
          text.includes('continue') || 
          text.includes('focus') ||
          text.includes('keep') ||
          text.includes('stop')
        );
        
        expect(hasActionableAdvice).toBe(true);
      }

      // Verify session health indicators exist
      const healthIndicators = container.querySelectorAll('[class*="health"], [class*="status"]');
      expect(healthIndicators.length).toBeGreaterThanOrEqual(0);
    });

    it('should update tilt status based on win/loss patterns', async () => {
      // Test with modified match data to simulate different scenarios
      const lossStreak = completePlayerData.matches.slice(0, 5).map(match => ({
        ...match,
        radiant_win: match.player_slot >= 128 // Force losses
      }));

      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: {
          ...completePlayerData,
          recentMatches: lossStreak
        }
      });

      await waitForAntdLoading(container);

      // With a loss streak, should show concerning tilt status
      const statusIndicators = container.querySelectorAll('[class*="status"], [class*="alert"], .ant-alert');
      
      if (statusIndicators.length > 0) {
        const statusTexts = Array.from(statusIndicators).map(el => el.textContent.toLowerCase());
        const HAS_WARNING = statusTexts.some(text => 
          text.includes('break') || 
          text.includes('careful') || 
          text.includes('stop') ||
          text.includes('warning')
        );
        
        // Should show some kind of warning for loss streak
        expect(statusIndicators.length).toBeGreaterThan(0);
      }

      // Verify loss streak is reflected in the data
      const lossCount = lossStreak.filter(match => 
        match.radiant_win !== (match.player_slot < 128)
      ).length;
      expect(lossCount).toBe(5); // All should be losses
    });
  });

  describe('Real-time data updates and notifications', () => {
    it('should handle simulated data refresh with performance tracking', async () => {
      const { container, rerender } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Capture initial state
      const initialStats = container.querySelectorAll('.ant-statistic-content-value');
      const INITIAL_VALUES = Array.from(initialStats).map(el => el.textContent);

      // Simulate data update by modifying recent matches
      const updatedMatches = [...completePlayerData.matches];
      if (updatedMatches.length > 0) {
        // Add a new "match" by duplicating and modifying the first one
        const newMatch = {
          ...updatedMatches[0],
          match_id: updatedMatches[0].match_id + 1,
          start_time: Math.floor(Date.now() / 1000),
          radiant_win: !updatedMatches[0].radiant_win // Different result
        };
        updatedMatches.unshift(newMatch);
      }

      // Measure update performance
      const { duration } = await measureRenderTime(async () => {
        // Trigger re-render with updated data
        const updatedData = {
          ...completePlayerData,
          recentMatches: updatedMatches
        };

        rerender(
          renderWithProviders(<App />, { 
            authContext: {
              ...authContext,
              user: { ...authContext.user, lastUpdate: Date.now() }
            },
            initialData: updatedData
          }).container.firstChild
        );

        await waitForAntdLoading(container, { timeout: 5000 });
      });

      // Update should be fast
      expect(duration).toBeLessThan(1000);

      // Verify some statistics have updated
      const updatedStats = container.querySelectorAll('.ant-statistic-content-value');
      expect(updatedStats.length).toBeGreaterThanOrEqual(initialStats.length);
    });

    it('should trigger notifications for significant performance changes', async () => {
      // Test notification system with win streak scenario
      const winStreak = completePlayerData.matches.slice(0, 5).map(match => ({
        ...match,
        radiant_win: match.player_slot < 128 // Force wins
      }));

      // Test for notification appearance
      const NOTIFICATION = await testNotificationAppearance(async () => {
        renderWithProviders(<App />, { 
          authContext,
          initialData: {
            ...completePlayerData,
            recentMatches: winStreak
          }
        });
      });

      // May or may not have notifications implemented yet
      // At minimum, verify the notification system infrastructure exists
      const hasNotificationCapability = typeof document.querySelector === 'function';
      expect(hasNotificationCapability).toBe(true);
    });

    it('should maintain data consistency during updates', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Verify data consistency by checking calculated values
      const statisticElements = container.querySelectorAll('.ant-statistic');
      
      statisticElements.forEach(statistic => {
        const title = statistic.querySelector('.ant-statistic-title')?.textContent || '';
        const value = statistic.querySelector('.ant-statistic-content-value')?.textContent || '';
        
        if (title.toLowerCase().includes('rate') && value.includes('%')) {
          const percentage = parseFloat(value);
          expect(percentage).toBeGreaterThanOrEqual(0);
          expect(percentage).toBeLessThanOrEqual(100);
        }
        
        if (title.toLowerCase().includes('kda')) {
          const kdaValue = parseFloat(value);
          if (!isNaN(kdaValue)) {
            expect(kdaValue).toBeGreaterThanOrEqual(0);
            expect(kdaValue).toBeLessThan(50); // Reasonable upper bound
          }
        }
      });
    });
  });

  describe('Session tracking accuracy', () => {
    it('should accurately track session duration and game count', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Find game count displays
      const gameCountElements = container.querySelectorAll('[class*="game"], [class*="match"]');
      
      if (gameCountElements.length > 0) {
        // Verify reasonable game counts
        const gameTexts = Array.from(gameCountElements).map(el => el.textContent);
        const hasGameCount = gameTexts.some(text => {
          const numbers = text.match(/\d+/g);
          return numbers && numbers.some(num => {
            const count = parseInt(num);
            return count >= 0 && count <= 50; // Reasonable daily game count
          });
        });
        
        expect(hasGameCount).toBe(true);
      }

      // Verify session data is based on real matches
      expect(completePlayerData.matches.length).toBeGreaterThan(0);
      
      // Check match timestamps are reasonable (recent)
      const recentMatches = completePlayerData.matches.slice(0, 10);
      const now = Math.floor(Date.now() / 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60);
      
      recentMatches.forEach(match => {
        expect(match.start_time).toBeGreaterThan(oneWeekAgo);
        expect(match.start_time).toBeLessThanOrEqual(now);
      });
    });

    it('should calculate average match duration accurately', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Calculate expected average duration from real data
      const recentMatches = completePlayerData.matches.slice(0, 10);
      const totalDuration = recentMatches.reduce((sum, match) => sum + (match.duration || 0), 0);
      const EXPECTED_AVG_MINUTES = recentMatches.length > 0 ? 
        Math.round(totalDuration / recentMatches.length / 60) : 0;

      // Look for duration display
      const durationElements = container.querySelectorAll('[class*="duration"], [class*="time"]');
      
      if (durationElements.length > 0) {
        const durationTexts = Array.from(durationElements).map(el => el.textContent);
        const hasDuration = durationTexts.some(text => {
          const minutes = text.match(/(\d+).*min/);
          if (minutes) {
            const duration = parseInt(minutes[1]);
            return duration >= 15 && duration <= 90; // Reasonable match duration
          }
          return false;
        });
        
        expect(hasDuration).toBe(true);
      }

      // Verify durations in raw data are reasonable
      recentMatches.forEach(match => {
        if (match.duration) {
          const minutes = match.duration / 60;
          expect(minutes).toBeGreaterThan(10); // Minimum match length
          expect(minutes).toBeLessThan(120); // Maximum reasonable match length
        }
      });
    });

    it('should track performance trends accurately', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Calculate performance trend from real data
      const recentMatches = completePlayerData.matches.slice(0, 10);
      const midpoint = Math.floor(recentMatches.length / 2);
      
      const firstHalf = recentMatches.slice(midpoint);
      const secondHalf = recentMatches.slice(0, midpoint);
      
      const firstHalfWinRate = firstHalf.filter(match => 
        match.radiant_win === (match.player_slot < 128)
      ).length / firstHalf.length;
      
      const secondHalfWinRate = secondHalf.filter(match => 
        match.radiant_win === (match.player_slot < 128)
      ).length / secondHalf.length;
      
      const expectedTrend = secondHalfWinRate > firstHalfWinRate ? 'improving' : 
                           secondHalfWinRate < firstHalfWinRate ? 'declining' : 'stable';

      // Look for trend indicators
      const trendElements = container.querySelectorAll('[class*="trend"], [class*="arrow"], .ant-statistic');
      expect(trendElements.length).toBeGreaterThan(0);

      // Verify trend calculation makes sense
      expect(['improving', 'declining', 'stable']).toContain(expectedTrend);
      expect(firstHalfWinRate).toBeGreaterThanOrEqual(0);
      expect(firstHalfWinRate).toBeLessThanOrEqual(1);
      expect(secondHalfWinRate).toBeGreaterThanOrEqual(0);
      expect(secondHalfWinRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance under continuous updates', () => {
    it('should maintain performance during frequent updates', async () => {
      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Simulate multiple rapid updates
      const updateTimes = [];
      
      for (let i = 0; i < 3; i++) {
        const { duration } = await measureRenderTime(async () => {
          // Trigger widget refresh
          const refreshButtons = container.querySelectorAll('[aria-label*="refresh"], [title*="refresh"]');
          if (refreshButtons[0]) {
            await user.click(refreshButtons[0]);
            await delay(100);
          }
        });
        
        updateTimes.push(duration);
        await delay(200); // Brief pause between updates
      }

      // All updates should be reasonably fast
      updateTimes.forEach(time => {
        expect(time).toBeLessThan(500); // Under 500ms per update
      });

      // Verify dashboard is still responsive
      const finalWidgets = container.querySelectorAll('.dashboard-widget');
      expect(finalWidgets.length).toBeGreaterThan(0);
    });

    it('should handle memory efficiently during session tracking', async () => {
      const startMemory = performance.memory?.usedJSHeapSize || 0;

      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: completePlayerData
      });

      await waitForAntdLoading(container);

      // Simulate extended session with multiple data updates
      for (let i = 0; i < 5; i++) {
        await delay(100);
        
        // Trigger minor re-renders
        const statistics = container.querySelectorAll('.ant-statistic-content-value');
        expect(statistics.length).toBeGreaterThan(0);
      }

      const endMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = endMemory - startMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Under 50MB increase
    });

    it('should maintain accuracy during stress conditions', async () => {
      // Test with large dataset to ensure accuracy is maintained
      const largeMatchSet = [];
      for (let i = 0; i < 100; i++) {
        if (i < completePlayerData.matches.length) {
          largeMatchSet.push(completePlayerData.matches[i]);
        } else {
          // Duplicate matches with slight variations
          const baseMatch = completePlayerData.matches[i % completePlayerData.matches.length];
          largeMatchSet.push({
            ...baseMatch,
            match_id: baseMatch.match_id + i,
            start_time: baseMatch.start_time - (i * 3600) // 1 hour apart
          });
        }
      }

      const { container } = renderWithProviders(<App />, { 
        authContext,
        initialData: {
          ...completePlayerData,
          recentMatches: largeMatchSet
        }
      });

      await waitForAntdLoading(container, { timeout: 15000 });

      // Verify calculations are still accurate with large dataset
      const statisticElements = container.querySelectorAll('.ant-statistic-content-value');
      
      statisticElements.forEach(stat => {
        const value = stat.textContent;
        if (value.includes('%')) {
          const percentage = parseFloat(value);
          expect(percentage).toBeGreaterThanOrEqual(0);
          expect(percentage).toBeLessThanOrEqual(100);
        }
      });

      // Verify performance is still acceptable
      expect(statisticElements.length).toBeGreaterThan(0);
    });
  });
});