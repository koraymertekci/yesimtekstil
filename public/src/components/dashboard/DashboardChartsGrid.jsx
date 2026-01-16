import React from 'react'

function DashboardChartsGrid({ items = [] }) {
  const topRow = items.slice(0, 2)
  const bottomRow = items.slice(2, 4)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {topRow.map((item, index) => (
          <div key={index} className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="chart-card-header">
              <h3 className="chart-card-title">{item.title}</h3>
              {item.subtitle && (
                <div className="chart-card-subtitle" style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  marginTop: '4px' 
                }}>
                  {item.subtitle}
                </div>
              )}
            </div>
            <div className="chart-card-content" style={{ flex: 1, minHeight: 0 }}>
              {item.content}
            </div>
          </div>
        ))}
      </div>
      {bottomRow.length > 0 && (
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', alignItems: 'stretch' }}>
          {bottomRow.map((item, index) => (
            <div key={index + 2} className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="chart-card-header">
                <h3 className="chart-card-title">{item.title}</h3>
                {item.subtitle && (
                  <div className="chart-card-subtitle" style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)', 
                    marginTop: '4px' 
                  }}>
                    {item.subtitle}
                  </div>
                )}
              </div>
              <div className="chart-card-content" style={{ flex: 1, minHeight: 0 }}>
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DashboardChartsGrid

