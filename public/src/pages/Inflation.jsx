import React, { useState, useEffect, useMemo } from 'react'
import { getMarketSnapshot } from '../utils/marketSnapshot'
import { RAW_MATERIALS } from '../data/rawMaterials'
import RawMaterialSelect from '../components/RawMaterialSelect'
import UnitCostWaterfallChart from '../components/UnitCostWaterfallChart'
import ScenarioSensitivityTornadoChart from '../components/ScenarioSensitivityTornadoChart'
import UnitCostForecastLineChart from '../components/UnitCostForecastLineChart'
import BulkPurchaseBudgetImpactChart from '../components/BulkPurchaseBudgetImpactChart'
import '../App.css'

function Inflation() {
  // current: Güncel snapshot değerleri (sistemden gelen)
  const [current, setCurrent] = useState(null)
  // targets: Kullanıcının girdiği hedef değerler
  const [targets, setTargets] = useState({
    usdtry: '',
    eurtry: '',
    inflation12m: ''
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedHorizonMonths, setSelectedHorizonMonths] = useState(12)
  const [savedMessage, setSavedMessage] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState(RAW_MATERIALS[0] || null)
  const [materialPriceInput, setMaterialPriceInput] = useState('') // String state for free typing
  const [materialCurrency, setMaterialCurrency] = useState('TRY')
  const [materialOverrides, setMaterialOverrides] = useState({})

  useEffect(() => {
    // Sayfa açılınca snapshot yükle (current)
    const marketData = getMarketSnapshot()
    setCurrent({
      usd: marketData.usdtry,
      eur: marketData.eurtry,
      inf: marketData.inflation12m || 0
    })
    
    // localStorage'dan kaydedilmiş varsayımları yükle (targets)
    const saved = localStorage.getItem('yesim_market_assumptions')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTargets({
          usdtry: parsed.usdtry?.toString() || marketData.usdtry.toString(),
          eurtry: parsed.eurtry?.toString() || marketData.eurtry.toString(),
          inflation12m: parsed.inflation12m?.toString() || parsed.inflation?.toString() || marketData.inflation12m.toString()
        })
        // Geriye uyumluluk: inflationPeriod varsa kullan, yoksa bugün
        if (parsed.inflationPeriod) {
          setSelectedYear(parsed.inflationPeriod.year || new Date().getFullYear())
          // Eski format (month) varsa ignore et, default 12 ata
          setSelectedHorizonMonths(parsed.inflationPeriod.horizonMonths || 12)
        }
      } catch (error) {
        // Parse hatası durumunda snapshot değerlerini hedef olarak kullan
        setTargets({
          usdtry: marketData.usdtry.toString(),
          eurtry: marketData.eurtry.toString(),
          inflation12m: marketData.inflation12m.toString()
        })
      }
    } else {
      // Kaydedilmiş değer yoksa snapshot'ı hedef olarak kullan
      setTargets({
        usdtry: marketData.usdtry.toString(),
        eurtry: marketData.eurtry.toString(),
        inflation12m: marketData.inflation12m.toString()
      })
    }

    // localStorage'dan hammadde override'larını yükle
    const savedOverrides = localStorage.getItem('yesim_raw_material_overrides')
    if (savedOverrides) {
      try {
        const parsed = JSON.parse(savedOverrides)
        setMaterialOverrides(parsed)
      } catch (error) {
        // Parse hatası durumunda boş obje
        setMaterialOverrides({})
      }
    }
  }, [])

  // Hammadde seçildiğinde fiyat ve para birimini yükle
  useEffect(() => {
    if (selectedMaterial) {
      const materialId = selectedMaterial.label
      const override = materialOverrides[materialId]
      
      if (override) {
        // Override varsa onu kullan
        setMaterialPriceInput(override.basePrice?.toString() || '')
        setMaterialCurrency(override.baseCurrency || 'TRY')
      } else {
        // Override yoksa base değerleri kullan
        const basePrice = selectedMaterial.basePrice ?? 100 // Fallback
        const baseCurrency = selectedMaterial.baseCurrency || 'TRY'
        setMaterialPriceInput(basePrice.toString())
        setMaterialCurrency(baseCurrency)
      }
    }
  }, [selectedMaterial, materialOverrides])

  const handleReset = () => {
    if (!current) return
    
    const today = new Date()
    setTargets({
      usdtry: current.usd.toString(),
      eurtry: current.eur.toString(),
      inflation12m: current.inf.toString()
    })
    setSelectedYear(today.getFullYear())
    setSelectedHorizonMonths(12)
    setSavedMessage('')
    
    // Hammadde override'larını sıfırla
    if (selectedMaterial) {
      const materialId = selectedMaterial.label
      const newOverrides = { ...materialOverrides }
      delete newOverrides[materialId]
      setMaterialOverrides(newOverrides)
      localStorage.setItem('yesim_raw_material_overrides', JSON.stringify(newOverrides))
      
          // Base değerlere dön
          const basePrice = selectedMaterial.basePrice ?? 100
          const baseCurrency = selectedMaterial.baseCurrency || 'TRY'
          setMaterialPriceInput(basePrice.toString())
          setMaterialCurrency(baseCurrency)
    }
  }

  const handleSave = () => {
    // Validasyon
    if (!targets.usdtry || targets.usdtry.trim() === '') {
      alert('USD/TRY değeri zorunludur.')
      return
    }
    if (!targets.eurtry || targets.eurtry.trim() === '') {
      alert('EUR/TRY değeri zorunludur.')
      return
    }

    const dataToSave = {
      usdtry: parseFloat(targets.usdtry),
      eurtry: parseFloat(targets.eurtry),
      inflation: targets.inflation12m ? parseFloat(targets.inflation12m) : null,
      inflationPeriod: {
        year: selectedYear,
        horizonMonths: selectedHorizonMonths
      },
      savedAt: new Date().toISOString()
    }

    localStorage.setItem('yesim_market_assumptions', JSON.stringify(dataToSave))
    
    setSavedMessage('Varsayımlar kaydedildi.')
    setTimeout(() => {
      setSavedMessage('')
    }, 3000)
  }

  // Birim fiyat input değişikliği (free typing - sadece string set et)
  const handleMaterialPriceInputChange = (value) => {
    // Sadece izin verilen karakterler: rakam + nokta/virgül
    const validPattern = /^[0-9]*[.,]?[0-9]*$/
    if (value === '' || validPattern.test(value)) {
      setMaterialPriceInput(value)
    }
  }

  // Birim fiyat blur (normalize et ve kaydet)
  const handleMaterialPriceBlur = () => {
    if (!selectedMaterial) return

    // Normalize: virgülü noktaya çevir
    const normalized = materialPriceInput.replace(',', '.')
    
    // Boşsa default'a dön
    if (normalized === '' || normalized === '.') {
      const basePrice = selectedMaterial.basePrice ?? 100
      if (basePrice > 0) {
        setMaterialPriceInput(basePrice.toString())
      } else {
        setMaterialPriceInput('')
      }
      // Override'ı kaldır
      const materialId = selectedMaterial.label
      const newOverrides = { ...materialOverrides }
      delete newOverrides[materialId]
      setMaterialOverrides(newOverrides)
      localStorage.setItem('yesim_raw_material_overrides', JSON.stringify(newOverrides))
      return
    }

    // Sayıya çevir ve kontrol et
    const priceNum = Number(normalized)
    if (!isFinite(priceNum) || priceNum < 0) {
      // Geçersizse eski değere dön (0 geçerli bir değer)
      const basePrice = selectedMaterial.basePrice ?? 100
      setMaterialPriceInput(basePrice.toString())
      return
    }
    
    // 0 değeri geçerlidir, devam et

    // Geçerliyse normalize edilmiş string'i set et ve override kaydet
    const normalizedString = priceNum.toString()
    setMaterialPriceInput(normalizedString)

    // Override kaydet
    const materialId = selectedMaterial.label
    const basePrice = selectedMaterial.basePrice ?? 100
    const baseCurrency = selectedMaterial.baseCurrency || 'TRY'

    if (priceNum !== basePrice || materialCurrency !== baseCurrency) {
      const newOverrides = {
        ...materialOverrides,
        [materialId]: {
          basePrice: priceNum,
          baseCurrency: materialCurrency
        }
      }
      setMaterialOverrides(newOverrides)
      localStorage.setItem('yesim_raw_material_overrides', JSON.stringify(newOverrides))
    } else {
      // Base değerlere eşitse override'ı kaldır
      const newOverrides = { ...materialOverrides }
      delete newOverrides[materialId]
      setMaterialOverrides(newOverrides)
      localStorage.setItem('yesim_raw_material_overrides', JSON.stringify(newOverrides))
    }
  }

  // Para birimi değişikliği
  const handleMaterialCurrencyChange = (currency) => {
    if (!selectedMaterial) return

    setMaterialCurrency(currency)

    // Override kaydet
    const materialId = selectedMaterial.label
    const basePrice = selectedMaterial.basePrice ?? 100
    const baseCurrency = selectedMaterial.baseCurrency || 'TRY'
    
    // Normalize edilmiş fiyat değerini al
    const normalized = materialPriceInput.replace(',', '.')
    const priceNum = normalized === '' ? 0 : Number(normalized)

    if (priceNum > 0 && isFinite(priceNum) && (priceNum !== basePrice || currency !== baseCurrency)) {
      const newOverrides = {
        ...materialOverrides,
        [materialId]: {
          basePrice: priceNum,
          baseCurrency: currency
        }
      }
      setMaterialOverrides(newOverrides)
      localStorage.setItem('yesim_raw_material_overrides', JSON.stringify(newOverrides))
    } else {
      const newOverrides = { ...materialOverrides }
      delete newOverrides[materialId]
      setMaterialOverrides(newOverrides)
      localStorage.setItem('yesim_raw_material_overrides', JSON.stringify(newOverrides))
    }
  }

  // Numeric değer (hesaplamalarda kullanılacak)
  const materialPriceValue = useMemo(() => {
    if (materialPriceInput === '' || materialPriceInput === '.') return 0
    const normalized = materialPriceInput.replace(',', '.')
    const num = Number(normalized)
    return isFinite(num) && num >= 0 ? num : 0
  }, [materialPriceInput])

  // Piyasa trend grafiği için data hesaplama
  const marketTrendData = useMemo(() => {
    if (!current) return { labels: [], datasets: [] }

    const usdValue = parseFloat(targets.usdtry) || current.usd
    const eurValue = parseFloat(targets.eurtry) || current.eur
    const inflationValue = parseFloat(targets.inflation12m) || current.inf || 0
    const months = selectedHorizonMonths || 12

    // Labels: Başlangıç, 1. Ay, 2. Ay, ...
    const labels = ['Başlangıç']
    for (let i = 1; i <= months; i++) {
      labels.push(`${i}. Ay`)
    }

    // USD/TRY trend data
    const usdData = [usdValue]
    const eurData = [eurValue]
    const inflationData = [inflationValue]

    // Aylık enflasyon oranı
    const inflationAnnual = inflationValue / 100
    const monthlyInfl = Math.pow(1 + inflationAnnual, 1 / 12) - 1
    const fxMonthly = monthlyInfl * 0.70 // Kur trendi: enflasyonun %70'i

    // Her ay için hesapla
    for (let t = 1; t <= months; t++) {
      // Kur trendi
      const usd_t = usdValue * Math.pow(1 + fxMonthly, t)
      const eur_t = eurValue * Math.pow(1 + fxMonthly, t)
      
      // Enflasyon trendi (yüzde olarak)
      const inf_t = inflationValue * Math.pow(1 + monthlyInfl, t)

      usdData.push(usd_t)
      eurData.push(eur_t)
      inflationData.push(inf_t)
    }

    return {
      labels,
      datasets: [
        {
          label: 'USD/TRY',
          data: usdData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisFormat: 'currency',
          value: usdData[usdData.length - 1].toFixed(2)
        },
        {
          label: 'EUR/TRY',
          data: eurData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisFormat: 'currency',
          value: eurData[eurData.length - 1].toFixed(2)
        },
        {
          label: 'Enflasyon (%)',
          data: inflationData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisFormat: 'percent',
          value: inflationData[inflationData.length - 1].toFixed(2)
        }
      ]
    }
  }, [current, targets, selectedHorizonMonths])

  if (!current) {
    return (
      <>
        <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Enflasyon & Piyasa Varsayımları</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</p>
      </>
    )
  }

  return (
    <>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Enflasyon & Piyasa Varsayımları</h1>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Bu sayfada kur ve enflasyon varsayımlarını girerek maliyet projeksiyonuna temel oluşturursun.
      </p>

      {/* Tek Birleşik Kompakt Panel */}
      <div className="card" style={{ 
        padding: '14px 16px',
        marginBottom: '1.5rem'
      }}>
        <div className="card-header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
          <h2 className="card-title" style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>Piyasa Varsayımları</h2>
        </div>
        
        {/* Hammadde Seçimi */}
        <div 
          className="inflation-field-group"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            flex: '0 0 auto',
            padding: '8px 12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}
        >
          <label style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap'
          }}>
            Hammadde
          </label>
          <div 
            className="material-price-row"
            style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              flexWrap: 'nowrap',
              flex: '1'
            }}
          >
            {/* Hammadde Select - Sol */}
            <div 
              className="material-select-wrapper"
              style={{ 
                flex: '0 0 auto',
                minWidth: '360px',
                maxWidth: '520px',
                width: '100%'
              }}
            >
              <RawMaterialSelect
                materials={RAW_MATERIALS}
                value={selectedMaterial}
                onChange={setSelectedMaterial}
                placeholder="Hammadde seçin"
              />
            </div>
            
            {/* Birim Fiyat Kutusu - Sağ */}
            {selectedMaterial && (
              <div 
                className="inflation-field-group material-price-wrapper"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  width: '320px',
                  flex: '0 0 auto',
                  flexShrink: 0
                }}
              >
                <label style={{ 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap'
                }}>
                  Birim Fiyat
                </label>
                <input
                  type="text"
                  value={materialPriceInput}
                  onChange={(e) => handleMaterialPriceInputChange(e.target.value)}
                  onBlur={handleMaterialPriceBlur}
                  placeholder="0.00"
                  className="inflation-input"
                  style={{
                    width: '120px',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    fontSize: '0.875rem',
                    height: '32px'
                  }}
                />
                <select
                  value={materialCurrency}
                  onChange={(e) => handleMaterialCurrencyChange(e.target.value)}
                  className="inflation-input"
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    fontSize: '0.875rem',
                    height: '32px',
                    width: '70px'
                  }}
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  /{selectedMaterial.unit}
                </span>
                {(!selectedMaterial.basePrice && !materialOverrides[selectedMaterial.label] && materialPriceValue === 0) && (
                  <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                    (Eksik fiyat)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tek Satır: 3 Alan + Butonlar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          {/* USD/TRY Alanı */}
          <div 
            className="inflation-field-group"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              flex: '0 0 auto',
              padding: '8px 12px',
              borderRadius: '8px'
            }}
          >
            <label style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}>
              USD/TRY
            </label>
            <input
              type="number"
              step="0.01"
              value={targets.usdtry}
              onChange={(e) => setTargets({ ...targets, usdtry: e.target.value })}
              className="inflation-input"
              style={{
                width: '120px',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '0.875rem',
                height: '32px'
              }}
              required
            />
            <span style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
            }}>
              Güncel: {current.usd}
            </span>
            {!targets.usdtry || targets.usdtry.trim() === '' ? (
              <span style={{ fontSize: '11px', color: '#ef4444' }}>
                Zorunlu
              </span>
            ) : null}
          </div>

          {/* EUR/TRY Alanı */}
          <div 
            className="inflation-field-group"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              flex: '0 0 auto',
              padding: '8px 12px',
              borderRadius: '8px'
            }}
          >
            <label style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}>
              EUR/TRY
            </label>
            <input
              type="number"
              step="0.01"
              value={targets.eurtry}
              onChange={(e) => setTargets({ ...targets, eurtry: e.target.value })}
              className="inflation-input"
              style={{
                width: '120px',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '0.875rem',
                height: '32px'
              }}
              required
            />
            <span style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
            }}>
              Güncel: {current.eur}
            </span>
            {!targets.eurtry || targets.eurtry.trim() === '' ? (
              <span style={{ fontSize: '11px', color: '#ef4444' }}>
                Zorunlu
              </span>
            ) : null}
          </div>

          {/* Enflasyon Alanı */}
          <div 
            className="inflation-field-group"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              flex: '0 0 auto',
              padding: '8px 12px',
              borderRadius: '8px'
            }}
          >
            <label style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap'
            }}>
              Enflasyon (%)
            </label>
            {/* Yıl Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '0.875rem',
                height: '32px',
                width: '80px'
              }}
            >
              {(() => {
                const currentYear = new Date().getFullYear()
                return [currentYear, currentYear + 1, currentYear + 2].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              })()}
            </select>
            {/* Dönem Dropdown (6/12 Ay) */}
            <select
              value={selectedHorizonMonths}
              onChange={(e) => setSelectedHorizonMonths(parseInt(e.target.value))}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '0.875rem',
                height: '32px',
                width: '70px'
              }}
            >
              <option value={6}>6 Ay</option>
              <option value={12}>12 Ay</option>
            </select>
            <input
              type="number"
              step="0.1"
              value={targets.inflation12m}
              onChange={(e) => setTargets({ ...targets, inflation12m: e.target.value })}
              className="inflation-input"
              style={{
                width: '120px',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '0.875rem',
                height: '32px'
              }}
            />
            <span style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
            }}>
              Güncel: {current.inf ?? '—'} (Dönem: {selectedYear} / {selectedHorizonMonths} Ay)
            </span>
          </div>

          {/* Butonlar - Sağda */}
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            alignItems: 'center',
            marginLeft: 'auto',
            flexWrap: 'wrap'
          }}>
            {savedMessage && (
              <div style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: '#d1fae5',
                border: '1px solid #6ee7b7',
                borderRadius: '6px',
                color: '#065f46',
                fontSize: '0.8125rem'
              }}>
                {savedMessage}
              </div>
            )}
            <button
              onClick={handleReset}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                height: '32px',
                backgroundColor: '#3a3a3a',
                color: '#ffffff',
                border: '1px solid #4a4a4a',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Sıfırla
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                height: '32px',
                backgroundColor: '#0066cc',
                color: '#ffffff',
                border: '1px solid #0052a3',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Grafikler - 2x2 Grid */}
      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '18px'
      }}>
        {/* Sol Üst: Birim Maliyet Waterfall */}
        <div className="chart-card" style={{
          minHeight: '360px',
          padding: '1.5rem'
        }}>
          <UnitCostWaterfallChart
            unitPrice={materialPriceValue}
            priceCurrency={materialCurrency}
            usdTry={parseFloat(targets.usdtry) || current?.usd || 34.25}
            eurtry={parseFloat(targets.eurtry) || current?.eur || 37.18}
            inflationPercent={parseFloat(targets.inflation12m) || current?.inf || 0}
            periodMonths={selectedHorizonMonths || 12}
            baseUsdTry={current?.usd || 34.25}
            baseEurTry={current?.eur || 37.18}
            unit={selectedMaterial?.unit || 'kg'}
          />
        </div>

        {/* Sağ Üst: Senaryo Hassasiyet Analizi (Tornado) */}
        <div className="chart-card" style={{
          minHeight: '360px',
          padding: '1.5rem'
        }}>
          <ScenarioSensitivityTornadoChart
            selectedMaterial={selectedMaterial}
            unitPrice={materialPriceValue}
            unitCurrency={materialCurrency}
            usdTry={parseFloat(targets.usdtry) || current?.usd || 34.25}
            eurTry={parseFloat(targets.eurtry) || current?.eur || 37.18}
            inflationRate={parseFloat(targets.inflation12m) || current?.inf || 0}
            months={selectedHorizonMonths || 12}
            year={selectedYear}
          />
        </div>

        {/* Sol Alt: Birim Maliyet Projeksiyonu (Çizgisel) */}
        <div className="chart-card" style={{
          minHeight: '360px',
          padding: '1.5rem'
        }}>
          <UnitCostForecastLineChart
            selectedMaterial={selectedMaterial}
            unitPrice={materialPriceValue}
            priceCurrency={materialCurrency}
            usdTry={parseFloat(targets.usdtry) || current?.usd || 34.25}
            eurTry={parseFloat(targets.eurtry) || current?.eur || 37.18}
            inflationRate={parseFloat(targets.inflation12m) || current?.inf || 0}
            periodMonths={selectedHorizonMonths || 12}
          />
        </div>

        {/* Sağ Alt: Toplu Alım Bütçe Etkisi */}
        <div className="chart-card" style={{
          minHeight: '360px',
          padding: '1.5rem'
        }}>
          <BulkPurchaseBudgetImpactChart
            selectedMaterial={selectedMaterial}
            unitPrice={materialPriceValue}
            priceCurrency={materialCurrency}
            usdTry={parseFloat(targets.usdtry) || current?.usd || 34.25}
            eurTry={parseFloat(targets.eurtry) || current?.eur || 37.18}
            inflationPercent={parseFloat(targets.inflation12m) || current?.inf || 0}
          />
        </div>
      </div>
    </>
  )
}

export default Inflation
