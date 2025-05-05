import React from 'react';
import PredictionChart from './PredictionChart';

const TeacherRetentionResults = ({ predictionData }) => {
  if (!predictionData) {
    return <div>No prediction data available.</div>;
  }

  // Transform predictionData to array format expected by PredictionChart
  // predictionData keys: resignations_forecast, retentions_forecast, hires_needed
  // Each is an object with strand keys and array values per forecast year

  const forecastYears = predictionData.resignations_forecast ? predictionData.resignations_forecast['STEM'].length : 0;

  // Create array of objects with year and aggregated values
  const chartData = [];

  for (let i = 0; i < forecastYears; i++) {
    let yearLabel = `Year ${i + 1}`;
    let totalResigning = 0;
    let totalRetaining = 0;
    let totalHiring = 0;

    for (const strand of Object.keys(predictionData.resignations_forecast)) {
      totalResigning += predictionData.resignations_forecast[strand][i] || 0;
      totalRetaining += predictionData.retentions_forecast[strand][i] || 0;
      totalHiring += predictionData.hires_needed[strand][i] || 0;
    }

    chartData.push({
      year: yearLabel,
      historical_resignations: totalResigning,
      historical_retentions: totalRetaining,
      historical_hires: totalHiring,
    });
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', color: '#fff' }}>
      <h2>Teacher Retention Prediction Results</h2>
      <PredictionChart data={chartData} />
    </div>
  );
};

export default TeacherRetentionResults;
