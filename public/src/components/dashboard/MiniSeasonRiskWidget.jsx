import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { generateYearlyData } from '../../data/mockSeasonHistory'
import { CUSTOMERS } from '../../data/customers'

function MiniSeasonRiskWidget() {
  const chartData = useMemo(() => {
    const selectedBrands = CUSTOMERS.slice(0, 3)
    const season = 'Yaz'
    const yearKey = '2024'
    
    const seasonMonths = {
      'Kış': ['Aralık', 'Ocak', 'Şubat'],
      'İlkbahar': ['Mart', 'Nisan', 'Mayıs'],
      'Yaz': ['Haziran', 'Temmuz', 'Ağustos'],
      'Sonbahar': ['Eylül', 'Ekim', 'Kasım']
    }
    
    const months = seasonMonths[season] || []
    const year = parseInt(yearKey)
    
    let forecastTotal = 0
    selectedBrands.forEach(brand => {
      const yearlyData = generateYearlyData(brand, season)
      forecastTotal += yearlyData.find(d => d.year === year)?.qty || 0
    })
    
    if (forecastTotal <= 0) return []
    
    const distributions = { 3: [0.30, 0.35, 0.35] }
    const dist = distributions[months.length] || months.map(() => 1 / months.length)
    const totalCapacity = Math.round(forecastTotal * 1.1)
    const monthlyCapacity = Math.round(totalCapacity / months.length)
    
    return months.map((month, index) => {
      const share = dist[index]
      const monthlyOrder = Math.round(forecastTotal * share)
      const capacityUsage = monthlyCapacity > 0 ? (monthlyOrder / monthlyCapacity) * 100 : 0
      const usagePct = Math.round(capacityUsage * 10) / 10
      
      let riskColor = '#28a745'
      if (usagePct >= 100) riskColor = '#8b0000'
      else if (usagePct >= 85) riskColor = '#dc3545'
      else if (usagePct >= 70) riskColor = '#ffc107'
      
      return {
        month: month.substring(0, 3),
        kullanım: usagePct
      }
    })
  }, [])

  if (chartData.length === 0) {
    return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Veri yok</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 9 }}
        />
        <YAxis 
          tick={{ fontSize: 9 }}
          width={30}
          domain={[0, 120]}
        />
        <Tooltip 
          contentStyle={{ 
            fontSize: '11px', 
            padding: '6px',
            backgroundColor: 'var(--card-bg, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          formatter={(value) => `${value.toFixed(1)}%`}
        />
        <Bar dataKey="kullanım" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={
              entry.kullanım >= 100 ? '#8b0000' :
              entry.kullanım >= 85 ? '#dc3545' :
              entry.kullanım >= 70 ? '#ffc107' : '#28a745'
            } />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default MiniSeasonRiskWidget











