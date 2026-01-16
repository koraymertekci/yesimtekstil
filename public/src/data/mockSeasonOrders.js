/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

// Geçmiş 3 Yıl Sezon Sipariş Verileri
// Her müşteri için Yaz ve Kış sezonları, 2023-2025 yılları

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min, max) => Math.random() * (max - min) + min

// Ürün grupları
const PRODUCT_GROUPS = ['Denim', 'Knit', 'Polo', 'Woven', 'Activewear']

// Müşteri bazlı ürün mix profilleri
const customerProductProfiles = {
  'Nike': [
    { productGroup: 'Activewear', share: 0.50 },
    { productGroup: 'Knit', share: 0.35 },
    { productGroup: 'Polo', share: 0.15 }
  ],
  'Under Armour': [
    { productGroup: 'Activewear', share: 0.55 },
    { productGroup: 'Knit', share: 0.30 },
    { productGroup: 'Polo', share: 0.15 }
  ],
  'Zara': [
    { productGroup: 'Denim', share: 0.35 },
    { productGroup: 'Knit', share: 0.40 },
    { productGroup: 'Woven', share: 0.25 }
  ],
  'Bershka': [
    { productGroup: 'Denim', share: 0.40 },
    { productGroup: 'Knit', share: 0.35 },
    { productGroup: 'Woven', share: 0.25 }
  ],
  'Tommy Hilfiger': [
    { productGroup: 'Polo', share: 0.45 },
    { productGroup: 'Denim', share: 0.30 },
    { productGroup: 'Knit', share: 0.25 }
  ],
  'Tommy Jeans': [
    { productGroup: 'Denim', share: 0.60 },
    { productGroup: 'Knit', share: 0.25 },
    { productGroup: 'Polo', share: 0.15 }
  ],
  'Lacoste': [
    { productGroup: 'Polo', share: 0.70 },
    { productGroup: 'Knit', share: 0.20 },
    { productGroup: 'Woven', share: 0.10 }
  ],
  'Calvin Klein': [
    { productGroup: 'Knit', share: 0.40 },
    { productGroup: 'Denim', share: 0.35 },
    { productGroup: 'Polo', share: 0.25 }
  ],
  'Polo Ralph Lauren': [
    { productGroup: 'Polo', share: 0.75 },
    { productGroup: 'Knit', share: 0.15 },
    { productGroup: 'Woven', share: 0.10 }
  ],
  'Guess': [
    { productGroup: 'Denim', share: 0.50 },
    { productGroup: 'Knit', share: 0.30 },
    { productGroup: 'Polo', share: 0.20 }
  ],
  'Mudo': [
    { productGroup: 'Knit', share: 0.45 },
    { productGroup: 'Denim', share: 0.30 },
    { productGroup: 'Polo', share: 0.25 }
  ],
  'Aldi': [
    { productGroup: 'Knit', share: 0.50 },
    { productGroup: 'Polo', share: 0.30 },
    { productGroup: 'Denim', share: 0.20 }
  ],
  'Gerster': [
    { productGroup: 'Knit', share: 0.40 },
    { productGroup: 'Polo', share: 0.35 },
    { productGroup: 'Woven', share: 0.25 }
  ],
  'Tchibo': [
    { productGroup: 'Knit', share: 0.55 },
    { productGroup: 'Polo', share: 0.30 },
    { productGroup: 'Denim', share: 0.15 }
  ],
  'Matheis': [
    { productGroup: 'Knit', share: 0.60 },
    { productGroup: 'Woven', share: 0.25 },
    { productGroup: 'Polo', share: 0.15 }
  ],
  'Schlafgut': [
    { productGroup: 'Knit', share: 0.65 },
    { productGroup: 'Woven', share: 0.20 },
    { productGroup: 'Polo', share: 0.15 }
  ]
}

// Müşteri bazlı baz sipariş hacimleri (yıllık, adet cinsinden)
const customerBaseVolumes = {
  'Nike': 450000,
  'Under Armour': 380000,
  'Zara': 520000,
  'Bershka': 480000,
  'Tommy Hilfiger': 320000,
  'Tommy Jeans': 280000,
  'Lacoste': 250000,
  'Calvin Klein': 350000,
  'Polo Ralph Lauren': 290000,
  'Guess': 310000,
  'Mudo': 220000,
  'Aldi': 400000,
  'Gerster': 180000,
  'Tchibo': 350000,
  'Matheis': 150000,
  'Schlafgut': 120000
}

// Sezon çarpanları (Yaz/Kış baz farkı)
const seasonMultipliers = {
  'Yaz': {
    'Nike': 1.15,
    'Under Armour': 1.20,
    'Zara': 1.25,
    'Bershka': 1.30,
    'Tommy Hilfiger': 1.10,
    'Tommy Jeans': 1.15,
    'Lacoste': 1.25,
    'Calvin Klein': 1.12,
    'Polo Ralph Lauren': 1.18,
    'Guess': 1.10,
    'Mudo': 1.08,
    'Aldi': 1.05,
    'Gerster': 1.06,
    'Tchibo': 1.04,
    'Matheis': 0.98,
    'Schlafgut': 0.95
  },
  'Kış': {
    'Nike': 0.85,
    'Under Armour': 0.80,
    'Zara': 0.75,
    'Bershka': 0.70,
    'Tommy Hilfiger': 0.90,
    'Tommy Jeans': 0.85,
    'Lacoste': 0.75,
    'Calvin Klein': 0.88,
    'Polo Ralph Lauren': 0.82,
    'Guess': 0.90,
    'Mudo': 0.92,
    'Aldi': 0.95,
    'Gerster': 0.94,
    'Tchibo': 0.96,
    'Matheis': 1.02,
    'Schlafgut': 1.05
  }
}

// Lead time profilleri (müşteri bazlı)
const leadTimeProfiles = {
  'Zara': { min: 35, max: 50 },
  'Bershka': { min: 40, max: 55 },
  'Nike': { min: 60, max: 90 },
  'Under Armour': { min: 65, max: 95 },
  'Tommy Hilfiger': { min: 55, max: 75 },
  'Tommy Jeans': { min: 50, max: 70 },
  'Lacoste': { min: 60, max: 80 },
  'Calvin Klein': { min: 55, max: 75 },
  'Polo Ralph Lauren': { min: 60, max: 85 },
  'Guess': { min: 50, max: 70 },
  'Mudo': { min: 45, max: 65 },
  'Aldi': { min: 50, max: 70 },
  'Gerster': { min: 55, max: 75 },
  'Tchibo': { min: 50, max: 70 },
  'Matheis': { min: 60, max: 80 },
  'Schlafgut': { min: 65, max: 85 }
}

// On-time delivery rate profilleri
const onTimeRateProfiles = {
  'Zara': { min: 0.75, max: 0.88 },
  'Bershka': { min: 0.72, max: 0.85 },
  'Nike': { min: 0.88, max: 0.95 },
  'Under Armour': { min: 0.85, max: 0.93 },
  'Tommy Hilfiger': { min: 0.90, max: 0.96 },
  'Tommy Jeans': { min: 0.88, max: 0.94 },
  'Lacoste': { min: 0.92, max: 0.97 },
  'Calvin Klein': { min: 0.89, max: 0.95 },
  'Polo Ralph Lauren': { min: 0.91, max: 0.96 },
  'Guess': { min: 0.87, max: 0.93 },
  'Mudo': { min: 0.85, max: 0.92 },
  'Aldi': { min: 0.88, max: 0.94 },
  'Gerster': { min: 0.86, max: 0.93 },
  'Tchibo': { min: 0.87, max: 0.94 },
  'Matheis': { min: 0.90, max: 0.96 },
  'Schlafgut': { min: 0.91, max: 0.97 }
}

// Yıllık trend faktörleri (2023 -> 2025 büyüme/azalma)
const yearlyTrendFactors = {
  'Nike': [1.0, 1.08, 1.15], // %8, %7 büyüme
  'Under Armour': [1.0, 1.06, 1.12],
  'Zara': [1.0, 1.12, 1.25], // Hızlı büyüme
  'Bershka': [1.0, 1.10, 1.22],
  'Tommy Hilfiger': [1.0, 1.04, 1.08],
  'Tommy Jeans': [1.0, 1.05, 1.10],
  'Lacoste': [1.0, 1.03, 1.06],
  'Calvin Klein': [1.0, 1.05, 1.10],
  'Polo Ralph Lauren': [1.0, 1.04, 1.08],
  'Guess': [1.0, 1.03, 1.06],
  'Mudo': [1.0, 1.02, 1.04],
  'Aldi': [1.0, 1.06, 1.12],
  'Gerster': [1.0, 1.01, 1.02],
  'Tchibo': [1.0, 1.05, 1.10],
  'Matheis': [1.0, 0.98, 0.96], // Azalma
  'Schlafgut': [1.0, 0.99, 0.98]
}

// Mock sezon sipariş verisi oluştur
const generateSeasonOrder = (customer, season, year) => {
  const baseVolume = customerBaseVolumes[customer] || 200000
  const seasonMultiplier = seasonMultipliers[season]?.[customer] || 1.0
  const yearIndex = year - 2023
  const trendFactor = yearlyTrendFactors[customer]?.[yearIndex] || 1.0
  
  // Sezon bazlı hacim hesapla
  const seasonBaseQty = (baseVolume / 2) * seasonMultiplier // Yıllık hacmin yarısı * sezon çarpanı
  
  // Yıl trendi uygula
  const totalOrderQty = Math.round(seasonBaseQty * trendFactor * randomFloat(0.95, 1.05))
  
  // Ürün mix
  const productMix = customerProductProfiles[customer] || [
    { productGroup: 'Knit', share: 0.50 },
    { productGroup: 'Denim', share: 0.30 },
    { productGroup: 'Polo', share: 0.20 }
  ]
  
  // Lead time
  const leadTimeProfile = leadTimeProfiles[customer] || { min: 50, max: 70 }
  const avgLeadTimeDays = randomInt(leadTimeProfile.min, leadTimeProfile.max)
  
  // On-time rate
  const onTimeProfile = onTimeRateProfiles[customer] || { min: 0.85, max: 0.95 }
  const onTimeRate = randomFloat(onTimeProfile.min, onTimeProfile.max)
  
  // Birim belirleme (çoğu adet, bazıları metre)
  const unit = customer === 'Zara' || customer === 'Bershka' ? 'm' : 'adet'
  
  return {
    customer,
    season,
    year,
    totalOrderQty,
    unit,
    productMix,
    avgLeadTimeDays,
    onTimeRate
  }
}

// Tüm sezon sipariş verilerini oluştur
export const generateAllSeasonOrders = () => {
  const customers = [
    'Nike', 'Under Armour', 'Zara', 'Bershka', 'Tommy Hilfiger', 'Tommy Jeans',
    'Lacoste', 'Calvin Klein', 'Polo Ralph Lauren', 'Guess', 'Mudo', 'Aldi',
    'Gerster', 'Tchibo', 'Matheis', 'Schlafgut'
  ]
  const seasons = ['Yaz', 'Kış']
  const years = [2023, 2024, 2025]
  
  const orders = []
  
  customers.forEach(customer => {
    seasons.forEach(season => {
      years.forEach(year => {
        orders.push(generateSeasonOrder(customer, season, year))
      })
    })
  })
  
  return orders
}

// Müşteri ve sezon bazlı forecast hesapla
export const calculateForecast = (customer, season) => {
  const allOrders = generateAllSeasonOrders()
  const relevantOrders = allOrders.filter(
    o => o.customer === customer && o.season === season
  )
  
  if (relevantOrders.length === 0) {
    return null
  }
  
  // Son 3 yıl ortalaması
  const totalQty = relevantOrders.reduce((sum, o) => sum + o.totalOrderQty, 0)
  const avgQty = Math.round(totalQty / relevantOrders.length)
  
  // Trend hesapla (2025 vs 2023)
  const orders2023 = relevantOrders.find(o => o.year === 2023)
  const orders2025 = relevantOrders.find(o => o.year === 2025)
  
  let trendRate = 0
  if (orders2023 && orders2025) {
    trendRate = ((orders2025.totalOrderQty - orders2023.totalOrderQty) / orders2023.totalOrderQty) * 100
  }
  
  // Ürün mix (tüm yılların ortalaması)
  const productMix = relevantOrders[0].productMix // Aynı müşteri+sezon için mix aynı
  
  // Ortalama lead time
  const avgLeadTime = Math.round(
    relevantOrders.reduce((sum, o) => sum + o.avgLeadTimeDays, 0) / relevantOrders.length
  )
  
  // Ortalama on-time rate
  const avgOnTimeRate = relevantOrders.reduce((sum, o) => sum + o.onTimeRate, 0) / relevantOrders.length
  
  // Birim
  const unit = relevantOrders[0].unit
  
  return {
    forecastQty: avgQty,
    unit,
    trendRate: Math.round(trendRate * 10) / 10,
    productMix,
    avgLeadTimeDays: avgLeadTime,
    avgOnTimeRate: Math.round(avgOnTimeRate * 100) / 100,
    historicalData: relevantOrders
  }
}

// Export default
export const mockSeasonOrders = generateAllSeasonOrders()

