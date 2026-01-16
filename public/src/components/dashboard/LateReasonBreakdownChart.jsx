import React, { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getLateReasonBreakdown } from '../../api/charts.api'
import RangeToggle from '../ui/RangeToggle'
import InsightCards from './InsightCards'

function LateReasonBreakdownChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024)
  const [months, setMonths] = useState(6)

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const days = months === 6 ? 180 : 360

  const generateMockData = (daysCount = 180) => {
    const baseTotal = daysCount === 180 ? 200 : 400
    const total = Math.floor(Math.random() * (baseTotal * 0.3)) + baseTotal
    
    const reasons = [
      { reason: 'Hammadde', weight: 0.32 },
      { reason: 'Makine Arızası', weight: 0.23 },
      { reason: 'Kalite Kontrol', weight: 0.15 },
      { reason: 'Planlama/Kapasite', weight: 0.13 },
      { reason: 'İş Gücü', weight: 0.10 },
      { reason: 'Lojistik', weight: 0.07 }
    ]
    
    const items = reasons.map(r => ({
      reason: r.reason,
      count: Math.round(total * r.weight)
    }))
    
    const actualTotal = items.reduce((sum, item) => sum + item.count, 0)
    const diff = total - actualTotal
    
    if (diff !== 0) {
      items[0].count += diff
    }
    
    return {
      days: daysCount,
      total_late_orders: total,
      items: items
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsMock(false)
        const result = await getLateReasonBreakdown(days)
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
        
        console.error('LateReasonBreakdownChart error:', {
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

  const chartData = useMemo(() => {
    if (!data || !data.items || data.items.length === 0) return []
    
    return data.items.map((item) => ({
      name: item.reason,
      value: item.count
    }))
  }, [data])

  const totalLateOrders = useMemo(() => {
    if (!data) return 0
    return data.total_late_orders || 0
  }, [data])

  const topReason = useMemo(() => {
    if (!data || !data.items || data.items.length === 0) return null
    const sorted = [...data.items].sort((a, b) => b.count - a.count)
    return sorted[0]
  }, [data])

  const topReasonPercentage = useMemo(() => {
    if (!topReason || totalLateOrders === 0) return 0
    return Math.round((topReason.count / totalLateOrders) * 100)
  }, [topReason, totalLateOrders])

  const topTwoReasons = useMemo(() => {
    if (!data || !data.items || data.items.length === 0) return { total: 0, count: 0 }
    const sorted = [...data.items].sort((a, b) => b.count - a.count)
    const topTwo = sorted.slice(0, 2)
    const total = topTwo.reduce((sum, item) => sum + item.count, 0)
    return {
      total,
      count: topTwo.length,
      percentage: totalLateOrders > 0 ? Math.round((total / totalLateOrders) * 100) : 0
    }
  }, [data, totalLateOrders])

  const kpis = useMemo(() => {
    return {
      totalLate: totalLateOrders,
      topReason: topReason?.reason || 'N/A',
      topReasonPercentage,
      topTwoPercentage: topTwoReasons.percentage,
      top2ReasonsShare: topTwoReasons.percentage,
      diversity: data?.items?.length || 0
    }
  }, [totalLateOrders, topReason, topReasonPercentage, topTwoReasons, data])

  const totalFormatted = totalLateOrders.toLocaleString('tr-TR')

  const insightItems = useMemo(() => {
    return [
      {
        label: 'Toplam Gecikme',
        value: `${kpis.totalLate.toLocaleString('tr-TR')} adet`,
        hint: `${months === 6 ? '6 aylık' : '12 aylık'} dönem toplamı`,
        tone: 'info'
      },
      {
        label: 'En Büyük Neden',
        value: `${kpis.topReason} (%${kpis.topReasonPercentage})`,
        hint: 'En yüksek paya sahip gecikme nedeni',
        tone: 'warning'
      },
      {
        label: 'İlk 2 Neden Payı',
        value: `%${kpis.topTwoPercentage}`,
        hint: 'Toplam gecikmenin yüzdesi',
        tone: 'info'
      },
      {
        label: 'Çeşitlilik',
        value: `${kpis.diversity} neden`,
        hint: 'Farklı gecikme nedeni sayısı',
        tone: 'neutral'
      }
    ]
  }, [kpis, months])

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = chartData.reduce((sum, item) => sum + item.value, 0)
      const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0
      
      return (
        <div style={{
          backgroundColor: 'var(--card-bg, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          padding: '10px',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: '600', color: '#fff' }}>
            {data.name}: <span style={{ color: '#3b82f6' }}>{data.value}</span> adet (<span style={{ color: '#10b981' }}>%{percentage}</span>)
          </div>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }) => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0)
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '11px',
        padding: '4px 0',
        width: '100%'
      }}>
        {payload.map((entry, index) => {
          const item = chartData.find(d => d.name === entry.value)
          const percentage = total > 0 ? Math.round((item?.value || 0) / total * 100) : 0
          const truncatedName = truncateText(entry.value, 14)
          
          return (
            <div
              key={`legend-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              title={entry.value !== truncatedName ? entry.value : ''}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: entry.color,
                  borderRadius: '2px',
                  flexShrink: 0
                }}
              />
              <span style={{ color: '#94a3b8', flex: '1 1 auto', minWidth: 0 }}>{truncatedName}</span>
              <span style={{ color: '#10b981', fontWeight: '600', flexShrink: 0, marginLeft: '4px' }}>%{percentage}</span>
              <span style={{ color: '#fff', fontWeight: '500', flexShrink: 0, marginLeft: '4px' }}>({item?.value || 0})</span>
            </div>
          )
        })}
      </div>
    )
  }

  const truncateText = (text, maxLength = 14) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
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

  if (!data || chartData.length === 0) {
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
      {isMock && (
        <div style={{
          position: 'absolute',
          top: '5px',
          left: '10px',
          fontSize: '0.6rem',
          color: 'rgba(148, 163, 184, 0.6)',
          zIndex: 10,
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '3px 6px',
          borderRadius: '3px'
        }}>
          Mock veri gösteriliyor
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: '5px',
        right: '10px',
        zIndex: 10
      }}>
        <RangeToggle value={months} onChange={setMonths} size="sm" />
      </div>
      <div style={{
        display: 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        width: '100%',
        flex: 1,
        minHeight: 0,
        gap: '16px',
        paddingTop: '40px'
      }}>
        <div style={{
          flex: isDesktop ? '1 1 60%' : '1 1 auto',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          height: isDesktop ? '100%' : '60%'
        }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={isDesktop ? 100 : 80}
                innerRadius={isDesktop ? 20 : 15}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{
          flex: isDesktop ? '1 1 40%' : '1 1 auto',
          minWidth: 0,
          display: 'flex',
          alignItems: isDesktop ? 'center' : 'flex-start',
          justifyContent: 'flex-start',
          paddingLeft: isDesktop ? '8px' : '0',
          paddingTop: isDesktop ? '0' : '8px',
          height: isDesktop ? '100%' : 'auto',
          maxHeight: isDesktop ? '100%' : '40%',
          overflowY: isDesktop ? 'auto' : 'visible'
        }}>
          <CustomLegend payload={chartData.map((item, index) => ({
            value: item.name,
            color: COLORS[index % COLORS.length]
          }))} />
        </div>
      </div>
          <InsightCards 
            items={insightItems}
            modalTitle="Gecikme Neden Dağılımı"
        modalSubtitle="Son 30 gün geciken siparişlerin neden kırılımı"
        modalChart={
          <div style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            width: '100%',
            height: '100%',
            gap: '16px',
            paddingTop: '20px'
          }}>
            <div style={{
              flex: isDesktop ? '1 1 60%' : '1 1 auto',
              minWidth: 0,
              minHeight: 0,
              overflow: 'hidden',
              height: isDesktop ? '100%' : '60%'
            }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={isDesktop ? 120 : 100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{
              flex: isDesktop ? '1 1 40%' : '1 1 auto',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <CustomLegend payload={chartData.map((item, index) => ({
                value: item.name,
                color: COLORS[index % COLORS.length]
              }))} />
            </div>
          </div>
        }
        modalRangeToggle={<RangeToggle value={months} onChange={setMonths} size="sm" />}
      />
    </div>
  )
}

export default LateReasonBreakdownChart

