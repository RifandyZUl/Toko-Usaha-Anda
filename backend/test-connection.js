// Script untuk test database connection
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...')
    console.log('📡 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to database successfully!')
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query test successful:', result)
    
    // Check if database exists
    const dbCheck = await prisma.$queryRaw`
      SELECT datname FROM pg_database WHERE datname = 'toko_usaha_anda'
    `
    console.log('📊 Database check:', dbCheck.length > 0 ? '✅ Database exists' : '❌ Database not found')
    
    console.log('🎉 All tests passed!')
  } catch (error) {
    console.error('❌ Connection failed:')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    if (error.code === 'P1001') {
      console.log('\n💡 Solution: PostgreSQL service might not be running')
      console.log('   Run: net start postgresql-x64-16')
    } else if (error.code === 'P1002') {
      console.log('\n💡 Solution: Database might be locked or timeout')
      console.log('   1. Check if database exists')
      console.log('   2. Run: SELECT pg_advisory_unlock_all(); in database')
      console.log('   3. Restart PostgreSQL service')
    } else if (error.code === '3D000') {
      console.log('\n💡 Solution: Database does not exist')
      console.log('   Run: CREATE DATABASE toko_usaha_anda;')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

