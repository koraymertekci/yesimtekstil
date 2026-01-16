// Stok Projeksiyon Hesaplama Fonksiyonları

// Senaryo çarpanları
export const SCENARIO_MULTIPLIERS = {
  'normal': 1.0,
  'high': 1.2,
  'low': 0.85,
  'custom': null
}

// Ay isimleri (kısa)
const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// Tarih formatı (DD.MM.YYYY)
export const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

// Ay formatı (Oca 2026)
export const formatMonthLabel = (date) => {
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${month} ${year}`
}

// Tarih formatı (YYYY-MM-DD)
export const formatDateISO = (date) => {
  return date.toISOString().split('T')[0]
}

// Aylık adımlarla stok projeksiyonu hesaplama
export const calculateStockProjection = (material, months, scenario, customMultiplier, plannedReceipts, initialStockAdjustment) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const multiplier = scenario === 'custom' 
    ? (Number(customMultiplier || 0) / 100) + 1 
    : SCENARIO_MULTIPLIERS[scenario] || 1.0
  
  let currentStock = material.currentStock + (Number(initialStockAdjustment || 0))
  const safetyStock = material.safetyStock
  const dailyConsumption = material.dailyConsumption * multiplier
  const monthlyConsumption = dailyConsumption * 30 // Aylık tüketim
  
  const labels = []
  const stockSeries = []
  const safetySeries = []
  const riskSegments = []
  const stockoutMonths = []
  
  let firstRiskDate = null
  let stockoutDate = null
  let minStock = currentStock
  let maxStock = currentStock
  let totalConsumption = 0
  let segmentStart = null
  
  // Planlanan alımları ay bazında organize et
  const receiptsByMonth = {}
  plannedReceipts.forEach(receipt => {
    const arrivalDays = receipt.arriveInDays
    const arrivalMonth = Math.floor(arrivalDays / 30) // Hangi ay indeksinde (0, 1, 2, ...)
    if (!receiptsByMonth[arrivalMonth]) {
      receiptsByMonth[arrivalMonth] = 0
    }
    receiptsByMonth[arrivalMonth] += Number(receipt.qty || 0)
  })
  
  // Aylık simülasyon
  for (let month = 0; month < months; month++) {
    // Her ayın aynı günü (başlangıç tarihinin günü)
    const monthDate = new Date(today.getFullYear(), today.getMonth() + month, today.getDate())
    
    // Bu ay içindeki tüketim
    const monthConsumption = monthlyConsumption
    currentStock -= monthConsumption
    totalConsumption += monthConsumption
    
    // Bu ay içinde gelen alımlar
    if (receiptsByMonth[month]) {
      currentStock += receiptsByMonth[month]
    }
    
    // Negatif stoklara izin ver (stockout göstergesi)
    if (currentStock < 0 && !stockoutDate) {
      stockoutDate = new Date(monthDate)
    }
    
    if (currentStock < 0) {
      stockoutMonths.push(month)
    }
    
    // Min/Max stok takibi (negatif değerler dahil)
    if (currentStock < minStock) {
      minStock = currentStock
    }
    if (currentStock > maxStock) {
      maxStock = currentStock
    }
    
    // İlk risk tarihi (emniyet stok altına düşüş)
    if (currentStock < safetyStock && firstRiskDate === null) {
      firstRiskDate = new Date(monthDate)
    }
    
    // Risk segmenti takibi (emniyet stok altı)
    const isBelowSafety = currentStock < safetyStock
    
    if (isBelowSafety) {
      if (segmentStart === null) {
        segmentStart = month
      }
    } else {
      if (segmentStart !== null) {
        const segmentStartDate = new Date(today.getFullYear(), today.getMonth() + segmentStart, today.getDate())
        const segmentEndDate = new Date(today.getFullYear(), today.getMonth() + (month - 1), today.getDate())
        
        riskSegments.push({
          start: formatMonthLabel(segmentStartDate),
          end: formatMonthLabel(segmentEndDate),
          startIndex: segmentStart,
          endIndex: month - 1
        })
        segmentStart = null
      }
    }
    
    labels.push(formatMonthLabel(monthDate))
    stockSeries.push(Math.round(currentStock * 100) / 100)
    safetySeries.push(safetyStock)
  }
  
  // Son segment
  if (segmentStart !== null) {
    const segmentStartDate = new Date(today.getFullYear(), today.getMonth() + segmentStart, today.getDate())
    const segmentEndDate = new Date(today.getFullYear(), today.getMonth() + (months - 1), today.getDate())
    
    riskSegments.push({
      start: formatMonthLabel(segmentStartDate),
      end: formatMonthLabel(segmentEndDate),
      startIndex: segmentStart,
      endIndex: months - 1
    })
  }
  
  const avgDailyConsumption = totalConsumption / (months * 30)
  
  // Önerilen satın alma
  const recommendedOrder = calculateRecommendedOrder(
    material,
    stockSeries[stockSeries.length - 1],
    dailyConsumption,
    safetyStock,
    firstRiskDate
  )
  
  return {
    labels,
    stockSeries,
    safetySeries,
    riskSegments,
    stockoutMonths,
    firstRiskDate: firstRiskDate ? formatDateISO(firstRiskDate) : null,
    stockoutDate: stockoutDate ? formatDateISO(stockoutDate) : null,
    minStock: Math.round(minStock * 100) / 100,
    maxStock: Math.round(maxStock * 100) / 100,
    avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
    hasRisk: firstRiskDate !== null,
    isStockout: stockoutDate !== null,
    recommendedOrder
  }
}

// Önerilen satın alma hesaplama
const calculateRecommendedOrder = (material, currentStock, dailyConsumption, safetyStock, firstRiskDate) => {
  if (!firstRiskDate) {
    return null
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const riskDate = new Date(firstRiskDate)
  riskDate.setHours(0, 0, 0, 0)
  
  const daysUntilRisk = Math.ceil((riskDate - today) / (1000 * 60 * 60 * 24))
  const daysToOrder = daysUntilRisk - material.leadTimeDays - 3
  
  if (daysToOrder <= 0) {
    const urgentQty = (material.leadTimeDays + 30) * dailyConsumption + safetyStock - currentStock
    return {
      qty: Math.max(0, Math.round(urgentQty)),
      orderInDays: 0,
      urgent: true
    }
  }
  
  const normalQty = (30 + material.leadTimeDays) * dailyConsumption + safetyStock - currentStock
  return {
    qty: Math.max(0, Math.round(normalQty)),
    orderInDays: daysToOrder,
    urgent: false
  }
}
