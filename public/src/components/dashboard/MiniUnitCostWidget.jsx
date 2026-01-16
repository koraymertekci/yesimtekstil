import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMarketSnapshot } from '../../utils/marketSnapshot'
import { RAW_MATERIALS } from '../../data/rawMaterials'

function MiniUnitCostWidget() {
  const chartData = useMemo(() => {
    const snapshot = getMarketSnapshot()
    const material = RAW_MATERIALS[0] || { basePrice: 100, baseCurrency: 'TRY', unit: 'kg' }
    const unitPrice = material.basePrice || 100
    const priceCurrency = material.baseCurrency || 'TRY'
    const usdTry = snapshot.usdtry || 34.25
    const eurTry = snapshot.eurtry || 37.18
    const inflationPercent = snapshot.inflation12m || 0
    
    // Basit waterfall hesaplama
    let baseCost = unitPrice
    if (priceCurrency === 'USD') {
      baseCost = unitPrice * usdTry
    } else if (priceCurrency === 'EUR') {
      baseCost = unitPrice * eurTry
    }
    
    const inflationEffect = baseCost * (inflationPercent / 100)
    const totalCost = baseCost + inflationEffect
    
    return [
      { name: 'Baz', değer: baseCost },
      { name: 'Enflasyon', değer: inflationEffect },
      { name: 'Toplam', değer: totalCost }
    ]
  }, [])

  if (chartData.length === 0) {
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
          formatter={(value) => new Intl.NumberFormat('tr-TR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }).format(value) + ' TL'}
        />
        <Bar dataKey="değer" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default MiniUnitCostWidget

