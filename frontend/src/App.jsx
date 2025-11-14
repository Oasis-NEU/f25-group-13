import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Genres from './pages/Genres'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import './App.css'
import { useEffect } from 'react'
import { supabase } from './utils/supabase'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
      </div>
  )
}

export default App
