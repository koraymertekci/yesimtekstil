import React from 'react'
import { AlertTriangle, AlertCircle, Calendar, XCircle } from 'lucide-react'
import '../App.css'

function KpiCards({ kpis, filteredKpis }) {
  const displayKpis = filteredKpis || kpis || {}

  const cards = [
    {
      label: 'Yüksek Riskli Sipariş',
      value: displayKpis.highRisk !== undefined ? displayKpis.highRisk : (displayKpis.criticalOrders || 0),
      icon: AlertTriangle,
      color: '#dc3545'
    },
    {
      label: 'Orta Riskli Sipariş',
      value: displayKpis.mediumRisk !== undefined ? displayKpis.mediumRisk : 0,
      icon: AlertCircle,
      color: '#f59e0b'
    },
    {
      label: 'Bu Hafta Teslim Edilecek',
      value: displayKpis.thisWeekDeliveries !== undefined ? displayKpis.thisWeekDeliveries : 0,
      icon: Calendar,
      color: '#3b82f6'
    },
    {
      label: 'Tahmine Göre Yetişmeyecek',
      value: displayKpis.willNotDeliver !== undefined ? displayKpis.willNotDeliver : 0,
      icon: XCircle,
      color: '#ef4444'
    }
  ]

  return (
    <div className="kpi-cards-grid">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="kpi-card">
            <div className="kpi-card-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
              <Icon size={24} />
            </div>
            <div className="kpi-card-content">
              <div className="kpi-card-value">{card.value}</div>
              <div className="kpi-card-label">{card.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KpiCards
