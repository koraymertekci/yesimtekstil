import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import '../App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Güvenli sayı parse fonksiyonu
const parseNumber = (x) => {
  if (x === null || x === undefined || x === '') return null
  const num = typeof x === 'string' ? parseFloat(x.replace(',', '.')) : Number(x)
  return isFinite(num) && !isNaN(num) ? num : null
}

function UnitCostForecastLineChart({
  selectedMaterial = null,
  unitPrice = 0,
  priceCurrency = 'TRY',
  usdTry = 34.25,
  eurTry = 37.18,
  inflationRate = 0,
  periodMonths = 12
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

  // Chart cleanup
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])

  const colors = {
    costLine: '#3b82f6', // Mavi - Birim Maliyet
    usdLine: '#10b981', // Yeşil - USD/TRY
    eurLine: '#f59e0b', // Turuncu - EUR/TRY
    inflationLine: '#ef4444', // Kırmızı - Enflasyon
    text: isDarkTheme ? '#ffffff' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    grid: isDarkTheme ? '#475569' : '#e5e7eb',
    background: isDarkTheme ? '#0b1220' : '#f8f9fa',
    tooltipBg: isDarkTheme ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkTheme ? '#334155' : '#e5e7eb'
  }

  const unitLabel = selectedMaterial?.unit || 'kg'

  // Grafik verisi hesaplama
  const chartData = useMemo(() => {
    const unitPriceNum = parseNumber(unitPrice)
    const usdTryNum = parseNumber(usdTry)
    const eurTryNum = parseNumber(eurTry)
    const inflNum = parseNumber(inflationRate)
    const months = parseInt(periodMonths) || 12

    // Veri kontrolü - 0 değeri geçerlidir, negatif değerler reddedilir
    if (unitPriceNum === null || unitPriceNum < 0 || !isFinite(unitPriceNum)) {
      return null
    }

    // Labels: Başlangıç, 1. Ay, 2. Ay, ...
    const labels = ['Başlangıç']
    for (let i = 1; i <= months; i++) {
      labels.push(`${i}. Ay`)
    }

    // baseTRY hesaplama
    let baseTry = unitPriceNum
    if (priceCurrency === 'USD') {
      if (usdTryNum === null || usdTryNum < 0) {
        return null // Kur verisi eksik veya geçersiz
      }
      baseTry = unitPriceNum * usdTryNum
    } else if (priceCurrency === 'EUR') {
      if (eurTryNum === null || eurTryNum < 0) {
        return null // Kur verisi eksik veya geçersiz
      }
      baseTry = unitPriceNum * eurTryNum
    }

    // Aylık enflasyon
    const monthlyInfl = inflNum !== null && inflNum > 0 ? (inflNum / 100) / 12 : 0

    // 1. Birim Maliyet Projeksiyonu
    const costData = [baseTry] // t=0: Başlangıç
    for (let t = 1; t <= months; t++) {
      const cost = baseTry * Math.pow(1 + monthlyInfl, t)
      costData.push(cost)
    }

    // 2. USD/TRY serisi (flat)
    const usdSeries = new Array(months + 1).fill(usdTryNum !== null ? usdTryNum : 0)

    // 3. EUR/TRY serisi (flat)
    const eurSeries = new Array(months + 1).fill(eurTryNum !== null ? eurTryNum : 0)

    // 4. Enflasyon serisi (flat)
    const inflSeries = new Array(months + 1).fill(inflNum !== null ? inflNum : 0)

    return {
      labels,
      costData,
      usdSeries,
      eurSeries,
      inflSeries,
      months
    }
  }, [selectedMaterial, unitPrice, priceCurrency, usdTry, eurTry, inflationRate, periodMonths, unitLabel])

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: 0,
          marginBottom: '0.5rem',
          color: colors.text
        }}>
          Birim Maliyet Projeksiyonu
        </h3>
        <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
          Veri eksik
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

  const formatPercent = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value)
  }

  const chartDataForChart = {
    labels: chartData.labels,
    datasets: [
      {
        label: `Birim Maliyet (TRY/${unitLabel})`,
        data: chartData.costData,
        borderColor: colors.costLine,
        backgroundColor: `${colors.costLine}20`,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
        yAxisID: 'yCost'
      },
      {
        label: 'USD/TRY',
        data: chartData.usdSeries,
        borderColor: colors.usdLine,
        backgroundColor: `${colors.usdLine}20`,
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 1.5,
        borderDash: [5, 5],
        yAxisID: 'yRates'
      },
      {
        label: 'EUR/TRY',
        data: chartData.eurSeries,
        borderColor: colors.eurLine,
        backgroundColor: `${colors.eurLine}20`,
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 1.5,
        borderDash: [5, 5],
        yAxisID: 'yRates'
      },
      {
        label: 'Enflasyon (%)',
        data: chartData.inflSeries,
        borderColor: colors.inflationLine,
        backgroundColor: `${colors.inflationLine}20`,
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderWidth: 1.5,
        borderDash: [3, 3],
        yAxisID: 'yRates'
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: colors.textSecondary,
          font: {
            size: 11
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'line'
        }
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
            const label = context.dataset.label || ''
            const value = context.parsed.y || 0
            
            if (label.includes('Birim Maliyet')) {
              return `Birim Maliyet: ${formatTL(value)} TL/${unitLabel}`
            } else if (label.includes('USD/TRY')) {
              return `USD/TRY: ${formatTL(value)}`
            } else if (label.includes('EUR/TRY')) {
              return `EUR/TRY: ${formatTL(value)}`
            } else if (label.includes('Enflasyon')) {
              return `Enflasyon: %${formatPercent(value)}`
            }
            return `${label}: ${value}`
          }
        }
      }
    },
    scales: {
      x: {
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
      yCost: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: `TRY/${unitLabel}`,
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
      yRates: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Kur / %',
          color: colors.textSecondary,
          font: {
            size: 12
          }
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11
          },
          callback: function(value) {
            return value.toFixed(2)
          }
        }
      }
    }
  }

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
          Birim Maliyet Projeksiyonu
        </h3>
        <p style={{
          fontSize: '0.75rem',
          color: colors.textSecondary,
          margin: 0
        }}>
          Seçili hammadde için maliyetin (kur + enflasyon) etkisiyle dönem boyunca nasıl değiştiğini gösterir.
        </p>
      </div>

      {/* Chart */}
      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: '280px'
      }}>
        <Line ref={chartRef} data={chartDataForChart} options={chartOptions} />
      </div>
    </div>
  )
}

export default UnitCostForecastLineChart



