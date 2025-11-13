import { Link } from 'react-router-dom';
import './Genres.css';

function Genres() {
  return (
    <div className="genres-page">
      <div className="genres-container">
        <h1>Genres</h1>
        <p>Genre browsing coming soon...</p>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
}

export default Genres;

