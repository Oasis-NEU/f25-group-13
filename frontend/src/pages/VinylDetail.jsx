import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchReleaseById } from '../utils/discogsData';
import './VinylDetail.css';

function VinylDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vinyl, setVinyl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVinyl = async () => {
      if (!id) {
        setError('Invalid vinyl ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await fetchReleaseById(parseInt(id));

        if (fetchError) {
          console.error('Error fetching vinyl:', fetchError);
          setError('Failed to load vinyl details. Please try again.');
          setVinyl(null);
        } else if (data) {
          console.log('✅ Successfully fetched vinyl:', data);
          setVinyl(data);
        } else {
          setError('Vinyl not found.');
          setVinyl(null);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred while loading vinyl details.');
        setVinyl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVinyl();
  }, [id]);

  if (loading) {
    return (
      <div className="vinyl-detail-page">
        <nav className="detail-nav">
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
        <div className="vinyl-detail-container">
          <div className="loading-container">
            <p>Loading vinyl details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vinyl) {
    return (
      <div className="vinyl-detail-page">
        <nav className="detail-nav">
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
        <div className="vinyl-detail-container">
          <div className="error-container">
            <p>{error || 'Vinyl not found'}</p>
            <Link to="/" className="back-link">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vinyl-detail-page">
      <nav className="detail-nav">
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

      <div className="vinyl-detail-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>

        <div className="vinyl-detail-content">
          <div className="vinyl-detail-image">
            {vinyl.imageUrl ? (
              <img src={vinyl.imageUrl} alt={`${vinyl.artist} - ${vinyl.title}`} />
            ) : (
              <div className="vinyl-placeholder-large">
                <span>No Image Available</span>
              </div>
            )}
          </div>

          <div className="vinyl-detail-info">
            <div className="detail-header">
              <h1 className="detail-title">{vinyl.title}</h1>
              <h2 className="detail-artist">{vinyl.artist}</h2>
            </div>

            {vinyl.externalUrl && (
              <div className="detail-actions-top">
                <a
                  href={vinyl.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discogs-button"
                >
                  View on Discogs
                </a>
              </div>
            )}

            <div className="detail-section">
              <h3 className="section-heading">Release Information</h3>
              <div className="info-grid">
                {vinyl.genre && (
                  <div className="info-item">
                    <span className="info-label">Genre:</span>
                    <span className="info-value">{vinyl.genre}</span>
                  </div>
                )}
                {vinyl.releaseYear && (
                  <div className="info-item">
                    <span className="info-label">Release Year:</span>
                    <span className="info-value">{vinyl.releaseYear}</span>
                  </div>
                )}
                {vinyl.recordLabel && (
                  <div className="info-item">
                    <span className="info-label">Record Label:</span>
                    <span className="info-value">{vinyl.recordLabel}</span>
                  </div>
                )}
                {vinyl.format && (
                  <div className="info-item">
                    <span className="info-label">Format:</span>
                    <span className="info-value">{vinyl.format}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3 className="section-heading">Pricing & Availability</h3>
              <div className="info-grid">
                {vinyl.price ? (
                  <div className="info-item">
                    <span className="info-label">Price:</span>
                    <span className="info-value price-value">
                      {vinyl.currency || '$'}{vinyl.price.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="info-item">
                    <span className="info-label">Price:</span>
                    <span className="info-value">Not available</span>
                  </div>
                )}
                {vinyl.quantity !== undefined && (
                  <div className="info-item">
                    <span className="info-label">Available:</span>
                    <span className="info-value">
                      {vinyl.quantity > 0 ? `${vinyl.quantity} items` : 'Out of stock'}
                    </span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">
                    {vinyl.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="section-heading">Additional Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Source:</span>
                  <span className="info-value">{vinyl.externalSource || 'Discogs'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Release ID:</span>
                  <span className="info-value">{vinyl.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VinylDetail;
