// Karar Destek Özeti Builder
// DSS prensibi: Kesin emir yok, yumuşak dil kullan

export function buildDecisionSupportSummary({ chartType, data, thresholds, selectedBrands, selectedSeason }) {
  const results = {
    shortSummary: '',
    observations: [],
    suggestions: [],
    statusLabel: null,
    calloutText: null,
    kpis: [],
    preSeason: {
      preparationSteps: [],
      riskMitigationNotes: [],
      checklistMetrics: []
    }
  }

  switch (chartType) {
    case 'production-load-bar':
      return buildProductionLoadSummary(data, selectedBrands, selectedSeason)
    
    case 'load-index-line':
      return buildLoadIndexSummary(data, thresholds, selectedBrands, selectedSeason)
    
    case 'brand-load-pie':
      return buildBrandLoadSummary(data, selectedBrands, selectedSeason)
    
    case 'profit-bar':
      return buildProfitSummary(data, selectedBrands, selectedSeason)
    
    case 'forecastSummary':
      return buildForecastSummary(data, selectedBrands, selectedSeason)
    
    default:
      return results
  }
}

// 1) Sezonluk Üretim Yükü (bar chart)
function buildProductionLoadSummary(data, selectedBrands, selectedSeason) {
  if (!data || data.length === 0) {
    return {
      shortSummary: 'Üretim yükü verisi bulunamadı.',
      observations: [],
      suggestions: [],
      statusLabel: null,
      calloutText: null,
      kpis: [],
      preSeason: {
        preparationSteps: [],
        riskMitigationNotes: [],
        checklistMetrics: []
      }
    }
  }

  // Aylık yükleri analiz et
  const monthlyLoads = data.map(d => ({ month: d.month, qty: d.qty }))
  const maxLoad = Math.max(...monthlyLoads.map(m => m.qty))
  const minLoad = Math.min(...monthlyLoads.map(m => m.qty))
  const maxMonth = monthlyLoads.find(m => m.qty === maxLoad)?.month
  const minMonth = monthlyLoads.find(m => m.qty === minLoad)?.month
  const avgLoad = monthlyLoads.reduce((sum, m) => sum + m.qty, 0) / monthlyLoads.length
  const variation = ((maxLoad - minLoad) / avgLoad) * 100

  const observations = []
  const suggestions = []

  // Kısa Özet
  const shortSummary = `${selectedSeason} sezonunda üretim yükü ${maxMonth} ayında zirve yapıyor (${formatNumber(maxLoad)} adet). Yük dağılımı ${variation > 30 ? 'dalgalı' : 'dengeli'} görünüyor.`

  // Gözlemler
  if (maxLoad > avgLoad * 1.2) {
    observations.push(`${maxMonth} ayında üretim yükü ortalamanın %${Math.round(((maxLoad / avgLoad) - 1) * 100)} üzerinde.`)
  }
  if (variation > 30) {
    observations.push(`Aylar arası yük farkı yüksek (${formatNumber(maxLoad - minLoad)} adet), planlama esnekliği gerekebilir.`)
  }
  if (minMonth && maxMonth && minMonth !== maxMonth) {
    observations.push(`En düşük yük ${minMonth} ayında görülüyor (${formatNumber(minLoad)} adet).`)
  }
  observations.push(`Sezon boyunca ortalama aylık yük: ${formatNumber(Math.round(avgLoad))} adet.`)

  // Tavsiyeler
  if (variation > 30) {
    suggestions.push(`Yükün ${maxMonth} ayında zirve yapması kapasite sıkışıklığı riski oluşturabilir; iş planı kaydırma senaryosu değerlendirilebilir.`)
  } else {
    suggestions.push(`Yük dağılımı dengeli görünüyor; satın alma planı daha öngörülebilir olabilir.`)
  }
  if (maxLoad > avgLoad * 1.2) {
    suggestions.push(`${maxMonth} ayı için ek kapasite veya dış kaynak seçenekleri değerlendirilebilir.`)
  }
  suggestions.push(`Düşük yük dönemlerinde (${minMonth}) bakım veya stok hazırlığı planlanabilir.`)

  // Durum rozeti
  let statusLabel = 'Dengeli'
  if (variation > 40) {
    statusLabel = 'Dikkat Gerekli'
  } else if (variation > 30) {
    statusLabel = 'Kontrollü Risk'
  }

  // Callout metni
  const calloutText = `Zirve ay: ${maxMonth}. Yük kaydırma senaryosu değerlendirilebilir.`

  // KPIs
  const kpis = [
    { label: 'Zirve Ay', value: maxMonth },
    { label: 'Dalgalanma', value: `%${Math.round(variation)}` },
    { label: 'Ortalama Yük', value: `${formatNumber(Math.round(avgLoad))} adet` }
  ]

  // Sezona Gelmeden Yapılması Gerekenler (6 Ay)
  const preparationSteps = []
  const riskMitigationNotes = []
  const checklistMetrics = []

  if (variation > 30) {
    preparationSteps.push(`Zirve aylar için kapasite planı senaryoları değerlendirilebilir.`)
  }
  if (minMonth && maxMonth && minMonth !== maxMonth) {
    preparationSteps.push(`Düşük yük ayları (${minMonth}) bakım/kalite iyileştirme planı için fırsat oluşturabilir.`)
  }
  if (maxLoad > avgLoad * 1.2) {
    preparationSteps.push(`${maxMonth} ayı için ek kapasite veya dış kaynak seçenekleri önceden değerlendirilebilir.`)
  }
  preparationSteps.push(`Tedarik lead-time ile yük dağılımı uyumu gözden geçirilebilir.`)
  preparationSteps.push(`Yük dağılımına göre iş gücü planlaması yapılabilir.`)

  if (variation > 30) {
    riskMitigationNotes.push(`Zirve ay yoğunluğu artarsa gecikme riski oluşabilir; esnek planlama seçenekleri değerlendirilebilir.`)
  }
  if (maxLoad > avgLoad * 1.2) {
    riskMitigationNotes.push(`${maxMonth} ayında kapasite aşımı riski görülebilir; alternatif üretim senaryoları planlanabilir.`)
  }
  riskMitigationNotes.push(`Yük dalgalanması yüksek olduğu için stok yönetimi stratejileri gözden geçirilebilir.`)
  riskMitigationNotes.push(`Tedarik gecikmelerine karşı tampon stok seviyeleri değerlendirilebilir.`)

  checklistMetrics.push(`Aylık yük sapması (%)`)
  checklistMetrics.push(`Zirve ay tekrar sıklığı`)
  checklistMetrics.push(`Lead-time uyumu`)
  checklistMetrics.push(`Ortalama yük trendi (3 aylık hareketli ortalama)`)
  checklistMetrics.push(`Kapasite kullanım oranı`)

  return { 
    shortSummary, 
    observations, 
    suggestions, 
    statusLabel, 
    calloutText, 
    kpis,
    preSeason: {
      preparationSteps,
      riskMitigationNotes,
      checklistMetrics
    }
  }
}

// 2) Sezonluk Yük Endeksi (line chart)
function buildLoadIndexSummary(data, thresholds, selectedBrands, selectedSeason) {
  if (!data || data.length === 0) {
    return {
      shortSummary: 'Yük endeksi verisi bulunamadı.',
      observations: [],
      suggestions: [],
      statusLabel: null,
      calloutText: null,
      kpis: [],
      preSeason: {
        preparationSteps: [],
        riskMitigationNotes: [],
        checklistMetrics: []
      }
    }
  }

  const indices = data.map(d => ({ month: d.month, index: d.index }))
  const maxIndex = Math.max(...indices.map(i => i.index))
  const minIndex = Math.min(...indices.map(i => i.index))
  const maxIndexMonth = indices.find(i => i.index === maxIndex)?.month
  const avgIndex = indices.reduce((sum, i) => sum + i.index, 0) / indices.length

  const thresholdHigh = thresholds?.high || 110
  const thresholdMedium = thresholds?.medium || 105

  const observations = []
  const suggestions = []

  // Kritik/Uyarı ayları
  const criticalMonths = indices.filter(i => i.index >= thresholdHigh).map(i => i.month)
  const warningMonths = indices.filter(i => i.index >= thresholdMedium && i.index < thresholdHigh).map(i => i.month)

  // Kısa Özet
  let summaryText = `${selectedSeason} sezonunda yük endeksi ${avgIndex >= 100 ? 'ortalamanın üzerinde' : 'ortalamanın altında'} seyrediyor.`
  if (criticalMonths.length > 0) {
    summaryText += ` ${criticalMonths.join(', ')} aylarında kritik eşik aşılmış durumda.`
  } else if (warningMonths.length > 0) {
    summaryText += ` ${warningMonths.join(', ')} aylarında uyarı eşiğine yaklaşılmış.`
  }

  // Gözlemler
  if (criticalMonths.length > 0) {
    observations.push(`${criticalMonths.length} ay kritik eşik (${thresholdHigh}) üzerinde: ${criticalMonths.join(', ')}.`)
  }
  if (warningMonths.length > 0) {
    observations.push(`${warningMonths.length} ay uyarı eşiğine (${thresholdMedium}) yakın: ${warningMonths.join(', ')}.`)
  }
  observations.push(`Endeks ${maxIndexMonth} ayında en yüksek değere (${maxIndex.toFixed(1)}) ulaşıyor.`)
  if (maxIndex - minIndex > 10) {
    observations.push(`Aylar arası endeks farkı yüksek (${(maxIndex - minIndex).toFixed(1)}), dalgalanma görülüyor.`)
  }

  // Tavsiyeler
  if (criticalMonths.length > 0) {
    suggestions.push(`Kritik eşik üzerindeki aylar (${criticalMonths.join(', ')}) için tedarik/üretim takvimi gözden geçirilebilir.`)
    suggestions.push(`Ek kapasite veya alternatif plan değerlendirmesi gerekebilir.`)
  } else if (warningMonths.length > 0) {
    suggestions.push(`Endeksin uyarı eşiğine yaklaşması, güvenli kapasite marjının daraldığını gösterebilir.`)
  }
  if (maxIndex - minIndex > 10) {
    suggestions.push(`Dalgalanmanın yüksek olduğu dönemlerde esnek planlama yaklaşımı değerlendirilebilir.`)
  }

  // Durum rozeti
  let statusLabel = 'Dengeli'
  if (criticalMonths.length > 0) {
    statusLabel = 'Dikkat Gerekli'
  } else if (warningMonths.length > 0) {
    statusLabel = 'Kontrollü Risk'
  }

  // Callout metni
  let calloutText = ''
  if (criticalMonths.length > 0) {
    calloutText = `Kritik eşik aşımı: ${criticalMonths[0]}. Kapasite marjı daralabilir.`
  } else if (warningMonths.length > 0) {
    calloutText = `Uyarı eşiği yakın: ${warningMonths[0]}. Kapasite marjı daralabilir.`
  } else {
    calloutText = `Endeks dengeli seyrediyor. Planlama öngörülebilir olabilir.`
  }

  // KPIs
  const kpis = [
    { label: 'Maksimum Endeks', value: maxIndex.toFixed(1) },
    { label: 'Kritik Ay', value: criticalMonths.length > 0 ? criticalMonths[0] : 'Yok' },
    { label: 'Ortalama Endeks', value: avgIndex.toFixed(1) }
  ]

  // Sezona Gelmeden Yapılması Gerekenler (6 Ay)
  const preparationSteps = []
  const riskMitigationNotes = []
  const checklistMetrics = []

  if (criticalMonths.length > 0 || warningMonths.length > 0) {
    preparationSteps.push(`Uyarı/kritik eşiğe yaklaşan aylar için kapasite marjı gözden geçirilebilir.`)
  }
  if (maxIndex - minIndex > 10) {
    preparationSteps.push(`Planlama politikalarında güvenlik marjı (buffer) tanımı gözden geçirilebilir.`)
  }
  if (criticalMonths.length > 0) {
    preparationSteps.push(`${criticalMonths.join(', ')} ayları için alternatif üretim planları değerlendirilebilir.`)
  }
  preparationSteps.push(`Endeks trendi takip edilerek sezon öncesi hazırlıklar planlanabilir.`)

  if (criticalMonths.length > 0) {
    riskMitigationNotes.push(`Kritik eşik üstü ay sayısı artarsa alternatif planlar değerlendirilebilir.`)
  }
  if (warningMonths.length > 0) {
    riskMitigationNotes.push(`Uyarı eşiğine yaklaşan aylar için kapasite takviyesi seçenekleri değerlendirilebilir.`)
  }
  if (maxIndex - minIndex > 10) {
    riskMitigationNotes.push(`Endeks dalgalanması yüksek olduğu için esnek planlama yaklaşımı gözden geçirilebilir.`)
  }
  riskMitigationNotes.push(`Eşik aşımı durumlarında müdahale süreçleri önceden planlanabilir.`)

  checklistMetrics.push(`Kritik eşik üstü ay sayısı`)
  checklistMetrics.push(`Uyarı eşiğine yakın ay sayısı`)
  checklistMetrics.push(`3 aylık trend`)
  checklistMetrics.push(`Endeks dalgalanma katsayısı`)
  checklistMetrics.push(`Eşik aşım süresi (gün)`)

  return { 
    shortSummary: summaryText, 
    observations, 
    suggestions, 
    statusLabel, 
    calloutText, 
    kpis,
    preSeason: {
      preparationSteps,
      riskMitigationNotes,
      checklistMetrics
    }
  }
}

// 3) Marka Yük Dağılımı (donut chart)
function buildBrandLoadSummary(data, selectedBrands, selectedSeason) {
  if (!data || data.length === 0) {
    return {
      shortSummary: 'Marka yük dağılımı verisi bulunamadı.',
      observations: [],
      suggestions: [],
      statusLabel: null,
      calloutText: null,
      kpis: [],
      preSeason: {
        preparationSteps: [],
        riskMitigationNotes: [],
        checklistMetrics: []
      }
    }
  }

  const brandShares = data.map(d => ({ brand: d.brand, value: d.value, percentage: parseFloat(d.percentage) }))
  const sortedByShare = [...brandShares].sort((a, b) => b.percentage - a.percentage)
  const topBrand = sortedByShare[0]
  const top3Total = sortedByShare.slice(0, 3).reduce((sum, b) => sum + b.percentage, 0)

  const observations = []
  const suggestions = []

  // Kısa Özet
  const brandLabel = selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} marka`
  let summaryText = `${selectedSeason} sezonunda ${brandLabel} için üretim yükü dağılımı analiz edildi.`
  if (topBrand.percentage > 50) {
    summaryText += ` ${topBrand.brand} markası toplam yükün %${topBrand.percentage.toFixed(1)}'ini oluşturuyor.`
  } else {
    summaryText += ` En yüksek pay ${topBrand.brand} markasında (%${topBrand.percentage.toFixed(1)}).`
  }

  // Gözlemler
  if (topBrand.percentage > 50) {
    observations.push(`${topBrand.brand} markası toplam yükün yarısından fazlasını (%${topBrand.percentage.toFixed(1)}) oluşturuyor.`)
  }
  if (top3Total > 80) {
    observations.push(`İlk 3 marka toplam yükün %${top3Total.toFixed(1)}'ini kapsıyor.`)
  } else {
    observations.push(`Yük dağılımı ${sortedByShare.length} marka arasında daha dengeli görünüyor.`)
  }
  observations.push(`Toplam üretim yükü: ${formatNumber(brandShares.reduce((sum, b) => sum + b.value, 0))} adet.`)

  // Tavsiyeler
  if (topBrand.percentage > 50) {
    suggestions.push(`Yükün büyük kısmının tek markada (${topBrand.brand}) yoğunlaşması tedarik tarafında bağımlılık riski yaratabilir; alternatif marka/tedarik senaryoları değerlendirilebilir.`)
  } else {
    suggestions.push(`Yük dağılımı çeşitli markalar arasında paylaşıldığı için risk dağılıyor; bu durum planlama esnekliği sağlayabilir.`)
  }
  if (top3Total > 80) {
    suggestions.push(`İlk 3 markanın yüksek payı, bu markaların tedarik süreçlerinin yakından takip edilmesi gerektiğini gösterebilir.`)
  }
  suggestions.push(`Marka bazlı yük dağılımı, satın alma ve üretim planlamasında marka önceliklendirmesi için kullanılabilir.`)

  // Durum rozeti
  let statusLabel = 'Dengeli'
  if (topBrand.percentage > 60) {
    statusLabel = 'Dikkat Gerekli'
  } else if (topBrand.percentage > 50) {
    statusLabel = 'Kontrollü Risk'
  }

  // Callout metni
  const calloutText = topBrand.percentage > 50
    ? `Yük yoğunlaşması yüksek: ${topBrand.brand} (%${topBrand.percentage.toFixed(1)}). Tek markaya bağımlılık artabilir.`
    : `Yük dağılımı dengeli. Risk dağılıyor.`

  // KPIs
  const kpis = [
    { label: 'En Yüksek Pay', value: `${topBrand.brand} (%${topBrand.percentage.toFixed(1)})` },
    { label: 'Toplam Marka', value: `${sortedByShare.length} marka` },
    { label: 'Toplam Yük', value: `${formatNumber(brandShares.reduce((sum, b) => sum + b.value, 0))} adet` }
  ]

  // Sezona Gelmeden Yapılması Gerekenler (6 Ay)
  const preparationSteps = []
  const riskMitigationNotes = []
  const checklistMetrics = []

  if (topBrand.percentage > 50) {
    preparationSteps.push(`Yük tek markada yoğunlaşıyorsa alternatif tedarik senaryoları değerlendirilebilir.`)
  }
  if (topBrand.percentage > 60) {
    preparationSteps.push(`${topBrand.brand} markası için yedek tedarikçi portföyü oluşturulabilir.`)
  }
  if (top3Total > 80) {
    preparationSteps.push(`İlk 3 markanın tedarik süreçleri gözden geçirilebilir.`)
  }
  preparationSteps.push(`Marka bazlı tedarik performansı analiz edilerek risk değerlendirmesi yapılabilir.`)
  preparationSteps.push(`Portföy çeşitlendirmesi için alternatif marka seçenekleri değerlendirilebilir.`)

  if (topBrand.percentage > 50) {
    riskMitigationNotes.push(`Tek markaya bağımlılık riski artabilir; tedarik kesintisi senaryoları planlanabilir.`)
  }
  if (top3Total > 80) {
    riskMitigationNotes.push(`İlk 3 markanın tedarik gecikmeleri toplam üretimi etkileyebilir; alternatif planlar değerlendirilebilir.`)
  }
  riskMitigationNotes.push(`Tedarik performansı düşerse üretim planlaması etkilenebilir; yedek planlar gözden geçirilebilir.`)

  checklistMetrics.push(`Top1 marka payı`)
  checklistMetrics.push(`Top3 marka payı`)
  checklistMetrics.push(`Tedarik performansı (gecikme/kalite)`)
  checklistMetrics.push(`Marka bazlı yük trendi`)
  checklistMetrics.push(`Tedarik güvenilirliği skoru`)

  return { 
    shortSummary: summaryText, 
    observations, 
    suggestions, 
    statusLabel, 
    calloutText, 
    kpis,
    preSeason: {
      preparationSteps,
      riskMitigationNotes,
      checklistMetrics
    }
  }
}

// 4) Gelir • Maliyet • Kâr Analizi (grouped bar chart)
function buildProfitSummary(data, selectedBrands, selectedSeason) {
  if (!data || data.length === 0) {
    return {
      shortSummary: 'Gelir-maliyet-kâr verisi bulunamadı.',
      observations: [],
      suggestions: [],
      statusLabel: null,
      calloutText: null,
      kpis: [],
      preSeason: {
        preparationSteps: [],
        riskMitigationNotes: [],
        checklistMetrics: []
      }
    }
  }

  const monthlyData = data.map(d => ({
    month: d.month,
    revenue: d.Gelir,
    cost: d.Maliyet,
    profit: d.Kâr
  }))

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0)
  const totalCost = monthlyData.reduce((sum, m) => sum + m.cost, 0)
  const totalProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const maxProfitMonth = monthlyData.reduce((max, m) => m.profit > max.profit ? m : max, monthlyData[0])
  const minProfitMonth = monthlyData.reduce((min, m) => m.profit < min.profit ? m : min, monthlyData[0])
  const profitVariation = monthlyData.map(m => m.profit)
  const profitStdDev = Math.sqrt(profitVariation.reduce((sum, p) => sum + Math.pow(p - (totalProfit / monthlyData.length), 2), 0) / monthlyData.length)

  const observations = []
  const suggestions = []

  // Kısa Özet
  const brandLabel = selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} marka`
  let summaryText = `${selectedSeason} sezonunda ${brandLabel} için toplam gelir ${formatNumber(totalRevenue)} TL, toplam maliyet ${formatNumber(totalCost)} TL.`
  summaryText += ` Net kâr ${formatNumber(totalProfit)} TL (kârlılık oranı: %${profitMargin.toFixed(1)}).`

  // Gözlemler
  observations.push(`En yüksek kâr ${maxProfitMonth.month} ayında gerçekleşiyor (${formatNumber(maxProfitMonth.profit)} TL).`)
  if (minProfitMonth.profit < 0) {
    observations.push(`${minProfitMonth.month} ayında zarar görülüyor (${formatNumber(Math.abs(minProfitMonth.profit))} TL).`)
  } else {
    observations.push(`En düşük kâr ${minProfitMonth.month} ayında (${formatNumber(minProfitMonth.profit)} TL).`)
  }
  if (profitStdDev > totalProfit / monthlyData.length * 0.3) {
    observations.push(`Kâr dalgalanması yüksek; aylar arası tutarsızlık görülüyor.`)
  }
  observations.push(`Ortalama aylık kâr: ${formatNumber(Math.round(totalProfit / monthlyData.length))} TL.`)

  // Tavsiyeler
  if (profitMargin < 10) {
    suggestions.push(`Kâr marjı düşükse (%${profitMargin.toFixed(1)}) fiyat/ürün karması optimizasyonu değerlendirilebilir.`)
  }
  if (minProfitMonth.profit < 0) {
    suggestions.push(`Kârlılığın düşüş gösterdiği aylarda (${minProfitMonth.month}) maliyet kalemleri yeniden gözden geçirilebilir.`)
  } else if (profitStdDev > totalProfit / monthlyData.length * 0.3) {
    suggestions.push(`Kâr dalgalanmasının yüksek olduğu dönemlerde maliyet yönetimi ve gelir optimizasyonu stratejileri değerlendirilebilir.`)
  }
  if (maxProfitMonth.profit > totalProfit / monthlyData.length * 1.5) {
    suggestions.push(`${maxProfitMonth.month} ayındaki yüksek kâr performansının nedenleri analiz edilerek diğer aylara uygulanabilirliği değerlendirilebilir.`)
  }
  suggestions.push(`Gelir-maliyet-kâr analizi, sezon boyunca finansal performansın izlenmesi için kullanılabilir.`)

  // Durum rozeti
  let statusLabel = 'Dengeli'
  if (profitMargin < 5 || minProfitMonth.profit < 0) {
    statusLabel = 'Dikkat Gerekli'
  } else if (profitMargin < 10) {
    statusLabel = 'Kontrollü Risk'
  }

  // Callout metni
  const calloutText = `Kârlılık oranı: %${profitMargin.toFixed(1)}. En düşük kâr: ${minProfitMonth.month}.`

  // KPIs
  const kpis = [
    { label: 'Kârlılık (%)', value: `%${profitMargin.toFixed(1)}` },
    { label: 'En Düşük Kâr Ayı', value: minProfitMonth.month },
    { label: 'Toplam Kâr', value: `${formatNumber(totalProfit)} TL` }
  ]

  // Sezona Gelmeden Yapılması Gerekenler (6 Ay)
  const preparationSteps = []
  const riskMitigationNotes = []
  const checklistMetrics = []

  if (profitMargin < 10) {
    preparationSteps.push(`Düşük kâr görülen aylar için maliyet kalemleri gözden geçirilebilir.`)
  }
  if (profitStdDev > totalProfit / monthlyData.length * 0.3) {
    preparationSteps.push(`Kâr dalgalanması yüksek olduğu için maliyet yönetimi stratejileri değerlendirilebilir.`)
  }
  if (minProfitMonth.profit < 0) {
    preparationSteps.push(`${minProfitMonth.month} ayındaki zarar durumunun tekrarını önlemek için maliyet optimizasyonu planlanabilir.`)
  }
  preparationSteps.push(`Ürün karması ve fiyatlama varsayımları gözden geçirilebilir.`)
  preparationSteps.push(`Hammadde, işçilik ve lojistik maliyetleri analiz edilerek iyileştirme alanları belirlenebilir.`)

  if (profitMargin < 5 || minProfitMonth.profit < 0) {
    riskMitigationNotes.push(`Düşük kârlılık veya zarar durumu tekrarlanırsa finansal risk artabilir; maliyet kontrol önlemleri değerlendirilebilir.`)
  }
  if (profitStdDev > totalProfit / monthlyData.length * 0.3) {
    riskMitigationNotes.push(`Kâr dalgalanması yüksek olduğu için nakit akışı planlaması gözden geçirilebilir.`)
  }
  riskMitigationNotes.push(`Maliyet artışları kârlılığı etkileyebilir; fiyatlama stratejileri değerlendirilebilir.`)

  checklistMetrics.push(`Kâr marjı (%)`)
  checklistMetrics.push(`Maliyet/Gelir oranı`)
  checklistMetrics.push(`En düşük kâr ayı tekrarı`)
  checklistMetrics.push(`Kâr dalgalanma katsayısı`)
  checklistMetrics.push(`Maliyet kalemleri kırılımı`)

  return { 
    shortSummary: summaryText, 
    observations, 
    suggestions, 
    statusLabel, 
    calloutText, 
    kpis,
    preSeason: {
      preparationSteps,
      riskMitigationNotes,
      checklistMetrics
    }
  }
}

// 5) Forecast Özeti (forecast summary)
function buildForecastSummary(data, selectedBrands, selectedSeason) {
  if (!data) {
    return {
      shortSummary: 'Forecast özeti verisi bulunamadı.',
      observations: [],
      suggestions: [],
      statusLabel: null,
      calloutText: null,
      kpis: [],
      preSeason: {
        preparationSteps: [],
        riskMitigationNotes: [],
        checklistMetrics: []
      }
    }
  }

  const {
    forecastTotal = 0,
    trendPct = 0,
    seasonDays = 0,
    productMix = [],
    brandBreakdown = []
  } = data

  const observations = []
  const suggestions = []
  
  // En yüksek paya sahip marka
  const topBrand = brandBreakdown.length > 0 
    ? brandBreakdown.reduce((max, b) => (b.percentage > max.percentage ? b : max), brandBreakdown[0])
    : null

  // Kısa Özet
  const brandLabel = selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} marka`
  let shortSummary = `${selectedSeason} sezonunda ${brandLabel} için toplam tahmin miktarı ${formatNumber(forecastTotal)} adet.`
  if (trendPct !== 0) {
    shortSummary += ` Trend ${trendPct >= 0 ? 'pozitif' : 'negatif'} (%${Math.abs(trendPct).toFixed(1)}).`
  }
  if (topBrand) {
    shortSummary += ` En yüksek pay ${topBrand.brand} markasında (%${topBrand.percentage.toFixed(1)}).`
  }

  // Gözlemler
  observations.push(`Sezon süresi: ${seasonDays} gün.`)
  if (trendPct > 0) {
    observations.push(`Trend pozitif (%${trendPct.toFixed(1)}), büyüme görülüyor.`)
  } else if (trendPct < 0) {
    observations.push(`Trend negatif (%${Math.abs(trendPct).toFixed(1)}), düşüş görülüyor.`)
  } else {
    observations.push(`Trend nötr, stabil seyir görülüyor.`)
  }
  if (topBrand && topBrand.percentage > 50) {
    observations.push(`${topBrand.brand} markası toplam tahminin yarısından fazlasını (%${topBrand.percentage.toFixed(1)}) oluşturuyor.`)
  }
  if (productMix.length > 0) {
    const mixText = productMix.map(p => `${p.name} %${p.share}`).join(', ')
    observations.push(`Ürün mix: ${mixText}.`)
  }
  if (brandBreakdown.length > 0) {
    observations.push(`${brandBreakdown.length} marka için tahmin üretildi.`)
  }

  // Tavsiyeler
  if (trendPct < 0) {
    suggestions.push(`Trend negatif olduğu için tedarik planı daha temkinli değerlendirilebilir.`)
  } else if (trendPct > 10) {
    suggestions.push(`Yüksek büyüme trendi görüldüğü için kapasite planlaması gözden geçirilebilir.`)
  }
  if (forecastTotal > 50000) {
    suggestions.push(`Toplam tahmin yüksek olduğu için kapasite marjı ve tedarik süreçleri değerlendirilebilir.`)
  }
  if (topBrand && topBrand.percentage > 50) {
    suggestions.push(`${topBrand.brand} markasının yüksek payı nedeniyle tedarik bağımlılığı riski değerlendirilebilir.`)
  }
  suggestions.push(`Sezon boyunca tahmin gerçekleşme oranı izlenerek model iyileştirmesi yapılabilir.`)

  // Durum rozeti
  let statusLabel = 'Dengeli'
  if (trendPct < -5 || (topBrand && topBrand.percentage > 60)) {
    statusLabel = 'Dikkat Gerekli'
  } else if (trendPct < 0 || (topBrand && topBrand.percentage > 50)) {
    statusLabel = 'Kontrollü Risk'
  }

  // Callout metni
  let calloutText = ''
  if (trendPct < 0) {
    calloutText = `Trend negatif: tedarik planı daha temkinli değerlendirilebilir.`
  } else if (forecastTotal > 50000) {
    calloutText = `Toplam tahmin yüksek: kapasite marjı gözden geçirilebilir.`
  } else {
    calloutText = `Tahmin dengeli görünüyor. Planlama öngörülebilir olabilir.`
  }

  // KPIs
  const kpis = [
    { label: 'Toplam Tahmin', value: `${formatNumber(forecastTotal)} adet` },
    { label: 'Trend', value: `${trendPct >= 0 ? '+' : ''}${trendPct.toFixed(1)}%` },
    { label: topBrand ? 'Top Marka Payı' : 'Marka Sayısı', value: topBrand ? `%${topBrand.percentage.toFixed(1)}` : `${brandBreakdown.length} marka` }
  ]

  // Sezona Gelmeden Yapılması Gerekenler (6 Ay)
  const preparationSteps = []
  const riskMitigationNotes = []
  const checklistMetrics = []

  if (trendPct < 0) {
    preparationSteps.push(`Trend negatifse tedarik planı daha temkinli değerlendirilebilir.`)
  } else if (trendPct > 10) {
    preparationSteps.push(`Yüksek büyüme trendi görüldüğü için kapasite planlaması gözden geçirilebilir.`)
  }
  if (topBrand && topBrand.percentage > 50) {
    preparationSteps.push(`Top markaların payı yüksekse portföy dengeleme seçenekleri değerlendirilebilir.`)
  }
  preparationSteps.push(`Tahmin gerçekleşme oranı izlenerek model parametreleri gözden geçirilebilir.`)
  preparationSteps.push(`Sezon öncesi tedarik ve üretim hazırlıkları planlanabilir.`)

  if (trendPct < -5) {
    riskMitigationNotes.push(`Negatif trend sürerse talep düşüşü riski oluşabilir; stok yönetimi stratejileri değerlendirilebilir.`)
  }
  if (topBrand && topBrand.percentage > 60) {
    riskMitigationNotes.push(`Tek markaya bağımlılık yüksek olduğu için tedarik kesintisi riski değerlendirilebilir.`)
  }
  if (forecastTotal > 50000) {
    riskMitigationNotes.push(`Yüksek tahmin miktarı kapasite aşımı riski oluşturabilir; alternatif planlar gözden geçirilebilir.`)
  }
  riskMitigationNotes.push(`Tahmin sapması üretim planlamasını etkileyebilir; esnek planlama yaklaşımı değerlendirilebilir.`)

  checklistMetrics.push(`Top marka payı`)
  checklistMetrics.push(`Trend (%)`)
  checklistMetrics.push(`Ürün mix değişimi`)
  checklistMetrics.push(`Tahmin gerçekleşme oranı`)
  checklistMetrics.push(`Sezonlar arası karşılaştırma`)

  return {
    shortSummary,
    observations,
    suggestions,
    statusLabel,
    calloutText,
    kpis,
    preSeason: {
      preparationSteps,
      riskMitigationNotes,
      checklistMetrics
    }
  }
}

// Yardımcı fonksiyon
function formatNumber(value) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

