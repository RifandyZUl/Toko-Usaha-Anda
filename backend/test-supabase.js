
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'product-images'

console.log('🔍 Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Bucket:', bucketName)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message)
      return
    }

    const bucket = buckets.find(b => b.name === bucketName)
    if (bucket) {
      console.log(`✅ Success! Bucket "${bucketName}" found.`)
      console.log('🚀 Your new Supabase project is ready for image uploads!')
    } else {
      console.error(`❌ Error: Bucket "${bucketName}" not found.`)
      console.log('Available buckets:', buckets.map(b => b.name).join(', '))
      console.log('Please make sure you have created the bucket in Supabase Dashboard.')
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

test()
