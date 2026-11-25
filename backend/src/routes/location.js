/**
 * Location Routes
 * Public endpoints for Indonesian region lookups (provinsi → kelurahan + kode pos)
 */

import { Router } from 'express'
import { listProvinces, listRegencies, listDistricts, listVillages } from '../controllers/locationController.js'

const router = Router()

router.get('/provinces', listProvinces)
router.get('/regencies/:id', listRegencies)
router.get('/districts/:id', listDistricts)
router.get('/villages/:id', listVillages)

export default router
