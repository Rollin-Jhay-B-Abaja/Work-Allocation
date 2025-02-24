import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse'; // For CSV parsing

const RiskAssessment = () => {
  // Removed unused state variable data and its setter

const [heatmapData, setHeatmapData] = useState({ datasets: [] });



  // Removed duplicate declaration of data and setData



  // Added state for storing parsed CSV data


  const [error, setError] = useState('');
  // Added state for storing heatmap data



  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const filteredData = results.data.filter(row => {
            return row['Teacher ID'] && row['Class Size'] && row['Hours per Week'];
          });

          if (filteredData.length === 0) {
            setError('No valid data found in the CSV file.');
            return;
          }

          // Removed setData call since data is no longer used

          setError('');

          setError('');
          generateHeatmapData(filteredData);
        },
      });
    }
  };

  const generateHeatmapData = (filteredData) => {
    // Logic to categorize risks based on thresholds
    const riskLevels = filteredData.map(row => {
      const classSize = parseInt(row['Class Size']);
      const hoursPerWeek = parseInt(row['Hours per Week']);
      const satisfactionScore = parseFloat(row['Teacher Satisfaction Score']);

      if (hoursPerWeek > 30 || classSize > 40 || satisfactionScore < 3) {
        return 'High Risk';
      } else if (hoursPerWeek > 20 || classSize > 30 || satisfactionScore < 4) {
        return 'Medium Risk';
      } else {
        return 'Low Risk';
      }
    });

    // Prepare heatmap data
    const heatmapData = {
      labels: filteredData.map(row => row['Teacher Name']),
      datasets: [
        {
          label: 'Risk Level',
          data: riskLevels,
          backgroundColor: riskLevels.map(level => {
            if (level === 'High Risk') return 'rgba(255, 99, 132, 1)';
            if (level === 'Medium Risk') return 'rgba(255, 206, 86, 1)';
            return 'rgba(75, 192, 192, 1)';
          }),
        },
      ],
    };

    setHeatmapData(heatmapData);
  };

  return (
    <div>
      <h1>Risk Assessment</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {heatmapData.datasets.length > 0 && (

        <Bar data={heatmapData} />

      )}
    </div>
  );
};

export default RiskAssessment;
