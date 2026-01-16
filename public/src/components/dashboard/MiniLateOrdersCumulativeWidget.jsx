import React, { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getLateOrdersTrend } from '../../api/dashboard.api'

function MiniLateOrdersCumulativeWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getLateOrdersTrend(60)
        if (result) {
          setData(result)
        } else {
          setError('Veri bulunamadı')
        }
      } catch (err) {
        let errorMsg = 'Veri yüklenemedi'
        if (err?.message) {
          errorMsg = err.message
        } else if (typeof err === 'string') {
          errorMsg = err
        } else if (err?.toString) {
          errorMsg = err.toString()
        }
        console.error('Widget error:', err)
        setError(errorMsg)
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const chartData = useMemo(() => {
    if (!data || !data.series || data.series.length === 0) return []
    
    const series30 = data.series.find(s => s.label === 'Son 30 Gün')
    const series60 = data.series.find(s => s.label.includes('60'))
    
    if (!series30 || !series60) return []
    
    const maxLength = Math.max(series30.points.length, series60.points.length)
    const chartDataArray = []
    
    for (let i = 0; i < maxLength; i++) {
      const point30 = series30.points[i]
      const point60 = series60.points[i]
      
      if (point30 || point60) {
        const date = point30?.date || point60?.date
        let formattedDate = date
        let fullDate = date
        
        if (date && typeof date === 'string') {
          const dateParts = date.split('-')
          if (dateParts.length === 3) {
            formattedDate = `${dateParts[2]}.${dateParts[1]}`
            fullDate = date
          }
        } else if (date instanceof Date) {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          formattedDate = `${day}.${month}`
          fullDate = date.toISOString().split('T')[0]
        }
        
        chartDataArray.push({
          date: formattedDate,
          'Son 30 Gün': point30?.cumulative ?? null,
          'Son 60 Gün': point60?.cumulative ?? null,
          daily_late_30: point30?.daily_late || 0,
          daily_late_60: point60?.daily_late || 0,
          fullDate: fullDate
        })
      }
    }
    
    return chartDataArray
  }, [data])

  if (loading) {
    return (
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--text-secondary)',
        padding: '20px',
        textAlign: 'center'
      }}>
        Yükleniyor...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        fontSize: '0.7rem', 
        color: '#dc3545',
        padding: '15px',
        textAlign: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderRadius: '4px',
        border: '1px solid rgba(220, 53, 69, 0.3)',
        lineHeight: '1.4'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '5px' }}>⚠ Hata</div>
        <div>{error}</div>
        {error.includes('Backend') && (
          <div style={{ fontSize: '0.65rem', marginTop: '8px', color: '#94a3b8' }}>
            Backend'i başlatmak için: cd server && npm start
          </div>
        )}
      </div>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--text-secondary)',
        padding: '20px',
        textAlign: 'center'
      }}>
        Veri yok
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          padding: '8px',
          fontSize: '11px'
        }}>
          <div style={{ marginBottom: '4px', fontWeight: '600' }}>{data.fullDate}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, marginTop: '2px' }}>
              {entry.name}: <strong>{entry.value}</strong>
            </div>
          ))}
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
            Günlük: {data.daily_late_30 || data.daily_late_60 || 0} sipariş
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '10px' }}
          iconSize={8}
        />
        <Line 
          type="monotone" 
          dataKey="Son 30 Gün" 
          stroke="#3b82f6" 
          strokeWidth={1.5}
          dot={false}
          connectNulls
        />
        <Line 
          type="monotone" 
          dataKey="Son 60 Gün" 
          stroke="#10b981" 
          strokeWidth={1.5}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default MiniLateOrdersCumulativeWidget

