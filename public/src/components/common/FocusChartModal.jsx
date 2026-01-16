import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

function FocusChartModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  childrenChart, 
  childrenInsights,
  rangeToggle,
  viewModeToggle
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(8px)',
            flexShrink: 0
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#fff',
              margin: 0,
              marginBottom: '6px',
              lineHeight: '1.3'
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{
                fontSize: '0.9rem',
                color: '#94a3b8',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}>
            {viewModeToggle}
            {rangeToggle}
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#ef4444',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                height: '40px',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
        className="focus-modal-body-scroll"
        >
          <div style={{
            width: '100%',
            height: isMobile ? '300px' : '420px',
            minHeight: isMobile ? '300px' : '420px',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {childrenChart}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            width: '100%'
          }}>
            {childrenInsights}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

const scrollbarStyle = `
  .focus-modal-body-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .focus-modal-body-scroll::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.5);
    border-radius: 4px;
  }
  .focus-modal-body-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.4);
    border-radius: 4px;
  }
  .focus-modal-body-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.6);
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = scrollbarStyle
  if (!document.head.querySelector('style[data-focus-modal-scroll]')) {
    styleSheet.setAttribute('data-focus-modal-scroll', 'true')
    document.head.appendChild(styleSheet)
  }
}

export default FocusChartModal
