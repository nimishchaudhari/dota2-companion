/**
 * Asset Helper Utilities for Dota 2 Companion
 * Provides easy access to hero icons, ability icons, items, runes, and facets
 */

// Debug logging configuration
const DEBUG_ASSETS = true;
const debugLog = (message, data = null) => {
  if (DEBUG_ASSETS) {
    if (data !== null) {
      console.log(`[ASSET DEBUG] ${message}`, data);
    } else {
      console.log(`[ASSET DEBUG] ${message}`);
    }
  }
};

debugLog('Asset helper module initialized with Vite URL resolver');

// Base paths for different asset categories
const ASSET_PATHS = {
  heroes: {
    icons: '/src/assets/heroes/icons',
    animated: '/src/assets/heroes/animated'
  },
  abilities: '/src/assets/abilities',
  items: '/src/assets/items',
  runes: '/src/assets/runes',
  facets: '/src/assets/facets'
};

/**
 * Get hero icon path
 * @param {string} heroName - Hero name (e.g., 'pudge', 'invoker')
 * @param {boolean} animated - Whether to get animated version (default: false)
 * @returns {string} Asset URL for use in img src
 */
export const getHeroIcon = (heroName, animated = false) => {
  debugLog(`Getting hero icon for: "${heroName}", animated: ${animated}`);
  
  // Use simple path-based approach for Vite compatibility
  const assetPath = `/src/assets/heroes/${animated ? 'animated' : 'icons'}/${heroName}.png`;
  debugLog(`Generated hero asset path: ${assetPath}`);
  return assetPath;
};

/**
 * Get ability icon path
 * @param {string} abilityName - Ability name (e.g., 'pudge_meat_hook')
 * @returns {string} Asset URL for use in img src
 */
export const getAbilityIcon = (abilityName) => {
  debugLog(`Getting ability icon for: "${abilityName}"`);
  
  // Use simple path-based approach for Vite compatibility
  const assetPath = `/src/assets/abilities/${abilityName}.webp`;
  debugLog(`Generated ability asset path: ${assetPath}`);
  return assetPath;
};

/**
 * Get item icon path
 * @param {string} itemName - Item name (e.g., 'black_king_bar')
 * @param {string} format - File format ('png' or 'webp', default: 'webp')
 * @returns {string} Asset URL for use in img src
 */
export const getItemIcon = (itemName, format = 'webp') => {
  debugLog(`Getting item icon for: "${itemName}", format: ${format}`);
  
  // Use simple path-based approach for Vite compatibility
  const assetPath = `/src/assets/items/${itemName}.${format}`;
  debugLog(`Generated item asset path: ${assetPath}`);
  return assetPath;
};

/**
 * Get rune icon path
 * @param {string} runeName - Rune name
 * @returns {string} Asset URL for use in img src
 */
export const getRuneIcon = (runeName) => {
  debugLog(`Getting rune icon for: "${runeName}"`);
  
  // Use simple path-based approach for Vite compatibility
  const assetPath = `/src/assets/runes/${runeName}.webp`;
  debugLog(`Generated rune asset path: ${assetPath}`);
  return assetPath;
};

/**
 * Get facet icon path
 * @param {string} facetName - Facet name
 * @returns {string} Asset URL for use in img src
 */
export const getFacetIcon = (facetName) => {
  debugLog(`Getting facet icon for: "${facetName}"`);
  
  // Use simple path-based approach for Vite compatibility
  const assetPath = `/src/assets/facets/${facetName}.webp`;
  debugLog(`Generated facet asset path: ${assetPath}`);
  return assetPath;
};

/**
 * Get hero icon by hero ID (for OpenDota API integration)
 * @param {number} heroId - Hero ID from OpenDota API
 * @param {Object} heroesData - Heroes data from OpenDota API
 * @param {boolean} animated - Whether to get animated version
 * @returns {string} Asset path or fallback
 */
export const getHeroIconById = (heroId, heroesData, animated = false) => {
  debugLog(`Getting hero icon by ID: ${heroId}, heroes data length: ${heroesData?.length || 0}`);
  
  const hero = heroesData?.find(h => h.id === heroId);
  if (!hero) {
    debugLog(`Hero not found in data for ID: ${heroId}`);
    console.warn(`[ASSET WARNING] Hero not found for ID: ${heroId}`);
    return getHeroIcon('unknown', animated);
  }
  
  debugLog(`Found hero:`, { id: hero.id, name: hero.name, localized_name: hero.localized_name });
  
  // Convert hero name to asset filename format
  const heroName = hero.name.replace('npc_dota_hero_', '');
  debugLog(`Converted hero name: "${hero.name}" -> "${heroName}"`);
  
  return getHeroIcon(heroName, animated);
};

/**
 * Get ability icon with fallback
 * @param {string} abilityName - Ability name
 * @returns {string} Asset path with fallback
 */
export const getAbilityIconSafe = (abilityName) => {
  debugLog(`Getting ability icon safely for: "${abilityName}"`);
  
  if (!abilityName) {
    debugLog('No ability name provided, using default');
    return getAbilityIcon('ability_default');
  }
  return getAbilityIcon(abilityName);
};

/**
 * Get item icon with fallback
 * @param {string} itemName - Item name
 * @param {string} format - File format
 * @returns {string} Asset path with fallback
 */
export const getItemIconSafe = (itemName, format = 'webp') => {
  debugLog(`Getting item icon safely for: "${itemName}", format: ${format}`);
  
  if (!itemName) {
    debugLog('No item name provided, using item_default');
    return getItemIcon('item_default', format);
  }
  return getItemIcon(itemName, format);
};

// Asset validation helpers
export const assetExists = async (assetPath) => {
  debugLog(`Checking if asset exists: ${assetPath}`);
  
  try {
    const response = await fetch(assetPath);
    const exists = response.ok;
    debugLog(`Asset exists check result for "${assetPath}": ${exists} (status: ${response.status})`);
    return exists;
  } catch (error) {
    debugLog(`Asset exists check failed for "${assetPath}":`, error.message);
    return false;
  }
};

// Complete hero name mappings (OpenDota API name -> asset filename)
export const HERO_NAME_MAPPINGS = {
  // Core heroes with name mismatches
  'Anti-Mage': 'antimage',
  'Ancient Apparition': 'ancient_apparition',
  'Centaur Warrunner': 'centaur',
  'Clockwerk': 'rattletrap',
  'Doom': 'doom_bringer',
  'Dragon Knight': 'dragon_knight',
  'Drow Ranger': 'drow_ranger',
  'Faceless Void': 'faceless_void',
  'Io': 'wisp',
  'Keeper of the Light': 'keeper_of_the_light',
  'Lifestealer': 'life_stealer',
  'Magnus': 'magnataur',
  'Nature\'s Prophet': 'furion',
  'Necrophos': 'necrolyte',
  'Night Stalker': 'night_stalker',
  'Nyx Assassin': 'nyx_assassin',
  'Ogre Magi': 'ogre_magi',
  'Outworld Destroyer': 'obsidian_destroyer',
  'Phantom Assassin': 'phantom_assassin',
  'Phantom Lancer': 'phantom_lancer',
  'Primal Beast': 'primal_beast',
  'Queen of Pain': 'queenofpain',
  'Sand King': 'sand_king',
  'Shadow Demon': 'shadow_demon',
  'Shadow Fiend': 'nevermore',
  'Shadow Shaman': 'shadow_shaman',
  'Skywrath Mage': 'skywrath_mage',
  'Spirit Breaker': 'spirit_breaker',
  'Storm Spirit': 'storm_spirit',
  'Templar Assassin': 'templar_assassin',
  'Timbersaw': 'shredder',
  'Treant Protector': 'treant',
  'Troll Warlord': 'troll_warlord',
  'Underlord': 'abyssal_underlord',
  'Vengeful Spirit': 'vengefulspirit',
  'Void Spirit': 'void_spirit',
  'Windranger': 'windrunner',
  'Winter Wyvern': 'winter_wyvern',
  'Witch Doctor': 'witch_doctor',
  'Wraith King': 'skeleton_king',
  'Zeus': 'zuus',
  // Modern heroes (exact matches with our assets)
  'Arc Warden': 'arc_warden',
  'Dark Willow': 'dark_willow',
  'Dawnbreaker': 'dawnbreaker',
  'Earth Spirit': 'earth_spirit',
  'Elder Titan': 'elder_titan',
  'Ember Spirit': 'ember_spirit',
  'Grimstroke': 'grimstroke',
  'Hoodwink': 'hoodwink',
  'Kez': 'kez',
  'Legion Commander': 'legion_commander',
  'Lone Druid': 'lone_druid',
  'Marci': 'marci',
  'Mars': 'mars',
  'Monkey King': 'monkey_king',
  'Muerta': 'muerta',
  'Naga Siren': 'naga_siren',
  'Pangolier': 'pangolier',
  'Ringmaster': 'ringmaster',
  'Snapfire': 'snapfire'
};

/**
 * Get rank/tier icon based on rank tier number
 * @param {number} rankTier - Rank tier (1-80 scale from OpenDota)
 * @returns {string} Asset path for tier icon
 */
export const getRankIcon = (rankTier) => {
  debugLog(`Getting rank icon for tier: ${rankTier}`);
  
  if (!rankTier || rankTier < 1) {
    debugLog('No rank tier provided, using default tier1');
    return getItemIcon('tier1_token');
  }
  
  // Convert OpenDota rank tier (1-80) to our tier system (1-5)
  // Herald/Guardian: 1-20 -> tier1
  // Crusader/Archon: 21-40 -> tier2  
  // Legend/Ancient: 41-60 -> tier3
  // Divine: 61-75 -> tier4
  // Immortal: 76-80 -> tier5
  let tierLevel;
  if (rankTier <= 20) tierLevel = 1;
  else if (rankTier <= 40) tierLevel = 2;
  else if (rankTier <= 60) tierLevel = 3;
  else if (rankTier <= 75) tierLevel = 4;
  else tierLevel = 5;
  
  const tierName = `tier${tierLevel}_token`;
  debugLog(`Mapped rank tier ${rankTier} to ${tierName}`);
  return getItemIcon(tierName);
};

/**
 * Normalize hero name for asset lookup
 * @param {string} heroName - Display name from API
 * @returns {string} Normalized name for asset lookup
 */
export const normalizeHeroName = (heroName) => {
  try {
    debugLog(`Normalizing hero name: "${heroName}"`);
    
    if (!heroName) {
      console.warn('[ASSET WARNING] No hero name provided for normalization');
      return 'default';
    }
    
    // Check if there's a direct mapping
    if (HERO_NAME_MAPPINGS[heroName]) {
      debugLog(`Found direct mapping: "${heroName}" -> "${HERO_NAME_MAPPINGS[heroName]}"`);
      return HERO_NAME_MAPPINGS[heroName];
    }
    
    // Convert to lowercase and replace spaces/special chars
    const normalized = heroName
      .toLowerCase()
      .replace(/['\s-]/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/__+/g, '_') // Remove multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
    debugLog(`Normalized hero name: "${heroName}" -> "${normalized}"`);
    return normalized || 'default';
  } catch (error) {
    console.warn(`[ASSET WARNING] Error normalizing hero name "${heroName}":`, error);
    return 'default';
  }
};