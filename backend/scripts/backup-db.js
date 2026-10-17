/**
 * Database Backup Script
 * Creates timestamped PostgreSQL dumps and cleans up backups older than 7 days
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
const RETENTION_DAYS = 7

/**
 * Format current date for backup filename
 */
function getTimestamp() {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

/**
 * Find working pg_dump command across different OS & Docker setups
 */
function resolvePgDumpCommand(dbUrl) {
  // 1. Try system PATH
  try {
    execSync('pg_dump --version', { stdio: 'ignore' })
    return `pg_dump "${dbUrl}"`
  } catch {
    // Continue searching
  }

  // 2. Check Windows Program Files PostgreSQL installation paths
  if (process.platform === 'win32') {
    const pgProgramFiles = 'C:\\Program Files\\PostgreSQL'
    if (fs.existsSync(pgProgramFiles)) {
      const versions = fs.readdirSync(pgProgramFiles)
      for (const ver of versions.sort().reverse()) {
        const exePath = path.join(pgProgramFiles, ver, 'bin', 'pg_dump.exe')
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
      return `docker exec toko-postgres pg_dump -U postgres toko_usaha_anda`
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
 * Perform database backup
 */
export function performBackup() {
  const rawDbUrl = process.env.DATABASE_URL
  if (!rawDbUrl) {
    console.error('❌ DATABASE_URL is missing in environment variables')
    process.exit(1)
  }

  const dbUrl = cleanDbUrl(rawDbUrl)

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const timestamp = getTimestamp()
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`)

  const dumpCmd = resolvePgDumpCommand(dbUrl)

  if (!dumpCmd) {
    console.error('❌ Tidak dapat menemukan perintah pg_dump.')
    console.error('   Petunjuk:')
    console.error('   1. Pastikan PostgreSQL terinstal di komputer Anda, atau')
    console.error('   2. Tambahkan folder bin PostgreSQL (misal C:\\Program Files\\PostgreSQL\\16\\bin) ke PATH Windows, atau')
    console.error('   3. Jalankan container Docker toko-postgres dengan perintah: docker compose up -d postgres')
    process.exit(1)
  }

  console.log(`📦 Starting PostgreSQL backup to: ${backupFile}`)

  try {
    execSync(`${dumpCmd} > "${backupFile}"`, { stdio: 'inherit', shell: true })
    console.log(`✅ Backup created successfully: ${backupFile}`)

    // Prune backups older than 7 days
    pruneOldBackups()
  } catch (error) {
    console.error('❌ Database backup failed:', error.message)
    process.exit(1)
  }
}

/**
 * Delete backups older than RETENTION_DAYS
 */
function pruneOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
  const now = Date.now()
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000

  files.forEach((file) => {
    if (file.startsWith('backup_') && file.endsWith('.sql')) {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath)
        console.log(`🧹 Deleted old backup file: ${file}`)
      }
    }
  })
}

// Run backup if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  performBackup()
}
