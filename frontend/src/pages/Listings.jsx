import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserListings, createListing, deleteListingByKey } from '../utils/userService';
import './Listings.css';

function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await getUserListings();
      if (error) setError(error.message || 'Failed to load listings');
      setItems(data || []);
      setLoading(false);
    };
    load();
  }, [user, navigate]);

  // No form on the view page

  const handleDelete = async (external_url, created_at) => {
    const { error } = await deleteListingByKey({ external_url, created_at });
    if (!error) {
      setItems((prev) => prev.filter((i) => !(i.external_url === external_url && i.created_at === created_at)));
    }
  };

  if (!user) return null;

  return (
    <div className="listings-page">
      <nav className="listings-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <h1 className="brand-logo">Groove Scout</h1>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/listings/create" className="btn-sign-in">Create Listing</Link>
            <Link to="/favorites" className="btn-sign-in">Favorites</Link>
            <Link to="/account" className="btn-sign-up">Account</Link>
          </div>
        </div>
      </nav>

      <div className="listings-container">
        <h2 className="listings-title">Your Listings</h2>
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>No listings yet.</p>
        ) : (
          <>
            <div className="listings-header">
              <div className="h-col name">Name</div>
              <div className="h-col price">Price</div>
              <div className="h-col condition">Condition</div>
              <div className="h-col created">Created</div>
              <div className="h-col actions">Actions</div>
            </div>
            <div className="listings-grid">
            {items.map((it) => (
              <div className="listing-card" key={`${it.external_url}-${it.created_at}`}>
                <div className="listing-row">
                  <div className="l-col name">{it.name || '—'}</div>
                  <div className="l-col price">{it.price != null && it.price !== '' ? `$${Number(it.price).toFixed(2)}` : '—'}</div>
                  <div className="l-col condition">{it.condition || '—'}</div>
                  <div className="l-col created">{it.created_at ? new Date(it.created_at).toLocaleString() : '—'}</div>
                  <div className="l-col actions">
                    <button className="delete-button" onClick={() => handleDelete(it.external_url, it.created_at)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Listings;


