import React, { useState } from 'react';
import './Student-enrollment-Prediction.css'; // Ensure CSS is imported for styling

import { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Papa from 'papaparse';
import axios from 'axios';
import { Card, Button, Alert, Form } from 'react-bootstrap';

const StudentEnrollmentPrediction = () => {
  const [data, setData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const filteredData = results.data
            .filter(row => row.Year && row.Enrollment)
            .map(row => ({
              year: parseInt(row.Year),
              enrollment: parseInt(row.Enrollment)
            }))
            .sort((a, b) => a.year - b.year);

          if (filteredData.length < 5) {
            setError('Warning: Fewer than 5 years of data provided. Predictions may be less accurate.');
          } else {
            setError('');
          }
          setData(filteredData);
        },
        error: (err) => {
          setError('Error parsing CSV file. Please check the file format.');
        }
      });
    }
  };

  const handlePredict = async () => {
    if (data.length < 5) {
      setError('Error: At least 5 years of data required for predictions.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/data_forecasting', { 
        data: data.map(d => d.enrollment)
      });
      
      const { predictions, metrics, confidence_intervals } = response.data;
      
      const futureYears = [
        new Date().getFullYear() + 1,
        new Date().getFullYear() + 2, 
        new Date().getFullYear() + 3
      ];

      setPredictions(futureYears.map((year, index) => ({
        year,
        enrollment: predictions[index],
        confidence: confidence_intervals[index]
      })));
      
      setMetrics({
        mae: metrics.MAE,
        rmse: metrics.RMSE,
        mape: metrics.MAPE
      });
      
    } catch (error) {
      setError('Error: Failed to generate predictions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setData([]);
    setPredictions([]);
    setError('');
  };

  const chartData = {
    labels: [...data.map(d => d.year), ...predictions.map(p => p.year)],
    datasets: [
      {
        label: 'Historical Enrollment',
        data: data.map(d => d.enrollment),
        borderColor: '#36a2eb',
        fill: false,
        borderDash: [5, 5],
      },
      {
        label: 'Predicted Enrollment',
        data: [...Array(data.length).fill(null), ...predictions.map(p => p.enrollment)],
        borderColor: '#ff6384',
        fill: false,
      },
      {
        label: 'Confidence Interval',
        data: [...Array(data.length).fill(null), ...predictions.map(p => p.confidence[1])],
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        pointRadius: 0,
        borderDash: [5, 5],
      },
      {
        label: 'Confidence Interval',
        data: [...Array(data.length).fill(null), ...predictions.map(p => p.confidence[0])],
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: '-1',
        pointRadius: 0,
        borderDash: [5, 5],
      }
    ],
  };

  return (
    <Card className="prediction-container shadow-sm">
      <Card.Header>
        <h2>Student Enrollment Prediction</h2>
      </Card.Header>
      <Card.Body>
        <Form>
          <Form.Group controlId="csvUpload" className="mb-3">
            <Form.Label>Upload Enrollment Data (CSV)</Form.Label>
            <Form.Control 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              disabled={isLoading}
            />
            <Form.Text className="text-muted" style={{ color: '#dc3545' }}>
              CSV should contain 'Year' and 'Enrollment' columns
            </Form.Text>
          </Form.Group>

          <div className="button-group mb-3">
            <Button 
              variant="primary" 
              onClick={handlePredict}
              disabled={isLoading || data.length < 5}
            >
              {isLoading ? 'Predicting...' : 'Generate Predictions'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>

          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

          {data.length < 5 && (
            <Alert variant="warning">
              Warning: At least 5 years of data are required for accurate predictions.
            </Alert>
          )}

          {predictions.length > 0 && ( 
            <div className="mt-4">
              <Card className="metrics-card mb-3">
                <Card.Body>
                  <h5>Model Performance Metrics</h5>
                  <div className="metrics-grid">
                    <div>
                      <strong>MAE:</strong> {metrics.mae?.toFixed(2)}
                    </div>
                    <div>
                      <strong>RMSE:</strong> {metrics.rmse?.toFixed(2)}
                    </div>
                    <div>
                      <strong>MAPE:</strong> {metrics.mape?.toFixed(2)}%
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <h5>Enrollment Projections</h5>
                  <div className="chart-container">
                    <Line 
                      data={chartData}
                      options={{
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Students'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Year'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default StudentEnrollmentPrediction;
