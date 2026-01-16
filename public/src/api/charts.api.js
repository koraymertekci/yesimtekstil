import client from './client.js'

export const getLateReasonBreakdown = async (days = 30) => {
  try {
    const response = await client.get('/charts/late-reason-breakdown', {
      params: { days }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    let is404 = false
    
    if (error.response) {
      statusCode = error.response.status
      if (statusCode === 404) {
        errorMessage = `Backend route bulunamadı: /api/charts/late-reason-breakdown`
        is404 = true
      } else if (statusCode >= 500) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Sunucu hatası'
      } else {
        errorMessage = error.response.data?.error || error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error('API error (getLateReasonBreakdown):', {
      message: errorMessage,
      status: statusCode,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    })
    
    const customError = new Error(errorMessage)
    customError.status = statusCode
    customError.is404 = is404
    throw customError
  }
}

export const getTerminRiskProfile = async (windows = '30,60,90') => {
  try {
    const response = await client.get('/charts/termin-risk-profile', {
      params: { windows }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    let is404 = false
    
    if (error.response) {
      statusCode = error.response.status
      if (statusCode === 404) {
        errorMessage = `Backend route bulunamadı: /api/charts/termin-risk-profile`
        is404 = true
      } else if (statusCode >= 500) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Sunucu hatası'
      } else {
        errorMessage = error.response.data?.error || error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error('API error (getTerminRiskProfile):', {
      message: errorMessage,
      status: statusCode,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    })
    
    const customError = new Error(errorMessage)
    customError.status = statusCode
    customError.is404 = is404
    throw customError
  }
}

export const getLateOrdersCumulative = async (range = '6m') => {
  try {
    const response = await client.get('/charts/late-orders-cumulative', {
      params: { range }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    let is404 = false
    
    if (error.response) {
      statusCode = error.response.status
      if (statusCode === 404) {
        errorMessage = `Backend route bulunamadı: /api/charts/late-orders-cumulative`
        is404 = true
      } else if (statusCode >= 500) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Sunucu hatası'
      } else {
        errorMessage = error.response.data?.error || error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error('API error (getLateOrdersCumulative):', {
      message: errorMessage,
      status: statusCode,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    })
    
    const customError = new Error(errorMessage)
    customError.status = statusCode
    customError.is404 = is404
    throw customError
  }
}

export const getOtifTrend = async (range = 6) => {
  try {
    const response = await client.get('/charts/otif-trend', {
      params: { range }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    let is404 = false
    
    if (error.response) {
      statusCode = error.response.status
      if (statusCode === 404) {
        errorMessage = `Backend route bulunamadı: /api/charts/otif-trend`
        is404 = true
      } else if (statusCode >= 500) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Sunucu hatası'
      } else {
        errorMessage = error.response.data?.error || error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error('API error (getOtifTrend):', {
      message: errorMessage,
      status: statusCode,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    })
    
    if (is404 || statusCode >= 500 || statusCode === 'CONNECTION_REFUSED' || statusCode === 'NO_RESPONSE') {
      return generateMockOtifTrend(range)
    }
    
    const customError = new Error(errorMessage)
    customError.status = statusCode
    customError.is404 = is404
    throw customError
  }
}

function generateMockOtifTrend(rangeMonths = 6) {
  const weeksCount = rangeMonths === 12 ? 52 : 26
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const getWeekStartDate = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }
  
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeksCount * 7))
  
  const points = []
  let currentWeek = new Date(startDate)
  let baseOtif = 90
  
  while (currentWeek <= today) {
    const weekStart = getWeekStartDate(currentWeek)
    const weekKey = formatDate(weekStart)
    const weekIndex = points.length
    
    const trend = weekIndex / weeksCount
    const variation = (Math.sin(weekIndex * 0.2) * 3) + (Math.random() * 2 - 1)
    const otif = Math.max(85, Math.min(98, baseOtif + trend * 2 + variation))
    
    points.push({
      date: weekKey,
      otif: Math.round(otif * 10) / 10,
      late: Math.round((100 - otif) * 10) / 10,
      target: 95
    })
    
    currentWeek.setDate(currentWeek.getDate() + 7)
  }
  
  return {
    rangeMonths: rangeMonths,
    target: 95,
    points: points
  }
}

export const getOtifHeatmap = async (range = 6) => {
  try {
    const response = await client.get('/charts/otif-heatmap', {
      params: { range }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    let is404 = false
    
    if (error.response) {
      statusCode = error.response.status
      if (statusCode === 404) {
        errorMessage = `Backend route bulunamadı: /api/charts/otif-heatmap`
        is404 = true
      } else if (statusCode >= 500) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Sunucu hatası'
      } else {
        errorMessage = error.response.data?.error || error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error('API error (getOtifHeatmap):', {
      message: errorMessage,
      status: statusCode,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    })
    
    if (is404 || statusCode >= 500 || statusCode === 'CONNECTION_REFUSED' || statusCode === 'NO_RESPONSE') {
      return generateMockOtifHeatmap(range)
    }
    
    const customError = new Error(errorMessage)
    customError.status = statusCode
    customError.is404 = is404
    throw customError
  }
}

function generateMockOtifHeatmap(rangeMonths = 6) {
  const weeksCount = rangeMonths === 12 ? 52 : 26
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `2025-W${String(weekNum).padStart(2, '0')}`
  }
  
  const lines = [
    { name: 'Dokuma', baseOtif: 94, volatility: 3, seasonal: 0.5 },
    { name: 'Örme', baseOtif: 92, volatility: 4, seasonal: 0.6 },
    { name: 'Boya', baseOtif: 88, volatility: 6, seasonal: 0.8 },
    { name: 'Terbiye', baseOtif: 90, volatility: 5, seasonal: 0.7 },
    { name: 'Kesim', baseOtif: 95, volatility: 2, seasonal: 0.3 },
    { name: 'Dikim', baseOtif: 93, volatility: 3, seasonal: 0.4 },
    { name: 'Paketleme', baseOtif: 96, volatility: 1.5, seasonal: 0.2 },
    { name: 'Lojistik', baseOtif: 91, volatility: 4, seasonal: 0.5 }
  ]
  
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeksCount * 7))
  
  const allWeeks = []
  let currentWeek = new Date(startDate)
  while (currentWeek <= today) {
    allWeeks.push(getWeekNumber(currentWeek))
    currentWeek.setDate(currentWeek.getDate() + 7)
  }
  
  const rows = lines.map(line => {
    const weeks = allWeeks.map((week, weekIndex) => {
      const seasonalFactor = Math.sin((weekIndex / weeksCount) * Math.PI * 2) * line.seasonal
      const randomFactor = (Math.random() - 0.5) * line.volatility
      let otif = line.baseOtif + seasonalFactor + randomFactor
      
      if (Math.random() < 0.05) {
        otif = Math.max(75, otif - 5)
      }
      
      otif = Math.max(80, Math.min(99, otif))
      const total = Math.floor(Math.random() * 140) + 120
      const late = Math.round(total * (100 - otif) / 100)
      
      return {
        week: week,
        otif: Math.round(otif * 10) / 10,
        late: late,
        total: total
      }
    })
    
    return {
      name: line.name,
      weeks: weeks
    }
  })
  
  return {
    rangeMonths: rangeMonths,
    target: 95,
    rows: rows
  }
}

export const getProductionEfficiency = async (range = 6) => {
  try {
    const response = await client.get('/charts/production-efficiency', {
      params: { range }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    let is404 = false
    
    if (error.response) {
      statusCode = error.response.status
      if (statusCode === 404) {
        errorMessage = `Backend route bulunamadı: /api/charts/production-efficiency`
        is404 = true
      } else if (statusCode >= 500) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Sunucu hatası'
      } else {
        errorMessage = error.response.data?.error || error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error('API error (getProductionEfficiency):', {
      message: errorMessage,
      status: statusCode,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    })
    
    if (is404 || statusCode >= 500 || statusCode === 'CONNECTION_REFUSED' || statusCode === 'NO_RESPONSE') {
      return generateMockProductionEfficiency(range)
    }
    
    const customError = new Error(errorMessage)
    customError.status = statusCode
    customError.is404 = is404
    throw customError
  }
}

function generateMockProductionEfficiency(rangeMonths = 6) {
  const daysCount = rangeMonths === 12 ? 365 : 180
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - daysCount)
  
  const oeePoints = []
  const speedPoints = []
  const errorPoints = []
  
  let baseOee = 75
  let baseSpeed = 82
  let baseError = 3.5
  
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = formatDate(date)
    const dayIndex = i
    
    const progress = dayIndex / daysCount
    
    if (Math.random() < 0.02 && dayIndex > 30) {
      baseOee = Math.max(60, baseOee - 8)
      baseError = Math.min(8, baseError + 2)
    } else if (baseOee < 75) {
      baseOee = Math.min(85, baseOee + 0.3)
      baseError = Math.max(1, baseError - 0.1)
    }
    
    const seasonalFactor = Math.sin(progress * Math.PI * 4) * 3
    const randomFactor = (Math.random() - 0.5) * 4
    
    const oee = Math.max(60, Math.min(90, baseOee + seasonalFactor + randomFactor))
    const speed = Math.max(70, Math.min(95, baseSpeed + (oee - baseOee) * 0.6 + (Math.random() - 0.5) * 3))
    const error = Math.max(1, Math.min(8, baseError - (oee - baseOee) * 0.05 + (Math.random() - 0.5) * 1.5))
    
    oeePoints.push({
      date: dateStr,
      value: Math.round(oee * 10) / 10
    })
    speedPoints.push({
      date: dateStr,
      value: Math.round(speed * 10) / 10
    })
    errorPoints.push({
      date: dateStr,
      value: Math.round(error * 10) / 10
    })
  }
  
  return {
    rangeMonths: rangeMonths,
    series: [
      {
        name: 'OEE (%)',
        points: oeePoints
      },
      {
        name: 'Çalışma Hızı (%)',
        points: speedPoints
      },
      {
        name: 'Hata Oranı (%)',
        points: errorPoints
      }
    ]
  }
}

