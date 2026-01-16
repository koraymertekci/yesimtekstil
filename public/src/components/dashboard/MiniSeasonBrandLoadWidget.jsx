import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { generateYearlyData } from '../../data/mockSeasonHistory'
import { CUSTOMERS } from '../../data/customers'

function MiniSeasonBrandLoadWidget() {
  const chartData = useMemo(() => {
    const selectedBrands = CUSTOMERS.slice(0, 5) // İlk 5 marka
    const season = 'Yaz'
    const yearKey = '2024'
    
    const brandLoads = selectedBrands.map(brand => {
      const yearlyData = generateYearlyData(brand, season)
      const year = parseInt(yearKey)
      const brandValue = yearlyData.find(d => d.year === year)?.qty || 0
      
      return {
        name: brand,
        value: brandValue
      }
    }).filter(item => item.value > 0)
    
    return brandLoads
  }, [])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (chartData.length === 0) {
    return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Veri yok</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={false}
          outerRadius={45}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            fontSize: '11px', 
            padding: '6px',
            backgroundColor: 'var(--card-bg, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          formatter={(value) => new Intl.NumberFormat('tr-TR').format(value)}
        />
        <Legend 
          wrapperStyle={{ fontSize: '10px' }}
          iconSize={8}
          formatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default MiniSeasonBrandLoadWidget











