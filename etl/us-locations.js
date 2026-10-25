/**
 * US States & Territories list (matches original twitterCalcs/happiest_state.py)
 * and location detection utilities for Bluesky posts and author profiles.
 */

export const STATES = [
    'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC',
    'FM', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
    'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
    'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP',
    'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN',
    'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const STATE_SET = new Set(STATES);

/**
 * Full state/territory names mapped to 2-letter code.
 * Ordered longest-first so multi-word names match before substrings
 * (e.g., "West Virginia" before "Virginia").
 */
export const STATE_NAMES = [
    ['district of columbia', 'DC'],
    ['northern mariana islands', 'MP'],
    ['marshall islands', 'MH'],
    ['american samoa', 'AS'],
    ['virgin islands', 'VI'],
    ['west virginia', 'WV'],
    ['new hampshire', 'NH'],
    ['new jersey', 'NJ'],
    ['new mexico', 'NM'],
    ['new york', 'NY'],
    ['north carolina', 'NC'],
    ['north dakota', 'ND'],
    ['rhode island', 'RI'],
    ['south carolina', 'SC'],
    ['south dakota', 'SD'],
    ['puerto rico', 'PR'],
    ['washington dc', 'DC'],
    ['washington d.c.', 'DC'],
    ['alabama', 'AL'],
    ['alaska', 'AK'],
    ['arizona', 'AZ'],
    ['arkansas', 'AR'],
    ['california', 'CA'],
    ['colorado', 'CO'],
    ['connecticut', 'CT'],
    ['delaware', 'DE'],
    ['florida', 'FL'],
    ['georgia', 'GA'],
    ['guam', 'GU'],
    ['hawaii', 'HI'],
    ['idaho', 'ID'],
    ['illinois', 'IL'],
    ['indiana', 'IN'],
    ['iowa', 'IA'],
    ['kansas', 'KS'],
    ['kentucky', 'KY'],
    ['louisiana', 'LA'],
    ['maine', 'ME'],
    ['maryland', 'MD'],
    ['massachusetts', 'MA'],
    ['michigan', 'MI'],
    ['minnesota', 'MN'],
    ['mississippi', 'MS'],
    ['missouri', 'MO'],
    ['montana', 'MT'],
    ['nebraska', 'NE'],
    ['nevada', 'NV'],
    ['ohio', 'OH'],
    ['oklahoma', 'OK'],
    ['oregon', 'OR'],
    ['pennsylvania', 'PA'],
    ['tennessee', 'TN'],
    ['texas', 'TX'],
    ['utah', 'UT'],
    ['vermont', 'VT'],
    ['virginia', 'VA'],
    ['washington', 'WA'],
    ['wisconsin', 'WI'],
    ['wyoming', 'WY']
];

/**
 * Major US cities & metro areas mapped to their 2-letter state code.
 */
export const MAJOR_CITIES = [
    ['new york city', 'NY'],
    ['los angeles', 'CA'],
    ['san francisco', 'CA'],
    ['san diego', 'CA'],
    ['san jose', 'CA'],
    ['san antonio', 'TX'],
    ['fort worth', 'TX'],
    ['el paso', 'TX'],
    ['las vegas', 'NV'],
    ['salt lake city', 'UT'],
    ['kansas city', 'MO'],
    ['st. louis', 'MO'],
    ['st louis', 'MO'],
    ['saint louis', 'MO'],
    ['st. paul', 'MN'],
    ['saint paul', 'MN'],
    ['new orleans', 'LA'],
    ['baton rouge', 'LA'],
    ['oklahoma city', 'OK'],
    ['virginia beach', 'VA'],
    ['colorado springs', 'CO'],
    ['ann arbor', 'MI'],
    ['grand rapids', 'MI'],
    ['green bay', 'WI'],
    ['des moines', 'IA'],
    ['little rock', 'AR'],
    ['sioux falls', 'SD'],
    ['fargo', 'ND'],
    ['cheyenne', 'WY'],
    ['billings', 'MT'],
    ['bozeman', 'MT'],
    ['missoula', 'MT'],
    ['burlington', 'VT'],
    ['manchester', 'NH'],
    ['providence', 'RI'],
    ['hartford', 'CT'],
    ['new haven', 'CT'],
    ['bridgeport', 'CT'],
    ['wilmington', 'DE'],
    ['charleston', 'SC'],
    ['MORGANTOWN'.toLowerCase(), 'WV'],
    ['honolulu', 'HI'],
    ['anchorage', 'AK'],
    ['fairbanks', 'AK'],
    ['juneau', 'AK'],
    ['seattle', 'WA'],
    ['spokane', 'WA'],
    ['tacoma', 'WA'],
    ['bellevue', 'WA'],
    ['portland', 'OR'],
    ['eugene', 'OR'],
    ['salem', 'OR'],
    ['sacramento', 'CA'],
    ['oakland', 'CA'],
    ['fresno', 'CA'],
    ['long beach', 'CA'],
    ['anaheim', 'CA'],
    ['irvine', 'CA'],
    ['pasadena', 'CA'],
    ['berkeley', 'CA'],
    ['reno', 'NV'],
    ['phoenix', 'AZ'],
    ['tucson', 'AZ'],
    ['mesa', 'AZ'],
    ['scottsdale', 'AZ'],
    ['tempe', 'AZ'],
    ['albuquerque', 'NM'],
    ['santa fe', 'NM'],
    ['denver', 'CO'],
    ['boulder', 'CO'],
    ['aurora', 'CO'],
    ['boise', 'ID'],
    ['omaha', 'NE'],
    ['lincoln', 'NE'],
    ['wichita', 'KS'],
    ['topeka', 'KS'],
    ['tulsa', 'OK'],
    ['dallas', 'TX'],
    ['houston', 'TX'],
    ['austin', 'TX'],
    ['plano', 'TX'],
    ['arlington', 'TX'],
    ['corpus christi', 'TX'],
    ['lubbock', 'TX'],
    ['minneapolis', 'MN'],
    ['duluth', 'MN'],
    ['milwaukee', 'WI'],
    ['madison', 'WI'],
    ['chicago', 'IL'],
    ['evanston', 'IL'],
    ['peoria', 'IL'],
    ['detroit', 'MI'],
    ['lansing', 'MI'],
    ['indianapolis', 'IN'],
    ['bloomington', 'IN'],
    ['fort wayne', 'IN'],
    ['columbus', 'OH'],
    ['cleveland', 'OH'],
    ['cincinnati', 'OH'],
    ['toledo', 'OH'],
    ['akron', 'OH'],
    ['dayton', 'OH'],
    ['louisville', 'KY'],
    ['lexington', 'KY'],
    ['nashville', 'TN'],
    ['memphis', 'TN'],
    ['knoxville', 'TN'],
    ['chattanooga', 'TN'],
    ['birmingham', 'AL'],
    ['huntsville', 'AL'],
    ['montgomery', 'AL'],
    ['mobile', 'AL'],
    ['Atlanta'.toLowerCase(), 'GA'],
    ['savannah', 'GA'],
    ['augusta', 'GA'],
    ['miami', 'FL'],
    ['orlando', 'FL'],
    ['tampa', 'FL'],
    ['jacksonville', 'FL'],
    ['tallahassee', 'FL'],
    ['fort lauderdale', 'FL'],
    ['st. petersburg', 'FL'],
    ['sarasota', 'FL'],
    ['charlotte', 'NC'],
    ['raleigh', 'NC'],
    ['durham', 'NC'],
    ['greensboro', 'NC'],
    ['asheville', 'NC'],
    ['richmond', 'VA'],
    ['norfolk', 'VA'],
    ['arlington', 'VA'],
    ['alexandria', 'VA'],
    ['baltimore', 'MD'],
    ['annapolis', 'MD'],
    ['bethesda', 'MD'],
    ['philadelphia', 'PA'],
    ['pittsburgh', 'PA'],
    ['harrisburg', 'PA'],
    ['allentown', 'PA'],
    ['newark', 'NJ'],
    ['jersey city', 'NJ'],
    ['hoboken', 'NJ'],
    ['princeton', 'NJ'],
    ['trenton', 'NJ'],
    ['brooklyn', 'NY'],
    ['manhattan', 'NY'],
    ['queens', 'NY'],
    ['bronx', 'NY'],
    ['staten island', 'NY'],
    ['buffalo', 'NY'],
    ['rochester', 'NY'],
    ['syracuse', 'NY'],
    ['albany', 'NY'],
    ['boston', 'MA'],
    ['cambridge', 'MA'],
    ['worcester', 'MA'],
    ['somerville', 'MA']
];

/**
 * Common state/city hashtags mapped to 2-letter state code.
 */
export const HASHTAG_TO_STATE = new Map([
    ['ny', 'NY'], ['nyc', 'NY'], ['newyork', 'NY'], ['brooklyn', 'NY'], ['manhattan', 'NY'], ['buffalo', 'NY'],
    ['ca', 'CA'], ['california', 'CA'], ['la', 'CA'], ['losangeles', 'CA'], ['sf', 'CA'], ['sanfrancisco', 'CA'], ['sandiego', 'CA'], ['bayarea', 'CA'], ['socal', 'CA'], ['norcal', 'CA'],
    ['tx', 'TX'], ['texas', 'TX'], ['txlege', 'TX'], ['houston', 'TX'], ['austin', 'TX'], ['atx', 'TX'], ['htx', 'TX'], ['dfw', 'TX'], ['dallas', 'TX'], ['sanantonio', 'TX'],
    ['fl', 'FL'], ['florida', 'FL'], ['miami', 'FL'], ['orlando', 'FL'], ['tampa', 'FL'], ['jacksonville', 'FL'],
    ['il', 'IL'], ['illinois', 'IL'], ['chicago', 'IL'], ['twill', 'IL'],
    ['pa', 'PA'], ['pennsylvania', 'PA'], ['philly', 'PA'], ['philadelphia', 'PA'], ['pittsburgh', 'PA'],
    ['oh', 'OH'], ['ohio', 'OH'], ['columbus', 'OH'], ['cleveland', 'OH'], ['cincinnati', 'OH'],
    ['ga', 'GA'], ['georgia', 'GA'], ['atlanta', 'GA'], ['atl', 'GA'], ['gapol', 'GA'],
    ['nc', 'NC'], ['northcarolina', 'NC'], ['ncpol', 'NC'], ['charlotte', 'NC'], ['raleigh', 'NC'],
    ['mi', 'MI'], ['michigan', 'MI'], ['detroit', 'MI'], ['mileg', 'MI'],
    ['nj', 'NJ'], ['newjersey', 'NJ'],
    ['va', 'VA'], ['virginia', 'VA'], ['valeg', 'VA'], ['nova', 'VA'], ['rva', 'VA'],
    ['wa', 'WA'], ['washington', 'WA'], ['seattle', 'WA'], ['waleg', 'WA'], ['pnw', 'WA'],
    ['az', 'AZ'], ['arizona', 'AZ'], ['phoenix', 'AZ'], ['tucson', 'AZ'],
    ['ma', 'MA'], ['massachusetts', 'MA'], ['boston', 'MA'], ['mapoli', 'MA'],
    ['tn', 'TN'], ['tennessee', 'TN'], ['nashville', 'TN'], ['memphis', 'TN'],
    ['in', 'IN'], ['indiana', 'IN'], ['indianapolis', 'IN'], ['indy', 'IN'],
    ['mo', 'MO'], ['missouri', 'MO'], ['stlouis', 'MO'], ['stl', 'MO'], ['kc', 'MO'], ['kansascity', 'MO'],
    ['md', 'MD'], ['maryland', 'MD'], ['baltimore', 'MD'],
    ['wi', 'WI'], ['wisconsin', 'WI'], ['milwaukee', 'WI'], ['madison', 'WI'], ['wipolitics', 'WI'],
    ['co', 'CO'], ['colorado', 'CO'], ['denver', 'CO'], ['boulder', 'CO'], ['coleg', 'CO'],
    ['mn', 'MN'], ['minnesota', 'MN'], ['minneapolis', 'MN'], ['twincities', 'MN'], ['mnleg', 'MN'],
    ['sc', 'SC'], ['southcarolina', 'SC'], ['charleston', 'SC'],
    ['al', 'AL'], ['alabama', 'AL'], ['birmingham', 'AL'], ['alpolitics', 'AL'],
    ['la', 'LA'], ['louisiana', 'LA'], ['neworleans', 'LA'], ['nola', 'LA'], ['lalege', 'LA'],
    ['ky', 'KY'], ['kentucky', 'KY'], ['louisville', 'KY'], ['lexington', 'KY'],
    ['or', 'OR'], ['oregon', 'OR'], ['portland', 'OR'], ['pdx', 'OR'], ['orpol', 'OR'],
    ['ok', 'OK'], ['oklahoma', 'OK'], ['okc', 'OK'], ['tulsa', 'OK'],
    ['ct', 'CT'], ['connecticut', 'CT'], ['hartford', 'CT'], ['newhaven', 'CT'],
    ['ut', 'UT'], ['utah', 'UT'], ['slc', 'UT'], ['saltlakecity', 'UT'], ['utpol', 'UT'],
    ['ia', 'IA'], ['iowa', 'IA'], ['desmoines', 'IA'], ['iapolitics', 'IA'],
    ['nv', 'NV'], ['nevada', 'NV'], ['vegas', 'NV'], ['lasvegas', 'NV'], ['reno', 'NV'],
    ['ar', 'AR'], ['arkansas', 'AR'], ['arpx', 'AR'], ['littlerock', 'AR'],
    ['ms', 'MS'], ['mississippi', 'MS'], ['msleg', 'MS'],
    ['ks', 'KS'], ['kansas', 'KS'], ['ksleg', 'KS'], ['wichita', 'KS'],
    ['nm', 'NM'], ['newmexico', 'NM'], ['nmleg', 'NM'], ['albuquerque', 'NM'], ['santafe', 'NM'],
    ['ne', 'NE'], ['nebraska', 'NE'], ['neleg', 'NE'], ['omaha', 'NE'],
    ['id', 'ID'], ['idaho', 'ID'], ['idpol', 'ID'], ['boise', 'ID'],
    ['wv', 'WV'], ['westvirginia', 'WV'], ['wvpol', 'WV'],
    ['hi', 'HI'], ['hawaii', 'HI'], ['honolulu', 'HI'], ['oahu', 'HI'], ['maui', 'HI'],
    ['nh', 'NH'], ['newhampshire', 'NH'], ['nhpolitics', 'NH'],
    ['me', 'ME'], ['maine', 'ME'], ['mepolitics', 'ME'],
    ['ri', 'RI'], ['rhodeisland', 'RI'], ['providence', 'RI'],
    ['mt', 'MT'], ['montana', 'MT'], ['mtpol', 'MT'], ['bozeman', 'MT'], ['missoula', 'MT'],
    ['de', 'DE'], ['delaware', 'DE'], ['wilmington', 'DE'], ['netde', 'DE'],
    ['sd', 'SD'], ['southdakota', 'SD'], ['sdleg', 'SD'],
    ['nd', 'ND'], ['northdakota', 'ND'], ['ndleg', 'ND'], ['fargo', 'ND'],
    ['ak', 'AK'], ['alaska', 'AK'], ['anchorage', 'AK'], ['akleg', 'AK'],
    ['dc', 'DC'], ['washingtondc', 'DC'], ['dmv', 'DC'],
    ['vt', 'VT'], ['vermont', 'VT'], ['vtpoli', 'VT'], ['burlington', 'VT'],
    ['wy', 'WY'], ['wyoming', 'WY'], ['wyleg', 'WY'],
    ['pr', 'PR'], ['puertorico', 'PR'], ['sanjuan', 'PR'],
    ['gu', 'GU'], ['guam', 'GU'],
    ['vi', 'VI'], ['usvi', 'VI']
]);

// Pre-compile regexes for fast matching over stream
const CITY_STATE_ABBR_REGEX = /\b([A-Z][a-zA-Z .'-]{1,25}),\s*([A-Z]{2})\b/g;

const COMPILED_STATE_NAMES = STATE_NAMES.map(([name, code]) => ({
    code,
    regex: new RegExp(`\\b${name.replace(/\./g, '\\.')}\\b`, 'i')
}));

const COMPILED_CITIES = MAJOR_CITIES.map(([city, code]) => ({
    code,
    regex: new RegExp(`\\b${city.replace(/\./g, '\\.')}\\b`, 'i')
}));

// Bio location markers like "📍 TX", "Based in NY", "From CA"
const BIO_ABBR_CONTEXT_REGEX = /(?:📍|based in|living in|located in|from|in)\s+([A-Za-z .'-]+,\s*)?([A-Z]{2})\b/g;

/**
 * Attempts to detect a US state code (e.g. 'CA', 'NY') from a single text string
 * (such as post text or an author profile bio).
 *
 * @param {string} text
 * @returns {string|null} 2-letter US state code or null
 */
export function detectStateInText(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }

    // 1. Check "City, ST" pattern (case-sensitive uppercase 2-letter state abbreviation after comma)
    CITY_STATE_ABBR_REGEX.lastIndex = 0;
    let match;
    while ((match = CITY_STATE_ABBR_REGEX.exec(text)) !== null) {
        const candidate = match[2];
        if (STATE_SET.has(candidate)) {
            return candidate;
        }
    }

    // 2. Check bio/location phrases with uppercase 2-letter state codes (e.g., "📍 WA", "based in TX")
    BIO_ABBR_CONTEXT_REGEX.lastIndex = 0;
    while ((match = BIO_ABBR_CONTEXT_REGEX.exec(text)) !== null) {
        const candidate = match[2];
        if (STATE_SET.has(candidate)) {
            return candidate;
        }
    }

    // 3. Check major US cities
    for (const { code, regex } of COMPILED_CITIES) {
        if (regex.test(text)) {
            return code;
        }
    }

    // 4. Check full US state/territory names
    for (const { code, regex } of COMPILED_STATE_NAMES) {
        if (regex.test(text)) {
            return code;
        }
    }

    return null;
}

const NSFW_HASHTAGS = new Set([
    'nsfw', 'porn', 'xxx', 'nude', 'nudes', 'onlyfans', 'sex', 'hentai',
    'shemale', 'fetish', 'bdsm', 'erotica', 'nsfwtwt', 'nsfwart', 'lewd',
    'rule34', 'r34', 'gayporn', 'transporn', 'milf', 'slut', 'cock', 'pussy', 'boobs'
]);

function isValidHashtag(tag) {
    if (!tag || tag.length < 2 || tag.length > 64) return false;
    // Ignore pure numbers or hex color/hash codes
    if (/^\d+$/.test(tag)) return false;
    if (/^[0-9a-f]{6,16}$/i.test(tag)) return false;
    if (NSFW_HASHTAGS.has(tag)) return false;
    return true;
}

/**
 * Extracts all hashtags from a post (supporting both Bluesky Jetstream records and legacy Twitter records).
 *
 * @param {object} post
 * @returns {string[]} Lowercase hashtag strings (without leading '#')
 */
export function extractPostHashtags(post) {
    if (!post || typeof post !== 'object') {
        return [];
    }

    const tags = new Set();

    // Legacy Twitter format: entities.hashtags[].text
    if (Array.isArray(post?.entities?.hashtags)) {
        for (const h of post.entities.hashtags) {
            if (h?.text) {
                const cleaned = String(h.text).toLowerCase();
                if (isValidHashtag(cleaned)) tags.add(cleaned);
            }
        }
    }

    // Bluesky record (either nested under commit.record or top-level record)
    const record = post?.commit?.record ?? post?.record ?? post;

    // 1. Bluesky facets (app.bsky.richtext.facet#tag)
    if (Array.isArray(record?.facets)) {
        for (const facet of record.facets) {
            if (Array.isArray(facet?.features)) {
                for (const feat of facet.features) {
                    if (feat?.$type === 'app.bsky.richtext.facet#tag' && feat.tag) {
                        const cleaned = String(feat.tag).replace(/^#+/, '').toLowerCase();
                        if (isValidHashtag(cleaned)) tags.add(cleaned);
                    }
                }
            }
        }
    }

    // 2. Bluesky record.tags array
    if (Array.isArray(record?.tags)) {
        for (const tag of record.tags) {
            if (tag) {
                const cleaned = String(tag).replace(/^#+/, '').toLowerCase();
                if (isValidHashtag(cleaned)) tags.add(cleaned);
            }
        }
    }

    // 3. Inline #hashtags in post text (if facets weren't populated)
    const text = record?.text ?? post?.text;
    if (typeof text === 'string' && tags.size === 0) {
        const inlineMatches = text.matchAll(/(?:^|\s)#([a-zA-Z0-9_]{2,64})/g);
        for (const m of inlineMatches) {
            const cleaned = m[1].toLowerCase();
            if (isValidHashtag(cleaned)) tags.add(cleaned);
        }
    }

    return Array.from(tags);
}

/**
 * Determines the 2-letter US state for a post (supporting both Bluesky Jetstream posts and legacy Twitter posts).
 *
 * @param {object} post
 * @returns {string|null} 2-letter US state code in STATES, or null if not detected
 */
export function detectUSState(post) {
    if (!post || typeof post !== 'object') {
        return null;
    }

    // 1. Legacy Twitter `place` support (backward compatible with twitterCalcs/happiest_state.py)
    if (post.place && post.place.country_code === 'US') {
        const placeType = post.place.place_type;
        const fullName = post.place.full_name || '';
        if (placeType === 'city' && fullName.includes(',')) {
            const parts = fullName.split(',');
            const stateCode = parts[parts.length - 1].trim().toUpperCase();
            if (STATE_SET.has(stateCode)) {
                return stateCode;
            }
        } else if (placeType === 'state') {
            const stateFromName = detectStateInText(fullName);
            if (stateFromName) {
                return stateFromName;
            }
        }
    }

    // 2. Explicit pre-resolved state field if attached during extraction
    if (post.detectedState && STATE_SET.has(post.detectedState)) {
        return post.detectedState;
    }

    const record = post?.commit?.record ?? post?.record ?? post;

    // Filter out non-English posts when langs is explicitly set on Bluesky
    if (Array.isArray(record?.langs) && record.langs.length > 0) {
        const hasEnglish = record.langs.some((l) => typeof l === 'string' && l.toLowerCase().startsWith('en'));
        if (!hasEnglish) {
            return null;
        }
    }

    // 3. Check hashtags for state/city tags
    const hashtags = extractPostHashtags(post);
    for (const tag of hashtags) {
        if (HASHTAG_TO_STATE.has(tag)) {
            return HASHTAG_TO_STATE.get(tag);
        }
    }

    // 4. Check post text for US state/city mentions
    const text = record?.text ?? post?.text ?? '';
    const stateFromText = detectStateInText(text);
    if (stateFromText) {
        return stateFromText;
    }

    // 5. Check attached author profile bio / displayName if enriched
    if (post.authorProfile) {
        const stateFromBio =
            detectStateInText(post.authorProfile.description) ||
            detectStateInText(post.authorProfile.displayName);
        if (stateFromBio) {
            return stateFromBio;
        }
    }

    return null;
}
