import React, { useState, useEffect, useMemo } from 'react'
import { getOtifHeatmap } from '../../api/charts.api'
import RangeToggle from '../ui/RangeToggle'

function OtifTrendChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [months, setMonths] = useState(6)
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsMock(false)
        
        const result = await getOtifHeatmap(months)
        
        if (result && result.rows && Array.isArray(result.rows) && result.rows.length > 0) {
          setData(result)
        } else {
          throw new Error('Veri formatı hatalı')
        }
      } catch (err) {
        console.error('OtifTrendChart error:', err)
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
    const weeksCount = rangeMonths === 12 ? 52 : 26
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const getWeekNumber = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
      return `2025-W${String(weekNum).padStart(2, '0')}`
    }
    
    const lines = [
      { name: 'Dokuma', baseOtif: 94, volatility: 3, seasonal: 0.5 },
      { name: 'Örme', baseOtif: 92, volatility: 4, seasonal: 0.6 },
      { name: 'Boya', baseOtif: 88, volatility: 6, seasonal: 0.8 },
      { name: 'Terbiye', baseOtif: 90, volatility: 5, seasonal: 0.7 },
      { name: 'Kesim', baseOtif: 95, volatility: 2, seasonal: 0.3 },
      { name: 'Dikim', baseOtif: 93, volatility: 3, seasonal: 0.4 },
      { name: 'Paketleme', baseOtif: 96, volatility: 1.5, seasonal: 0.2 },
      { name: 'Lojistik', baseOtif: 91, volatility: 4, seasonal: 0.5 }
    ]
    
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (weeksCount * 7))
    
    const allWeeks = []
    let currentWeek = new Date(startDate)
    while (currentWeek <= today) {
      allWeeks.push(getWeekNumber(currentWeek))
      currentWeek.setDate(currentWeek.getDate() + 7)
    }
    
    const rows = lines.map(line => {
      const weeks = allWeeks.map((week, weekIndex) => {
        const seasonalFactor = Math.sin((weekIndex / weeksCount) * Math.PI * 2) * line.seasonal
        const randomFactor = (Math.random() - 0.5) * line.volatility
        let otif = line.baseOtif + seasonalFactor + randomFactor
        
        if (Math.random() < 0.05) {
          otif = Math.max(75, otif - 5)
        }
        
        otif = Math.max(80, Math.min(99, otif))
        const total = Math.floor(Math.random() * 140) + 120
        const late = Math.round(total * (100 - otif) / 100)
        
        return {
          week: week,
          otif: Math.round(otif * 10) / 10,
          late: late,
          total: total
        }
      })
      
      return {
        name: line.name,
        weeks: weeks
      }
    })
    
    return {
      rangeMonths: rangeMonths,
      target: 95,
      rows: rows
    }
  }

  const getCellColor = (otif) => {
    if (otif === null || otif === undefined) {
      return { backgroundColor: 'rgba(30, 41, 59, 0.5)', opacity: 0.3 }
    }
    
    if (otif < 90) {
      const intensity = (otif - 75) / 15
      return { backgroundColor: '#ef4444', opacity: Math.max(0.4, Math.min(1, 0.4 + intensity * 0.6)) }
    } else if (otif < 95) {
      const intensity = (otif - 90) / 5
      return { backgroundColor: '#f59e0b', opacity: Math.max(0.4, Math.min(1, 0.4 + intensity * 0.6)) }
    } else {
      const intensity = (otif - 95) / 4
      return { backgroundColor: '#10b981', opacity: Math.max(0.4, Math.min(1, 0.4 + intensity * 0.6)) }
    }
  }

  const kpis = useMemo(() => {
    if (!data || !data.rows || data.rows.length === 0) {
      return {
        averageOtif: 0,
        distanceToTarget: 0,
        worstLine: null
      }
    }

    let totalOtif = 0
    let totalCount = 0
    let worstLine = null
    let worstOtif = 100

    data.rows.forEach(row => {
      row.weeks.forEach(week => {
        if (week.otif !== null && week.otif !== undefined) {
          totalOtif += week.otif
          totalCount += 1
          
          if (week.otif < worstOtif) {
            worstOtif = week.otif
            worstLine = { name: row.name, otif: week.otif }
          }
        }
      })
    })

    const averageOtif = totalCount > 0 ? totalOtif / totalCount : 0
    const target = data.target || 95
    const distanceToTarget = averageOtif - target

    return {
      averageOtif: Math.round(averageOtif * 10) / 10,
      distanceToTarget: Math.round(distanceToTarget * 10) / 10,
      worstLine: worstLine
    }
  }, [data])

  const analysis = useMemo(() => {
    if (!data || !data.rows || data.rows.length === 0) {
      return { worstDecline: null, belowTargetWeeks: 0 }
    }

    const last4Weeks = data.rows.flatMap(row => 
      row.weeks.slice(-4).map(w => ({ line: row.name, week: w }))
    )
    
    let worstDecline = null
    let maxDecline = 0
    const target = data.target || 95

    data.rows.forEach(row => {
      if (row.weeks.length >= 4) {
        const first4Avg = row.weeks.slice(0, 4).reduce((sum, w) => sum + (w.otif || 0), 0) / 4
        const last4Avg = row.weeks.slice(-4).reduce((sum, w) => sum + (w.otif || 0), 0) / 4
        const decline = first4Avg - last4Avg
        
        if (decline > maxDecline) {
          maxDecline = decline
          worstDecline = { name: row.name, decline: decline }
        }
      }
    })

    let belowTargetCount = 0
    data.rows.forEach(row => {
      row.weeks.forEach(week => {
        if (week.otif !== null && week.otif < target) {
          belowTargetCount += 1
        }
      })
    })

    return {
      worstDecline: worstDecline,
      belowTargetWeeks: belowTargetCount
    }
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

  if (!data || !data.rows || data.rows.length === 0) {
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

  const allWeeks = data.rows[0]?.weeks?.map(w => w.week) || []

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          Haftalık OTIF performansı — hat/ürün grubu bazında erken uyarı
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
          <RangeToggle value={months} onChange={setMonths} size="sm" />
        </div>
      </div>

      {/* KPI Chips */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '0.7rem',
        flexShrink: 0
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          padding: '4px 10px',
          borderRadius: '4px'
        }}>
          <span style={{ color: '#94a3b8' }}>Ortalama OTIF:</span>
          <span style={{ color: '#3b82f6', fontWeight: '600' }}>
            {kpis.averageOtif}%
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          padding: '4px 10px',
          borderRadius: '4px'
        }}>
          <span style={{ color: '#94a3b8' }}>Hedefe Uzaklık:</span>
          <span style={{ color: kpis.distanceToTarget >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
            {kpis.distanceToTarget >= 0 ? '+' : ''}{kpis.distanceToTarget}%
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          padding: '4px 10px',
          borderRadius: '4px'
        }}>
          <span style={{ color: '#94a3b8' }}>En Kötü Hat:</span>
          <span style={{ color: '#ef4444', fontWeight: '600' }}>
            {kpis.worstLine?.name || 'N/A'} ({kpis.worstLine?.otif || 0}%)
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px repeat(auto-fit, 20px)',
          gap: '2px',
          minWidth: 'max-content'
        }}>
          {/* Header Row */}
          <div style={{
            position: 'sticky',
            left: 0,
            zIndex: 2,
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            padding: '6px 8px',
            fontSize: '9px',
            color: '#94a3b8',
            fontWeight: '600',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            Hat/Grup
          </div>
          {allWeeks.map((week, idx) => (
            <div
              key={week}
              style={{
                padding: '6px 4px',
                fontSize: '8px',
                color: '#94a3b8',
                textAlign: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                writingMode: idx % 4 === 0 ? 'horizontal-tb' : 'vertical-rl',
                textOrientation: 'mixed'
              }}
            >
              {idx % 4 === 0 ? week.split('-W')[1] : ''}
            </div>
          ))}

          {/* Data Rows */}
          {data.rows.map((row, rowIdx) => (
            <React.Fragment key={row.name}>
              <div style={{
                position: 'sticky',
                left: 0,
                zIndex: 1,
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                padding: '8px',
                fontSize: '10px',
                color: '#fff',
                fontWeight: '500',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {row.name}
              </div>
              {row.weeks.map((week, weekIdx) => {
                const color = getCellColor(week.otif)
                return (
                  <div
                    key={`${row.name}-${week.week}`}
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: color.backgroundColor,
                      opacity: color.opacity,
                      borderRadius: '2px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = color.opacity
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                    title={`Hat: ${row.name} — Hafta: ${week.week} — OTIF: %${week.otif || 'N/A'} — Geç teslim: ${week.late || 0} / Toplam: ${week.total || 0}`}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Analysis Text */}
      <div style={{
        fontSize: '0.65rem',
        color: '#94a3b8',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        {analysis.worstDecline && (
          <span>
            Son 4 haftada en çok düşüş: <strong style={{ color: '#ef4444' }}>{analysis.worstDecline.name}</strong> ({analysis.worstDecline.decline >= 0 ? '+' : ''}{analysis.worstDecline.decline.toFixed(1)} puan), 
          </span>
        )}
        <span style={{ marginLeft: analysis.worstDecline ? '8px' : '0' }}>
          hedef altı hafta sayısı: <strong style={{ color: '#f59e0b' }}>{analysis.belowTargetWeeks}</strong>
        </span>
      </div>
    </div>
  )
}

export default OtifTrendChart
