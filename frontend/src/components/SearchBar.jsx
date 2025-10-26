import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SearchBar({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const navigate = useNavigate()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for vinyl records (e.g., Pink Floyd, The Beatles)..."
          className="input-field flex-grow"
          autoFocus
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </div>
    </form>
  )
}

export default SearchBar
