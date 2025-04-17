import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController);

function EnrollmentChart({ predictionResults }) {
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/ml_interface.php');
        if (response.ok) {
          const data = await response.json();
          setHistoricalData(data);
        } else {
          console.error("Failed to fetch enrollment data:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching enrollment data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (chartContainerRef.current) {
      const ctx = chartContainerRef.current.getContext('2d');
      chartRef.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: historicalData.map(data => data.year),
          datasets: [
            {
              label: 'STEM',
              data: historicalData.map(data => data.STEM),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
              label: 'ABM',
              data: historicalData.map(data => data.ABM),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
            {
              label: 'GAS',
              data: historicalData.map(data => data.GAS),
              backgroundColor: 'rgba(255, 206, 86, 0.6)',
            },
            {
              label: 'HUMSS',
              data: historicalData.map(data => data.HUMSS),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
            {
              label: 'ICT',
              data: historicalData.map(data => data.ICT),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Enrollees Forecasting',
              color: 'blue',
              font: {
                size: 24,
              },
            },
            legend: {
              position: 'top',
            },
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [historicalData]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div className="chart-container" style={{ width: '100%', maxWidth: '1300px', height: '500px', margin: '0 auto' }}>
      <canvas ref={chartContainerRef}></canvas>
    </div>
  );
}

export default EnrollmentChart;
