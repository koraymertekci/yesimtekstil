import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMarketSnapshot } from '../../utils/marketSnapshot'

function MiniMarketTrendWidget() {
  const marketData = useMemo(() => {
    const snapshot = getMarketSnapshot()
    const usdValue = snapshot.usdtry || 34.25
    const eurValue = snapshot.eurtry || 37.18
    const inflationValue = snapshot.inflation12m || 0
    
    const months = 6
    const labels = ['Başlangıç']
    const usdData = [usdValue]
    const eurData = [eurValue]
    
    const inflationAnnual = inflationValue / 100
    const monthlyInfl = Math.pow(1 + inflationAnnual, 1 / 12) - 1
    const fxMonthly = monthlyInfl * 0.70
    
    for (let t = 1; t <= months; t++) {
      labels.push(`${t}. Ay`)
      const usd_t = usdValue * Math.pow(1 + fxMonthly, t)
      const eur_t = eurValue * Math.pow(1 + fxMonthly, t)
      usdData.push(usd_t)
      eurData.push(eur_t)
    }
    
    return labels.map((label, index) => ({
      month: label,
      'USD/TRY': Number(usdData[index].toFixed(2)),
      'EUR/TRY': Number(eurData[index].toFixed(2))
    }))
  }, [])

  if (marketData.length === 0) {
    return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Veri yok</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={marketData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 9 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          tick={{ fontSize: 9 }}
          width={40}
        />
        <Tooltip 
          contentStyle={{ 
            fontSize: '11px', 
            padding: '6px',
            backgroundColor: 'var(--card-bg, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="USD/TRY" 
          stroke="#3b82f6" 
          strokeWidth={1.5}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="EUR/TRY" 
          stroke="#10b981" 
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default MiniMarketTrendWidget











