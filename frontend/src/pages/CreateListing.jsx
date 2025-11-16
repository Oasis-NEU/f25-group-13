import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createListing } from '../utils/userService';
import './Listings.css';

function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    external_url: '',
    price: '',
    condition: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!form.external_url.trim()) {
        setError('Please enter the external URL (link).');
        setSubmitting(false);
        return;
      }
      const { error } = await createListing({
        name: form.name,
        external_url: form.external_url,
        price: form.price !== '' ? Number(form.price) : null,
        condition: form.condition,
      });
      if (error) {
        setError(error.message || 'Failed to create listing');
      } else {
        // after create, go to My Listings
        navigate('/listings');
      }
    } finally {
      setSubmitting(false);
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
            <Link to="/listings" className="btn-sign-in">My Listings</Link>
            <Link to="/favorites" className="btn-sign-in">Favorites</Link>
            <Link to="/account" className="btn-sign-up">Account</Link>
          </div>
        </div>
      </nav>

      <div className="listings-container">
        <h2 className="listings-title">Create a Listing</h2>
        {error && <p className="error">{error}</p>}
        <form className="listing-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter listing name"
            />
          </div>
          <div className="form-row">
            <label htmlFor="price">Price (USD)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="Enter price, e.g. 19.99"
            />
          </div>
          <div className="form-row">
            <label htmlFor="external_url">External URL</label>
            <input
              id="external_url"
              name="external_url"
              type="url"
              value={form.external_url}
              onChange={handleChange}
              placeholder="Enter link to the listing"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="condition">Condition</label>
            <input
              id="condition"
              name="condition"
              type="text"
              value={form.condition}
              onChange={handleChange}
              placeholder="e.g. NM, VG+, G+"
            />
          </div>
          <button className="submit-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateListing;


