import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeroPerformanceWidget from '../../components/Dashboard/widgets/HeroPerformanceWidget.jsx';
import DataContext from '../../contexts/DataContext.jsx';

const mockHeroStats = [
  {
    hero_id: 1,
    games: 50,
    win: 30,
    sum_kills: 350,
    sum_deaths: 200,
    sum_assists: 450,
    sum_gold_per_min: 25000,
    sum_xp_per_min: 30000,
    sum_last_hits: 12500
  },
  {
    hero_id: 2,
    games: 30,
    win: 20,
    sum_kills: 180,
    sum_deaths: 150,
    sum_assists: 300,
    sum_gold_per_min: 15000,
    sum_xp_per_min: 18000,
    sum_last_hits: 7500
  },
  {
    hero_id: 3,
    games: 3, // Less than 5 games, should be filtered out
    win: 1,
    sum_kills: 15,
    sum_deaths: 20,
    sum_assists: 10,
    sum_gold_per_min: 1500,
    sum_xp_per_min: 1800,
    sum_last_hits: 750
  }
];

const mockHeroMap = {
  1: { id: 1, localized_name: 'Anti-Mage' },
  2: { id: 2, localized_name: 'Axe' },
  3: { id: 3, localized_name: 'Bane' }
};

const mockDataContext = {
  heroStats: mockHeroStats,
  heroMap: mockHeroMap,
  loading: { heroes: false, matches: false }
};

describe('HeroPerformanceWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    expect(screen.getByText('HERO PERFORMANCE')).toBeInTheDocument();
  });

  it('filters heroes with less than 5 games', async () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    await waitFor(() => {
      // Should show Anti-Mage and Axe but not Bane (only 3 games)
      expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
      expect(screen.getByText('Axe')).toBeInTheDocument();
      expect(screen.queryByText('Bane')).not.toBeInTheDocument();
    });
  });

  it('displays hero statistics correctly', async () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    await waitFor(() => {
      // Check for games played
      expect(screen.getByText('50 games')).toBeInTheDocument();
      expect(screen.getByText('30 games')).toBeInTheDocument();
      
      // Check for win rates
      expect(screen.getByText('60%')).toBeInTheDocument(); // Anti-Mage: 30/50 = 60%
      expect(screen.getByText('67%')).toBeInTheDocument(); // Axe: 20/30 = 66.7% ≈ 67%
    });
  });

  it('allows searching for heroes', async () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    const searchInput = screen.getByPlaceholderText('Search heroes...');
    
    // Search for Anti-Mage
    fireEvent.change(searchInput, { target: { value: 'anti' } });
    
    await waitFor(() => {
      expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
      expect(screen.queryByText('Axe')).not.toBeInTheDocument();
    });
  });

  it('allows sorting by different criteria', async () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    const sortSelect = screen.getByRole('combobox');
    
    // Default should be "Most Played"
    expect(sortSelect).toHaveValue('games');
    
    // Change to win rate sorting
    fireEvent.mouseDown(sortSelect);
    const winRateOption = await screen.findByText('Win Rate');
    fireEvent.click(winRateOption);
    
    // Axe (67%) should now appear before Anti-Mage (60%)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Axe');
    expect(rows[2]).toHaveTextContent('Anti-Mage');
  });

  it('shows loading state when data is loading', () => {
    const loadingContext = {
      ...mockDataContext,
      loading: { heroes: true, matches: true }
    };
    
    render(
      <DataContext.Provider value={loadingContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('shows empty state when no hero data', () => {
    const emptyContext = {
      ...mockDataContext,
      heroStats: []
    };
    
    render(
      <DataContext.Provider value={emptyContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    expect(screen.getByText('No hero data available')).toBeInTheDocument();
  });

  it('displays summary statistics', async () => {
    render(
      <DataContext.Provider value={mockDataContext}>
        <HeroPerformanceWidget />
      </DataContext.Provider>
    );
    
    await waitFor(() => {
      // Total heroes
      expect(screen.getByText('2')).toBeInTheDocument(); // Only 2 heroes with 5+ games
      
      // Most played hero
      expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
      
      // Average win rate
      const avgWinRate = screen.getByText(/\d+\.\d+%/);
      expect(avgWinRate).toBeInTheDocument();
    });
  });
});