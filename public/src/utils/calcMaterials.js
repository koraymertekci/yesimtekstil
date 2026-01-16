/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

// Hammadde Yeterlilik Hesaplama
// BOM (Bill of Materials) mantığı ile ürün grubu -> hammadde tüketim katsayıları

import { getCriticalStocks } from '../api/stocks.api'

// BOM: Ürün grubu -> Hammadde tüketim katsayıları
const BOM_MAP = {
  'Denim': {
    'Dokuma Kumaş (Denim)': { factor: 1.2, unit: 'm' }, // 1 adet ürün = 1.2 m kumaş
    'Fermuar (Metal 20cm)': { factor: 0.6, unit: 'adet' }, // %60 üründe fermuar
    'Düğme (Plastik 4 Delik)': { factor: 4, unit: 'adet' },
    'Dikiş İpliği (Polyester)': { factor: 0.15, unit: 'kg' },
    'Reaktif Boya (Mavi)': { factor: 0.008, unit: 'lt' }, // Opsiyonel
    'Polybag (30x40cm)': { factor: 1, unit: 'adet' },
    'Koli (Kartondan)': { factor: 0.1, unit: 'adet' } // 10 ürün = 1 koli
  },
  'Knit': {
    'Örme Kumaş (Single Jersey)': { factor: 1.1, unit: 'm' },
    'Pamuk İpliği (Ring 30/1)': { factor: 0.25, unit: 'kg' }, // Opsiyonel
    'Elastan (Lycra 40D)': { factor: 0.05, unit: 'kg' },
    'Düğme (Plastik 4 Delik)': { factor: 3, unit: 'adet' },
    'Dikiş İpliği (Polyester)': { factor: 0.12, unit: 'kg' },
    'Polybag (30x40cm)': { factor: 1, unit: 'adet' },
    'Koli (Kartondan)': { factor: 0.1, unit: 'adet' }
  },
  'Polo': {
    'Örme Kumaş (Single Jersey)': { factor: 1.3, unit: 'm' },
    'Düğme (Plastik 4 Delik)': { factor: 3, unit: 'adet' },
    'Dikiş İpliği (Polyester)': { factor: 0.15, unit: 'kg' },
    'Yumuşatıcı (Organik)': { factor: 0.01, unit: 'lt' },
    'Polybag (30x40cm)': { factor: 1, unit: 'adet' },
    'Koli (Kartondan)': { factor: 0.1, unit: 'adet' }
  },
  'Woven': {
    'Dokuma Kumaş (Denim)': { factor: 1.15, unit: 'm' },
    'Düğme (Plastik 4 Delik)': { factor: 3.5, unit: 'adet' },
    'Dikiş İpliği (Polyester)': { factor: 0.14, unit: 'kg' },
    'Reaktif Boya (Kırmızı)': { factor: 0.006, unit: 'lt' }, // Opsiyonel
    'Polybag (30x40cm)': { factor: 1, unit: 'adet' },
    'Koli (Kartondan)': { factor: 0.1, unit: 'adet' }
  },
  'Activewear': {
    'Örme Kumaş (Single Jersey)': { factor: 1.2, unit: 'm' },
    'Elastan (Lycra 40D)': { factor: 0.08, unit: 'kg' },
    'Polyester İpliği (DTY 150D)': { factor: 0.20, unit: 'kg' },
    'Dikiş İpliği (Polyester)': { factor: 0.13, unit: 'kg' },
    'Polybag (30x40cm)': { factor: 1, unit: 'adet' },
    'Koli (Kartondan)': { factor: 0.1, unit: 'adet' }
  }
}

let cachedStocks = null

const getMaterialByName = async (name) => {
  if (!cachedStocks) {
    try {
      cachedStocks = await getCriticalStocks()
    } catch (error) {
      console.error('Error fetching stocks:', error)
      cachedStocks = []
    }
  }
  return cachedStocks.find(m => m.name === name) || null
}

// Birim dönüşümü (basit)
const convertUnit = (qty, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return qty
  
  // Adet <-> Metre dönüşümü (basit varsayım)
  if (fromUnit === 'adet' && toUnit === 'm') {
    return qty * 1.2 // 1 adet = 1.2 m (ortalama)
  }
  if (fromUnit === 'm' && toUnit === 'adet') {
    return qty / 1.2
  }
  
  return qty // Diğer durumlarda dönüşüm yok
}

// Hammadde yeterlilik hesaplama
export const calculateMaterialAdequacy = (
  forecastQty,
  productMix,
  forecastUnit,
  additionalPurchase = {} // { materialId: qty }
) => {
  const materialRequirements = {}
  
  // Her ürün grubu için hammadde gereksinimlerini hesapla
  productMix.forEach(mix => {
    const productGroup = mix.productGroup
    const share = mix.share
    const productQty = forecastQty * share
    
    const bom = BOM_MAP[productGroup]
    if (!bom) return
    
    // BOM'daki her hammadde için gereksinim hesapla
    Object.entries(bom).forEach(([materialName, bomData]) => {
      const material = getMaterialByName(materialName)
      if (!material) return
      
      const materialId = material.rawMaterialId
      
      if (!materialRequirements[materialId]) {
        materialRequirements[materialId] = {
          material,
          requiredQty: 0,
          unit: bomData.unit
        }
      }
      
      // Birim uyumsuzluğu varsa dönüştür
      let requiredQty = productQty * bomData.factor
      if (forecastUnit !== bomData.unit) {
        requiredQty = convertUnit(requiredQty, forecastUnit, bomData.unit)
      }
      
      materialRequirements[materialId].requiredQty += requiredQty
    })
  })
  
  // Her hammadde için yeterlilik hesapla
  const materialAdequacies = {}
  let minAdequacy = Infinity
  let criticalMaterial = null
  
  Object.values(materialRequirements).forEach(req => {
    const material = req.material
    const requiredQty = req.requiredQty
    
    // Ek satın alma varsa ekle
    const additionalQty = additionalPurchase[material.rawMaterialId] || 0
    const availableStock = material.currentStock + additionalQty
    
    const adequacy = availableStock / requiredQty
    const gap = Math.max(0, requiredQty - availableStock)
    
    materialAdequacies[material.rawMaterialId] = {
      adequacy: Math.round(adequacy * 100) / 100,
      adequacyPercent: Math.round(adequacy * 100),
      requiredQty: Math.round(requiredQty),
      availableStock: Math.round(availableStock),
      gap: Math.round(gap),
      material
    }
    
    if (adequacy < minAdequacy) {
      minAdequacy = adequacy
      criticalMaterial = material.rawMaterialId
    }
  })
  
  // Genel stok yeterliliği
  const overallAdequacy = minAdequacy === Infinity ? 1.0 : minAdequacy
  
  // Toplam eksik miktar (kritik hammadde)
  const totalGap = materialAdequacies[criticalMaterial]?.gap || 0
  
  // Gerekli satın alma miktarları ve maliyetleri
  const requiredPurchases = {}
  let totalPurchaseCost = 0
  
  Object.values(materialAdequacies).forEach(adequacy => {
    if (adequacy.gap > 0) {
      const material = adequacy.material
      const purchaseQty = adequacy.gap * 1.2 // %20 güvenlik marjı
      const unitCost = getMaterialUnitCost(material)
      const purchaseCost = purchaseQty * unitCost
      
      requiredPurchases[material.rawMaterialId] = {
        material,
        qty: Math.round(purchaseQty),
        cost: Math.round(purchaseCost * 100) / 100
      }
      
      totalPurchaseCost += purchaseCost
    }
  })
  
  // Lead time riski (en uzun lead time'a sahip kritik hammadde)
  const criticalMaterialData = materialAdequacies[criticalMaterial]
  const leadTimeRisk = criticalMaterialData?.material.leadTimeDays || 0
  
  return {
    overallAdequacy: Math.round(overallAdequacy * 100) / 100,
    overallAdequacyPercent: Math.round(overallAdequacy * 100),
    totalGap,
    criticalMaterial,
    criticalMaterialName: criticalMaterialData?.material.name || '',
    requiredPurchases,
    totalPurchaseCost: Math.round(totalPurchaseCost * 100) / 100,
    leadTimeRisk,
    materialDetails: materialAdequacies
  }
}

// Hammadde birim maliyeti (mock)
const getMaterialUnitCost = (material) => {
  const costMap = {
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
  
  return costMap[material.name] || 50 // Varsayılan
}

