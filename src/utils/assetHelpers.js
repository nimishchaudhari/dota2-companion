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
    icons: '/assets/heroes/icons',
    animated: '/assets/heroes/animated'
  },
  abilities: '/assets/abilities',
  items: '/assets/items',
  runes: '/assets/runes',
  facets: '/assets/facets'
};

/**
 * Get hero icon path
 * @param {string} heroName - Hero name (e.g., 'pudge', 'invoker')
 * @param {boolean} animated - Whether to get animated version (default: false)
 * @returns {string} Asset URL for use in img src
 */
export const getHeroIcon = (heroName, animated = false) => {
  debugLog(`Getting hero icon for: "${heroName}", animated: ${animated}`);
  
  try {
    // Use public asset path for Vite production builds
    const assetPath = `/assets/heroes/${animated ? 'animated' : 'icons'}/${heroName}.${animated ? 'webm' : 'png'}`;
    debugLog(`Generated hero asset URL: ${assetPath}`);
    return assetPath;
  } catch (error) {
    debugLog(`Error generating hero asset URL for "${heroName}":`, error);
    // Fallback to default hero icon
    try {
      const fallbackPath = `/assets/heroes/icons/default.png`;
      debugLog(`Using fallback hero asset URL: ${fallbackPath}`);
      return fallbackPath;
    } catch (FALLBACK_ERROR) {
      console.warn(`[ASSET WARNING] Failed to generate hero asset URL for "${heroName}":`, error);
      return '';
    }
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
    // Use public asset path for Vite production builds
    const assetPath = `/assets/abilities/${abilityName}.webp`;
    debugLog(`Generated ability asset URL: ${assetPath}`);
    return assetPath;
  } catch (error) {
    debugLog(`Error generating ability asset URL for "${abilityName}":`, error);
    // Fallback to default ability icon
    try {
      const fallbackPath = `/assets/abilities/ability_default.webp`;
      debugLog(`Using fallback ability asset URL: ${fallbackPath}`);
      return fallbackPath;
    } catch (FALLBACK_ERROR) {
      console.warn(`[ASSET WARNING] Failed to generate ability asset URL for "${abilityName}":`, error);
      return '';
    }
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
    // Use public asset path for Vite production builds
    const assetPath = `/assets/items/${itemName}.${format}`;
    debugLog(`Generated item asset URL: ${assetPath}`);
    return assetPath;
  } catch (error) {
    debugLog(`Error generating item asset URL for "${itemName}":`, error);
    // Fallback to default item icon
    try {
      const fallbackPath = `/assets/items/item_default.${format}`;
      debugLog(`Using fallback item asset URL: ${fallbackPath}`);
      return fallbackPath;
    } catch (FALLBACK_ERROR) {
      console.warn(`[ASSET WARNING] Failed to generate item asset URL for "${itemName}":`, error);
      return '';
    }
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
    // Use public asset path for Vite production builds
    const assetPath = `/assets/runes/${runeName}.webp`;
    debugLog(`Generated rune asset URL: ${assetPath}`);
    return assetPath;
  } catch (error) {
    debugLog(`Error generating rune asset URL for "${runeName}":`, error);
    console.warn(`[ASSET WARNING] Failed to generate rune asset URL for "${runeName}":`, error);
    return '';
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
    // Use public asset path for Vite production builds
    const assetPath = `/assets/facets/${facetName}.webp`;
    debugLog(`Generated facet asset URL: ${assetPath}`);
    return assetPath;
  } catch (error) {
    debugLog(`Error generating facet asset URL for "${facetName}":`, error);
    console.warn(`[ASSET WARNING] Failed to generate facet asset URL for "${facetName}":`, error);
    return '';
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
    debugLog('No item name provided, using item_default');
    return getItemIcon('item_default', format);
  }
  return getItemIcon(itemName, format);
};

// Common OpenDota item ID to asset name mappings
// This is a curated list of the most common items that appear in matches
export const ITEM_ID_MAPPINGS = {
  // Core items
  1: 'blink',
  2: 'blades_of_attack',
  3: 'broadsword',
  4: 'chainmail',
  5: 'claymore',
  6: 'helm_of_iron_will',
  7: 'javelin',
  8: 'mithril_hammer',
  9: 'platemail',
  10: 'quarterstaff',
  11: 'quelling_blade',
  12: 'ring_of_protection',
  13: 'gauntlets',
  14: 'slippers',
  15: 'mantle',
  16: 'branches',
  17: 'belt_of_strength',
  18: 'boots_of_elves',
  19: 'robe',
  20: 'circlet',
  21: 'ogre_axe',
  22: 'blade_of_alacrity',
  23: 'staff_of_wizardry',
  24: 'ultimate_orb',
  25: 'gloves',
  26: 'lifesteal',
  27: 'ring_of_regen',
  28: 'sobi_mask',
  29: 'boots',
  30: 'gem',
  31: 'cloak',
  32: 'talisman_of_evasion',
  33: 'cheese',
  34: 'magic_stick',
  35: 'recipe',
  36: 'magic_wand',
  37: 'ghost',
  38: 'clarity',
  39: 'flask',
  40: 'dust',
  41: 'bottle',
  42: 'ward_observer',
  43: 'ward_sentry',
  44: 'tango',
  45: 'courier',
  46: 'tpscroll',
  47: 'travel_boots',
  48: 'phase_boots',
  49: 'demon_edge',
  50: 'eagle',
  51: 'reaver',
  52: 'relic',
  53: 'hyperstone',
  54: 'ring_of_health',
  55: 'void_stone',
  56: 'mystic_staff',
  57: 'energy_booster',
  58: 'point_booster',
  59: 'vitality_booster',
  60: 'power_treads',
  61: 'hand_of_midas',
  62: 'oblivion_staff',
  63: 'pers',
  64: 'poor_mans_shield',
  65: 'bracer',
  66: 'wraith_band',
  67: 'null_talisman',
  68: 'mekansm',
  69: 'vladmir',
  70: 'flying_courier',
  71: 'buckler',
  72: 'ring_of_basilius',
  73: 'pipe',
  74: 'urn_of_shadows',
  75: 'headdress',
  76: 'sheepstick',
  77: 'orchid',
  78: 'cyclone',
  79: 'force_staff',
  80: 'dagon',
  81: 'necronomicon',
  82: 'ultimate_scepter',
  83: 'refresher',
  84: 'assault',
  85: 'heart',
  86: 'black_king_bar',
  87: 'aegis',
  88: 'shivas_guard',
  89: 'bloodstone',
  90: 'sphere',
  91: 'vanguard',
  92: 'blade_mail',
  93: 'soul_booster',
  94: 'hood_of_defiance',
  95: 'rapier',
  96: 'monkey_king_bar',
  97: 'radiance',
  98: 'butterfly',
  99: 'greater_crit',
  100: 'basher',
  101: 'bfury',
  102: 'manta',
  103: 'lesser_crit',
  104: 'armlet',
  105: 'invis_sword',
  106: 'sange_and_yasha',
  107: 'satanic',
  108: 'helm_of_the_dominator',
  109: 'maelstrom',
  110: 'desolator',
  111: 'yasha',
  112: 'mask_of_madness',
  113: 'diffusal_blade',
  114: 'ethereal_blade',
  115: 'soul_ring',
  116: 'arcane_boots',
  117: 'orb_of_venom',
  118: 'stout_shield',
  119: 'recipe',
  120: 'recipe',
  121: 'recipe',
  122: 'recipe',
  123: 'recipe',
  124: 'recipe',
  125: 'recipe',
  126: 'recipe',
  127: 'enchanted_mango',
  128: 'ward_dispenser',
  129: 'tome_of_knowledge',
  130: 'smoke_of_deceit',
  131: 'veil_of_discord',
  132: 'recipe',
  133: 'recipe',
  134: 'recipe',
  135: 'recipe',
  136: 'recipe',
  137: 'recipe',
  138: 'recipe',
  139: 'recipe',
  140: 'recipe',
  141: 'recipe',
  142: 'recipe',
  143: 'recipe',
  144: 'recipe',
  145: 'recipe',
  146: 'recipe',
  147: 'recipe',
  148: 'recipe',
  149: 'recipe',
  150: 'recipe',
  151: 'mjollnir',
  152: 'recipe',
  153: 'recipe',
  154: 'recipe',
  155: 'recipe',
  156: 'recipe',
  157: 'recipe',
  158: 'recipe',
  159: 'recipe',
  160: 'recipe',
  161: 'recipe',
  162: 'crimson_guard',
  163: 'recipe',
  164: 'wind_lace',
  165: 'tranquil_boots',
  166: 'shadow_amulet',
  167: 'glimmer_cape',
  168: 'tome_of_aghanim',
  169: 'tango_single',
  170: 'crimson_guard',
  171: 'lotus_orb',
  172: 'solar_crest',
  173: 'guardian_greaves',
  174: 'aether_lens',
  175: 'dragon_lance',
  176: 'faerie_fire',
  177: 'iron_talon',
  178: 'blight_stone',
  179: 'talisman_of_evasion',
  180: 'recipe',
  181: 'recipe',
  182: 'recipe',
  183: 'recipe',
  184: 'recipe',
  185: 'recipe',
  186: 'recipe',
  187: 'recipe',
  188: 'recipe',
  189: 'recipe',
  190: 'recipe',
  191: 'recipe',
  192: 'recipe',
  193: 'recipe',
  194: 'recipe',
  195: 'recipe',
  196: 'recipe',
  197: 'recipe',
  198: 'recipe',
  199: 'recipe',
  200: 'recipe',
  201: 'recipe',
  202: 'recipe',
  203: 'recipe',
  204: 'recipe',
  205: 'hurricane_pike',
  206: 'recipe',
  207: 'infused_raindrop',
  208: 'recipe',
  209: 'recipe',
  210: 'recipe',
  211: 'recipe',
  212: 'recipe',
  213: 'recipe',
  214: 'recipe',
  215: 'bloodthorn',
  216: 'echo_sabre',
  217: 'octarine_core',
  218: 'recipe',
  219: 'recipe',
  220: 'recipe',
  221: 'recipe',
  222: 'recipe',
  223: 'recipe',
  224: 'recipe',
  225: 'recipe',
  226: 'recipe',
  227: 'recipe',
  228: 'recipe',
  229: 'recipe',
  230: 'recipe',
  231: 'recipe',
  232: 'recipe',
  233: 'recipe',
  234: 'recipe',
  235: 'recipe',
  236: 'recipe',
  237: 'recipe',
  238: 'recipe',
  239: 'recipe',
  240: 'recipe',
  241: 'recipe',
  242: 'recipe',
  243: 'recipe',
  244: 'recipe',
  245: 'recipe',
  246: 'recipe',
  247: 'recipe',
  248: 'recipe',
  249: 'recipe',
  250: 'recipe',
  251: 'recipe',
  252: 'recipe',
  253: 'recipe',
  254: 'recipe',
  255: 'recipe',
  256: 'recipe',
  257: 'recipe',
  258: 'recipe',
  259: 'recipe',
  260: 'meteor_hammer',
  261: 'nullifier',
  262: 'aeon_disk',
  263: 'kaya',
  264: 'trident',
  265: 'yasha_and_kaya',
  266: 'travel_boots_2',
  267: 'kaya_and_sange',
  268: 'recipe',
  269: 'recipe',
  270: 'recipe',
  271: 'recipe',
  272: 'recipe',
  273: 'recipe',
  274: 'recipe',
  275: 'recipe',
  276: 'recipe',
  277: 'recipe',
  278: 'recipe',
  279: 'recipe',
  280: 'recipe',
  281: 'recipe',
  282: 'recipe',
  283: 'recipe',
  284: 'recipe',
  285: 'recipe',
  286: 'recipe',
  287: 'recipe',
  288: 'recipe',
  289: 'recipe',
  290: 'recipe',
  291: 'spirit_vessel',
  292: 'holy_locket',
  293: 'wraith_pact',
  294: 'eternal_shroud',
  295: 'disperser',
  296: 'recipe',
  297: 'recipe',
  298: 'recipe',
  299: 'recipe',
  300: 'recipe'
};

/**
 * Get item name from OpenDota item ID
 * @param {number|string} itemId - OpenDota item ID
 * @returns {string} Item name for asset lookup
 */
export const getItemNameFromId = (itemId) => {
  debugLog(`Converting item ID to name: ${itemId}`);
  
  if (!itemId || itemId === 0) {
    debugLog('No item ID provided or item ID is 0');
    return null;
  }
  
  const numericId = parseInt(itemId);
  const itemName = ITEM_ID_MAPPINGS[numericId];
  
  if (itemName) {
    debugLog(`Found item mapping: ${numericId} -> "${itemName}"`);
    return itemName;
  }
  
  // Fallback for unknown items
  debugLog(`No mapping found for item ID ${numericId}, using generic fallback`);
  return 'item_default';
};

/**
 * Get item icon by OpenDota item ID with proper fallback
 * @param {number|string} itemId - OpenDota item ID
 * @param {string} format - File format
 * @returns {string} Asset path with fallback
 */
export const getItemIconById = (itemId, format = 'webp') => {
  debugLog(`Getting item icon by ID: ${itemId}, format: ${format}`);
  
  if (!itemId || itemId === 0) {
    debugLog('No item ID provided or item ID is 0, returning empty string');
    return '';
  }
  
  const itemName = getItemNameFromId(itemId);
  if (!itemName) {
    debugLog('No item name found, returning empty string');
    return '';
  }
  
  // For recipes, use a generic recipe icon
  if (itemName === 'recipe') {
    return getItemIcon('recipe', format);
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