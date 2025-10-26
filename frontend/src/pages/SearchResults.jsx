import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import SearchBar from '../components/SearchBar'
import VinylList from '../components/VinylList'

function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')
  const [vinyls, setVinyls] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    if (query) {
      searchVinyls(query)
    }
  }, [query])
  
  const searchVinyls = async (searchQuery) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      setVinyls(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch vinyl records')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBar initialQuery={query} />
      </div>
      
      {query && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            Search results for: <span className="text-vinyl-purple">"{query}"</span>
          </h2>
          {!loading && vinyls.length > 0 && (
            <p className="text-gray-400 mt-2">{vinyls.length} records found</p>
          )}
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <VinylList vinyls={vinyls} loading={loading} />
    </div>
  )
}

export default SearchResults
