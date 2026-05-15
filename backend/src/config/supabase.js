/**
 * Supabase Configuration
 * Setup Supabase client for storage operations
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Log Supabase configuration status
if (supabaseUrl && supabaseServiceKey) {
  console.log('✅ Supabase Storage configured')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Bucket: ${process.env.SUPABASE_STORAGE_BUCKET || 'product-images'}`)
} else {
  console.warn(
    '⚠️  Supabase credentials not found. Image upload will use local storage.'
  )
  console.warn(
    '   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file'
  )
}

/**
 * Create Supabase client with service role key
 * Service role key has admin access (bypasses RLS)
 */
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

/**
 * Storage bucket name
 */
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

/**
 * Get Supabase URL (for constructing full URLs if needed)
 */
export const getSupabaseUrl = () => {
  return supabaseUrl
}

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = () => {
  return !!supabase
}

