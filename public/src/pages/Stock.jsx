import React, { useState, useMemo, useRef, useEffect } from 'react'
import { AlertCircle, ShoppingCart, Eye, CheckCircle, Calendar, Package } from 'lucide-react'
import { getCriticalStocks, toggleMaterialTracking } from '../api/stocks.api'
import StockForecastChart from '../components/StockForecastChart'
import '../App.css'

function Stock() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStock, setSelectedStock] = useState(null)
  const [stockDetail, setStockDetail] = useState(null)
  const [selectedMaterialForChart, setSelectedMaterialForChart] = useState(null)
  const chartRef = useRef(null)

  // Load stocks from API
  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getCriticalStocks()
        setStocks(data)
      } catch (err) {
        console.error('API error:', err)
        setError(err.message || 'Veri yüklenemedi')
        setStocks([])
      } finally {
        setLoading(false)
      }
    }

    fetchStocks()
  }, [])

  const handleStockClick = (stock) => {
    setSelectedStock(stock.rawMaterialId)
    setStockDetail(stock)
    // Grafik için hammadde seç
    setSelectedMaterialForChart(stock.rawMaterialId)
    
    // Smooth scroll to chart
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleCloseDetail = () => {
    setSelectedStock(null)
    setStockDetail(null)
  }

  // Format sayı (binlik ayırıcı)
  const formatNumber = (num) => {
    return new Intl.NumberFormat('tr-TR').format(num)
  }

  // Birim gösterimi
  const getUnitDisplay = (value, unit) => {
    return `${formatNumber(value)} ${unit}`
  }

  // Tarih formatı (DD.MM.YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  // Stok bitecek gün renk kodlaması
  const getDaysUntilStockoutColor = (days, leadTime) => {
    if (days <= 0) return '#dc3545' // Stok bitti
    if (days <= leadTime) return '#dc3545' // Kırmızı - üretimi durdurma riski
    if (days <= leadTime * 1.5) return '#f59e0b' // Turuncu - yakında risk
    return '#10b981' // Yeşil - güvenli
  }

  // Kritiklik skoru renk kodlaması
  const getCriticalityColor = (score) => {
    if (score >= 61) return '#dc3545' // Yüksek - Kırmızı
    if (score >= 31) return '#f59e0b' // Orta - Turuncu
    return '#10b981' // Düşük - Yeşil
  }

  // Handle toggle tracking
  const handleToggleTracking = async (stock, e) => {
    e.stopPropagation()
    try {
      await toggleMaterialTracking(stock.rawMaterialId)
      // Optimistic update
      const updatedStocks = stocks.map(s => 
        s.rawMaterialId === stock.rawMaterialId
          ? {
              ...s,
              isTracked: !s.isTracked,
              action: !s.isTracked ? (s.riskLevel === 'high' ? 'Satın Al' : 'Takip Et') : 'Sorun Yok',
              actionType: !s.isTracked ? (s.riskLevel === 'high' ? 'primary' : 'warning') : 'success'
            }
          : s
      )
      setStocks(updatedStocks)
      // Update detail if open
      if (stockDetail && stockDetail.rawMaterialId === stock.rawMaterialId) {
        setStockDetail(updatedStocks.find(s => s.rawMaterialId === stock.rawMaterialId))
      }
    } catch (err) {
      console.error('Failed to toggle tracking:', err)
      // Could show toast/error message here
    }
  }

  // İşlem butonu render
  const renderActionButton = (stock) => {
    const baseClass = 'action-btn'
    
    if (stock.actionType === 'primary') {
      return (
        <button
          className={`${baseClass} action-btn-primary`}
          onClick={(e) => {
            e.stopPropagation()
            handleStockClick(stock)
          }}
          title="Acil satın alma önerisi"
        >
          <ShoppingCart size={16} />
          <span>{stock.action}</span>
        </button>
      )
    } else if (stock.actionType === 'warning') {
      return (
        <button
          className={`${baseClass} action-btn-warning`}
          onClick={(e) => handleToggleTracking(stock, e)}
          title="Yakından takip et - Tıklayarak takibi kapat"
        >
          <Eye size={16} />
          <span>{stock.action}</span>
        </button>
      )
    } else {
      return (
        <button
          className={`${baseClass} action-btn-success`}
          onClick={(e) => handleToggleTracking(stock, e)}
          title="Stok seviyesi normal - Tıklayarak takibe al"
        >
          <CheckCircle size={16} />
          <span>{stock.action}</span>
        </button>
      )
    }
  }

  return (
    <div>
      <h1 className="page-title">Kritik Stok & Satın Alma Önerileri</h1>

      {/* Kritik Stok Listesi - ÜST */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header-professional">
          <div>
            <h2 className="card-title">Kritik Stok Listesi</h2>
            <div className="card-subtitle">
              Toplam: <strong>{stocks.length}</strong> hammadde • 
              Yüksek Risk: <strong style={{ color: '#dc3545' }}>
                {stocks.filter(s => s.riskLevel === 'high').length}
              </strong>
            </div>
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="order-table-professional stock-table-compact">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Hammadde</th>
                <th className="text-right" style={{ minWidth: '100px' }}>Mevcut Stok</th>
                <th className="text-right" style={{ minWidth: '100px' }}>Emniyet Stok</th>
                <th className="text-right" style={{ minWidth: '140px' }}>Tahmini Tüketim (30 gün)</th>
                <th className="text-right" style={{ minWidth: '110px' }}>Günlük Tüketim</th>
                <th className="text-right" style={{ minWidth: '100px' }}>Eksik Miktar</th>
                <th className="text-center" style={{ minWidth: '120px' }}>Stok Bitecek Gün</th>
                <th className="text-center" style={{ minWidth: '110px' }}>Kritiklik Skoru</th>
                <th style={{ minWidth: '100px' }}>Risk Seviyesi</th>
                <th style={{ minWidth: '110px' }}>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="table-empty" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Yükleniyor...</div>
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="table-empty">
                    Stok verisi bulunamadı
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr
                    key={stock.rawMaterialId}
                    className={`order-row-professional ${stock.riskLevel === 'high' ? 'high-risk-row' : ''}`}
                    onClick={() => handleStockClick(stock)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="stock-name-cell">
                        <div className="stock-name">{stock.name}</div>
                        <div className="stock-category">{stock.category}</div>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="stock-value">
                        {getUnitDisplay(stock.currentStock, stock.unit)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="stock-value">
                        {getUnitDisplay(stock.safetyStock, stock.unit)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="stock-value">
                        {getUnitDisplay(stock.estimatedConsumption30Days, stock.unit)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="stock-value">
                        {getUnitDisplay(Math.round(stock.dailyConsumption * 10) / 10, stock.unit)}
                      </span>
                    </td>
                    <td className="text-right">
                      <span
                        className="stock-value"
                        style={{
                          color: stock.shortage > 0 ? '#dc3545' : '#28a745',
                          fontWeight: stock.shortage > 0 ? 600 : 400
                        }}
                      >
                        {getUnitDisplay(stock.shortage, stock.unit)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className="days-until-stockout"
                        style={{
                          color: getDaysUntilStockoutColor(stock.daysUntilStockout, stock.leadTimeDays),
                          fontWeight: 600
                        }}
                      >
                        {stock.daysUntilStockout > 0 ? stock.daysUntilStockout : 'Bitti'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className="criticality-score"
                        style={{
                          color: getCriticalityColor(stock.criticalityScore),
                          fontWeight: 600
                        }}
                      >
                        {stock.criticalityScore}/100
                      </span>
                    </td>
                    <td>
                      <span className={`risk-pill risk-${stock.riskLevel}`}>
                        {stock.riskLevel === 'high' ? 'Yüksek' : 
                         stock.riskLevel === 'medium' ? 'Orta' : 'Düşük'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {renderActionButton(stock)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Uzun Vadeli Stok Projeksiyonu - ALT */}
      <div ref={chartRef}>
        <StockForecastChart selectedMaterialId={selectedMaterialForChart} stocks={stocks} />
      </div>

      {/* Stok Detay Modal */}
      {stockDetail && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Hammadde Detayı</h2>
              <button className="modal-close" onClick={handleCloseDetail}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>{stockDetail.name}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Kategori:</label>
                    <span>{stockDetail.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>Birim:</label>
                    <span>{stockDetail.unit}</span>
                  </div>
                  <div className="detail-item">
                    <label>Mevcut Stok:</label>
                    <span>{getUnitDisplay(stockDetail.currentStock, stockDetail.unit)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Emniyet Stok:</label>
                    <span>{getUnitDisplay(stockDetail.safetyStock, stockDetail.unit)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Tahmini Tüketim (30 gün):</label>
                    <span>{getUnitDisplay(stockDetail.estimatedConsumption30Days, stockDetail.unit)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Günlük Tüketim:</label>
                    <span>{getUnitDisplay(Math.round(stockDetail.dailyConsumption * 10) / 10, stockDetail.unit)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Eksik Miktar:</label>
                    <span style={{ 
                      color: stockDetail.shortage > 0 ? '#dc3545' : '#28a745', 
                      fontWeight: 600 
                    }}>
                      {getUnitDisplay(stockDetail.shortage, stockDetail.unit)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Stok Bitecek Gün:</label>
                    <span style={{
                      color: getDaysUntilStockoutColor(stockDetail.daysUntilStockout, stockDetail.leadTimeDays),
                      fontWeight: 600
                    }}>
                      {stockDetail.daysUntilStockout > 0 ? `${stockDetail.daysUntilStockout} gün` : 'Stok bitti'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Kritiklik Skoru:</label>
                    <span style={{ 
                      color: getCriticalityColor(stockDetail.criticalityScore),
                      fontWeight: 700,
                      fontSize: '1.2rem'
                    }}>
                      {stockDetail.criticalityScore}/100
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Risk Seviyesi:</label>
                    <span className={`risk-pill risk-${stockDetail.riskLevel}`}>
                      {stockDetail.riskLevel === 'high' ? 'Yüksek' : 
                       stockDetail.riskLevel === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Tedarik Süresi (Lead Time):</label>
                    <span>{stockDetail.leadTimeDays} gün</span>
                  </div>
                </div>
              </div>
              
              {/* Önerilen Sipariş Bilgileri */}
              <div className="detail-section">
                <h3 className="section-title">Satın Alma Önerileri</h3>
                <div className="recommendation-box">
                  <div className="recommendation-item">
                    <Package size={20} />
                    <div>
                      <label>Önerilen Sipariş Miktarı:</label>
                      <span className="recommendation-value">
                        {getUnitDisplay(stockDetail.recommendedOrderQuantity, stockDetail.unit)}
                      </span>
                    </div>
                  </div>
                  <div className="recommendation-item">
                    <Calendar size={20} />
                    <div>
                      <label>Sipariş Verilmesi Gereken Tarih:</label>
                      <span className="recommendation-value">
                        {formatDate(stockDetail.orderDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Time - Stok Karşılaştırması */}
              <div className="detail-section">
                <div className={`alert ${stockDetail.daysUntilStockout <= stockDetail.leadTimeDays ? 'alert-danger' : 
                                 stockDetail.daysUntilStockout <= stockDetail.leadTimeDays * 1.5 ? 'alert-warning' : 'alert-info'}`}>
                  <AlertCircle size={20} />
                  <div>
                    {stockDetail.daysUntilStockout <= stockDetail.leadTimeDays ? (
                      <>
                        <strong>Kritik Durum:</strong> Stok {stockDetail.daysUntilStockout} gün içinde bitecek, 
                        ancak tedarik süresi {stockDetail.leadTimeDays} gün. Üretim durma riski var. 
                        <strong> Acil sipariş verilmelidir.</strong>
                      </>
                    ) : stockDetail.daysUntilStockout <= stockDetail.leadTimeDays * 1.5 ? (
                      <>
                        <strong>Dikkat:</strong> Stok {stockDetail.daysUntilStockout} gün içinde bitecek. 
                        Tedarik süresi {stockDetail.leadTimeDays} gün olduğu için yakında sipariş verilmesi önerilir.
                      </>
                    ) : (
                      <>
                        <strong>Bilgi:</strong> Stok {stockDetail.daysUntilStockout} gün yetecek. 
                        Tedarik süresi {stockDetail.leadTimeDays} gün olduğu için planlı sipariş yapılabilir.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Stock
