import { useState, useEffect } from 'react'
import VinylList from '../components/VinylList'

function Favorites() {
  const [favorites, setFavorites] = useState([])
  
  useEffect(() => {
    loadFavorites()
  }, [])
  
  const loadFavorites = () => {
    const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
    setFavorites(stored)
  }
  
  const clearFavorites = () => {
    if (window.confirm('Are you sure you want to clear all favorites?')) {
      localStorage.removeItem('favorites')
      setFavorites([])
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Your Favorites</h1>
          <p className="text-gray-400">
            {favorites.length} {favorites.length === 1 ? 'record' : 'records'} saved
          </p>
        </div>
        {favorites.length > 0 && (
          <button onClick={clearFavorites} className="btn-secondary">
            Clear All
          </button>
        )}
      </div>
      
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl text-gray-400 mb-4">No favorites yet</p>
          <p className="text-gray-500">Start searching and save your favorite vinyl records!</p>
        </div>
      ) : (
        <VinylList vinyls={favorites} loading={false} />
      )}
    </div>
  )
}

export default Favorites




/**export default function Favorites() {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Favorites</h1>
        <p>Your favorite records will appear here</p>
      </div>
    );
  }

*/
  