// Mock Sezon Geçmiş Verileri (2022-2025)
// Her marka + sezon için yıllık sipariş miktarları

// Deterministik seed fonksiyonu
const seededHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Seeded random (0-1 arası)
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Marka bazlı ölçek faktörleri
const BRAND_SCALE = {
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

// Sezon bazlı çarpanlar
const SEASON_MULTIPLIERS = {
  'İlkbahar': 0.95,
  'Yaz': 1.3,
  'Sonbahar': 1.0,
  'Kış': 1.1
}

// Yıl bazlı trend faktörleri
const YEAR_TREND = {
  2022: 0.95,  // Pandemi sonrası toparlanma
  2023: 1.0,   // Baz yıl
  2024: 1.05,  // %5 büyüme
  2025: 1.10   // %10 büyüme (2023'e göre)
}

// Tek bir marka + sezon için yıllık veri üret
export const generateYearlyData = (brand, season) => {
  const years = [2022, 2023, 2024, 2025]
  const baseScale = BRAND_SCALE[brand] || 1.0
  const seasonMultiplier = SEASON_MULTIPLIERS[season] || 1.0
  const baseQty = 15000 * baseScale * seasonMultiplier

  return years.map(year => {
    const seed = seededHash(`${brand}-${season}-${year}`)
    const variation = 0.85 + (seededRandom(seed) * 0.3) // 0.85 - 1.15 arası
    const yearTrend = YEAR_TREND[year] || 1.0
    const qty = Math.round(baseQty * variation * yearTrend)
    
    return {
      year,
      qty,
      productMix: [
        { name: 'Polo', share: 45 },
        { name: 'Denim', share: 30 },
        { name: 'Knit', share: 25 }
      ]
    }
  })
}

// Çoklu marka için toplam veri üret
export const generateAggregateYearlyData = (brands, season) => {
  if (brands.length === 0) {
    return {
      2022: 0,
      2023: 0,
      2024: 0,
      2025: 0
    }
  }

  const yearlyTotals = { 2022: 0, 2023: 0, 2024: 0, 2025: 0 }
  
  brands.forEach(brand => {
    const data = generateYearlyData(brand, season)
    data.forEach(item => {
      yearlyTotals[item.year] += item.qty
    })
  })

  return yearlyTotals
}

// 3 yıl ortalaması hesapla (2022-2024)
export const calculate3YearAverage = (yearlyData) => {
  const sum = (yearlyData[2022] || 0) + (yearlyData[2023] || 0) + (yearlyData[2024] || 0)
  return Math.round(sum / 3)
}

// Karşılaştırma yüzdesi hesapla
export const calculateComparison = (currentYear, average) => {
  if (average === 0) return 0
  const diff = ((currentYear - average) / average) * 100
  return Math.round(diff * 10) / 10 // 1 decimal
}


















