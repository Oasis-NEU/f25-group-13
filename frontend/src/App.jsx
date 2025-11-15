import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Account from './pages/Account'
import SearchResults from './pages/SearchResults'
import VinylDetail from './pages/VinylDetail'
import './App.css'
import { useEffect } from 'react'
import { supabase } from './utils/supabase'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/account" element={<Account />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/vinyl/:id" element={<VinylDetail />} />
      </Routes>
      </div>
  )
}

export default App
