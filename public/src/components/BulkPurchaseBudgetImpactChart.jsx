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

// Güvenli sayı parse fonksiyonu
const parseNumber = (x) => {
  if (x === null || x === undefined || x === '') return null
  const num = typeof x === 'string' ? parseFloat(x.replace(',', '.')) : Number(x)
  return isFinite(num) && !isNaN(num) ? num : null
}

function BulkPurchaseBudgetImpactChart({
  selectedMaterial = null,
  unitPrice = 0,
  priceCurrency = 'TRY',
  usdTry = 34.25,
  eurTry = 37.18,
  inflationPercent = 0
}) {
  const chartRef = useRef(null)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [quantityText, setQuantityText] = useState('10000') // Input'un ham string değeri
  const [quantityValue, setQuantityValue] = useState(10000) // Hesaplamada kullanılacak sayısal değer

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
    barToday: '#3b82f6', // Mavi - Bugün
    bar6Months: '#10b981', // Yeşil - 6 Ay
    bar12Months: '#f59e0b', // Turuncu - 12 Ay
    text: isDarkTheme ? '#ffffff' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    grid: isDarkTheme ? '#475569' : '#e5e7eb',
    background: isDarkTheme ? '#0b1220' : '#f8f9fa',
    tooltipBg: isDarkTheme ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkTheme ? '#334155' : '#e5e7eb',
    inputBg: isDarkTheme ? '#0f172a' : '#ffffff',
    inputBorder: isDarkTheme ? '#334155' : '#e0e0e0'
  }

  const unitLabel = selectedMaterial?.unit || 'kg'

  // Grafik verisi hesaplama
  const chartData = useMemo(() => {
    const unitPriceNum = parseNumber(unitPrice)
    const usdTryNum = parseNumber(usdTry) || 34.25
    const eurTryNum = parseNumber(eurTry) || 37.18
    const inflNum = parseNumber(inflationPercent) || 0
    const qty = quantityValue // quantityValue kullan (fallback'li)

    // Veri kontrolü - 0 değeri geçerlidir, negatif değerler reddedilir
    if (unitPriceNum === null || unitPriceNum < 0 || !isFinite(unitPriceNum)) {
      return null
    }

    // quantityValue her zaman geçerli bir sayı olacak (fallback sayesinde)
    // 0 olsa bile grafik gösterilecek

    // unitPriceTRY hesaplama
    let unitPriceTRY = unitPriceNum
    if (priceCurrency === 'USD') {
      if (usdTryNum === null || usdTryNum < 0) {
        return null // Kur verisi eksik veya geçersiz
      }
      unitPriceTRY = unitPriceNum * usdTryNum
    } else if (priceCurrency === 'EUR') {
      if (eurTryNum === null || eurTryNum < 0) {
        return null // Kur verisi eksik veya geçersiz
      }
      unitPriceTRY = unitPriceNum * eurTryNum
    }

    // Aylık enflasyon (compounding)
    const annualInfl = inflNum / 100
    const monthlyInfl = Math.pow(1 + annualInfl, 1 / 12) - 1

    // Enflasyon faktörleri
    const factor0 = 1
    const factor6 = Math.pow(1 + monthlyInfl, 6)
    const factor12 = Math.pow(1 + monthlyInfl, 12)

    // Toplam maliyetler
    const totalCost0 = qty * unitPriceTRY * factor0
    const totalCost6 = qty * unitPriceTRY * factor6
    const totalCost12 = qty * unitPriceTRY * factor12

    // Farklar
    const diff6 = totalCost6 - totalCost0
    const diff12 = totalCost12 - totalCost0

    return {
      labels: ['Bugün', '6 Ay', '12 Ay'],
      data: [totalCost0, totalCost6, totalCost12],
      unitPriceTRY,
      qty,
      inflNum,
      diff6,
      diff12
    }
  }, [selectedMaterial, unitPrice, priceCurrency, usdTry, eurTry, inflationPercent, quantityValue])

  const formatTL = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Input change handler
  const handleQuantityChange = (e) => {
    const value = e.target.value
    // Sadece rakam, nokta ve virgül kabul et
    if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setQuantityText(value)
    }
  }

  const handleQuantityBlur = () => {
    const normalized = quantityText.trim().replace(',', '.')
    
    // Boş string ise quantityValue'u değiştirme (son geçerli değer kalsın)
    if (normalized === '') {
      return
    }
    
    const parsed = parseNumber(normalized)
    
    // NaN ise quantityValue'u değiştirme
    if (parsed === null) {
      return
    }
    
    // 0 özel durumu: 0 olsa bile kabul et
    if (parsed === 0) {
      setQuantityValue(0)
      setQuantityText('0')
      return
    }
    
    // Geçerli sayı ise güncelle
    if (parsed > 0) {
      setQuantityValue(parsed)
      setQuantityText(parsed.toString())
    }
  }

  // Empty state sadece unitPrice/kur/enflasyon eksikse göster
  const unitPriceNum = parseNumber(unitPrice)
  const usdTryNum = parseNumber(usdTry)
  const eurTryNum = parseNumber(eurTry)
  const inflNum = parseNumber(inflationPercent)
  
  const showEmptyState = unitPriceNum === null || unitPriceNum < 0 || 
    (priceCurrency === 'USD' && (usdTryNum === null || usdTryNum <= 0)) ||
    (priceCurrency === 'EUR' && (eurTryNum === null || eurTryNum <= 0))

  if (showEmptyState) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: 0,
          marginBottom: '0.5rem',
          color: colors.text
        }}>
          Toplu Alım Bütçe Etkisi
        </h3>
        <p style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
          Birim fiyat girilmedi
        </p>
      </div>
    )
  }

  if (!chartData) {
    return null
  }

  const chartDataForChart = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Toplam Tutar',
        data: chartData.data,
        backgroundColor: [colors.barToday, colors.bar6Months, colors.bar12Months],
        borderColor: [colors.barToday, colors.bar6Months, colors.bar12Months],
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
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
          label: function(context) {
            const value = context.parsed.y || 0
            const index = context.dataIndex
            const labels = ['Bugün', '6 Ay', '12 Ay']
            
            return [
              `Toplam: ${formatTL(value)}`,
              `Miktar: ${formatNumber(chartData.qty)} ${unitLabel}`,
              `Birim: ${formatTL(chartData.unitPriceTRY)} / ${unitLabel}`,
              `Enflasyon varsayımı: %${chartData.inflNum.toFixed(2)}`
            ]
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
      y: {
        title: {
          display: true,
          text: 'Toplam Tutar (TL)',
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
          marginBottom: '0.5rem',
          color: colors.text
        }}>
          Toplu Alım Bütçe Etkisi
        </h3>
        <p style={{
          fontSize: '0.75rem',
          color: colors.textSecondary,
          margin: 0,
          marginBottom: '0.75rem'
        }}>
          Seçili hammadde için toplu alım miktarına göre bütçe etkisini gösterir.
        </p>

        {/* Alım Miktarı Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '0.75rem'
        }}>
          <label style={{
            fontSize: '0.8125rem',
            fontWeight: '500',
            color: colors.text,
            whiteSpace: 'nowrap'
          }}>
            Alım Miktarı:
          </label>
          <input
            type="text"
            value={quantityText}
            onChange={handleQuantityChange}
            placeholder={`Örn: 10000 ${unitLabel}`}
            style={{
              width: '150px',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: `1px solid ${colors.inputBorder}`,
              fontSize: '0.875rem',
              backgroundColor: colors.inputBg,
              color: colors.text,
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.inputBorder
              e.target.style.boxShadow = 'none'
              handleQuantityBlur()
            }}
          />
          <span style={{
            fontSize: '0.75rem',
            color: colors.textSecondary
          }}>
            {unitLabel}
          </span>
        </div>

        {/* Helper text: Input boşken son geçerli değeri göster */}
        {quantityText === '' && quantityValue > 0 && (
          <div style={{
            fontSize: '0.7rem',
            color: colors.textSecondary,
            fontStyle: 'italic',
            marginTop: '-0.5rem',
            marginBottom: '0.5rem'
          }}>
            Son geçerli miktar kullanılıyor: {formatNumber(quantityValue)} {unitLabel}
          </div>
        )}

        {/* Özet Satırları */}
        {chartData && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            fontSize: '0.75rem',
            color: colors.textSecondary
          }}>
            <div>
              <strong style={{ color: colors.text }}>6 ay bekleme farkı:</strong>{' '}
              <span style={{ color: '#10b981' }}>+{formatTL(chartData.diff6)}</span>
            </div>
            <div>
              <strong style={{ color: colors.text }}>12 ay bekleme farkı:</strong>{' '}
              <span style={{ color: '#f59e0b' }}>+{formatTL(chartData.diff12)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: '200px'
      }}>
        <Bar ref={chartRef} data={chartDataForChart} options={chartOptions} />
      </div>
    </div>
  )
}

export default BulkPurchaseBudgetImpactChart

