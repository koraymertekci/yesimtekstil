import React, { useMemo, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

/**
 * Interpolasyon fonksiyonu: lerp(a, b, t) = a + (b - a) * t
 */
function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Smoothstep fonksiyonu: t*t*(3-2*t) - yumuşak geçiş
 */
function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

/**
 * Trend verisi üretimi - current'tan targets'a interpolasyon
 * @param {Object} current - Başlangıç değerleri { usd, eur, inf }
 * @param {Object} targets - Hedef değerler { usd, eur, inf }
 * @param {number} periodMonths - Periyot (6 veya 12 ay)
 * @returns {Array} Trend veri dizisi (Başlangıç + periodMonths nokta)
 */
function generateTrendData(current, targets, periodMonths) {
  const data = []
  const months = periodMonths || 6
  const totalPoints = months + 1 // Başlangıç + periodMonths ay
  
  // Fallback değerler
  const currentUsd = isNaN(current.usd) || current.usd === 0 ? 30 : current.usd
  const currentEur = isNaN(current.eur) || current.eur === 0 ? 30 : current.eur
  const currentInf = Number(current.inf) || 0
  
  const targetUsd = isNaN(targets.usd) || targets.usd === 0 ? currentUsd : targets.usd
  const targetEur = isNaN(targets.eur) || targets.eur === 0 ? currentEur : targets.eur
  const targetInf = Number(targets.inf) || currentInf
  
  // Dalga genlikleri (hedef-current farkına göre dinamik)
  const ampUsd = Math.max(0.15, Math.abs(targetUsd - currentUsd) * 0.08)
  const ampEur = Math.max(0.15, Math.abs(targetEur - currentEur) * 0.08)
  const ampInf = Math.max(0.4, Math.abs(targetInf - currentInf) * 0.06)
  
  // Her nokta için veri üret (0 = Başlangıç, 1..months = 1. Ay, 2. Ay, ...)
  for (let i = 0; i < totalPoints; i++) {
    let label
    if (i === 0) {
      label = 'Başlangıç (Güncel)'
    } else if (i === months) {
      label = `Hedef (${months} Ay)`
    } else {
      label = `${i}. Ay`
    }
    
    if (i === 0) {
      // Başlangıç noktası: her zaman current değerler
      data.push({
        label: label,
        usd: currentUsd,
        eur: currentEur,
        inf: currentInf
      })
    } else {
      // Sonraki noktalar: current'tan targets'a interpolasyon
      const t = i / months // 0'dan 1'e normalizasyon (i=1 için t=1/months, i=months için t=1)
      const ease = smoothstep(t) // Yumuşak geçiş için smoothstep
      
      // Dalga: sin dalgası ile küçük oynaklık (başlangıç ve son noktada 0)
      const waveFactor = (i === 0 || i === months) ? 0 : 1
      const waveUsd = Math.sin(t * Math.PI * 2) * ampUsd * waveFactor
      const waveEur = Math.sin(t * Math.PI * 2 + Math.PI / 3) * ampEur * waveFactor // EUR için faz farkı
      const waveInf = Math.sin(t * Math.PI * 2 + Math.PI / 6) * ampInf * waveFactor // Enflasyon için faz farkı
      
      // Interpolasyon + dalga
      const usdValue = lerp(currentUsd, targetUsd, ease) + waveUsd
      const eurValue = lerp(currentEur, targetEur, ease) + waveEur
      const infValue = lerp(currentInf, targetInf, ease) + waveInf
      
      // Enflasyon 0 altına düşürme
      const safeInfValue = Math.max(0, infValue)
      
      data.push({
        label: label,
        usd: Math.round(usdValue * 100) / 100,
        eur: Math.round(eurValue * 100) / 100,
        inf: Math.round(safeInfValue * 100) / 100
      })
    }
  }
  
  return data
}

// Export generateTrendData for use in parent components
export { generateTrendData }

function MarketTrendLineChart({ current, targets, period = 12 }) {
  // Veri oluştur
  const chartData = useMemo(() => {
    const safePeriod = period && (period === 6 || period === 12) ? period : 6
    const safeCurrent = current || { usd: 34.25, eur: 37.18, inf: 64.27 }
    const safeTargets = targets || { usd: 34.25, eur: 37.18, inf: 64.27 }
    return generateTrendData(safeCurrent, safeTargets, safePeriod)
  }, [current, targets, period])
  
  // Y ekseni domain hesaplama (sol eksen için USD/EUR) - Tüm noktalar dahil
  const leftYAxisDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto']
    
    const usdValues = chartData.map(d => d.usd)
    const eurValues = chartData.map(d => d.eur)
    const allValues = [...usdValues, ...eurValues]
    const minTL = Math.min(...allValues)
    const maxTL = Math.max(...allValues)
    
    // Padding hesaplama
    const range = maxTL - minTL
    const pad = range > 0 
      ? Math.max(range * 0.12, 0.5) 
      : Math.max(Math.abs(maxTL) * 0.1, 0.5)
    
    let leftMin = minTL - pad
    let leftMax = maxTL + pad
    
    // Güncel değerlere yakın başlatma - minimum çok aşağı düşmesin
    const currentUsd = usdValues[0] || (current?.usd || 34.25) // Başlangıç noktası
    const currentEur = eurValues[0] || (current?.eur || 37.18) // Başlangıç noktası
    const minCurrent = Math.min(currentUsd, currentEur)
    
    // Minimum güncelin %5 altına kadar, daha aşağı değil
    const minAllowed = minCurrent - Math.max(0.5, minCurrent * 0.05)
    leftMin = Math.max(leftMin, minAllowed)
    
    return [leftMin, leftMax]
  }, [chartData, current])
  
  // Y ekseni domain hesaplama (sağ eksen için Enflasyon) - Tüm noktalar dahil (Başlangıç dahil)
  const rightYAxisDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto']
    
    const infValues = chartData.map(d => d.inf)
    const minInf = Math.min(...infValues)
    const maxInf = Math.max(...infValues)
    const range = maxInf - minInf
    const pad = range > 0 ? range * 0.15 : Math.abs(maxInf) * 0.1 || 1
    
    const minInfPad = Math.max(0, minInf - pad)
    const maxInfPad = maxInf + pad
    
    return [minInfPad, maxInfPad]
  }, [chartData])
  
  // Tema renkleri
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  
  useEffect(() => {
    const checkTheme = () => {
      const app = document.querySelector('.app')
      setIsDarkTheme(app?.classList.contains('dark-theme') || false)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    const app = document.querySelector('.app')
    if (app) {
      observer.observe(app, { attributes: true, attributeFilter: ['class'] })
    }
    return () => observer.disconnect()
  }, [])
  
  const colors = {
    usd: '#3b82f6',      // Mavi
    eur: '#10b981',      // Yeşil
    inflation: '#f59e0b', // Turuncu
    text: isDarkTheme ? '#ffffff' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    grid: isDarkTheme ? '#475569' : '#e5e7eb',
    background: isDarkTheme ? '#0b1220' : '#f8f9fa',
    tooltipBg: isDarkTheme ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkTheme ? '#334155' : '#e5e7eb'
  }
  
  // Custom tooltip - 3 değer gösterir
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const usdValue = payload.find(p => p.dataKey === 'usd')?.value || 0
      const eurValue = payload.find(p => p.dataKey === 'eur')?.value || 0
      const infValue = payload.find(p => p.dataKey === 'inf')?.value || 0
      
      return (
        <div style={{
          backgroundColor: colors.tooltipBg,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: '6px',
          padding: '10px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          minWidth: '180px'
        }}>
          <p style={{ 
            margin: '0 0 8px 0', 
            color: colors.text, 
            fontWeight: '600', 
            fontSize: '12px',
            borderBottom: `1px solid ${colors.grid}`,
            paddingBottom: '6px'
          }}>
            {label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: colors.usd, fontSize: '12px', fontWeight: '500' }}>USD/TRY:</span>
              <span style={{ color: colors.text, fontSize: '12px', fontWeight: '600' }}>
                {usdValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: colors.eur, fontSize: '12px', fontWeight: '500' }}>EUR/TRY:</span>
              <span style={{ color: colors.text, fontSize: '12px', fontWeight: '600' }}>
                {eurValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: colors.inflation, fontSize: '12px', fontWeight: '500' }}>Enflasyon:</span>
              <span style={{ color: colors.text, fontSize: '12px', fontWeight: '600' }}>
                %{infValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
      {/* Başlık ve Periyot Etiketi */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          margin: 0,
          color: colors.text
        }}>
          Piyasa Trend Grafiği
        </h3>
        {/* Periyot Etiketi */}
        <span style={{
          fontSize: '0.75rem',
          color: colors.textSecondary,
          padding: '0.25rem 0.75rem',
          backgroundColor: isDarkTheme ? '#1e293b' : '#f8f9fa',
          borderRadius: '4px',
          border: `1px solid ${colors.grid}`
        }}>
          {period || 6} Ay
        </span>
      </div>
      
      {/* Grafik */}
      <div style={{ 
        backgroundColor: colors.background,
        borderRadius: '8px',
        padding: '1rem',
        overflow: 'visible',
        position: 'relative'
      }}>
        <ResponsiveContainer width="100%" height={300} style={{ overflow: 'visible' }}>
          <LineChart 
            data={chartData}
            margin={{ top: 10, right: 140, left: 10, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={colors.grid}
              opacity={0.35}
              horizontal={true}
              vertical={true}
            />
            <XAxis 
              dataKey="label" 
              stroke={colors.textSecondary}
              tick={{ fill: colors.textSecondary, fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            {/* Sol Y Ekseni - TL label kaldırıldı */}
            <YAxis 
              yAxisId="left"
              stroke={colors.textSecondary}
              tick={{ fill: colors.textSecondary, fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              domain={leftYAxisDomain}
              allowDecimals={true}
              tickCount={6}
              tickFormatter={(value) => {
                return value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })
              }}
            />
            {/* Sağ Y Ekseni - % */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke={colors.textSecondary}
              tick={{ fill: colors.textSecondary, fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              domain={rightYAxisDomain}
              tickFormatter={(value) => {
                return `%${value.toFixed(1)}`
              }}
              label={{
                value: '%',
                angle: 90,
                position: 'insideRight',
                fill: colors.textSecondary,
                style: { fontSize: '12px', textAnchor: 'middle' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                fontSize: '13px', 
                paddingTop: '12px',
                color: colors.text
              }}
              iconType="line"
            />
            {/* USD/TRY Çizgisi */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="usd" 
              name="USD/TRY"
              stroke={colors.usd} 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: colors.usd, stroke: colors.text, strokeWidth: 2 }}
              animationDuration={300}
            />
            {/* EUR/TRY Çizgisi */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="eur" 
              name="EUR/TRY"
              stroke={colors.eur} 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: colors.eur, stroke: colors.text, strokeWidth: 2 }}
              animationDuration={300}
            />
            {/* Enflasyon Çizgisi */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="inf" 
              name="Enflasyon (%)"
              stroke={colors.inflation} 
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={false}
              activeDot={{ r: 6, fill: colors.inflation, stroke: colors.text, strokeWidth: 2 }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default MarketTrendLineChart
