/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

// Senaryo Hesaplama ve Önerileri
// 4 farklı senaryo: Mevcut plan, Fazla mesai, Dış kaynak, Stok+Kapasite takviyesi

import { calculateCapacityAdequacy } from './calcCapacity'
import { calculateMaterialAdequacy } from './calcMaterials'

// Senaryo 1: Mevcut planla devam
export const calculateScenario1 = (forecast, seasonDurationDays) => {
  const capacity = calculateCapacityAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    seasonDurationDays,
    0, // Overtime yok
    0  // Ek işgücü yok
  )
  
  const materials = calculateMaterialAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    forecast.unit
  )
  
  const canDeliver = capacity.overallAdequacy >= 1.0 && materials.overallAdequacy >= 1.0
  
  return {
    id: 1,
    name: 'Mevcut Planla Devam',
    canDeliver,
    capacityAdequacy: capacity.overallAdequacyPercent,
    materialAdequacy: materials.overallAdequacyPercent,
    actions: canDeliver 
      ? ['Mevcut kapasite ve stok yeterli']
      : [
          capacity.overallAdequacy < 1.0 ? `Kapasite açığı: ${capacity.capacityGapQty.toLocaleString('tr-TR')} ${forecast.unit}` : null,
          materials.overallAdequacy < 1.0 ? `Stok açığı: ${materials.totalGap.toLocaleString('tr-TR')} ${materials.criticalMaterialName}` : null
        ].filter(Boolean),
    estimatedCost: 0,
    riskNote: canDeliver ? 'Düşük risk' : 'Yüksek risk - Sipariş karşılanamaz'
  }
}

// Senaryo 2: Fazla mesai ile karşıla
export const calculateScenario2 = (forecast, seasonDurationDays) => {
  // Önce mevcut kapasiteyi kontrol et
  const baseCapacity = calculateCapacityAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    seasonDurationDays,
    0,
    0
  )
  
  // Gerekli fazla mesai yüzdesi (eğer kapasite yetersizse)
  let requiredOvertime = 20 // Varsayılan %20
  if (baseCapacity.overallAdequacy < 1.0) {
    requiredOvertime = Math.min(40, baseCapacity.requiredOvertimePercent || 20)
  }
  
  const capacity = calculateCapacityAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    seasonDurationDays,
    requiredOvertime,
    0
  )
  
  const materials = calculateMaterialAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    forecast.unit
  )
  
  const canDeliver = capacity.overallAdequacy >= 1.0 && materials.overallAdequacy >= 1.0
  
  // Fazla mesai maliyeti (basit model)
  const overtimeCost = capacity.requiredOvertimePercent > 0
    ? forecast.forecastQty * 0.5 * (capacity.requiredOvertimePercent / 100) // Birim başına %0.5 * overtime yüzdesi
    : 0
  
  return {
    id: 2,
    name: 'Fazla Mesai ile Karşıla',
    canDeliver,
    capacityAdequacy: capacity.overallAdequacyPercent,
    materialAdequacy: materials.overallAdequacyPercent,
    actions: [
      `+${capacity.requiredOvertimePercent}% fazla mesai`,
      materials.overallAdequacy < 1.0 ? `Stok satın alma gerekli: ${materials.totalGap.toLocaleString('tr-TR')} ${materials.criticalMaterialName}` : null
    ].filter(Boolean),
    estimatedCost: Math.round((overtimeCost + materials.totalPurchaseCost) * 100) / 100,
    riskNote: canDeliver ? 'Orta risk - İşçi yorgunluğu' : 'Yüksek risk - Stok açığı var'
  }
}

// Senaryo 3: Dış kaynak + iç üretim
export const calculateScenario3 = (forecast, seasonDurationDays) => {
  const capacity = calculateCapacityAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    seasonDurationDays,
    0,
    0
  )
  
  const materials = calculateMaterialAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    forecast.unit
  )
  
  // Dış kaynak miktarı (kapasite açığının %50'si)
  const outsourcingQty = capacity.capacityGapQty > 0 
    ? Math.round(capacity.capacityGapQty * 0.5)
    : 0
  
  // Dış kaynak ile birlikte kapasite yeterliliği
  const capacityWithOutsourcing = capacity.overallAdequacy + (outsourcingQty / forecast.forecastQty)
  const canDeliver = capacityWithOutsourcing >= 1.0 && materials.overallAdequacy >= 1.0
  
  // Dış kaynak maliyeti (birim başına %30 daha pahalı)
  const outsourcingCost = outsourcingQty * 3.5 // Varsayılan birim maliyet * 1.3
  
  return {
    id: 3,
    name: 'Dış Kaynak + İç Üretim',
    canDeliver,
    capacityAdequacy: Math.round(capacityWithOutsourcing * 100),
    materialAdequacy: materials.overallAdequacyPercent,
    actions: [
      `${outsourcingQty.toLocaleString('tr-TR')} ${forecast.unit} dış kaynak`,
      materials.overallAdequacy < 1.0 ? `Stok satın alma gerekli: ${materials.totalGap.toLocaleString('tr-TR')} ${materials.criticalMaterialName}` : null
    ].filter(Boolean),
    estimatedCost: Math.round((outsourcingCost + materials.totalPurchaseCost) * 100) / 100,
    riskNote: canDeliver ? 'Orta risk - Kalite kontrol gerekli' : 'Yüksek risk - Stok açığı var'
  }
}

// Senaryo 4: Stok satın alma + kapasite takviyesi (işçi/makine yatırım etkisi)
export const calculateScenario4 = (forecast, seasonDurationDays) => {
  // Ek işgücü ile kapasite artışı simülasyonu
  const additionalWorkforce = 50 // 50 kişi ek işgücü
  
  const capacity = calculateCapacityAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    seasonDurationDays,
    15, // %15 fazla mesai
    additionalWorkforce
  )
  
  const materials = calculateMaterialAdequacy(
    forecast.forecastQty,
    forecast.productMix,
    forecast.unit
  )
  
  const canDeliver = capacity.overallAdequacy >= 1.0 && materials.overallAdequacy >= 1.0
  
  // İşgücü maliyeti (aylık maaş * sezon süresi)
  const workforceCost = additionalWorkforce * 15000 * (seasonDurationDays / 30) // 15k TL/ay * ay sayısı
  
  // Makine yatırım etkisi (simülasyon: kapasiteyi %20 artırır)
  const machineInvestmentCost = 500000 // 500k TL yatırım
  
  return {
    id: 4,
    name: 'Stok Satın Alma + Kapasite Takviyesi',
    canDeliver,
    capacityAdequacy: capacity.overallAdequacyPercent,
    materialAdequacy: materials.overallAdequacyPercent,
    actions: [
      `+${additionalWorkforce} ek işgücü`,
      `+${materials.totalGap.toLocaleString('tr-TR')} ${materials.criticalMaterialName} satın alma`,
      'Makine yatırımı (uzun vadeli)'
    ],
    estimatedCost: Math.round((workforceCost + materials.totalPurchaseCost + machineInvestmentCost) * 100) / 100,
    riskNote: canDeliver ? 'Düşük risk - Yüksek maliyet' : 'Yüksek risk - Yatırım gerekli'
  }
}

// Tüm senaryoları hesapla
export const calculateAllScenarios = (forecast, seasonDurationDays) => {
  return [
    calculateScenario1(forecast, seasonDurationDays),
    calculateScenario2(forecast, seasonDurationDays),
    calculateScenario3(forecast, seasonDurationDays),
    calculateScenario4(forecast, seasonDurationDays)
  ]
}

