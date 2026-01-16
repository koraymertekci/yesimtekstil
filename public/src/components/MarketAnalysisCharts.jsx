import React, { useMemo, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts'

/**
 * Profesyonel veri generator - Aylık enflasyon bazlı projeksiyon
 * @param {number} basePrice - Baz fiyat (TL)
 * @param {number} annualInflation - Yıllık enflasyon yüzdesi
 * @param {number} horizonMonths - Projeksiyon süresi (6 veya 12 ay)
 * @returns {Array} Projeksiyon veri dizisi
 */
function generateProjectionData(basePrice, annualInflation, horizonMonths = 12) {
  const data = []
  
  // Aylık enflasyon hesaplama: (1 + annualInflation)^(1/12) - 1
  const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1
  
  // Projeksiyon verisi oluştur (0. ay = bugün, 1. ay, 2. ay...)
  for (let t = 0; t <= horizonMonths; t++) {
    const periodLabel = t === 0 ? 'Baz (Bugün)' : `${t}. Ay`
    
    // Nominal fiyat: basePrice * (1 + monthlyInflation)^t
    const nominalPrice = basePrice * Math.pow(1 + monthlyInflation, t)
    
    // Reel fiyat: Bugünkü alım gücüne göre düzeltilmiş
    // Reel = basePrice / (1 + monthlyInflation)^t (enflasyonla eriyen alım gücü)
    const realPrice = basePrice / Math.pow(1 + monthlyInflation, t)
    
    // Reel kayıp yüzdesi
    const realLossPercent = ((nominalPrice - realPrice) / nominalPrice) * 100
    
    data.push({
      period: periodLabel,
      periodIndex: t,
      nominalPrice: Math.round(nominalPrice),
      realPrice: Math.round(realPrice),
      realLossPercent: Math.round(realLossPercent * 10) / 10
    })
  }
  
  return data
}

function MarketAnalysisCharts({ usd, eur, inflation, period = 12, basePrice = 1000 }) {
  // Projeksiyon verisi oluştur
  const chartData = useMemo(() => {
    return generateProjectionData(basePrice, inflation || 64.27, period)
  }, [basePrice, inflation, period])

  // Son noktadaki reel kayıp yüzdesi (durum badge için)
  const currentRealLoss = useMemo(() => {
    if (chartData.length === 0) return 0
    const lastPoint = chartData[chartData.length - 1]
    return lastPoint.realLossPercent
  }, [chartData])

  // Durum badge hesaplama
  const getStatusBadge = () => {
    if (currentRealLoss < 20) {
      return { label: 'Normal', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' }
    } else if (currentRealLoss < 35) {
      return { label: 'Uyarı', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' }
    } else {
      return { label: 'Kritik', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' }
    }
  }

  const statusBadge = getStatusBadge()

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
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    text: isDarkTheme ? '#ffffff' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    grid: isDarkTheme ? '#334155' : '#e5e7eb',
    background: isDarkTheme ? '#1e293b' : '#ffffff',
    tooltipBg: isDarkTheme ? '#0f172a' : '#ffffff',
    tooltipBorder: isDarkTheme ? '#334155' : '#e5e7eb'
  }

  // Profesyonel tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const nominal = payload.find(p => p.dataKey === 'nominalPrice')?.value || 0
      const real = payload.find(p => p.dataKey === 'realPrice')?.value || 0
      const realLoss = ((nominal - real) / nominal) * 100
      
      return (
        <div style={{
          backgroundColor: colors.tooltipBg,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '180px'
        }}>
          <p style={{ 
            margin: '0 0 8px 0', 
            color: colors.text, 
            fontWeight: '600',
            fontSize: '13px',
            borderBottom: `1px solid ${colors.grid}`,
            paddingBottom: '6px'
          }}>
            {label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: colors.primary, fontSize: '12px' }}>Nominal:</span>
              <span style={{ color: colors.text, fontSize: '12px', fontWeight: '600' }}>
                {nominal.toLocaleString('tr-TR')} TL
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: colors.secondary, fontSize: '12px' }}>Reel:</span>
              <span style={{ color: colors.text, fontSize: '12px', fontWeight: '600' }}>
                {real.toLocaleString('tr-TR')} TL
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '4px',
              paddingTop: '6px',
              borderTop: `1px solid ${colors.grid}`
            }}>
              <span style={{ color: colors.textSecondary, fontSize: '12px' }}>Reel Kaybı:</span>
              <span style={{ 
                color: realLoss > 0 ? colors.danger : colors.secondary, 
                fontSize: '12px', 
                fontWeight: '600' 
              }}>
                {realLoss > 0 ? '-' : '+'}{Math.abs(realLoss).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // TL formatı (binlik ayırıcı)
  const formatTL = (value) => {
    return value.toLocaleString('tr-TR')
  }

  return (
    <div style={{
      marginTop: '2rem'
    }}
    className="market-analysis-charts"
    >
      {/* Reel vs Nominal Fiyat Projeksiyonu */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Başlık ve Durum Badge */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '0.75rem'
        }}>
          <div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '0.5rem',
              color: colors.text
            }}>
              Reel vs Nominal Fiyat Projeksiyonu
            </h3>
            <p style={{
              fontSize: '12px',
              color: colors.textSecondary,
              margin: 0,
              lineHeight: '1.4'
            }}>
              Nominal fiyat: enflasyonla şişmiş; Reel fiyat: bugünkü alım gücüne indirgenmiş karşılık.
            </p>
          </div>
          {/* Durum Badge */}
          <div style={{
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: statusBadge.bgColor,
            border: `1px solid ${statusBadge.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusBadge.color
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: statusBadge.color
            }}>
              {statusBadge.label}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={colors.grid}
              opacity={0.5}
            />
            <XAxis 
              dataKey="period" 
              stroke={colors.textSecondary}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.textSecondary }}
            />
            <YAxis 
              stroke={colors.textSecondary}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.textSecondary }}
              tickFormatter={(value) => `${formatTL(value)} TL`}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: colors.primary, strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Legend 
              wrapperStyle={{ 
                fontSize: '13px', 
                paddingTop: '12px',
                color: colors.text
              }}
              iconType="line"
            />
            {/* Nominal Fiyat - Kalın düz çizgi */}
            <Line 
              type="monotone" 
              dataKey="nominalPrice" 
              name="Nominal Fiyat"
              stroke={colors.primary} 
              strokeWidth={3}
              dot={{ r: 4, fill: colors.primary }}
              activeDot={{ r: 6 }}
              animationDuration={300}
            />
            {/* Reel Fiyat - İnce kesikli çizgi */}
            <Line 
              type="monotone" 
              dataKey="realPrice" 
              name="Reel Fiyat"
              stroke={colors.secondary} 
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={{ r: 4, fill: colors.secondary }}
              activeDot={{ r: 6 }}
              animationDuration={300}
            />
            {/* Başlangıç noktası - Baz (Bugün) */}
            {chartData.length > 0 && chartData[0] && (
              <ReferenceDot
                x={chartData[0].period}
                y={chartData[0].nominalPrice}
                r={8}
                fill={colors.accent}
                stroke={colors.text}
                strokeWidth={2}
                label={{
                  value: 'Baz (Bugün)',
                  position: 'top',
                  fill: colors.text,
                  fontSize: '11px',
                  fontWeight: '600',
                  offset: 12
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default MarketAnalysisCharts
