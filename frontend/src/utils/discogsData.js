import { supabase } from './supabase';
import Fuse from 'fuse.js';

/**
 * Test function to check Supabase connection and table structure
 */
export async function testSupabaseConnection() {
  try {
    // First, try a simple query without joins
    const { data: simpleData, error: simpleError } = await supabase
      .from('releases')
      .select('r_id, title, artist')
      .limit(1);
    
    if (simpleError) {
      console.error('Simple query error:', simpleError);
      return { success: false, error: simpleError };
    }
    
    console.log('✅ Simple query successful:', simpleData);
    
    // Try with join
    const { data: joinData, error: joinError } = await supabase
      .from('releases')
      .select(`
        r_id,
        title,
        release_identifiers (
          external_url,
          source
        )
      `)
      .limit(1);
    
    if (joinError) {
      console.error('Join query error:', joinError);
      return { success: false, error: joinError, simpleQuery: true };
    }
    
    console.log('✅ Join query successful:', joinData);
    return { success: true, data: joinData };
  } catch (err) {
    console.error('Test connection error:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch releases from Supabase (populated by node-populate-schema.js)
 * Returns releases with their identifiers and marketplace listings
 * Simplified version - just gets any releases from the database
 */
export async function fetchDiscogsReleases(options = {}) {
  const {
    limit = 12,
    genre = null,
    orderBy = 'r_id',
    orderDirection = 'desc'
  } = options;

  try {
    // Simple query - just get releases directly from the table
    let query = supabase
      .from('releases')
      .select('r_id, title, artist, genre, image, price, release_year, record_label, format')
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .limit(limit);

    // Filter by genre if provided
    if (genre) {
      query = query.eq('genre', genre);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching releases:', error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      console.log('No releases found in database');
      return { data: [], error: null };
    }

    // Try to fetch identifiers and marketplace data separately, but don't fail if it doesn't work
    const releasesWithData = await Promise.allSettled(
      data.map(async (release) => {
        let identifier = null;
        let listing = null;

        try {
          // Fetch identifier (Discogs link)
          const { data: identifiers } = await supabase
            .from('release_identifiers')
            .select('external_url, external_id, source, metadata')
            .eq('r_id', release.r_id)
            .eq('source', 'discogs')
            .limit(1)
            .maybeSingle();
          
          identifier = identifiers;
        } catch (err) {
          console.log('Could not fetch identifier for release', release.r_id);
        }

        try {
          // Fetch marketplace listing
          const { data: marketplaceData } = await supabase
            .from('marketplace_listings')
            .select('price, currency, is_available, quantity')
            .eq('r_id', release.r_id)
            .limit(1)
            .maybeSingle();
          
          listing = marketplaceData;
        } catch (err) {
          console.log('Could not fetch marketplace listing for release', release.r_id);
        }

        return {
          ...release,
          release_identifiers: identifier ? [identifier] : [],
          marketplace_listings: listing ? [listing] : []
        };
      })
    );

    // Extract successful results
    const successfulReleases = releasesWithData
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    // Transform the data to a simpler format
    const transformedData = successfulReleases.map(release => transformReleaseData(release));
    return { data: transformedData, error: null };
  } catch (err) {
    console.error('Error fetching releases:', err);
    return { data: null, error: err };
  }
}

/**
 * Transform Supabase release data to a simpler format for the frontend
 * Matches the structure from node-populate-schema.js:
 * - image field comes from release.thumb or release.cover_image
 * - price comes from marketplace_listings.price or releases.price (lowest_price from Discogs)
 * - external_url comes from release_identifiers (Discogs release page)
 */
function transformReleaseData(release) {
  // Get the first identifier (Discogs link) - should always exist per populate script
  const identifier = Array.isArray(release.release_identifiers) 
    ? release.release_identifiers[0] 
    : release.release_identifiers;

  // Get the first marketplace listing (if available)
  // Note: marketplace_listings may not exist if num_for_sale was 0
  const listing = Array.isArray(release.marketplace_listings) 
    ? release.marketplace_listings[0] 
    : release.marketplace_listings;

  // Extract external URL and ensure it's a web URL, not an API URL
  let externalUrl = identifier?.external_url || null;
  
  // Validate and fix the URL if needed
  if (externalUrl) {
    // If URL contains 'api.discogs.com', convert it to web URL
    if (externalUrl.includes('api.discogs.com')) {
      console.warn(`⚠️ Found API URL in database, converting to web URL: ${externalUrl}`);
      // Extract release ID from API URL and convert to web URL
      const releaseIdMatch = externalUrl.match(/releases\/(\d+)/);
      if (releaseIdMatch) {
        externalUrl = `https://www.discogs.com/release/${releaseIdMatch[1]}`;
        console.log(`✅ Converted to web URL: ${externalUrl}`);
      }
    }
    
    // Ensure it's a valid Discogs web URL format
    if (!externalUrl.match(/^https:\/\/www\.discogs\.com\/release\/\d+/)) {
      console.warn(`⚠️ Invalid Discogs URL format: ${externalUrl}`);
      externalUrl = null; // Reset if invalid format
    }
  }
  
  // If we have an external_id but no valid external_url, construct it
  if (!externalUrl && identifier?.external_id) {
    externalUrl = `https://www.discogs.com/release/${identifier.external_id}`;
    console.log(`✅ Constructed URL from external_id: ${externalUrl}`);
  }
  
  // Fallback: try to get discogs ID from metadata
  if (!externalUrl && identifier?.metadata?.api_url) {
    const releaseIdMatch = identifier.metadata.api_url.match(/releases\/(\d+)/);
    if (releaseIdMatch) {
      externalUrl = `https://www.discogs.com/release/${releaseIdMatch[1]}`;
      console.log(`✅ Constructed URL from metadata: ${externalUrl}`);
    }
  }
  
  // Final validation: ensure URL is properly formatted
  if (externalUrl && !externalUrl.startsWith('https://www.discogs.com/release/')) {
    console.error(`❌ Invalid URL format: ${externalUrl}`);
    externalUrl = null;
  }

  return {
    id: release.r_id,
    title: release.title || 'Unknown Title',
    artist: release.artist || 'Unknown Artist',
    // Price priority: marketplace_listings.price (lowest from Discogs) > releases.price > null
    price: listing?.price || release.price || null,
    currency: listing?.currency || 'USD',
    // Image from releases.image (populated from release.thumb or release.cover_image)
    imageUrl: release.image || null,
    // External URL from release_identifiers.external_url (Discogs release page)
    externalUrl: externalUrl,
    externalSource: 'discogs',
    genre: release.genre || null,
    releaseYear: release.release_year || null,
    recordLabel: release.record_label || null,
    format: release.format || null,
    isAvailable: listing?.is_available ?? true,
    quantity: listing?.quantity || 0,
  };
}

/**
 * Search releases by title or artist using fuzzy search
 * Uses Fuse.js for typo-tolerant matching
 */
export async function searchReleases(searchTerm, limit = 20) {
  try {
    // Fetch a larger set of releases to search through (fuzzy search will filter)
    const { data, error } = await supabase
      .from('releases')
      .select('r_id, title, artist, genre, image, price, release_year')
      .limit(500); // Fetch more records for fuzzy search to work on

    if (error) {
      console.error('Error fetching releases:', error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Additionally fetch user-created marketplace listings (if RLS allows)
    let userListings = [];
    try {
      const { data: mlData } = await supabase
        .from('marketplace_listings')
        .select('name, external_url, price, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (mlData && mlData.length > 0) {
        userListings = mlData
          .filter(row => !!row.name) // must have a name to search by
          .map(row => ({
            // shape compatible with Fuse search keys
            id: `ml-${row.created_at}-${row.external_url}`,
            title: row.name || 'User Listing',
            artist: '',
            genre: null,
            imageUrl: null,
            releaseYear: null,
            // external URL and pricing
            externalUrl: row.external_url || null,
            price: row.price || null,
            currency: 'USD',
            // mark as user listing
            isUserListing: true,
          }));
      }
    } catch (e) {
      // Ignore errors fetching marketplace listings (likely due to RLS)
    }

    // Configure Fuse.js for fuzzy search
    const fuseOptions = {
      keys: [
        { name: 'title', weight: 0.6 }, // Title is slightly more important
        { name: 'artist', weight: 0.4 }
      ],
      threshold: 0.5, // 0.0 = exact match, 1.0 = match anything (lower = stricter) - increased for more lenient matching
      includeScore: true, // Include relevance score
      minMatchCharLength: 1, // Minimum characters to match - reduced to 1
      ignoreLocation: true, // Don't care about where in the string the match is
      findAllMatches: true, // Find all matches, not just the first
      shouldSort: true, // Sort results by score
    };

    // Transform release rows first
    const baseTransformed = data;

    // Create combined array: transformed releases → enrich after Fuse result, plus user listings already shaped
    const combinedForSearch = [
      ...baseTransformed.map(r => ({
        id: r.r_id,
        title: r.title,
        artist: r.artist,
      })),
      ...userListings.map(u => ({
        id: u.id,
        title: u.title,
        artist: u.artist,
        isUserListing: true,
      })),
    ];

    // Create Fuse instance and search across combined set
    const fuse = new Fuse(combinedForSearch, fuseOptions);
    const searchResults = fuse.search(searchTerm);

    // Get top results (limited by limit parameter)
    const topResults = searchResults
      .slice(0, limit)
      .map(result => result.item);

    if (topResults.length === 0) {
      return { data: [], error: null };
    }

    // For each top item:
    // - if user listing, we already have full shape in userListings; find and return it
    // - else it's a release: fetch identifiers and marketplace data and transform
    const transformedData = await Promise.all(
      topResults.map(async (item) => {
        if (item.isUserListing) {
          // find pre-shaped user listing
          const found = userListings.find(u => u.id === item.id);
          return found || null;
        }
        // else treat as normal release by r_id
        const r_id = item.id;
        const { data: full } = await supabase
          .from('releases')
          .select('r_id, title, artist, genre, image, price, release_year')
          .eq('r_id', r_id)
          .single();
        if (!full) return null;
        // Attach identifier/listing like earlier path
        let identifier = null;
        let listing = null;
        try {
          const { data: identifiers } = await supabase
            .from('release_identifiers')
            .select('external_url, external_id, source, metadata')
            .eq('r_id', r_id)
            .eq('source', 'discogs')
            .limit(1)
            .maybeSingle();
          identifier = identifiers;
        } catch {}
        try {
          const { data: marketplaceData } = await supabase
            .from('marketplace_listings')
            .select('price, currency, is_available, quantity')
            .eq('r_id', r_id)
            .limit(1)
            .maybeSingle();
          listing = marketplaceData;
        } catch {}
        const combined = {
          ...full,
          release_identifiers: identifier ? [identifier] : [],
          marketplace_listings: listing ? [listing] : [],
        };
        return transformReleaseData(combined);
      })
    );
    
    // Deduplicate by title and artist (case-insensitive)
    const uniqueResults = [];
    const seen = new Set();
    
    transformedData.filter(Boolean).forEach(vinyl => {
      const key = `${vinyl.title?.toLowerCase().trim()}_${vinyl.artist?.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(vinyl);
      }
    });
    
    return { data: uniqueResults, error: null };
  } catch (err) {
    console.error('Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch a single release by ID
 */
export async function fetchReleaseById(r_id) {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select(`
        r_id,
        title,
        artist,
        genre,
        image,
        price,
        release_year,
        record_label,
        format
      `)
      .eq('r_id', r_id)
      .single();

    if (error) {
      console.error('Error fetching release:', error);
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Release not found' } };
    }

    // Fetch identifiers and marketplace data separately
    let identifier = null;
    let listing = null;

    try {
      const { data: identifiers, error: identifierError } = await supabase
        .from('release_identifiers')
        .select('external_url, external_id, source, metadata')
        .eq('r_id', r_id)
        .eq('source', 'discogs')
        .limit(1)
        .maybeSingle();
      
      if (identifierError) {
        console.error('Error fetching identifier:', identifierError);
      } else {
        identifier = identifiers;
        console.log(`✅ Fetched identifier for release ${r_id}:`, {
          external_url: identifiers?.external_url,
          external_id: identifiers?.external_id,
          isApiUrl: identifiers?.external_url?.includes('api.discogs.com')
        });
      }
    } catch (err) {
      console.error('Exception fetching identifier for release', r_id, err);
    }

    try {
      const { data: marketplaceData } = await supabase
        .from('marketplace_listings')
        .select('price, currency, is_available, quantity')
        .eq('r_id', r_id)
        .limit(1)
        .maybeSingle();
      
      listing = marketplaceData;
    } catch (err) {
      console.log('Could not fetch marketplace listing for release', r_id);
    }

    const releaseWithData = {
      ...data,
      release_identifiers: identifier ? [identifier] : [],
      marketplace_listings: listing ? [listing] : []
    };

    const transformed = transformReleaseData(releaseWithData);
    console.log(`✅ Transformed release ${r_id}, externalUrl:`, transformed.externalUrl);
    
    return { data: transformed, error: null };
  } catch (err) {
    console.error('Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch releases by genre
 */
export async function fetchReleasesByGenre(genre, limit = 20) {
  return fetchDiscogsReleases({ genre, limit });
}

