import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserProfile } from '../utils/userService';
import './Account.css';

function Account() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setProfileLoading(true);
        const { data, error } = await getCurrentUserProfile();
        if (!error && data) {
          setUserProfile(data);
        }
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading || profileLoading) {
    return (
      <div className="account-page">
        <div className="account-loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/signin');
    return null;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSigningOut(false);
    }
  };

  // Use data from users table if available, otherwise fall back to auth user
  // Handle different column names that might exist (full_name, username, name)
  const userEmail = userProfile?.email || user.email || 'No email';
  const userName = userProfile?.full_name || userProfile?.username || userProfile?.name || user.user_metadata?.full_name || userEmail.split('@')[0];
  const accountCreated = userProfile?.created_at || user.created_at;

  return (
    <div className="account-page">
      <nav className="account-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <h1 className="brand-logo">Groove Scout</h1>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/" className="nav-link">Home</Link>
            <button onClick={handleSignOut} className="btn-sign-out" disabled={signingOut}>
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </nav>

      <div className="account-container">
        <div className="account-content">
          <h1 className="account-title">Account Settings</h1>
          
          <div className="account-section">
            <h2 className="section-title">Profile Information</h2>
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{userName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{userEmail}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Created:</span>
              <span className="info-value">
                {accountCreated ? new Date(accountCreated).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {userProfile?.last_login_at && (
              <div className="info-item">
                <span className="info-label">Last Login:</span>
                <span className="info-value">
                  {new Date(userProfile.last_login_at).toLocaleString()}
                </span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value" style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                {user?.id || userProfile?.id || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Email Verified:</span>
              <span className="info-value">
                {userProfile?.email_verified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <div className="account-section">
            <h2 className="section-title">Account Actions</h2>
            <div className="account-actions">
              <button className="action-button" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;

