import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInUser } from '../utils/userService';
import { useAuth } from '../context/AuthContext';
import './SignIn.css';

function SignIn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  if (user) {
    navigate('/account');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await signInUser(formData.email, formData.password);

      if (signInError) {
        setError(signInError.message || 'Invalid email or password. Please try again.');
      } else {
        console.log('✅ Signed in, user data:', data);
        navigate('/account');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <nav className="signin-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <h1 className="brand-logo">Groove Scout</h1>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/signup" className="btn-sign-up">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="signin-wrapper">
        <div className="signin-container">
          <h1 className="signin-title">Sign In to Groove Scout</h1>
          <p className="signin-subtitle">Welcome back! Please sign in to your account.</p>
          
          <form onSubmit={handleSubmit} className="signin-form">
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <p className="signup-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
