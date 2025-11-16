import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserFavorites, removeFromFavorites } from '../utils/userService';
import { supabase } from '../utils/supabase';
import './Favorites.css';

function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: favorites, error: favError } = await getUserFavorites();
        if (favError) throw favError;
        const ids = (favorites || []).map(f => f.r_id);
        if (ids.length === 0) {
          setItems([]);
          return;
        }
        // Fetch releases in one query
        const { data, error: relError } = await supabase
          .from('releases')
          .select('r_id, title, artist, image, genre, release_year')
          .in('r_id', ids);
        if (relError) throw relError;
        // Preserve order by favorites created_at (desc)
        const byId = new Map((data || []).map(r => [r.r_id, r]));
        const merged = favorites
          .map(f => {
            const r = byId.get(f.r_id);
            return r ? { ...r, created_at: f.created_at } : null;
          })
          .filter(Boolean);
        setItems(merged);
      } catch (e) {
        setError(e.message || 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  const handleRemove = async (r_id) => {
    const { error: delError } = await removeFromFavorites(r_id);
    if (!delError) {
      setItems(prev => prev.filter(i => i.r_id !== r_id));
    }
  };

  if (!user) return null;

  return (
    <div className="favorites-page">
      <nav className="favorites-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <h1 className="brand-logo">Groove Scout</h1>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/listings" className="btn-sign-in">Listings</Link>
            <Link to="/favorites" className="btn-sign-in">Favorites</Link>
            <Link to="/account" className="btn-sign-up">Account</Link>
          </div>
        </div>
      </nav>

      <div className="favorites-container">
        <h2 className="favorites-title">Your Favorites</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && items.length === 0 && <p>No favorites yet.</p>}
        <div className="favorites-grid">
          {items.map(item => (
            <div className="favorite-card" key={item.r_id}>
              <Link to={`/vinyl/${item.r_id}`} className="card-image-link">
                {item.image ? (
                  <img src={item.image} alt={`${item.artist} - ${item.title}`} />
                ) : (
                  <div className="image-placeholder">No Image</div>
                )}
              </Link>
              <div className="card-info">
                <div className="card-title">{item.title}</div>
                <div className="card-artist">{item.artist}</div>
                <div className="card-meta">
                  {item.genre && <span>{item.genre}</span>}
                  {item.release_year && <span>{item.release_year}</span>}
                </div>
                <div className="card-actions">
                  <Link to={`/vinyl/${item.r_id}`} className="vinyl-link-button">View</Link>
                  <button className="vinyl-link-disabled" onClick={() => handleRemove(item.r_id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Favorites;


