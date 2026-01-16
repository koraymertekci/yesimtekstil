import React, { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { CUSTOMER_OPTIONS } from '../data/customers'
import { getActiveOrders } from '../utils/orderKpis'
import '../App.css'

function OrderTable({ orders, onOrderClick, onFilteredOrdersChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customerFilter, setCustomerFilter] = useState('ALL')
  const [stageFilter, setStageFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [thisWeekOnly, setThisWeekOnly] = useState(false)

  // Aktif siparişleri filtrele
  const activeOrders = useMemo(() => {
    return getActiveOrders(orders)
  }, [orders])

  // Filtrelenmiş siparişler
  const filteredOrders = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    let filtered = activeOrders

    // Arama
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(searchLower) ||
        order.customer.toLowerCase().includes(searchLower) ||
        order.productGroup.toLowerCase().includes(searchLower)
      )
    }

    // Müşteri filtresi
    if (customerFilter && customerFilter !== 'ALL') {
      filtered = filtered.filter(order => order.customer === customerFilter)
    }

    // Aşama filtresi
    if (stageFilter) {
      filtered = filtered.filter(order => order.stage === stageFilter)
    }

    // Risk filtresi
    if (riskFilter) {
      filtered = filtered.filter(order => order.riskLevel === riskFilter)
    }

    // Bu hafta teslim
    if (thisWeekOnly) {
      filtered = filtered.filter(order => {
        const deliveryDate = new Date(order.deliveryDate)
        deliveryDate.setHours(0, 0, 0, 0)
        return deliveryDate >= today && deliveryDate <= weekFromNow
      })
    }

    return filtered
  }, [activeOrders, searchTerm, customerFilter, stageFilter, riskFilter, thisWeekOnly])

  // Filtrelenmiş siparişleri parent'a bildir
  useEffect(() => {
    if (onFilteredOrdersChange) {
      onFilteredOrdersChange(filteredOrders)
    }
  }, [filteredOrders, onFilteredOrdersChange])

  // Özet istatistikler
  const summaryStats = useMemo(() => {
    const total = filteredOrders.length
    const highRisk = filteredOrders.filter(o => o.riskLevel === 'high').length
    return { total, highRisk }
  }, [filteredOrders])

  // Tarih formatı (DD.MM.YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  // Progress bar renk
  const getProgressColor = (progress) => {
    if (progress >= 70) return '#10b981' // Yeşil
    if (progress >= 40) return '#f59e0b' // Sarı
    return '#ef4444' // Kırmızı
  }

  // Kalan gün renk
  const getDaysRemainingColor = (days) => {
    if (days < 0) return '#dc3545' // Geçmiş - Kırmızı
    if (days < 5) return '#dc3545' // Kırmızı
    if (days <= 15) return '#f59e0b' // Sarı
    return '#10b981' // Yeşil
  }

  // Kalan gün formatı
  const formatDaysRemaining = (days) => {
    if (days < 0) return `−${Math.abs(days)}`
    return days.toString()
  }

  // Risk nedeni tooltip metni
  const getRiskReasonTooltip = (order) => {
    if (!order.riskReasons || order.riskReasons.length === 0) {
      return 'Risk nedeni bulunmamaktadır'
    }
    
    // İlk 2 nedeni göster
    const reasons = order.riskReasons.slice(0, 2)
    return reasons.join(' • ')
  }

  // Müşteri seçildiğinde ve aktif sipariş yoksa empty state göster
  const showEmptyState = customerFilter && customerFilter !== 'ALL' && filteredOrders.length === 0

  return (
    <div className="order-table-container">
      {/* Filtreler - Kompakt */}
      <div className="order-filters-compact">
        <div className="filter-group">
          <div className="search-box-compact">
            <Search size={16} />
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-compact"
            />
          </div>
        </div>

        <div className="filter-group">
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="filter-select-compact"
          >
            {CUSTOMER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="filter-select-compact"
          >
            <option value="">Tüm Aşamalar</option>
            <option value="Planlama">Planlama</option>
            <option value="Kesim">Kesim</option>
            <option value="Dikim">Dikim</option>
            <option value="Boya-Baskı">Boya-Baskı</option>
            <option value="Kalite">Kalite</option>
            <option value="Paketleme">Paketleme</option>
            <option value="Sevkiyat">Sevkiyat</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="filter-select-compact"
          >
            <option value="">Tüm Riskler</option>
            <option value="high">Yüksek Risk</option>
            <option value="medium">Orta Risk</option>
            <option value="low">Düşük Risk</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="toggle-label-compact">
            <input
              type="checkbox"
              checked={thisWeekOnly}
              onChange={(e) => setThisWeekOnly(e.target.checked)}
            />
            <span>Bu Hafta</span>
          </label>
        </div>
      </div>

      {/* Tablo */}
      <div className="table-wrapper">
        <table className="order-table-professional">
          <thead>
            <tr>
              <th>Müşteri/Marka</th>
              <th>Ürün Grubu</th>
              <th className="text-right">Adet</th>
              <th>Sipariş Tarihi</th>
              <th>Teslim Tarihi</th>
              <th>Aşama</th>
              <th>İlerleme</th>
              <th className="text-center">Kalan Gün</th>
              <th>Termin Riski</th>
            </tr>
          </thead>
          <tbody>
            {showEmptyState ? (
              <tr>
                <td colSpan="9" className="table-empty-state">
                  Aktif sipariş bulunamadı
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty">
                  Sipariş bulunamadı
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onOrderClick(order)}
                  className={`order-row-professional ${order.riskLevel === 'high' ? 'high-risk-row' : ''}`}
                  title={order.riskLevel === 'high' ? 'Detay öneri görüntüle' : 'Detayları görüntüle'}
                >
                  {/* Müşteri/Marka - Marka kalın, altında Sipariş ID */}
                  <td className="customer-cell">
                    <div className="customer-name">{order.customer}</div>
                    <div className="order-id-subtext">{order.orderId}</div>
                  </td>
                  
                  {/* Ürün Grubu - Chip/Badge */}
                  <td>
                    <span className="product-chip">{order.productGroup}</span>
                  </td>
                  
                  {/* Adet - Sağdan hizalı, küçük font */}
                  <td className="quantity-cell text-right">
                    {order.quantity ? order.quantity.toLocaleString('tr-TR') : '-'}
                  </td>
                  
                  {/* Sipariş Tarihi */}
                  <td className="date-cell">
                    {order.orderDate ? formatDate(order.orderDate) : '-'}
                  </td>
                  
                  {/* Teslim Tarihi - Vurgulu */}
                  <td className="date-cell delivery-date">
                    {order.deliveryDate ? formatDate(order.deliveryDate) : '-'}
                  </td>
                  
                  {/* Aşama */}
                  <td>
                    <span className="stage-badge">{order.stage}</span>
                  </td>
                  
                  {/* İlerleme - İnce progress bar + badge */}
                  <td>
                    <div className="progress-container-professional">
                      <div className="progress-bar-wrapper-thin">
                        <div
                          className="progress-bar-thin"
                          style={{
                            width: `${order.progress}%`,
                            backgroundColor: getProgressColor(order.progress)
                          }}
                        />
                      </div>
                      <span className="progress-badge">{order.progress}%</span>
                    </div>
                  </td>
                  
                  {/* Kalan Gün - Renk kodlu */}
                  <td className="text-center">
                    <span 
                      className="days-remaining"
                      style={{ color: getDaysRemainingColor(order.daysRemaining) }}
                    >
                      {formatDaysRemaining(order.daysRemaining)}
                    </span>
                  </td>
                  
                  {/* Termin Riski - Pill badge + tooltip */}
                  <td>
                    <span 
                      className={`risk-pill risk-${order.riskLevel}`}
                      title={getRiskReasonTooltip(order)}
                    >
                      {order.riskLevel === 'high' ? 'Yüksek' : order.riskLevel === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer-professional">
        <div className="table-summary">
          <span className="summary-item">Toplam: <strong>{summaryStats.total}</strong></span>
          <span className="summary-item">Yüksek Risk: <strong style={{ color: '#dc3545' }}>{summaryStats.highRisk}</strong></span>
        </div>
        <span className="table-count">{filteredOrders.length} sipariş gösteriliyor</span>
      </div>
    </div>
  )
}

export default OrderTable
