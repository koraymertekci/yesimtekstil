import React, { useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import '../../App.css'

// Threshold değerleri
const THRESHOLD_HIGH = 110
const THRESHOLD_MEDIUM = 105

function SeasonProductionLoadChart({ season, yearKey, forecastTotal, selectedBrands, onDataReady }) {
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

  // Aylık dağılım ve index hesaplama
  const chartData = useMemo(() => {
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

    // Aylık üretim miktarları
    const monthlyProduction = months.map((month, index) => {
      const share = shares[index]
      const qty = Math.round(forecastTotal * share)
      return { month, qty }
    })

    // İlk ay üretimi (base = 100)
    const firstMonthQty = monthlyProduction[0]?.qty || 1

    // Index hesaplama ve önceki aya göre değişim
    return monthlyProduction.map((item, index) => {
      const indexValue = index === 0 ? 100 : (item.qty / firstMonthQty) * 100
      const prevIndex = index > 0 ? monthlyProduction[index - 1] : null
      const prevIndexValue = prevIndex ? (index === 1 ? 100 : (prevIndex.qty / firstMonthQty) * 100) : null
      const changeFromPrev = prevIndexValue !== null ? ((indexValue - prevIndexValue) / prevIndexValue) * 100 : 0
      
      // Threshold rengi
      let thresholdColor = '#28a745' // Normal (yeşil)
      if (indexValue >= THRESHOLD_HIGH) {
        thresholdColor = '#dc3545' // Kırmızı uyarı
      } else if (indexValue >= THRESHOLD_MEDIUM) {
        thresholdColor = '#ff9800' // Turuncu
      }
      
      return {
        month: item.month,
        qty: item.qty,
        index: Math.round(indexValue * 10) / 10, // 1 decimal
        changeFromPrev: Math.round(changeFromPrev * 10) / 10,
        thresholdColor
      }
    })
  }, [season, yearKey, forecastTotal, selectedBrands])

  // Parent'a data gönder
  useEffect(() => {
    if (onDataReady && chartData.length > 0) {
      onDataReady(chartData)
    }
  }, [chartData, onDataReady])

  // Y ekseni domain hesaplama (dar aralık)
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [95, 120]
    const indices = chartData.map(d => d.index)
    const minIndex = Math.min(...indices)
    const maxIndex = Math.max(...indices)
    // Dar aralık: min-5 ile max+5 arası, ama en az 95-120
    const domainMin = Math.max(90, Math.min(95, minIndex - 5))
    const domainMax = Math.min(125, Math.max(120, maxIndex + 5))
    return [domainMin, domainMax]
  }, [chartData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="forecast-chart-tooltip">
          <div className="forecast-chart-tooltip-title">{data.month}</div>
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">Gerçek Üretim:</span>
            <span className="forecast-chart-tooltip-value">
              {formatNumber(data.qty)} adet
            </span>
          </div>
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">Endeks:</span>
            <span className="forecast-chart-tooltip-value" style={{ color: data.thresholdColor }}>
              {data.index.toFixed(1)}
            </span>
          </div>
          {data.changeFromPrev !== 0 && (
            <div className="forecast-chart-tooltip-item">
              <span className="forecast-chart-tooltip-label">Değişim (%):</span>
              <span className={`forecast-chart-tooltip-value ${data.changeFromPrev >= 0 ? '' : 'negative'}`}>
                {data.changeFromPrev >= 0 ? '+' : ''}{data.changeFromPrev.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Custom dot component (büyük noktalar)
  const CustomDot = (props) => {
    const { cx, cy, payload } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={payload.thresholdColor}
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="forecast-chart-placeholder">
        <div className="forecast-chart-placeholder-text">
          Sezon verisi bulunamadı
        </div>
      </div>
    )
  }

  return (
    <div className="forecast-seasonal-load-index-chart">
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            key={`load-index-${yearKey}-${season}-${forecastTotal}`}
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} stroke="#cbd5e1" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              className="chart-axis"
              label={{ value: 'Ay', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '0.75rem' } }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toFixed(0)}
              className="chart-axis"
              domain={yAxisDomain}
              label={{ value: 'Üretim Yük Endeksi', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '0.75rem' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Threshold çizgileri - solid, label yok */}
            <ReferenceLine 
              y={THRESHOLD_HIGH} 
              stroke="#dc3545" 
              strokeWidth={1.5}
            />
            <ReferenceLine 
              y={THRESHOLD_MEDIUM} 
              stroke="#ff9800" 
              strokeWidth={1.5}
            />
            {/* Base line (100) */}
            <ReferenceLine 
              y={100} 
              stroke="#6c757d" 
              strokeWidth={1}
            />
            {/* Line chart */}
            <Line
              type="linear"
              dataKey="index"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 8 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend */}
      <div className="forecast-chart-legend">
        {/* Üretim Yük Endeksi */}
        <div className="forecast-chart-legend-item">
          <div className="forecast-chart-legend-swatch thick" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Üretim Yük Endeksi</span>
        </div>
        
        {/* Baz (100) */}
        <div className="forecast-chart-legend-item">
          <div className="forecast-chart-legend-swatch" style={{ backgroundColor: '#6c757d' }}></div>
          <span>Baz (100)</span>
        </div>
        
        {/* Uyarı Eşiği */}
        <div className="forecast-chart-legend-item">
          <div className="forecast-chart-legend-swatch" style={{ backgroundColor: '#ff9800' }}></div>
          <span>Uyarı Eşiği</span>
        </div>
        
        {/* Kritik Eşik */}
        <div className="forecast-chart-legend-item">
          <div className="forecast-chart-legend-swatch" style={{ backgroundColor: '#dc3545' }}></div>
          <span>Kritik Eşik</span>
        </div>
      </div>
    </div>
  )
}

export default SeasonProductionLoadChart
