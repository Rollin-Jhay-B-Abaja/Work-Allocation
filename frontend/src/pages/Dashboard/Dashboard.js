import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import RiskAssessmentChart from '../RiskAssessment/RiskAssessmentChart';
import ScatterPlot from '../TrendIdentification/ScatterPlot';
import PredictionChart from '../TeachersRetentionPrediction/PredictionChart';
import '../RiskAssessment/Risk-Assessment.css';
import './Dashboard.css';

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [teachers, setTeachers] = useState([]);
  const [riskProbabilities, setRiskProbabilities] = useState({});
  const [riskHeatmapData, setRiskHeatmapData] = useState(null);
  const [viewMode, setViewMode] = useState('strand');

  // New state for trend identification scatter plot data
  const [trendDataPoints, setTrendDataPoints] = useState([]);
  const [trendCorrelation, setTrendCorrelation] = useState(null);

  // New state for prediction chart data
  const [predictionData, setPredictionData] = useState([]);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/risk_assessment.php');
      if (!response.ok) throw new Error('Failed to fetch risk assessment data');
      const data = await response.json();
      setTeachers(data.teachers || []);
      setRiskProbabilities(data.riskHeatmap || {}); // Use riskHeatmap from API response
      setRiskHeatmapData(data.riskHeatmap || null);
    } catch (error) {
      console.error('Error fetching risk assessment data:', error);
      setTeachers([]);
      setRiskProbabilities({});
      setRiskHeatmapData(null);
    }
  }, []);

  // Fetch trend identification data for scatter plot
  const fetchTrendData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/trend_identification.php');
      if (!response.ok) throw new Error('Failed to fetch trend identification data');
      const data = await response.json();
      if (data.error) {
        console.error('Trend identification API error:', data.error);
        setTrendDataPoints([]);
        setTrendCorrelation(null);
        return;
      }
      const dataPoints = (Array.isArray(data.data) ? data.data : []).map(row => ({
        x: Number(row['StudentsCount'] || 0),
        y: Number(row['WorkloadPerTeacher'] || 0)
      })).filter(point => !isNaN(point.x) && !isNaN(point.y));
      setTrendDataPoints(dataPoints);

      // Calculate correlation coefficient
      const xVals = dataPoints.map(p => p.x);
      const yVals = dataPoints.map(p => p.y);
      const correlation = (xVals.length === yVals.length && xVals.length > 0) ? calculateCorrelation(xVals, yVals) : null;
      setTrendCorrelation(correlation);
    } catch (error) {
      console.error('Error fetching trend identification data:', error);
      setTrendDataPoints([]);
      setTrendCorrelation(null);
    }
  }, []);

  // Fetch prediction data for prediction chart
  const fetchPredictionData = useCallback(async () => {
    console.log('Fetching saved prediction data for Dashboard...');
    try {
      // Fetch saved prediction data
      const savedDataResponse = await fetch('http://localhost:8000/api/get_prediction_data.php');
      if (!savedDataResponse.ok) {
        throw new Error('Failed to fetch saved prediction data');
      }
      const savedDataJson = await savedDataResponse.json();
      const savedData = savedDataJson.data || [];

      // Group data by year and create strand-specific keys (similar to TeachersRetentionPredictionPage)
      const groupedData = {};
      savedData.forEach(row => {
        const year = row.year;
        if (!groupedData[year]) {
          groupedData[year] = {
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
        groupedData[year][`teachers_${strand}`] = row.teachers_count;
        groupedData[year][`students_${strand}`] = row.students_count;
        groupedData[year].historical_resignations += Number(row.historical_resignations) || 0;
        groupedData[year].historical_retentions += Number(row.historical_retentions) || 0;
        groupedData[year].workload_per_teacher += Number(row.workload_per_teacher) || 0;
        groupedData[year].salary_ratio = row.salary_ratio;
        groupedData[year].professional_dev_hours = row.professional_dev_hours;
        groupedData[year].target_ratio = row.target_ratio;
        groupedData[year].max_class_size = row.max_class_size;
      });
      const groupedDataArray = Object.values(groupedData);

      // Prepare enhanced data with totals
      const enhancedData = groupedDataArray.map(row => {
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

      // Call data_forecasting API (POST)
      const response = await fetch('http://localhost:5000/api/data_forecasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prediction API error:', errorText);
        setPredictionData([]);
        setPredictionError('Failed to fetch prediction data from server.');
        return;
      }
      const result = await response.json();
      console.log('Prediction API response data:', result);

      if (result.error) {
        console.error('Prediction API returned error:', result.error);
        setPredictionData([]);
        setPredictionError(result.error);
        return;
      }
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Prediction API warnings:', result.warnings.join(' '));
      }
      if (result['resignations_count'] && result['retentions_count'] && result['hires_needed']) {
        const yearsCount = Object.values(result['resignations_count'])[0]?.length || 0;
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
          }
          transformedData.push(yearData);
        }
        console.log('Transformed prediction data:', transformedData);
        setPredictionData(transformedData.length > 0 ? transformedData : []);
        setPredictionError(null);
      } else {
        console.warn('Prediction API missing expected keys or empty data');
        setPredictionData([]);
        setPredictionError('Prediction data is empty or incomplete.');
      }
    } catch (error) {
      console.error('Error fetching prediction data:', error);
      setPredictionData([]);
      setPredictionError('Error fetching prediction data.');
    }
  }, []);

  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [predictionError, setPredictionError] = useState(null);

  useEffect(() => {
    const loadPredictionData = async () => {
      setLoadingPrediction(true);
      setPredictionError(null);
      try {
        await fetchPredictionData();
      } catch (error) {
        setPredictionError('Failed to load prediction data');
      } finally {
        setLoadingPrediction(false);
      }
    };
    loadPredictionData();
  }, [fetchPredictionData]);

  useEffect(() => {
    fetchTeachers();
    fetchTrendData();
    fetchPredictionData();
  }, [fetchTeachers, fetchTrendData, fetchPredictionData]);

  // Helper function to calculate Pearson correlation coefficient
  const calculateCorrelation = (x, y) => {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    const numerator = x.reduce((acc, val, i) => acc + (val - meanX) * (y[i] - meanY), 0);
    const denominatorX = Math.sqrt(x.reduce((acc, val) => acc + (val - meanX) ** 2, 0));
    const denominatorY = Math.sqrt(y.reduce((acc, val) => acc + (val - meanY) ** 2, 0));
    const denominator = denominatorX * denominatorY;
    if (denominator === 0) return 0;
    return numerator / denominator;
  };

  const getHighestRiskLevel = () => {
    if (!teachers || teachers.length === 0) return null;
    if (teachers.some(t => t['Risk Level'] === 'High')) return 'High';
    if (teachers.some(t => t['Risk Level'] === 'Medium')) return 'Medium';
    return 'Low';
  };

  const highestRiskLevel = getHighestRiskLevel();

  const riskLevelColor = (level) => {
    switch (level) {
      case 'High':
        return 'red';
      case 'Medium':
        return 'orange';
      case 'Low':
      default:
        return 'green';
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchTrendData();
    fetchPredictionData();
  }, [fetchTeachers, fetchTrendData, fetchPredictionData]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="logo"></div>
        <h1 className="title">LYCEUM OF ALABANG</h1>
      </header>

      <div className="dashboard-content" style={{ marginTop: '80px' }}>
        {/* Sidebar */}
        <Sidebar activeMenu={activeMenu} onMenuClick={setActiveMenu} />

        {/* Main Content */}
        <div className="Dashboard-main-content">
          <div className="content-header">
          </div>

          {/* First section: Prediction Chart */}
          <div className="prediction-chart-section" style={{ marginBottom: '2rem' }}>
            <PredictionChart data={predictionData} />
          </div>

          {/* Second section: two columns */}
          <div className="two-column-container">
            <div className="Scatter-Plot">
              <ScatterPlot
                maximized={true}
                dataPoints={trendDataPoints}
                correlation={trendCorrelation}
                xLabel="Students Count"
                yLabel="Workload Per Teacher"
              />
            </div>
            <div className="risk-main-section risk-assessment-container" >
              <div className="charts-column" style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="RiskAssessment-chart">
                  <h2>Risk Heatmap</h2>
                  <div className="view-mode-buttons" style={{ marginBottom: '10px' }}>
                    <button
                      onClick={() => setViewMode('strand')}
                      className={viewMode === 'strand' ? 'active' : ''}
                      style={{ marginRight: '10px' }}
                    >
                      Strand-wise View
                    </button>
                    <button
                      onClick={() => setViewMode('teacher')}
                      className={viewMode === 'teacher' ? 'active' : ''}
                    >
                      Teacher-wise View
                    </button>
                  </div>
                  <RiskAssessmentChart teachers={teachers} viewMode={viewMode} riskProbabilities={riskProbabilities} />
                </div>
              </div>
            </div>
          </div>

          <div className="workforce-monitoring">
            <h2>WORKFORCE MONITORING</h2>
            <div className="workforce">
              <div className="workforce-card">
                <p>Active Teachers</p>
                <p className="workforce">45</p>
                <p className="metric-change positive">+10.0%</p>
              </div>
              <div className="workforce-card">
                <p>Teachers on leave</p>
                <p className="workforce">3</p>
                <p className="workforce">+3.0%</p>
              </div>
              <div className="workforce-card">
                <p>Teacher Per Department</p>
                <div className="metric-value">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
