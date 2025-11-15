import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xpnituwepyjmefqhrnqq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwbml0dXdlcHlqbWVmcWhybnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjc1NTYsImV4cCI6MjA3NTg0MzU1Nn0.R2dgZWoOorzinUwmcByy4WOdVGdAheeYGUkD5GfIRo0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
