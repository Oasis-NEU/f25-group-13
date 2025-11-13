import { Link } from 'react-router-dom';
import './SignIn.css';

function SignIn() {
  return (
    <div className="signin-page">
      <div className="signin-container">
        <h1>Sign In</h1>
        <p>Sign in page coming soon...</p>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
}

export default SignIn;

