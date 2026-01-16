import React, { useState, useEffect } from 'react'
import '../App.css'

/**
 * MarketInsightCards - Piyasa trend analizine göre öneri kartları
 */
function MarketInsightCards({ current, targets, months = 12 }) {
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

  if (!current || !targets) return null

  // Metrikleri hesapla
  const usdNow = current.usd || 0
  const eurNow = current.eur || 0
  const infNow = current.inf || 0

  const usdTarget = targets.usd || usdNow
  const eurTarget = targets.eur || eurNow
  const infTarget = targets.inf || infNow

  // % değişimler
  const usdPct = usdNow !== 0 ? ((usdTarget - usdNow) / usdNow) : 0
  const eurPct = eurNow !== 0 ? ((eurTarget - eurNow) / eurNow) : 0
  const infDiff = infTarget - infNow

  // Trend baskısı
  const fxPressure = Math.max(Math.abs(usdPct), Math.abs(eurPct))
  const inflationPressure = infDiff

  // Bütçe etkisi
  const costPressurePct = 0.6 * fxPressure + 0.4 * Math.max(0, infDiff / 100)

  // Tema renkleri
  const colors = {
    text: isDarkTheme ? '#ffffff' : '#1e293b',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b',
    cardBg: isDarkTheme ? '#2a2a2a' : '#ffffff',
    border: isDarkTheme ? '#3a3a3a' : '#e5e7eb'
  }

  // Seviye belirleme fonksiyonları
  const getFxLevel = (pressure) => {
    if (pressure >= 0.10) {
      return { 
        label: 'Kritik', 
        color: '#ef4444', 
        bg: isDarkTheme ? '#7f1d1d' : '#fee2e2' 
      }
    }
    if (pressure >= 0.05) {
      return { 
        label: 'Dikkat', 
        color: '#f59e0b', 
        bg: isDarkTheme ? '#78350f' : '#fef3c7' 
      }
    }
    return { 
      label: 'Stabil', 
      color: '#10b981', 
      bg: isDarkTheme ? '#064e3b' : '#d1fae5' 
    }
  }

  const getInfLevel = (diff) => {
    if (diff >= 10) {
      return { 
        label: 'Kritik', 
        color: '#ef4444', 
        bg: isDarkTheme ? '#7f1d1d' : '#fee2e2' 
      }
    }
    if (diff >= 5) {
      return { 
        label: 'Dikkat', 
        color: '#f59e0b', 
        bg: isDarkTheme ? '#78350f' : '#fef3c7' 
      }
    }
    return { 
      label: 'Normal', 
      color: '#10b981', 
      bg: isDarkTheme ? '#064e3b' : '#d1fae5' 
    }
  }

  const fxLevel = getFxLevel(fxPressure)
  const infLevel = getInfLevel(inflationPressure)

  // Öneri metinleri
  const getFxRecommendation = () => {
    if (usdPct > 0 || eurPct > 0) {
      return 'Kur artışı bekleniyor → ithal girdilerde maliyet baskısı. Alımı kademeliye böl veya erken alımı değerlendir.'
    } else if (usdPct < 0 || eurPct < 0) {
      return 'Kur düşüş beklentisi → büyük alımı ötelemek avantajlı olabilir, ancak emniyet stok riskini kontrol et.'
    }
    return 'Kur değişimi minimal → rutin plan devam edebilir.'
  }

  const getActionPlan = () => {
    const actions = []
    
    if (fxPressure >= 0.08 && (usdPct > 0 || eurPct > 0)) {
      actions.push('• Alımı 2–3 parçaya böl, ilk kısmı erken çek')
      actions.push('• Tedarikçi ödeme vadesini kısaltmayı değerlendir')
    } else if (fxPressure < 0.05 && inflationPressure >= 8) {
      actions.push('• Kur stabil, enflasyon baskılı → sözleşme ve işçilik maliyetlerine odaklan')
      actions.push('• Fiyat listesi güncelleme planı hazırla')
    } else if (fxPressure < 0.05 && inflationPressure < 5) {
      actions.push('• Büyük değişim yok → rutin plan, takip et')
    } else {
      actions.push('• Durumu yakından izle, kademeli aksiyon al')
    }

    return actions
  }

  const actionItems = getActionPlan()

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1rem',
      marginTop: '2rem'
    }}>
      {/* Kutu A - Kur Riski Özeti */}
      <div className="card" style={{
        padding: '1rem',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem'
        }}>
          <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: '600',
            margin: 0,
            color: colors.text
          }}>
            Kur Riski (USD/EUR)
          </h3>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: fxLevel.bg,
            color: fxLevel.color,
            border: `1px solid ${fxLevel.color}`
          }}>
            {fxLevel.label}
          </span>
        </div>
        <p style={{
          fontSize: '0.8125rem',
          color: colors.textSecondary,
          margin: '0 0 0.75rem 0',
          lineHeight: '1.5'
        }}>
          Hedefe göre USD <strong style={{ color: colors.text }}>
            {usdPct >= 0 ? '+' : ''}{(usdPct * 100).toFixed(1)}%
          </strong>, EUR <strong style={{ color: colors.text }}>
            {eurPct >= 0 ? '+' : ''}{(eurPct * 100).toFixed(1)}%
          </strong>
        </p>
        <p style={{
          fontSize: '0.8125rem',
          color: colors.text,
          margin: 0,
          lineHeight: '1.5'
        }}>
          {getFxRecommendation()}
        </p>
      </div>

      {/* Kutu B - Enflasyon Etkisi */}
      <div className="card" style={{
        padding: '1rem',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem'
        }}>
          <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: '600',
            margin: 0,
            color: colors.text
          }}>
            Enflasyon Baskısı
          </h3>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: infLevel.bg,
            color: infLevel.color,
            border: `1px solid ${infLevel.color}`
          }}>
            {infLevel.label}
          </span>
        </div>
        <p style={{
          fontSize: '0.8125rem',
          color: colors.textSecondary,
          margin: '0 0 0.75rem 0',
          lineHeight: '1.5'
        }}>
          Enflasyon hedefi: <strong style={{ color: colors.text }}>
            {infDiff >= 0 ? '+' : ''}{infDiff.toFixed(1)} puan
          </strong> ({months} ay)
        </p>
        <p style={{
          fontSize: '0.8125rem',
          color: colors.text,
          margin: 0,
          lineHeight: '1.5'
        }}>
          İç maliyet (işçilik/enerji) artışı için fiyat listesi + kontrat güncelleme planı.
        </p>
      </div>

      {/* Kutu C - Bütçe Etkisi */}
      <div className="card" style={{
        padding: '1rem',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px'
      }}>
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: '600',
          margin: '0 0 0.75rem 0',
          color: colors.text
        }}>
          Bütçe Etkisi (yaklaşık)
        </h3>
        <p style={{
          fontSize: '0.8125rem',
          color: colors.textSecondary,
          margin: '0 0 0.75rem 0',
          lineHeight: '1.5'
        }}>
          Kur ağırlığı %60, enflasyon ağırlığı %40 varsayımıyla toplam maliyet baskısı ≈ <strong style={{ color: colors.text }}>
            {(costPressurePct * 100).toFixed(1)}%
          </strong>
        </p>
        <p style={{
          fontSize: '0.8125rem',
          color: colors.text,
          margin: 0,
          lineHeight: '1.5'
        }}>
          Bütçe revizyonu / satın alma limitleri / fiyat geçiş planı.
        </p>
      </div>

      {/* Kutu D - Aksiyon Planı */}
      <div className="card" style={{
        padding: '1rem',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px'
      }}>
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: '600',
          margin: '0 0 0.75rem 0',
          color: colors.text
        }}>
          Önerilen Aksiyon
        </h3>
        <div style={{
          fontSize: '0.8125rem',
          color: colors.text,
          lineHeight: '1.75'
        }}>
          {actionItems.map((item, idx) => (
            <p key={idx} style={{ margin: '0.25rem 0', lineHeight: '1.5' }}>
              {item}
            </p>
          ))}
        </div>
      </div>

      {/* Kutu E - Uyarılar */}
      <div className="card" style={{
        padding: '1rem',
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px'
      }}>
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: '600',
          margin: '0 0 0.75rem 0',
          color: colors.text
        }}>
          Kontrol Listesi
        </h3>
        <ul style={{
          fontSize: '0.8125rem',
          color: colors.text,
          margin: 0,
          paddingLeft: '1.25rem',
          lineHeight: '1.75'
        }}>
          <li style={{ margin: '0.25rem 0' }}>Stok emniyet seviyesi</li>
          <li style={{ margin: '0.25rem 0' }}>Lead time / termin riski</li>
          <li style={{ margin: '0.25rem 0' }}>Tedarikçi ödeme vadesi – kur riski</li>
        </ul>
      </div>
    </div>
  )
}

export default MarketInsightCards

