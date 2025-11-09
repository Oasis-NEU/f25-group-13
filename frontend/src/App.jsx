import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useEffect } from 'react'
import { supabase } from './utils/supabase'

function App() {
  useEffect(() => {
    // Test fetching listings
    async function testConnection() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .limit(5)
      
      if (error) {
        console.error('Error connecting to Supabase:', error)
      } else {
        console.log('Connected! Sample listings:', data)
      }
    }
    
    testConnection()
  }, [])

  return (
    <div>
      <h1>Testing Supabase Connection</h1>
      <p>Check the console for results</p>
    </div>
  )
}

export default App
