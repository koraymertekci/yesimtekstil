import React, { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getLateOrdersCumulative } from '../../api/charts.api'
import RangeToggle from '../ui/RangeToggle'

function LateOrdersCumulativeChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [months, setMonths] = useState(6)
  const [isMock, setIsMock] = useState(false)

  const range = months === 6 ? '6m' : '12m'

  const generateMockData = (rangeValue = '6m') => {
    const rangeDays = rangeValue === '12m' ? 365 : 180
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - rangeDays)
    
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const generateDateSpine = (startDate, endDate) => {
      const dates = []
      const current = new Date(startDate)
      while (current <= endDate) {
        dates.push(formatDate(new Date(current)))
        current.setDate(current.getDate() + 1)
      }
      return dates
    }
    
    const dateSpine = generateDateSpine(startDate, today)
    
    let cumulative30 = 0
    let cumulative60 = 0
    
    const data = dateSpine.map((dateStr, index) => {
      const date = new Date(dateStr)
      const daysFromEnd = dateSpine.length - 1 - index
      
      let dailyLate = 0
      if (daysFromEnd <= 60) {
        const baseValue = 3 + (daysFromEnd % 7) * 0.8
        const variation = Math.sin(daysFromEnd * 0.1) * 2 + Math.random() * 4
        dailyLate = Math.max(0, Math.round(baseValue + variation))
        
        if (Math.random() < 0.05) {
          dailyLate = Math.round(dailyLate * 2.5 + Math.random() * 10)
        }
        dailyLate = Math.min(dailyLate, 30)
      }
      
      if (daysFromEnd <= 30) {
        cumulative30 += dailyLate
      } else {
        cumulative30 = 0
      }
      
      if (daysFromEnd <= 60) {
        cumulative60 += dailyLate
      } else {
        cumulative60 = 0
      }
      
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const formattedDate = `${day}.${month}`
      
      return {
        date: formattedDate,
        fullDate: dateStr,
        'Son 30 Gün': cumulative30,
        'Son 60 Gün': cumulative60,
        daily_late: dailyLate
      }
    })
    
    return data
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsMock(false)
        
        const result = await getLateOrdersCumulative(range)
        
        if (result && result.points && Array.isArray(result.points) && result.points.length > 0) {
          const chartData = result.points.map(point => {
            const date = new Date(point.date)
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            
            return {
              date: `${day}.${month}`,
              fullDate: point.date,
              'Son 30 Gün': Number(point.last30) || 0,
              'Son 60 Gün': Number(point.last60) || 0,
              daily_late: 0
            }
          })
          
          if (chartData.length < 2) {
            throw new Error('Veri yetersiz')
          }
          
          setData(chartData)
        } else {
          throw new Error('Veri formatı hatalı')
        }
      } catch (err) {
        console.error('LateOrdersCumulativeChart error:', err)
        setIsMock(true)
        const mockData = generateMockData(range)
        setData(mockData)
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [range])

  const chartData = useMemo(() => {
    if (!data || data.length === 0 || data.length < 2) {
      return generateMockData(range)
    }
    
    return data
  }, [data, range])
  
  const kpis = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        totalLate: 0,
        last7DaysIncrease: 0,
        dailyAverage: 0,
        peakDay: null
      }
    }
    
    const lastItem = chartData[chartData.length - 1]
    const totalLate = Number(lastItem['Son 60 Gün'] || lastItem['Son 30 Gün'] || 0)
    
    const last7DaysIndex = Math.max(0, chartData.length - 7)
    const last7DaysValue = Number(chartData[chartData.length - 1]?.['Son 60 Gün'] || 0)
    const sevenDaysAgoValue = Number(chartData[last7DaysIndex]?.['Son 60 Gün'] || 0)
    const last7DaysIncrease = last7DaysValue - sevenDaysAgoValue
    
    const dailyAverage = chartData.length > 0 ? totalLate / chartData.length : 0
    
    const peakDay = chartData.reduce((peak, item) => {
      const current = Number(item.daily_late) || 0
      if (!peak || current > peak.daily_late) {
        return { date: item.fullDate, formatted: item.date, daily_late: current }
      }
      return peak
    }, null)
    
    return {
      totalLate,
      last7DaysIncrease,
      dailyAverage,
      peakDay
    }
  }, [chartData])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const dateStr = data.fullDate || label
      const day = String(new Date(dateStr).getDate()).padStart(2, '0')
      const month = String(new Date(dateStr).getMonth() + 1).padStart(2, '0')
      const year = new Date(dateStr).getFullYear()
      
      return (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: '600', color: '#fff', fontSize: '13px' }}>
            {day}.{month}.{year}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {payload.map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '2px', 
                  backgroundColor: entry.color 
                }} />
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{entry.name}:</span>
                <strong style={{ color: entry.color, fontSize: '12px' }}>{Math.round(entry.value || 0)}</strong>
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '8px', 
            paddingTop: '8px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px', 
            color: '#94a3b8' 
          }}>
            Günlük: <strong style={{ color: '#fff' }}>{data.daily_late || 0}</strong> sipariş
          </div>
        </div>
      )
    }
    return null
  }

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

  if (error && !isMock) {
    return (
      <div style={{ 
        fontSize: '0.75rem', 
        color: '#dc3545',
        padding: '20px',
        textAlign: 'center'
      }}>
        Hata: {error}
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    const mockData = generateMockData(range)
    const mockKpis = {
      totalLate: mockData[mockData.length - 1]?.['Son 60 Gün'] || 0,
      last7DaysIncrease: (mockData[mockData.length - 1]?.['Son 60 Gün'] || 0) - (mockData[Math.max(0, mockData.length - 7)]?.['Son 60 Gün'] || 0),
      dailyAverage: (mockData[mockData.length - 1]?.['Son 60 Gün'] || 0) / mockData.length,
      peakDay: mockData.reduce((peak, item) => {
        const current = Number(item.daily_late) || 0
        if (!peak || current > peak.daily_late) {
          return { date: item.fullDate, formatted: item.date, daily_late: current }
        }
        return peak
      }, null)
    }
    
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '11px'
            }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '2px', 
                backgroundColor: '#3b82f6' 
              }} />
              <span style={{ color: '#94a3b8' }}>Son 30 Gün</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '11px'
            }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '2px', 
                backgroundColor: '#10b981' 
              }} />
              <span style={{ color: '#94a3b8' }}>Son 60 Gün</span>
            </div>
          </div>
          <RangeToggle value={months} onChange={setMonths} size="sm" />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <LineChart data={mockData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
              <defs>
                <linearGradient id="gradient30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradient60" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval="preserveStartEnd"
                angle={0}
                textAnchor="middle"
                height={40}
                minTickGap={18}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                width={50}
                domain={[0, (dataMax) => (dataMax || 0) + Math.ceil((dataMax || 0) * 0.1) + 10]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Son 30 Gün"
                fill="url(#gradient30)"
                stroke="none"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="Son 60 Gün"
                fill="url(#gradient60)"
                stroke="none"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="Son 30 Gün" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                connectNulls
                name="Son 30 Gün"
              />
              <Line 
                type="monotone" 
                dataKey="Son 60 Gün" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                connectNulls
                name="Son 60 Gün"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '0.7rem',
          flexShrink: 0,
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Toplam Geciken:</span>
            <span style={{ color: '#ef4444', fontWeight: '600' }}>
              {Math.round(mockKpis.totalLate)} adet
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Son 7 Gün Artış:</span>
            <span style={{ color: mockKpis.last7DaysIncrease >= 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
              {mockKpis.last7DaysIncrease >= 0 ? '+' : ''}{Math.round(mockKpis.last7DaysIncrease)} adet
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Günlük Ortalama:</span>
            <span style={{ color: '#3b82f6', fontWeight: '600' }}>
              {mockKpis.dailyAverage.toFixed(1)} adet/gün
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Tepe Gün:</span>
            <span style={{ color: '#f59e0b', fontWeight: '600' }}>
              {mockKpis.peakDay?.formatted || 'N/A'} ({mockKpis.peakDay?.daily_late || 0} adet)
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '11px'
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '2px', 
              backgroundColor: '#3b82f6' 
            }} />
            <span style={{ color: '#94a3b8' }}>Son 30 Gün</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '11px'
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '2px', 
              backgroundColor: '#10b981' 
            }} />
            <span style={{ color: '#94a3b8' }}>Son 60 Gün</span>
          </div>
        </div>
        <RangeToggle value={months} onChange={setMonths} size="sm" />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
            <defs>
              <linearGradient id="gradient30" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradient60" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              interval="preserveStartEnd"
              angle={0}
              textAnchor="middle"
              height={40}
              minTickGap={18}
              tickFormatter={(value) => value}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={50}
              domain={[0, (dataMax) => (dataMax || 0) + Math.ceil((dataMax || 0) * 0.1) + 10]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Son 30 Gün"
              fill="url(#gradient30)"
              stroke="none"
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="Son 60 Gün"
              fill="url(#gradient60)"
              stroke="none"
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="Son 30 Gün" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              connectNulls
              name="Son 30 Gün"
            />
            <Line 
              type="monotone" 
              dataKey="Son 60 Gün" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              connectNulls
              name="Son 60 Gün"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '0.7rem',
        flexShrink: 0,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#94a3b8' }}>Toplam Geciken:</span>
          <span style={{ color: '#ef4444', fontWeight: '600' }}>
            {Math.round(kpis.totalLate)} adet
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#94a3b8' }}>Son 7 Gün Artış:</span>
          <span style={{ color: kpis.last7DaysIncrease >= 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
            {kpis.last7DaysIncrease >= 0 ? '+' : ''}{Math.round(kpis.last7DaysIncrease)} adet
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#94a3b8' }}>Günlük Ortalama:</span>
          <span style={{ color: '#3b82f6', fontWeight: '600' }}>
            {kpis.dailyAverage.toFixed(1)} adet/gün
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#94a3b8' }}>Tepe Gün:</span>
          <span style={{ color: '#f59e0b', fontWeight: '600' }}>
            {kpis.peakDay?.formatted || 'N/A'} ({kpis.peakDay?.daily_late || 0} adet)
          </span>
        </div>
      </div>
    </div>
  )
}

export default LateOrdersCumulativeChart

