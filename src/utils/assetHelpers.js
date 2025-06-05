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

// Initialize asset maps using import.meta.glob for static asset discovery
let heroIconsMap = {};
let heroAnimatedMap = {};
let abilitiesMap = {};
let itemsMap = {};
let runesMap = {};
let facetsMap = {};

// Populate asset maps
const initializeAssetMaps = () => {
  try {
    // Hero icons
    const heroIcons = import.meta.glob('/src/assets/heroes/icons/*.png', { eager: true, as: 'url' });
    heroIconsMap = heroIcons;
    debugLog(`Loaded ${Object.keys(heroIconsMap).length} hero icons`);
    if (Object.keys(heroIconsMap).length > 0) {
      debugLog('Sample hero icon entry:', Object.entries(heroIconsMap)[0]);
    }

    // Hero animated
    const heroAnimated = import.meta.glob('/src/assets/heroes/animated/*.png', { eager: true, as: 'url' });
    heroAnimatedMap = heroAnimated;
    debugLog(`Loaded ${Object.keys(heroAnimatedMap).length} animated hero icons`);
    if (Object.keys(heroAnimatedMap).length > 0) {
      debugLog('Sample animated hero entry:', Object.entries(heroAnimatedMap)[0]);
    }

    // Abilities
    const abilities = import.meta.glob('/src/assets/abilities/*.webp', { eager: true, as: 'url' });
    abilitiesMap = abilities;
    debugLog(`Loaded ${Object.keys(abilitiesMap).length} ability icons`);
    if (Object.keys(abilitiesMap).length > 0) {
      debugLog('Sample ability entry:', Object.entries(abilitiesMap)[0]);
    }

    // Items
    const items = import.meta.glob('/src/assets/items/*.{png,webp}', { eager: true, as: 'url' });
    itemsMap = items;
    debugLog(`Loaded ${Object.keys(itemsMap).length} item icons`);
    if (Object.keys(itemsMap).length > 0) {
      debugLog('Sample item entry:', Object.entries(itemsMap)[0]);
    }

    // Runes
    const runes = import.meta.glob('/src/assets/runes/*.webp', { eager: true, as: 'url' });
    runesMap = runes;
    debugLog(`Loaded ${Object.keys(runesMap).length} rune icons`);
    if (Object.keys(runesMap).length > 0) {
      debugLog('Sample rune entry:', Object.entries(runesMap)[0]);
    }

    // Facets
    const facets = import.meta.glob('/src/assets/facets/*.webp', { eager: true, as: 'url' });
    facetsMap = facets;
    debugLog(`Loaded ${Object.keys(facetsMap).length} facet icons`);
    if (Object.keys(facetsMap).length > 0) {
      debugLog('Sample facet entry:', Object.entries(facetsMap)[0]);
    }

    debugLog('Asset map initialization complete');
  } catch (error) {
    debugLog('Error initializing asset maps:', error);
  }
};

// Initialize on module load
initializeAssetMaps();

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
 * @returns {string} Asset path
 */
export const getHeroIcon = (heroName, animated = false) => {
  debugLog(`Getting hero icon for: "${heroName}", animated: ${animated}`);
  
  const assetMap = animated ? heroAnimatedMap : heroIconsMap;
  const basePath = animated ? ASSET_PATHS.heroes.animated : ASSET_PATHS.heroes.icons;
  const expectedPath = `${basePath}/${heroName}.png`;
  
  debugLog(`Looking for asset at: ${expectedPath}`);
  debugLog(`Available in map: ${assetMap[expectedPath] ? 'YES' : 'NO'}`);
  debugLog(`Total assets in ${animated ? 'animated' : 'static'} hero map: ${Object.keys(assetMap).length}`);
  
  if (assetMap[expectedPath]) {
    debugLog(`Found hero asset URL: ${assetMap[expectedPath]}`);
    return assetMap[expectedPath];
  } else {
    debugLog(`Hero asset NOT FOUND in map. Available keys:`, Object.keys(assetMap).slice(0, 5));
    console.warn(`[ASSET WARNING] Hero icon not found: ${heroName} (${animated ? 'animated' : 'static'})`);
    // Fallback to path-based approach
    return expectedPath;
  }
};

/**
 * Get ability icon path
 * @param {string} abilityName - Ability name (e.g., 'pudge_meat_hook')
 * @returns {string} Asset path
 */
export const getAbilityIcon = (abilityName) => {
  debugLog(`Getting ability icon for: "${abilityName}"`);
  
  const expectedPath = `${ASSET_PATHS.abilities}/${abilityName}.webp`;
  
  debugLog(`Looking for ability asset at: ${expectedPath}`);
  debugLog(`Available in map: ${abilitiesMap[expectedPath] ? 'YES' : 'NO'}`);
  debugLog(`Total abilities in map: ${Object.keys(abilitiesMap).length}`);
  
  if (abilitiesMap[expectedPath]) {
    debugLog(`Found ability asset URL: ${abilitiesMap[expectedPath]}`);
    return abilitiesMap[expectedPath];
  } else {
    debugLog(`Ability asset NOT FOUND in map. Available keys:`, Object.keys(abilitiesMap).slice(0, 5));
    console.warn(`[ASSET WARNING] Ability icon not found: ${abilityName}`);
    // Fallback to path-based approach
    return expectedPath;
  }
};

/**
 * Get item icon path
 * @param {string} itemName - Item name (e.g., 'black_king_bar')
 * @param {string} format - File format ('png' or 'webp', default: 'webp')
 * @returns {string} Asset path
 */
export const getItemIcon = (itemName, format = 'webp') => {
  debugLog(`Getting item icon for: "${itemName}", format: ${format}`);
  
  const expectedPath = `${ASSET_PATHS.items}/${itemName}.${format}`;
  
  debugLog(`Looking for item asset at: ${expectedPath}`);
  debugLog(`Available in map: ${itemsMap[expectedPath] ? 'YES' : 'NO'}`);
  debugLog(`Total items in map: ${Object.keys(itemsMap).length}`);
  
  if (itemsMap[expectedPath]) {
    debugLog(`Found item asset URL: ${itemsMap[expectedPath]}`);
    return itemsMap[expectedPath];
  } else {
    debugLog(`Item asset NOT FOUND in map. Available keys:`, Object.keys(itemsMap).slice(0, 5));
    console.warn(`[ASSET WARNING] Item icon not found: ${itemName}.${format}`);
    // Fallback to path-based approach
    return expectedPath;
  }
};

/**
 * Get rune icon path
 * @param {string} runeName - Rune name
 * @returns {string} Asset path
 */
export const getRuneIcon = (runeName) => {
  debugLog(`Getting rune icon for: "${runeName}"`);
  
  const expectedPath = `${ASSET_PATHS.runes}/${runeName}.webp`;
  
  debugLog(`Looking for rune asset at: ${expectedPath}`);
  debugLog(`Available in map: ${runesMap[expectedPath] ? 'YES' : 'NO'}`);
  debugLog(`Total runes in map: ${Object.keys(runesMap).length}`);
  
  if (runesMap[expectedPath]) {
    debugLog(`Found rune asset URL: ${runesMap[expectedPath]}`);
    return runesMap[expectedPath];
  } else {
    debugLog(`Rune asset NOT FOUND in map. Available keys:`, Object.keys(runesMap).slice(0, 5));
    console.warn(`[ASSET WARNING] Rune icon not found: ${runeName}`);
    // Fallback to path-based approach
    return expectedPath;
  }
};

/**
 * Get facet icon path
 * @param {string} facetName - Facet name
 * @returns {string} Asset path
 */
export const getFacetIcon = (facetName) => {
  debugLog(`Getting facet icon for: "${facetName}"`);
  
  const expectedPath = `${ASSET_PATHS.facets}/${facetName}.webp`;
  
  debugLog(`Looking for facet asset at: ${expectedPath}`);
  debugLog(`Available in map: ${facetsMap[expectedPath] ? 'YES' : 'NO'}`);
  debugLog(`Total facets in map: ${Object.keys(facetsMap).length}`);
  
  if (facetsMap[expectedPath]) {
    debugLog(`Found facet asset URL: ${facetsMap[expectedPath]}`);
    return facetsMap[expectedPath];
  } else {
    debugLog(`Facet asset NOT FOUND in map. Available keys:`, Object.keys(facetsMap).slice(0, 5));
    console.warn(`[ASSET WARNING] Facet icon not found: ${facetName}`);
    // Fallback to path-based approach
    return expectedPath;
  }
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
    debugLog('No item name provided, using filler_ability');
    return getItemIcon('filler_ability', format);
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

// Common hero name mappings (OpenDota name -> asset filename)
export const HERO_NAME_MAPPINGS = {
  'Anti-Mage': 'antimage',
  'Ancient Apparition': 'ancient_apparition',
  'Centaur Warrunner': 'centaur',
  'Clockwerk': 'rattletrap',
  'Doom': 'doom_bringer',
  'Io': 'wisp',
  'Lifestealer': 'life_stealer',
  'Magnus': 'magnataur',
  'Nature\'s Prophet': 'furion',
  'Necrophos': 'necrolyte',
  'Outworld Destroyer': 'obsidian_destroyer',
  'Queen of Pain': 'queenofpain',
  'Shadow Fiend': 'nevermore',
  'Storm Spirit': 'storm_spirit',
  'Timbersaw': 'shredder',
  'Underlord': 'abyssal_underlord',
  'Vengeful Spirit': 'vengefulspirit',
  'Windranger': 'windrunner',
  'Wraith King': 'skeleton_king'
};

/**
 * Normalize hero name for asset lookup
 * @param {string} heroName - Display name from API
 * @returns {string} Normalized name for asset lookup
 */
export const normalizeHeroName = (heroName) => {
  debugLog(`Normalizing hero name: "${heroName}"`);
  
  // Check if there's a direct mapping
  if (HERO_NAME_MAPPINGS[heroName]) {
    debugLog(`Found direct mapping: "${heroName}" -> "${HERO_NAME_MAPPINGS[heroName]}"`);
    return HERO_NAME_MAPPINGS[heroName];
  }
  
  // Convert to lowercase and replace spaces/special chars
  const normalized = heroName
    .toLowerCase()
    .replace(/['\s-]/g, '_')
    .replace(/[^a-z0-9_]/g, '');
    
  debugLog(`Normalized hero name: "${heroName}" -> "${normalized}"`);
  return normalized;
};