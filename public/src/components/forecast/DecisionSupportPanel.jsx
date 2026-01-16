import React, { useState } from 'react'
import { Sparkles, X, ChevronUp, Rocket, CheckCircle2, AlertTriangle, Info, ChevronDown, Target, Eye } from 'lucide-react'
import '../../App.css'

function DecisionSupportPanel({ 
  shortSummary, 
  observations, 
  suggestions, 
  statusLabel, 
  calloutText, 
  kpis,
  preSeason,
  onClose 
}) {
  const [isPreSeasonOpen, setIsPreSeasonOpen] = useState(false)
  // Durum rozeti rengi
  const getStatusColor = (status) => {
    if (!status) return { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' }
    const statusLower = status.toLowerCase()
    if (statusLower.includes('kritik') || statusLower.includes('dikkat') || statusLower.includes('risk')) {
      return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
    } else if (statusLower.includes('kontrollü') || statusLower.includes('dengeli') || statusLower.includes('iyi')) {
      return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }
    } else {
      return { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' }
    }
  }

  const statusStyle = getStatusColor(statusLabel)

  return (
    <div className="decision-support-panel-enhanced">
      {/* ÜST ŞERİT (Header strip) */}
      <div className="decision-support-header">
        <div className="decision-support-header-left">
          <Sparkles size={18} className="decision-support-icon" />
          <h4 className="decision-support-panel-title">
            Karar Destek Özeti (Gelecek Sezon - 12 Ay)
          </h4>
        </div>
        <div className="decision-support-header-right">
          {statusLabel && (
            <span 
              className="decision-support-status-badge"
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                borderColor: statusStyle.border
              }}
            >
              {statusLabel}
            </span>
          )}
          {onClose && (
            <button
              className="decision-support-close-btn"
              onClick={onClose}
              title="Kapat"
            >
              <ChevronUp size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ORTA İÇERİK (Content - 2 kolon grid) */}
      <div className="decision-support-content-grid">
        {/* Sol Kolon */}
        <div className="decision-support-content-left">
          {/* Kısa Özet */}
          {shortSummary && (
            <div className="decision-support-section">
              <div className="decision-support-summary-text">
                {shortSummary}
              </div>
            </div>
          )}

          {/* Gözlemler */}
          {observations && observations.length > 0 && (
            <div className="decision-support-section">
              <h5 className="decision-support-section-title">
                <Info size={16} className="decision-support-section-icon" />
                Gözlemler
              </h5>
              <ul className="decision-support-list-enhanced">
                {observations.map((obs, index) => (
                  <li key={index}>
                    <span className="decision-support-bullet"></span>
                    {obs}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sağ Kolon */}
        <div className="decision-support-content-right">
          {/* Değerlendirme Notları */}
          {suggestions && suggestions.length > 0 && (
            <div className="decision-support-section">
              <h5 className="decision-support-section-title">
                <CheckCircle2 size={16} className="decision-support-section-icon" />
                Değerlendirme Notları
              </h5>
              <ul className="decision-support-list-enhanced">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <span className="decision-support-bullet"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mini KPI Kutucukları */}
      {kpis && kpis.length > 0 && (
        <div className="decision-support-kpis">
          {kpis.map((kpi, index) => (
            <div key={index} className="decision-support-kpi-card">
              <div className="decision-support-kpi-label">{kpi.label}</div>
              <div className="decision-support-kpi-value">{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* SEZONA GELMEDEN YAPILMASI GEREKENLER (Accordion) */}
      {preSeason && (preSeason.preparationSteps?.length > 0 || preSeason.riskMitigationNotes?.length > 0 || preSeason.checklistMetrics?.length > 0) && (
        <div className="decision-support-longterm-section">
          <button
            className="decision-support-longterm-header"
            onClick={() => setIsPreSeasonOpen(!isPreSeasonOpen)}
          >
            <div className="decision-support-longterm-header-left">
              <Target size={16} className="decision-support-longterm-icon" />
              <span className="decision-support-longterm-title">
                Sezona Gelmeden Yapılması Gerekenler (6 Ay)
              </span>
            </div>
            {isPreSeasonOpen ? (
              <ChevronUp size={18} className="decision-support-longterm-chevron" />
            ) : (
              <ChevronDown size={18} className="decision-support-longterm-chevron" />
            )}
          </button>

          {isPreSeasonOpen && (
            <div className="decision-support-longterm-content">
              <div className="decision-support-longterm-grid">
                {/* Sol Kolon: Hazırlık Adımları */}
                {preSeason.preparationSteps && preSeason.preparationSteps.length > 0 && (
                  <div className="decision-support-longterm-column">
                    <h5 className="decision-support-longterm-column-title">
                      <Target size={14} className="decision-support-section-icon" />
                      Hazırlık Adımları
                    </h5>
                    <ul className="decision-support-list-enhanced">
                      {preSeason.preparationSteps.map((step, index) => (
                        <li key={index}>
                          <span className="decision-support-bullet"></span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sağ Kolon: Risk Azaltma Notları */}
                {preSeason.riskMitigationNotes && preSeason.riskMitigationNotes.length > 0 && (
                  <div className="decision-support-longterm-column">
                    <h5 className="decision-support-longterm-column-title">
                      <AlertTriangle size={14} className="decision-support-section-icon" />
                      Risk Azaltma Notları
                    </h5>
                    <ul className="decision-support-list-enhanced">
                      {preSeason.riskMitigationNotes.map((note, index) => (
                        <li key={index}>
                          <span className="decision-support-bullet"></span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Kontrol Listesi (Ölçülecek Göstergeler) */}
              {preSeason.checklistMetrics && preSeason.checklistMetrics.length > 0 && (
                <div className="decision-support-longterm-assumptions">
                  <h6 className="decision-support-longterm-assumptions-title">
                    <Eye size={14} className="decision-support-section-icon" style={{ marginRight: '0.5rem' }} />
                    Kontrol Listesi (Ölçülecek Göstergeler)
                  </h6>
                  <ul className="decision-support-list-enhanced">
                    {preSeason.checklistMetrics.map((metric, index) => (
                      <li key={index}>
                        <span className="decision-support-bullet"></span>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ALT VURGU ŞERİDİ (Footer callout bar) */}
      {calloutText && (
        <div className="decision-support-callout">
          <Rocket size={18} className="decision-support-callout-icon" />
          <span className="decision-support-callout-text">{calloutText}</span>
        </div>
      )}
    </div>
  )
}

export default DecisionSupportPanel
