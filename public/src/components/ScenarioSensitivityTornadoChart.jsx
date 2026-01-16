import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import '../App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function ScenarioSensitivityTornadoChart({
  selectedMaterial = null,
  unitPrice = 0,
  unitCurrency = 'TRY',
  usdTry = 34.25,
  eurTry = 37.18,
  inflationRate = 0,
  months = 12,
  year = null
}) {
  const chartRef = useRef(null)
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
    positive: '#10b981', // Yeşil - pozitif etki
    negative: '#ef4444', // Kırmızı - negatif etki
    text: isDarkTheme ? '#ffffff' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    grid: isDarkTheme ? '#475569' : '#e5e7eb',
    background: isDarkTheme ? '#0b1220' : '#f8f9fa',
    tooltipBg: isDarkTheme ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkTheme ? '#334155' : '#e5e7eb'
  }

  // Baseline hesap (mevcut mantık)
  const calculateEndCost = (price, currency, usd, eur, inflation, periodMonths) => {
    const priceNum = parseFloat(price) || 0
    // 0 değeri geçerlidir, negatif değerler için 0 dön
    if (priceNum < 0 || !isFinite(priceNum)) return 0

    // Birim fiyatı TRY'ye çevir
    let priceTRY = priceNum
    if (currency === 'USD') {
      priceTRY = priceNum * usd
    } else if (currency === 'EUR') {
      priceTRY = priceNum * eur
    }

    // Aylık enflasyon oranı
    const monthlyRate = Math.pow(1 + inflation / 100, 1 / 12) - 1

    // Dönem sonu birim maliyet (0 değeri için de çalışır)
    const endCost = priceTRY * Math.pow(1 + monthlyRate, periodMonths)

    return endCost
  }

  // Tornado data hesaplama
  const tornadoData = useMemo(() => {
    const unitPriceNum = parseFloat(unitPrice) || 0
    const usdTryNum = parseFloat(usdTry) || 34.25
    const eurTryNum = parseFloat(eurTry) || 37.18
    const inflationPct = parseFloat(inflationRate) || 0
    const monthsNum = parseInt(months) || 12

    // 0 değeri geçerlidir, negatif değerler reddedilir
    if (unitPriceNum < 0 || !isFinite(unitPriceNum)) {
      return null
    }

    // Baseline hesap
    const baseline = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum,
      eurTryNum,
      inflationPct,
      monthsNum
    )

    const unitLabel = selectedMaterial?.unit || 'kg'

    // Her parametre için ±10% şok ve etki hesapla
    const impacts = []

    // 1. Birim Fiyat (±10%)
    const priceUp = calculateEndCost(
      unitPriceNum * 1.1,
      unitCurrency,
      usdTryNum,
      eurTryNum,
      inflationPct,
      monthsNum
    )
    const priceDown = calculateEndCost(
      unitPriceNum * 0.9,
      unitCurrency,
      usdTryNum,
      eurTryNum,
      inflationPct,
      monthsNum
    )
    impacts.push({
      label: 'Birim Fiyat',
      positive: priceUp - baseline,
      negative: priceDown - baseline,
      active: true
    })

    // 2. USD/TRY (±10%)
    const usdUp = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum * 1.1,
      eurTryNum,
      inflationPct,
      monthsNum
    )
    const usdDown = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum * 0.9,
      eurTryNum,
      inflationPct,
      monthsNum
    )
    impacts.push({
      label: 'USD/TRY',
      positive: usdUp - baseline,
      negative: usdDown - baseline,
      active: unitCurrency === 'USD'
    })

    // 3. EUR/TRY (±10%)
    const eurUp = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum,
      eurTryNum * 1.1,
      inflationPct,
      monthsNum
    )
    const eurDown = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum,
      eurTryNum * 0.9,
      inflationPct,
      monthsNum
    )
    impacts.push({
      label: 'EUR/TRY',
      positive: eurUp - baseline,
      negative: eurDown - baseline,
      active: unitCurrency === 'EUR'
    })

    // 4. Enflasyon Oranı (±10%)
    const infUp = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum,
      eurTryNum,
      inflationPct * 1.1,
      monthsNum
    )
    const infDown = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum,
      eurTryNum,
      inflationPct * 0.9,
      monthsNum
    )
    impacts.push({
      label: 'Enflasyon Oranı',
      positive: infUp - baseline,
      negative: infDown - baseline,
      active: true
    })

    // 5. Ay Sayısı (6 ↔ 12) etkisi
    const altMonths = monthsNum === 12 ? 6 : 12
    const monthsAlt = calculateEndCost(
      unitPriceNum,
      unitCurrency,
      usdTryNum,
      eurTryNum,
      inflationPct,
      altMonths
    )
    const monthsDiff = monthsAlt - baseline
    impacts.push({
      label: `Dönem (${altMonths} Ay)`,
      positive: monthsDiff > 0 ? monthsDiff : 0,
      negative: monthsDiff < 0 ? monthsDiff : 0,
      active: true,
      isSwitch: true
    })

    // En yüksek 2 etkiyi bul (mutlak değere göre)
    const allImpacts = impacts.flatMap(imp => [
      { label: imp.label, value: Math.abs(imp.positive), isPositive: true, impact: imp },
      { label: imp.label, value: Math.abs(imp.negative), isPositive: false, impact: imp }
    ]).filter(item => item.value > 0.01)

    allImpacts.sort((a, b) => b.value - a.value)
    const topImpacts = allImpacts.slice(0, 2)

    return {
      baseline,
      impacts,
      topImpacts,
      unitLabel
    }
  }, [selectedMaterial, unitPrice, unitCurrency, usdTry, eurTry, inflationRate, months])

  if (!tornadoData || tornadoData.baseline < 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: 0,
          marginBottom: '0.5rem',
          color: colors.text
        }}>
          Maliyet Hassasiyeti
        </h3>
        <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
          Grafik için hammadde ve fiyat bilgilerini girin.
        </p>
      </div>
    )
  }

  const formatTL = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // Chart data hazırlama (Tornado: her parametre için tek bar, pozitif sağa, negatif sola)
  const labels = tornadoData.impacts.map(imp => {
    if (!imp.active && !imp.isSwitch) {
      return `${imp.label} (etkisiz)`
    }
    return imp.label
  })

  // Her parametre için net etki (pozitif veya negatif)
  const netImpactData = tornadoData.impacts.map(imp => {
    // Pozitif etkiyi pozitif, negatif etkiyi negatif olarak göster
    // Tornado chart'ta genellikle en büyük mutlak değer gösterilir
    const absPositive = Math.abs(imp.positive)
    const absNegative = Math.abs(imp.negative)
    
    // Hangisi daha büyükse onu göster (pozitif sağa, negatif sola)
    if (absPositive > absNegative) {
      return imp.positive
    } else {
      return imp.negative
    }
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Etki',
        data: netImpactData,
        backgroundColor: netImpactData.map((value, index) => {
          return value >= 0 ? colors.positive : colors.negative
        }),
        borderColor: netImpactData.map((value, index) => {
          return value >= 0 ? colors.positive : colors.negative
        }),
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    indexAxis: 'y', // Horizontal bar
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return context[0].label
          },
          label: function(context) {
            const value = context.parsed.x || 0
            const impact = tornadoData.impacts[context.dataIndex]
            const baseline = tornadoData.baseline
            const newCost = baseline + value
            
            const isPositive = value >= 0
            const shockLabel = isPositive ? '+10%' : '-10%'
            
            return [
              `Şok: ${shockLabel}`,
              `Yeni Maliyet: ${formatTL(newCost)} TL/${tornadoData.unitLabel}`,
              `Etki: ${isPositive ? '+' : ''}${formatTL(value)} TL/${tornadoData.unitLabel}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Etki (TL/${tornadoData.unitLabel})`,
          color: colors.textSecondary,
          font: {
            size: 12
          }
        },
        grid: {
          color: colors.grid,
          opacity: 0.2
        },
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11
          },
          callback: function(value) {
            return formatTL(value)
          }
        }
      },
      y: {
        grid: {
          color: colors.grid,
          opacity: 0.2
        },
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11
          }
        }
      }
    }
  }

  // Analiz özeti
  const analysisSummary = useMemo(() => {
    if (tornadoData.topImpacts.length === 0) {
      return null
    }

    const first = tornadoData.topImpacts[0]
    const second = tornadoData.topImpacts[1]

    // Label'ları sadeleştir: "Ay Sayısı" -> "Dönem"
    const formatLabel = (label) => {
      return label.replace(/Ay Sayısı/g, 'Dönem')
    }

    return {
      first: {
        label: formatLabel(first.label),
        value: first.isPositive ? first.impact.positive : first.impact.negative,
        isPositive: first.isPositive
      },
      second: second ? {
        label: formatLabel(second.label),
        value: second.isPositive ? second.impact.positive : second.impact.negative,
        isPositive: second.isPositive
      } : null,
      baseline: tornadoData.baseline
    }
  }, [tornadoData])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: 0,
          marginBottom: '0.25rem',
          color: colors.text
        }}>
          Maliyet Hassasiyeti
        </h3>
        <p style={{
          fontSize: '0.75rem',
          color: colors.textSecondary,
          margin: 0
        }}>
          Değerler değiştiğinde birim maliyetin ne kadar oynadığını gösterir.
        </p>
      </div>

      {/* Analiz Özeti */}
      {analysisSummary && (
        <div style={{
          backgroundColor: isDarkTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          border: `1px solid ${isDarkTheme ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: '0.8125rem',
            color: colors.text,
            lineHeight: '1.6'
          }}>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>En çok etkileyen:</strong> {analysisSummary.first.label}
              {' '}
              <span style={{ color: analysisSummary.first.isPositive ? colors.positive : colors.negative }}>
                ({analysisSummary.first.isPositive ? '+' : ''}{formatTL(analysisSummary.first.value)} TL/{tornadoData.unitLabel})
              </span>
            </div>
            {analysisSummary.second && (
              <div style={{ marginBottom: '0.25rem' }}>
                <strong>İkinci en etkili:</strong> {analysisSummary.second.label}
                {' '}
                <span style={{ color: analysisSummary.second.isPositive ? colors.positive : colors.negative }}>
                  ({analysisSummary.second.isPositive ? '+' : ''}{formatTL(analysisSummary.second.value)} TL/{tornadoData.unitLabel})
                </span>
              </div>
            )}
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: `1px solid ${colors.grid}` }}>
              <strong>Mevcut sonuç:</strong> {formatTL(analysisSummary.baseline)} TL/{tornadoData.unitLabel}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: '280px'
      }}>
        <Bar ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}

export default ScenarioSensitivityTornadoChart

