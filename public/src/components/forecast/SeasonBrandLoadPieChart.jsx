import React, { useMemo, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { generateYearlyData } from '../../data/mockSeasonHistory'
import '../../App.css'

function SeasonBrandLoadPieChart({ selectedBrands, season, yearKey, forecastData, onDataReady }) {
  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Marka bazlı yük hesaplama
  const chartData = useMemo(() => {
    if (!selectedBrands || selectedBrands.length === 0) {
      return []
    }

    if (!forecastData || !forecastData.yearlyData) {
      return []
    }

    // Her marka için seçili yıl/ortalama değerini hesapla
    const brandLoads = selectedBrands.map(brand => {
      // Marka bazlı yıllık veri
      const yearlyData = generateYearlyData(brand, season)
      
      // Seçili yıl/ortalama için değer
      let brandValue = 0
      if (yearKey === 'Ortalama') {
        // 3 yıl ortalaması (2022-2024)
        const avg2022 = yearlyData.find(d => d.year === 2022)?.qty || 0
        const avg2023 = yearlyData.find(d => d.year === 2023)?.qty || 0
        const avg2024 = yearlyData.find(d => d.year === 2024)?.qty || 0
        brandValue = Math.round((avg2022 + avg2023 + avg2024) / 3)
      } else {
        const year = parseInt(yearKey)
        brandValue = yearlyData.find(d => d.year === year)?.qty || 0
      }

      return {
        name: brand,
        value: brandValue
      }
    })

    // Sadece değeri > 0 olanları filtrele
    const validData = brandLoads.filter(item => item.value > 0)

    // Toplam hesapla
    const total = validData.reduce((sum, item) => sum + item.value, 0)

    // Yüzde hesapla
    return validData.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
    }))
  }, [selectedBrands, season, yearKey, forecastData])

  // Parent'a data gönder (brand formatında)
  useEffect(() => {
    if (onDataReady && chartData.length > 0) {
      const brandData = chartData.map(d => ({
        brand: d.name,
        value: d.value,
        percentage: d.percentage
      }))
      onDataReady(brandData)
    }
  }, [chartData, onDataReady])

  // Toplam yük
  const totalLoad = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0)
  }, [chartData])

  // En büyük dilim (vurgu için)
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 0
    return Math.max(...chartData.map(d => d.value))
  }, [chartData])

  // Renk paleti
  const COLORS = [
    '#3b82f6', // Mavi
    '#28a745', // Yeşil
    '#ffc107', // Sarı
    '#dc3545', // Kırmızı
    '#6f42c1', // Mor
    '#fd7e14', // Turuncu
    '#20c997', // Turkuaz
    '#e83e8c', // Pembe
    '#17a2b8', // Cyan
    '#6610f2', // İndigo
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="forecast-chart-tooltip">
          <div className="forecast-chart-tooltip-title">{data.name}</div>
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">Yük:</span>
            <span className="forecast-chart-tooltip-value">
              {formatNumber(data.value)} adet
            </span>
          </div>
          <div className="forecast-chart-tooltip-item">
            <span className="forecast-chart-tooltip-label">Pay:</span>
            <span className="forecast-chart-tooltip-value">
              %{data.payload.percentage}
            </span>
          </div>
        </div>
      )
    }
    return null
  }


  // Empty state
  if (selectedBrands.length === 0) {
    return (
      <div className="forecast-chart-placeholder">
        <div className="forecast-chart-placeholder-text">
          Grafiği görmek için en az 1 marka seç.
        </div>
      </div>
    )
  }

  if (chartData.length === 0 || totalLoad === 0) {
    return (
      <div className="forecast-chart-placeholder">
        <div className="forecast-chart-placeholder-text">
          Seçili filtrelerde veri bulunamadı.
        </div>
      </div>
    )
  }

  return (
    <div className="forecast-brand-load-pie-chart">
      {/* Donut Chart */}
      <div style={{ width: '100%', height: 280, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={90}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const isMax = entry.value === maxValue
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={isMax ? '#fff' : 'none'}
                    strokeWidth={isMax ? 2 : 0}
                  />
                )
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Ortada Toplam */}
        <div className="forecast-pie-center-label" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div className="forecast-pie-center-value" style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '0.25rem'
          }}>
            {formatNumber(totalLoad)}
          </div>
          <div className="forecast-pie-center-label-text" style={{
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            Toplam Yük
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="forecast-pie-legend">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className="forecast-pie-legend-item"
          >
            <div
              className="forecast-pie-legend-dot"
              style={{
                backgroundColor: COLORS[index % COLORS.length]
              }}
            ></div>
            <span className="forecast-pie-legend-name">
              {item.name}
            </span>
            <span className="forecast-pie-legend-percentage">
              %{item.percentage}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SeasonBrandLoadPieChart

