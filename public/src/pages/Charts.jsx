import React from 'react'
import DashboardChartsGrid from '../components/dashboard/DashboardChartsGrid'
import LateOrdersCumulativeChart from '../components/dashboard/LateOrdersCumulativeChart'
import '../App.css'

function Charts() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Grafik Panosu</h1>
        <p>Kritik göstergeler ve trendler</p>
      </div>

      <div className="card">
        <DashboardChartsGrid
          items={[
            {
              title: 'Gecikme Kümülatif Trend',
              content: <LateOrdersCumulativeChart />
            },
            {
              title: 'Gecikme Oranı',
              content: (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Yakında eklenecek
                </div>
              )
            },
            {
              title: 'Termin Risk Dağılımı',
              content: (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Yakında eklenecek
                </div>
              )
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
    </div>
  )
}

export default Charts









