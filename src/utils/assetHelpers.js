/**
 * Asset Helper Utilities for Dota 2 Companion
 * Provides easy access to hero icons, ability icons, items, runes, and facets
 */

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
  const basePath = animated ? ASSET_PATHS.heroes.animated : ASSET_PATHS.heroes.icons;
  return `${basePath}/${heroName}.png`;
};

/**
 * Get ability icon path
 * @param {string} abilityName - Ability name (e.g., 'pudge_meat_hook')
 * @returns {string} Asset path
 */
export const getAbilityIcon = (abilityName) => {
  return `${ASSET_PATHS.abilities}/${abilityName}.webp`;
};

/**
 * Get item icon path
 * @param {string} itemName - Item name (e.g., 'black_king_bar')
 * @param {string} format - File format ('png' or 'webp', default: 'webp')
 * @returns {string} Asset path
 */
export const getItemIcon = (itemName, format = 'webp') => {
  return `${ASSET_PATHS.items}/${itemName}.${format}`;
};

/**
 * Get rune icon path
 * @param {string} runeName - Rune name
 * @returns {string} Asset path
 */
export const getRuneIcon = (runeName) => {
  return `${ASSET_PATHS.runes}/${runeName}.webp`;
};

/**
 * Get facet icon path
 * @param {string} facetName - Facet name
 * @returns {string} Asset path
 */
export const getFacetIcon = (facetName) => {
  return `${ASSET_PATHS.facets}/${facetName}.webp`;
};

/**
 * Get hero icon by hero ID (for OpenDota API integration)
 * @param {number} heroId - Hero ID from OpenDota API
 * @param {Object} heroesData - Heroes data from OpenDota API
 * @param {boolean} animated - Whether to get animated version
 * @returns {string} Asset path or fallback
 */
export const getHeroIconById = (heroId, heroesData, animated = false) => {
  const hero = heroesData?.find(h => h.id === heroId);
  if (!hero) return getHeroIcon('unknown', animated);
  
  // Convert hero name to asset filename format
  const heroName = hero.name.replace('npc_dota_hero_', '');
  return getHeroIcon(heroName, animated);
};

/**
 * Get ability icon with fallback
 * @param {string} abilityName - Ability name
 * @returns {string} Asset path with fallback
 */
export const getAbilityIconSafe = (abilityName) => {
  if (!abilityName) return getAbilityIcon('ability_default');
  return getAbilityIcon(abilityName);
};

/**
 * Get item icon with fallback
 * @param {string} itemName - Item name
 * @param {string} format - File format
 * @returns {string} Asset path with fallback
 */
export const getItemIconSafe = (itemName, format = 'webp') => {
  if (!itemName) return getItemIcon('filler_ability', format);
  return getItemIcon(itemName, format);
};

// Asset validation helpers
export const assetExists = async (assetPath) => {
  try {
    const response = await fetch(assetPath);
    return response.ok;
  } catch {
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
  // Check if there's a direct mapping
  if (HERO_NAME_MAPPINGS[heroName]) {
    return HERO_NAME_MAPPINGS[heroName];
  }
  
  // Convert to lowercase and replace spaces/special chars
  return heroName
    .toLowerCase()
    .replace(/['\s-]/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};