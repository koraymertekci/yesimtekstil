import React, { useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts'
import '../../App.css'

function SeasonBrandProfitBarChart({ selectedBrands, season, yearKey, computedSnapshot, onDataReady }) {
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

  // Aylık dağılım (sezona göre)
  const monthlyDistributions = {
    'Kış': [0.30, 0.40, 0.30],
    'İlkbahar': [0.25, 0.35, 0.40],
    'Yaz': [0.40, 0.35, 0.25],
    'Sonbahar': [0.33, 0.34, 0.33]
  }

  // Grafik verisi hesaplama
  const chartData = useMemo(() => {
    if (!computedSnapshot || !selectedBrands || selectedBrands.length === 0) {
      return []
    }

    const months = seasonMonths[season] || []
    if (months.length === 0) {
      return []
    }

    // Toplam gelir, maliyet, kâr
    const totalRevenue = computedSnapshot.financials?.revenueTL || computedSnapshot.revenue || 0
    const totalCost = computedSnapshot.financials?.costTL || computedSnapshot.cost || 0
    const totalProfit = computedSnapshot.financials?.profitTL || computedSnapshot.profit || 0

    if (totalRevenue === 0 && totalCost === 0) {
      return []
    }

    // Aylık dağılım
    const distribution = monthlyDistributions[season] || [0.33, 0.34, 0.33]

    // Her ay için değerleri hesapla
    return months.map((month, index) => {
      const share = distribution[index]
      const monthlyRevenue = Math.round(totalRevenue * share)
      const monthlyCost = Math.round(totalCost * share)
      const monthlyProfit = monthlyRevenue - monthlyCost

      return {
        month,
        Gelir: monthlyRevenue,
        Maliyet: monthlyCost,
        Kâr: monthlyProfit
      }
    })
  }, [computedSnapshot, selectedBrands, season, yearKey])

  // Parent'a data gönder
  useEffect(() => {
    if (onDataReady && chartData.length > 0) {
      onDataReady(chartData)
    }
  }, [chartData, onDataReady])

  // Hedef kâr eşiği (sezon ortalama kârının %10 üstü)
  const targetProfitThreshold = useMemo(() => {
    if (chartData.length === 0) return 0
    const avgProfit = chartData.reduce((sum, item) => sum + item.Kâr, 0) / chartData.length
    return Math.round(avgProfit * 1.1)
  }, [chartData])

  // Toplam değerler
  const totals = useMemo(() => {
    if (chartData.length === 0) {
      return { revenue: 0, cost: 0, profit: 0 }
    }
    return {
      revenue: chartData.reduce((sum, item) => sum + item.Gelir, 0),
      cost: chartData.reduce((sum, item) => sum + item.Maliyet, 0),
      profit: chartData.reduce((sum, item) => sum + item.Kâr, 0)
    }
  }, [chartData])

  // Kârlılık oranı
  const profitabilityRate = totals.revenue > 0 
    ? ((totals.profit / totals.revenue) * 100).toFixed(1)
    : '0.0'

  // En yüksek ve en düşük kâr ayları
  const profitAnalysis = useMemo(() => {
    if (chartData.length === 0) {
      return { maxMonth: '-', minMonth: '-' }
    }
    const sortedByProfit = [...chartData].sort((a, b) => b.Kâr - a.Kâr)
    return {
      maxMonth: sortedByProfit[0]?.month || '-',
      minMonth: sortedByProfit[sortedByProfit.length - 1]?.month || '-'
    }
  }, [chartData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="forecast-chart-tooltip">
          <div className="forecast-chart-tooltip-title">{payload[0].payload.month}</div>
          {payload.map((entry, index) => {
            const isNegative = entry.dataKey === 'Kâr' && entry.value < 0
            const displayName = entry.dataKey === 'Gelir' ? 'Gelir' : entry.dataKey === 'Maliyet' ? 'Maliyet' : 'Kâr'
            return (
              <div key={index} className="forecast-chart-tooltip-item">
                <span
                  className="forecast-chart-tooltip-label"
                  style={{ color: entry.color }}
                >
                  {displayName}:
                </span>
                <span
                  className={`forecast-chart-tooltip-value ${isNegative ? 'negative' : ''}`}
                >
                  {formatNumber(Math.abs(entry.value))} TL
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  // Empty state
  if (!computedSnapshot || selectedBrands.length === 0) {
    return (
      <div className="forecast-chart-placeholder">
        <div className="forecast-chart-placeholder-text">
          Seçilen marka/sezon için veri bulunamadı
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="forecast-chart-placeholder">
        <div className="forecast-chart-placeholder-text">
          Seçilen marka/sezon için veri bulunamadı
        </div>
      </div>
    )
  }

  // Y ekseni domain (negatif değerleri de gösterebilmek için)
  const allValues = chartData.flatMap(d => [d.Gelir, d.Maliyet, d.Kâr])
  const minValue = Math.min(...allValues, 0)
  const maxValue = Math.max(...allValues, targetProfitThreshold)
  const yAxisDomain = [minValue * 1.1, maxValue * 1.15]

  return (
    <div className="forecast-brand-profit-bar-chart">
      {/* Grafik */}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={`profit-bar-${yearKey}-${season}-${selectedBrands.join(',')}`}
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            barCategoryGap="20%"
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
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
              label={{ value: 'Tutar (TL)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '0.75rem' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '1rem' }}
              iconType="square"
              formatter={(value) => {
                const labels = {
                  'Gelir': 'Gelir',
                  'Maliyet': 'Maliyet',
                  'Kâr': 'Kâr'
                }
                return labels[value] || value
              }}
            />
            {/* Hedef Kâr Eşiği */}
            <ReferenceLine 
              y={targetProfitThreshold} 
              stroke="#6c757d" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              label={{ value: 'Hedef Kâr Eşiği', position: 'topRight', fill: '#6c757d', fontSize: 10 }}
            />
            {/* Gelir bar */}
            <Bar 
              dataKey="Gelir" 
              fill="#28a745" 
              radius={[4, 4, 0, 0]}
              minPointSize={2}
            />
            {/* Maliyet bar */}
            <Bar 
              dataKey="Maliyet" 
              fill="#dc3545" 
              radius={[4, 4, 0, 0]}
              minPointSize={2}
            />
            {/* Kâr bar */}
            <Bar 
              dataKey="Kâr" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              minPointSize={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.Kâr < 0 ? '#f59e0b' : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metinsel Açıklamalar */}
      <div className="forecast-profit-summary">
        <div className="forecast-profit-summary-item">
          <span className="forecast-profit-summary-label">Toplam Gelir:</span>
          <span className="forecast-profit-summary-value revenue">
            {formatNumber(totals.revenue)} TL
          </span>
        </div>
        <div className="forecast-profit-summary-item">
          <span className="forecast-profit-summary-label">Toplam Maliyet:</span>
          <span className="forecast-profit-summary-value cost">
            {formatNumber(totals.cost)} TL
          </span>
        </div>
        <div className="forecast-profit-summary-item">
          <span className="forecast-profit-summary-label">Toplam Kâr:</span>
          <span className={`forecast-profit-summary-value ${totals.profit >= 0 ? 'profit' : 'loss'}`}>
            {formatNumber(totals.profit)} TL
          </span>
        </div>
        <div className="forecast-profit-summary-item">
          <span className="forecast-profit-summary-label">Kârlılık Oranı:</span>
          <span className={`forecast-profit-summary-value ${parseFloat(profitabilityRate) >= 0 ? 'profit' : 'loss'}`}>
            %{profitabilityRate}
          </span>
        </div>
        <div className="forecast-profit-summary-item forecast-profit-summary-item-double">
          <span>
            <span className="forecast-profit-summary-label">En yüksek kâr:</span>
            <span className="forecast-profit-summary-value">{profitAnalysis.maxMonth}</span>
          </span>
          <span>
            <span className="forecast-profit-summary-label">En düşük kâr:</span>
            <span className="forecast-profit-summary-value">{profitAnalysis.minMonth}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default SeasonBrandProfitBarChart

