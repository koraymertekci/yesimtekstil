// Mock Marka Bazlı Sipariş Verileri
// Son 3 yıl (2023, 2024, 2025) aylık sipariş miktarları

import { CUSTOMERS } from './customers'

// Basit seeded hash fonksiyonu (deterministik)
const seededHash = (str, seed = 0) => {
  let hash = seed
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit integer'a çevir
  }
  return Math.abs(hash)
}

// Seeded random (0-1 arası)
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Marka bazlı ölçek faktörleri
const BRAND_SCALE_FACTORS = {
  'Nike': 1.8,
  'Under Armour': 1.5,
  'Zara': 2.0,
  'Bershka': 1.7,
  'Tommy Hilfiger': 1.2,
  'Tommy Jeans': 1.0,
  'Lacoste': 0.9,
  'Calvin Klein': 1.1,
  'Polo Ralph Lauren': 1.0,
  'Guess': 1.0,
  'Mudo': 0.7,
  'Aldi': 1.3,
  'Gerster': 0.6,
  'Tchibo': 1.1,
  'Matheis': 0.5,
  'Schlafgut': 0.4
}

// Sezon bazlı çarpanlar (ay bazlı)
const SEASONAL_MULTIPLIERS = {
  'İlkbahar': { 3: 0.9, 4: 1.0, 5: 1.1 }, // Mar, Apr, May
  'Yaz': { 6: 1.3, 7: 1.4, 8: 1.3 }, // Jun, Jul, Aug
  'Sonbahar': { 9: 1.0, 10: 0.95, 11: 0.9 }, // Sep, Oct, Nov
  'Kış': { 12: 1.1, 1: 0.8, 2: 0.85 } // Dec, Jan, Feb
}

// Marka bazlı kış sezonu çarpanları (bazı markalar kışta yüksek, bazıları düşük)
const WINTER_BRAND_MULTIPLIERS = {
  'Nike': 1.2, // Spor giyim kışta yüksek
  'Under Armour': 1.15,
  'Zara': 0.7, // Fast fashion kışta düşük
  'Bershka': 0.65,
  'Tommy Hilfiger': 1.0,
  'Tommy Jeans': 0.9,
  'Lacoste': 0.85,
  'Calvin Klein': 0.95,
  'Polo Ralph Lauren': 1.05,
  'Guess': 0.9,
  'Mudo': 1.0,
  'Aldi': 1.1,
  'Gerster': 1.0,
  'Tchibo': 1.05,
  'Matheis': 1.2, // Ev tekstili kışta yüksek
  'Schlafgut': 1.25
}

// Yıl bazlı trend faktörleri
const YEARLY_TREND = {
  2023: 1.0,
  2024: 1.05, // %5 büyüme
  2025: 1.10  // %10 büyüme (2023'e göre)
}

// getSeason fonksiyonu (ay numarasından sezon belirleme)
const getSeason = (month) => {
  if (month >= 3 && month <= 5) return 'İlkbahar'
  if (month >= 6 && month <= 8) return 'Yaz'
  if (month >= 9 && month <= 11) return 'Sonbahar'
  return 'Kış'
}

// Tek bir marka için bir ayın sipariş miktarını hesapla
const calculateMonthlyOrder = (brand, year, month) => {
  // Seed oluştur (deterministik)
  const seed = seededHash(`${brand}-${year}-${month}`)
  
  // Baz miktar (marka ölçeğine göre)
  const baseScale = BRAND_SCALE_FACTORS[brand] || 1.0
  const baseQty = 15000 * baseScale
  
  // Sezon çarpanı
  const season = getSeason(month)
  let seasonMultiplier = 1.0
  
  if (season === 'Kış') {
    const winterMultiplier = WINTER_BRAND_MULTIPLIERS[brand] || 1.0
    seasonMultiplier = SEASONAL_MULTIPLIERS[season][month] * winterMultiplier
  } else {
    seasonMultiplier = SEASONAL_MULTIPLIERS[season][month] || 1.0
  }
  
  // Yıl trendi
  const yearTrend = YEARLY_TREND[year] || 1.0
  
  // Rastgele varyasyon (seeded, deterministik)
  const variation = 0.85 + (seededRandom(seed) * 0.3) // 0.85 - 1.15 arası
  
  // Final miktar
  const qty = Math.round(baseQty * seasonMultiplier * yearTrend * variation)
  
  return qty
}

// Bir marka için son 3 yılın tüm aylık siparişlerini oluştur
export const generateBrandOrders = (brand) => {
  const orders = {}
  const years = [2023, 2024, 2025]
  
  years.forEach(year => {
    orders[year] = {}
    for (let month = 1; month <= 12; month++) {
      orders[year][month] = calculateMonthlyOrder(brand, year, month)
    }
  })
  
  return orders
}

// Tüm markalar için sipariş verilerini oluştur
export const generateAllBrandOrders = () => {
  const allOrders = {}
  
  CUSTOMERS.forEach(brand => {
    allOrders[brand] = generateBrandOrders(brand)
  })
  
  return allOrders
}

// Seçili markalar için sezon ortalamalarını hesapla
export const calculateSeasonAverages = (selectedBrands, allOrders) => {
  const seasonAverages = {}
  
  selectedBrands.forEach(brand => {
    if (!allOrders[brand]) return
    
    const brandAverages = {
      'İlkbahar': [],
      'Yaz': [],
      'Sonbahar': [],
      'Kış': []
    }
    
    // Son 3 yıl verilerini topla
    [2023, 2024, 2025].forEach(year => {
      if (!allOrders[brand][year]) return
      
      for (let month = 1; month <= 12; month++) {
        const season = getSeason(month)
        const qty = allOrders[brand][year][month]
        if (qty) {
          brandAverages[season].push(qty)
        }
      }
    })
    
    // Her sezon için ortalama hesapla
    seasonAverages[brand] = {}
    Object.keys(brandAverages).forEach(season => {
      const values = brandAverages[season]
      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        seasonAverages[brand][season] = Math.round(avg)
      } else {
        seasonAverages[brand][season] = 0
      }
    })
  })
  
  return seasonAverages
}

// Önümüzdeki 6 ay için tahmin hesapla
export const calculateForecastForMonths = (selectedBrands, seasonAverages, months) => {
  const forecast = {}
  
  selectedBrands.forEach(brand => {
    forecast[brand] = {}
    
    months.forEach(monthData => {
      const season = monthData.season
      const avgQty = seasonAverages[brand]?.[season] || 0
      forecast[brand][monthData.label] = avgQty
    })
  })
  
  return forecast
}

// Marka özet istatistikleri
export const calculateBrandSummary = (brand, seasonAverages, forecast) => {
  const seasonValues = seasonAverages[brand] || {}
  const forecastValues = Object.values(forecast[brand] || {})
  
  // 6 ay toplam
  const sixMonthTotal = forecastValues.reduce((sum, val) => sum + val, 0)
  
  // En yüksek sezon
  const maxSeason = Object.entries(seasonValues).reduce((max, [season, value]) => {
    return value > max[1] ? [season, value] : max
  }, ['', 0])[0]
  
  // 3 yıl ortalama / ay (tüm sezonların ortalaması)
  const allSeasonValues = Object.values(seasonValues)
  const avgPerMonth = allSeasonValues.length > 0
    ? Math.round(allSeasonValues.reduce((sum, val) => sum + val, 0) / allSeasonValues.length)
    : 0
  
  return {
    sixMonthTotal,
    maxSeason,
    avgPerMonth
  }
}

