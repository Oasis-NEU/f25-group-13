import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUser } from '../utils/userService';
import { useAuth } from '../context/AuthContext';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await createUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
      });

      if (signUpError) {
        setError(signUpError.message || 'Sign up failed. Please try again.');
      } else {
        console.log('✅ User created in users table:', data);
        alert('Account created successfully! Please check your email to verify your account.');
        navigate('/signin');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <nav className="signup-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <h1 className="brand-logo">Groove Scout</h1>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/signin" className="btn-sign-in">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="signup-wrapper">
        <div className="signup-container">
          <h1 className="signup-title">Create Your Groove Scout Account</h1>
          <p className="signup-subtitle">Join us to discover your next favorite vinyl record.</p>
          
          <form onSubmit={handleSubmit} className="signup-form">
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
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
                placeholder="Create a password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
          
          <p className="signin-link">
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
