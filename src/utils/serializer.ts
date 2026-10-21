export function mapProduct(row: any) {
  if (!row) return null
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: parseFloat(row.price),
    oldPrice: row.old_price != null ? parseFloat(row.old_price) : undefined,
    rating: parseFloat(row.rating),
    image: row.image,
    cutout: row.cutout,
    description: row.description,
    material: row.material,
    dimensions: row.dimensions,
    inStock: row.in_stock,
    featured: row.featured,
    stockCount: parseInt(row.stock_count, 10),
    minOrderQuantity: parseInt(row.min_order_quantity, 10),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  }
}

export function mapChair(row: any) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    image: row.image,
    features: Array.isArray(row.features) ? row.features : (typeof row.features === 'string' ? JSON.parse(row.features) : []),
    inProduction: row.in_production,
    basePrice: row.base_price != null ? parseFloat(row.base_price) : 0,
  }
}

export function mapLead(row: any) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    priority: row.priority,
    estimatedValue: row.estimated_value != null ? parseFloat(row.estimated_value) : undefined,
    notes: row.notes,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at).toISOString() : undefined,
  }
}

export function mapOrder(row: any) {
  if (!row) return null
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    companyName: row.company_name,
    phone: row.phone,
    email: row.email,
    items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
    subtotal: parseFloat(row.subtotal),
    deliveryFee: parseFloat(row.delivery_fee),
    total: parseFloat(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryAddress: row.delivery_address,
    targetDeliveryDate: row.target_delivery_date,
    notes: row.notes,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  }
}

export function mapClient(row: any) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    sector: row.sector,
    featured: row.featured,
  }
}

export function mapTestimonial(row: any) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    company: row.company,
    quote: row.quote,
    rating: parseInt(row.rating, 10),
    approved: row.approved,
    featured: row.featured,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  }
}

export function mapSettings(row: any) {
  if (!row) return null
  return {
    name: row.name,
    addressLines: Array.isArray(row.address_lines) ? row.address_lines : (typeof row.address_lines === 'string' ? JSON.parse(row.address_lines) : []),
    phones: Array.isArray(row.phones) ? row.phones : (typeof row.phones === 'string' ? JSON.parse(row.phones) : []),
    email: row.email,
    whatsapp: typeof row.whatsapp === 'object' ? row.whatsapp : JSON.parse(row.whatsapp || '{}'),
    map: typeof row.map === 'object' ? row.map : JSON.parse(row.map || '{}'),
    gstin: row.gstin,
    factoryLocation: row.factory_location,
    freeDeliveryThreshold: parseFloat(row.free_delivery_threshold),
    standardDeliveryFee: parseFloat(row.standard_delivery_fee),
    bannerAnnouncement: row.banner_announcement,
    isBannerActive: row.is_banner_active,
  }
}
