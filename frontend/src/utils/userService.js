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
    const { email, full_name, password, authUserId } = userData;
    
    console.log('🔄 Starting user creation process...');
    
    // First, sign up with Supabase Auth (handles password hashing)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (authError) {
      console.error('❌ Auth signup error:', authError);
      return { data: null, error: authError };
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth signup');
      return { data: null, error: { message: 'User creation failed - no user returned' } };
    }

    const userId = authUserId || authData.user.id;
    console.log('✅ Auth user created with ID:', userId);

    // Wait a moment to ensure auth user is fully created
    await new Promise(resolve => setTimeout(resolve, 500));

    // Then, insert into existing users table
    // Try to match existing table structure - adapt based on what columns exist
    const userRecord = {
      id: userId, // Primary key - matches auth.users.id
      email: email,
      username: full_name || email.split('@')[0], // Use username column if it exists
      created_at: new Date().toISOString(),
    };

    // Add optional fields if they exist in the table
    if (full_name) {
      userRecord.full_name = full_name;
    }

    console.log('🔄 Attempting to insert user record into users table:', userRecord);

    // Try to insert with retry logic
    let insertAttempts = 0;
    const maxAttempts = 3;
    let insertError = null;
    let insertData = null;

    while (insertAttempts < maxAttempts) {
      const { data, error } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();

      if (!error) {
        insertData = data;
        insertError = null;
        break;
      }

      insertError = error;
      insertAttempts++;

      // If user already exists, that's fine - fetch existing
      if (error.code === '23505') {
        console.log('ℹ️ User already exists in users table, fetching existing record...');
        const { data: existingUser } = await getUserById(userId);
        if (existingUser) {
          insertData = existingUser;
          insertError = null;
          break;
        }
      }

      // Wait before retry
      if (insertAttempts < maxAttempts) {
        console.log(`⏳ Retry ${insertAttempts}/${maxAttempts - 1} after error...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (insertError) {
      // Check for common issues and provide helpful feedback
      if (insertError.code === '42501') {
        console.error('❌ Permission denied: RLS policy preventing insert into users table');
        console.error('Error details:', insertError.message);
        console.error('💡 Solution: Check Row Level Security policies on users table in Supabase');
        console.error('💡 You may need to add an INSERT policy that allows authenticated users to insert their own record');
      } else if (insertError.code === '42703') {
        console.error('❌ Column does not exist: Check the users table schema');
        console.error('Error details:', insertError.message);
        console.error('💡 Expected columns: id, email, username (or full_name), created_at');
      } else {
        console.error('❌ Error creating user in users table after', maxAttempts, 'attempts:');
        console.error('Error code:', insertError.code);
        console.error('Error message:', insertError.message);
        console.error('Full error:', JSON.stringify(insertError, null, 2));
      }
      
      // Even if insert fails, return auth data - authentication still works
      // The database trigger (if set up) will create the record
      console.warn('⚠️ Continuing despite users table insert failure - auth user created successfully');
      return { data: authData, error: null, warning: 'User created in auth but not in users table. Check RLS policies.' };
    }

    if (insertData) {
      console.log('✅ User successfully created in users table:', insertData);
      return { data: { ...insertData, authData }, error: null };
    }

    // Fallback: return auth data
    return { data: authData, error: null };
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

