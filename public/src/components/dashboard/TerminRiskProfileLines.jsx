import React, { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getTerminRiskProfile } from '../../api/charts.api'
import RangeToggle from '../ui/RangeToggle'
import InsightCards from './InsightCards'

function TerminRiskProfileLines() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [months, setMonths] = useState(6)

  const days = months === 6 ? 180 : 360

  const generateMockData = (daysCount = 180) => {
    const metrics = [
      { key: 'avg_delay', label: 'Ortalama Gecikme' },
      { key: 'late_rate', label: 'Geciken Oran' },
      { key: 'high_risk', label: 'Yüksek Risk Payı' },
      { key: 'stage_delay', label: 'Aşama Gecikmesi' },
      { key: 'capacity', label: 'Kapasite Baskısı' },
      { key: 'material', label: 'Hammadde Etkisi' }
    ]
    
    const metricsData = metrics.map((metric, index) => {
      const baseValue30 = 70 + (index * 2)
      const baseValue60 = 60 + (index * 1.5)
      const baseValue90 = 50 + (index * 1)
      
      const w30 = Math.max(0, Math.min(100, baseValue30 + (Math.random() - 0.5) * 10))
      const w60 = Math.max(0, Math.min(100, baseValue60 + (Math.random() - 0.5) * 8))
      const w90 = Math.max(0, Math.min(100, baseValue90 + (Math.random() - 0.5) * 6))
      
      return {
        key: metric.key,
        label: metric.label,
        w30: Math.round(w30),
        w60: Math.round(w60),
        w90: Math.round(w90)
      }
    })
    
    return {
      metrics: metricsData
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsMock(false)
        const result = await getTerminRiskProfile('30,60,90')
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
        
        console.error('TerminRiskProfileLines error:', {
          message: errorMsg,
          error: err,
          status: err?.status || err?.response?.status,
          is404: err?.is404
        })
        
        if (err?.is404 || err?.status >= 500) {
          const mockData = generateMockData(days)
          setData(mockData)
          setIsMock(true)
          setError(null)
        } else {
          setError(errorMsg)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [days])

  const barData = useMemo(() => {
    if (!data || !data.metrics) return []
    
    return data.metrics.map(metric => {
      let w30 = 0
      let w60 = 0
      let w90 = 0
      
      if (metric.points && Array.isArray(metric.points) && metric.points.length > 0) {
        const latestPoint = metric.points[metric.points.length - 1]
        w30 = latestPoint.w30 || 0
        w60 = latestPoint.w60 || 0
        w90 = latestPoint.w90 || 0
      } else if (metric.w30 !== undefined) {
        w30 = metric.w30
        w60 = metric.w60 || 0
        w90 = metric.w90 || 0
      }
      
      return {
        name: metric.label || metric.name,
        'Son 30 Gün': Math.max(0, Math.min(100, w30)),
        'Son 60 Gün': Math.max(0, Math.min(100, w60)),
        'Son 90 Gün': Math.max(0, Math.min(100, w90))
      }
    })
  }, [data])

  const kpis = useMemo(() => {
    if (!barData || barData.length === 0) {
      return {
        highestWindow: 'Son 30 Gün',
        criticalMetric: null,
        riskDifference: 0,
        summary: 'Veri yetersiz'
      }
    }
    
    let max30 = 0
    let max60 = 0
    let max90 = 0
    let avg30 = 0
    let avg90 = 0
    
    barData.forEach(item => {
      const val30 = item['Son 30 Gün'] || 0
      const val60 = item['Son 60 Gün'] || 0
      const val90 = item['Son 90 Gün'] || 0
      
      max30 = Math.max(max30, val30)
      max60 = Math.max(max60, val60)
      max90 = Math.max(max90, val90)
      avg30 += val30
      avg90 += val90
    })
    
    avg30 = barData.length > 0 ? avg30 / barData.length : 0
    avg90 = barData.length > 0 ? avg90 / barData.length : 0
    
    const highestWindow = max30 >= max60 && max30 >= max90 ? 'Son 30 Gün' 
      : max60 >= max90 ? 'Son 60 Gün' 
      : 'Son 90 Gün'
    
    let criticalMetric = null
    let maxValue = 0
    
    barData.forEach(item => {
      const value30 = item['Son 30 Gün'] || 0
      if (value30 > maxValue) {
        maxValue = value30
        criticalMetric = item.name
      }
    })
    
    const riskDifference = Math.round((avg30 - avg90) * 10) / 10
    const summary = riskDifference > 5 ? 'Risk artıyor' : riskDifference < -5 ? 'Risk azalıyor' : 'Risk stabil'
    
    return {
      highestWindow,
      criticalMetric,
      riskDifference,
      summary
    }
  }, [barData])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
            {label}
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
                <strong style={{ color: entry.color, fontSize: '12px' }}>{entry.value}</strong>
              </div>
            ))}
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
        textAlign: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderRadius: '4px',
        border: '1px solid rgba(220, 53, 69, 0.3)'
      }}>
        <strong>Hata:</strong> {error}
      </div>
    )
  }

  if (!barData || barData.length === 0) {
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
    <div style={{ 
      width: '100%', 
      height: '420px',
      position: 'relative', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            Son 30 / 60 / 90 gün risk profili kıyaslaması
          </div>
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
        </div>
        <RangeToggle value={months} onChange={setMonths} size="sm" />
      </div>
      
      <div style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
          <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconSize={10}
            />
            <Bar 
              dataKey="Son 30 Gün" 
              fill="#3b82f6" 
              name="Son 30 Gün"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="Son 60 Gün" 
              fill="#ef4444" 
              name="Son 60 Gün"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="Son 90 Gün" 
              fill="#f59e0b" 
              name="Son 90 Gün"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
          <InsightCards 
            items={[
              {
                label: 'En Riskli Pencere',
                value: kpis.highestWindow,
                hint: 'Ortalama skoru en yüksek pencere',
                tone: 'negative'
              },
              {
                label: 'En Kritik Metrik',
                value: kpis.criticalMetric || 'N/A',
                hint: 'Son 30 günde en yüksek risk metrik',
                tone: 'warning'
              },
              {
                label: 'Risk Farkı (30-90)',
                value: `${kpis.riskDifference >= 0 ? '+' : ''}${kpis.riskDifference}`,
                hint: 'Ortalama risk farkı',
                tone: kpis.riskDifference > 5 ? 'negative' : 'neutral'
              },
              {
                label: 'Özet',
                value: kpis.summary || 'Veri yetersiz',
                hint: 'Risk analizi özeti',
                tone: 'info'
              }
            ]}
            modalTitle="Termin Risk Profili Karşılaştırması"
        modalSubtitle="Son 30 / 60 / 90 gün risk profili kıyaslaması"
        modalChart={
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconSize={10}
              />
              <Bar 
                dataKey="Son 30 Gün" 
                fill="#3b82f6" 
                name="Son 30 Gün"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Son 60 Gün" 
                fill="#ef4444" 
                name="Son 60 Gün"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Son 90 Gün" 
                fill="#f59e0b" 
                name="Son 90 Gün"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        }
        modalRangeToggle={<RangeToggle value={months} onChange={setMonths} size="sm" />}
      />
    </div>
  )
}

export default TerminRiskProfileLines
