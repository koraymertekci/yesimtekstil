import React from 'react'

function RangeToggle({ value = 6, onChange, size = 'sm' }) {
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
        onClick={() => onChange(6)}
        style={{
          padding: isSmall ? '4px 10px' : '6px 14px',
          fontSize: isSmall ? '0.7rem' : '0.75rem',
          fontWeight: value === 6 ? '600' : '400',
          color: value === 6 ? '#fff' : '#94a3b8',
          backgroundColor: value === 6 ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (value !== 6) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 6) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        6 Ay
      </button>
      <button
        onClick={() => onChange(12)}
        style={{
          padding: isSmall ? '4px 10px' : '6px 14px',
          fontSize: isSmall ? '0.7rem' : '0.75rem',
          fontWeight: value === 12 ? '600' : '400',
          color: value === 12 ? '#fff' : '#94a3b8',
          backgroundColor: value === 12 ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (value !== 12) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 12) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        12 Ay
      </button>
    </div>
  )
}

export default RangeToggle









