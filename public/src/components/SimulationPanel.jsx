/**
 * DEPRECATED: Bu component artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

import React, { useState, useEffect, useMemo } from 'react'
import '../App.css'

function SimulationPanel({ forecast, onSimulationChange }) {
  const [seasonDurationDays, setSeasonDurationDays] = useState(forecast?.seasonDurationDays || 120)
  const [overtimePercent, setOvertimePercent] = useState(0)
  const [additionalWorkforce, setAdditionalWorkforce] = useState(0)
  const [outsourcingQty, setOutsourcingQty] = useState(0)
  const [additionalMaterialPurchase, setAdditionalMaterialPurchase] = useState({})
  const [serviceLevelTarget, setServiceLevelTarget] = useState(95)

  // Debounce için timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSimulationChange && forecast) {
        onSimulationChange({
          seasonDurationDays,
          overtimePercent,
          additionalWorkforce,
          outsourcingQty,
          additionalMaterialPurchase,
          serviceLevelTarget
        })
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [seasonDurationDays, overtimePercent, additionalWorkforce, outsourcingQty, additionalMaterialPurchase, serviceLevelTarget, forecast, onSimulationChange])

  if (!forecast) {
    return null
  }

  return (
    <div className="card">
      <div className="card-header-professional">
        <h2 className="card-title">Simülasyon Parametreleri</h2>
        <div className="card-subtitle">Parametreleri değiştirdikçe sonuçlar anlık güncellenir</div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Sezon Süresi */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
              Sezon Süresi (Gün)
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="range"
                min="60"
                max="180"
                step="10"
                value={seasonDurationDays}
                onChange={(e) => setSeasonDurationDays(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                {seasonDurationDays} gün
              </span>
            </div>
          </div>

          {/* Fazla Mesai */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
              Fazla Mesai (%)
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={overtimePercent}
                onChange={(e) => setOvertimePercent(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                {overtimePercent}%
              </span>
            </div>
          </div>

          {/* Ek İşgücü */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
              Ek İşgücü (Kişi)
            </label>
            <input
              type="number"
              min="0"
              max="200"
              value={additionalWorkforce}
              onChange={(e) => setAdditionalWorkforce(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
              className="forecast-input-small"
              style={{ width: '100%' }}
            />
          </div>

          {/* Dış Kaynak */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
              Dış Kaynak Miktarı ({forecast.unit})
            </label>
            <input
              type="number"
              min="0"
              max={forecast.forecastQty}
              value={outsourcingQty}
              onChange={(e) => setOutsourcingQty(Math.max(0, Math.min(forecast.forecastQty, parseInt(e.target.value) || 0)))}
              className="forecast-input-small"
              style={{ width: '100%' }}
            />
          </div>

          {/* Service Level Target */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
              Service Level Hedefi (%)
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="range"
                min="90"
                max="99"
                step="1"
                value={serviceLevelTarget}
                onChange={(e) => setServiceLevelTarget(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                {serviceLevelTarget}%
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Ek Hammadde Satın Alma (Kritik Hammaddeler)
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
            Kritik hammaddeler simülasyon sonuçlarına göre otomatik belirlenir
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimulationPanel

