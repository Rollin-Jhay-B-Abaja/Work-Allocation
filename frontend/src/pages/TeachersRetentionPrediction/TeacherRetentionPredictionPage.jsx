import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PredictionChart from './PredictionChart';
import TeacherRetentionDataTable from './TeacherRetentionDataTable';
import TeacherRetentionForm from './TeacherRetentionForm';
import '../../styles/employeeFormStyles.css';
import './TeacherRetentionPredictionPage.css';

const TeacherRetentionPredictionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [predictionData, setPredictionData] = useState(null);
  const [phpPredictionData, setPhpPredictionData] = useState(null);
  const [notification, setNotification] = useState('');
  const [savedData, setSavedData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching saved data on mount...');
        const res = await fetch('http://localhost:8000/api/get_prediction_data.php');
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const json = await res.json();
        const data = json.data || [];
        console.log('Saved data fetched:', data);
        setSavedData(data);
        console.log('Saved data state set.');

        // Transform data grouped by year with strand keys
        const groupedData = groupDataByYear(data);

        // Trigger prediction APIs after data fetch
        console.log('Calling callPredictionAPI...');
        await callPredictionAPI(groupedData);
        console.log('Calling callPhpPredictionAPI...');
        try {
          await Promise.race([
            callPhpPredictionAPI(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('callPhpPredictionAPI timeout')), 5000))
          ]);
        } catch (error) {
          console.error('callPhpPredictionAPI error or timeout:', error);
        }
        console.log('Calling fetchRecommendations...');
        await fetchRecommendations();
        console.log('Finished fetchRecommendations');
      } catch (err) {
        console.error('Error fetching saved data on mount:', err);
        // Even if error, still call prediction APIs with empty data
        await callPredictionAPI([]);
        await callPhpPredictionAPI();
        await fetchRecommendations();
      } finally {
        // Only set loading false here if predictionData is set or null
        // To avoid hiding loading spinner prematurely
        console.log('Setting loading state to false.');
        setLoading(false);
      }
    };

    // Function to group data by year and create strand-specific keys
    const groupDataByYear = (data) => {
      const grouped = {};
      data.forEach(row => {
        const year = row.year;
        if (!grouped[year]) {
          grouped[year] = {
            year: year,
            target_ratio: row.target_ratio,
            max_class_size: row.max_class_size,
            salary_ratio: row.salary_ratio,
            professional_dev_hours: row.professional_dev_hours,
            historical_resignations: 0,
            historical_retentions: 0,
            workload_per_teacher: 0,
            teachers_STEM: 0,
            teachers_ABM: 0,
            teachers_GAS: 0,
            teachers_HUMSS: 0,
            teachers_ICT: 0,
            students_STEM: 0,
            students_ABM: 0,
            students_GAS: 0,
            students_HUMSS: 0,
            students_ICT: 0,
          };
        }
        const strand = row.strand_name;
        grouped[year][`teachers_${strand}`] = row.teachers_count;
        grouped[year][`students_${strand}`] = row.students_count;
        grouped[year].historical_resignations += Number(row.historical_resignations) || 0;
        grouped[year].historical_retentions += Number(row.historical_retentions) || 0;
        grouped[year].workload_per_teacher += Number(row.workload_per_teacher) || 0;
        grouped[year].salary_ratio = row.salary_ratio;
        grouped[year].professional_dev_hours = row.professional_dev_hours;
        grouped[year].target_ratio = row.target_ratio;
        grouped[year].max_class_size = row.max_class_size;
      });
      return Object.values(grouped);
    };

    fetchData();
  }, []);

  // Modify callPredictionAPI to set loading false after data is set
  const callPredictionAPI = async (data) => {
    try {
      if (!Array.isArray(data)) {
        setNotification('Invalid data format for prediction.');
        setPredictionData(null);
        setLoading(false);
        return;
      }

      console.log('Saved data for prediction:', data);

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
        setLoading(false);
        return;
      }
      const result = await response.json();
      console.log('Raw prediction API response:', result);
      console.log('Saved data for prediction:', data);
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
            resignations_forecast: {},
            retentions_forecast: {},
          };
          for (const strand of Object.keys(result['resignations_count'])) {
            yearData.resignations_count[strand] = result['resignations_forecast'] ? (result['resignations_forecast'][strand][i] || 0) : 0;
            yearData.retentions_count[strand] = result['retentions_forecast'] ? (result['retentions_forecast'][strand][i] || 0) : 0;
            yearData.hires_needed[strand] = result['hires_needed'][strand][i] || 0;
            // Use forecast rates directly from backend without dividing by teacher counts
            yearData.resignations_forecast[strand] = result['resignations_forecast'] ? (result['resignations_forecast'][strand][i] || 0) : 0;
            yearData.retentions_forecast[strand] = result['retentions_forecast'] ? (result['retentions_forecast'][strand][i] || 0) : 0;
          }
          transformedData.push(yearData);
        }
        console.log('Transformed prediction data:', transformedData);
        setPredictionData(transformedData);
        setLoading(false);
      } else {
        setPredictionData(null);
        setLoading(false);
      }
    } catch (error) {
      setNotification('Error calling prediction API.');
      setPredictionData(null);
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      console.log('Fetching recommendations from API...');
      const response = await fetch(`http://localhost:8000/api/teacher_retention_recommendations.php?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      console.log('Parsed recommendations API response:', data);
      if (data && Array.isArray(data.recommendations)) {
        console.log(`Setting recommendations with length: ${data.recommendations.length}`);
        setRecommendations(data.recommendations);
      } else {
        console.log('No recommendations found in API response.');
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    }
  };

  // Removed duplicate callPredictionAPI declaration to fix redeclaration error

  const callPhpPredictionAPI = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/teacher_retention_prediction.php', { method: 'GET' });
      if (!response.ok) {
        throw new Error('PHP Prediction API error');
      }
      const result = await response.json();
      if (result.resignations_count && result.retentions_count && result.hires_needed) {
        setPhpPredictionData(result);
      } else {
        setPhpPredictionData(null);
      }
    } catch (error) {
      console.error('Error calling PHP prediction API:', error);
      setPhpPredictionData(null);
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
        const json = await res.json();
        const data = json.data || [];
        setSavedData(data);
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
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <div>Loading data, please wait...</div>
          </div>
        ) : !showForm ? (
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
                  {console.log(`Rendering recommendations, length: ${recommendations.length}`)}
                  {recommendations.length > 0 ? (
                    <>
                      <h3>Recommendations</h3>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {recommendations.map((rec, idx) => (
                          <div key={idx} style={{ marginBottom: '0.75rem' }}>
                            <strong>{rec.type}:</strong> {rec.message}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div>No recommendations available.</div>
                  )}
                </div>
              </div>
              <div className="Right-column" style={{ flex: 1, marginLeft: '10px', maxWidth:'500px',maxHeight:'400px', display: 'flex', flexDirection: 'column' }}>
                <div>
                  {predictionData ? (
                    <div className="prediction-summary">
                      <h3>Prediction Summary (Per Strand)</h3>
                    {predictionData.map((item, index) => {
                    return (
                      <div key={index} style={{ marginBottom: '1rem' }}>
                        <strong>Year {item.year}:</strong>
                        <div style={{ marginLeft: '1rem' }}>
                          {Object.keys(item.resignations_forecast || {}).map(strand => (
                            <div key={strand} style={{ marginBottom: '0.25rem' }}>
                              <em>{strand}</em> - Chance of Resigning: {(item.resignations_forecast[strand] || 0).toFixed(4)}, Chance of Retaining: {(item.retentions_forecast[strand] || 0).toFixed(4)}, To be Hired: {typeof item.hires_needed[strand] === 'number' ? item.hires_needed[strand] : Array.isArray(item.hires_needed[strand]) ? item.hires_needed[strand].join(', ') : '0'}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                    </div>
                  ) : (
                    <div>No prediction data available.</div>
                  )}
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {phpPredictionData ? (
                    <div className="prediction-summary">
                      <h3>Prediction Summary (Per Strand) - PHP Prediction</h3>
                      {Object.keys(phpPredictionData.resignations_count || {}).map(strand => (
                        <div key={strand} style={{ marginBottom: '0.25rem' }}>
                          <em>{strand}</em> - Resigning: {(phpPredictionData.resignations_count[strand][0] || 0).toFixed(2)}, Retaining: {(phpPredictionData.retentions_count[strand][0] || 0).toFixed(2)}, To be Hired: {(phpPredictionData.hires_needed[strand][0] || 0).toFixed(2)}<br/>
                          Mean Historical Resignations: {(phpPredictionData.mean_historical_resignations[strand] || 0).toFixed(2)}, Mean Historical Retentions: {(phpPredictionData.mean_historical_retentions[strand] || 0).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  ) : null}
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
      <div className="table-section saved-data-container" style={{ display: 'block' }}>
        <div className="saved-data-section" >
          <h2>Historical Data</h2>
          <TeacherRetentionDataTable data={savedData} />
        </div>
      </div>
    </div>
  );
};

export default TeacherRetentionPredictionPage;
