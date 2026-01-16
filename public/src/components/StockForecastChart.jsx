import React, { useState, useMemo, useEffect, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Line, Cell } from 'recharts'
import { Package, X as XIcon, AlertCircle } from 'lucide-react'
import { RAW_MATERIALS } from '../data/rawMaterials'
import { calculateStockProjection } from '../utils/stockProjection'
import '../App.css'

function StockForecastChart({ selectedMaterialId: propSelectedMaterialId, stocks: propStocks = [] }) {
  const stocks = propStocks || []
  
  const [selectedMaterialId, setSelectedMaterialId] = useState(propSelectedMaterialId || stocks[0]?.rawMaterialId || null)
  const [months, setMonths] = useState(6)
  const [scenario, setScenario] = useState('normal')
  const [customMultiplier, setCustomMultiplier] = useState('')
  const [plannedReceipts, setPlannedReceipts] = useState([])
  const [newReceiptQty, setNewReceiptQty] = useState('')
  const [newReceiptDays, setNewReceiptDays] = useState('')
  const [initialStockAdjustment, setInitialStockAdjustment] = useState('')
  const [showTable, setShowTable] = useState(false)
  const [showSelectionChip, setShowSelectionChip] = useState(false)

  // Prop'tan gelen selectedMaterialId'yi sync et
  useEffect(() => {
    if (propSelectedMaterialId !== null && propSelectedMaterialId !== undefined) {
      const materialExists = stocks.some(s => s.rawMaterialId === propSelectedMaterialId)
      if (materialExists) {
        setSelectedMaterialId(propSelectedMaterialId)
        setShowSelectionChip(true)
        // 5 saniye sonra chip'i gizle
        const timer = setTimeout(() => {
          setShowSelectionChip(false)
        }, 5000)
        return () => clearTimeout(timer)
      }
    }
  }, [propSelectedMaterialId, stocks])

  const selectedMaterial = stocks.find(s => s.rawMaterialId === selectedMaterialId) || stocks[0]

  // Projeksiyon hesaplama
  const projection = useMemo(() => {
    if (!selectedMaterial) return null
    
    return calculateStockProjection(
      selectedMaterial,
      months,
      scenario,
      Number(customMultiplier || 0),
      plannedReceipts,
      initialStockAdjustment
    )
  }, [selectedMaterial, months, scenario, customMultiplier, plannedReceipts, initialStockAdjustment])

  // Risk seviyesi hesaplama
  const riskLevel = useMemo(() => {
    if (!projection || !selectedMaterial) return 'low'
    
    if (projection.isStockout) return 'high'
    if (projection.hasRisk) {
      const daysUntilRisk = projection.firstRiskDate 
        ? Math.ceil((new Date(projection.firstRiskDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 0
      
      if (daysUntilRisk <= selectedMaterial.leadTimeDays) return 'high'
      if (daysUntilRisk <= selectedMaterial.leadTimeDays * 1.5) return 'medium'
    }
    
    return 'low'
  }, [projection, selectedMaterial])

  // Grafik verisi - satın alma noktalarını işaretle
  const chartData = useMemo(() => {
    if (!projection) return []
    
    // Satın alma günlerini ay bazında map'le
    const receiptMonths = new Map()
    plannedReceipts.forEach(receipt => {
      const monthIndex = Math.floor(receipt.arriveInDays / 30)
      if (!receiptMonths.has(monthIndex)) {
        receiptMonths.set(monthIndex, [])
      }
      receiptMonths.get(monthIndex).push(receipt)
    })
    
    return projection.labels.map((label, index) => {
      const stockValue = projection.stockSeries[index]
      const safetyValue = projection.safetySeries[index]
      const hasReceipt = receiptMonths.has(index)
      const receipts = hasReceipt ? receiptMonths.get(index) : []
      const isBelowSafety = stockValue < safetyValue
      const isStockout = stockValue < 0
      const isStockoutMonth = projection.stockoutMonths && projection.stockoutMonths.includes(index)
      
      return {
        date: label,
        'Beklenen Stok': stockValue,
        'Emniyet Stok': safetyValue,
        hasReceipt,
        receipts,
        isBelowSafety,
        isStockout,
        isStockoutMonth
      }
    })
  }, [projection, plannedReceipts])

  // Y ekseni domain hesaplama
  const yAxisDomain = useMemo(() => {
    if (!projection || !selectedMaterial) return [0, 100]
    
    const initialStock = selectedMaterial.currentStock + Number(initialStockAdjustment || 0)
    const safetyStock = selectedMaterial.safetyStock
    
    // Max değer: başlangıç stok, emniyet stok, max stok, satın alma sonrası stok
    const maxValues = [
      initialStock,
      safetyStock,
      projection.maxStock || 0,
      ...plannedReceipts.map(r => initialStock + Number(r.qty || 0))
    ]
    const maxValue = Math.max(...maxValues.filter(v => !isNaN(v) && isFinite(v)))
    
    // Min değer: negatif stok varsa en düşük değer * 1.1, yoksa 0
    const minValue = projection.minStock < 0 
      ? projection.minStock * 1.1 
      : 0
    
    return [
      Math.min(minValue, 0),
      maxValue * 1.2
    ]
  }, [projection, selectedMaterial, initialStockAdjustment, plannedReceipts])

  // Riskli aylar (tablo için)
  const riskMonths = useMemo(() => {
    return chartData.filter(point => point.isBelowSafety || point.isStockout)
  }, [chartData])

  // Format fonksiyonları
  const formatNumberTR = (value, unit = '') => {
    const formatted = new Intl.NumberFormat('tr-TR').format(Math.round(value * 100) / 100)
    return unit ? `${formatted} ${unit}` : formatted
  }

  // Y ekseni formatı
  const formatYAxis = (value) => {
    if (!selectedMaterial) return ''
    return formatNumberTR(value, selectedMaterial.unit)
  }

  // Tooltip formatı
  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    
    const point = chartData.find(d => d.date === label)
    if (!point) return null
    
    const stockValue = point['Beklenen Stok']
    const safetyValue = point['Emniyet Stok']
    const difference = stockValue - safetyValue
    
    let riskLabel = 'OK'
    let riskClass = 'tooltip-success'
    if (point.isStockout) {
      riskLabel = 'Stockout'
      riskClass = 'tooltip-danger'
    } else if (point.isBelowSafety) {
      riskLabel = '⚠ Emniyet Altı'
      riskClass = 'tooltip-warning'
    }
    
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-item">
          <span>Beklenen Stok:</span>
          <strong>{formatNumberTR(stockValue, selectedMaterial?.unit)}</strong>
        </p>
        <p className="tooltip-item">
          <span>Emniyet Stok:</span>
          <strong>{formatNumberTR(safetyValue, selectedMaterial?.unit)}</strong>
        </p>
        <p className={`tooltip-item ${difference < 0 ? 'tooltip-danger' : 'tooltip-success'}`}>
          <span>Fark:</span>
          <strong>{difference >= 0 ? '+' : ''}{formatNumberTR(difference, selectedMaterial?.unit)}</strong>
        </p>
        <p className={`tooltip-item ${riskClass}`}>
          <span>Durum:</span>
          <strong>{riskLabel}</strong>
        </p>
        {point.hasReceipt && point.receipts && point.receipts.length > 0 && (
          <div className="tooltip-receipts">
            <p className="tooltip-receipts-title">Planlanan Alımlar:</p>
            {point.receipts.map((receipt, idx) => (
              <p key={idx} className="tooltip-receipt-item">
                +{formatNumberTR(Number(receipt.qty || 0), selectedMaterial?.unit)}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Planlanan alım ekle
  const handleAddReceipt = () => {
    const qty = newReceiptQty.trim()
    const days = newReceiptDays.trim()
    
    if (qty && days && Number(qty) > 0 && Number(days) >= 0 && Number(days) <= months * 30) {
      setPlannedReceipts([...plannedReceipts, { qty, arriveInDays: Number(days) }])
      setNewReceiptQty('')
      setNewReceiptDays('')
    }
  }

  // Planlanan alım sil
  const handleRemoveReceipt = (index) => {
    setPlannedReceipts(plannedReceipts.filter((_, i) => i !== index))
  }

  // Senaryo değiştiğinde custom multiplier'ı sıfırla
  const handleScenarioChange = (newScenario) => {
    setScenario(newScenario)
    if (newScenario !== 'custom') {
      setCustomMultiplier('')
    }
  }

  // Risk rozet metni
  const getRiskBadgeText = () => {
    switch (riskLevel) {
      case 'high': return 'Yüksek Risk'
      case 'medium': return 'Orta Risk'
      default: return 'Düşük Risk'
    }
  }

  // Hammadde dropdown değiştiğinde chip'i gizle
  const handleMaterialChange = (materialId) => {
    setSelectedMaterialId(materialId)
    setShowSelectionChip(false)
    setPlannedReceipts([])
  }

  if (!selectedMaterial || !projection) {
    return <div className="card">Yükleniyor...</div>
  }

  // Seçilen hammadde grafikte yoksa uyarı
  const materialNotFound = propSelectedMaterialId && !stocks.some(s => s.rawMaterialId === propSelectedMaterialId)

  return (
    <div className="card">
      {/* Seçim Bilgi Chip'i */}
      {showSelectionChip && selectedMaterial && (
        <div className="selection-info-chip">
          <span>Seçilen hammadde: <strong>{selectedMaterial.name}</strong> — senaryo analizi aşağıda</span>
          <button onClick={() => setShowSelectionChip(false)} className="chip-close-btn">
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Hammadde Bulunamadı Uyarısı */}
      {materialNotFound && (
        <div className="material-not-found-alert">
          <AlertCircle size={18} />
          <span>Bu hammadde için projeksiyon verisi bulunamadı.</span>
        </div>
      )}

      {/* Başlık Satırı */}
      <div className="forecast-header">
        <div>
          <h2 className="card-title">Uzun Vadeli Stok Projeksiyonu</h2>
          <p className="forecast-subtitle">Aylık projeksiyon • Planlanan alımlar dahil</p>
        </div>
        <div className={`risk-badge risk-badge-${riskLevel}`}>
          {getRiskBadgeText()}
        </div>
      </div>

      {/* Sticky Kontrol Alanı */}
      <div className="forecast-controls-sticky">
        <div className="forecast-controls">
          {/* Satır 1 */}
          <div className="forecast-controls-row">
            <div className="control-group">
              <label>Hammadde:</label>
              <select
                value={selectedMaterialId}
                onChange={(e) => handleMaterialChange(parseInt(e.target.value))}
                className="forecast-select"
              >
                {RAW_MATERIALS.map((material, index) => {
                  // stocks içinde bu hammaddeyi bul (name'e göre eşleştir)
                  const stock = stocks.find(s => s.name === material.label)
                  if (stock) {
                    return (
                      <option key={stock.rawMaterialId} value={stock.rawMaterialId}>
                        {material.label}
                      </option>
                    )
                  }
                  return null
                }).filter(Boolean)}
              </select>
            </div>

            <div className="control-group">
              <label>Ay Sayısı:</label>
              <div className="months-control">
                <input
                  type="range"
                  min="6"
                  max="12"
                  step="1"
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value))}
                  className="months-slider"
                />
                <span className="months-value">{months} Ay</span>
                <div className="months-quick-buttons">
                  <button
                    className={`quick-btn ${months === 6 ? 'active' : ''}`}
                    onClick={() => setMonths(6)}
                  >
                    6 Ay
                  </button>
                  <button
                    className={`quick-btn ${months === 9 ? 'active' : ''}`}
                    onClick={() => setMonths(9)}
                  >
                    9 Ay
                  </button>
                  <button
                    className={`quick-btn ${months === 12 ? 'active' : ''}`}
                    onClick={() => setMonths(12)}
                  >
                    12 Ay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Satır 2 */}
          <div className="forecast-controls-row">
            <div className="control-group">
              <label>Tüketim Senaryosu:</label>
              <select
                value={scenario}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="forecast-select"
              >
                <option value="normal">Normal (0%)</option>
                <option value="high">Yoğun Sezon (+20%)</option>
                <option value="low">Düşük Sezon (-15%)</option>
                <option value="custom">Özel (%)</option>
              </select>
              {scenario === 'custom' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Aylık Tüketim Çarpanı:
                  </label>
                  <input
                    type="number"
                    value={customMultiplier}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || !isNaN(value)) {
                        setCustomMultiplier(value)
                      }
                    }}
                    placeholder="% değişim (örn: 40)"
                    className="forecast-input-small"
                    style={{ marginTop: '0.25rem' }}
                    title="Bu değer aylık ortalama tüketimi çarpar. Örn: %40 → 1.40x"
                  />
                </div>
              )}
            </div>

            <div className="control-group receipt-control-group">
              <label>Planlanan Satın Alma:</label>
              <div className="receipt-input-group">
                <input
                  type="number"
                  value={newReceiptQty}
                  onChange={(e) => setNewReceiptQty(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newReceiptQty && newReceiptDays) {
                      handleAddReceipt()
                    }
                  }}
                  placeholder="Miktar"
                  className="forecast-input-small"
                  style={{ flex: '1 1 0', minWidth: '80px', maxWidth: '120px' }}
                />
                <input
                  type="number"
                  value={newReceiptDays}
                  onChange={(e) => setNewReceiptDays(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newReceiptQty && newReceiptDays) {
                      handleAddReceipt()
                    }
                  }}
                  placeholder="Teslim (gün)"
                  className="forecast-input-small"
                  style={{ flex: '1 1 0', minWidth: '80px', maxWidth: '120px' }}
                />
              </div>
              {plannedReceipts.length > 0 && (
                <div className="receipts-list" style={{ marginTop: '0.5rem' }}>
                  {plannedReceipts.map((receipt, index) => (
                    <div key={index} className="receipt-chip">
                      <Package size={14} />
                      <span>+{formatNumberTR(Number(receipt.qty || 0), selectedMaterial.unit)} / {receipt.arriveInDays} gün</span>
                      <button
                        onClick={() => handleRemoveReceipt(index)}
                        className="receipt-remove-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="control-group" style={{ gridColumn: 'span 1' }}>
              <label>Başlangıç Stok Düzeltme:</label>
              <input
                type="number"
                value={initialStockAdjustment}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || !isNaN(value)) {
                    setInitialStockAdjustment(value)
                  }
                }}
                placeholder="Örn: 9000"
                className="forecast-input-small"
                style={{ width: '100%', maxWidth: '200px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grafik */}
      <div className="forecast-chart-container">
        <ResponsiveContainer width="100%" height={420}>
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <defs>
              <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc3545" stopOpacity={0.15}/>
                <stop offset="100%" stopColor="#dc3545" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc3545" stopOpacity={0.08}/>
                <stop offset="100%" stopColor="#dc3545" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="chart-grid" strokeOpacity={0.2} vertical={true} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              angle={0}
              textAnchor="middle"
              height={40}
              interval="preserveStartEnd"
              className="chart-axis"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              tickFormatter={formatYAxis}
              className="chart-axis"
              domain={yAxisDomain}
            />
            <Tooltip content={customTooltip} />
            {/* 0 çizgisi */}
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} strokeDasharray="2 2" />
            {/* Emniyet stok çizgisi */}
            <ReferenceLine 
              y={projection.safetySeries[0]} 
              stroke="#dc3545" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: "Emniyet Stok", position: "topRight", fill: '#dc3545', fontSize: 11 }}
            />
            {/* Negatif bölge (stockout) */}
            <ReferenceArea y1={yAxisDomain[0]} y2={0} fill="url(#negativeGradient)" stroke="none" />
            {/* Risk bölgeleri (emniyet stok altı) */}
            {projection.riskSegments && projection.riskSegments.map((segment, index) => (
              <ReferenceArea
                key={index}
                x1={segment.start}
                x2={segment.end}
                y1={0}
                y2={projection.safetySeries[0]}
                fill="url(#riskGradient)"
                stroke="none"
              />
            ))}
            {/* Stockout dikey çizgileri */}
            {chartData.map((point, index) => 
              point.isStockoutMonth && index === projection.stockoutMonths[0] ? (
                <ReferenceLine
                  key={`stockout-${index}`}
                  x={point.date}
                  stroke="#dc3545"
                  strokeWidth={2}
                  strokeDasharray="0"
                />
              ) : null
            )}
            <Area
              type="monotone"
              dataKey="Beklenen Stok"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#stockGradient)"
              dot={false}
              activeDot={{ r: 5 }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  stroke={entry.isStockout ? '#dc3545' : entry.isBelowSafety ? '#f59e0b' : '#3b82f6'}
                />
              ))}
            </Area>
            {/* Satın alma noktaları ve dikey çizgiler */}
            {chartData.map((point, index) => 
              point.hasReceipt ? (
                <React.Fragment key={`receipt-${index}`}>
                  <ReferenceLine
                    x={point.date}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="0"
                  />
                  <Line
                    type="monotone"
                    dataKey="Beklenen Stok"
                    data={[point]}
                    stroke="#10b981"
                    strokeWidth={0}
                    dot={{ r: 8, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={false}
                  />
                </React.Fragment>
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Alanı */}
      <div className="forecast-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Emniyet Altına Düşüş</div>
          <div className={`kpi-value ${projection.hasRisk ? 'kpi-danger' : 'kpi-success'}`}>
            {projection.hasRisk ? 'Var' : 'Yok'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">İlk Risk Tarihi</div>
          <div className="kpi-value">
            {projection.firstRiskDate ? new Date(projection.firstRiskDate).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Stockout Tarihi</div>
          <div className={`kpi-value ${projection.stockoutDate ? 'kpi-danger' : ''}`}>
            {projection.stockoutDate ? new Date(projection.stockoutDate).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Önerilen Satın Alma</div>
          <div className="kpi-value">
            {projection.recommendedOrder ? (
              <>
                <div>{formatNumberTR(projection.recommendedOrder.qty, selectedMaterial.unit)}</div>
                <div className="kpi-subtext">
                  {projection.recommendedOrder.urgent ? (
                    <span className="kpi-urgent">Acil sipariş</span>
                  ) : (
                    <span>{projection.recommendedOrder.orderInDays} gün içinde</span>
                  )}
                </div>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      {/* Projeksiyon Tablosu Toggle */}
      <div className="forecast-table-toggle">
        <button
          onClick={() => setShowTable(!showTable)}
          className="table-toggle-btn"
        >
          {showTable ? 'Tabloyu Gizle' : 'Tabloyu Göster'}
        </button>
      </div>

      {/* Projeksiyon Tablosu - Sadece Riskli Aylar */}
      {showTable && (
        <div className="forecast-table-container">
          {riskMonths.length > 0 ? (
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Ay</th>
                  <th className="text-right">Beklenen Stok</th>
                  <th className="text-right">Emniyet Stok</th>
                  <th className="text-right">Fark</th>
                  <th className="text-center">Durum</th>
                </tr>
              </thead>
              <tbody>
                {riskMonths.map((row, index) => {
                  const difference = row['Beklenen Stok'] - row['Emniyet Stok']
                  const status = row.isStockout ? 'Stockout' : 'Emniyet Altı'
                  
                  return (
                    <tr key={index}>
                      <td>{row.date}</td>
                      <td className="text-right">{formatNumberTR(row['Beklenen Stok'], selectedMaterial.unit)}</td>
                      <td className="text-right">{formatNumberTR(row['Emniyet Stok'], selectedMaterial.unit)}</td>
                      <td className={`text-right ${difference < 0 ? 'text-danger' : 'text-success'}`}>
                        {difference >= 0 ? '+' : ''}{formatNumberTR(difference, selectedMaterial.unit)}
                      </td>
                      <td className="text-center">
                        <span className={`risk-badge-small ${row.isStockout ? 'risk-badge-high' : 'risk-badge-medium'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="forecast-table-empty">
              Riskli ay bulunmamaktadır.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StockForecastChart
