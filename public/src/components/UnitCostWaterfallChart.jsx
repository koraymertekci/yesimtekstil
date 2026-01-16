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

// Chart.js kayıt
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

/**
 * UnitCostWaterfallChart - Birim Maliyet Sürücü Analizi
 * Baz maliyet, kur farkı ve enflasyon etkisinin toplam birim maliyete katkısını gösterir.
 */
function UnitCostWaterfallChart({
  unitPrice = 0,
  priceCurrency = 'TRY',
  usdTry = 34.25,
  eurTry = 37.18,
  inflationPercent = 0,
  periodMonths = 12,
  baseUsdTry = 34.25, // Baz kur (güncel snapshot)
  baseEurTry = 37.18, // Baz kur (güncel snapshot)
  unit = 'kg' // Hammadde birimi (kg, m, adet, lt vb.)
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

  // Tema renkleri
  const colors = {
    text: isDarkTheme ? '#ffffff' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    grid: isDarkTheme ? '#475569' : '#e5e7eb',
    background: isDarkTheme ? '#0b1220' : '#f8f9fa',
    tooltipBg: isDarkTheme ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkTheme ? '#334155' : '#e5e7eb',
    primary: '#3b82f6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b'
  }

  // Waterfall hesaplamaları
  const waterfallData = useMemo(() => {
    const unitPriceNum = parseFloat(unitPrice) || 0
    const usdTryInput = parseFloat(usdTry) || 34.25
    const eurTryInput = parseFloat(eurTry) || 37.18
    const annualInflation = parseFloat(inflationPercent) || 0
    const months = parseInt(periodMonths) || 12
    const baseUsd = parseFloat(baseUsdTry) || 34.25
    const baseEur = parseFloat(baseEurTry) || 37.18

    // 0 değeri geçerlidir, negatif değerler reddedilir
    if (unitPriceNum < 0 || !isFinite(unitPriceNum)) {
      return null
    }

    // 1. Baz kur seçimi
    const baseRate =
      priceCurrency === 'USD' ? baseUsd :
      priceCurrency === 'EUR' ? baseEur : 1

    // 2. Baz TL maliyet (baz kurla)
    const baseTL = unitPriceNum * baseRate

    // 3. Enflasyon Etkisi (baz TL üzerinden)
    const inflationFactor = Math.pow(1 + annualInflation / 100, months / 12)
    const inflationEffect = baseTL * (inflationFactor - 1)

    // 4. Toplam (baz TL + enflasyon etkisi)
    const total = baseTL + inflationEffect

    return {
      baseTL,
      inflationEffect,
      total,
      months
    }
  }, [unitPrice, priceCurrency, usdTry, eurTry, baseUsdTry, baseEurTry, inflationPercent, periodMonths])

  if (!waterfallData) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: 0,
          marginBottom: '0.5rem',
          color: colors.text
        }}>
          Birim Maliyet Sürücü Analizi
        </h3>
        <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
          Grafik için hammadde ve fiyat bilgilerini girin.
        </p>
      </div>
    )
  }

  // Chart.js data formatı (waterfall için her bar ayrı dataset)
  // Her bar'ın başlangıç noktası ve yüksekliği hesaplanıyor
  // Renkler: Baz (mavi), Kur (yeşil/kırmızı), Enflasyon (turuncu), Toplam (mor/teal)
  const totalColor = '#8b5cf6' // Mor/teal tonu (koyu tema uyumlu)
  
  const chartData = {
    labels: [
      'Baz (Güncel Kur)',
      `Enflasyon Etkisi (${waterfallData.months} Ay)`,
      'Toplam'
    ],
    datasets: [
      {
        label: 'Baz',
        data: [
          waterfallData.baseTL, // Baz: 0'dan baseTL'a
          0, // Enflasyon için boş
          0 // Toplam için boş
        ],
        backgroundColor: [colors.primary, 'transparent', 'transparent'],
        borderColor: [colors.primary, 'transparent', 'transparent'],
        borderWidth: 1
      },
      {
        label: 'Enflasyon Etkisi',
        data: [
          0, // Baz için boş
          waterfallData.inflationEffect, // Enflasyon: baseTL'dan baseTL + inflationEffect'a
          0 // Toplam için boş
        ],
        backgroundColor: ['transparent', colors.warning, 'transparent'],
        borderColor: ['transparent', colors.warning, 'transparent'],
        borderWidth: 1
      },
      {
        label: 'Toplam',
        data: [
          0, // Baz için boş
          0, // Enflasyon için boş
          waterfallData.total // Toplam: 0'dan total'a
        ],
        backgroundColor: ['transparent', 'transparent', totalColor],
        borderColor: ['transparent', 'transparent', totalColor],
        borderWidth: 1
      }
    ]
  }

  // TL format helper
  const formatTL = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
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
          label: function(context) {
            const value = context.parsed.y || 0
            const datasetLabel = context.dataset.label || ''
            const labelIndex = context.dataIndex
            
            if (value === 0) {
              return null // Boş değerleri gösterme
            }
            
            if (datasetLabel === 'Toplam') {
              return `Toplam: ${formatTL(value)} TL/${unit}`
            } else if (datasetLabel === 'Baz') {
              return `Baz (Güncel Kur): ${formatTL(value)} TL/${unit}`
            } else if (datasetLabel === 'Enflasyon Etkisi') {
              const impact = waterfallData.inflationEffect
              // Enflasyon için başlangıç: baseTL
              const start = waterfallData.baseTL
              const end = start + impact
              return [
                `Başlangıç: ${formatTL(start)} TL/${unit}`,
                `Bitiş: ${formatTL(end)} TL/${unit}`,
                `Etki: ${impact >= 0 ? '+' : ''}${formatTL(impact)} TL/${unit}`
              ]
            }
            
            return `${datasetLabel}: ${formatTL(value)} TL/${unit}`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true, // Waterfall için stacked: true, her bar bir önceki bar'ın üzerine biner
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
      },
      y: {
        stacked: true, // Waterfall için stacked: true
        beginAtZero: true,
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
            return formatTL(value) + ` TL/${unit}`
          }
        }
      }
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Başlık */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: 0,
          marginBottom: '0.25rem',
          color: colors.text
        }}>
          Birim Maliyet Sürücü Analizi
        </h3>
        <p style={{
          fontSize: '0.75rem',
          color: colors.textSecondary,
          margin: 0
        }}>
          Baz maliyet, kur farkı ve enflasyon etkisinin toplam birim maliyete katkısını gösterir.
        </p>
      </div>

      {/* Chart */}
      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: '280px'
      }}>
        <Bar
          ref={chartRef}
          data={chartData}
          options={chartOptions}
        />
      </div>
    </div>
  )
}

export default UnitCostWaterfallChart

