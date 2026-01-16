import React, { useMemo, useState } from 'react'
import '../../App.css'

// Target marker config
const TARGET_PERCENTAGE = 80

// Risk band ranges
const RISK_BANDS = [
  { min: 0, max: 70, color: '#28a745', label: 'Güvenli' },
  { min: 70, max: 85, color: '#ffc107', label: 'Uyarı' },
  { min: 85, max: 100, color: '#dc3545', label: 'Kritik' },
  { min: 100, max: 120, color: '#8b0000', label: 'Aşım' }
]

function SeasonRiskTimelineChart({ season, yearKey, forecastTotal, selectedBrands }) {
  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Sezon-ay eşleşmesi
  const seasonMonths = {
    'Kış': ['Aralık', 'Ocak', 'Şubat'],
    'İlkbahar': ['Mart', 'Nisan', 'Mayıs'],
    'Yaz': ['Haziran', 'Temmuz', 'Ağustos'],
    'Sonbahar': ['Eylül', 'Ekim', 'Kasım']
  }

  // Aylık dağılım ve risk hesaplama
  const bulletData = useMemo(() => {
    const months = seasonMonths[season] || []
    if (months.length === 0 || !forecastTotal || forecastTotal <= 0) {
      return []
    }

    // 3 ay için dağılım: %30, %35, %35 (hafif dalgalı)
    const distributions = {
      3: [0.30, 0.35, 0.35]
    }

    const dist = distributions[months.length] || months.map(() => 1 / months.length)
    
    // Hafif rastgele varyasyon ekle (±5%)
    const seededVariation = (index) => {
      const seed = (season.charCodeAt(0) + index + (yearKey?.charCodeAt(0) || 0)) * 17
      const variation = (Math.sin(seed) * 0.05) // ±5% varyasyon
      return 1 + variation
    }

    // Toplam share'i hesapla (varyasyonlu)
    const shares = months.map((month, index) => {
      const baseShare = dist[index]
      const variation = seededVariation(index)
      return baseShare * variation
    })
    const totalShare = shares.reduce((a, b) => a + b, 0)

    // Toplam kapasite (sezonluk)
    const totalCapacity = Math.round(forecastTotal * 1.1) // %110 kapasite
    const monthlyCapacity = Math.round(totalCapacity / months.length)

    return months.map((month, index) => {
      const share = shares[index]
      const monthlyOrder = Math.round(forecastTotal * share)
      const capacityUsage = monthlyCapacity > 0 ? (monthlyOrder / monthlyCapacity) * 100 : 0
      const usagePct = Math.round(capacityUsage * 10) / 10 // 1 decimal
      
      // Risk seviyesi belirleme
      let riskLevel = 'Güvenli'
      let riskColor = '#28a745'
      if (usagePct >= 100) {
        riskLevel = 'Aşım'
        riskColor = '#8b0000'
      } else if (usagePct >= 85) {
        riskLevel = 'Kritik'
        riskColor = '#dc3545'
      } else if (usagePct >= 70) {
        riskLevel = 'Uyarı'
        riskColor = '#ffc107'
      }
      
      // Target farkı
      const targetDiff = usagePct - TARGET_PERCENTAGE
      
      return {
        month,
        orderQty: monthlyOrder,
        capacity: monthlyCapacity,
        usagePct,
        riskLevel,
        riskColor,
        targetDiff
      }
    })
  }, [season, yearKey, forecastTotal, selectedBrands])

  // Bullet Chart Row Component
  const BulletRow = ({ data, index, onHover }) => {
    const { month, usagePct, riskLevel, riskColor, orderQty, capacity, targetDiff } = data
    const maxValue = 120
    const barWidth = 400 // Fixed width for absolute scale
    const barHeight = 32
    
    // Calculate positions (0-120 scale)
    const getPosition = (value) => (value / maxValue) * barWidth
    
    return (
      <div 
        className="forecast-bullet-row" 
        style={{ marginBottom: '0.75rem' }}
        onMouseEnter={() => onHover && onHover(data)}
        onMouseLeave={() => onHover && onHover(null)}
      >
        <div className="forecast-bullet-row-header">
          <div className="forecast-bullet-month-label">{month}</div>
          <div 
            className="forecast-bullet-risk-badge" 
            style={{ 
              backgroundColor: riskColor === '#28a745' ? 'rgba(40, 167, 69, 0.1)' : 
                             riskColor === '#ffc107' ? 'rgba(255, 193, 7, 0.1)' : 
                             riskColor === '#dc3545' ? 'rgba(220, 53, 69, 0.1)' : 
                             'rgba(139, 0, 0, 0.1)',
              color: riskColor,
              borderColor: riskColor
            }}
          >
            {riskLevel}
          </div>
        </div>
        
        <div className="forecast-bullet-chart-container" style={{ position: 'relative', width: barWidth, height: barHeight }}>
          {/* Arka plan risk bantları */}
          {RISK_BANDS.map((band, bandIndex) => {
            const x1 = getPosition(band.min)
            const x2 = getPosition(band.max)
            const width = x2 - x1
            return (
              <div
                key={`band-${bandIndex}`}
                className="forecast-bullet-band"
                style={{
                  position: 'absolute',
                  left: x1,
                  width: width,
                  height: barHeight,
                  backgroundColor: band.color,
                  opacity: 0.2,
                  zIndex: 1
                }}
              />
            )
          })}
          
          {/* Measure bar */}
          <div
            className="forecast-bullet-measure"
            style={{
              position: 'absolute',
              left: 0,
              width: getPosition(Math.min(usagePct, maxValue)),
              height: barHeight * 0.6,
              top: barHeight * 0.2,
              backgroundColor: riskColor,
              zIndex: 3,
              borderRadius: '2px'
            }}
          />
          
          {/* Target marker line */}
          <div
            className="forecast-bullet-target"
            style={{
              position: 'absolute',
              left: getPosition(TARGET_PERCENTAGE),
              width: 2,
              height: barHeight,
              backgroundColor: '#6c757d',
              zIndex: 4,
              borderLeft: '1px dashed #6c757d'
            }}
          />
          
          {/* Target label */}
          <div
            className="forecast-bullet-target-label"
            style={{
              position: 'absolute',
              left: getPosition(TARGET_PERCENTAGE) + 4,
              top: -16,
              fontSize: '0.65rem',
              color: '#6c757d',
              fontWeight: 500
            }}
          >
            Hedef %{TARGET_PERCENTAGE}
          </div>
        </div>
        
        {/* Usage percentage (sağda) */}
        <div 
          className="forecast-bullet-usage-value"
          style={{ 
            color: riskColor,
            fontWeight: 700,
            fontSize: '1.1rem'
          }}
        >
          %{usagePct.toFixed(1)}
        </div>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ data }) => {
    if (!data) return null
    const { month, orderQty, capacity, usagePct, riskLevel, riskColor, targetDiff } = data
    return (
      <div className="forecast-chart-tooltip">
        <div className="forecast-chart-tooltip-title">{month}</div>
        <div className="forecast-chart-tooltip-item">
          <span className="forecast-chart-tooltip-label">Sipariş:</span>
          <span className="forecast-chart-tooltip-value">
            {formatNumber(orderQty)} adet
          </span>
        </div>
        <div className="forecast-chart-tooltip-item">
          <span className="forecast-chart-tooltip-label">Kapasite:</span>
          <span className="forecast-chart-tooltip-value">
            {formatNumber(capacity)} adet
          </span>
        </div>
        <div className="forecast-chart-tooltip-item">
          <span className="forecast-chart-tooltip-label">Kullanım:</span>
          <span className="forecast-chart-tooltip-value" style={{ color: riskColor }}>
            %{usagePct.toFixed(1)}
          </span>
        </div>
        <div className="forecast-chart-tooltip-item">
          <span className="forecast-chart-tooltip-label">Band Durumu:</span>
          <span className="forecast-chart-tooltip-value" style={{ color: riskColor }}>
            {riskLevel}
          </span>
        </div>
        <div className="forecast-chart-tooltip-item">
          <span className="forecast-chart-tooltip-label">Hedef Farkı:</span>
          <span className={`forecast-chart-tooltip-value ${targetDiff >= 0 ? 'negative' : ''}`}>
            {targetDiff >= 0 ? '+' : ''}{targetDiff.toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }

  // Custom Legend
  const CustomLegend = () => {
    return (
      <div className="forecast-bullet-legend">
        {RISK_BANDS.map((band, index) => (
          <div key={`legend-${index}`} className="forecast-bullet-legend-item">
            <div 
              className="forecast-bullet-legend-color" 
              style={{ backgroundColor: band.color }}
            ></div>
            <span className="forecast-bullet-legend-label">
              {band.label} ({band.min}-{band.max}%)
            </span>
          </div>
        ))}
      </div>
    )
  }

  const [hoveredData, setHoveredData] = useState(null)

  if (bulletData.length === 0) {
    return (
      <div className="forecast-chart-placeholder">
        <div className="forecast-chart-placeholder-text">
          Sezon verisi bulunamadı
        </div>
      </div>
    )
  }

  // En yüksek risk seviyesini bul (kart başlığı için)
  const highestRisk = bulletData.reduce((max, item) => {
    const riskOrder = { 'Aşım': 4, 'Kritik': 3, 'Uyarı': 2, 'Güvenli': 1 }
    return riskOrder[item.riskLevel] > riskOrder[max.riskLevel] ? item : max
  }, bulletData[0])

  return (
    <div className="forecast-bullet-chart">
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
        {/* Bullet Rows */}
        <div style={{ flex: 1 }}>
          {bulletData.map((data, index) => (
            <BulletRow 
              key={`bullet-${index}`}
              data={data} 
              index={index}
              onHover={setHoveredData}
            />
          ))}
        </div>
        
        {/* Legend - Sağda */}
        <div style={{ minWidth: '180px' }}>
          <CustomLegend />
        </div>
        
        {/* Tooltip - Hover durumunda göster */}
        {hoveredData && (
          <div 
            className="forecast-bullet-tooltip"
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <CustomTooltip data={hoveredData} />
          </div>
        )}
      </div>
    </div>
  )
}

export default SeasonRiskTimelineChart
