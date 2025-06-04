// Authentication Service for Steam and OpenDota API integration

class AuthService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_OPENDOTA_API_URL || 'https://api.opendota.com/api';
    this.steamApiUrl = import.meta.env.VITE_STEAM_API_URL || 'https://api.steampowered.com';
    this.cache = new Map();
    this.cacheTTL = parseInt(import.meta.env.VITE_CACHE_TTL) || 300000; // 5 minutes default
  }

  // Utility: Convert Steam ID to Account ID
  convertSteamIdToAccountId(steamId) {
    const steamId64 = BigInt(steamId);
    const accountId = steamId64 - BigInt('76561197960265728');
    return accountId.toString();
  }

  // Utility: Convert Account ID to Steam ID
  convertAccountIdToSteamId(accountId) {
    const accountIdBig = BigInt(accountId);
    const steamId64 = accountIdBig + BigInt('76561197960265728');
    return steamId64.toString();
  }

  // Cache management
  setCacheItem(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCacheItem(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // Development Mode: Login with Player ID
  async loginWithPlayerId(playerId) {
    try {
      // Validate player ID format (should be numeric)
      if (!/^\d+$/.test(playerId)) {
        throw new Error('Invalid player ID format. Please enter a numeric Dota 2 Account ID.');
      }

      const accountId = playerId;
      
      // Check cache first
      const cacheKey = `player_${accountId}`;
      const cachedData = this.getCacheItem(cacheKey);
      if (cachedData) {
        return {
          ...cachedData,
          fromCache: true,
          lastSync: new Date(this.cache.get(cacheKey).timestamp)
        };
      }

      // Fetch data from OpenDota API
      const [profile, winLoss, recentMatches, heroes] = await Promise.allSettled([
        this.fetchOpenDotaProfile(accountId),
        this.fetchWinLoss(accountId),
        this.fetchRecentMatches(accountId),
        this.fetchHeroStats(accountId)
      ]);

      // Handle failed requests gracefully
      const profileData = profile.status === 'fulfilled' ? profile.value : null;
      const wlData = winLoss.status === 'fulfilled' ? winLoss.value : { win: 0, lose: 0 };
      const matchesData = recentMatches.status === 'fulfilled' ? recentMatches.value : [];
      const heroesData = heroes.status === 'fulfilled' ? heroes.value : [];

      if (!profileData) {
        throw new Error('Player not found or profile is private. Please try a different Account ID.');
      }

      // Create comprehensive user data
      const userData = {
        // Steam-like data structure
        steamId: this.convertAccountIdToSteamId(accountId),
        personaName: profileData.personaname || profileData.name || `Player ${accountId}`,
        avatar: profileData.avatar || profileData.avatarfull || '/default-avatar.png',
        avatarMedium: profileData.avatarmedium || profileData.avatarfull || '/default-avatar.png',
        avatarFull: profileData.avatarfull || '/default-avatar.png',
        profileUrl: profileData.profileurl || `https://www.dotabuff.com/players/${accountId}`,
        
        // Dota-specific data
        accountId: accountId,
        rank: profileData.rank_tier ? {
          tier: profileData.rank_tier,
          leaderboard: profileData.leaderboard_rank || null
        } : null,
        mmr: {
          solo: profileData.solo_competitive_rank || null,
          party: profileData.competitive_rank || null,
          estimate: profileData.mmr_estimate?.estimate || null
        },
        profile: {
          cheese: profileData.cheese || 0,
          steamAccount: profileData.steam_account || null,
          isSubscriber: profileData.is_subscriber || false,
          plus: profileData.plus || false
        },
        
        // Statistics
        stats: {
          wins: wlData.win || 0,
          losses: wlData.lose || 0,
          winRate: wlData.win && wlData.lose ? ((wlData.win / (wlData.win + wlData.lose)) * 100).toFixed(1) : null,
          totalMatches: (wlData.win || 0) + (wlData.lose || 0),
          recentMatches: matchesData.slice(0, 10),
          topHeroes: heroesData.slice(0, 5)
        },
        
        // App metadata
        authMode: 'development',
        lastSync: new Date(),
        fromCache: false
      };

      // Cache the result
      this.setCacheItem(cacheKey, userData);

      return userData;
    } catch (error) {
      console.error('Login with Player ID failed:', error);
      throw error;
    }
  }

  // Fetch player profile from OpenDota
  async fetchOpenDotaProfile(accountId) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Player not found. Please check the Account ID.');
      }
      throw new Error(`OpenDota API error: ${response.status}`);
    }
    return response.json();
  }

  // Fetch win/loss data
  async fetchWinLoss(accountId) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}/wl`);
    if (!response.ok) return { win: 0, lose: 0 };
    return response.json();
  }

  // Fetch recent matches
  async fetchRecentMatches(accountId, limit = 20) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}/recentMatches`);
    if (!response.ok) return [];
    const matches = await response.json();
    return matches.slice(0, limit);
  }

  // Fetch hero statistics
  async fetchHeroStats(accountId) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}/heroes`);
    if (!response.ok) return [];
    const heroes = await response.json();
    return heroes.sort((a, b) => b.games - a.games);
  }

  // Fetch player ratings (MMR history)
  async fetchRatings(accountId) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}/ratings`);
    if (!response.ok) return [];
    return response.json();
  }

  // Fetch player totals (for GPM, XPM, etc.)
  async fetchPlayerTotals(accountId) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}/totals`);
    if (!response.ok) return [];
    return response.json();
  }

  // Fetch match details
  async fetchMatch(matchId) {
    const response = await fetch(`${this.baseUrl}/matches/${matchId}`);
    if (!response.ok) throw new Error(`Failed to fetch match ${matchId}`);
    return response.json();
  }

  // Fetch player's peers (frequent teammates)
  async fetchPeers(accountId) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}/peers`);
    if (!response.ok) return [];
    return response.json();
  }

  // Fetch player's wordcloud
  async fetchWordcloud(accountId) {
    const response = await fetch(`${this.baseUrl}/players/${accountId}/wordcloud`);
    if (!response.ok) return {};
    return response.json();
  }

  // Steam OpenID Authentication
  async initiateSteamLogin() {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': import.meta.env.VITE_STEAM_RETURN_URL || `${window.location.origin}/auth/steam/callback`,
      'openid.realm': import.meta.env.VITE_STEAM_REALM || window.location.origin,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });
    
    window.location.href = `https://steamcommunity.com/openid/login?${params}`;
  }

  // Handle Steam callback (would typically be done on server)
  async handleSteamCallback(urlParams) {
    try {
      // Extract Steam ID from claimed_id
      const claimedId = urlParams.get('openid.claimed_id');
      if (!claimedId || !claimedId.includes('steamcommunity.com/openid/id/')) {
        throw new Error('Steam authentication successful! Please enter your Dota 2 Account ID in development mode to continue.');
      }

      const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '');
      const accountId = this.convertSteamIdToAccountId(steamId);

      console.log('Steam authentication successful:', { steamId, accountId });

      // Since this is a client-side only demo, we'll create a basic user object
      // In production, this would be validated on the server
      
      try {
        // Try to fetch OpenDota data for this account
        const userData = await this.loginWithPlayerId(accountId);
        userData.authMode = 'steam';
        userData.steamId = steamId;
        userData.verifiedSteam = true;
        
        return userData;
      } catch (error) {
        // If OpenDota fails, create a basic Steam user object
        console.warn('OpenDota data unavailable, creating basic Steam profile:', error.message);
        
        return {
          steamId: steamId,
          accountId: accountId,
          personaName: `Steam User ${steamId.slice(-6)}`,
          avatar: '/default-avatar.png',
          avatarMedium: '/default-avatar.png', 
          avatarFull: '/default-avatar.png',
          profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
          rank: null,
          mmr: { solo: null, party: null, estimate: null },
          profile: { cheese: 0, plus: false },
          stats: { wins: 0, losses: 0, totalMatches: 0 },
          authMode: 'steam',
          verifiedSteam: true,
          lastSync: new Date(),
          fromCache: false
        };
      }
    } catch (error) {
      console.error('Steam callback handling failed:', error);
      
      // Create a friendly error that suggests using development mode
      const friendlyError = new Error(
        'Steam authentication completed, but we need your Dota 2 Account ID to load your stats. ' +
        'Please switch to Development Mode and enter your Account ID to continue.'
      );
      friendlyError.switchToDevMode = true;
      throw friendlyError;
    }
  }

  // Fetch Steam profile (requires API key)
  async fetchSteamProfile(steamId) {
    const apiKey = import.meta.env.VITE_STEAM_API_KEY;
    if (!apiKey) {
      console.warn('Steam API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.steamApiUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
      );
      
      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response?.players?.[0] || null;
    } catch (error) {
      console.error('Failed to fetch Steam profile:', error);
      return null;
    }
  }

  // Refresh user data
  async refreshUserData(accountId) {
    // Clear cache for this user
    const cacheKey = `player_${accountId}`;
    this.cache.delete(cacheKey);

    // Re-fetch data
    return this.loginWithPlayerId(accountId);
  }

  // Get famous player data for quick testing
  getFamousPlayers() {
    return [
      {
        accountId: '105248644',
        name: 'Miracle-',
        description: 'OG Mid Player'
      },
      {
        accountId: '19672354',
        name: 'N0tail',
        description: 'OG Captain'
      },
      {
        accountId: '87278757',
        name: 'Puppey',
        description: 'Team Secret Captain'
      },
      {
        accountId: '111620041',
        name: 'Dendi',
        description: 'NAVI Legend'
      },
      {
        accountId: '103940975',
        name: 'Arteezy',
        description: 'TSM Carry'
      }
    ];
  }

  // Clear all cached data
  clearCache() {
    this.cache.clear();
  }
}

export default new AuthService();