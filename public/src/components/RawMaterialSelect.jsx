import React, { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import '../App.css'

/**
 * RawMaterialSelect - Koyu tema uyumlu custom hammadde dropdown
 */
function RawMaterialSelect({ materials, value, onChange, placeholder = 'Hammadde seçin' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // Tema kontrolü
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      const app = document.querySelector('.app')
      setIsDarkTheme(app?.classList.contains('dark-theme') || false)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    const app = document.querySelector('.app')
    if (app) {
      observer.observe(app, { attributes: true, attributeFilter: ['class'] })
    }
    return () => observer.disconnect()
  }, [])

  // Click outside ile kapanma
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setFocusedIndex(-1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev < materials.length - 1 ? prev + 1 : 0
          // Scroll into view
          if (listRef.current) {
            const option = listRef.current.children[next]
            if (option) {
              option.scrollIntoView({ block: 'nearest' })
            }
          }
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : materials.length - 1
          // Scroll into view
          if (listRef.current) {
            const option = listRef.current.children[next]
            if (option) {
              option.scrollIntoView({ block: 'nearest' })
            }
          }
          return next
        })
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        handleSelect(materials[focusedIndex])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, materials])

  const handleSelect = (material) => {
    onChange(material)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const selectedMaterial = materials.find(m => m.label === value?.label) || value

  const colors = {
    bg: isDarkTheme ? '#0f172a' : '#ffffff',
    border: isDarkTheme ? '#334155' : '#e0e0e0',
    borderHover: isDarkTheme ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
    text: isDarkTheme ? 'white' : '#1e293b',
    menuBg: isDarkTheme ? '#0f1a2e' : '#ffffff',
    hoverBg: isDarkTheme ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.1)',
    selectedBg: isDarkTheme ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)',
    textSecondary: isDarkTheme ? '#94a3b8' : '#64748b'
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        className="inflation-input"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setFocusedIndex(materials.findIndex(m => m.label === selectedMaterial?.label))
          }
        }}
        style={{
          width: '100%',
          padding: '0.35rem 0.5rem',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          fontSize: '0.875rem',
          height: '32px',
          backgroundColor: colors.bg,
          color: colors.text,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = colors.borderHover
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = colors.border
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {selectedMaterial ? `${selectedMaterial.label} (${selectedMaterial.unit})` : placeholder}
        </span>
        <span style={{
          marginLeft: '0.5rem',
          fontSize: '0.75rem',
          color: colors.textSecondary,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          flexShrink: 0
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: colors.menuBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            boxShadow: isDarkTheme 
              ? '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)'
              : '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)',
            zIndex: 1000,
            maxHeight: '260px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          ref={listRef}
        >
          {materials.length === 0 ? (
            <div style={{
              padding: '0.75rem',
              color: colors.textSecondary,
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              Hammadde bulunamadı
            </div>
          ) : (
            materials.map((material, index) => {
              const isSelected = selectedMaterial?.label === material.label
              const isFocused = focusedIndex === index

              return (
                <div
                  key={index}
                  onClick={() => handleSelect(material)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  style={{
                    padding: '0.625rem 0.75rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected 
                      ? colors.selectedBg 
                      : isFocused 
                        ? colors.hoverBg 
                        : 'transparent',
                    color: colors.text,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.15s',
                    borderLeft: isSelected ? `3px solid #3b82f6` : '3px solid transparent'
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {material.label} <span style={{ color: colors.textSecondary }}>({material.unit})</span>
                  </span>
                  {isSelected && (
                    <Check 
                      size={16} 
                      style={{ 
                        color: '#3b82f6',
                        marginLeft: '0.5rem',
                        flexShrink: 0
                      }} 
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default RawMaterialSelect

