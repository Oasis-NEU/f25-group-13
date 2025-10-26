import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-3xl mb-8">Page Not Found</h2>
      <p className="text-gray-400 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link 
        to="/" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block"
      >
        Go Home
      </Link>
    </div>
  );
}