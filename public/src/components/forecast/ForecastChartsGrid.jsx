import React, { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import SeasonProductionLoadChart from './SeasonProductionLoadChart'
import SeasonProductionLoadBarChart from './SeasonProductionLoadBarChart'
import SeasonBrandLoadPieChart from './SeasonBrandLoadPieChart'
import SeasonBrandProfitBarChart from './SeasonBrandProfitBarChart'
import DecisionSupportPanel from './DecisionSupportPanel'
import { buildDecisionSupportSummary } from '../../utils/decisionSupportBuilder'
import '../../App.css'

function ForecastChartsGrid({ yearKey, selectedBrands, season, computedSnapshot, forecastData }) {
  const formatNumber = (value) => {
    return new Intl.NumberFormat('tr-TR').format(value)
  }

  // "Ortalama" seçiliyse buton göster
  const showNextSeasonButton = yearKey === 'Ortalama'

  // Her kart için panel açık/kapalı state'leri
  const [isInsightOpen1, setIsInsightOpen1] = useState(false)
  const [isInsightOpen2, setIsInsightOpen2] = useState(false)
  const [isInsightOpen3, setIsInsightOpen3] = useState(false)
  const [isInsightOpen4, setIsInsightOpen4] = useState(false)

  // Her kart için chart data state'leri
  const [chartData1, setChartData1] = useState(null)
  const [chartData2, setChartData2] = useState(null)
  const [chartData3, setChartData3] = useState(null)
  const [chartData4, setChartData4] = useState(null)

  // Gelecek sezon analizi handler'ları (her kart için ayrı)
  const handleNextSeasonAnalysis1 = () => {
    if (selectedBrands.length === 0 || !season) return
    setIsInsightOpen1(v => !v)
  }

  const handleNextSeasonAnalysis2 = () => {
    if (selectedBrands.length === 0 || !season) return
    setIsInsightOpen2(v => !v)
  }

  const handleNextSeasonAnalysis3 = () => {
    if (selectedBrands.length === 0 || !season) return
    setIsInsightOpen3(v => !v)
  }

  const handleNextSeasonAnalysis4 = () => {
    if (selectedBrands.length === 0 || !season) return
    setIsInsightOpen4(v => !v)
  }

  // Threshold değerleri (load index için)
  const thresholds = {
    high: 110,
    medium: 105
  }

  if (!computedSnapshot) {
    return (
      <div className="forecast-charts-grid-container">
        <div className="forecast-charts-empty">
          <p>Önce "Tahmin Oluştur" butonuna tıklayarak analiz oluşturun.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="forecast-charts-grid-container">
      <h3 className="forecast-charts-section-title">Analiz Grafikleri</h3>
      
      <div className="forecast-charts-grid">
        {/* Grafik 1: Sezonluk Üretim Yükü */}
        <div className="forecast-chart-card">
          <div className="forecast-chart-card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <h4 className="forecast-chart-card-title">Sezonluk Üretim Yükü</h4>
                <div className="forecast-chart-card-subtitle">Yıl: {yearKey} | Sezon: {season}</div>
              </div>
              {showNextSeasonButton && (
                <button
                  className="forecast-next-season-btn"
                  onClick={handleNextSeasonAnalysis1}
                  disabled={selectedBrands.length === 0 || !season}
                  title={selectedBrands.length === 0 || !season ? "Analiz için marka ve sezon seçiniz" : "Gelecek sezon analizi yap"}
                >
                  <TrendingUp size={14} />
                  <span>Gelecek Sezon Analizi Yap</span>
                </button>
              )}
            </div>
          </div>
          <div className="forecast-chart-card-content">
            <SeasonProductionLoadBarChart
              key={`${yearKey}-${season}-${computedSnapshot.orderQty}-${selectedBrands.join(',')}-left`}
              season={season}
              yearKey={yearKey}
              forecastTotal={computedSnapshot.orderQty || 0}
              selectedBrands={selectedBrands}
              onDataReady={setChartData1}
            />
            {/* Karar Destek Özeti Paneli */}
            {showNextSeasonButton && isInsightOpen1 && chartData1 && (
              <DecisionSupportPanel
                {...buildDecisionSupportSummary({
                  chartType: 'production-load-bar',
                  data: chartData1,
                  thresholds,
                  selectedBrands,
                  selectedSeason: season
                })}
                onClose={handleNextSeasonAnalysis1}
              />
            )}
          </div>
        </div>

        {/* Grafik 2: Sezonluk Yük Endeksi */}
        <div className="forecast-chart-card">
          <div className="forecast-chart-card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <h4 className="forecast-chart-card-title">Sezonluk Yük Endeksi</h4>
                <div className="forecast-chart-card-subtitle">Yıl: {yearKey} | Sezon: {season}</div>
                <div className="forecast-chart-card-description">
                  İlk ay = 100 baz alınır, diğer aylar buna göre endekslenir
                </div>
              </div>
              {showNextSeasonButton && (
                <button
                  className="forecast-next-season-btn"
                  onClick={handleNextSeasonAnalysis2}
                  disabled={selectedBrands.length === 0 || !season}
                  title={selectedBrands.length === 0 || !season ? "Analiz için marka ve sezon seçiniz" : "Gelecek sezon analizi yap"}
                >
                  <TrendingUp size={14} />
                  <span>Gelecek Sezon Analizi Yap</span>
                </button>
              )}
            </div>
          </div>
          <div className="forecast-chart-card-content">
            <SeasonProductionLoadChart
              key={`${yearKey}-${season}-${computedSnapshot.orderQty}-${selectedBrands.join(',')}-right`}
              season={season}
              yearKey={yearKey}
              forecastTotal={computedSnapshot.orderQty || 0}
              selectedBrands={selectedBrands}
              onDataReady={setChartData2}
            />
            {/* Karar Destek Özeti Paneli */}
            {showNextSeasonButton && isInsightOpen2 && chartData2 && (
              <DecisionSupportPanel
                {...buildDecisionSupportSummary({
                  chartType: 'load-index-line',
                  data: chartData2,
                  thresholds,
                  selectedBrands,
                  selectedSeason: season
                })}
                onClose={handleNextSeasonAnalysis2}
              />
            )}
          </div>
        </div>

        {/* Grafik 3: Sezon İçinde Marka Yük Dağılımı */}
        <div className="forecast-chart-card">
          <div className="forecast-chart-card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <h4 className="forecast-chart-card-title">Sezon İçinde Marka Yük Dağılımı</h4>
                <div className="forecast-chart-card-subtitle">Yıl: {yearKey} | Sezon: {season}</div>
              </div>
              {showNextSeasonButton && (
                <button
                  className="forecast-next-season-btn"
                  onClick={handleNextSeasonAnalysis3}
                  disabled={selectedBrands.length === 0 || !season}
                  title={selectedBrands.length === 0 || !season ? "Analiz için marka ve sezon seçiniz" : "Gelecek sezon analizi yap"}
                >
                  <TrendingUp size={14} />
                  <span>Gelecek Sezon Analizi Yap</span>
                </button>
              )}
            </div>
          </div>
          <div className="forecast-chart-card-content">
            <SeasonBrandLoadPieChart
              key={`brand-load-pie-${yearKey}-${season}-${selectedBrands.join(',')}`}
              selectedBrands={selectedBrands}
              season={season}
              yearKey={yearKey}
              forecastData={forecastData}
              onDataReady={setChartData3}
            />
            {/* Karar Destek Özeti Paneli */}
            {showNextSeasonButton && isInsightOpen3 && chartData3 && (
              <DecisionSupportPanel
                {...buildDecisionSupportSummary({
                  chartType: 'brand-load-pie',
                  data: chartData3,
                  thresholds,
                  selectedBrands,
                  selectedSeason: season
                })}
                onClose={handleNextSeasonAnalysis3}
              />
            )}
          </div>
        </div>

        {/* Grafik 4: Sezon Gelir • Maliyet • Kâr Analizi */}
        <div className="forecast-chart-card">
          <div className="forecast-chart-card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <h4 className="forecast-chart-card-title">Sezon Gelir • Maliyet • Kâr Analizi</h4>
                <div className="forecast-chart-card-subtitle">
                  Marka: {selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} Marka`} | Sezon: {season} | Yıl: {yearKey}
                </div>
              </div>
              {showNextSeasonButton && (
                <button
                  className="forecast-next-season-btn"
                  onClick={handleNextSeasonAnalysis4}
                  disabled={selectedBrands.length === 0 || !season}
                  title={selectedBrands.length === 0 || !season ? "Analiz için marka ve sezon seçiniz" : "Gelecek sezon analizi yap"}
                >
                  <TrendingUp size={14} />
                  <span>Gelecek Sezon Analizi Yap</span>
                </button>
              )}
            </div>
          </div>
          <div className="forecast-chart-card-content">
            <SeasonBrandProfitBarChart
              key={`profit-bar-${yearKey}-${season}-${selectedBrands.join(',')}`}
              selectedBrands={selectedBrands}
              season={season}
              yearKey={yearKey}
              computedSnapshot={computedSnapshot}
              onDataReady={setChartData4}
            />
            {/* Karar Destek Özeti Paneli */}
            {showNextSeasonButton && isInsightOpen4 && chartData4 && (
              <DecisionSupportPanel
                {...buildDecisionSupportSummary({
                  chartType: 'profit-bar',
                  data: chartData4,
                  thresholds,
                  selectedBrands,
                  selectedSeason: season
                })}
                onClose={handleNextSeasonAnalysis4}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForecastChartsGrid

