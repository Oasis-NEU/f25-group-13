import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'

function VinylDetail() {
  const { id } = useParams()
  const [vinyl, setVinyl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchVinylDetails()
  }, [id])
  
  const fetchVinylDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`/api/item/${id}`)
      setVinyl(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch vinyl details')
      console.error('Detail fetch error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const addToFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (!favorites.find(fav => fav.itemId === vinyl.itemId)) {
      favorites.push({
        itemId: vinyl.itemId,
        title: vinyl.title,
        price: vinyl.price,
        image: vinyl.image
      })
      localStorage.setItem('favorites', JSON.stringify(favorites))
      alert('Added to favorites!')
    } else {
      alert('Already in favorites!')
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-gray-800 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-800 rounded"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-400 text-xl mb-4">{error}</p>
        <Link to="/search" className="btn-primary">Back to Search</Link>
      </div>
    )
  }
  
  if (!vinyl) return null
  
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <Link to="/search" className="text-vinyl-purple hover:underline mb-6 inline-block">
          ← Back to results
        </Link>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card overflow-hidden">
            <img
              src={vinyl.image?.imageUrl || '/placeholder-vinyl.png'}
              alt={vinyl.title}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                e.target.src = '/placeholder-vinyl.png'
              }}
            />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold mb-4">{vinyl.title}</h1>
            
            <div className="space-y-4 mb-6">
              {vinyl.price && (
                <div>
                  <span className="text-gray-400">Price:</span>
                  <span className="text-vinyl-gold text-3xl font-bold ml-3">
                    ${vinyl.price.value}
                  </span>
                </div>
              )}
              
              {vinyl.condition && (
                <div>
                  <span className="text-gray-400">Condition:</span>
                  <span className="ml-3 bg-gray-700 px-3 py-1 rounded">{vinyl.condition}</span>
                </div>
              )}
              
              {vinyl.seller && (
                <div>
                  <span className="text-gray-400">Seller:</span>
                  <span className="ml-3">{vinyl.seller.username}</span>
                </div>
              )}
            </div>
            
            {vinyl.shortDescription && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Description</h3>
                <p className="text-gray-300">{vinyl.shortDescription}</p>
              </div>
            )}
            
            <div className="flex gap-4">
              <a
                href={vinyl.itemWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 text-center"
              >
                View on eBay →
              </a>
              <button onClick={addToFavorites} className="btn-secondary">
                ❤️ Save
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VinylDetail
