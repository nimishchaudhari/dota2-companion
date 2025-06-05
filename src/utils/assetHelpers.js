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
  
  const basePath = animated ? ASSET_PATHS.heroes.animated : ASSET_PATHS.heroes.icons;
  const assetPath = `${basePath}/${heroName}.png`;
  
  debugLog(`Requesting asset: ${assetPath}`);
  
  try {
    // Use dynamic import to get the actual asset URL
    const assetUrl = new URL(`../assets/heroes/${animated ? 'animated' : 'icons'}/${heroName}.png`, import.meta.url).href;
    debugLog(`Generated asset URL: ${assetUrl}`);
    return assetUrl;
  } catch (error) {
    debugLog(`Asset URL generation failed for ${heroName}:`, error.message);
    console.warn(`[ASSET WARNING] Hero icon not found: ${heroName} (${animated ? 'animated' : 'static'})`);
    
    // Fallback to default hero
    if (heroName !== 'default') {
      return getHeroIcon('default', animated);
    }
    
    // Last resort fallback
    return `${basePath}/default.png`;
  }
};

/**
 * Get ability icon path
 * @param {string} abilityName - Ability name (e.g., 'pudge_meat_hook')
 * @returns {string} Asset URL for use in img src
 */
export const getAbilityIcon = (abilityName) => {
  debugLog(`Getting ability icon for: "${abilityName}"`);
  
  try {
    // Use dynamic import to get the actual asset URL
    const assetUrl = new URL(`../assets/abilities/${abilityName}.webp`, import.meta.url).href;
    debugLog(`Generated ability asset URL: ${assetUrl}`);
    return assetUrl;
  } catch (error) {
    debugLog(`Ability asset URL generation failed for ${abilityName}:`, error.message);
    console.warn(`[ASSET WARNING] Ability icon not found: ${abilityName}`);
    
    // Fallback to default ability
    if (abilityName !== 'ability_default') {
      return getAbilityIcon('ability_default');
    }
    
    // Last resort fallback
    return `${ASSET_PATHS.abilities}/ability_default.webp`;
  }
};

/**
 * Get item icon path
 * @param {string} itemName - Item name (e.g., 'black_king_bar')
 * @param {string} format - File format ('png' or 'webp', default: 'webp')
 * @returns {string} Asset URL for use in img src
 */
export const getItemIcon = (itemName, format = 'webp') => {
  debugLog(`Getting item icon for: "${itemName}", format: ${format}`);
  
  try {
    // Use dynamic import to get the actual asset URL
    const assetUrl = new URL(`../assets/items/${itemName}.${format}`, import.meta.url).href;
    debugLog(`Generated item asset URL: ${assetUrl}`);
    return assetUrl;
  } catch (error) {
    debugLog(`Item asset URL generation failed for ${itemName}.${format}:`, error.message);
    console.warn(`[ASSET WARNING] Item icon not found: ${itemName}.${format}`);
    
    // Try alternate format
    if (format === 'webp') {
      try {
        return getItemIcon(itemName, 'png');
      } catch {
        // Continue to default fallback
      }
    }
    
    // Fallback to default item
    if (itemName !== 'item_default') {
      return getItemIcon('item_default', format);
    }
    
    // Last resort fallback
    return `${ASSET_PATHS.items}/item_default.${format}`;
  }
};

/**
 * Get rune icon path
 * @param {string} runeName - Rune name
 * @returns {string} Asset URL for use in img src
 */
export const getRuneIcon = (runeName) => {
  debugLog(`Getting rune icon for: "${runeName}"`);
  
  try {
    // Use dynamic import to get the actual asset URL
    const assetUrl = new URL(`../assets/runes/${runeName}.webp`, import.meta.url).href;
    debugLog(`Generated rune asset URL: ${assetUrl}`);
    return assetUrl;
  } catch (error) {
    debugLog(`Rune asset URL generation failed for ${runeName}:`, error.message);
    console.warn(`[ASSET WARNING] Rune icon not found: ${runeName}`);
    
    // Last resort fallback
    return `${ASSET_PATHS.runes}/${runeName}.webp`;
  }
};

/**
 * Get facet icon path
 * @param {string} facetName - Facet name
 * @returns {string} Asset URL for use in img src
 */
export const getFacetIcon = (facetName) => {
  debugLog(`Getting facet icon for: "${facetName}"`);
  
  try {
    // Use dynamic import to get the actual asset URL
    const assetUrl = new URL(`../assets/facets/${facetName}.webp`, import.meta.url).href;
    debugLog(`Generated facet asset URL: ${assetUrl}`);
    return assetUrl;
  } catch (error) {
    debugLog(`Facet asset URL generation failed for ${facetName}:`, error.message);
    console.warn(`[ASSET WARNING] Facet icon not found: ${facetName}`);
    
    // Last resort fallback
    return `${ASSET_PATHS.facets}/${facetName}.webp`;
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