import { motion } from 'framer-motion'
import SearchBar from '../components/SearchBar'

function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">
          Vinyl Congregation
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Discover your next favorite vinyl record from eBay's vast collection
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <SearchBar />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div className="card p-6 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Search</h3>
          <p className="text-gray-400">Find vinyl records from eBay's extensive catalog</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-4xl mb-4">💿</div>
          <h3 className="text-xl font-semibold mb-2">Discover</h3>
          <p className="text-gray-400">Explore detailed information about each record</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-4xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold mb-2">Save</h3>
          <p className="text-gray-400">Keep track of your favorite finds</p>
        </div>
      </motion.div>
    </div>
  )
}

export default Home
