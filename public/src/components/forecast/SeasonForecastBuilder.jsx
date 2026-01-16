import React, { useState, useMemo, useEffect } from 'react'
import { X, AlertCircle, TrendingUp } from 'lucide-react'
import { CUSTOMERS } from '../../data/customers'
import { generateAggregateYearlyData, calculate3YearAverage, calculateComparison } from '../../data/mockSeasonHistory'
import ForecastChartsGrid from './ForecastChartsGrid'
import DecisionSupportPanel from './DecisionSupportPanel'
import { buildDecisionSupportSummary } from '../../utils/decisionSupportBuilder'
import '../../App.css'

// Sezon süreleri (gün)
const SEASON_DURATIONS = {
  'İlkbahar': 90,
  'Yaz': 120,
  'Sonbahar': 90,
  'Kış': 120
}

// Ürün Mix (sabit)
const PRODUCT_MIX = [
  { name: 'Polo', share: 45 },
  { name: 'Denim', share: 30 },
  { name: 'Knit', share: 25 }
]

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

// Mock geçmiş veri üret (son 3 yıl)
const generateMockHistory = (brand, season) => {
  const years = [2023, 2024, 2025]
  const baseScale = BRAND_SCALE[brand] || 1.0
  const seasonMultiplier = SEASON_MULTIPLIERS[season] || 1.0
  const baseQty = 15000 * baseScale * seasonMultiplier

  return years.map(year => {
    const seed = seededHash(`${brand}-${season}-${year}`)
    const variation = 0.85 + (seededRandom(seed) * 0.3) // 0.85 - 1.15 arası
    const yearTrend = year === 2023 ? 1.0 : year === 2024 ? 1.05 : 1.10
    const qty = Math.round(baseQty * variation * yearTrend)
    return { year, qty }
  })
}

// Tahmin hesapla (3 yıl ortalaması)
const calculateForecast = (history) => {
  if (history.length === 0) return 0
  const sum = history.reduce((acc, item) => acc + item.qty, 0)
  return Math.round(sum / history.length)
}

// Toplam tahmin ve trend hesapla (çoklu marka)
const computeAggregate = (selectedBrands, season) => {
  if (selectedBrands.length === 0) {
    return {
      totalForecast: 0,
      totalTrend: 0,
      perBrand: []
    }
  }

  const perBrand = selectedBrands.map(brand => {
    const history = generateMockHistory(brand, season)
    const forecast = calculateForecast(history)
    const y2023 = history.find(h => h.year === 2023)?.qty || 0
    const y2024 = history.find(h => h.year === 2024)?.qty || 0
    const y2025 = history.find(h => h.year === 2025)?.qty || 0

    return {
      brand,
      forecast,
      y2023,
      y2024,
      y2025
    }
  })

  // Toplam tahmin
  const totalForecast = perBrand.reduce((sum, item) => sum + item.forecast, 0)

  // Toplam trend (2024 ve 2025 toplamları üzerinden)
  const total2024 = perBrand.reduce((sum, item) => sum + item.y2024, 0)
  const total2025 = perBrand.reduce((sum, item) => sum + item.y2025, 0)
  
  let totalTrend = 0
  if (total2024 > 0) {
    totalTrend = ((total2025 - total2024) / total2024) * 100
    totalTrend = Math.round(totalTrend * 10) / 10 // 1 decimal
  }

  return {
    totalForecast,
    totalTrend,
    perBrand
  }
}

function SeasonForecastBuilder() {
  const [selectedBrands, setSelectedBrands] = useState(['Tommy Hilfiger'])
  const [selectedSeason, setSelectedSeason] = useState('Kış')
  const [forecastData, setForecastData] = useState(null)
  const [selectedYear, setSelectedYear] = useState('2025')

  const toggleBrand = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand))
    } else {
      setSelectedBrands([...selectedBrands, brand])
    }
  }

  const removeBrand = (brand) => {
    if (selectedBrands.length > 1) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand))
    }
  }
  const handleGenerate = () => {
    if (selectedBrands.length === 0) {
      return
    }

    const aggregate = computeAggregate(selectedBrands, selectedSeason)
    const seasonDuration = SEASON_DURATIONS[selectedSeason]

    // Yıllık verileri hesapla
    const yearly = generateAggregateYearlyData(selectedBrands, selectedSeason)
    const avg3 = calculate3YearAverage(yearly)
    const comp = calculateComparison(yearly[2025], avg3)

    setForecastData({
      totalForecast: aggregate.totalForecast,
      totalTrend: aggregate.totalTrend,
      seasonDuration,
      perBrand: aggregate.perBrand,
      yearlyData: yearly,
      average3Years: avg3,
      comparison: comp
    })
  }

  // Computed snapshot: seçili yıl/ortalama için analiz verisi
  const computedSnapshot = useMemo(() => {
    if (!forecastData || !forecastData.yearlyData || selectedBrands.length === 0) {
      return null
    }

    // Seçili yıl/ortalama için sipariş miktarı
    const orderQty = selectedYear === 'Ortalama' 
      ? forecastData.average3Years 
      : selectedYear === '2022' 
        ? forecastData.yearlyData[2022] 
        : selectedYear === '2023'
          ? forecastData.yearlyData[2023]
          : selectedYear === '2024'
            ? forecastData.yearlyData[2024]
            : forecastData.yearlyData[2025]

    // Mock kapasite (siparişin %110'u)
    const capacity = Math.round(orderQty * 1.1)

    // Mock hammadde listesi
    const materials = [
      { name: 'Pamuk İpliği', qty: Math.round(orderQty * 0.15), unit: 'kg' },
      { name: 'Polyester İpliği', qty: Math.round(orderQty * 0.12), unit: 'kg' },
      { name: 'Örme Kumaş', qty: Math.round(orderQty * 0.25), unit: 'm' },
      { name: 'Dokuma Kumaş', qty: Math.round(orderQty * 0.18), unit: 'm' },
      { name: 'Reaktif Boya', qty: Math.round(orderQty * 0.08), unit: 'lt' }
    ]

    // Mock maliyet & gelir
    const costPerUnit = 45 // TL/adet
    const pricePerUnit = 75 // TL/adet
    const cost = orderQty * costPerUnit
    const revenue = orderQty * pricePerUnit
    const profit = revenue - cost

    // Kâr marjı hesapla
    const profitMarginPct = revenue > 0 ? (profit / revenue) * 100 : 0

    // Financials objesi
    const financials = {
      revenueTL: revenue,
      costTL: cost,
      profitTL: profit,
      profitMarginPct: Math.round(profitMarginPct * 10) / 10 // 1 decimal
    }

    // Mock risk skoru (0-100)
    const baseRisk = 30
    const capacityGap = capacity - orderQty
    const capacityRisk = capacityGap < 0 ? Math.min(50, Math.abs(capacityGap) / orderQty * 100) : 0
    const riskScore = Math.min(100, Math.round(baseRisk + capacityRisk))
    
    let riskLevel = 'low'
    if (riskScore >= 70) riskLevel = 'high'
    else if (riskScore >= 40) riskLevel = 'medium'

    return {
      orderQty,
      capacity,
      materials,
      cost,
      revenue,
      profit,
      financials,
      riskScore,
      riskLevel
    }
  }, [forecastData, selectedYear, selectedBrands])

  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR').format(value)
  }

  // "Ortalama" seçiliyse buton göster
  const showNextSeasonButton = selectedYear === 'Ortalama'

  // Forecast özeti için panel açık/kapalı state
  const [isForecastNextSeasonOpen, setIsForecastNextSeasonOpen] = useState(false)

  // "Ortalama" değilse paneli kapat
  useEffect(() => {
    if (selectedYear !== 'Ortalama') {
      setIsForecastNextSeasonOpen(false)
    }
  }, [selectedYear])

  // Gelecek sezon analizi handler
  const handleNextSeasonAnalysis = () => {
    if (selectedBrands.length === 0 || !selectedSeason) {
      return
    }
    setIsForecastNextSeasonOpen(v => !v)
  }

  // Forecast özeti için data hazırla
  const forecastSummaryData = useMemo(() => {
    if (!forecastData || !computedSnapshot || selectedYear !== 'Ortalama') {
      return null
    }

    // Marka kırılımı
    const brandBreakdown = forecastData.perBrand?.map(item => {
      const totalQty = computedSnapshot.orderQty
      const percentage = totalQty > 0 
        ? ((item.forecast / totalQty) * 100)
        : 0
      
      return {
        brand: item.brand,
        qty: item.forecast,
        percentage: parseFloat(percentage.toFixed(1))
      }
    }) || []

    return {
      forecastTotal: computedSnapshot.orderQty,
      trendPct: forecastData.totalTrend || 0,
      seasonDays: forecastData.seasonDuration || 0,
      productMix: PRODUCT_MIX,
      brandBreakdown
    }
  }, [forecastData, computedSnapshot, selectedYear])

  return (
    <div className="card">
      <div className="card-header-professional">
        <div>
          <h2 className="card-title">Sezon Tahmini Oluştur</h2>
          <div className="card-subtitle">
            Seçtiğin marka ve sezona göre son 3 yıl mock veriden 6 aylık ortalama tahmin üretir.
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        {/* Marka Seçimi (Chip Listesi) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="forecast-label" style={{ 
            display: 'block', 
            marginBottom: '0.75rem', 
            fontWeight: '500',
            fontSize: '0.9rem'
          }}>
            Marka Seç
          </label>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            marginBottom: '0.75rem'
          }}>
            {CUSTOMERS.map(brand => {
              const isSelected = selectedBrands.includes(brand)
              return (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    fontSize: '0.85rem', 
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {brand}
                </button>
              )
            })}
          </div>

          {/* Seçili Markalar (Chip'ler) */}
          {selectedBrands.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {selectedBrands.map(brand => (
                <span
                  key={brand}
                  className="product-chip"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem 0.75rem'
                  }}
                >
                  {brand}
                  {selectedBrands.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeBrand(brand)
                      }}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        padding: '0', 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'inherit',
                        opacity: 0.7
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '1'}
                      onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Uyarı */}
          {selectedBrands.length === 0 && (
            <div className="alert alert-warning" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>En az 1 marka seç</span>
            </div>
          )}
        </div>

        {/* Sezon Seçimi */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="forecast-label" style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            fontSize: '0.9rem'
          }}>
            Sezon Seç
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="forecast-input-small"
            style={{ width: '100%', padding: '0.75rem', maxWidth: '300px' }}
          >
            <option value="İlkbahar">İlkbahar</option>
            <option value="Yaz">Yaz</option>
            <option value="Sonbahar">Sonbahar</option>
            <option value="Kış">Kış</option>
          </select>
        </div>

        {/* Buton */}
        <button
          onClick={handleGenerate}
          disabled={selectedBrands.length === 0}
          className="btn btn-primary"
          style={{ 
            width: '100%', 
            padding: '0.875rem',
            fontSize: '1rem',
            fontWeight: '600',
            opacity: selectedBrands.length === 0 ? 0.5 : 1,
            cursor: selectedBrands.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Tahmin Oluştur
        </button>

        {/* Yıllara Göre Analiz */}
        {forecastData && selectedBrands.length > 0 && forecastData.yearlyData && (
          <div className="forecast-summary-card forecast-yearly-minimal">
            <h3 className="forecast-summary-title">
              Yıllara Göre Analiz
            </h3>

            {/* Yıl Seçici */}
            <div className="forecast-year-tabs">
              {['2022', '2023', '2024', '2025', 'Ortalama'].map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`forecast-year-tab ${selectedYear === year ? 'active' : ''}`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Özet Satırı */}
            <div className="forecast-yearly-summary-row">
              <div className="forecast-yearly-summary-item">
                <span className="forecast-yearly-summary-label">Sipariş:</span>
                <span className="forecast-yearly-summary-value">
                  {formatNumber(
                    selectedYear === 'Ortalama' 
                      ? forecastData.average3Years 
                      : selectedYear === '2022' 
                        ? forecastData.yearlyData[2022] 
                        : selectedYear === '2023'
                          ? forecastData.yearlyData[2023]
                          : selectedYear === '2024'
                            ? forecastData.yearlyData[2024]
                            : forecastData.yearlyData[2025]
                  )} adet
                </span>
              </div>
              <div className="forecast-yearly-summary-divider">|</div>
              <div className="forecast-yearly-summary-item">
                <span className="forecast-yearly-summary-label">Ürün Mix:</span>
                <span className="forecast-yearly-summary-mix">
                  {PRODUCT_MIX.map((product, idx) => (
                    <span key={product.name}>
                      {product.name} %{product.share}
                      {idx < PRODUCT_MIX.length - 1 && ' · '}
                    </span>
                  ))}
                </span>
              </div>
            </div>

            {/* Karşılaştırma Alanı */}
            <div className="forecast-yearly-comparison">
              <div className="forecast-yearly-comparison-item">
                <span className="forecast-yearly-comparison-year">2022</span>
                <span className="forecast-yearly-comparison-value">{formatNumber(forecastData.yearlyData[2022])}</span>
              </div>
              <div className="forecast-yearly-comparison-item">
                <span className="forecast-yearly-comparison-year">2023</span>
                <span className="forecast-yearly-comparison-value">{formatNumber(forecastData.yearlyData[2023])}</span>
              </div>
              <div className="forecast-yearly-comparison-item">
                <span className="forecast-yearly-comparison-year">2024</span>
                <span className="forecast-yearly-comparison-value">{formatNumber(forecastData.yearlyData[2024])}</span>
              </div>
              <div className="forecast-yearly-comparison-badges">
                <div className="forecast-yearly-badge">
                  <span className="forecast-yearly-badge-label">3Y Ort.:</span>
                  <span className="forecast-yearly-badge-value">{formatNumber(forecastData.average3Years)}</span>
                </div>
                <div className="forecast-yearly-badge current">
                  <span className="forecast-yearly-badge-label">2025:</span>
                  <span className="forecast-yearly-badge-value">{formatNumber(forecastData.yearlyData[2025])}</span>
                </div>
              </div>
            </div>

            {/* Karşılaştırma Metni */}
            <div className="forecast-yearly-comparison-text">
              <span className={forecastData.comparison >= 0 ? 'forecast-comparison-icon positive' : 'forecast-comparison-icon negative'}>
                {forecastData.comparison >= 0 ? '↑' : '↓'}
              </span>
              <span>
                Bu sezon, son 3 yıl ortalamasına göre{' '}
                <span className={forecastData.comparison >= 0 ? 'positive' : 'negative'}>
                  %{Math.abs(forecastData.comparison)}
                </span>
                {' '}{forecastData.comparison >= 0 ? 'daha yüksek' : 'daha düşük'}.
              </span>
            </div>

          </div>
        )}

        {/* Analiz Grafikleri */}
        {forecastData && selectedBrands.length > 0 && (
          <ForecastChartsGrid
            yearKey={selectedYear}
            selectedBrands={selectedBrands}
            season={selectedSeason}
            computedSnapshot={computedSnapshot}
            forecastData={forecastData}
          />
        )}

        {/* Forecast Özeti */}
        {forecastData && selectedBrands.length > 0 && computedSnapshot && (
          <div className="forecast-summary-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
              <h3 className="forecast-summary-title">
                Forecast Özeti ({selectedYear})
              </h3>
              {showNextSeasonButton && (
                <button
                  className="forecast-next-season-btn"
                  onClick={handleNextSeasonAnalysis}
                  disabled={selectedBrands.length === 0 || !selectedSeason}
                  title={selectedBrands.length === 0 || !selectedSeason ? "Analiz için marka ve sezon seçiniz" : "Gelecek sezon analizi yap"}
                >
                  <TrendingUp size={14} />
                  <span>Gelecek Sezon Analizi Yap</span>
                </button>
              )}
            </div>

            <div className="forecast-kpi-grid">
              {/* Tahmin Miktarı */}
              <div className="forecast-kpi-item">
                <div className="forecast-kpi-label">
                  Tahmin Miktarı
                </div>
                <div className="forecast-kpi-value">
                  {formatNumber(computedSnapshot.orderQty)} <span className="forecast-kpi-unit">adet</span>
                </div>
              </div>

              {/* Trend */}
              <div className="forecast-kpi-item">
                <div className="forecast-kpi-label">
                  Trend
                </div>
                <div>
                  <span className={`forecast-trend-badge ${forecastData.totalTrend < 0 ? 'negative' : ''}`}>
                    {forecastData.totalTrend >= 0 ? '+' : ''}{forecastData.totalTrend}%
                  </span>
                </div>
              </div>

              {/* Sezon Süresi */}
              <div className="forecast-kpi-item">
                <div className="forecast-kpi-label">
                  Sezon Süresi
                </div>
                <div className="forecast-kpi-value">
                  {forecastData.seasonDuration} <span className="forecast-kpi-unit">gün</span>
                </div>
              </div>
            </div>

            {/* Ürün Mix */}
            <div className="forecast-product-mix-section">
              <div className="forecast-product-mix-label">
                Ürün Mix
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {PRODUCT_MIX.map(product => (
                  <span
                    key={product.name}
                    className="product-chip"
                    style={{ 
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {product.name} %{product.share}
                  </span>
                ))}
              </div>
            </div>

            {/* Marka Kırılımı */}
            {forecastData.perBrand && forecastData.perBrand.length > 0 && (
              <div className="forecast-brand-breakdown">
                <div className="forecast-brand-breakdown-label">
                  Marka Kırılımı
                </div>
                <div className="forecast-brand-list">
                  {forecastData.perBrand.map((item) => {
                    const totalQty = computedSnapshot.orderQty
                    const percentage = totalQty > 0 
                      ? ((item.forecast / totalQty) * 100).toFixed(1)
                      : 0
                    
                    return (
                      <div key={item.brand} className="forecast-brand-item">
                        <div className="forecast-brand-name">
                          {item.brand}
                        </div>
                        <div className="forecast-brand-details">
                          <div className="forecast-brand-qty">
                            {formatNumber(item.forecast)} adet
                          </div>
                          <div className="forecast-brand-percentage">
                            %{percentage}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Karar Destek Özeti Paneli */}
            {showNextSeasonButton && isForecastNextSeasonOpen && forecastSummaryData && (
              <DecisionSupportPanel
                {...buildDecisionSupportSummary({
                  chartType: 'forecastSummary',
                  data: forecastSummaryData,
                  thresholds: null,
                  selectedBrands,
                  selectedSeason: selectedSeason
                })}
                onClose={handleNextSeasonAnalysis}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SeasonForecastBuilder
