import React, { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getProductionEfficiency } from '../../api/charts.api'
import RangeToggle from '../ui/RangeToggle'
import ViewModeToggle from '../ui/ViewModeToggle'
import InsightCards from './InsightCards'

function ProductionEfficiencyLineChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [months, setMonths] = useState(6)
  const [viewMode, setViewMode] = useState('index')
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsMock(false)
        
        const result = await getProductionEfficiency(months)
        
        if (result && result.series && Array.isArray(result.series) && result.series.length > 0) {
          setData(result)
        } else {
          throw new Error('Veri formatı hatalı')
        }
      } catch (err) {
        console.error('ProductionEfficiencyLineChart error:', err)
        setIsMock(true)
        const mockData = generateMockData(months)
        setData(mockData)
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [months])

  const generateMockData = (rangeMonths = 6) => {
    const daysCount = rangeMonths === 12 ? 365 : 180
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysCount)
    
    const oeePoints = []
    const speedPoints = []
    const errorPoints = []
    
    let baseOee = 75
    let baseSpeed = 82
    let baseError = 3.5
    
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = formatDate(date)
      const dayIndex = i
      
      const progress = dayIndex / daysCount
      
      if (Math.random() < 0.02 && dayIndex > 30) {
        baseOee = Math.max(60, baseOee - 8)
        baseError = Math.min(8, baseError + 2)
      } else if (baseOee < 75) {
        baseOee = Math.min(85, baseOee + 0.3)
        baseError = Math.max(1, baseError - 0.1)
      }
      
      const seasonalFactor = Math.sin(progress * Math.PI * 4) * 3
      const randomFactor = (Math.random() - 0.5) * 4
      
      const oee = Math.max(60, Math.min(90, baseOee + seasonalFactor + randomFactor))
      const speed = Math.max(70, Math.min(95, baseSpeed + (oee - baseOee) * 0.6 + (Math.random() - 0.5) * 3))
      const error = Math.max(1, Math.min(8, baseError - (oee - baseOee) * 0.05 + (Math.random() - 0.5) * 1.5))
      
      oeePoints.push({
        date: dateStr,
        value: Math.round(oee * 10) / 10
      })
      speedPoints.push({
        date: dateStr,
        value: Math.round(speed * 10) / 10
      })
      errorPoints.push({
        date: dateStr,
        value: Math.round(error * 10) / 10
      })
    }
    
    return {
      rangeMonths: rangeMonths,
      series: [
        {
          name: 'OEE (%)',
          points: oeePoints
        },
        {
          name: 'Çalışma Hızı (%)',
          points: speedPoints
        },
        {
          name: 'Hata Oranı (%)',
          points: errorPoints
        }
      ]
    }
  }

  const rawChartData = useMemo(() => {
    if (!data || !data.series || data.series.length === 0) {
      return []
    }
    
    const allDates = new Set()
    data.series.forEach(series => {
      series.points.forEach(point => {
        if (point.date) {
          allDates.add(point.date)
        }
      })
    })
    
    const sortedDates = Array.from(allDates).sort()
    
    return sortedDates.map(date => {
      const item = { date: date }
      
      data.series.forEach(series => {
        const point = series.points.find(p => p.date === date)
        if (point) {
          item[series.name] = point.value
        }
      })
      
      const dateObj = new Date(date)
      const day = String(dateObj.getDate()).padStart(2, '0')
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      item.formattedDate = `${day}.${month}`
      
      return item
    })
  }, [data])

  const chartData = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) {
      return []
    }

    if (viewMode === 'raw') {
      return rawChartData
    }

    const indexedData = rawChartData.map((item, index) => {
      const indexedItem = { ...item }
      
      const firstOee = rawChartData[0]['OEE (%)'] || 1
      const firstSpeed = rawChartData[0]['Çalışma Hızı (%)'] || 1
      const firstError = rawChartData[0]['Hata Oranı (%)'] || 1
      
      if (index === 0) {
        indexedItem['OEE (%)_index'] = 100
        indexedItem['Çalışma Hızı (%)_index'] = 100
        indexedItem['Hata Oranı (%)_index'] = 100
      } else {
        indexedItem['OEE (%)_index'] = firstOee > 0 
          ? Math.round((item['OEE (%)'] / firstOee) * 100 * 10) / 10 
          : 100
        indexedItem['Çalışma Hızı (%)_index'] = firstSpeed > 0 
          ? Math.round((item['Çalışma Hızı (%)'] / firstSpeed) * 100 * 10) / 10 
          : 100
        indexedItem['Hata Oranı (%)_index'] = firstError > 0 
          ? Math.round((item['Hata Oranı (%)'] / firstError) * 100 * 10) / 10 
          : 100
      }
      
      indexedItem['OEE (%)_raw'] = item['OEE (%)']
      indexedItem['Çalışma Hızı (%)_raw'] = item['Çalışma Hızı (%)']
      indexedItem['Hata Oranı (%)_raw'] = item['Hata Oranı (%)']
      
      return indexedItem
    })
    
    return indexedData
  }, [rawChartData, viewMode])

  const yAxisDomain = useMemo(() => {
    if (viewMode === 'raw') {
      return [0, 100]
    }
    
    if (!chartData || chartData.length === 0) {
      return [95, 110]
    }
    
    let min = Infinity
    let max = -Infinity
    
    chartData.forEach(item => {
      const oeeIndex = item['OEE (%)_index']
      const speedIndex = item['Çalışma Hızı (%)_index']
      const errorIndex = item['Hata Oranı (%)_index']
      
      if (oeeIndex !== undefined) {
        min = Math.min(min, oeeIndex)
        max = Math.max(max, oeeIndex)
      }
      if (speedIndex !== undefined) {
        min = Math.min(min, speedIndex)
        max = Math.max(max, speedIndex)
      }
      if (errorIndex !== undefined) {
        min = Math.min(min, errorIndex)
        max = Math.max(max, errorIndex)
      }
    })
    
    if (min === Infinity || max === -Infinity) {
      return [95, 110]
    }
    
    const padding = (max - min) * 0.1 || 2
    return [Math.max(85, Math.round((min - padding) * 10) / 10), Math.round((max + padding) * 10) / 10]
  }, [chartData, viewMode])

  const kpis = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        averageOee: 0,
        last4WeeksTrend: 'N/A',
        lastErrorRate: 0,
        oeeChange: 0,
        speedChange: 0,
        errorChange: 0
      }
    }

    if (viewMode === 'index') {
      const firstOee = chartData[0]?.['OEE (%)_index'] || 100
      const firstSpeed = chartData[0]?.['Çalışma Hızı (%)_index'] || 100
      const firstError = chartData[0]?.['Hata Oranı (%)_index'] || 100
      
      const lastOee = chartData[chartData.length - 1]?.['OEE (%)_index'] || 100
      const lastSpeed = chartData[chartData.length - 1]?.['Çalışma Hızı (%)_index'] || 100
      const lastError = chartData[chartData.length - 1]?.['Hata Oranı (%)_index'] || 100
      
      return {
        oeeChange: Math.round((lastOee - firstOee) * 10) / 10,
        speedChange: Math.round((lastSpeed - firstSpeed) * 10) / 10,
        errorChange: Math.round((lastError - firstError) * 10) / 10
      }
    } else {
      const oeeValues = chartData.map(item => item['OEE (%)']).filter(v => v !== undefined)
      const averageOee = oeeValues.length > 0 
        ? oeeValues.reduce((sum, val) => sum + val, 0) / oeeValues.length 
        : 0
      
      const last4Weeks = chartData.slice(-28)
      const first4Weeks = chartData.slice(0, 28)
      const last4WeeksAvg = last4Weeks.length > 0
        ? last4Weeks.map(item => item['OEE (%)']).filter(v => v !== undefined).reduce((sum, val) => sum + val, 0) / last4Weeks.length
        : 0
      const first4WeeksAvg = first4Weeks.length > 0
        ? first4Weeks.map(item => item['OEE (%)']).filter(v => v !== undefined).reduce((sum, val) => sum + val, 0) / first4Weeks.length
        : 0
      
      const trend = last4WeeksAvg - first4WeeksAvg
      const trendText = trend > 0.5 ? '↑' : trend < -0.5 ? '↓' : '→'
      
      const lastErrorRate = chartData[chartData.length - 1]?.['Hata Oranı (%)'] || 0

      const last4WeeksChange = Math.round(trend * 10) / 10
      
      const last4WeeksError = last4Weeks.map(item => item['Hata Oranı (%)']).filter(v => v !== undefined)
      const first4WeeksError = first4Weeks.map(item => item['Hata Oranı (%)']).filter(v => v !== undefined)
      const last4WeeksErrorAvg = last4WeeksError.length > 0 
        ? last4WeeksError.reduce((sum, val) => sum + val, 0) / last4WeeksError.length 
        : 0
      const first4WeeksErrorAvg = first4WeeksError.length > 0 
        ? first4WeeksError.reduce((sum, val) => sum + val, 0) / first4WeeksError.length 
        : 0
      
      const errorTrend = last4WeeksErrorAvg - first4WeeksErrorAvg
      
      let warning = null
      if (errorTrend > 1 && trend < -1) {
        warning = 'Hata ↑ ve OEE ↓'
      } else if (errorTrend > 1) {
        warning = 'Hata oranı artıyor'
      } else if (trend < -2) {
        warning = 'OEE düşüş trendinde'
      }

      return {
        averageOee: Math.round(averageOee * 10) / 10,
        last4WeeksTrend: trendText,
        lastErrorRate: Math.round(lastErrorRate * 10) / 10,
        last4WeeksChange,
        warning
      }
    }
  }, [chartData, viewMode])

  const insightItems = useMemo(() => {
    if (viewMode === 'index') {
      return [
        {
          label: 'OEE Değişim',
          value: `${kpis.oeeChange >= 0 ? '+' : ''}${kpis.oeeChange}%`,
          hint: 'Başlangıca göre endeks değişimi',
          tone: kpis.oeeChange >= 0 ? 'positive' : 'negative'
        },
        {
          label: 'Hata Oranı Değişim',
          value: `${kpis.errorChange >= 0 ? '+' : ''}${kpis.errorChange}%`,
          hint: 'Başlangıca göre endeks değişimi',
          tone: kpis.errorChange <= 0 ? 'positive' : 'negative'
        },
        {
          label: 'Son 4 Hafta Değişim',
          value: `${kpis.oeeChange >= 0 ? '+' : ''}${kpis.oeeChange}%`,
          hint: 'OEE endeks değişimi',
          tone: kpis.oeeChange >= 0 ? 'positive' : 'negative'
        },
        ...(kpis.warning ? [{
          label: 'Uyarı',
          value: kpis.warning,
          hint: 'Performans korelasyon analizi',
          tone: 'warning'
        }] : [])
      ]
    } else {
      return [
        {
          label: 'OEE Ortalama',
          value: `${kpis.averageOee}%`,
          hint: 'Dönem ortalaması',
          tone: kpis.averageOee >= 75 ? 'positive' : kpis.averageOee >= 65 ? 'warning' : 'negative'
        },
        {
          label: 'Hata Oranı (son)',
          value: `${kpis.lastErrorRate}%`,
          hint: 'Son ölçülen değer',
          tone: kpis.lastErrorRate <= 3 ? 'positive' : kpis.lastErrorRate <= 5 ? 'warning' : 'negative'
        },
        {
          label: 'Son 4 Hafta Değişim',
          value: `${kpis.last4WeeksChange >= 0 ? '+' : ''}${kpis.last4WeeksChange}%`,
          hint: 'OEE trend değişimi',
          tone: kpis.last4WeeksChange >= 0 ? 'positive' : 'negative'
        },
        ...(kpis.warning ? [{
          label: 'Uyarı',
          value: kpis.warning,
          hint: 'Performans korelasyon analizi',
          tone: 'warning'
        }] : [])
      ]
    }
  }, [kpis, viewMode])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const dateStr = data.date || label
      const date = new Date(dateStr)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      
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
            {payload.map((entry, index) => {
              const seriesName = entry.dataKey.replace('_index', '')
              let indexValue = null
              let rawValue = null
              
              if (viewMode === 'index') {
                indexValue = entry.value
                rawValue = data[`${seriesName}_raw`]
              } else {
                rawValue = entry.value
              }
              
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '2px', 
                    backgroundColor: entry.color 
                  }} />
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>{seriesName}:</span>
                  {viewMode === 'index' ? (
                    <>
                      <strong style={{ color: entry.color, fontSize: '12px' }}>{indexValue}</strong>
                      {rawValue !== undefined && rawValue !== null && (
                        <span style={{ color: '#64748b', fontSize: '10px' }}>(Ham: {rawValue}%)</span>
                      )}
                    </>
                  ) : (
                    <strong style={{ color: entry.color, fontSize: '12px' }}>{rawValue}%</strong>
                  )}
                </div>
              )
            })}
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
    return (
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--text-secondary)',
        padding: '20px',
        textAlign: 'center'
      }}>
        Veri bulunamadı
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '420px', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          OEE, Çalışma Hızı ve Hata Oranı — 6/12 ay kıyas
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMock && (
            <div style={{
              fontSize: '0.6rem',
              color: 'rgba(148, 163, 184, 0.5)',
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              padding: '2px 5px',
              borderRadius: '2px'
            }}>
              mock
            </div>
          )}
          <ViewModeToggle value={viewMode} onChange={setViewMode} size="sm" />
          <RangeToggle value={months} onChange={setMonths} size="sm" />
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
              minTickGap={20}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              width={50}
              domain={viewMode === 'raw' ? [0, 100] : yAxisDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconSize={10}
            />
            {viewMode === 'index' ? (
              <>
                <Line 
                  type="monotone" 
                  dataKey="OEE (%)_index" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="OEE (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Çalışma Hızı (%)_index" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Çalışma Hızı (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Hata Oranı (%)_index" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Hata Oranı (%)"
                />
              </>
            ) : (
              <>
                <Line 
                  type="monotone" 
                  dataKey="OEE (%)" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="OEE (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Çalışma Hızı (%)" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Çalışma Hızı (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Hata Oranı (%)" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Hata Oranı (%)"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
          <InsightCards 
            items={insightItems}
            modalTitle="Üretim Verimlilik Trendleri"
        modalSubtitle="OEE, Çalışma Hızı ve Hata Oranı — 6/12 ay kıyas"
        modalChart={
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
                minTickGap={20}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                width={50}
                domain={viewMode === 'raw' ? [0, 100] : yAxisDomain}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconSize={10}
              />
              {viewMode === 'index' ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="OEE (%)_index" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="OEE (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Çalışma Hızı (%)_index" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Çalışma Hızı (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Hata Oranı (%)_index" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Hata Oranı (%)"
                  />
                </>
              ) : (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="OEE (%)" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="OEE (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Çalışma Hızı (%)" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Çalışma Hızı (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Hata Oranı (%)" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Hata Oranı (%)"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        }
        modalRangeToggle={<RangeToggle value={months} onChange={setMonths} size="sm" />}
        modalViewModeToggle={<ViewModeToggle value={viewMode} onChange={setViewMode} size="sm" />}
      />
    </div>
  )
}

export default ProductionEfficiencyLineChart
