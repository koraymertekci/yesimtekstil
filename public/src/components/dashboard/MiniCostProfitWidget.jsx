import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { generateYearlyData } from '../../data/mockSeasonHistory'
import { CUSTOMERS } from '../../data/customers'

function MiniCostProfitWidget() {
  const chartData = useMemo(() => {
    const selectedBrands = CUSTOMERS.slice(0, 3)
    const season = 'Yaz'
    const yearKey = '2024'
    const year = parseInt(yearKey)
    
    let totalRevenue = 0
    let totalCost = 0
    
    selectedBrands.forEach(brand => {
      const yearlyData = generateYearlyData(brand, season)
      const qty = yearlyData.find(d => d.year === year)?.qty || 0
      // Basit hesaplama: qty * 100 TL gelir, qty * 70 TL maliyet
      totalRevenue += qty * 100
      totalCost += qty * 70
    })
    
    const profit = totalRevenue - totalCost
    
    return [{
      name: 'Özet',
      gelir: totalRevenue,
      maliyet: totalCost,
      kar: profit
    }]
  }, [])

  if (chartData.length === 0 || !chartData[0]) {
    return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Veri yok</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 9 }}
        />
        <YAxis 
          tick={{ fontSize: 9 }}
          width={50}
        />
        <Tooltip 
          contentStyle={{ 
            fontSize: '11px', 
            padding: '6px',
            backgroundColor: 'var(--card-bg, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          formatter={(value) => new Intl.NumberFormat('tr-TR').format(value) + ' TL'}
        />
        <Bar dataKey="gelir" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="maliyet" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="kar" fill={chartData[0].kar >= 0 ? '#10b981' : '#ef4444'} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default MiniCostProfitWidget











