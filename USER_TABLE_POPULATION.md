# User Table Population Setup

## Overview

When a new user account is created, the system automatically populates the existing `users` table in Supabase.

**The population happens via JavaScript code** (`userService.js`) - no SQL files needed! When a user signs up, the `createUser()` function:
1. Creates the auth user in Supabase Auth
2. Inserts a record into your existing `users` table with: `id`, `email`, `username`, `created_at`, and optionally `full_name`

## What Happens During Signup

1. User fills out signup form with email, password, and full name
2. `createUser()` function is called
3. Supabase Auth creates the authentication record
4. The function waits 500ms for auth user to be fully created
5. Attempts to insert user record into `public.users` table (retries up to 3 times)
6. If successful, user is created in both `auth.users` and `public.users`
7. User sees success message

## Setup Instructions

### Step 1: Check Your Users Table Schema

Make sure your `users` table has these columns (minimum):
- `id` (UUID, Primary Key) - matches `auth.users.id`
- `email` (TEXT) - user's email
- `username` or `full_name` (TEXT) - user's name
- `created_at` (TIMESTAMP) - when account was created

Go to: **Supabase Dashboard → Table Editor → `users` table**

### Step 2: Set Up Row Level Security (RLS) Policies

The `users` table needs an INSERT policy to allow authenticated users to create their own record.

Go to: **Supabase Dashboard → Table Editor → `users` table → Policies tab**

Create a new policy:

```sql
-- Policy Name: Allow users to insert own record
-- Policy Type: INSERT
-- Policy Definition:
CREATE POLICY "Allow users to insert own record"
ON public.users
FOR INSERT
WITH CHECK (auth.uid()::text = id::text);
```

Or if you want to allow any authenticated user to insert (less secure):

```sql
CREATE POLICY "Allow authenticated insert"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

### Step 3: Test It!

That's it! No database triggers or SQL scripts needed. The JavaScript code handles everything.

## Testing

1. Go to your app's signup page
2. Create a new account with:
   - Email: `test@example.com`
   - Password: `testpassword123`
   - Full Name: `Test User`
3. Check the browser console for logs:
   - `🔄 Starting user creation process...`
   - `✅ Auth user created with ID: [uuid]`
   - `🔄 Attempting to insert user record...`
   - `✅ User successfully created in users table`
4. Go to **Supabase Dashboard → Table Editor → `users` table**
5. You should see the new user record!

## Troubleshooting

### Issue: "Permission denied" error
**Solution:** Check RLS policies on `users` table. Make sure there's an INSERT policy.

### Issue: "Column does not exist" error
**Solution:** Check your `users` table schema. The code expects: `id`, `email`, `username`, `created_at`. If your table has different column names, update `userService.js` to match.

### Issue: User created in auth but not in users table
**Possible causes:**
1. RLS policy blocking insert
2. Column name mismatch
3. Missing required columns

**Solution:** Check browser console for detailed error messages. The code will log specific issues.

### Issue: User appears in users table but with wrong data
**Solution:** Check that your table schema matches what the code is inserting. Update `userRecord` object in `createUser()` function to match your schema.

## Viewing Users

After setup, you can view all users in:
- **Supabase Dashboard → Table Editor → `users` table**
- Or query via API: `supabase.from('users').select('*')`

## How It Works

The code uses **retry logic** (3 attempts) to handle temporary issues:
1. Creates auth user via Supabase Auth
2. Waits 500ms for auth to be fully created
3. Attempts to insert into `users` table with the 4 fields: `id`, `email`, `username`, `created_at` (and `full_name` if provided)
4. If error occurs, retries up to 3 times with 1 second delays
5. If all retries fail, logs detailed error messages to help troubleshoot

