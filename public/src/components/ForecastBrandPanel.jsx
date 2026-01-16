import React, { useState, useMemo } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { CUSTOMERS } from '../data/customers'
import { generateAllBrandOrders, generateBrandOrders, calculateSeasonAverages, calculateForecastForMonths, calculateBrandSummary } from '../data/mockBrandOrders'
import { getNextMonths } from '../utils/season'
import '../App.css'

function ForecastBrandPanel() {
  const [selectedBrands, setSelectedBrands] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')

  // Tüm marka sipariş verilerini oluştur (memoize)
  const baseOrders = useMemo(() => generateAllBrandOrders(), [])
  
  // Seçili markalar için sipariş verilerini oluştur (yeni eklenen markalar dahil)
  const allOrders = useMemo(() => {
    const orders = { ...baseOrders }
    selectedBrands.forEach(brand => {
      if (!orders[brand]) {
        // Yeni eklenen marka için veri oluştur
        orders[brand] = generateBrandOrders(brand)
      }
    })
    return orders
  }, [baseOrders, selectedBrands])

  // Önümüzdeki 6 ay
  const nextMonths = useMemo(() => getNextMonths(6), [])

  // Sezon ortalamaları
  const seasonAverages = useMemo(() => {
    if (selectedBrands.length === 0) return {}
    return calculateSeasonAverages(selectedBrands, allOrders)
  }, [selectedBrands, allOrders])

  // 6 aylık tahmin
  const forecast = useMemo(() => {
    if (selectedBrands.length === 0) return {}
    return calculateForecastForMonths(selectedBrands, seasonAverages, nextMonths)
  }, [selectedBrands, seasonAverages, nextMonths])

  // Marka özetleri
  const brandSummaries = useMemo(() => {
    const summaries = {}
    selectedBrands.forEach(brand => {
      summaries[brand] = calculateBrandSummary(brand, seasonAverages, forecast)
    })
    return summaries
  }, [selectedBrands, seasonAverages, forecast])

  // Marka seçimi
  const handleBrandSelect = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand))
    } else {
      setSelectedBrands([...selectedBrands, brand])
    }
  }

  // Marka ekle
  const handleAddBrand = () => {
    if (newBrandName.trim() && !CUSTOMERS.includes(newBrandName.trim()) && !selectedBrands.includes(newBrandName.trim())) {
      // Yeni markayı geçici olarak ekle (sadece UI'da)
      setSelectedBrands([...selectedBrands, newBrandName.trim()])
      setNewBrandName('')
      setShowAddModal(false)
    }
  }

  // Marka kaldır
  const handleRemoveBrand = (brand) => {
    setSelectedBrands(selectedBrands.filter(b => b !== brand))
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR').format(value)
  }

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div className="card-header-professional">
        <div>
          <h2 className="card-title">Marka Bazlı Sezon Tahmini (Mock)</h2>
          <div className="card-subtitle">
            Son 3 yıl yapay veriye göre 6 aylık sezon ortalamaları
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Marka Seçimi */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>
            Marka Seç
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {CUSTOMERS.map(brand => (
              <button
                key={brand}
                onClick={() => handleBrandSelect(brand)}
                className={`btn ${selectedBrands.includes(brand) ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                {brand}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            Marka Ekle
          </button>
        </div>

        {/* Seçili Markalar (Chip'ler) */}
        {selectedBrands.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedBrands.map(brand => (
                <span
                  key={brand}
                  className="product-chip"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem' }}
                >
                  {brand}
                  <button
                    onClick={() => handleRemoveBrand(brand)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Uyarı */}
        {selectedBrands.length === 0 && (
          <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>En az 1 marka seç</span>
          </div>
        )}

        {/* Marka Özet Kartları */}
        {selectedBrands.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {selectedBrands.map(brand => {
                const summary = brandSummaries[brand]
                if (!summary) return null

                return (
                  <div key={brand} className="card" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#333' }}>{brand}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>6 Ay Toplam Tahmin</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333' }}>
                          {formatNumber(summary.sixMonthTotal)} adet
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>En Yüksek Sezon</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#3b82f6' }}>
                          {summary.maxSeason}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>3 Yıl Ortalama / Ay</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                          {formatNumber(summary.avgPerMonth)} adet
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 6 Aylık Görünüm Tablosu */}
        {selectedBrands.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#333' }}>6 Aylık Görünüm</h3>
            <div className="table-wrapper">
              <table className="order-table-professional">
                <thead>
                  <tr>
                    <th style={{ minWidth: '120px' }}>Ay</th>
                    <th style={{ minWidth: '100px' }}>Sezon</th>
                    {selectedBrands.map(brand => (
                      <th key={brand} className="text-right" style={{ minWidth: '150px' }}>{brand}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nextMonths.map((monthData, idx) => (
                    <tr key={idx}>
                      <td>{monthData.label}</td>
                      <td>
                        <span className="product-chip">{monthData.season}</span>
                      </td>
                      {selectedBrands.map(brand => (
                        <td key={brand} className="text-right">
                          <span style={{ fontWeight: '600', color: '#333' }}>
                            {formatNumber(forecast[brand]?.[monthData.label] || 0)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Marka Ekle Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Yeni Marka Ekle</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Marka Adı</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddBrand()
                    }
                  }}
                  className="forecast-input-small"
                  style={{ width: '100%' }}
                  placeholder="Marka adını girin"
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  İptal
                </button>
                <button className="btn btn-primary" onClick={handleAddBrand}>
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForecastBrandPanel

