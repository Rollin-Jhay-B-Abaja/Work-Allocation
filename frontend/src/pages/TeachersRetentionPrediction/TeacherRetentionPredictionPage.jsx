import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PredictionChart from './PredictionChart';
import HiresChart from './HiresChart';
import EnrolleesChart from './EnrolleesChart';
import PredictedEnrolleesChart from './PredictedEnrolleesChart';
import RecommendationsPanel from './RecommendationsPanel';
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
  const [groupedSavedData, setGroupedSavedData] = useState([]);
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
        const groupedData = groupDataByYear(data);
        setGroupedSavedData(groupedData);

        // Trigger prediction APIs after data fetch
        console.log('Calling callPredictionAPI...');
        await callPredictionAPI(groupedData);
        // Removed callPhpPredictionAPI to prevent timeout error
        // console.log('Calling callPhpPredictionAPI...');
        // await callPhpPredictionAPI();
        console.log('Calling fetchRecommendations...');
        await fetchRecommendations();
        console.log('Finished fetchRecommendations');
      } catch (err) {
        console.error('Error fetching saved data on mount:', err);
        // Even if error, still call prediction APIs with empty data
        await callPredictionAPI([]);
        // await callPhpPredictionAPI();
        await fetchRecommendations();
      } finally {
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
            teachers_HUMMS: 0,
            teachers_ICT: 0,
            students_STEM: 0,
            students_ABM: 0,
            students_GAS: 0,
            students_HUMMS: 0,
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
        const teachers_total = ['teachers_STEM', 'teachers_ICT', 'teachers_GAS', 'teachers_ABM', 'teachers_HUMMS']
          .reduce((sum, key) => sum + (Number(row[key]) || 0), 0);
        const students_total = ['students_STEM', 'students_ICT', 'students_GAS', 'students_ABM', 'students_HUMMS']
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
      if (result.warnings && result.warnings.length > 0) {
        setNotification(result.warnings.join(' '));
      } else {
        setNotification('');
      }
      if (result['resignations_count'] && result['retentions_count'] && result['hires_needed']) {
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
            yearData.resignations_forecast[strand] = result['resignations_forecast'] ? (result['resignations_forecast'][strand][i] || 0) : 0;
            yearData.retentions_forecast[strand] = result['retentions_forecast'] ? (result['retentions_forecast'][strand][i] || 0) : 0;
            // Add predicted students count per strand for the chart
            if (result['student_forecasts'] && result['student_forecasts'][strand]) {
              yearData[`${strand}_students`] = result['student_forecasts'][strand][i] || 0;
            } else {
              yearData[`${strand}_students`] = 0;
            }
          }
          transformedData.push(yearData);
        }
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
      // Fetch recommendations from backend API
      const response = await fetch('http://localhost:8000/api/teacher_retention_recommendations.php');
      if (!response.ok) {
        console.error('Failed to fetch recommendations');
        setRecommendations([]);
        return;
      }
      const data = await response.json();
      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (savedData.some(item => item.year === formData.year)) {
      setNotification(`Data for year ${formData.year} already exists. Duplicate years are not allowed.`);
      return;
    }

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
            <div className="Visual" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderRadius: '8px', gap: '20px' }}>
              {/* 1st section: EnrolleesChart and PredictedEnrolleesChart side by side */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '10px' }}>
                  <EnrolleesChart data={groupedSavedData.length > 0 ? groupedSavedData : []} />
                </div>
              </div>
              <div style={{ marginRight:'80px', flex: 1, backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '10px' }}>
                <PredictedEnrolleesChart data={predictionData} />
              </div>
            </div>

            {/* 2nd section: PredictionChart and HiresChart stacked on left, prediction-summary on right */}
            <div className="Visual" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderRadius: '8px', gap: '20px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '10px', height:'400px', }}>
                  <PredictionChart data={predictionData} />
                </div>
                <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '10px', height:'400px',}}>
                  <HiresChart data={predictionData} />
                </div>
              </div>
              <div className="Right-column" style={{ flex: 1, maxWidth:'500px', maxHeight:'800px', display: 'flex', flexDirection: 'column' }}>
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
                              <em>{strand}</em> - Chance of Resigning: {((item.resignations_forecast[strand] || 0) * 100).toFixed(1)}%, Chance of Retaining: {((item.retentions_forecast[strand] || 0) * 100).toFixed(1)}%, To be Hired: {typeof item.hires_needed[strand] === 'number' ? item.hires_needed[strand] : Array.isArray(item.hires_needed[strand]) ? item.hires_needed[strand].join(', ') : '0'}
                              <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#ccc', marginTop: '2px' }}>
                                Resigning means teachers expected to leave their jobs. Retaining means teachers expected to stay. To be Hired indicates the number of new teachers needed.
                              </div>
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

