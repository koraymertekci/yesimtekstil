/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

// Forecast Hesaplama Fonksiyonları
// Deterministik + senaryolu hesaplama modeli

import {
  SEASONS,
  WORKING_DAYS_BY_SEASON,
  SEASONAL_DEMAND_MULTIPLIERS,
  BASE_ANNUAL_DEMAND,
  YEARLY_GROWTH_TREND,
  PRODUCT_MIX_PROFILES,
  BOM_PER_UNIT,
  MATERIAL_UNIT_COSTS,
  AVG_SELLING_PRICE_PER_UNIT,
  UNIT_COSTS,
  BASE_DAILY_CAPACITY,
  EFFICIENCY_FACTOR,
  getHistoricalIssues,
  getMaterialStock
} from '../data/forecastData'

// Forecast hesaplama
export const calculateForecast = (brand, season, year, horizonMonths) => {
  const baseDemand = BASE_ANNUAL_DEMAND[brand] || 200000
  const seasonMultiplier = SEASONAL_DEMAND_MULTIPLIERS[brand]?.[season] || 1.0
  const growthTrend = YEARLY_GROWTH_TREND[brand]?.[year] || 1.0
  
  // Sezon bazlı talep
  const seasonDemand = (baseDemand / 4) * seasonMultiplier * growthTrend
  
  // Ufuk ayına göre ölçekleme
  const horizonFactor = horizonMonths / 3 // 3 ay = 1 sezon
  const forecastQty = Math.round(seasonDemand * horizonFactor)
  
  // Ürün mix
  const productMix = PRODUCT_MIX_PROFILES[brand] || [
    { productGroup: 'Knit', share: 0.50 },
    { productGroup: 'Denim', share: 0.30 },
    { productGroup: 'Polo', share: 0.20 }
  ]
  
  return {
    forecastQty,
    unit: 'adet',
    productMix,
    season,
    year,
    horizonMonths
  }
}

// Kapasite hesaplama
export const calculateCapacity = (forecast, season, horizonMonths, overtimePercent = 0, additionalWorkforce = 0) => {
  const workingDays = WORKING_DAYS_BY_SEASON[season] || 90
  const horizonDays = Math.round((horizonMonths / 3) * workingDays)
  
  // Darboğaz operasyonu bul (dikim genelde darboğaz)
  const bottleneckOp = 'dikim'
  const baseDailyCapacity = BASE_DAILY_CAPACITY[bottleneckOp]
  
  // Temel kapasite
  let dailyCapacity = baseDailyCapacity * EFFICIENCY_FACTOR
  
  // Fazla mesai etkisi
  const overtimeMultiplier = 1 + (overtimePercent / 100) * 0.25 // Max %25 artış
  dailyCapacity *= overtimeMultiplier
  
  // Ek işgücü etkisi
  const workforceMultiplier = 1 + (additionalWorkforce / 120) * 0.1 // 120 kişi = %10 artış
  dailyCapacity *= Math.min(workforceMultiplier, 1.5) // Max %50 artış
  
  // Toplam kapasite
  const totalCapacity = Math.round(dailyCapacity * horizonDays)
  
  // Gap hesaplama
  const gap = Math.max(0, forecast.forecastQty - totalCapacity)
  const adequacy = forecast.forecastQty > 0 ? totalCapacity / forecast.forecastQty : 1.0
  
  return {
    totalCapacity,
    forecastQty: forecast.forecastQty,
    gap,
    adequacy: Math.round(adequacy * 100) / 100,
    adequacyPercent: Math.round(adequacy * 100),
    bottleneckOp,
    workingDays: horizonDays
  }
}

// Hammadde gereksinimi hesaplama
export const calculateMaterialRequirements = (forecast) => {
  const requirements = {}
  
  // Her ürün grubu için hammadde gereksinimlerini hesapla
  forecast.productMix.forEach(mix => {
    const productGroup = mix.productGroup
    const share = mix.share
    const productQty = forecast.forecastQty * share
    
    const bom = BOM_PER_UNIT[productGroup]
    if (!bom) return
    
    // BOM'daki her hammadde için gereksinim hesapla
    Object.entries(bom).forEach(([materialName, factor]) => {
      if (!requirements[materialName]) {
        requirements[materialName] = {
          required: 0,
          unit: getMaterialStock(materialName).unit
        }
      }
      
      requirements[materialName].required += productQty * factor
    })
  })
  
  // Mevcut stok ve yeterlilik hesapla
  const materialDetails = {}
  let criticalCount = 0
  
  Object.entries(requirements).forEach(([materialName, req]) => {
    const stock = getMaterialStock(materialName)
    const available = stock.currentStock
    const required = req.required
    const gap = Math.max(0, required - available)
    const adequacy = required > 0 ? available / required : 1.0
    
    materialDetails[materialName] = {
      name: materialName,
      required: Math.round(required * 100) / 100,
      available: Math.round(available),
      gap: Math.round(gap),
      adequacy: Math.round(adequacy * 100) / 100,
      adequacyPercent: Math.round(adequacy * 100),
      unit: req.unit,
      isCritical: adequacy < 1.0
    }
    
    if (adequacy < 1.0) {
      criticalCount++
    }
  })
  
  // En kritik hammaddeleri sırala
  const sortedMaterials = Object.values(materialDetails)
    .sort((a, b) => b.gap - a.gap)
  
  return {
    materialDetails,
    criticalCount,
    topCriticalMaterials: sortedMaterials.slice(0, 8) // Top 8 kritik
  }
}

// Maliyet ve kazanç hesaplama
export const calculateCostAndRevenue = (forecast, capacity, materials, horizonMonths, outsourcePercent = 0) => {
  // Hammadde maliyeti
  let materialCost = 0
  Object.values(materials.materialDetails).forEach(mat => {
    const unitCost = MATERIAL_UNIT_COSTS[mat.name] || 50
    materialCost += mat.required * unitCost
  })
  
  // İşçilik maliyeti
  const laborCost = forecast.forecastQty * UNIT_COSTS.laborCostPerUnit
  
  // Enerji maliyeti
  const energyCost = forecast.forecastQty * UNIT_COSTS.energyCostPerUnit
  
  // Dış kaynak maliyeti
  const outsourceQty = Math.round(forecast.forecastQty * (outsourcePercent / 100))
  const outsourceCost = outsourceQty * UNIT_COSTS.outsourceCostPerUnit
  
  // Lojistik maliyeti
  const logisticsCost = forecast.forecastQty * UNIT_COSTS.logisticsCostPerUnit
  
  // Toplam maliyet
  const totalCost = materialCost + laborCost + energyCost + outsourceCost + logisticsCost
  
  // Gelir
  const avgPrice = AVG_SELLING_PRICE_PER_UNIT[forecast.brand] || 250
  const revenue = forecast.forecastQty * avgPrice
  
  // Kâr
  const profit = revenue - totalCost
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0
  
  return {
    costs: {
      material: Math.round(materialCost),
      labor: Math.round(laborCost),
      energy: Math.round(energyCost),
      outsource: Math.round(outsourceCost),
      logistics: Math.round(logisticsCost),
      total: Math.round(totalCost)
    },
    revenue: Math.round(revenue),
    profit: Math.round(profit),
    profitMargin: Math.round(profitMargin * 10) / 10
  }
}

// Risk hesaplama (zaman çizelgesi)
export const calculateRiskTimeline = (forecast, capacity, materials, season, horizonMonths) => {
  const timeline = []
  const periodCount = horizonMonths === 6 ? 6 : 12 // 6 ay = haftalık, 12 ay = aylık
  
  // Mevsim ay isimleri
  const monthNames = season === 'Yaz' 
    ? ['May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki']
    : season === 'Kış'
    ? ['Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis']
    : season === 'İlkbahar'
    ? ['Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem']
    : ['Eyl', 'Eki', 'Kas', 'Ara', 'Oca', 'Şub']
  
  // Geçmiş sorunlar
  const historicalIssues = getHistoricalIssues(forecast.brand, season)
  
  for (let i = 0; i < periodCount; i++) {
    const periodName = horizonMonths === 6 
      ? `${monthNames[i] || `Ay ${i + 1}`}`
      : `${monthNames[i] || `Ay ${i + 1}`}`
    
    // Kapasite riski (zamanla artar)
    const capacityRisk = capacity.gap > 0
      ? Math.min(100, (capacity.gap / forecast.forecastQty) * 100 * (1 + i * 0.1))
      : 0
    
    // Hammadde riski (kritik hammaddeler)
    const materialRisk = materials.criticalCount > 0
      ? Math.min(100, materials.criticalCount * 10 * (1 + i * 0.05))
      : 0
    
    // Teslim süresi riski (lead time)
    const avgLeadTime = Object.values(materials.materialDetails)
      .reduce((sum, m) => sum + (getMaterialStock(m.name).leadTimeDays || 15), 0) / Object.keys(materials.materialDetails).length
    const leadTimeRisk = avgLeadTime > 20 ? Math.min(100, (avgLeadTime / 30) * 100 * (1 + i * 0.08)) : 0
    
    // Geçmiş gecikme riski
    const historyRisk = historicalIssues.delayRate * 100 * (1 + i * 0.03)
    
    // Toplam risk (ağırlıklı ortalama)
    const totalRisk = Math.min(100, Math.round(
      capacityRisk * 0.35 +
      materialRisk * 0.30 +
      leadTimeRisk * 0.20 +
      historyRisk * 0.15
    ))
    
    timeline.push({
      period: periodName,
      risk: totalRisk,
      capacityRisk: Math.round(capacityRisk),
      materialRisk: Math.round(materialRisk),
      leadTimeRisk: Math.round(leadTimeRisk),
      historyRisk: Math.round(historyRisk)
    })
  }
  
  return timeline
}

// Geçmiş sorun özeti
export const getHistoricalSummary = (brand, season) => {
  return getHistoricalIssues(brand, season)
}

// Ana hesaplama fonksiyonu (tüm sonuçları birleştir)
export const calculateFullForecast = (brand, season, year, horizonMonths, simulationParams = {}) => {
  const forecast = calculateForecast(brand, season, year, horizonMonths)
  forecast.brand = brand // Brand'i forecast'e ekle
  
  const capacity = calculateCapacity(
    forecast,
    season,
    horizonMonths,
    simulationParams.overtimePercent || 0,
    simulationParams.additionalWorkforce || 0
  )
  
  const materials = calculateMaterialRequirements(forecast)
  
  const costRevenue = calculateCostAndRevenue(
    forecast,
    capacity,
    materials,
    horizonMonths,
    simulationParams.outsourcePercent || 0
  )
  
  const riskTimeline = calculateRiskTimeline(forecast, capacity, materials, season, horizonMonths)
  
  const historicalSummary = getHistoricalSummary(brand, season)
  
  return {
    forecast,
    capacity,
    materials,
    costRevenue,
    riskTimeline,
    historicalSummary
  }
}

