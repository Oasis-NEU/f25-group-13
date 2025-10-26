//import VinylCard from './VinylCard'

function VinylList({ vinyls, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-square bg-gray-700"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (!vinyls || vinyls.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl text-gray-400">No vinyl records found</p>
        <p className="text-gray-500 mt-2">Try a different search term</p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vinyls.map((vinyl) => (
        <VinylCard key={vinyl.itemId} vinyl={vinyl} />
      ))}
    </div>
  )
}

export default VinylList
