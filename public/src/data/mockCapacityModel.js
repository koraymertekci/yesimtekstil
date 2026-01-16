/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

// Üretim Kapasitesi Modeli (Operasyon Bazlı)
// Makine modülü olmadan, operasyon bazlı kapasite hesaplama

// Operasyon tanımları
export const OPERATIONS = [
  {
    id: 'kesim',
    name: 'Kesim',
    dailyCapacity: 12000, // adet/gün veya m/gün
    unit: 'adet',
    workforce: 25,
    efficiency: 0.85,
    overtimeFactor: 0.25, // Max %25 fazla mesai ile kapasite artışı
    subcontractable: true,
    costPerUnit: 0.15, // TL/adet
    setupTimeHours: 2
  },
  {
    id: 'dikim',
    name: 'Dikim',
    dailyCapacity: 8000,
    unit: 'adet',
    workforce: 120,
    efficiency: 0.80,
    overtimeFactor: 0.30,
    subcontractable: true,
    costPerUnit: 2.50,
    setupTimeHours: 1
  },
  {
    id: 'utu_paket',
    name: 'Ütü & Paket',
    dailyCapacity: 10000,
    unit: 'adet',
    workforce: 40,
    efficiency: 0.90,
    overtimeFactor: 0.20,
    subcontractable: false,
    costPerUnit: 0.80,
    setupTimeHours: 0.5
  },
  {
    id: 'boya_baski',
    name: 'Boya/Baskı/Terbiye',
    dailyCapacity: 15000,
    unit: 'm',
    workforce: 35,
    efficiency: 0.75,
    overtimeFactor: 0.15,
    subcontractable: true,
    costPerUnit: 1.20,
    setupTimeHours: 4
  }
]

// Ürün grubu -> Operasyon mapping
export const PRODUCT_OPERATION_MAP = {
  'Denim': {
    requiredOps: ['kesim', 'dikim', 'utu_paket'],
    optionalOps: ['boya_baski'], // %40 ihtimalle gerekir
    opFactors: {
      'kesim': 1.0,
      'dikim': 1.0,
      'utu_paket': 1.0,
      'boya_baski': 0.4 // %40 ihtimalle
    }
  },
  'Knit': {
    requiredOps: ['dikim', 'utu_paket'],
    optionalOps: [],
    opFactors: {
      'dikim': 1.0,
      'utu_paket': 1.0,
      'kesim': 0.1 // Düşük etkili
    }
  },
  'Polo': {
    requiredOps: ['kesim', 'dikim', 'utu_paket'],
    optionalOps: [],
    opFactors: {
      'kesim': 1.0,
      'dikim': 1.0,
      'utu_paket': 1.0
    }
  },
  'Woven': {
    requiredOps: ['kesim', 'dikim', 'utu_paket'],
    optionalOps: ['boya_baski'],
    opFactors: {
      'kesim': 1.0,
      'dikim': 1.0,
      'utu_paket': 1.0,
      'boya_baski': 0.3
    }
  },
  'Activewear': {
    requiredOps: ['dikim', 'utu_paket'],
    optionalOps: ['boya_baski'],
    opFactors: {
      'dikim': 1.0,
      'utu_paket': 1.0,
      'boya_baski': 0.5
    }
  }
}

// Kapasite hesaplama fonksiyonu
export const calculateCapacityAdequacy = (
  forecastQty,
  productMix,
  seasonDurationDays = 120,
  overtimePercent = 0,
  additionalWorkforce = 0
) => {
  const operations = OPERATIONS
  const opRequirements = {}
  
  // Her ürün grubu için operasyon gereksinimlerini hesapla
  productMix.forEach(mix => {
    const productGroup = mix.productGroup
    const share = mix.share
    const productQty = forecastQty * share
    
    const opMap = PRODUCT_OPERATION_MAP[productGroup]
    if (!opMap) return
    
    // Gerekli operasyonlar
    opMap.requiredOps.forEach(opId => {
      if (!opRequirements[opId]) {
        opRequirements[opId] = 0
      }
      opRequirements[opId] += productQty * (opMap.opFactors[opId] || 1.0)
    })
    
    // Opsiyonel operasyonlar
    opMap.optionalOps.forEach(opId => {
      if (!opRequirements[opId]) {
        opRequirements[opId] = 0
      }
      const factor = opMap.opFactors[opId] || 0
      opRequirements[opId] += productQty * factor
    })
  })
  
  // Her operasyon için kapasite yeterliliği hesapla
  const opAdequacies = {}
  let minAdequacy = Infinity
  let bottleneckOp = null
  
  operations.forEach(op => {
    const requiredQty = opRequirements[op.id] || 0
    
    if (requiredQty === 0) {
      opAdequacies[op.id] = {
        adequacy: 1.0,
        capacity: 0,
        required: 0,
        gap: 0
      }
      return
    }
    
    // Temel kapasite
    let baseCapacity = op.dailyCapacity * op.efficiency * seasonDurationDays
    
    // Fazla mesai etkisi
    const overtimeCapacity = baseCapacity * (overtimePercent / 100) * op.overtimeFactor
    baseCapacity += overtimeCapacity
    
    // Ek işgücü etkisi (basit model: %10 işgücü = %10 kapasite artışı)
    const workforceMultiplier = 1 + (additionalWorkforce / op.workforce) * 0.1
    baseCapacity *= Math.min(workforceMultiplier, 1.5) // Max %50 artış
    
    const adequacy = baseCapacity / requiredQty
    const gap = Math.max(0, requiredQty - baseCapacity)
    
    opAdequacies[op.id] = {
      adequacy: Math.round(adequacy * 100) / 100,
      capacity: Math.round(baseCapacity),
      required: Math.round(requiredQty),
      gap: Math.round(gap),
      operation: op
    }
    
    if (adequacy < minAdequacy) {
      minAdequacy = adequacy
      bottleneckOp = op.id
    }
  })
  
  // Genel kapasite yeterliliği (en düşük adequacy)
  const overallAdequacy = minAdequacy === Infinity ? 1.0 : minAdequacy
  
  // Toplam kapasite açığı (bottleneck operasyonun açığı)
  const totalGap = opAdequacies[bottleneckOp]?.gap || 0
  
  // Gerekli fazla mesai yüzdesi (basit hesaplama)
  let requiredOvertimePercent = 0
  if (overallAdequacy < 1.0 && bottleneckOp) {
    const bottleneck = opAdequacies[bottleneckOp]
    const op = bottleneck.operation
    const baseCap = op.dailyCapacity * op.efficiency * seasonDurationDays
    const neededCap = bottleneck.required
    const gapCap = neededCap - baseCap
    const overtimeNeeded = (gapCap / (baseCap * op.overtimeFactor)) * 100
    requiredOvertimePercent = Math.min(Math.max(0, overtimeNeeded), op.overtimeFactor * 100)
  }
  
  // Gerekli ek işgücü (basit model)
  let requiredExtraWorkforce = 0
  if (overallAdequacy < 1.0 && bottleneckOp) {
    const bottleneck = opAdequacies[bottleneckOp]
    const op = bottleneck.operation
    const workforceNeeded = (bottleneck.gap / (op.dailyCapacity * op.efficiency * seasonDurationDays)) * op.workforce
    requiredExtraWorkforce = Math.ceil(workforceNeeded)
  }
  
  // Dış kaynak önerisi (subcontractable operasyonlar için)
  let outsourcingQtySuggestion = 0
  if (overallAdequacy < 1.0 && bottleneckOp) {
    const bottleneck = opAdequacies[bottleneckOp]
    const op = bottleneck.operation
    if (op.subcontractable && bottleneck.gap > 0) {
      outsourcingQtySuggestion = Math.round(bottleneck.gap * 0.5) // %50'si dış kaynak
    }
  }
  
  return {
    overallAdequacy: Math.round(overallAdequacy * 100) / 100,
    overallAdequacyPercent: Math.round(overallAdequacy * 100),
    capacityGapQty: totalGap,
    bottleneckOp,
    bottleneckOpName: operations.find(o => o.id === bottleneckOp)?.name || '',
    requiredOvertimePercent: Math.round(requiredOvertimePercent * 10) / 10,
    requiredExtraWorkforce: Math.ceil(requiredExtraWorkforce),
    outsourcingQtySuggestion,
    operationDetails: opAdequacies
  }
}

