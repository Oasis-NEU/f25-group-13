import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDiscogsReleases, searchReleases } from '../utils/discogsData';
import './LandingPage.css';

function LandingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [vinylsOfTheDay, setVinylsOfTheDay] = useState([]);
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch background images from releases
  useEffect(() => {
    const fetchBackgroundImages = async () => {
      try {
        const { data, error } = await fetchDiscogsReleases({
          limit: 10,
          orderBy: 'r_id',
          orderDirection: 'desc'
        });

        if (!error && data && data.length > 0) {
          const images = data
            .map(release => release.imageUrl)
            .filter(img => img !== null && img !== undefined && img !== '');
          
          if (images.length > 0) {
            setBackgroundImages(images);
          } else {
            // Fallback image if no images found
            setBackgroundImages(['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop']);
          }
        } else {
          setBackgroundImages(['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop']);
        }
      } catch (err) {
        console.error('Error fetching background images:', err);
        setBackgroundImages(['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop']);
      }
    };
    fetchBackgroundImages();
  }, []);

  // Rotate background images every 5 seconds
  useEffect(() => {
    if (backgroundImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Fetch vinyls of the day from Supabase
  useEffect(() => {
    const fetchVinylsOfTheDay = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await fetchDiscogsReleases({
          limit: 12,
          orderBy: 'r_id',
          orderDirection: 'desc'
        });

        if (error) {
          console.error('Error fetching Discogs releases:', error);
          setError('Failed to load vinyl releases. Please check your database connection.');
          setVinylsOfTheDay([]);
        } else if (data && data.length > 0) {
          console.log('✅ Successfully fetched Discogs releases from Supabase:', data.length, 'records');
          setVinylsOfTheDay(data);
        } else {
          console.log('ℹ️  No Discogs releases found in database.');
          console.log('   Run node-populate-schema.js to populate your database with Discogs data');
          setError('No vinyl releases found. Please populate your database with Discogs data.');
          setVinylsOfTheDay([]);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while loading releases.');
        setVinylsOfTheDay([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVinylsOfTheDay();
  }, []);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    try {
      setLoading(true);
      console.log('Searching Discogs releases for:', searchQuery);
      const { data, error } = await searchReleases(searchQuery, 20);
      if (error) {
        console.error('Search error:', error);
        alert('Search failed. Please try again.');
      } else if (data && data.length > 0) {
        console.log('Found', data.length, 'results');
        setVinylsOfTheDay(data);
        setError(null);
        // Scroll to vinyls section
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      } else {
        console.log('No results found');
        setError(`No results found for: "${searchQuery}"`);
        setVinylsOfTheDay([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <h1 className="brand-logo">Groove Scout</h1>
            </Link>
          </div>
          <div className="nav-center">
            <Link to="/genres" className="nav-link">Genres</Link>
          </div>
          <div className="nav-right">
            <Link to="/signin" className="btn-sign-in">Sign In</Link>
            <Link to="/signup" className="btn-sign-up">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image and Search */}
      <section className="hero-section">
        {backgroundImages.length > 0 && (
          <div 
            className="hero-background"
            style={{
              backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
            }}
          >
            <div className="hero-overlay"></div>
          </div>
        )}
        <div className="hero-content">
          <div className="search-container">
            <h2 className="hero-title">Discover Your Next Vinyl</h2>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for vinyl records, artists, albums..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM15.5 15.5l-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Vinyls of the Day Section */}
      <section className="vinyls-section">
        <div className="vinyls-container">
          <h2 className="section-title">Vinyls of the Day</h2>
          {loading ? (
            <div className="loading-message">
              <p>Loading vinyl releases from Discogs...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <p className="error-help">
                Make sure you have:
                <br />
                1. Run <code>node node-populate-schema.js</code> to populate your database
                <br />
                2. The "releases" table exists with Discogs data
                <br />
                3. Row Level Security (RLS) allows reading from these tables
              </p>
            </div>
          ) : vinylsOfTheDay.length === 0 ? (
            <div className="empty-message">
              <p>No vinyl releases found in the database.</p>
              <p>Run the populate script to add Discogs data to Supabase.</p>
            </div>
          ) : (
            <div className="vinyls-grid">
              {vinylsOfTheDay.map((vinyl) => (
                <div key={vinyl.id} className="vinyl-card">
                  <div className="vinyl-image">
                    {vinyl.imageUrl ? (
                      <img src={vinyl.imageUrl} alt={`${vinyl.artist} - ${vinyl.title}`} />
                    ) : (
                      <div className="vinyl-placeholder">
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="vinyl-info">
                    <h3 className="vinyl-title">{vinyl.title}</h3>
                    <p className="vinyl-artist">{vinyl.artist}</p>
                    {vinyl.genre && (
                      <p className="vinyl-genre">{vinyl.genre}</p>
                    )}
                    {vinyl.releaseYear && (
                      <p className="vinyl-year">{vinyl.releaseYear}</p>
                    )}
                    {vinyl.price ? (
                      <p className="vinyl-price">
                        {vinyl.currency || '$'}{vinyl.price.toFixed(2)}
                      </p>
                    ) : (
                      <p className="vinyl-price-unavailable">Price not available</p>
                    )}
                    {vinyl.externalUrl ? (
                      <a 
                        href={vinyl.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="vinyl-link"
                      >
                        View on Discogs
                      </a>
                    ) : (
                      <span className="vinyl-link-disabled">No listing available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default LandingPage;

