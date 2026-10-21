import { Router } from 'express'
import { pool } from '../db/pool.js'
import { mapProduct } from '../utils/serializer.js'

export const productsRouter = Router()

// List products
productsRouter.get('/', async (req, res) => {
  try {
    const { category, inStock, featured, search } = req.query
    const conditions: string[] = []
    const values: any[] = []

    if (category && category !== 'All') {
      values.push(category)
      conditions.push(`category = $${values.length}`)
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
    const id = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
    const sku = p.sku || `BF-${p.category.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`

    const queryStr = `
      INSERT INTO products (
        id, sku, name, category, price, old_price, rating, image, cutout,
        description, material, dimensions, in_stock, featured, stock_count,
        min_order_quantity, updated_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `
    const values = [
      id,
      sku,
      p.name,
      p.category,
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
    res.status(201).json(mapProduct(result.rows[0]))
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
        category = COALESCE($3, category),
        price = COALESCE($4, price),
        old_price = $5,
        rating = COALESCE($6, rating),
        image = COALESCE($7, image),
        cutout = COALESCE($8, cutout),
        description = COALESCE($9, description),
        material = COALESCE($10, material),
        dimensions = COALESCE($11, dimensions),
        in_stock = COALESCE($12, in_stock),
        featured = COALESCE($13, featured),
        stock_count = COALESCE($14, stock_count),
        min_order_quantity = COALESCE($15, min_order_quantity),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `
    const values = [
      p.name,
      p.sku,
      p.category,
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
    res.json(mapProduct(result.rows[0]))
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
    res.json(mapProduct(result.rows[0]))
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
    res.json(mapProduct(result.rows[0]))
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
    res.json({ success: true, id: req.params.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
