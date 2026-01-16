import client from './client.js'

const mapMachineDTOToUI = (dto) => {
  return {
    id: dto.id?.toString() || '',
    name: dto.name || '',
    category: dto.category || '',
    process: dto.process_desc || dto.process || '',
    notes: dto.note || dto.notes || '',
    status: dto.status || 'Boşta',
    utilizationPct: dto.utilization_pct !== undefined ? parseFloat(dto.utilization_pct) : 0,
    updatedAt: dto.updated_at || null,
    lastMaintenanceDate: dto.last_maintenance_date || null,
    avgMaintenanceHours: dto.avg_maintenance_hours !== undefined ? parseFloat(dto.avg_maintenance_hours) : null,
    staffCount: dto.staff_count !== undefined ? parseInt(dto.staff_count) : null,
    activeOrder: dto.activeOrder ? {
      orderId: dto.activeOrder.order_code || dto.activeOrder.order_id || '',
      customer: dto.activeOrder.customer_name || dto.activeOrder.customer || '',
      stage: dto.activeOrder.stage_name || dto.activeOrder.stage || '',
      progress: dto.activeOrder.progress_pct !== undefined ? parseFloat(dto.activeOrder.progress_pct) : 0,
      deliveryDate: dto.activeOrder.delivery_date || null,
      riskLevel: dto.activeOrder.risk_level || 'low',
      daysRemaining: dto.activeOrder.remaining_days !== undefined ? parseInt(dto.activeOrder.remaining_days) : null
    } : null
  }
}

export const getMachines = async (filters = {}) => {
  try {
    const params = {}
    if (filters.category && filters.category !== 'Tümü') {
      params.category = filters.category
    }
    if (filters.q) {
      params.q = filters.q
    }

    const response = await client.get('/machines', { params })
    
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(mapMachineDTOToUI)
    }
    
    return []
  } catch (error) {
    console.error('API error:', error.message)
    throw error
  }
}

export const getMachineById = async (machineId) => {
  try {
    const response = await client.get(`/machines/${machineId}`)
    
    if (response.success && response.data) {
      return mapMachineDTOToUI(response.data)
    }
    
    return null
  } catch (error) {
    console.error('API error:', error.message)
    throw error
  }
}

