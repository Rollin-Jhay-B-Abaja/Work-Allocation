import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import Papa from 'papaparse'; // For CSV parsing
import axios from 'axios'; // Import axios for API calls

const StudentEnrollmentPrediction = () => {
  const [data, setData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const filteredData = results.data.filter(row => {
            const year = parseInt(row.Year);
            return year >= new Date().getFullYear() - 5;
          });
          if (filteredData.length < 5) {
            setError('Fewer than 5 years of data provided. Predictions may be inaccurate.');
          } else {
            setError('');
          }
          setData(filteredData);
        },
      });
    }
  };

  const handlePredict = async () => {
    if (data.length < 5) {
      setError('Not enough data to make predictions.');
      return;
    }

    const enrollments = data.map(row => parseInt(row.Enrollment));
    try {
        const response = await axios.post('/api/data_forecasting', { data: enrollments });
        const futureEnrollments = response.data.output; // Assuming the API returns the predictions in this format
        const futureYears = [new Date().getFullYear() + 1, new Date().getFullYear() + 2, new Date().getFullYear() + 3];

        setPredictions(futureYears.map((year, index) => ({
            year,
            enrollment: futureEnrollments[index],
        })));
    } catch (error) {
        setError('Error fetching predictions from the API.');
    }
  };

  const handleReset = () => {
    setData([]);
    setPredictions([]);
    setError('');
  };

  const chartData = {
    labels: predictions.map(p => p.year),
    datasets: [
      {
        label: 'Predicted Enrollment',
        data: predictions.map(p => p.enrollment),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h1>Student Enrollment Prediction</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handlePredict}>Predict</button>
      <button onClick={handleReset}>Reset</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {predictions.length > 0 && (
        <div>
          <h2>Predictions for the Next 3 Years</h2>
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
};

export default StudentEnrollmentPrediction;
