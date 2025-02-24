import React, { useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import Papa from 'papaparse'; // For CSV parsing

const TrendIdentification = () => {
  // Removed unused state variable data and its setter

  const [error, setError] = useState('');
  const [chartData, setChartData] = useState({});

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const filteredData = results.data.filter(row => {
            return row['Teacher ID'] && row['Class Size'] && row['Year'];
          });

          if (filteredData.length === 0) {
            setError('No valid data found in the CSV file.');
            return;
          }

          // Removed setData call since data is no longer used

          setError('');
          generateChartData(filteredData);
        },
      });
    }
  };

  const generateChartData = (filteredData) => {
    const classSizes = filteredData.map(row => parseInt(row['Class Size']));
    const performanceMetrics = filteredData.map(row => parseFloat(row['Average Grades of Students'])); // Example metric

    const chartData = {
      labels: filteredData.map(row => row['Teacher Name']),
      datasets: [
        {
          label: 'Class Size vs Teacher Performance',
          data: classSizes.map((size, index) => ({ x: size, y: performanceMetrics[index] })),
          backgroundColor: 'rgba(75,192,192,1)',
        },
      ],
    };

    setChartData(chartData);
  };

  return (
    <div>
      <h1>Trend Identification</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {chartData.datasets && (
        <Scatter data={chartData} />
      )}
    </div>
  );
};

export default TrendIdentification;
