// Quick API test script
// Run: node test-api.js

const BASE_URL = 'http://localhost:5000/api'

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n')

  // Test 1: Health Check
  try {
    console.log('1️⃣ Testing Health Check...')
    const res = await fetch(`${BASE_URL}/health`)
    const data = await res.json()
    console.log('   ✅ Health check:', data.status)
    console.log('   📝 Message:', data.message)
  } catch (error) {
    console.error('   ❌ Health check failed:', error.message)
    console.log('\n⚠️ Make sure server is running: npm run dev')
    return
  }

  // Test 2: Get Products
  try {
    console.log('\n2️⃣ Testing Get Products...')
    const res = await fetch(`${BASE_URL}/products`)
    const data = await res.json()
    const products = data.products || data
    console.log(`   ✅ Found ${products.length || 0} products`)
    if (products.length > 0) {
      console.log(`   📦 First product: ${products[0].name}`)
    }
  } catch (error) {
    console.error('   ❌ Get products failed:', error.message)
  }

  // Test 3: Get Categories
  try {
    console.log('\n3️⃣ Testing Get Categories...')
    const res = await fetch(`${BASE_URL}/products/categories`)
    const data = await res.json()
    const categories = data.categories || data
    console.log(`   ✅ Found ${categories.length || 0} categories`)
    if (categories.length > 0) {
      categories.forEach((cat) => {
        console.log(`   📁 - ${cat.name}`)
      })
    }
  } catch (error) {
    console.error('   ❌ Get categories failed:', error.message)
  }

  // Test 4: Login
  let token = null
  try {
    console.log('\n4️⃣ Testing Login...')
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@toko.com',
        password: 'admin123',
      }),
    })
    const data = await res.json()
    if (data.token) {
      token = data.token
      console.log('   ✅ Login successful')
      console.log(`   👤 User: ${data.user?.email}`)
      console.log(`   🔑 Role: ${data.user?.role}`)
    } else {
      console.error('   ❌ Login failed:', data.error || 'Unknown error')
    }
  } catch (error) {
    console.error('   ❌ Login failed:', error.message)
  }

  // Test 5: Get Cart (requires auth)
  if (token) {
    try {
      console.log('\n5️⃣ Testing Get Cart (Protected)...')
      const res = await fetch(`${BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      console.log('   ✅ Cart access successful')
      console.log(`   🛒 Items: ${data.items?.length || 0}`)
    } catch (error) {
      console.error('   ❌ Get cart failed:', error.message)
    }
  }

  // Test 6: Get Orders (requires auth)
  if (token) {
    try {
      console.log('\n6️⃣ Testing Get Orders (Protected)...')
      const res = await fetch(`${BASE_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      const orders = data.orders || data
      console.log('   ✅ Orders access successful')
      console.log(`   📋 Orders: ${Array.isArray(orders) ? orders.length : 0}`)
    } catch (error) {
      console.error('   ❌ Get orders failed:', error.message)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 API Testing Complete!')
  console.log('='.repeat(50))
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with native fetch')
  console.log('💡 Or install node-fetch: npm install node-fetch')
  process.exit(1)
}

testAPI().catch(console.error)

