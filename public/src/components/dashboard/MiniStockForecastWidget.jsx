import React, { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getCriticalStocks } from '../../api/stocks.api'
import { calculateStockProjection } from '../../utils/stockProjection'

function MiniStockForecastWidget() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const data = await getCriticalStocks()
        setStocks(data || [])
      } catch (err) {
        setStocks([])
      } finally {
        setLoading(false)
      }
    }
    fetchStocks()
  }, [])

  const selectedMaterial = stocks[0] || null

  const projection = useMemo(() => {
    if (!selectedMaterial) return null
    return calculateStockProjection(selectedMaterial, 6, 'normal', 0, [], '')
  }, [selectedMaterial])

  const chartData = useMemo(() => {
    if (!projection) return []
    return projection.labels.slice(0, 6).map((label, index) => ({
      date: label,
      'Beklenen Stok': projection.stockSeries[index] || 0,
      'Emniyet Stok': projection.safetySeries[index] || 0
    }))
  }, [projection])

  if (loading) {
    return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Yükleniyor...</div>
  }

  if (!selectedMaterial || !projection || chartData.length === 0) {
    return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Veri yok</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="miniStockGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="date" 
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
        <ReferenceLine 
          y={projection.safetySeries[0]} 
          stroke="#dc3545" 
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <Area
          type="monotone"
          dataKey="Beklenen Stok"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="url(#miniStockGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default MiniStockForecastWidget











