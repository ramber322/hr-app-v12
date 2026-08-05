// src/components/WeatherWidget.jsx
import '/src/styles/WeatherWidget.css';

export default function WeatherWidget() {
  return (
    <div className="weather-card" style={{ marginBottom: '0' }}>
      <div className="weather-container">
        <div className="cloud front">
          <span className="left-front"></span>
          <span className="right-front"></span>
        </div>
        <span className="sun sunshine"></span>
        <span className="sun"></span>
        <div className="cloud back">
          <span className="left-back"></span>
          <span className="right-back"></span>
        </div>
      </div>

      <div className="weather-card-header">
        <span>Iligan City<br />Philippines</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>

      <span className="weather-temp">27°</span>

      <div className="weather-temp-scale">
        <span>Celcius</span>
      </div>
    </div>
  );
}