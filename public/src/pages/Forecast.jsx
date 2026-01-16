import React from 'react'
import SeasonForecastBuilder from '../components/forecast/SeasonForecastBuilder'
import '../App.css'

export default function Forecast() {
  return (
    <div className="forecast-zoom">
      <SeasonForecastBuilder />
    </div>
  )
}
