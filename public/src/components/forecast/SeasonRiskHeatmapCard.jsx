import React, { useMemo, useState } from 'react'
import '../../App.css'

// Risk eşikleri (keskin geçişler)
const RISK_THRESHOLDS = {
  SAFE: { min: 0, max: 69, color: '#28a745', label: 'Güvenli' },
  WARNING: { min: 70, max: 84, color: '#ffc107', label: 'Uyarı' },
  CRITICAL: { min: 85, max: 99, color: '#dc3545', label: 'Kritik' },
  EXCEEDED: { min: 100, max: 120, color: '#8b0000', label: 'Aşım' }
}

function SeasonRiskHeatmapCard({ season, yearKey, forecastTotal, selectedBrands }) {
  const [hoveredCell, setHoveredCell] = useState(null)

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

  // Risk kategorisi belirleme (keskin eşikler)
  const getRiskCategory = (usage) => {
    const clampedUsage = Math.max(0, Math.min(120, usage))
    if (clampedUsage >= 100) return RISK_THRESHOLDS.EXCEEDED
    if (clampedUsage >= 85) return RISK_THRESHOLDS.CRITICAL
    if (clampedUsage >= 70) return RISK_THRESHOLDS.WARNING
    return RISK_THRESHOLDS.SAFE
  }

  // Aylık veri hesaplama
  const heatmapData = useMemo(() => {
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

    // Önce tüm ayların verilerini hesapla
    const monthlyData = months.map((month, index) => {
      const share = shares[index]
      const monthlyOrder = Math.round(forecastTotal * share)
      const capacityUsage = monthlyCapacity > 0 ? (monthlyOrder / monthlyCapacity) * 100 : 0
      const usagePct = Math.max(0, Math.min(120, Math.round(capacityUsage * 10) / 10)) // Clamp 0-120
      
      return {
        month,
        orderQty: monthlyOrder,
        capacity: monthlyCapacity,
        usagePct
      }
    })

    // Şimdi önceki aya göre değişimi hesapla
    return monthlyData.map((item, index) => {
      // Risk kategorisi
      const riskCategory = getRiskCategory(item.usagePct)
      
      // Önceki aya göre değişim
      const prevData = index > 0 ? monthlyData[index - 1] : null
      const changeFromPrev = prevData ? item.usagePct - prevData.usagePct : 0
      
      return {
        ...item,
        riskCategory,
        changeFromPrev: Math.round(changeFromPrev * 10) / 10
      }
    })
  }, [season, yearKey, forecastTotal, selectedBrands])

  // Risk Hücresi Component
  const RiskCell = ({ data, index }) => {
    const { month, orderQty, capacity, usagePct, riskCategory, changeFromPrev } = data
    const isHovered = hoveredCell === index

    return (
      <div
        className="forecast-heatmap-cell"
        style={{
          backgroundColor: riskCategory.color,
          opacity: isHovered ? 0.9 : 0.85,
          border: `2px solid ${isHovered ? '#fff' : riskCategory.color}`,
          boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={() => setHoveredCell(index)}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Ay adı (üst) */}
        <div className="forecast-heatmap-cell-month">{month}</div>
        
        {/* Risk % (büyük, ortada) */}
        <div 
          className="forecast-heatmap-cell-usage"
          style={{ color: '#fff', fontWeight: 700 }}
        >
          %{usagePct.toFixed(1)}
        </div>
        
        {/* Önceki aya göre değişim (sağ üst) */}
        {changeFromPrev !== 0 && (
          <div 
            className="forecast-heatmap-cell-change"
            style={{
              color: changeFromPrev >= 0 ? '#fff' : '#fff',
              backgroundColor: changeFromPrev >= 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.3)'
            }}
          >
            {changeFromPrev >= 0 ? '↑' : '↓'} {Math.abs(changeFromPrev).toFixed(1)}%
          </div>
        )}
        
        {/* Sipariş ve Kapasite (alt) */}
        <div className="forecast-heatmap-cell-details">
          <div className="forecast-heatmap-cell-detail-item">
            <span className="forecast-heatmap-cell-detail-label">Sipariş:</span>
            <span className="forecast-heatmap-cell-detail-value">{formatNumber(orderQty)}</span>
          </div>
          <div className="forecast-heatmap-cell-detail-item">
            <span className="forecast-heatmap-cell-detail-label">Kapasite:</span>
            <span className="forecast-heatmap-cell-detail-value">{formatNumber(capacity)}</span>
          </div>
        </div>
      </div>
    )
  }

  // Custom Tooltip
  const CustomTooltip = ({ data }) => {
    if (!data) return null
    const { month, orderQty, capacity, usagePct, riskCategory, changeFromPrev } = data
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
          <span className="forecast-chart-tooltip-value" style={{ color: riskCategory.color }}>
            %{usagePct.toFixed(1)}
          </span>
        </div>
        <div className="forecast-chart-tooltip-item">
          <span className="forecast-chart-tooltip-label">Risk Kategorisi:</span>
          <span className="forecast-chart-tooltip-value" style={{ color: riskCategory.color }}>
            {riskCategory.label}
          </span>
        </div>
        {changeFromPrev !== 0 && (
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">Önceki Aya Göre:</span>
            <span className={`forecast-chart-tooltip-value ${changeFromPrev >= 0 ? '' : 'negative'}`}>
              {changeFromPrev >= 0 ? '+' : ''}{changeFromPrev.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    )
  }

  if (heatmapData.length === 0) {
    return (
      <div className="forecast-chart-placeholder">
        <div className="forecast-chart-placeholder-text">
          Sezon verisi bulunamadı
        </div>
      </div>
    )
  }

  return (
    <div className="forecast-risk-heatmap-container">
      <div className="forecast-heatmap-grid">
        {heatmapData.map((data, index) => (
          <div key={`cell-${index}`} style={{ position: 'relative' }}>
            <RiskCell data={data} index={index} />
            {hoveredCell === index && (
              <div 
                className="forecast-heatmap-tooltip-wrapper"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000,
                  pointerEvents: 'none'
                }}
              >
                <CustomTooltip data={data} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SeasonRiskHeatmapCard

