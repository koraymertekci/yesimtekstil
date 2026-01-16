import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import '../../App.css'

function CostProfitChart({ financials, label }) {
  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Güvenli parse ve fallback değerler
  const revenue = Number(financials?.revenueTL ?? 0)
  const cost = Number(financials?.costTL ?? 0)
  const profit = Number.isFinite(Number(financials?.profitTL)) 
    ? Number(financials.profitTL) 
    : revenue - cost

  // NaN kontrolü
  const safeRevenue = Number.isFinite(revenue) && revenue >= 0 ? revenue : 0
  const safeCost = Number.isFinite(cost) && cost >= 0 ? cost : 0
  const safeProfit = Number.isFinite(profit) ? profit : safeRevenue - safeCost

  const profitMarginPct = financials?.profitMarginPct ?? (safeRevenue > 0 ? (safeProfit / safeRevenue) * 100 : 0)

  // Chart data - dataKey'ler chartData ile birebir aynı olmalı
  const chartData = [
    {
      name: label || 'Analiz',
      revenue: safeRevenue,
      cost: safeCost,
      profit: safeProfit
    }
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="forecast-chart-tooltip">
          <div className="forecast-chart-tooltip-title">{label || 'Analiz'}</div>
          {payload.map((entry, index) => {
            const value = entry.value
            const isNegative = entry.dataKey === 'profit' && value < 0
            const displayName = entry.dataKey === 'revenue' ? 'Gelir' : entry.dataKey === 'cost' ? 'Maliyet' : 'Kâr'
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
                  {formatNumber(Math.abs(value))} TL
                </span>
              </div>
            )
          })}
          {profitMarginPct !== undefined && (
            <div className="forecast-chart-tooltip-item">
              <span className="forecast-chart-tooltip-label">Kâr Marjı:</span>
              <span className={`forecast-chart-tooltip-value ${profitMarginPct >= 0 ? '' : 'negative'}`}>
                %{profitMarginPct.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="forecast-cost-profit-chart">
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            barCategoryGap="50%"
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              className="chart-axis"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatNumber(value)}
              className="chart-axis"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Gelir bar */}
            <Bar 
              dataKey="revenue" 
              fill="#28a745" 
              radius={[4, 4, 0, 0]}
              minPointSize={2}
              barSize={24}
            >
              <Cell fill="#28a745" />
            </Bar>
            {/* Maliyet bar */}
            <Bar 
              dataKey="cost" 
              fill="#dc3545" 
              radius={[4, 4, 0, 0]}
              minPointSize={2}
              barSize={24}
            >
              <Cell fill="#dc3545" />
            </Bar>
            {/* Kâr bar */}
            <Bar 
              dataKey="profit" 
              fill={safeProfit >= 0 ? '#6ee7b7' : '#fca5a5'} 
              radius={[4, 4, 0, 0]}
              minPointSize={2}
              barSize={24}
            >
              <Cell fill={safeProfit >= 0 ? '#6ee7b7' : '#fca5a5'} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CostProfitChart
