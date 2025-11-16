import { supabase } from './supabase';

/**
 * Hash password (simple version - in production, use bcrypt or similar)
 * Note: For now, we'll still use Supabase Auth for password hashing,
 * but store user data in our users table
 */
async function hashPassword(password) {
  // Supabase Auth handles password hashing, so we'll store a reference
  // The actual password will be managed by Supabase Auth
  // We just store a marker that this user exists
  return 'managed_by_supabase_auth';
}

/**
 * Create a new user in the users table
 * This works alongside Supabase Auth
 */

export async function createUser(userData) {
  try {
    const { email, password, full_name } = userData;
    console.log('🔄 Starting user creation process for:', email);

    // 1. First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: window.location.origin + '/account',
      },
    });

    console.log('Auth response:', { authData, authError });

    if (authError) {
      console.error('❌ Auth signup error:', authError);
      return { data: null, error: authError };
    }

    // 2. If we have a user, create profile in public.users
    if (authData?.user) {
      console.log('✅ Auth user created, creating profile...');
      
      // Generate a username from email (you might want to make this more robust)
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: email,
          username: username,
          full_name: full_name,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      console.log('Profile creation response:', { profileData, profileError });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        
        // If the profile already exists, fetch it instead
        if (profileError.code === '23505') { // Unique violation
          console.log('ℹ️ Profile already exists, fetching...');
          const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (existingProfile) {
            console.log('✅ Found existing profile');
            return { 
              data: { 
                user: authData.user, 
                profile: existingProfile,
                requiresConfirmation: !authData.user.confirmed_at 
              }, 
              error: null 
            };
          }
        }
        return { data: null, error: profileError };
      }

      console.log('✅ Profile created successfully');
      return { 
        data: { 
          user: authData.user, 
          profile: profileData,
          requiresConfirmation: !authData.user.confirmed_at 
        }, 
        error: null 
      };
    }

    return { data: null, error: new Error('No user data returned from auth') };

  } catch (err) {
    console.error('❌ Exception in createUser:', err);
    return { data: null, error: err };
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error in getUserByEmail:', err);
    return { data: null, error: err };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error in getUserById:', err);
    return { data: null, error: err };
  }
}

/**
 * Update user profile
 */
export async function updateUser(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error in updateUser:', err);
    return { data: null, error: err };
  }
}

/**
 * Sign in user (uses Supabase Auth, then updates last_login in users table)
 */
export async function signInUser(email, password) {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { data: null, error: authError };
    }

    if (!authData.user) {
      return { data: null, error: { message: 'Sign in failed - no user returned' } };
    }

    // Check if user exists in our users table, if not create it
    const { data: existingUser } = await getUserById(authData.user.id);
    
    if (!existingUser) {
      // User exists in auth but not in users table - create it
      console.log('User exists in auth but not in users table, creating profile...');
      const userRecord = {
        id: authData.user.id,
        email: authData.user.email,
        username: authData.user.user_metadata?.full_name || authData.user.email.split('@')[0],
        created_at: new Date().toISOString(),
      };

      // Add optional fields if they exist
      if (authData.user.user_metadata?.full_name) {
        userRecord.full_name = authData.user.user_metadata.full_name;
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();

      if (createError && createError.code !== '23505') {
        console.error('Error creating user profile:', createError);
      }
    } else {
      // Update last_login_at in users table if the column exists
      const updateData = {};
      // Try to update last_login or last_login_at if the column exists
      try {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authData.user.id);
      } catch (e) {
        // Try last_login_at instead
        try {
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', authData.user.id);
        } catch (e2) {
          // Column might not exist, that's okay
          console.log('Note: last_login column not found in users table');
        }
      }
    }

    // Get user data from our users table
    const { data: userData } = await getUserById(authData.user.id);

    console.log('✅ User signed in, data from users table:', userData);

    return { 
      data: { 
        ...authData, 
        userData: userData || null 
      }, 
      error: null 
    };
  } catch (err) {
    console.error('Error in signInUser:', err);
    return { data: null, error: err };
  }
}

/**
 * Get current user's profile from users table
 */
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    return await getUserById(user.id);
  } catch (err) {
    console.error('Error in getCurrentUserProfile:', err);
    return { data: null, error: err };
  }
}

