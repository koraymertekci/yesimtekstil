/**
 * DEPRECATED: Bu component artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import '../App.css'

function ScenarioCards({ scenarios }) {
  if (!scenarios || scenarios.length === 0) {
    return null
  }

  const getStatusIcon = (canDeliver) => {
    return canDeliver ? (
      <CheckCircle size={24} color="#10b981" />
    ) : (
      <XCircle size={24} color="#ef4444" />
    )
  }

  const getStatusColor = (canDeliver) => {
    return canDeliver ? '#10b981' : '#ef4444'
  }

  const formatCost = (cost) => {
    if (cost >= 1000000) {
      return `${(cost / 1000000).toFixed(1)}M TL`
    }
    if (cost >= 1000) {
      return `${(cost / 1000).toFixed(0)}K TL`
    }
    return `${cost.toFixed(0)} TL`
  }

  return (
    <div className="card">
      <div className="card-header-professional">
        <h2 className="card-title">Otomatik Senaryo Önerileri</h2>
      </div>
      
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              style={{
                border: `2px solid ${getStatusColor(scenario.canDeliver)}`,
                borderRadius: '12px',
                padding: '1.5rem',
                backgroundColor: scenario.canDeliver ? '#f0fdf4' : '#fef2f2',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{scenario.name}</h3>
                {getStatusIcon(scenario.canDeliver)}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Kapasite Yeterlilik:</span>
                  <span style={{ fontWeight: '600', color: scenario.capacityAdequacy >= 100 ? '#10b981' : '#ef4444' }}>
                    {scenario.capacityAdequacy}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Stok Yeterlilik:</span>
                  <span style={{ fontWeight: '600', color: scenario.materialAdequacy >= 100 ? '#10b981' : '#ef4444' }}>
                    {scenario.materialAdequacy}%
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Gerekli Aksiyonlar:</div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#1e293b' }}>
                  {scenario.actions.map((action, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{action}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Tahmini Maliyet</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                  {formatCost(scenario.estimatedCost)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: scenario.canDeliver ? '#f0fdf4' : '#fef2f2', borderRadius: '6px' }}>
                <AlertTriangle size={16} color={scenario.canDeliver ? '#10b981' : '#ef4444'} />
                <span style={{ fontSize: '0.85rem', color: scenario.canDeliver ? '#065f46' : '#991b1b', fontWeight: '500' }}>
                  {scenario.riskNote}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ScenarioCards

