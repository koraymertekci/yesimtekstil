import client from './client.js'

const mapStockDTOToUI = (dto) => {
  return {
    rawMaterialId: dto.id,
    name: dto.name || '',
    category: dto.category || '',
    unit: dto.unit || '',
    currentStock: parseFloat(dto.currentStock) || 0,
    safetyStock: parseFloat(dto.safetyStock) || 0,
    estimatedConsumption30Days: parseFloat(dto.forecast30d) || 0,
    dailyConsumption: parseFloat(dto.dailyConsumption) || 0,
    shortage: parseFloat(dto.shortageAmount) || 0,
    daysUntilStockout: parseInt(dto.daysToStockout) || 0,
    criticalityScore: parseInt(dto.criticalityScore) || 0,
    riskLevel: dto.riskLevel === 'Yüksek' ? 'high' : dto.riskLevel === 'Orta' ? 'medium' : 'low',
    leadTimeDays: parseInt(dto.leadTimeDays) || 0,
    isTracked: dto.isTracked === 1 || dto.isTracked === true,
    action: (() => {
      const riskLevel = dto.riskLevel === 'Yüksek' ? 'high' : dto.riskLevel === 'Orta' ? 'medium' : 'low'
      const isTracked = dto.isTracked === 1 || dto.isTracked === true
      
      if (riskLevel === 'high') {
        return 'Satın Al'
      }
      if (isTracked) {
        return 'Takip Et'
      }
      return 'Sorun Yok'
    })(),
    actionType: (() => {
      const riskLevel = dto.riskLevel === 'Yüksek' ? 'high' : dto.riskLevel === 'Orta' ? 'medium' : 'low'
      const isTracked = dto.isTracked === 1 || dto.isTracked === true
      
      if (riskLevel === 'high') {
        return 'primary'
      }
      if (isTracked) {
        return 'warning'
      }
      return 'success'
    })(),
    recommendedOrderQuantity: Math.max(0, Math.round(
      (parseFloat(dto.forecast30d) || 0) + 
      ((parseFloat(dto.forecast30d) || 0) / 30) * (parseInt(dto.leadTimeDays) || 0) + 
      (parseFloat(dto.safetyStock) || 0) - 
      (parseFloat(dto.currentStock) || 0)
    )),
    orderDate: (() => {
      const today = new Date()
      const daysUntilStockout = parseInt(dto.daysToStockout) || 0
      const leadTimeDays = parseInt(dto.leadTimeDays) || 0
      const daysBeforeStockout = daysUntilStockout - leadTimeDays
      today.setDate(today.getDate() + Math.max(0, daysBeforeStockout - 3))
      return today.toISOString().split('T')[0]
    })()
  }
}

export const getCriticalStocks = async () => {
  try {
    const response = await client.get('/stocks/critical')
    
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(mapStockDTOToUI)
    }
    
    return []
  } catch (error) {
    console.error('API error:', error.message)
    throw error
  }
}

export const toggleMaterialTracking = async (materialId) => {
  try {
    const response = await client.post(`/stocks/${materialId}/toggle-track`)
    return response.data
  } catch (error) {
    console.error('Error toggling material tracking:', error)
    throw error
  }
}

