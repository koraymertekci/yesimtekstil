import React, { useState } from 'react'
import FocusChartModal from '../common/FocusChartModal'

const scrollbarStyle = `
  .insight-cards-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .insight-cards-scroll::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.5);
    border-radius: 3px;
  }
  .insight-cards-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 3px;
  }
  .insight-cards-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = scrollbarStyle
  if (!document.head.querySelector('style[data-insight-cards-scroll]')) {
    styleSheet.setAttribute('data-insight-cards-scroll', 'true')
    document.head.appendChild(styleSheet)
  }
}

function InsightCards({ 
  items = [], 
  collapsible = true, 
  defaultOpen = false,
  modalTitle,
  modalSubtitle,
  modalChart,
  modalRangeToggle,
  modalViewModeToggle
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleShowClick = () => {
    if (modalChart) {
      setIsModalOpen(true)
    } else {
      setIsOpen(!isOpen)
    }
  }

  if (!items || items.length === 0) {
    return null
  }

  const getToneColor = (tone) => {
    switch (tone) {
      case 'positive':
        return '#10b981'
      case 'negative':
        return '#ef4444'
      case 'warning':
        return '#f59e0b'
      case 'info':
        return '#3b82f6'
      case 'neutral':
      default:
        return '#94a3b8'
    }
  }

  const generateSummary = () => {
    if (items.length === 0) return ''
    
    const summaryItems = items.slice(0, 3).map(item => {
      return `${item.label}: ${item.value}`
    })
    
    return summaryItems.join(' • ')
  }

  const summary = generateSummary()

  if (!collapsible) {
    return (
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              minWidth: '180px',
              flex: '1 1 200px',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '12px',
              transition: 'all 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'
            }}
          >
            <div style={{
              fontSize: '0.65rem',
              color: '#94a3b8',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: getToneColor(item.tone),
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {item.value}
            </div>
            {item.hint && (
              <div style={{
                fontSize: '0.65rem',
                color: '#64748b',
                lineHeight: '1.3'
              }}>
                {item.hint}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      marginTop: 'auto',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      flexShrink: 0
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '0.7rem',
          color: '#94a3b8',
          fontWeight: '500'
        }}>
          Analiz Kartları
        </div>
        <button
          onClick={handleShowClick}
          aria-expanded={isOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: modalChart ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.6)',
            border: modalChart ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '6px 12px',
            color: modalChart ? '#3b82f6' : '#94a3b8',
            fontSize: '0.7rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            fontWeight: modalChart ? '500' : '400'
          }}
          onMouseEnter={(e) => {
            if (modalChart) {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
            } else {
              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }
          }}
          onMouseLeave={(e) => {
            if (modalChart) {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
            } else {
              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleShowClick()
            }
          }}
        >
          <span>Göster</span>
          {!modalChart && (
            <span style={{
              fontSize: '0.65rem',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block'
            }}>
              ▼
            </span>
          )}
        </button>
      </div>

      {!isOpen && (
        <div style={{
          fontSize: '0.7rem',
          color: '#64748b',
          padding: '8px 0',
          lineHeight: '1.4'
        }}>
          {summary}
        </div>
      )}

      <div
        style={{
          maxHeight: isOpen ? '160px' : '0',
          opacity: isOpen ? 1 : 0,
          overflowY: isOpen ? 'auto' : 'hidden',
          overflowX: 'hidden',
          transition: 'max-height 0.25s ease-in-out, opacity 0.25s ease-in-out',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148, 163, 184, 0.3) rgba(30, 41, 59, 0.5)'
        }}
        className="insight-cards-scroll"
      >
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          paddingTop: isOpen ? '8px' : '0',
          paddingBottom: isOpen ? '4px' : '0'
        }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                minWidth: '180px',
                flex: '1 1 200px',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '12px',
                transition: 'all 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.7)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'
              }}
            >
              <div style={{
                fontSize: '0.65rem',
                color: '#94a3b8',
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: getToneColor(item.tone),
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                {item.value}
              </div>
              {item.hint && (
                <div style={{
                  fontSize: '0.65rem',
                  color: '#64748b',
                  lineHeight: '1.3'
                }}>
                  {item.hint}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && modalChart && (
        <FocusChartModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalTitle || 'Grafik Detayı'}
          subtitle={modalSubtitle}
          childrenChart={modalChart}
          childrenInsights={items.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                transition: 'all 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)'
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '1.1rem',
                color: getToneColor(item.tone),
                fontWeight: '600',
                marginBottom: '6px'
              }}>
                {item.value}
              </div>
              {item.hint && (
                <div style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  lineHeight: '1.4'
                }}>
                  {item.hint}
                </div>
              )}
            </div>
          ))}
          rangeToggle={modalRangeToggle}
          viewModeToggle={modalViewModeToggle}
        />
      )}
    </div>
  )
}

export default InsightCards
