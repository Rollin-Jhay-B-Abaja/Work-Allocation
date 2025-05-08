import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PredictionChart from './PredictionChart';
import TeacherRetentionDataTable from './TeacherRetentionDataTable';
import TeacherRetentionForm from './TeacherRetentionForm';
import '../../styles/employeeFormStyles.css';
import './TeacherRetentionPredictionPage.css';

const TeacherRetentionPredictionPage = () => {
  const navigate = useNavigate();
  const [predictionData, setPredictionData] = useState(null);
  const [notification, setNotification] = useState('');
  const [savedData, setSavedData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Fetch saved prediction data on component mount
    fetch('http://localhost:8000/api/teacher_retention.php')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const text = await res.text();
        return JSON.parse(text);
      })
      .then((data) => {
        if (data) {
          setSavedData(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching saved data on mount:', err);
      });
  }, []);

  useEffect(() => {
    if (savedData.length > 0) {
      callPredictionAPI(savedData);
      fetchRecommendations();
    }
  }, [savedData]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/teacher_retention_recommendations.php');
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      console.log('Recommendations API response:', data);
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    }
  };

  const callPredictionAPI = async (data) => {
    try {
      if (!Array.isArray(data)) {
        setNotification('Invalid data format for prediction.');
        setPredictionData(null);
        return;
      }

      const enhancedData = data.map(row => {
        const teachers_total = ['teachers_STEM', 'teachers_ICT', 'teachers_GAS', 'teachers_ABM', 'teachers_HUMSS']
          .reduce((sum, key) => sum + (Number(row[key]) || 0), 0);
        const students_total = ['students_STEM', 'students_ICT', 'students_GAS', 'students_ABM', 'students_HUMSS']
          .reduce((sum, key) => sum + (Number(row[key]) || 0), 0);
        return {
          ...row,
          teachers_total,
          students_total
        };
      });

      const response = await fetch('http://localhost:5000/api/data_forecasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        setNotification('Prediction API error: ' + errorText);
        setPredictionData(null);
        return;
      }
      const result = await response.json();
      if (result.warnings && result.warnings.length > 0) {
        setNotification(result.warnings.join(' '));
      } else {
        setNotification('');
      }
      if (result['resignations_count'] && result['retentions_count'] && result['hires_needed']) {
        console.log('Raw hires_needed from API:', result['hires_needed']);
        const yearsCount = Object.values(result['resignations_count'])[0].length;
        const baseYear = result.last_year ? Number(result.last_year) + 1 : (savedData.length > 0 ? Number(savedData[savedData.length - 1].year) + 1 : new Date().getFullYear());
        const transformedData = [];
        for (let i = 0; i < yearsCount; i++) {
          const yearData = {
            year: (baseYear + i).toString(),
            resignations_count: {},
            retentions_count: {},
            hires_needed: {},
          };
          for (const strand of Object.keys(result['resignations_count'])) {
            yearData.resignations_count[strand] = result['resignations_count'][strand][i] || 0;
            yearData.retentions_count[strand] = result['retentions_count'][strand][i] || 0;
            yearData.hires_needed[strand] = result['hires_needed'][strand][i] || 0;
          }
          transformedData.push(yearData);
        }
        console.log('Transformed prediction data:', transformedData);
        setPredictionData(transformedData);
      } else {
        setPredictionData(null);
      }
    } catch (error) {
      setNotification('Error calling prediction API.');
      setPredictionData(null);
    }
  };

  const handleFormSubmit = async (formData) => {
    // Check for duplicate year in savedData
    if (savedData.some(item => item.year === formData.year)) {
      setNotification(`Data for year ${formData.year} already exists. Duplicate years are not allowed.`);
      return;
    }

    // Prepare data for submission
    const payload = {
      year: formData.year,
      teachers_STEM: Number(formData.teachers.STEM),
      teachers_ABM: Number(formData.teachers.ABM),
      teachers_GAS: Number(formData.teachers.GAS),
      teachers_HUMSS: Number(formData.teachers.HUMSS),
      teachers_ICT: Number(formData.teachers.ICT),
      students_STEM: Number(formData.students.STEM),
      students_ABM: Number(formData.students.ABM),
      students_GAS: Number(formData.students.GAS),
      students_HUMSS: Number(formData.students.HUMSS),
      students_ICT: Number(formData.students.ICT),
      historical_resignations: Number(formData.workloadCompensation.historical_resignations),
      historical_retentions: Number(formData.workloadCompensation.historical_retentions),
      workload_per_teacher: Number(formData.workloadCompensation.workload_per_teacher),
      salary_ratio: Number(formData.workloadCompensation.salary_ratio),
      professional_dev_hours: Number(formData.workloadCompensation.professional_dev_hours),
    };

    try {
      const response = await fetch('http://localhost:8000/api/save_teacher_retention_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([payload]),
      });
      if (!response.ok) {
        const errorText = await response.text();
        setNotification('Error saving data: ' + errorText);
        return;
      }
      const result = await response.json();
      if (result.message) {
        setNotification('Successfully added!');
        // Refresh saved data
        const res = await fetch('http://localhost:8000/api/get_prediction_data.php');
        const text = await res.text();
        const data = JSON.parse(text);
        if (data.data) {
          setSavedData(data.data);
        }
      } else {
        setNotification('Failed to save data.');
      }
    } catch (error) {
      setNotification('Error saving data.');
    }
  };

  const handleFormCancel = () => {
    // No longer needed since form is always visible, but keep for compatibility
  };

  return (
    <div className="Trend-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate("/analysis")}>
          LYCEUM OF ALABANG
        </h1>
      </header>

      <div className="Prediction-main">
        {!showForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%',}}>
            <div style={{ marginBottom: '20px' }}>
              <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#1e1e1e'}}>
                Upload Data
              </button>
            </div>
            <div className="Visual" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', }}>
              <div style={{ flex: 1, marginRight: '10px', }}>
                {predictionData ? (
                  <div className="chart-container" style={{ maxWidth:'800px', maxHeight: '500px', overflowY: 'hidden',backgroundColor: '#1e1e1e' }}>
                    <PredictionChart data={predictionData} />
                  </div>
                ) : (
                  <div className="chart-container">
                    <PredictionChart data={[]} />
                  </div>
                )}
                <div className="recommendations-prediction" style={{ height: '150px', width: '100%', maxWidth: '800px', overflowY: 'auto', marginTop: '1rem', color: 'white', backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '1rem' }}>
                  {recommendations.length > 0 ? (
                    <>
                      <h3>Recommendations</h3>
                      <ul>
                        {recommendations.map((rec, idx) => (
                          <li key={idx}>{rec.message}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div>No recommendations available.</div>
                  )}
                </div>
              </div>
              <div className="Right-column" style={{ flex: 1, marginLeft: '10px', maxWidth:'500px',maxHeight:'500px', display: 'flex', flexDirection: 'column' }}>
                <div>
                  {predictionData ? (
                    <div className="prediction-summary">
                      <h3>Prediction Summary (Per Strand)</h3>
                      {predictionData.map((item, index) => (
                        <div key={index} style={{ marginBottom: '1rem' }}>
                          <strong>Year {item.year}:</strong>
                          <div style={{ marginLeft: '1rem' }}>
                            {Object.keys(item.resignations_count || {}).map(strand => (
                              <div key={strand} style={{ marginBottom: '0.25rem' }}>
                                <em>{strand}</em> - Resigning: {(item.resignations_count[strand] || 0).toFixed(2)}, Retaining: {(item.retentions_count[strand] || 0).toFixed(2)}, To be Hired: {typeof item.hires_needed[strand] === 'number' ? item.hires_needed[strand].toFixed(2) : Array.isArray(item.hires_needed[strand]) ? item.hires_needed[strand].map(val => val.toFixed(2)).join(', ') : '0.00'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>No prediction data available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <div className="Prediction-form" style={{ width: '800px', height: '500px', overflowY: 'auto' }}>
            <button onClick={() => setShowForm(false)} style={{ marginBottom: '10px', padding: '8px 16px', fontSize: '14px' }}>
              Back
            </button>
            <TeacherRetentionForm
              priorYearData={savedData.length > 0 ? savedData[savedData.length - 1] : null}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
              successMessage={notification === 'Successfully added!' ? notification : ''}
              errorMessage={notification && notification !== 'Successfully added!' ? notification : ''}
            />
          </div>
          </div>
        )}
      </div>

      <div className="table-section saved-data-container">
        <div className="saved-data-section" >
          <h2>Historical Data</h2>
          <TeacherRetentionDataTable data={savedData} />
        </div>
      </div>
    </div>
  );
};

export default TeacherRetentionPredictionPage;
