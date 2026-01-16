/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

// Forecast Mock Data - Gerçekçi Tekstil Mantığı
// Marka bazlı sezon talep profilleri, BOM, maliyet tabloları

import { CUSTOMERS } from './customers'
import { mockStockData } from './mockStockData'

// Mevsimler
export const SEASONS = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış']

// Mevsim bazlı iş günü sayıları
export const WORKING_DAYS_BY_SEASON = {
  'İlkbahar': 90,
  'Yaz': 120,
  'Sonbahar': 90,
  'Kış': 80
}

// Marka bazlı sezon talep çarpanları (base demand multiplier)
export const SEASONAL_DEMAND_MULTIPLIERS = {
  'Nike': { 'İlkbahar': 0.85, 'Yaz': 1.25, 'Sonbahar': 0.90, 'Kış': 1.00 },
  'Under Armour': { 'İlkbahar': 0.80, 'Yaz': 1.30, 'Sonbahar': 0.85, 'Kış': 1.05 },
  'Zara': { 'İlkbahar': 0.95, 'Yaz': 1.35, 'Sonbahar': 1.10, 'Kış': 0.60 },
  'Bershka': { 'İlkbahar': 0.90, 'Yaz': 1.40, 'Sonbahar': 1.15, 'Kış': 0.55 },
  'Tommy Hilfiger': { 'İlkbahar': 0.95, 'Yaz': 1.15, 'Sonbahar': 1.05, 'Kış': 0.85 },
  'Tommy Jeans': { 'İlkbahar': 0.90, 'Yaz': 1.20, 'Sonbahar': 1.00, 'Kış': 0.90 },
  'Lacoste': { 'İlkbahar': 0.85, 'Yaz': 1.30, 'Sonbahar': 1.00, 'Kış': 0.85 },
  'Calvin Klein': { 'İlkbahar': 0.90, 'Yaz': 1.20, 'Sonbahar': 1.00, 'Kış': 0.90 },
  'Polo Ralph Lauren': { 'İlkbahar': 0.88, 'Yaz': 1.25, 'Sonbahar': 0.95, 'Kış': 0.92 },
  'Guess': { 'İlkbahar': 0.92, 'Yaz': 1.18, 'Sonbahar': 1.05, 'Kış': 0.85 },
  'Mudo': { 'İlkbahar': 0.95, 'Yaz': 1.10, 'Sonbahar': 1.00, 'Kış': 0.95 },
  'Aldi': { 'İlkbahar': 0.98, 'Yaz': 1.08, 'Sonbahar': 1.02, 'Kış': 0.92 },
  'Gerster': { 'İlkbahar': 0.96, 'Yaz': 1.12, 'Sonbahar': 1.00, 'Kış': 0.92 },
  'Tchibo': { 'İlkbahar': 0.97, 'Yaz': 1.10, 'Sonbahar': 1.03, 'Kış': 0.90 },
  'Matheis': { 'İlkbahar': 1.00, 'Yaz': 0.98, 'Sonbahar': 1.02, 'Kış': 1.00 },
  'Schlafgut': { 'İlkbahar': 1.00, 'Yaz': 0.95, 'Sonbahar': 1.05, 'Kış': 1.00 }
}

// Marka bazlı yıllık baz talep (adet)
export const BASE_ANNUAL_DEMAND = {
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

// Yıllık büyüme trendi (yıl bazlı çarpan)
export const YEARLY_GROWTH_TREND = {
  'Nike': { 2024: 1.05, 2025: 1.10, 2026: 1.15 },
  'Under Armour': { 2024: 1.03, 2025: 1.06, 2026: 1.10 },
  'Zara': { 2024: 1.08, 2025: 1.15, 2026: 1.22 },
  'Bershka': { 2024: 1.07, 2025: 1.12, 2026: 1.18 },
  'Tommy Hilfiger': { 2024: 1.02, 2025: 1.04, 2026: 1.06 },
  'Tommy Jeans': { 2024: 1.03, 2025: 1.05, 2026: 1.08 },
  'Lacoste': { 2024: 1.01, 2025: 1.02, 2026: 1.03 },
  'Calvin Klein': { 2024: 1.02, 2025: 1.04, 2026: 1.06 },
  'Polo Ralph Lauren': { 2024: 1.01, 2025: 1.03, 2026: 1.05 },
  'Guess': { 2024: 1.01, 2025: 1.02, 2026: 1.03 },
  'Mudo': { 2024: 1.00, 2025: 1.01, 2026: 1.02 },
  'Aldi': { 2024: 1.03, 2025: 1.06, 2026: 1.09 },
  'Gerster': { 2024: 1.00, 2025: 1.01, 2026: 1.01 },
  'Tchibo': { 2024: 1.02, 2025: 1.05, 2026: 1.08 },
  'Matheis': { 2024: 0.99, 2025: 0.98, 2026: 0.97 },
  'Schlafgut': { 2024: 0.99, 2025: 0.98, 2026: 0.97 }
}

// Ürün mix profilleri (marka bazlı)
export const PRODUCT_MIX_PROFILES = {
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

// BOM (Bill of Materials) - Ürün grubu bazlı hammadde tüketim katsayıları
export const BOM_PER_UNIT = {
  'Denim': {
    'Dokuma Kumaş (Denim)': 1.2, // m/adet
    'Fermuar (Metal 20cm)': 0.6, // adet/adet (%60 üründe)
    'Düğme (Plastik 4 Delik)': 4, // adet/adet
    'Dikiş İpliği (Polyester)': 0.15, // kg/adet
    'Reaktif Boya (Mavi)': 0.008, // lt/adet (opsiyonel)
    'Polybag (30x40cm)': 1, // adet/adet
    'Koli (Kartondan)': 0.1 // adet/adet (10 ürün = 1 koli)
  },
  'Knit': {
    'Örme Kumaş (Single Jersey)': 1.1, // m/adet
    'Pamuk İpliği (Ring 30/1)': 0.25, // kg/adet (opsiyonel)
    'Elastan (Lycra 40D)': 0.05, // kg/adet
    'Düğme (Plastik 4 Delik)': 3, // adet/adet
    'Dikiş İpliği (Polyester)': 0.12, // kg/adet
    'Polybag (30x40cm)': 1,
    'Koli (Kartondan)': 0.1
  },
  'Polo': {
    'Örme Kumaş (Single Jersey)': 1.3, // m/adet
    'Düğme (Plastik 4 Delik)': 3, // adet/adet
    'Dikiş İpliği (Polyester)': 0.15, // kg/adet
    'Yumuşatıcı (Organik)': 0.01, // lt/adet
    'Polybag (30x40cm)': 1,
    'Koli (Kartondan)': 0.1
  },
  'Woven': {
    'Dokuma Kumaş (Denim)': 1.15, // m/adet
    'Düğme (Plastik 4 Delik)': 3.5, // adet/adet
    'Dikiş İpliği (Polyester)': 0.14, // kg/adet
    'Reaktif Boya (Kırmızı)': 0.006, // lt/adet (opsiyonel)
    'Polybag (30x40cm)': 1,
    'Koli (Kartondan)': 0.1
  },
  'Activewear': {
    'Örme Kumaş (Single Jersey)': 1.2, // m/adet
    'Elastan (Lycra 40D)': 0.08, // kg/adet
    'Polyester İpliği (DTY 150D)': 0.20, // kg/adet
    'Dikiş İpliği (Polyester)': 0.13, // kg/adet
    'Polybag (30x40cm)': 1,
    'Koli (Kartondan)': 0.1
  }
}

// Hammadde birim maliyetleri (TL)
export const MATERIAL_UNIT_COSTS = {
  'Pamuk İpliği (Ring 30/1)': 45,
  'Pamuk İpliği (Penye 40/1)': 48,
  'Polyester İpliği (DTY 150D)': 35,
  'Elastan (Lycra 40D)': 120,
  'Örme Kumaş (Single Jersey)': 25,
  'Dokuma Kumaş (Denim)': 30,
  'Reaktif Boya (Mavi)': 85,
  'Reaktif Boya (Kırmızı)': 90,
  'Yumuşatıcı (Organik)': 65,
  'Enzim (Selülaz)': 150,
  'Dikiş İpliği (Polyester)': 55,
  'Fermuar (Metal 20cm)': 2.5,
  'Düğme (Plastik 4 Delik)': 0.15,
  'Polybag (30x40cm)': 0.35,
  'Koli (Kartondan)': 8
}

// Marka bazlı ortalama satış fiyatı (TL/adet)
export const AVG_SELLING_PRICE_PER_UNIT = {
  'Nike': 450,
  'Under Armour': 420,
  'Zara': 180,
  'Bershka': 160,
  'Tommy Hilfiger': 380,
  'Tommy Jeans': 320,
  'Lacoste': 520,
  'Calvin Klein': 350,
  'Polo Ralph Lauren': 480,
  'Guess': 280,
  'Mudo': 220,
  'Aldi': 120,
  'Gerster': 200,
  'Tchibo': 150,
  'Matheis': 180,
  'Schlafgut': 200
}

// Birim maliyetler (TL/adet)
export const UNIT_COSTS = {
  laborCostPerUnit: 12, // İşçilik maliyeti
  energyCostPerUnit: 2.5, // Enerji maliyeti
  outsourceCostPerUnit: 18, // Dış kaynak maliyeti (iç maliyetten %50 daha pahalı)
  logisticsCostPerUnit: 3 // Lojistik maliyeti
}

// Üretim kapasitesi (günlük, adet)
export const BASE_DAILY_CAPACITY = {
  'kesim': 12000,
  'dikim': 8000,
  'utu_paket': 10000,
  'boya_baski': 15000 // m cinsinden
}

// Verimlilik faktörü
export const EFFICIENCY_FACTOR = 0.82

// Geçmiş 3 yıl sorun özeti (marka + sezon bazlı mock)
export const getHistoricalIssues = (brand, season) => {
  // Basit mock: marka ve sezona göre farklı sorun profilleri
  const baseDelayRate = brand === 'Zara' || brand === 'Bershka' ? 0.15 : 0.08
  const baseCancelRate = brand === 'Zara' || brand === 'Bershka' ? 0.05 : 0.02
  const baseOvertimeHours = season === 'Yaz' ? 320 : season === 'Kış' ? 180 : 250
  const baseOutsourceRate = brand === 'Nike' || brand === 'Under Armour' ? 0.12 : 0.06

  return {
    delayRate: Math.round((baseDelayRate + (Math.random() * 0.05 - 0.025)) * 100) / 100,
    cancelRate: Math.round((baseCancelRate + (Math.random() * 0.02 - 0.01)) * 100) / 100,
    overtimeHours: Math.round(baseOvertimeHours + (Math.random() * 100 - 50)),
    outsourceRate: Math.round((baseOutsourceRate + (Math.random() * 0.03 - 0.015)) * 100) / 100
  }
}

let cachedStocks = null

export const getMaterialStock = async (materialName) => {
  if (!cachedStocks) {
    try {
      cachedStocks = await getCriticalStocks()
    } catch (error) {
      console.error('Error fetching stocks:', error)
      cachedStocks = []
    }
  }
  const material = cachedStocks.find(m => m.name === materialName)
  if (!material) {
    return {
      currentStock: 0,
      unit: 'adet',
      leadTimeDays: 15
    }
  }
  return {
    currentStock: material.currentStock,
    unit: material.unit,
    leadTimeDays: material.leadTimeDays
  }
}

