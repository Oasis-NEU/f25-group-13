import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  
  const isActive = (path) => location.pathname === path
  
  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎵</span>
            <span className="text-xl font-bold text-vinyl-purple">Vinyl Congregation</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className={`hover:text-vinyl-purple transition-colors ${isActive('/') ? 'text-vinyl-purple' : 'text-gray-300'}`}
            >
              Home
            </Link>
            <Link 
              to="/search" 
              className={`hover:text-vinyl-purple transition-colors ${isActive('/search') ? 'text-vinyl-purple' : 'text-gray-300'}`}
            >
              Search
            </Link>
            <Link 
              to="/favorites" 
              className={`hover:text-vinyl-purple transition-colors ${isActive('/favorites') ? 'text-vinyl-purple' : 'text-gray-300'}`}
            >
              Favorites
            </Link>
            <Link 
              to="/about" 
              className={`hover:text-vinyl-purple transition-colors ${isActive('/about') ? 'text-vinyl-purple' : 'text-gray-300'}`}
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
