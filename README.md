# Vinyl Marketplace - User Management System

## Overview
This project implements a robust user management system for a vinyl marketplace, featuring secure authentication, user profiles, favorites, and marketplace listings. The system is built with React, Supabase, and integrates with the Discogs API for vinyl record data.

## Key Features:

### User Authentication
- Secure signup and login with email/password
- Email verification
- Protected routes
- Session management
  
### User Profiles
- User registration with full name and email
- Profile management
- Secure password handling
- Last login tracking
  
### Favorites System
- Add/remove vinyl records to favorites
- View favorite items
- Persistent storage of favorites
  
### Marketplace Listings
- Create and manage vinyl listings
- Track listing details (price, condition, external URL)
- View personal listings
  
## Technical Implementation
### Database Schema (users table)
- `id` (UUID): Primary key, references auth.users
- `email` (text): User's email (unique)
- `username` (text): Generated username
- `full_name` (text): User's full name
- `created_at` (timestamp): Account creation date
- `last_login` (timestamp): Last login timestamp
  
### Authentication Flow
1. User signs up with email/password
2. Supabase Auth creates auth user
3. User profile is created in public.users table
4. Email verification is sent
5. On login, last_login is updated
   
### Security
- Password hashing handled by Supabase Auth
- Row-level security (RLS) policies
- Protected API routes
