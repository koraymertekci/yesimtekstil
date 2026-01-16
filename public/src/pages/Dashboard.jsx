import React, { useState, useMemo, useEffect } from 'react'
import { getOrders } from '../api/orders.api'
import { calculateKpis, calculateFilteredKpis } from '../utils/orderKpis'
import KpiCards from '../components/KpiCards'
import OrderTable from '../components/OrderTable'
import OrderDetailModal from '../components/OrderDetailModal'
import MiniChartCard from '../components/MiniChartCard'
import MiniStockForecastWidget from '../components/dashboard/MiniStockForecastWidget'
import MiniMarketTrendWidget from '../components/dashboard/MiniMarketTrendWidget'
import MiniSeasonBrandLoadWidget from '../components/dashboard/MiniSeasonBrandLoadWidget'
import MiniSeasonRiskWidget from '../components/dashboard/MiniSeasonRiskWidget'
import MiniCostProfitWidget from '../components/dashboard/MiniCostProfitWidget'
import MiniUnitCostWidget from '../components/dashboard/MiniUnitCostWidget'
import DashboardChartsGrid from '../components/dashboard/DashboardChartsGrid'
import ProfitVarianceChart from '../components/dashboard/ProfitVarianceChart'
import LateReasonBreakdownChart from '../components/dashboard/LateReasonBreakdownChart'
import TerminRiskProfileLines from '../components/dashboard/TerminRiskProfileLines'
import ProductionEfficiencyLineChart from '../components/dashboard/ProductionEfficiencyLineChart'
import '../App.css'

function Dashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filteredOrdersForKpi, setFilteredOrdersForKpi] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getOrders()
        setOrders(data || [])
      } catch (err) {
        console.error('API error:', err)
        setError(err?.message || 'Veri yüklenemedi')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const kpis = useMemo(() => {
    try {
      return calculateKpis(orders || [])
    } catch (err) {
      console.error('KPI calculation error:', err)
      return {
        openOrders: 0,
        criticalOrders: 0,
        avgProgress: 0,
        thisWeekDeliveries: 0,
        highRisk: 0,
        mediumRisk: 0,
        willNotDeliver: 0
      }
    }
  }, [orders])

  const filteredKpis = useMemo(() => {
    if (!filteredOrdersForKpi) return null
    try {
      return calculateFilteredKpis(filteredOrdersForKpi)
    } catch (err) {
      console.error('Filtered KPI calculation error:', err)
      return null
    }
  }, [filteredOrdersForKpi])

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
  }

  const handleCloseModal = () => {
    setSelectedOrder(null)
  }

  // OrderTable'dan filtrelenmiş siparişleri almak için callback
  const handleFilteredOrdersChange = (filteredOrders) => {
    setFilteredOrdersForKpi(filteredOrders)
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Genel Bakış</h1>
        <p>Tüm analizlerin özet görünümü ve sipariş takibi</p>
      </div>

      {/* KPI Kartları - Filtrelenmiş siparişlere göre dinamik */}
      <KpiCards kpis={kpis} filteredKpis={filteredKpis} />

      {/* Grafik Panosu */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header-professional">
          <div>
            <h2 className="card-title">Grafik Panosu</h2>
            <div className="card-subtitle">
              Kritik göstergeler ve trendler
            </div>
          </div>
        </div>
        <DashboardChartsGrid
          items={[
            {
              title: 'Maliyet-Kâr Sapması (Plan vs Gerçek)',
              content: <ProfitVarianceChart />
            },
            {
              title: 'Üretim Verimlilik Trendleri',
              subtitle: 'OEE, Çalışma Hızı ve Hata Oranı — 6/12 ay kıyas',
              content: <ProductionEfficiencyLineChart />
            },
            {
              title: 'Gecikme Neden Dağılımı',
              subtitle: 'Son 30 gün geciken siparişlerin neden kırılımı',
              content: <LateReasonBreakdownChart />
            },
            {
              title: 'Termin Risk Profili Karşılaştırması',
              subtitle: 'Son 30 / 60 / 90 gün risk profili kıyaslaması',
              content: <TerminRiskProfileLines />
            },
            {
              title: 'Stok Kritik Trend',
              content: (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Yakında eklenecek
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Mini Analizler Grid */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header-professional">
          <div>
            <h2 className="card-title">Mini Analizler</h2>
            <div className="card-subtitle">
              Tüm analizlerin özet görünümü • Detaylar için kartlara tıklayın
            </div>
          </div>
        </div>
        <div className="mini-charts-grid">
          <MiniChartCard
            title="Stok Risk Özeti"
            description="30 gün tüketim ve kritik stok sinyali"
            route="/stock"
          >
            <MiniStockForecastWidget />
          </MiniChartCard>

          <MiniChartCard
            title="Piyasa Trend Analizi"
            description="USD/TRY ve EUR/TRY kur trendleri"
            route="/inflation"
          >
            <MiniMarketTrendWidget />
          </MiniChartCard>

          <MiniChartCard
            title="Sezon Marka Yük Dağılımı"
            description="Marka bazlı sezon yük dağılımı"
            route="/forecast"
          >
            <MiniSeasonBrandLoadWidget />
          </MiniChartCard>

          <MiniChartCard
            title="Sezon Risk Zaman Çizelgesi"
            description="Aylık kapasite kullanım ve risk seviyeleri"
            route="/forecast"
          >
            <MiniSeasonRiskWidget />
          </MiniChartCard>

          <MiniChartCard
            title="Maliyet-Kar Analizi"
            description="Gelir, maliyet ve kar karşılaştırması"
            route="/forecast"
          >
            <MiniCostProfitWidget />
          </MiniChartCard>

          <MiniChartCard
            title="Birim Maliyet Analizi"
            description="Baz maliyet ve enflasyon etkisi"
            route="/inflation"
          >
            <MiniUnitCostWidget />
          </MiniChartCard>
        </div>
      </div>

      {/* Sipariş Tablosu */}
      <div className="card">
        <div className="card-header-professional">
          <div>
            <h2 className="card-title">Sipariş Listesi</h2>
            <div className="card-subtitle">
              {loading ? (
                <span>Yükleniyor...</span>
              ) : error ? (
                <span style={{ color: '#dc3545' }}>Veri yüklenemedi</span>
              ) : (
                <>
                  Toplam: <strong>{orders.length}</strong> • 
                  Yüksek Risk: <strong style={{ color: '#dc3545' }}>{orders.filter(o => o.riskLevel === 'high').length}</strong>
                </>
              )}
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Yükleniyor...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Veri yüklenemedi: {error}</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Sipariş bulunamadı</div>
        ) : (
          <OrderTable 
            orders={orders} 
            onOrderClick={handleOrderClick}
            onFilteredOrdersChange={handleFilteredOrdersChange}
          />
        )}
      </div>

      {/* Detay Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={handleCloseModal} />
      )}
    </div>
  )
}

export default Dashboard
