import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function VinylCard({ vinyl }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/vinyl/${vinyl.itemId}`} className="card block">
        <div className="aspect-square bg-gray-700 overflow-hidden">
          <img
            src={vinyl.image?.imageUrl || '/placeholder-vinyl.png'}
            alt={vinyl.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = '/placeholder-vinyl.png'
            }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{vinyl.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-vinyl-gold font-bold text-xl">
              {vinyl.price?.value ? `$${vinyl.price.value}` : 'N/A'}
            </span>
            {vinyl.condition && (
              <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                {vinyl.condition}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default VinylCard
