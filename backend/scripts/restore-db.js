/**
 * Database Restore Script
 * Restores PostgreSQL database from a chosen backup SQL file
 * Supports: System PATH, Windows PostgreSQL install paths, and Docker container fallback
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BACKUP_DIR = path.join(__dirname, '../backups')

/**
 * Find working psql command across different OS & Docker setups
 */
function resolvePsqlCommand(dbUrl) {
  // 1. Try system PATH
  try {
    execSync('psql --version', { stdio: 'ignore' })
    return `psql "${dbUrl}"`
  } catch {
    // Continue searching
  }

  // 2. Check Windows Program Files PostgreSQL installation paths
  if (process.platform === 'win32') {
    const pgProgramFiles = 'C:\\Program Files\\PostgreSQL'
    if (fs.existsSync(pgProgramFiles)) {
      const versions = fs.readdirSync(pgProgramFiles)
      for (const ver of versions.sort().reverse()) {
        const exePath = path.join(pgProgramFiles, ver, 'bin', 'psql.exe')
        if (fs.existsSync(exePath)) {
          return `"${exePath}" "${dbUrl}"`
        }
      }
    }
  }

  // 3. Fallback: check if Docker container toko-postgres is running
  try {
    const isDockerRunning = execSync('docker ps --filter "name=toko-postgres" --format "{{.Names}}"', { encoding: 'utf-8' }).trim()
    if (isDockerRunning === 'toko-postgres') {
      return `docker exec -i toko-postgres psql -U postgres toko_usaha_anda`
    }
  } catch {
    // Docker check failed
  }

  return null
}

/**
 * Remove Prisma-specific query parameters (like ?schema=public) that cause pg_dump/psql to fail
 */
function cleanDbUrl(url) {
  if (!url) return url
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('schema')
    return parsed.toString()
  } catch {
    return url.replace(/([?&])schema=[^&]*&?/, '$1').replace(/[?&]$/, '')
  }
}

/**
 * Perform database restore
 */
export function performRestore() {
  const rawDbUrl = process.env.DATABASE_URL
  if (!rawDbUrl) {
    console.error('❌ DATABASE_URL is missing in environment variables')
    process.exit(1)
  }

  const dbUrl = cleanDbUrl(rawDbUrl)

  // Get file name from command line argument (--file=filename.sql or filename.sql)
  const fileArg = process.argv.find((arg) => arg.startsWith('--file='))?.split('=')[1] || process.argv[2]

  if (!fileArg) {
    console.error('❌ Please specify backup file. Example: npm run db:restore -- --file=backup_2026-08-16.sql')
    if (fs.existsSync(BACKUP_DIR)) {
      console.log('Available backups in backend/backups/:')
      fs.readdirSync(BACKUP_DIR).forEach((f) => console.log(`  - ${f}`))
    }
    process.exit(1)
  }

  const backupFile = path.isAbsolute(fileArg) ? fileArg : path.join(BACKUP_DIR, fileArg)

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`)
    process.exit(1)
  }

  const psqlCmd = resolvePsqlCommand(dbUrl)

  if (!psqlCmd) {
    console.error('❌ Tidak dapat menemukan perintah psql.')
    console.error('   Petunjuk:')
    console.error('   1. Pastikan PostgreSQL terinstal di komputer Anda, atau')
    console.error('   2. Tambahkan folder bin PostgreSQL (misal C:\\Program Files\\PostgreSQL\\16\\bin) ke PATH Windows, atau')
    console.error('   3. Jalankan container Docker toko-postgres dengan perintah: docker compose up -d postgres')
    process.exit(1)
  }

  console.log(`⚠️ Restoring database from: ${backupFile}`)

  try {
    execSync(`${psqlCmd} < "${backupFile}"`, { stdio: 'inherit', shell: true })
    console.log(`✅ Database restored successfully from: ${backupFile}`)
  } catch (error) {
    console.error('❌ Database restore failed:', error.message)
    process.exit(1)
  }
}

// Run restore if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  performRestore()
}
