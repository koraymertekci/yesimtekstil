/**
 * DEPRECATED: Bu component artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import '../App.css'

function ForecastChartsRow({ forecast, capacity, materials, scenarios, simulationParams }) {
  // Grafik 1: Forecast vs Achievable Capacity
  const chart1Data = useMemo(() => {
    if (!forecast || !capacity) return []
    
    const achievableQty = forecast.forecastQty * capacity.overallAdequacy
    const gap = Math.max(0, forecast.forecastQty - achievableQty)
    
    return [
      {
        name: 'Forecast',
        value: forecast.forecastQty,
        type: 'Forecast'
      },
      {
        name: 'Achievable',
        value: Math.round(achievableQty),
        type: 'Achievable'
      },
      {
        name: 'Gap',
        value: Math.round(gap),
        type: 'Gap'
      }
    ]
  }, [forecast, capacity])

  // Grafik 2: Material Adequacy (Top 5 kritik hammadde)
  const chart2Data = useMemo(() => {
    if (!materials || !materials.materialDetails) return []
    
    const sortedMaterials = Object.values(materials.materialDetails)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 5)
    
    return sortedMaterials.map(m => ({
      name: m.material.name.length > 15 ? m.material.name.substring(0, 15) + '...' : m.material.name,
      required: m.requiredQty,
      available: m.availableStock,
      gap: m.gap
    }))
  }, [materials])

  // Grafik 3: Cost Breakdown
  const chart3Data = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return []
    
    // Senaryo 2'yi baz al (fazla mesai)
    const scenario2 = scenarios.find(s => s.id === 2)
    if (!scenario2) return []
    
    // Basit maliyet dağılımı (mock)
    const overtimeCost = scenario2.estimatedCost * 0.4
    const purchaseCost = scenario2.estimatedCost * 0.3
    const baseCost = scenario2.estimatedCost * 0.2
    const otherCost = scenario2.estimatedCost * 0.1
    
    return [
      { name: 'Fazla Mesai', value: Math.round(overtimeCost) },
      { name: 'Satın Alma', value: Math.round(purchaseCost) },
      { name: 'Temel Üretim', value: Math.round(baseCost) },
      { name: 'Diğer', value: Math.round(otherCost) }
    ]
  }, [scenarios])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  // Grafik 4: Risk Timeline (sezon boyunca lead time risk)
  const chart4Data = useMemo(() => {
    if (!forecast || !materials) return []
    
    const seasonDurationDays = simulationParams?.seasonDurationDays || forecast.seasonDurationDays || 120
    const months = Math.ceil(seasonDurationDays / 30)
    
    const data = []
    for (let i = 0; i < months; i++) {
      const monthName = forecast.season === 'Yaz' 
        ? ['May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki'][i] || `Ay ${i + 1}`
        : ['Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis'][i] || `Ay ${i + 1}`
      
      // Risk hesaplama (basit model: lead time risk + stok risk)
      const leadTimeRisk = materials.leadTimeRisk > 0 
        ? Math.min(100, (materials.leadTimeRisk / 30) * 100 * (1 - i * 0.1))
        : 0
      
      const stockRisk = materials.overallAdequacy < 1.0
        ? Math.min(100, (1 - materials.overallAdequacy) * 100 * (1 + i * 0.05))
        : 0
      
      const totalRisk = Math.min(100, Math.round(leadTimeRisk + stockRisk))
      
      data.push({
        month: monthName,
        risk: totalRisk
      })
    }
    
    return data
  }, [forecast, materials, simulationParams])

  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR').format(Math.round(value))
  }

  return (
    <div className="forecast-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
      {/* Grafik 1: Forecast vs Achievable Capacity */}
      <div className="card">
        <div className="card-header-professional">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Forecast vs Achievable Capacity</h3>
        </div>
        <div style={{ padding: '1rem', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart1Data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Miktar" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grafik 2: Material Adequacy */}
      <div className="card">
        <div className="card-header-professional">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Kritik Hammadde Yeterliliği</h3>
        </div>
        <div style={{ padding: '1rem', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart2Data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="required" fill="#ef4444" name="Gerekli" />
              <Bar dataKey="available" fill="#10b981" name="Mevcut" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grafik 3: Cost Breakdown */}
      <div className="card">
        <div className="card-header-professional">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Maliyet Dağılımı</h3>
        </div>
        <div style={{ padding: '1rem', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart3Data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chart3Data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${formatNumber(value)} TL`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grafik 4: Risk Timeline */}
      <div className="card">
        <div className="card-header-professional">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>Risk Timeline (Sezon Boyunca)</h3>
        </div>
        <div style={{ padding: '1rem', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart4Data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} name="Risk Skoru" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default ForecastChartsRow

