import React from 'react'

function ViewModeToggle({ value = 'index', onChange, size = 'sm' }) {
  const isSmall = size === 'sm'
  
  return (
    <div style={{
      display: 'flex',
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      borderRadius: '6px',
      padding: '2px',
      gap: '2px'
    }}>
      <button
        onClick={() => onChange('raw')}
        style={{
          padding: isSmall ? '4px 10px' : '6px 14px',
          fontSize: isSmall ? '0.7rem' : '0.75rem',
          fontWeight: value === 'raw' ? '600' : '400',
          color: value === 'raw' ? '#fff' : '#94a3b8',
          backgroundColor: value === 'raw' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (value !== 'raw') {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 'raw') {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        Ham
      </button>
      <button
        onClick={() => onChange('index')}
        style={{
          padding: isSmall ? '4px 10px' : '6px 14px',
          fontSize: isSmall ? '0.7rem' : '0.75rem',
          fontWeight: value === 'index' ? '600' : '400',
          color: value === 'index' ? '#fff' : '#94a3b8',
          backgroundColor: value === 'index' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (value !== 'index') {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 'index') {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        Endeks (100)
      </button>
    </div>
  )
}

export default ViewModeToggle









