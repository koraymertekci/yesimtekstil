import client from './client.js'

// Mock stage history generator
const generateStageHistory = (currentStage, progress, daysRemaining) => {
  const stages = ['Planlama', 'Kesim', 'Dikim', 'Boya', 'Ütü', 'Paketleme', 'Teslim']
  const currentIndex = stages.indexOf(currentStage)
  // Eğer currentStage stages'de yoksa, ilk aşamada başlat
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0
  const history = []
  
  stages.forEach((stage, index) => {
    let status = 'pending'
    let plannedDays = Math.floor(Math.random() * 5) + 3
    let actualDays = null
    let delay = null
    
    if (index < safeCurrentIndex) {
      status = 'completed'
      actualDays = plannedDays + Math.floor(Math.random() * 3) - 1
      delay = actualDays - plannedDays
    } else if (index === safeCurrentIndex) {
      status = 'current'
      const progressRatio = Math.max(0, Math.min(1, progress / 100))
      actualDays = Math.floor(plannedDays * progressRatio)
    }
    
    history.push({
      stage,
      status,
      plannedDays,
      actualDays,
      delay
    })
  })
  
  return history
}

// Mock risk reasons generator
const generateRiskReasons = (riskLevel, daysRemaining, progress) => {
  const reasons = []
  
  if (riskLevel === 'high') {
    if (daysRemaining !== null && daysRemaining < 7) {
      reasons.push('Teslim tarihi çok yakın')
    }
    if (progress < 50) {
      reasons.push('İlerleme beklenenin altında')
    }
    reasons.push('Kapasite yoğunluğu yüksek')
  } else if (riskLevel === 'medium') {
    if (daysRemaining !== null && daysRemaining < 14) {
      reasons.push('Teslim tarihi yaklaşıyor')
    }
    if (progress < 70) {
      reasons.push('İlerleme normal seviyede')
    }
  } else {
    reasons.push('Sipariş normal seyrinde')
  }
  
  return reasons
}

const mapOrderDTOToUI = (dto) => {
  const riskLevel = dto.risk_level === 'high' ? 'high' : dto.risk_level === 'medium' ? 'medium' : 'low'
  const progress = dto.progress_pct || 0
  const daysRemaining = dto.days_remaining !== null ? parseInt(dto.days_remaining) : null
  const currentStage = dto.current_stage || 'Planlama'
  
  // Calculate expected progress based on days remaining
  const totalDays = 30 // Assume 30 days total
  const expectedProgress = daysRemaining !== null 
    ? Math.max(0, Math.min(100, Math.round((totalDays - daysRemaining) / totalDays * 100)))
    : 50
  
  const delayDifference = progress - expectedProgress
  
  // Determine if order will deliver on time
  let willDeliver = 'Evet'
  let willDeliverConfidence = '%95'
  
  if (riskLevel === 'high' || (daysRemaining !== null && daysRemaining < 0)) {
    willDeliver = 'Hayır'
    willDeliverConfidence = '%20'
  } else if (riskLevel === 'medium' || delayDifference < -10) {
    willDeliver = 'Belki'
    willDeliverConfidence = '%60'
  }
  
  // Generate risk reasons
  const riskReasons = generateRiskReasons(riskLevel, daysRemaining, progress)
  const riskReasonType = riskLevel === 'high' && daysRemaining !== null && daysRemaining < 7 ? 'stock' : null
  
  // Generate stage history
  const stageHistory = generateStageHistory(currentStage, progress, daysRemaining)
  
  return {
    id: dto.id,
    orderId: dto.order_code,
    brand: dto.customer_name,
    customer: dto.customer_name,
    productGroup: dto.product_group,
    stage: currentStage,
    progress,
    orderDate: dto.order_date || dto.delivery_date,
    deliveryDate: dto.delivery_date,
    quantity: dto.quantity || 0,
    daysRemaining,
    riskLevel,
    riskScore: dto.risk_score || 0,
    riskReasons,
    riskReasonType,
    willDeliver,
    willDeliverConfidence,
    expectedProgress,
    delayDifference,
    stageHistory,
    status: 'Devam Ediyor'
  }
}

export const getOrders = async (filters = {}) => {
  try {
    const params = {}
    if (filters.customer && filters.customer !== 'ALL') {
      params.customer = filters.customer
    }
    if (filters.stage) {
      params.stage = filters.stage
    }
    if (filters.risk) {
      params.risk = filters.risk
    }
    if (filters.search) {
      params.search = filters.search
    }

    const response = await client.get('/orders', { params })
    
    if (response.success && Array.isArray(response.data)) {
      return response.data.map(mapOrderDTOToUI)
    }
    
    return []
  } catch (error) {
    console.error('API error:', error.message)
    // API hata verdiğinde mock veri döndür
    console.warn('Using mock data due to API error')
    return generateMockOrders(filters)
  }
}

// Mock orders generator for fallback
const generateMockOrders = (filters = {}) => {
  const customers = ['Zara', 'Gerster', 'Under Armour', 'Mango', 'LC Waikiki']
  const productGroups = ['Polo', 'Denim', 'Knit', 'T-Shirt', 'Sweatshirt']
  const stages = ['Planlama', 'Kesim', 'Dikim', 'Boya', 'Ütü', 'Paketleme']
  const riskLevels = ['high', 'medium', 'low']
  
  const mockOrders = []
  const count = 10
  
  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const productGroup = productGroups[Math.floor(Math.random() * productGroups.length)]
    const stage = stages[Math.floor(Math.random() * stages.length)]
    const progress = Math.floor(Math.random() * 100)
    const daysRemaining = Math.floor(Math.random() * 30) - 5
    const riskLevel = daysRemaining < 7 ? 'high' : daysRemaining < 14 ? 'medium' : 'low'
    
    // Filter check
    if (filters.customer && filters.customer !== 'ALL' && customer !== filters.customer) {
      continue
    }
    if (filters.stage && stage !== filters.stage) {
      continue
    }
    if (filters.risk && riskLevel !== filters.risk) {
      continue
    }
    
    const mockDTO = {
      id: i + 1,
      order_code: `ORD-${String(i + 1).padStart(4, '0')}`,
      customer_name: customer,
      product_group: productGroup,
      current_stage: stage,
      progress_pct: progress,
      order_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 5000) + 1000,
      days_remaining: daysRemaining,
      risk_level: riskLevel,
      risk_score: riskLevel === 'high' ? 85 : riskLevel === 'medium' ? 55 : 20
    }
    
    mockOrders.push(mapOrderDTOToUI(mockDTO))
  }
  
  return mockOrders
}

export const getOrderById = async (orderId) => {
  try {
    const response = await client.get(`/orders/${orderId}`)
    
    if (response.success && response.data) {
      return mapOrderDTOToUI(response.data)
    }
    
    return null
  } catch (error) {
    console.error('API error:', error.message)
    throw error
  }
}

