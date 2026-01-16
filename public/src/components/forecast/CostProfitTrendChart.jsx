import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts'
import '../../App.css'

function CostProfitTrendChart({ financials, season, yearKey, selectedBrands }) {
  const [selectedMetric, setSelectedMetric] = useState('profit') // 'revenue' | 'cost' | 'profit'

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

  // Güvenli parse ve fallback değerler
  const revenue = Number(financials?.revenueTL ?? 0)
  const cost = Number(financials?.costTL ?? 0)
  const profit = Number.isFinite(Number(financials?.profitTL)) 
    ? Number(financials.profitTL) 
    : revenue - cost

  const safeRevenue = Number.isFinite(revenue) && revenue >= 0 ? revenue : 0
  const safeCost = Number.isFinite(cost) && cost >= 0 ? cost : 0
  const safeProfit = Number.isFinite(profit) ? profit : safeRevenue - safeCost

  // Aylık dağılım hesaplama (3 aya böl, ±%6 varyasyon)
  const chartData = useMemo(() => {
    const months = seasonMonths[season] || []
    if (months.length === 0) {
      return []
    }

    // Seçili metriğe göre toplam değer
    const totalValue = selectedMetric === 'revenue' 
      ? safeRevenue 
      : selectedMetric === 'cost' 
        ? safeCost 
        : safeProfit

    if (totalValue === 0) {
      return months.map(month => ({ month, value: 0 }))
    }

    // 3 ay için dağılım: %30, %35, %35 (hafif dalgalı)
    const distributions = {
      3: [0.30, 0.35, 0.35]
    }

    const dist = distributions[months.length] || months.map(() => 1 / months.length)
    
    // Hafif rastgele varyasyon ekle (±6%)
    const seededVariation = (index) => {
      const seed = (season.charCodeAt(0) + index + (yearKey?.charCodeAt(0) || 0) + selectedMetric.charCodeAt(0)) * 17
      const variation = (Math.sin(seed) * 0.06) // ±6% varyasyon
      return 1 + variation
    }

    // Toplam share'i hesapla (varyasyonlu)
    const shares = months.map((month, index) => {
      const baseShare = dist[index]
      const variation = seededVariation(index)
      return baseShare * variation
    })
    const totalShare = shares.reduce((a, b) => a + b, 0)

    return months.map((month, index) => {
      const share = shares[index]
      const monthlyValue = Math.round(totalValue * (share / totalShare))
      return {
        month,
        value: monthlyValue
      }
    })
  }, [season, yearKey, selectedBrands, selectedMetric, safeRevenue, safeCost, safeProfit])

  // Y ekseni domain hesaplama
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 1000]
    const values = chartData.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const padding = maxValue * 0.1 // %10 padding
    return [Math.max(0, minValue - padding), maxValue + padding]
  }, [chartData])

  // Metrik renkleri
  const metricColors = {
    revenue: '#28a745',
    cost: '#dc3545',
    profit: safeProfit >= 0 ? '#3b82f6' : '#f59e0b'
  }

  // Metrik isimleri
  const metricNames = {
    revenue: 'Gelir',
    cost: 'Maliyet',
    profit: 'Kâr'
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="forecast-chart-tooltip">
          <div className="forecast-chart-tooltip-title">{data.month}</div>
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">{metricNames[selectedMetric]}:</span>
            <span className="forecast-chart-tooltip-value">
              {formatNumber(data.value)} TL
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom dot
  const CustomDot = (props) => {
    const { cx, cy } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={metricColors[selectedMetric]}
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
    <div className="forecast-cost-profit-trend-chart">
      {/* Toggle: Gelir | Maliyet | Kâr */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {['revenue', 'cost', 'profit'].map(metric => {
          const isActive = selectedMetric === metric
          return (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className="forecast-metric-toggle"
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${isActive ? metricColors[metric] : '#e5e7eb'}`,
                borderRadius: '6px',
                background: isActive ? metricColors[metric] : 'transparent',
                color: isActive ? '#fff' : '#666',
                fontSize: '0.875rem',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 2px 4px rgba(0, 0, 0, 0.1)` : 'none'
              }}
            >
              {metricNames[metric]}
            </button>
          )
        })}
      </div>

      {/* Grafik başlığı */}
      <div className="forecast-trend-chart-subtitle" style={{
        fontSize: '0.75rem',
        textAlign: 'center',
        marginBottom: '0.5rem'
      }}>
        Aylık Trend (Sezon İçi)
      </div>

      {/* Line Chart */}
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            key={`trend-${yearKey}-${season}-${selectedMetric}-${selectedBrands.join(',')}`}
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="2 2" 
              strokeOpacity={0.25} 
              stroke="#cbd5e1"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              className="chart-axis"
              label={{ value: 'Ay', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '0.75rem' } }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatNumber(value)}
              className="chart-axis"
              domain={yAxisDomain}
              label={{ value: 'TL', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '0.75rem' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="linear"
              dataKey="value"
              stroke={metricColors[selectedMetric]}
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: metricColors[selectedMetric] }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CostProfitTrendChart

