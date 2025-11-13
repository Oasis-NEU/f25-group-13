import { supabase } from './supabase';

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
            .select('external_url, source')
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
    externalUrl: identifier?.external_url || null,
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
 * Search releases by title or artist
 */
export async function searchReleases(searchTerm, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('r_id, title, artist, genre, image, price, release_year')
      .or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching releases:', error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Fetch identifiers and marketplace data separately
    const releasesWithData = await Promise.all(
      data.map(async (release) => {
        const { data: identifiers } = await supabase
          .from('release_identifiers')
          .select('external_url, source')
          .eq('r_id', release.r_id)
          .eq('source', 'discogs')
          .limit(1)
          .single();

        return {
          ...release,
          release_identifiers: identifiers ? [identifiers] : [],
          marketplace_listings: []
        };
      })
    );

    const transformedData = releasesWithData.map(release => transformReleaseData(release));
    return { data: transformedData, error: null };
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
        format,
        release_identifiers (
          external_url,
          source
        ),
        marketplace_listings (
          price,
          currency,
          is_available,
          quantity
        )
      `)
      .eq('r_id', r_id)
      .single();

    if (error) {
      console.error('Error fetching release:', error);
      return { data: null, error };
    }

    // Check if it's a Discogs release
    const identifiers = Array.isArray(data.release_identifiers) 
      ? data.release_identifiers 
      : data.release_identifiers ? [data.release_identifiers] : [];
    const isDiscogs = identifiers.some(id => id?.source === 'discogs');
    
    if (!isDiscogs) {
      return { data: null, error: { message: 'Release not found or not a Discogs release' } };
    }

    return { data: transformReleaseData(data), error: null };
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

