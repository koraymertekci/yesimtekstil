import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle, Circle, AlertCircle, TrendingUp, TrendingDown, Package } from 'lucide-react'
import '../App.css'

function OrderDetailModal({ order, onClose }) {
  const navigate = useNavigate()

  if (!order) return null

  // Karar önerileri oluştur
  const recommendations = []
  
  if (order.riskLevel === 'high') {
    recommendations.push({
      action: 'Acil müdahale gerekli',
      impact: 'Termin riskini azaltmak için ek kaynak tahsis edilebilir',
      priority: 'Yüksek'
    })
  }
  if (order.daysRemaining !== null && order.daysRemaining < 7) {
    recommendations.push({
      action: 'Teslim tarihi yaklaşıyor',
      impact: 'Müşteri ile iletişime geçilerek durum bildirilebilir',
      priority: 'Orta'
    })
  }
  if (order.progress < 50 && order.daysRemaining !== null && order.daysRemaining < 14) {
    recommendations.push({
      action: 'İlerleme yetersiz',
      impact: 'Üretim planı gözden geçirilebilir ve hızlandırma önlemleri alınabilir',
      priority: 'Yüksek'
    })
  }
  
  // Eğer hiç öneri yoksa bilgilendirme ekle
  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Sipariş normal seyrinde',
      impact: 'Mevcut planlama yeterli görünmektedir',
      priority: 'Düşük'
    })
  }

  // Stok nedeni varsa ilgili hammaddeleri görüntüle butonu
  const handleViewMaterials = () => {
    // Stok Yönetimi sayfasına yönlendir
    navigate('/stock')
    onClose()
    // Sayfa yüklendikten sonra ilgili hammaddelere scroll yapılabilir
    // (Bu özellik için Stock sayfasında URL parametresi veya state kullanılabilir)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-dss" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-dss">
          <div className="modal-header-left">
            <h2>{order.orderId}</h2>
            <p className="modal-subtitle">{order.customer} • {order.productGroup}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body-dss">
          {/* 1. Üst Özet (KPI'lar) */}
          <div className="summary-kpis">
            <div className="summary-kpi">
              <div className="kpi-label">Kalan Gün</div>
              <div className={`kpi-value ${order.daysRemaining < 0 ? 'critical' : order.daysRemaining <= 7 ? 'warning' : 'normal'}`}>
                {order.daysRemaining}
              </div>
            </div>
            <div className="summary-kpi">
              <div className="kpi-label">Termin Riski</div>
              <div className="kpi-value">
                <span className={`badge badge-${order.riskLevel}`}>
                  {order.riskLevel === 'high' ? 'Yüksek' : order.riskLevel === 'medium' ? 'Orta' : 'Düşük'}
                </span>
              </div>
            </div>
            <div className="summary-kpi">
              <div className="kpi-label">Yetişecek mi?</div>
              <div className="kpi-value">
                <span className={`will-deliver-badge will-deliver-${(order.willDeliver || 'Evet').toLowerCase().replace('ş', 's')}`}>
                  {order.willDeliver || 'Evet'}
                </span>
                {order.willDeliverConfidence && (
                  <span className="confidence-badge">{order.willDeliverConfidence}</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. İlerleme Karşılaştırması */}
          <div className="progress-comparison-section">
            <h3 className="section-title">İlerleme Karşılaştırması</h3>
            <div className="progress-kpi-grid">
              <div className="progress-kpi">
                <div className="progress-kpi-label">Gerçek İlerleme</div>
                <div className="progress-kpi-value">{order.progress}%</div>
              </div>
              <div className="progress-kpi">
                <div className="progress-kpi-label">Beklenen İlerleme</div>
                <div className="progress-kpi-value expected">{order.expectedProgress || Math.round((order.daysRemaining || 0) / 30 * 100)}%</div>
              </div>
              <div className="progress-kpi">
                <div className="progress-kpi-label">Sapma</div>
                <div className={`progress-kpi-value ${(order.delayDifference || 0) > 0 ? 'negative' : 'positive'}`}>
                  {(order.delayDifference || 0) > 0 ? '+' : ''}{order.delayDifference || 0}%
                </div>
              </div>
            </div>
            
            {/* Dual Progress Bar */}
            <div className="dual-progress-container">
              <div className="dual-progress-bar">
                <div 
                  className="progress-bar-expected"
                  style={{ width: `${order.expectedProgress || Math.round((order.daysRemaining || 0) / 30 * 100)}%` }}
                />
                <div 
                  className="progress-bar-actual"
                  style={{ 
                    width: `${order.progress || 0}%`,
                    backgroundColor: (order.progress || 0) >= 80 ? '#10b981' : (order.progress || 0) >= 50 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
              <div className="progress-legend">
                <div className="legend-item">
                  <div className="legend-color expected"></div>
                  <span>Beklenen</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color actual"></div>
                  <span>Gerçek</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Aşama Timeline */}
          <div className="timeline-section">
            <h3 className="section-title">Aşama Timeline</h3>
            <div className="timeline-dss">
              {(order.stageHistory || []).map((stageItem, index) => {
                const isCompleted = stageItem.status === 'completed'
                const isCurrent = stageItem.status === 'current'
                const isPending = stageItem.status === 'pending'
                
                return (
                  <div key={stageItem.stage} className={`timeline-item-dss ${stageItem.status}`}>
                    <div className="timeline-marker-dss">
                      {isCompleted ? (
                        <CheckCircle size={20} className="timeline-icon completed" />
                      ) : isCurrent ? (
                        <Circle size={20} className="timeline-icon current" />
                      ) : (
                        <Circle size={20} className="timeline-icon pending" />
                      )}
                    </div>
                    <div className="timeline-content-dss">
                      <div className="timeline-stage-header">
                        <div className="timeline-stage-name">{stageItem.stage}</div>
                        {isCurrent && <span className="timeline-current-badge">Devam Ediyor</span>}
                      </div>
                      <div className="timeline-stage-details">
                        <div className="timeline-detail-item">
                          <span className="detail-label">Planlanan:</span>
                          <span className="detail-value">{stageItem.plannedDays} gün</span>
                        </div>
                        {stageItem.actualDays !== null && (
                          <div className="timeline-detail-item">
                            <span className="detail-label">Gerçekleşen:</span>
                            <span className="detail-value">{stageItem.actualDays} gün</span>
                          </div>
                        )}
                        {stageItem.delay !== null && stageItem.delay !== 0 && (
                          <div className="timeline-detail-item">
                            <span className={`detail-label delay ${stageItem.delay > 0 ? 'negative' : 'positive'}`}>
                              Sapma:
                            </span>
                            <span className={`detail-value ${stageItem.delay > 0 ? 'negative' : 'positive'}`}>
                              {stageItem.delay > 0 ? '+' : ''}{stageItem.delay} gün
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. Termin Risk Analizi */}
          <div className="risk-analysis-section">
            <h3 className="section-title">Termin Risk Analizi</h3>
            <div className="risk-score-display">
              <div className={`risk-level-badge badge-${order.riskLevel}`}>
                {order.riskLevel === 'high' ? 'Yüksek Risk' : order.riskLevel === 'medium' ? 'Orta Risk' : 'Düşük Risk'}
              </div>
            </div>
            
            {order.riskReasons && order.riskReasons.length > 0 && (
              <div className="risk-reasons">
                <div className="risk-reasons-title">
                  <AlertCircle size={18} />
                  <span>Risk Nedenleri:</span>
                </div>
                <ul className="risk-reasons-list">
                  {order.riskReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stok nedeni varsa "İlgili hammaddeleri görüntüle" butonu */}
            {order.riskReasonType === 'stock' && (
              <div className="stock-action-section">
                <button 
                  className="view-materials-btn"
                  onClick={handleViewMaterials}
                >
                  <Package size={18} />
                  <span>İlgili hammaddeleri görüntüle</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Karar Önerileri */}
          <div className="recommendations-section">
            <h3 className="section-title">Karar Önerileri</h3>
            <div className="recommendations-list">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-header">
                    <div className="recommendation-number">{index + 1}</div>
                    <div className="recommendation-content">
                      <div className="recommendation-action">{rec.action}</div>
                      <div className="recommendation-impact">{rec.impact}</div>
                    </div>
                    <div className={`recommendation-priority priority-${rec.priority.toLowerCase()}`}>
                      {rec.priority}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailModal
