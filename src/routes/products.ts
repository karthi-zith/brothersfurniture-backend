function inferProductType(category?: string, explicitType?: string): string {
  if (explicitType && explicitType.trim()) return explicitType.trim()
  if (!category) return "Others"
  const cat = category.toLowerCase()
  if (cat.includes("chair") || cat === "lounge" || cat.includes("seating")) return "Chairs"
  if (cat.includes("table") || cat.includes("desk")) return "Tables"
  if (cat.includes("workstation") || cat.includes("cubicle")) return "Workstations"
  if (cat.includes("storage") || cat.includes("cabinet") || cat.includes("pedestal")) return "Storage"
  return "Others"
}

import { Router } from 'express'
import { pool } from '../db/pool.js'
import { mapProduct } from '../utils/serializer.js'
import { syncEvents } from '../utils/syncEvents.js'

export const productsRouter = Router()

// List products
productsRouter.get('/', async (req, res) => {
  try {
    const { type, category, subCategory, inStock, featured, search } = req.query
    const conditions: string[] = []
    const values: any[] = []

    if (type && type !== 'All') {
      values.push(type)
      conditions.push("type = $" + values.length)
    }

    if (category && category !== 'All') {
      values.push(category)
      conditions.push("category = $" + values.length)
    }

    if (subCategory && subCategory !== 'All') {
      values.push(subCategory)
      conditions.push("sub_category = $" + values.length)
    }

    if (inStock !== undefined) {
      values.push(inStock === 'true')
      conditions.push(`in_stock = $${values.length}`)
    }

    if (featured !== undefined) {
      values.push(featured === 'true')
      conditions.push(`featured = $${values.length}`)
    }

    if (search) {
      values.push(`%${search}%`)
      conditions.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length} OR sku ILIKE $${values.length})`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const queryStr = `SELECT * FROM products ${whereClause} ORDER BY created_at DESC, id ASC`

    const result = await pool.query(queryStr, values)
    res.json(result.rows.map(mapProduct))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get single product
productsRouter.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json(mapProduct(result.rows[0]))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create product
productsRouter.post('/', async (req, res) => {
  try {
    const p = req.body
    const finalType = inferProductType(p.category, p.type)
    const id = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
    const sku = p.sku || `BF-${p.category.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`

    const queryStr = `
      INSERT INTO products (
        id, sku, name, type, category, sub_category, price, old_price, rating, image, cutout,
        description, material, dimensions, in_stock, featured, stock_count,
        min_order_quantity, updated_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *
    `
    const values = [
      id,
      sku,
      p.name,
      finalType,
      p.category,
      p.subCategory || null,
      p.price,
      p.oldPrice || null,
      p.rating || 5.0,
      p.image,
      p.cutout ?? false,
      p.description || null,
      p.material || null,
      p.dimensions || null,
      p.inStock ?? true,
      p.featured ?? false,
      p.stockCount ?? 10,
      p.minOrderQuantity ?? 1,
    ]

    const result = await pool.query(queryStr, values)
    const created = mapProduct(result.rows[0])
    syncEvents.notify('products', 'create', created?.id)
    res.status(201).json(created)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Update product
productsRouter.put('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const p = req.body

    const queryStr = `
      UPDATE products SET
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        type = COALESCE($3, type),
        category = COALESCE($4, category),
        sub_category = COALESCE($5, sub_category),
        price = COALESCE($6, price),
        old_price = $7,
        rating = COALESCE($8, rating),
        image = COALESCE($9, image),
        cutout = COALESCE($10, cutout),
        description = COALESCE($11, description),
        material = COALESCE($12, material),
        dimensions = COALESCE($13, dimensions),
        in_stock = COALESCE($14, in_stock),
        featured = COALESCE($15, featured),
        stock_count = COALESCE($16, stock_count),
        min_order_quantity = COALESCE($17, min_order_quantity),
        updated_at = NOW()
      WHERE id = $18
      RETURNING *
    `
    const values = [
      p.name,
      p.sku,
      p.type !== undefined ? p.type : (p.category ? inferProductType(p.category) : null),
      p.category,
      p.subCategory !== undefined ? p.subCategory : null,
      p.price,
      p.oldPrice !== undefined ? p.oldPrice : null,
      p.rating,
      p.image,
      p.cutout,
      p.description,
      p.material,
      p.dimensions,
      p.inStock,
      p.featured,
      p.stockCount,
      p.minOrderQuantity,
      id,
    ]

    const result = await pool.query(queryStr, values)
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    const updated = mapProduct(result.rows[0])
    syncEvents.notify('products', 'update', updated?.id)
    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Toggle stock
productsRouter.patch('/:id/toggle-stock', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE products SET in_stock = NOT in_stock, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    const updated = mapProduct(result.rows[0])
    syncEvents.notify('products', 'toggle-stock', updated?.id)
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Toggle featured
productsRouter.patch('/:id/toggle-featured', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE products SET featured = NOT featured, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    const updated = mapProduct(result.rows[0])
    syncEvents.notify('products', 'toggle-featured', updated?.id)
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Delete product
productsRouter.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    syncEvents.notify('products', 'delete', req.params.id)
    res.json({ success: true, id: req.params.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
