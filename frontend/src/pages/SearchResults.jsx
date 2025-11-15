import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchReleases } from '../utils/discogsData';
import './SearchResults.css';

function SearchResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data, error: searchError } = await searchReleases(query, 50);

        if (searchError) {
          console.error('Search error:', searchError);
          setError('Search failed. Please try again.');
          setResults([]);
        } else if (data && data.length > 0) {
          console.log('Found', data.length, 'results for:', query);
          // Deduplicate results by title and artist (case-insensitive)
          const uniqueResults = [];
          const seen = new Set();
          
          data.forEach(vinyl => {
            const key = `${vinyl.title?.toLowerCase().trim()}_${vinyl.artist?.toLowerCase().trim()}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueResults.push(vinyl);
            }
          });
          
          console.log('Deduplicated to', uniqueResults.length, 'unique results');
          setResults(uniqueResults);
        } else {
          setError(`No results found for: "${query}"`);
          setResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      return;
    }
    setSearchParams({ q: searchInput.trim() });
  };

  return (
    <div className="search-results-page">
      <nav className="search-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <h1 className="brand-logo">Groove Scout</h1>
            </Link>
          </div>
          <div className="nav-right">
            {user ? (
              <Link to="/account" className="btn-sign-up">Account</Link>
            ) : (
              <>
                <Link to="/signin" className="btn-sign-in">Sign In</Link>
                <Link to="/signup" className="btn-sign-up">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="search-results-wrapper">
        <div className="search-bar-section">
          <form onSubmit={handleSearch} className="search-form-full">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for vinyl records, artists, albums..."
              className="search-input-full"
            />
            <button type="submit" className="search-button-full">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM15.5 15.5l-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>
          {query && (
            <div className="search-header">
              <h1 className="results-title">
                {results.length > 0 
                  ? `Search Results for "${query}"` 
                  : `No Results for "${query}"`
                }
              </h1>
              {results.length > 0 && (
                <p className="results-count">{results.length} results found</p>
              )}
            </div>
          )}
        </div>

        <div className="search-results-container">
          {loading ? (
            <div className="loading-message">
              <p>Searching for vinyl releases...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <Link to="/" className="back-link">← Back to Home</Link>
            </div>
          ) : results.length === 0 && query ? (
            <div className="empty-message">
              <p>No results found for "{query}"</p>
              <p>Try a different search term or browse by genre.</p>
              <Link to="/" className="back-link">← Back to Home</Link>
            </div>
          ) : results.length > 0 ? (
            <div className="results-grid">
              {results.map((vinyl) => (
                <div 
                  key={vinyl.id} 
                  className="vinyl-card"
                  onClick={() => navigate(`/vinyl/${vinyl.id}`)}
                  style={{ cursor: 'pointer' }}
                >
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
                  <div className="vinyl-link" onClick={(e) => e.stopPropagation()}>
                      {vinyl.externalUrl ? (
                        <a 
                          href={vinyl.externalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="vinyl-link-button"
                        >
                          View on Discogs
                        </a>
                      ) : (
                        <span className="vinyl-link-disabled">No listing available</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
