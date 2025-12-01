// Script untuk clear lock dan sync database
// Catatan: Menggunakan prisma db push karena lebih cocok untuk development
// dan tidak memerlukan interactive mode seperti prisma migrate dev

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import process from 'process'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function clearLockAndSync() {
  try {
    console.log('🔄 Clearing advisory locks...')

    // Clear all advisory locks
    await prisma.$executeRaw`SELECT pg_advisory_unlock_all()`
    console.log('✅ Advisory locks cleared!')

    await prisma.$disconnect()

    console.log('🔄 Syncing database schema...')
    console.log('💡 Menggunakan prisma db push (tidak memerlukan interactive mode)')

    // Use prisma db push instead of migrate dev
    // db push langsung sync schema tanpa perlu interactive mode
    const isWindows = process.platform === 'win32'
    const command = isWindows ? 'npx.cmd prisma db push' : 'npx prisma db push'

    const { stdout, stderr } = await execAsync(command, {
      cwd: __dirname,
      shell: true,
      env: process.env,
    })

    if (stdout) console.log(stdout)

    // Filter out common non-critical errors
    if (stderr) {
      const ignoredErrors = [
        'npm',
        'Update available',
        'EPERM',
        'operation not permitted',
        'query_engine',
      ]

      const isIgnored = ignoredErrors.some(err => stderr.includes(err))
      if (!isIgnored) {
        console.error('⚠️ Warning:', stderr)
      } else if (stderr.includes('EPERM') || stderr.includes('operation not permitted')) {
        console.log(
          '⚠️ Note: File permission warning (biasanya karena file sedang digunakan, bisa diabaikan)'
        )
      }
    }

    console.log('\n✅ Database sync completed!')
    console.log('\n💡 Catatan:')
    console.log('   - prisma db push cocok untuk development')
    console.log('   - Untuk production, gunakan prisma migrate setelah lock issue teratasi')
  } catch (error) {
    console.error('❌ Error:', error.message)

    console.log('\n💡 Solusi alternatif:')
    console.log('   1. Pastikan PostgreSQL service berjalan')
    console.log('   2. Cek koneksi database di .env file')
    console.log('   3. Test connection: npm run test:db')
    console.log('\n   Atau manual steps:')
    console.log('   1. Open pgAdmin')
    console.log('   2. Connect to database toko_usaha_anda')
    console.log('   3. Run: SELECT pg_advisory_unlock_all();')
    console.log('   4. Then run: npx prisma db push')
  } finally {
    try {
      await prisma.$disconnect()
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

clearLockAndSync().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
