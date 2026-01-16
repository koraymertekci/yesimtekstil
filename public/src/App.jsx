import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home, Package, ShoppingCart, TrendingUp, User, Sun, Moon, Wrench } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Forecast from './pages/Forecast'
import Inflation from './pages/Inflation'
import Maintenance from './pages/Maintenance'
import Charts from './pages/Charts'
import yesimLogo from './assets/yesim-logo.svg'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark-theme' : 'light-theme'} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} collapsed={sidebarCollapsed} />
        <div className="main-wrapper">
          <MainContentWrapper>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/inflation" element={<Inflation />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/charts" element={<Charts />} />
            </Routes>
          </MainContentWrapper>
        </div>
      </div>
    </Router>
  )
}

function MainContentWrapper({ children }) {
  const location = useLocation()
  const isInflationPage = location.pathname === '/inflation'
  
  return (
    <main className={`main-content ${isInflationPage ? 'inflation-zoom' : ''}`}>
      {children}
    </main>
  )
}

function Sidebar({ darkMode, setDarkMode, collapsed }) {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/stock', label: 'Stok Yönetimi', icon: Package },
    { path: '/forecast', label: 'Satın Alma Karar Desteği', icon: ShoppingCart },
    { path: '/inflation', label: 'Enflasyon & Piyasa Varsayımları', icon: TrendingUp },
    { path: '/maintenance', label: 'Üretim Kaynakları & Bakım', icon: Wrench },
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <img src={yesimLogo} alt="Yeşim Tekstil Logo" className="sidebar-brand-logo" />
          {!collapsed && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-title">Yeşim Tekstil</div>
              <div className="sidebar-brand-subtitle">Karar Destek Sistemi</div>
            </div>
          )}
        </div>

        <div className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <Icon size={20} className="sidebar-icon" />
                <span className="sidebar-label">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-item" title={collapsed ? 'Yönetici' : ''}>
            <User size={20} className="sidebar-icon" />
            <span className="sidebar-label">Yönetici</span>
          </div>
          <div 
            className="sidebar-item theme-toggle" 
            onClick={() => setDarkMode(!darkMode)}
            title={collapsed ? 'Tema Değiştir' : ''}
          >
            {darkMode ? <Sun size={20} className="sidebar-icon" /> : <Moon size={20} className="sidebar-icon" />}
            <span className="sidebar-label">Açık Tema</span>
            <div className={`toggle-switch ${darkMode ? 'off' : 'on'}`}>
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default App

