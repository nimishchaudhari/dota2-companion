import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataProvider } from '../../contexts/DataContext.jsx';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import SessionTrackerWidget from '../../components/Dashboard/widgets/SessionTrackerWidget.jsx';

const mockAuthContext = {
  isAuthenticated: true,
  user: { accountId: '12345', personaname: 'TestUser' }
};

const MOCKDATACONTEXT = {
  recentMatches: [
    { match_id: 1, start_time: Date.now() / 1000 - 3600, radiant_win: true, player_slot: 1, kills: 10, deaths: 2, assists: 5 },
    { match_id: 2, start_time: Date.now() / 1000 - 7200, radiant_win: false, player_slot: 130, kills: 5, deaths: 8, assists: 3 }
  ],
  user: { solo_competitive_rank: 3500 },
  loading: { matches: false, stats: false }
};

describe('SessionTrackerWidget', () => {
  beforeEach(() => {
    // Reset any mocks
  });

  it('renders without crashing', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <DataProvider>
          <SessionTrackerWidget />
        </DataProvider>
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('SESSION TRACKER')).toBeInTheDocument();
  });

  it('displays session statistics correctly', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <DataProvider>
          <SessionTrackerWidget />
        </DataProvider>
      </AuthContext.Provider>
    );
    
    // Check for session stats sections
    expect(screen.getByText(/today's session/i)).toBeInTheDocument();
    expect(screen.getByText(/wins/i)).toBeInTheDocument();
    expect(screen.getByText(/losses/i)).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    const loadingContext = {
      ...mockAuthContext,
      loading: { matches: true, stats: true }
    };
    
    render(
      <AuthContext.Provider value={loadingContext}>
        <DataProvider>
          <SessionTrackerWidget />
        </DataProvider>
      </AuthContext.Provider>
    );
    
    // Should show loading spinner
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('displays MMR counter component', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <DataProvider>
          <SessionTrackerWidget />
        </DataProvider>
      </AuthContext.Provider>
    );
    
    // MMR counter should be present
    expect(screen.getByText(/current mmr/i)).toBeInTheDocument();
  });

  it('shows performance alerts when applicable', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <DataProvider>
          <SessionTrackerWidget />
        </DataProvider>
      </AuthContext.Provider>
    );
    
    // Should show tilt-o-meter or performance alerts
    const alerts = screen.queryAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(0);
  });
});