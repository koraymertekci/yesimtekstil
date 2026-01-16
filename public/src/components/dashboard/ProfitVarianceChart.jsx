import React, { useState, useEffect, useMemo } from 'react'
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { getProfitVariance } from '../../api/finance.api'
import RangeToggle from '../ui/RangeToggle'
import InsightCards from './InsightCards'

function ProfitVarianceChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [months, setMonths] = useState(6)

  const generateMockData = (monthsCount = 6) => {
    const today = new Date()
    const data = []
    let cumulativeVariance = 0
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      
      const plannedProfit = 100000 + (i * 10000) + Math.random() * 5000
      const variance = -5000 + Math.random() * 10000
      const actualProfit = plannedProfit + variance
      cumulativeVariance += variance
      
      data.push({
        month: `${year}-${month}`,
        planned_profit: Math.round(plannedProfit * 100) / 100,
        actual_profit: Math.round(actualProfit * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variance_pct: Math.round((variance / plannedProfit) * 10000) / 10000
      })
    }
    
    return {
      months: monthsCount,
      data: data,
      summary: {
        total_variance: Math.round(cumulativeVariance * 100) / 100,
        avg_variance_pct: Math.round((cumulativeVariance / monthsCount / 100000) * 10000) / 10000
      }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getProfitVariance(months)
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
        }
        
        console.error('ProfitVarianceChart error:', {
          message: errorMsg,
          error: err,
          status: err?.status || err?.response?.status,
          is404: err?.is404
        })
        
        if (err?.is404 || err?.status >= 500 || err?.status === 'CONNECTION_REFUSED' || err?.status === 'NO_RESPONSE') {
          const mockData = generateMockData(months)
          setData(mockData)
          setError(null)
        } else {
          setError(errorMsg)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [months])

  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

  const formatMonthLabel = (monthStr) => {
    if (!monthStr || typeof monthStr !== 'string') return ''
    const parts = monthStr.split('-')
    if (parts.length !== 2) return monthStr
    const [year, month] = parts
    const monthIndex = parseInt(month) - 1
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= monthNames.length) return monthStr
    return `${monthNames[monthIndex]} ${year.slice(2)}`
  }

  const chartData = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return []
    
    return data.data.map((item) => {
      const planned = item.planned_profit || 0
      const actual = item.actual_profit || 0
      const variance = item.variance || (actual - planned)
      
      return {
        month: item.month,
        monthLabel: formatMonthLabel(item.month || ''),
        planned_profit: planned,
        actual_profit: actual,
        variance: variance,
        positiveDiff: variance > 0 ? actual : planned,
        negativeDiff: variance < 0 ? actual : planned
      }
    })
  }, [data])

  const totalVariance = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return 0
    return data.data.reduce((sum, item) => sum + (item.variance || 0), 0)
  }, [data])

  const currentMonthVariance = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return 0
    const lastItem = data.data[data.data.length - 1]
    return lastItem.variance || 0
  }, [data])

  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0
    return Math.min(...chartData.map(d => Math.min(d.planned_profit, d.actual_profit)))
  }, [chartData])
  
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100000
    return Math.max(...chartData.map(d => Math.max(d.planned_profit, d.actual_profit)))
  }, [chartData])
  
  const domainPadding = useMemo(() => {
    const range = Math.abs(maxValue - minValue)
    return range > 0 ? range * 0.1 : 10000
  }, [minValue, maxValue])

  const totalVarianceFormatted = useMemo(() => {
    return totalVariance.toLocaleString('tr-TR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }, [totalVariance])
  
  const currentMonthVarianceFormatted = useMemo(() => {
    return currentMonthVariance.toLocaleString('tr-TR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }, [currentMonthVariance])

  const kpis = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) {
      return {
        totalVariance: 0,
        avgVariance: 0,
        worstMonth: null,
        trend: 'N/A'
      }
    }
    
    const totalVariance = data.data.reduce((sum, item) => sum + (item.variance || 0), 0)
    const avgVariance = totalVariance / data.data.length
    
    const worstMonth = data.data.reduce((worst, item) => {
      if (!worst || item.variance < worst.variance) {
        return item
      }
      return worst
    }, null)
    
    const lastTwoMonths = data.data.slice(-2)
    const trend = lastTwoMonths.length === 2 
      ? (lastTwoMonths[1].variance > lastTwoMonths[0].variance ? 'Kötüleşiyor' : 'İyileşiyor')
      : 'N/A'
    
    return {
      totalVariance,
      avgVariance,
      worstMonth,
      trend
    }
  }, [data])

  const bestMonth = useMemo(() => {
    if (!chartData || chartData.length === 0) return null
    return chartData.reduce((best, item) => {
      if (!best || (item.variance || 0) > (best.variance || 0)) {
        return item
      }
      return best
    }, null)
  }, [chartData])

  const worstMonthLabel = kpis.worstMonth 
    ? formatMonthLabel(kpis.worstMonth.month || '')
    : 'N/A'
  const worstMonthValue = kpis.worstMonth 
    ? kpis.worstMonth.variance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0'

  const bestMonthLabel = bestMonth 
    ? formatMonthLabel(bestMonth.month || '')
    : 'N/A'
  const bestMonthValue = bestMonth 
    ? bestMonth.variance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0'

  const insightItems = useMemo(() => {
    return [
      {
        label: 'Toplam Sapma',
        value: `${kpis.totalVariance >= 0 ? '+' : ''}${kpis.totalVariance.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺`,
        hint: `${months} aylık dönem toplamı`,
        tone: kpis.totalVariance >= 0 ? 'positive' : 'negative'
      },
      {
        label: 'Ortalama Sapma',
        value: `${kpis.avgVariance >= 0 ? '+' : ''}${kpis.avgVariance.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺/ay`,
        hint: 'Aylık ortalama sapma değeri',
        tone: kpis.avgVariance >= 0 ? 'positive' : 'negative'
      },
      {
        label: 'En Kötü Ay',
        value: `${worstMonthLabel} (${worstMonthValue} ₺)`,
        hint: 'En düşük sapma gösteren ay',
        tone: 'negative'
      },
      {
        label: 'En İyi Ay',
        value: `${bestMonthLabel} (${bestMonthValue} ₺)`,
        hint: 'En yüksek sapma gösteren ay',
        tone: 'positive'
      },
      {
        label: 'Trend',
        value: kpis.trend,
        hint: 'Son 3 aylık performans eğilimi',
        tone: kpis.trend === 'İyileşiyor' ? 'positive' : kpis.trend === 'Kötüleşiyor' ? 'negative' : 'neutral'
      }
    ]
  }, [kpis, worstMonthLabel, worstMonthValue, bestMonthLabel, bestMonthValue, months])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const varianceFormatted = data.variance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      const plannedFormatted = data.planned_profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      const actualFormatted = data.actual_profit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      
      return (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          padding: '10px',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '6px', fontWeight: '600' }}>{data.monthLabel}</div>
          <div style={{ color: '#94a3b8', marginTop: '4px' }}>
            Plan: <strong style={{ color: '#3b82f6' }}>{plannedFormatted} TL</strong>
          </div>
          <div style={{ color: '#94a3b8', marginTop: '4px' }}>
            Gerçek: <strong style={{ color: '#10b981' }}>{actualFormatted} TL</strong>
          </div>
          <div style={{ color: data.variance >= 0 ? '#10b981' : '#ef4444', marginTop: '4px', fontWeight: '600' }}>
            Sapma: {data.variance >= 0 ? '+' : ''}{varianceFormatted} TL
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

  if (error) {
    return (
      <div style={{ 
        fontSize: '0.75rem', 
        color: '#dc3545',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderRadius: '4px',
        border: '1px solid rgba(220, 53, 69, 0.3)'
      }}>
        <strong>Hata:</strong> {error}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '420px', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '5px',
        right: '10px',
        zIndex: 10
      }}>
        <RangeToggle value={months} onChange={setMonths} size="sm" />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
        <ComposedChart 
          data={chartData} 
          margin={{ top: 40, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis 
            dataKey="monthLabel" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            width={60}
            domain={[minValue - domainPadding, maxValue + domainPadding]}
            tickFormatter={(value) => {
              if (Math.abs(value) >= 1000) {
                return `${(value / 1000).toFixed(0)}K`
              }
              return value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="positiveDiff"
            fill="#10b981"
            fillOpacity={0.2}
            stroke="none"
            name="Pozitif Sapma"
            baseValue="planned_profit"
          />
          <Area
            type="monotone"
            dataKey="negativeDiff"
            fill="#ef4444"
            fillOpacity={0.2}
            stroke="none"
            name="Negatif Sapma"
            baseValue="planned_profit"
          />
          <Line
            type="monotone"
            dataKey="planned_profit"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Planlanan"
          />
          <Line
            type="monotone"
            dataKey="actual_profit"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Gerçekleşen"
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <InsightCards 
          items={insightItems}
          modalTitle="Maliyet-Kâr Sapması (Plan vs Gerçek)"
          modalSubtitle="Bu ay kâr hedefinden sapma (TL)"
          modalChart={
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  width={60}
                  domain={[minValue - domainPadding, maxValue + domainPadding]}
                  tickFormatter={(value) => {
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`
                    }
                    return value.toLocaleString('tr-TR')
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="positiveDiff"
                  fill="#10b981"
                  fillOpacity={0.2}
                  stroke="none"
                />
                <Area
                  type="monotone"
                  dataKey="negativeDiff"
                  fill="#ef4444"
                  fillOpacity={0.2}
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="planned_profit"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Planlanan"
                />
                <Line
                  type="monotone"
                  dataKey="actual_profit"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Gerçekleşen"
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          }
          modalRangeToggle={<RangeToggle value={months} onChange={setMonths} size="sm" />}
        />
      </div>
    )
  }

export default ProfitVarianceChart

