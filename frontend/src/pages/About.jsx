import { motion } from 'framer-motion'

export function About() {
  const teamMembers = [
    { role: 'Frontend Developer', responsibilities: 'Component architecture, routing, state management' },
    { role: 'Backend Developer', responsibilities: 'API integration, data handling, server endpoints' },
    { role: 'UI/UX Designer', responsibilities: 'Wireframes, responsive layouts, component styling' },
    { role: 'Security Tester', responsibilities: 'Feature testing, integration testing, bug tracking' },
  ]
  
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-5xl font-bold mb-6 text-center">About Our website</h1>
        
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Our creation is a modern web application designed to help vinyl/physical media enthusiasts discover 
            and explore vinyl records from eBay's vast marketplace. We aggregate data from eBay's API 
            to provide a beautiful, streamlined interface for browsing and finding your next favorite record.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Built with React and powered by eBay's Browse API, our platform makes it easy to search, 
            discover, and save vinyl records all in one place.
          </p>
        </div>
        
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Our Team</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 p-4 rounded-lg"
              >
                <h3 className="font-semibold text-vinyl-purple mb-2">{member.role}</h3>
                <p className="text-sm text-gray-400">{member.responsibilities}</p>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-vinyl-gold mb-2">Frontend</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• React 18</li>
                <li>• React Router v6</li>
                <li>• TailwindCSS</li>
                <li>• Framer Motion</li>
                <li>• Vite</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-vinyl-gold mb-2">Backend</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• Node.js</li>
                <li>• Express</li>
                <li>• Axios</li>
                <li>• eBay Browse API</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-vinyl-gold mb-2">Deployment</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• Vercel (Frontend)</li>
                <li>• Render/AWS (Backend)</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default About
