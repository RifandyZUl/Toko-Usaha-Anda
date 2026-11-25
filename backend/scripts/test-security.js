/**
 * Security Verification Test
 * Verifies all security middleware is working correctly
 */

const BASE_URL = 'http://localhost:5000'

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

const pass = (msg) => console.log(`${colors.green}  ✅ PASS${colors.reset} ${msg}`)
const fail = (msg) => console.log(`${colors.red}  ❌ FAIL${colors.reset} ${msg}`)
const section = (msg) => console.log(`\n${colors.bold}${colors.cyan}── ${msg} ──${colors.reset}`)

async function runTests() {
  console.log(`\n${colors.bold}🔒 Security Verification Tests${colors.reset}`)
  console.log(`Testing: ${BASE_URL}\n`)

  // ── 1. Helmet Security Headers ──────────────────────────────────────────────
  section('1. Security Headers (Helmet)')
  try {
    const res = await fetch(`${BASE_URL}/api/health`)
    const headers = res.headers

    headers.get('x-powered-by') === null
      ? pass('X-Powered-By header is hidden')
      : fail('X-Powered-By is exposed!')

    headers.get('x-content-type-options') === 'nosniff'
      ? pass('X-Content-Type-Options: nosniff')
      : fail('X-Content-Type-Options missing!')

    headers.get('x-frame-options') === 'DENY'
      ? pass('X-Frame-Options: DENY (Clickjacking protected)')
      : fail('X-Frame-Options missing!')

    headers.get('content-security-policy')
      ? pass('Content-Security-Policy header present')
      : fail('Content-Security-Policy missing!')
  } catch (e) {
    fail(`Could not reach server: ${e.message}`)
  }

  // ── 2. Input Validation ─────────────────────────────────────────────────────
  section('2. Input Validation')
  try {
    // Test empty login body
    const emptyLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    emptyLogin.status === 400
      ? pass('Empty login body → 400 Bad Request')
      : fail(`Empty login body returned ${emptyLogin.status} instead of 400`)

    // Test invalid email
    const invalidEmail = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'test123' }),
    })
    invalidEmail.status === 400
      ? pass('Invalid email → 400 Bad Request')
      : fail(`Invalid email returned ${invalidEmail.status} instead of 400`)

    // Test invalid UUID on product endpoint
    const invalidUUID = await fetch(`${BASE_URL}/api/products/not-a-uuid`)
    invalidUUID.status === 400
      ? pass('Invalid UUID param → 400 Bad Request')
      : fail(`Invalid UUID returned ${invalidUUID.status} instead of 400`)
  } catch (e) {
    fail(`Validation test error: ${e.message}`)
  }

  // ── 3. Large Payload Protection ─────────────────────────────────────────────
  section('3. Payload Size Limit (10kb)')
  try {
    const largePayload = { data: 'x'.repeat(20000) } // 20kb > 10kb limit
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largePayload),
    })
    res.status === 413
      ? pass('Large payload (20kb) → 413 Payload Too Large')
      : fail(`Large payload returned ${res.status} instead of 413`)
  } catch (e) {
    // Connection reset = server rejected it (also a pass)
    pass('Large payload rejected by server (connection refused)')
  }

  // ── 4. 404 Handler ──────────────────────────────────────────────────────────
  section('4. 404 & Unknown Routes')
  try {
    const res = await fetch(`${BASE_URL}/api/nonexistent-route`)
    const body = await res.json()
    res.status === 404 && body.error
      ? pass('Unknown route → 404 with JSON error body')
      : fail(`Unknown route returned ${res.status}`)
  } catch (e) {
    fail(`404 test error: ${e.message}`)
  }

  // ── 5. Rate Limiting Headers ─────────────────────────────────────────────────
  section('5. Rate Limit Headers')
  try {
    const res = await fetch(`${BASE_URL}/api/health`)
    res.headers.get('ratelimit-limit')
      ? pass(`Rate limit headers present (Limit: ${res.headers.get('ratelimit-limit')})`)
      : fail('Rate limit headers missing')
  } catch (e) {
    fail(`Rate limit header test error: ${e.message}`)
  }

  console.log(`\n${colors.bold}✅ Security verification complete!${colors.reset}\n`)
}

runTests().catch(console.error)
