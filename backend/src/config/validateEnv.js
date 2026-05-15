/**
 * Environment Variable Validator
 * Validates all required environment variables on startup.
 *
 * Best Practice: Fail fast — if a critical config is missing,
 * crash immediately with a clear error instead of failing silently at runtime.
 */

const REQUIRED_VARS = [
  { key: 'DATABASE_URL', description: 'PostgreSQL connection string' },
  { key: 'JWT_SECRET', description: 'Secret key for signing JWT tokens' },
]

const RECOMMENDED_VARS = [
  { key: 'PORT', description: 'Server port (defaults to 5000)' },
  { key: 'NODE_ENV', description: 'Environment (development/production)' },
  { key: 'FRONTEND_URL', description: 'Allowed CORS origins' },
  { key: 'JWT_EXPIRES_IN', description: 'JWT expiry duration (e.g., 7d)' },
  { key: 'SUPABASE_URL', description: 'Supabase project URL' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key' },
]

/**
 * Validates JWT_SECRET strength
 * @param {string} secret
 * @returns {boolean}
 */
const isStrongSecret = (secret) => secret && secret.length >= 32

/**
 * Validates environment variables and logs warnings/errors
 * @throws {Error} If any required variable is missing
 */
export const validateEnv = () => {
  const missing = []
  const warnings = []

  // Check required variables
  for (const { key, description } of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(`  ❌ ${key} — ${description}`)
    }
  }

  // Check JWT_SECRET strength specifically
  if (process.env.JWT_SECRET && !isStrongSecret(process.env.JWT_SECRET)) {
    missing.push('  ❌ JWT_SECRET is too short (minimum 32 characters required)')
  }

  // Check recommended variables (warn, don't crash)
  for (const { key, description } of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      warnings.push(`  ⚠️  ${key} — ${description} (using default)`)
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn('\n[Config] Missing recommended environment variables:')
    warnings.forEach((w) => console.warn(w))
  }

  // Crash on missing required vars
  if (missing.length > 0) {
    console.error('\n[Config] FATAL: Missing required environment variables:')
    missing.forEach((m) => console.error(m))
    console.error('\nPlease check your .env file and restart the server.\n')
    process.exit(1)
  }
}
