import React, { useState, useMemo, useEffect } from 'react'
import { X, ChevronDown, ChevronRight, Calendar, TrendingUp } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getMachines, getMachineById } from '../api/machines.api'
import '../App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function Maintenance() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tümü')
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [openCategories, setOpenCategories] = useState(new Set())
  
  // API state
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Kategori sıralaması (öncelik sırası)
  const categoryOrder = [
    'Örme',
    'Boya–Terbiye',
    'Baskı & Nakış',
    'Kesimhane',
    'Dikimhane',
    'Finishing & Paket',
    'Yardımcı Tesis'
  ]

  // API'den veri çek
  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getMachines({ category: selectedCategory !== 'Tümü' ? selectedCategory : null, q: searchQuery })
        setMachines(data)
      } catch (err) {
        console.error('API error:', err)
        setError(err.message || 'Veri yüklenemedi')
        setMachines([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchMachines()
    }, searchQuery ? 300 : 0)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory])

  // Kategorileri al
  const categories = useMemo(() => {
    const cats = [...new Set(machines.map(m => m.category))]
    // Öncelik sırasına göre sırala, sonra alfabetik
    const sorted = cats.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a)
      const indexB = categoryOrder.indexOf(b)
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      return a.localeCompare(b, 'tr')
    })
    return ['Tümü', ...sorted]
  }, [machines])

  // Filtrelenmiş makine listesi (client-side filtering, API'den zaten filtrelenmiş geliyor ama ekstra güvenlik için)
  const filteredMachines = useMemo(() => {
    return machines.filter(machine => {
      // Arama filtresi (API'den zaten filtrelenmiş ama client-side da kontrol et)
      const matchesSearch = searchQuery === '' || 
        machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.process.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Kategori filtresi
      const matchesCategory = selectedCategory === 'Tümü' || machine.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [machines, searchQuery, selectedCategory])

  // Kategorilere göre grupla
  const machinesByCategory = useMemo(() => {
    const grouped = {}
    filteredMachines.forEach(machine => {
      if (!grouped[machine.category]) {
        grouped[machine.category] = []
      }
      grouped[machine.category].push(machine)
    })
    return grouped
  }, [filteredMachines])

  // Kategori başına risk ortalaması hesaplama
  const getCategoryAverageRisk = (machines) => {
    if (!machines || machines.length === 0) {
      return { average: 0, color: '#10b981', label: 'Düşük' }
    }

    let totalRisk = 0
    let count = 0

    machines.forEach(machine => {
      let riskScore = null

      // Önce hazır risk metriği var mı kontrol et
      if (machine.riskScore !== undefined && machine.riskScore !== null) {
        riskScore = machine.riskScore
      } else if (machine.riskLevel) {
        // riskLevel varsa map et
        if (machine.riskLevel === 'high') {
          riskScore = 85
        } else if (machine.riskLevel === 'medium') {
          riskScore = 55
        } else if (machine.riskLevel === 'low') {
          riskScore = 20
        }
      } else {
        // Fallback: utilizationPct'yi kullan veya buton rengine göre map et
        const utilizationPct = calculateUtilization(machine)
        if (utilizationPct >= 80) {
          riskScore = 85 // kırmızı
        } else if (utilizationPct >= 50) {
          riskScore = 55 // turuncu
        } else {
          riskScore = 20 // yeşil
        }
      }

      if (riskScore !== null) {
        totalRisk += riskScore
        count++
      }
    })

    if (count === 0) {
      return { average: 0, color: '#10b981', label: 'Düşük' }
    }

    const average = Math.round(totalRisk / count)

    // Renk kuralları
    let color, label
    if (average >= 67) {
      color = '#dc3545'
      label = 'Yüksek'
    } else if (average >= 34) {
      color = '#f59e0b'
      label = 'Orta'
    } else {
      color = '#10b981'
      label = 'Düşük'
    }

    return { average, color, label }
  }

  // İlk kategoriyi varsayılan açık yap (sadece ilk render'da)
  useEffect(() => {
    if (openCategories.size === 0 && Object.keys(machinesByCategory).length > 0) {
      const firstCategory = Object.keys(machinesByCategory)[0]
      setOpenCategories(new Set([firstCategory]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machinesByCategory])

  // Accordion toggle
  const toggleCategory = (category, e) => {
    e?.stopPropagation()
    setOpenCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Sayı formatı
  const formatNumber = (num) => {
    return new Intl.NumberFormat('tr-TR').format(num)
  }

  // Tarih formatı
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  const getMaintenanceMeta = (machine) => {
    return {
      lastMaintenanceAt: machine.lastMaintenanceDate || null,
      avgMaintenanceHours: machine.avgMaintenanceHours !== null && machine.avgMaintenanceHours !== undefined 
        ? machine.avgMaintenanceHours 
        : null,
      staffCount: machine.staffCount !== null && machine.staffCount !== undefined 
        ? machine.staffCount 
        : null
    }
  }

  // Bakım süresini formatla
  const formatMaintenanceTime = (hours) => {
    if (hours >= 1) {
      return `${hours.toFixed(1)} saat`
    } else {
      const minutes = Math.round(hours * 60)
      return `${minutes} dk`
    }
  }

  // Son bakım tarihinden geçen gün sayısını hesapla
  const getDaysSinceMaintenance = (lastMaintenanceAt) => {
    const lastDate = new Date(lastMaintenanceAt)
    const today = new Date()
    const diffTime = today - lastDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Yoğunluk beklentisi projeksiyonu hesapla
  const calculateUtilizationForecast = (utilizationPct, activeOrder, status) => {
    // Base değer (fallback: 50)
    const base = utilizationPct || 50
    
    // Risk seviyesine göre trend belirle
    let trend3Months = 0
    let trend6Months = 0
    let trend9Months = 0
    let trend12Months = 0
    
    if (status.label === 'Kritik' || activeOrder?.riskLevel === 'high') {
      // Kritik/Yüksek: +5/+8/+10/+10
      trend3Months = 5
      trend6Months = 8
      trend9Months = 10
      trend12Months = 10
    } else if (status.label === 'Yoğun' || activeOrder?.riskLevel === 'medium') {
      // Orta: +2/+3/+4/+5
      trend3Months = 2
      trend6Months = 3
      trend9Months = 4
      trend12Months = 5
    } else {
      // Düşük: 0/+1/+1/+2
      trend3Months = 0
      trend6Months = 1
      trend9Months = 1
      trend12Months = 2
    }
    
    // Değerleri hesapla (100'ü geçmesin)
    const values = [
      base, // Bugün
      Math.min(100, base + trend3Months), // 3 Ay
      Math.min(100, base + trend6Months), // 6 Ay
      Math.min(100, base + trend9Months), // 9 Ay
      Math.min(100, base + trend12Months) // 12 Ay
    ]
    
    return {
      labels: ['Bugün', '3 Ay', '6 Ay', '9 Ay', '12 Ay'],
      values
    }
  }

  // Stratejik müdahale önerileri üret (yeniden formatlanmış)
  const generateStrategicRecommendations = (machine, utilizationPct, activeOrder, maintenanceMeta) => {
    const recommendations6Months = { focus: '', actions: [] }
    const recommendations12Months = { focus: '', actions: [] }
    
    const daysSinceMaintenance = getDaysSinceMaintenance(maintenanceMeta.lastMaintenanceAt)
    const avgMaintenanceHours = maintenanceMeta.avgMaintenanceHours
    const staffCount = maintenanceMeta.staffCount
    
    // Yoğunluk seviyesi
    const utilizationLevel = utilizationPct < 60 ? 'low' : utilizationPct <= 80 ? 'medium' : 'high'
    
    // Risk seviyesi
    const riskLevel = activeOrder?.riskLevel || 'low'
    
    // 6 Ay Planı Önerileri
    if (utilizationLevel === 'high' || riskLevel === 'high') {
      recommendations6Months.focus = 'Kritik kaynak olarak işaretle ve kapasite rezervi planla.'
      recommendations6Months.actions.push('Üretim planında darboğaz riski yönetimi')
      recommendations6Months.actions.push('Kapasite izleme ve erken uyarı sistemi')
    } else {
      recommendations6Months.focus = 'Makine performansını optimize et ve bakım sürekliliğini sağla.'
    }
    
    if (staffCount <= 2) {
      recommendations6Months.actions.push('Çapraz eğitim ve vardiya rotasyonu planı')
      recommendations6Months.actions.push('Kritik durumlarda görevlendirme hazırlığı')
    } else if (utilizationLevel === 'high') {
      recommendations6Months.actions.push('Ek vardiya veya personel görevlendirmesi değerlendirmesi')
    }
    
    if (daysSinceMaintenance > 30 || avgMaintenanceHours >= 4) {
      recommendations6Months.actions.push('Periyodik bakım planı ve checklist standardizasyonu')
      if (avgMaintenanceHours >= 4) {
        recommendations6Months.actions.push(`Bakım süresini ${avgMaintenanceHours.toFixed(1)} saatten 4 saat altına indirme hedefi`)
      }
    }
    
    if (utilizationLevel === 'medium' || utilizationLevel === 'high') {
      recommendations6Months.actions.push('Performans KPI\'ları ve bakım kayıt standardizasyonu')
    }
    
    // 12 Ay Planı Önerileri
    if (utilizationLevel === 'high' && utilizationPct >= 80) {
      recommendations12Months.focus = 'Yoğunluk devam ederse ek makine yatırımını değerlendir.'
      recommendations12Months.actions.push('Aynı tip makine yatırım analizi')
      recommendations12Months.actions.push('Kapasite artırımı maliyet-fayda değerlendirmesi')
    } else if (utilizationLevel === 'high' || (utilizationLevel === 'medium' && riskLevel === 'high')) {
      recommendations12Months.focus = 'Modernizasyon veya kapasite artırımı planla.'
      recommendations12Months.actions.push('Mevcut makine yükseltme seçenekleri')
    } else {
      recommendations12Months.focus = 'Uzun vadeli operasyonel verimliliği artır.'
    }
    
    if (staffCount <= 2 && utilizationLevel !== 'low') {
      recommendations12Months.actions.push('Kalıcı personel kapasitesi artırımı')
      recommendations12Months.actions.push('Bakım ekibi genişletme planı')
    } else if (utilizationLevel === 'high') {
      recommendations12Months.actions.push('Uzun vadeli personel planlaması')
    }
    
    if (avgMaintenanceHours >= 4) {
      recommendations12Months.actions.push('Bakım otomasyonu ve önleyici bakım sistemine geçiş')
    }
    
    if (utilizationLevel === 'high' || riskLevel === 'high') {
      recommendations12Months.actions.push('Kalite kontrol noktası ve süreç iyileştirme projeleri')
    }
    
    // Fallback: Eğer actions yoksa genel öneriler ekle
    if (recommendations6Months.actions.length === 0) {
      recommendations6Months.actions.push('Periyodik bakım planı standardizasyonu')
      recommendations6Months.actions.push('Performans metrikleri izleme')
    }
    
    if (recommendations12Months.actions.length === 0) {
      recommendations12Months.actions.push('Uzun vadeli bakım ve personel planlaması')
      recommendations12Months.actions.push('Yatırım kararları için performans değerlendirmesi')
    }
    
    return {
      sixMonths: recommendations6Months,
      twelveMonths: recommendations12Months
    }
  }

  // Yoğunluk hesaplama (API'den gelen veriyi kullan, fallback ile)
  const calculateUtilization = (machine) => {
    // Önce API'den gelen utilizationPct'yi kullan
    if (machine.utilizationPct !== undefined && machine.utilizationPct !== null) {
      return Math.min(100, Math.max(0, machine.utilizationPct))
    }
    
    // Eğer makinede utilization alanı varsa onu kullan
    if (machine.utilization !== undefined && machine.utilization !== null) {
      return Math.min(100, Math.max(0, machine.utilization))
    }
    if (machine.load !== undefined && machine.load !== null) {
      return Math.min(100, Math.max(0, machine.load))
    }
    if (machine.busyRate !== undefined && machine.busyRate !== null) {
      return Math.min(100, Math.max(0, machine.busyRate))
    }
    if (machine.capacityUsed !== undefined && machine.capacityUsed !== null) {
      return Math.min(100, Math.max(0, machine.capacityUsed))
    }

    // Fallback: API'den gelen activeOrder'ı kullan
    if (machine.activeOrder) {
      const riskLevel = machine.activeOrder.riskLevel || 'low'
      if (riskLevel === 'high') {
        return 85 // Kritik
      } else if (riskLevel === 'medium') {
        return 65 // Yoğun
      } else {
        return 55 // Orta-yoğun
      }
    }

    return 0
  }

  // Yoğunluk durumu ve rengi
  const getUtilizationStatus = (utilizationPct) => {
    if (utilizationPct >= 80) {
      return { label: 'Kritik', color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.1)', borderColor: '#dc3545' }
    } else if (utilizationPct >= 50) {
      return { label: 'Yoğun', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }
    } else {
      return { label: 'Uygun', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }
    }
  }

  // Risk seviyesi rengi
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return '#dc3545'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  // Modal handlers
  const handleInspectClick = async (machine) => {
    // Önce mevcut makine verisini göster
    setSelectedMachine(machine)
    
    // Detay API'den çek (isteğe bağlı, şimdilik liste verisini kullan)
    try {
      const detailedMachine = await getMachineById(machine.id)
      if (detailedMachine) {
        setSelectedMachine(detailedMachine)
      }
    } catch (err) {
      console.warn('Failed to fetch machine details:', err)
      // Mevcut makine verisini kullanmaya devam et
    }
  }

  const handleCloseModal = () => {
    setSelectedMachine(null)
  }
  
  // Aktif siparişi al (API'den gelen veriyi kullan, fallback ile)
  const getActiveOrder = (machine) => {
    // Önce API'den gelen activeOrder'ı kullan
    if (machine.activeOrder) {
      return {
        customer: machine.activeOrder.customer || '',
        orderId: machine.activeOrder.orderId || '',
        stage: machine.activeOrder.stage || '',
        progress: machine.activeOrder.progress || 0,
        deliveryDate: machine.activeOrder.deliveryDate || null,
        riskLevel: machine.activeOrder.riskLevel || 'low',
        daysRemaining: machine.activeOrder.daysRemaining || null
      }
    }
    
    return null
  }

  return (
    <div className="maintenance-container">
      <div className="maintenance-header">
        <h1>Üretim Kaynakları & Bakım</h1>
        <p>Makine envanteri ve bakım yönetimi</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Makine Envanteri</h2>
            <p className="card-subtitle">
              Üretim alanlarına göre makine parkı görünümü. (Bakım planı bir sonraki adımda eklenecek.)
            </p>
          </div>
        </div>

        <div className="machine-inventory-controls">
          <div className="search-filter-row">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Makine adı / süreç / kategori ara…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="total-count">
              <span className="total-label">Toplam:</span>
              <span className="total-value">{formatNumber(filteredMachines.length)}</span>
            </div>
          </div>
        </div>

        {/* Desktop Accordion Görünümü */}
        <div className="machine-accordion-wrapper desktop-only">
          {loading ? (
            <div className="no-data-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Yükleniyor...</div>
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="no-data-card">
              Sonuç bulunamadı.
            </div>
          ) : (
            Object.keys(machinesByCategory)
              .sort((a, b) => {
                const indexA = categoryOrder.indexOf(a)
                const indexB = categoryOrder.indexOf(b)
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                return a.localeCompare(b, 'tr')
              })
              .map((category) => {
                const machines = machinesByCategory[category]
                const isOpen = openCategories.has(category)
                const riskInfo = getCategoryAverageRisk(machines)
                
                return (
                  <div key={category} className="machine-category-group">
                    <button
                      type="button"
                      className="category-header"
                      onClick={(e) => toggleCategory(category, e)}
                    >
                      <div className="category-header-left">
                        {isOpen ? (
                          <ChevronDown size={20} className="category-chevron" />
                        ) : (
                          <ChevronRight size={20} className="category-chevron" />
                        )}
                        <span className="category-title">{category}</span>
                        <span className="category-count">({machines.length})</span>
                      </div>
                      <div className="category-risk-average" onClick={(e) => e.stopPropagation()}>
                        <span 
                          className="risk-average-badge"
                          style={{ 
                            backgroundColor: riskInfo.color,
                            color: '#fff'
                          }}
                          title={`Risk Seviyesi: ${riskInfo.label}`}
                        >
                          Risk Ort.: %{riskInfo.average}
                        </span>
                      </div>
                    </button>
                    
                    {isOpen && (
                      <div className="category-content">
                        <table className="machine-table">
                          <thead>
                            <tr>
                              <th>Makine / İstasyon</th>
                              <th>Süreç</th>
                              <th>Not</th>
                              <th>İncele</th>
                            </tr>
                          </thead>
                          <tbody>
                            {machines.map((machine) => {
                              const utilizationPct = calculateUtilization(machine)
                              const status = getUtilizationStatus(utilizationPct)
                              
                              return (
                                <tr
                                  key={machine.id}
                                  className="machine-row-hover"
                                >
                                  <td className="machine-name">{machine.name}</td>
                                  <td className="process-cell">{machine.process}</td>
                                  <td className="notes-cell">{machine.notes}</td>
                                  <td>
                                    <button
                                      className="inspect-button"
                                      style={{
                                        color: status.color,
                                        backgroundColor: status.bgColor,
                                        borderColor: status.borderColor
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleInspectClick(machine)
                                      }}
                                    >
                                      İncele
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })
          )}
        </div>

        {/* Mobil Accordion Görünümü */}
        <div className="machine-accordion-wrapper mobile-only">
          {loading ? (
            <div className="no-data-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Yükleniyor...</div>
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="no-data-card">
              Sonuç bulunamadı.
            </div>
          ) : (
            Object.keys(machinesByCategory)
              .sort((a, b) => {
                const indexA = categoryOrder.indexOf(a)
                const indexB = categoryOrder.indexOf(b)
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                return a.localeCompare(b, 'tr')
              })
              .map((category) => {
                const machines = machinesByCategory[category]
                const isOpen = openCategories.has(category)
                const riskInfo = getCategoryAverageRisk(machines)
                
                return (
                  <div key={category} className="machine-category-group">
                    <button
                      type="button"
                      className="category-header"
                      onClick={(e) => toggleCategory(category, e)}
                    >
                      <div className="category-header-left">
                        {isOpen ? (
                          <ChevronDown size={20} className="category-chevron" />
                        ) : (
                          <ChevronRight size={20} className="category-chevron" />
                        )}
                        <span className="category-title">{category}</span>
                        <span className="category-count">({machines.length})</span>
                      </div>
                      <div className="category-risk-average" onClick={(e) => e.stopPropagation()}>
                        <span 
                          className="risk-average-badge"
                          style={{ 
                            backgroundColor: riskInfo.color,
                            color: '#fff'
                          }}
                          title={`Risk Seviyesi: ${riskInfo.label}`}
                        >
                          Risk Ort.: %{riskInfo.average}
                        </span>
                      </div>
                    </button>
                    
                    {isOpen && (
                      <div className="category-content">
                        <div className="machine-cards-wrapper">
                          {machines.map((machine) => (
                            <div
                              key={machine.id}
                              className="machine-card machine-card-hover"
                            >
                              <div className="machine-card-header">
                                <h3 className="machine-card-title">{machine.name}</h3>
                              </div>
                              <div className="machine-card-body">
                                <div className="machine-card-row">
                                  <span className="machine-card-label">Süreç:</span>
                                  <span className="machine-card-value">{machine.process}</span>
                                </div>
                                {machine.notes && (
                                  <div className="machine-card-row notes-row">
                                    <span className="machine-card-label">Not:</span>
                                    <span className="machine-card-value">{machine.notes}</span>
                                  </div>
                                )}
                              </div>
                              <div className="machine-card-footer">
                                {(() => {
                                  const utilizationPct = calculateUtilization(machine)
                                  const status = getUtilizationStatus(utilizationPct)
                                  return (
                                    <button
                                      className="inspect-button"
                                      style={{
                                        color: status.color,
                                        backgroundColor: status.bgColor,
                                        borderColor: status.borderColor
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleInspectClick(machine)
                                      }}
                                    >
                                      İncele
                                    </button>
                                  )
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* Machine Detail Modal */}
      {selectedMachine && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content-dss" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-dss">
              <div className="modal-header-left">
                <h2 className="modal-machine-title">{selectedMachine.name}</h2>
                <p className="modal-subtitle">{selectedMachine.category} • {selectedMachine.process}</p>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body-dss">
              {(() => {
                const utilizationPct = calculateUtilization(selectedMachine)
                const status = getUtilizationStatus(utilizationPct)
                const activeOrder = getActiveOrder(selectedMachine)

                return (
                  <>
                    {/* Makine Durumu */}
                    <div className="machine-detail-section">
                      <h3>Makine Durumu</h3>
                      <div className="machine-detail-grid">
                        <div className="machine-detail-item">
                          <label>Durum:</label>
                          <span>{selectedMachine.status || 'Boşta'}</span>
                        </div>
                        <div className="machine-detail-item">
                          <label>Atama:</label>
                          <span>
                            {activeOrder 
                              ? `${activeOrder.customer} - ${activeOrder.orderId}`
                              : 'Şu an atama yok (Boşta)'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Yoğunluk Bilgisi */}
                    <div className="machine-detail-section">
                      <h3>Yoğunluk Durumu</h3>
                      <div className="machine-detail-row">
                        <span className="machine-detail-label">Yoğunluk:</span>
                        <span 
                          className="machine-detail-value"
                          style={{ color: status.color, fontWeight: 600 }}
                        >
                          %{utilizationPct} ({status.label})
                        </span>
                      </div>
                    </div>

                    {/* Yoğunluk Beklentisi Grafiği */}
                    <div className="machine-detail-section">
                      <h3>Yoğunluk Beklentisi (6–12 Ay)</h3>
                      <p className="utilization-forecast-description">
                        Mevcut yoğunluk, sipariş riski ve bakım/personel sinyallerine göre 6–12 ay beklentisi.
                      </p>
                      {(() => {
                        const forecast = calculateUtilizationForecast(utilizationPct, activeOrder, status)
                        const isDarkTheme = document.querySelector('.app')?.classList.contains('dark-theme') || false
                        
                        const chartData = {
                          labels: forecast.labels,
                          datasets: [
                            {
                              label: 'Ortalama Yoğunluk Beklentisi',
                              data: forecast.values,
                              borderColor: status.color,
                              backgroundColor: status.color + '20', // %20 opacity
                              fill: true,
                              tension: 0.4,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                              pointBackgroundColor: status.color,
                              pointBorderColor: '#fff',
                              pointBorderWidth: 2
                            }
                          ]
                        }
                        
                        const chartOptions = {
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              backgroundColor: isDarkTheme ? '#1e293b' : '#fff',
                              titleColor: isDarkTheme ? '#fff' : '#1e293b',
                              bodyColor: isDarkTheme ? '#e2e8f0' : '#64748b',
                              borderColor: isDarkTheme ? '#334155' : '#e5e7eb',
                              borderWidth: 1,
                              padding: 12,
                              callbacks: {
                                label: (context) => {
                                  return `Yoğunluk: %${context.parsed.y.toFixed(1)}`
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              grid: {
                                display: true,
                                color: isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                              },
                              ticks: {
                                color: isDarkTheme ? '#94a3b8' : '#64748b',
                                font: {
                                  size: 11
                                }
                              }
                            },
                            y: {
                              beginAtZero: true,
                              max: 100,
                              grid: {
                                display: true,
                                color: isDarkTheme ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                              },
                              ticks: {
                                color: isDarkTheme ? '#94a3b8' : '#64748b',
                                font: {
                                  size: 11
                                },
                                callback: (value) => {
                                  return `${value}%`
                                }
                              }
                            }
                          }
                        }
                        
                        return (
                          <div className="utilization-forecast-chart-container">
                            <Line data={chartData} options={chartOptions} />
                          </div>
                        )
                      })()}
                    </div>

                    {/* Bakım & Personel */}
                    <div className="machine-detail-section">
                      <h3>Bakım & Personel</h3>
                      {(() => {
                        const maintenanceMeta = getMaintenanceMeta(selectedMachine)
                        return (
                          <div className="machine-detail-grid">
                            <div className="machine-detail-item">
                              <label>Son bakım:</label>
                              <span>{formatDate(maintenanceMeta.lastMaintenanceAt)}</span>
                            </div>
                            <div className="machine-detail-item">
                              <label>Ortalama bakım süresi:</label>
                              <span>{formatMaintenanceTime(maintenanceMeta.avgMaintenanceHours)}</span>
                            </div>
                            <div className="machine-detail-item">
                              <label>Personel:</label>
                              <span>{maintenanceMeta.staffCount} kişi</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Stratejik Müdahaleler */}
                    <div className="machine-detail-section strategic-interventions-panel">
                      <h3 className="strategic-interventions-title">Stratejik Müdahaleler (6–12 Ay)</h3>
                      <p className="strategic-interventions-subtitle">
                        Yük, teslim riski, bakım ve personel verilerine göre orta-uzun vadeli öneriler.
                      </p>
                      {(() => {
                        const maintenanceMeta = getMaintenanceMeta(selectedMachine)
                        const recommendations = generateStrategicRecommendations(
                          selectedMachine,
                          utilizationPct,
                          activeOrder,
                          maintenanceMeta
                        )
                        
                        return (
                          <div className="strategic-recommendations-grid">
                            {/* 6 Ay Planı */}
                            <div className="recommendation-card recommendation-card-6months">
                              <div className="recommendation-card-header">
                                <Calendar size={18} className="recommendation-icon" />
                                <span className="recommendation-period-badge">6 Ay</span>
                              </div>
                              <div className="recommendation-card-content">
                                <p className="recommendation-focus">{recommendations.sixMonths.focus}</p>
                                <ul className="recommendation-actions-list">
                                  {recommendations.sixMonths.actions.map((action, index) => (
                                    <li key={index} className="recommendation-action-item">
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            {/* 12 Ay Planı */}
                            <div className="recommendation-card recommendation-card-12months">
                              <div className="recommendation-card-header">
                                <TrendingUp size={18} className="recommendation-icon" />
                                <span className="recommendation-period-badge">12 Ay</span>
                              </div>
                              <div className="recommendation-card-content">
                                <p className="recommendation-focus">{recommendations.twelveMonths.focus}</p>
                                <ul className="recommendation-actions-list">
                                  {recommendations.twelveMonths.actions.map((action, index) => (
                                    <li key={index} className="recommendation-action-item">
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Şu an işlenen sipariş */}
                    {activeOrder ? (
                      <div className="machine-detail-section">
                        <h3>Şu an işlenen sipariş</h3>
                        <div className="machine-detail-grid">
                          <div className="machine-detail-item">
                            <label>Sipariş:</label>
                            <span>{activeOrder.customer} - {activeOrder.orderId}</span>
                          </div>
                          <div className="machine-detail-item">
                            <label>Aşama:</label>
                            <span>{activeOrder.stage}</span>
                          </div>
                          <div className="machine-detail-item">
                            <label>İlerleme:</label>
                            <span>{activeOrder.progress}%</span>
                          </div>
                          <div className="machine-detail-item">
                            <label>Teslim Tarihi:</label>
                            <span>{formatDate(activeOrder.deliveryDate)}</span>
                          </div>
                          <div className="machine-detail-item">
                            <label>Kalan Gün:</label>
                            <span>{activeOrder.daysRemaining !== null ? `${activeOrder.daysRemaining} gün` : '—'}</span>
                          </div>
                          <div className="machine-detail-item">
                            <label>Risk:</label>
                            <span style={{ color: getRiskColor(activeOrder.riskLevel), fontWeight: 600 }}>
                              {activeOrder.riskLevel === 'high' ? 'Yüksek' : activeOrder.riskLevel === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="machine-detail-section">
                        <h3>Şu an işlenen sipariş</h3>
                        <p className="machine-detail-empty-message">Bu makine şu an boşta</p>
                      </div>
                    )}

                    {/* Not */}
                    {selectedMachine.notes && (
                      <div className="machine-detail-section">
                        <h3>Not</h3>
                        <p className="machine-detail-notes">{selectedMachine.notes}</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Maintenance

