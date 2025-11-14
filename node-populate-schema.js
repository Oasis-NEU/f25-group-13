import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
const supabaseUrl = 'https://xpnituwepyjmefqhrnqq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwbml0dXdlcHlqbWVmcWhybnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjc1NTYsImV4cCI6MjA3NTg0MzU1Nn0.R2dgZWoOorzinUwmcByy4WOdVGdAheeYGUkD5GfIRo0'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Discogs API Configuration
const DISCOGS_KEY = 'kChJKrdwweVQlhSbzBBb'
const DISCOGS_SECRET = 'yrieebTtgXMUsNhqLKwUqjjdHcyngTsl'
const DISCOGS_BASE_URL = 'https://api.discogs.com'

// Settings
const RATE_LIMIT_DELAY = 2000 // 2 seconds between API calls
const FETCH_MARKETPLACE_DATA = true // Get lowest price and availability

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Major record labels
const LABELS = {
  test: [
    { id: 5131, name: 'Sub Pop Records' },
    { id: 157, name: 'Motown' },
  ],
}

const ALL_LABELS = [
  ...LABELS.test,
].filter(label => label.id !== null)

/**
 * Fetch releases from a specific Discogs label
 */
async function fetchLabelReleases(labelId, labelName, maxPages = 10) {
  console.log(`\n Fetching releases for label: ${labelName} (ID: ${labelId})`)
  
  let allReleases = []
  let page = 1
  
  try {
    while (page <= maxPages) {
      console.log(`  Page ${page}/${maxPages}...`)
      
      const url = `${DISCOGS_BASE_URL}/labels/${labelId}/releases?page=${page}&per_page=100&key=${DISCOGS_KEY}&secret=${DISCOGS_SECRET}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 429) {
          console.error(` Rate limit hit! Wait an hour and try again.`)
        } else {
          console.error(` Error: ${response.status} ${response.statusText}`)
        }
        break
      }
      
      const data = await response.json()
      
      if (!data.releases || data.releases.length === 0) {
        console.log(` No more releases found`)
        break
      }
      
      allReleases = allReleases.concat(data.releases)
      console.log(` Fetched ${data.releases.length} releases (Total: ${allReleases.length})`)
      
      if (!data.pagination?.urls?.next) {
        break
      }
      
      page++
      await sleep(RATE_LIMIT_DELAY)
    }
    
    return allReleases
  } catch (error) {
    console.error(` Error fetching releases:`, error.message)
    return allReleases
  }
}

/**
 * Fetch marketplace statistics for a release
 * This gets: lowest price, number for sale, blocked status
 */
async function fetchMarketplaceStats(releaseId) {
  if (!FETCH_MARKETPLACE_DATA) {
    return null
  }
  
  try {
    const url = `${DISCOGS_BASE_URL}/marketplace/stats/${releaseId}?key=${DISCOGS_KEY}&secret=${DISCOGS_SECRET}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log(` Rate limit hit`)
      }
      return null
    }
    
    const data = await response.json()
    
    // Return marketplace stats
    return {
      lowest_price: data.lowest_price?.value || null,
      currency: data.lowest_price?.currency || 'USD',
      num_for_sale: data.num_for_sale || 0,
      blocked_from_sale: data.blocked_from_sale || false,
    }
  } catch (error) {
    return null
  }
}

/**
 * Transform Discogs release to our releases table format
 */
function transformRelease(release, labelName, marketplaceStats) {
  return {
    title: release.title || 'Unknown Title',
    artist: release.artist || 'Unknown Artist',
    genre: release.genre && release.genre.length > 0 ? release.genre[0] : null,
    format: release.format || 'Unknown',
    image: release.thumb || release.cover_image || null,
    format_details: release.format || null,
    release_year: release.year || null,
    record_label: labelName,
    catalog_number: release.catno || null,
    country_of_origin: null,
    // Add marketplace stats if available
    price: marketplaceStats?.lowest_price || null,
    condition: marketplaceStats?.num_for_sale > 0 ? 'Multiple conditions available' : null,
  }
}

/**
 * Insert a release and get its ID
 */
async function insertRelease(releaseData) {
  try {
    const { data, error } = await supabase
      .from('releases')
      .insert(releaseData)
      .select('r_id')
      .single()
    
    if (error) {
      console.error(` Error inserting release:`, error.message)
      return null
    }
    
    return data.r_id
  } catch (err) {
    console.error(` Exception inserting release:`, err.message)
    return null
  }
}

/**
 * Insert release identifier (Discogs ID mapping)
 */
async function insertReleaseIdentifier(r_id, discogsId) {
  try {
    const discogsReleaseUrl = `https://www.discogs.com/release/${discogsId}`
    const discogsApiUrl = `https://api.discogs.com/releases/${discogsId}`
    
    const { error } = await supabase
      .from('release_identifiers')
      .insert({
        r_id,
        source: 'discogs',
        external_id: discogsId.toString(),
        external_url: discogsReleaseUrl, // User-facing URL to browse marketplace
        metadata: {
          api_url: discogsApiUrl,
        },
        last_synced: new Date().toISOString(),
      })
    
    if (error) {
      console.error(` Error inserting identifier:`, error.message)
    }
  } catch (err) {
    console.error(` Exception inserting identifier:`, err.message)
  }
}

/**
 * Insert marketplace reference (just the stats, not individual listings)
 */
async function insertMarketplaceReference(r_id, marketplaceStats) {
  if (!marketplaceStats || marketplaceStats.num_for_sale === 0) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('marketplace_listings')
      .insert({
        r_id,
        source: 'discogs',
        external_id: null, // No specific listing ID
        external_url: null, // URL is in release_identifiers
        price: marketplaceStats.lowest_price,
        currency: marketplaceStats.currency,
        condition: 'Various', // Multiple conditions available on Discogs
        sleeve_condition: null,
        seller_name: 'Multiple Sellers', // Multiple sellers available
        is_available: !marketplaceStats.blocked_from_sale,
        quantity: marketplaceStats.num_for_sale,
        shipping_cost: null,
        location: 'Various',
        metadata: {
          type: 'aggregated_stats',
          num_for_sale: marketplaceStats.num_for_sale,
          note: 'Click release link to view all listings on Discogs',
        },
        last_updated: new Date().toISOString(),
      })
    
    if (error) {
      console.error(` Error inserting marketplace reference:`, error.message)
    }
  } catch (err) {
    console.error(` Exception inserting marketplace reference:`, err.message)
  }
}

/**
 * Process a single release
 */
async function processRelease(release, labelName, index, total) {
  console.log(`  [${index + 1}/${total}] Processing: ${release.title} by ${release.artist}`)
  
  // Fetch marketplace stats
  let marketplaceStats = null
  if (FETCH_MARKETPLACE_DATA && release.id) {
    console.log(`    🔍 Fetching marketplace stats...`)
    marketplaceStats = await fetchMarketplaceStats(release.id)
    
    if (marketplaceStats) {
      if (marketplaceStats.num_for_sale > 0) {
        console.log(` ${marketplaceStats.num_for_sale} for sale, lowest: ${marketplaceStats.currency} ${marketplaceStats.lowest_price}`)
      } else {
        console.log(` None currently for sale`)
      }
    }
    
    // Rate limit delay
    await sleep(RATE_LIMIT_DELAY)
  }
  
  // Transform and insert release
  const releaseData = transformRelease(release, labelName, marketplaceStats)
  const r_id = await insertRelease(releaseData)
  
  if (!r_id) {
    console.log(` Failed to insert release`)
    return { success: false, hasMarketplace: false }
  }
  
  console.log(` Release inserted (r_id: ${r_id})`)
  
  // Insert release identifier (Discogs link)
  if (release.id) {
    await insertReleaseIdentifier(r_id, release.id)
    console.log(` Identifier added (Discogs ID: ${release.id})`)
  }
  
  // Insert marketplace reference if items are for sale
  if (marketplaceStats && marketplaceStats.num_for_sale > 0) {
    await insertMarketplaceReference(r_id, marketplaceStats)
    console.log(` Marketplace reference added`)
  }
  
  return { 
    success: true, 
    hasMarketplace: marketplaceStats && marketplaceStats.num_for_sale > 0 
  }
}

/**
 * Main function to populate database
 */
async function populateDatabase() {
  console.log(' Starting Discogs data ingestion...\n')
  console.log(`Configuration:`)
  console.log(`  Labels to process: ${ALL_LABELS.length}`)
  console.log(`  Fetch marketplace stats: ${FETCH_MARKETPLACE_DATA ? 'YES' : 'NO'}`)
  console.log(`  Rate limit delay: ${RATE_LIMIT_DELAY}ms`)
  console.log(`\n  NOTE: Users will be directed to Discogs release page to view all listings\n`)
  
  if (ALL_LABELS.length === 0) {
    console.error(' ERROR: No labels configured!')
    return
  }
  
  console.log('─'.repeat(80))
  
  let totalReleases = 0
  let totalInserted = 0
  let totalFailed = 0
  let totalWithMarketplace = 0
  
  for (const label of ALL_LABELS) {
    try {
      const releases = await fetchLabelReleases(label.id, label.name, 1)
      
      if (releases.length === 0) {
        console.log(` No releases found for ${label.name}`)
        continue
      }
      
      totalReleases += releases.length
      
      console.log(`\n Processing ${releases.length} releases from ${label.name}...\n`)
      
      for (let i = 0; i < releases.length; i++) {
        const result = await processRelease(releases[i], label.name, i, releases.length)
        
        if (result.success) {
          totalInserted++
          if (result.hasMarketplace) {
            totalWithMarketplace++
          }
        } else {
          totalFailed++
        }
        
        // Delay between releases
        await sleep(1000)
      }
      
      console.log(`\n Completed ${label.name}: ${totalInserted} releases, ${totalWithMarketplace} with marketplace data\n`)
      console.log('─'.repeat(80))
      
    } catch (error) {
      console.error(`\n Error processing ${label.name}:`, error.message)
      console.log('─'.repeat(80))
    }
  }
  
  console.log('\n DATABASE POPULATION COMPLETE!\n')
  console.log(` Summary:`)
  console.log(`   Total releases fetched: ${totalReleases}`)
  console.log(`   Successfully inserted: ${totalInserted}`)
  console.log(`   Failed: ${totalFailed}`)
  console.log(`   With marketplace data: ${totalWithMarketplace} (${totalInserted > 0 ? ((totalWithMarketplace/totalInserted)*100).toFixed(1) : 0}%)`)
  console.log(`   Success rate: ${((totalInserted / totalReleases) * 100).toFixed(1)}%`)
  console.log(`\n💡 Users will click on releases to view all listings on Discogs.com`)
}

populateDatabase()
  .then(() => {
    console.log('\n Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n Script failed:', error)
    process.exit(1)
  })