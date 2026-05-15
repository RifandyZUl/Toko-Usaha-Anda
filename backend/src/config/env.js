/**
 * Environment Bootstrap
 * MUST be the very first import in server.js.
 * Loads .env file and validates all required variables
 * before any other module reads from process.env.
 */

import dotenv from 'dotenv'
dotenv.config()

export { validateEnv } from './validateEnv.js'
