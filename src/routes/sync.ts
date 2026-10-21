import { Router } from 'express'
import { pool } from '../db/pool.js'
import { seedDatabase } from '../db/seed.js'
import {
  mapChair,
  mapClient,
  mapLead,
  mapOrder,
  mapProduct,
  mapSettings,
  mapTestimonial,
} from '../utils/serializer.js'

export const syncRouter = Router()

// Reset database to initial seed data
syncRouter.post('/reset', async (_req, res) => {
  try {
    await pool.query(`
      TRUNCATE products, ergonomic_chairs, leads, orders, clients, testimonials, company_settings CASCADE;
    `)
    await seedDatabase()
    res.json({ success: true, message: 'Database reset to factory default seed data.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Full export
syncRouter.get('/export', async (_req, res) => {
  try {
    const productsRes = await pool.query('SELECT * FROM products ORDER BY id')
    const chairsRes = await pool.query('SELECT * FROM ergonomic_chairs ORDER BY id')
    const leadsRes = await pool.query('SELECT * FROM leads ORDER BY created_at DESC')
    const ordersRes = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
    const clientsRes = await pool.query('SELECT * FROM clients ORDER BY id')
    const testimonialsRes = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC')
    const settingsRes = await pool.query('SELECT * FROM company_settings WHERE id = $1', ['default'])

    res.json({
      exportedAt: new Date().toISOString(),
      products: productsRes.rows.map(mapProduct),
      chairs: chairsRes.rows.map(mapChair),
      leads: leadsRes.rows.map(mapLead),
      orders: ordersRes.rows.map(mapOrder),
      clients: clientsRes.rows.map(mapClient),
      testimonials: testimonialsRes.rows.map(mapTestimonial),
      settings: mapSettings(settingsRes.rows[0]),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
