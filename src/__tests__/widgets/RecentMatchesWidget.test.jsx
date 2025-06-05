import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RecentMatchesWidget from '../../components/Dashboard/widgets/RecentMatchesWidget.jsx';
import DataContext from '../../contexts/DataContext.jsx';

const mockMatches = [
  {
    match_id: 1,
    start_time: Date.now() / 1000 - 3600,
    radiant_win: true,
    player_slot: 1,
    hero_id: 1,
    kills: 10,
    deaths: 2,
    assists: 5,
    duration: 2400,
    gold_per_min: 650,
    xp_per_min: 750
  },
  {
    match_id: 2,
    start_time: Date.now() / 1000 - 7200,
    radiant_win: false,
    player_slot: 130,
    hero_id: 2,
    kills: 5,
    deaths: 8,
    assists: 3,
    duration: 1800,
    gold_per_min: 450,
    xp_per_min: 550
  }
];

const mockHeroes = [
  { id: 1, localized_name: 'Anti-Mage' },
  { id: 2, localized_name: 'Axe' }
];

const mockDataContext = {
  recentMatches: mockMatches,
  heroes: mockHeroes,
  loading: { matches: false }
};

describe('RecentMatchesWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <RecentMatchesWidget />
      </DataContext.Provider>
    );
    
    expect(screen.getByText('RECENT MATCHES')).toBeInTheDocument();
  });

  it('displays match history correctly', async () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <RecentMatchesWidget />
      </DataContext.Provider>
    );
    
    await waitFor(() => {
      // Check for hero names
      expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
      expect(screen.getByText('Axe')).toBeInTheDocument();
      
      // Check for win/loss indicators
      expect(screen.getByText('Victory')).toBeInTheDocument();
      expect(screen.getByText('Defeat')).toBeInTheDocument();
    });
  });

  it('calculates and displays win rate', () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <RecentMatchesWidget />
      </DataContext.Provider>
    );
    
    // Should show 1W 1L (50% win rate)
    expect(screen.getByText('1W')).toBeInTheDocument();
    expect(screen.getByText('1L')).toBeInTheDocument();
    expect(screen.getByText('50.0% WR')).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    const loadingContext = {
      ...mockDataContext,
      loading: { matches: true }
    };
    
    render(
      <DataContext.Provider value={loadingContext}>
        <RecentMatchesWidget />
      </DataContext.Provider>
    );
    
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('shows empty state when no matches', () => {
    const emptyContext = {
      ...mockDataContext,
      recentMatches: []
    };
    
    render(
      <DataContext.Provider value={emptyContext}>
        <RecentMatchesWidget />
      </DataContext.Provider>
    );
    
    expect(screen.getByText('No recent matches found')).toBeInTheDocument();
  });

  it('displays match statistics correctly', async () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <RecentMatchesWidget />
      </DataContext.Provider>
    );
    
    await waitFor(() => {
      // Check for KDA display
      expect(screen.getByText('10/2/5')).toBeInTheDocument();
      expect(screen.getByText('5/8/3')).toBeInTheDocument();
      
      // Check for GPM/XPM
      expect(screen.getByText('650')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });

  it('formats time ago correctly', () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <RecentMatchesWidget />
      </DataContext.Provider>
    );
    
    // Should show relative time
    expect(screen.getByText(/hours? ago/)).toBeInTheDocument();
  });
});