import React, { useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import '../../App.css'

function SeasonProductionLoadBarChart({ season, yearKey, forecastTotal, selectedBrands, onDataReady }) {
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

  // Aylık dağılım hesapla (hafif dalgalı)
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

    return months.map((month, index) => {
      const share = shares[index]
      const qty = Math.round(forecastTotal * share)
      const percentage = ((share / totalShare) * 100).toFixed(1)
      
      return {
        month,
        qty,
        percentage: parseFloat(percentage)
      }
    })
  }, [season, yearKey, forecastTotal, selectedBrands])

  // Parent'a data gönder
  useEffect(() => {
    if (onDataReady && chartData.length > 0) {
      onDataReady(chartData)
    }
  }, [chartData, onDataReady])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="forecast-chart-tooltip">
          <div className="forecast-chart-tooltip-title">{data.month}</div>
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">Üretim:</span>
            <span className="forecast-chart-tooltip-value">
              {formatNumber(data.qty)} adet
            </span>
          </div>
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">Pay:</span>
            <span className="forecast-chart-tooltip-value">
              %{data.percentage}
            </span>
          </div>
        </div>
      )
    }
    return null
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

  // Y ekseni için max değer
  const maxQty = Math.max(...chartData.map(d => d.qty))
  const yAxisDomain = [0, maxQty * 1.15]

  return (
    <div className="forecast-season-production-chart">
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={`production-bar-${yearKey}-${season}-${forecastTotal}`}
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              className="chart-axis"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatNumber(value)}
              className="chart-axis"
              domain={yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="qty"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              minPointSize={2}
              barSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 1 ? '#60a5fa' : index === 2 ? '#93c5fd' : '#3b82f6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default SeasonProductionLoadBarChart

