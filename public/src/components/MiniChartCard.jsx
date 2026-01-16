import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import '../App.css'

/**
 * Mini Chart Card Component
 * Dashboard'da kullanılacak küçük grafik kartları için reusable component
 */
function MiniChartCard({ 
  title, 
  description, 
  children, 
  route, 
  loading = false,
  error = null 
}) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    if (route) {
      navigate(route)
    }
  }

  return (
    <div 
      className="mini-chart-card"
      onClick={handleCardClick}
      style={{
        cursor: route ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div className="mini-chart-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ flex: 1 }}>
          <h3 className="mini-chart-title" style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '4px'
          }}>
            {title}
          </h3>
          <p className="mini-chart-description" style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: '1.4'
          }}>
            {description}
          </p>
        </div>
        {route && (
          <button
            className="mini-chart-detail-btn"
            onClick={(e) => {
              e.stopPropagation()
              navigate(route)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary-color)'
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="Detay sayfasına git"
          >
            <ExternalLink size={14} />
          </button>
        )}
      </div>

      {/* Chart Content */}
      <div className="mini-chart-content" style={{
        height: '140px',
        width: '100%',
        position: 'relative'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem'
          }}>
            Yükleniyor...
          </div>
        ) : error ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#dc3545',
            fontSize: '0.75rem',
            textAlign: 'center',
            padding: '8px'
          }}>
            {error}
          </div>
        ) : children ? (
          children
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem'
          }}>
            Veri yok
          </div>
        )}
      </div>
    </div>
  )
}

export default MiniChartCard











