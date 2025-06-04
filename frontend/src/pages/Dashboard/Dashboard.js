import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { RiskHeatmapChart } from '../RiskAssessment/RiskAssessmentChart';
import ScatterPlot from '../TrendIdentification/ScatterPlot';
import PredictionChart from '../TeachersRetentionPrediction/PredictionChart';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../RiskAssessment/Risk-Assessment.css';
import './Dashboard.css';

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [teachers, setTeachers] = useState([]);
  const [riskHeatmapData, setRiskHeatmapData] = useState(null);
  const [loadingRiskHeatmap, setLoadingRiskHeatmap] = useState(true);
  const [trendDataPoints, setTrendDataPoints] = useState([]);
  const [trendCorrelation, setTrendCorrelation] = useState(null);
  const [predictionData, setPredictionData] = useState([]);
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);

  const fetchRiskAssessmentData = useCallback(async () => {
    setLoadingRiskHeatmap(true);
    try {
      const response = await fetch('http://localhost:8000/api/risk_assessment.php');
      if (!response.ok) throw new Error('Failed to fetch risk assessment data');
      const data = await response.json();
      setRiskHeatmapData(data.weightedRiskResults || data);
    } catch (error) {
      console.error('Error fetching risk assessment data:', error);
      setRiskHeatmapData(null);
    } finally {
      setLoadingRiskHeatmap(false);
    }
  }, []);

  const fetchTrendData = useCallback(async () => {
    setLoadingTrend(true);
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
        y: Number(row['WorkloadPerTeacher'] || 0),
        strand: row['Strand'] || row['strand_name'] || 'Unknown',
        year: row['Year'] || row['year'] || 'Unknown'
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
    } finally {
      setLoadingTrend(false);
    }
  }, []);

  const fetchPredictionData = useCallback(async () => {
    setLoadingPrediction(true);
    try {
      const savedDataResponse = await fetch('http://localhost:8000/api/get_prediction_data.php');
      if (!savedDataResponse.ok) {
        throw new Error('Failed to fetch saved prediction data');
      }
      const savedDataJson = await savedDataResponse.json();
      const savedData = savedDataJson.data || [];

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

      const response = await fetch('http://localhost:5000/api/data_forecasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prediction API error:', errorText);
        setPredictionData([]);
        return;
      }
      const result = await response.json();

      if (result.error) {
        console.error('Prediction API returned error:', result.error);
        setPredictionData([]);
        return;
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
        setPredictionData(transformedData.length > 0 ? transformedData : []);
      } else {
        setPredictionData([]);
      }
    } catch (error) {
      console.error('Error fetching prediction data:', error);
      setPredictionData([]);
    } finally {
      setLoadingPrediction(false);
    }
  }, []);

  useEffect(() => {
    fetchRiskAssessmentData();
    fetchTrendData();
    fetchPredictionData();
  }, [fetchRiskAssessmentData, fetchTrendData, fetchPredictionData]);

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

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title">LYCEUM OF ALABANG</h1>
      </header>

      <div className="dashboard-content" style={{ marginTop: '80px' }}>
        <Sidebar activeMenu={activeMenu} onMenuClick={setActiveMenu} />

        <div className="Dashboard-main-content">
          <div className="prediction-chart-section" style={{ marginBottom: '2rem', maxWidth: '1000px', marginLeft: '50px', marginRight: '10px' }}>
            {loadingPrediction ? <LoadingSpinner /> : <PredictionChart data={predictionData} />}
          </div>

          <div className="two-column-container" style={{ display: 'flex', gap: '10px', width: '100%', marginLeft: '0', marginRight: '0', flexWrap: 'nowrap' }}>
            <div className="Scatter-Plot" style={{ flex: '1 1 50%', minWidth: '500px', height: '500px' }}>
              {loadingTrend ? (
                <LoadingSpinner />
              ) : (
                <ScatterPlot
                  maximized={true}
                  dataPoints={trendDataPoints}
                  correlation={trendCorrelation}
                  xLabel="Students Count"
                  yLabel="Workload Per Teacher"
                  height={400}
                />
              )}
            </div>
            <div className="Risk-Heatmap" style={{ flex: '1 1 50%', minWidth: '300px', height: '500px', backgroundColor: '#1e1e1e', borderRadius: '8px', color: 'white', padding: '10px' }}>
              <h3>Risk Heatmap</h3>
              {loadingRiskHeatmap ? (
                <LoadingSpinner />
              ) : riskHeatmapData ? (
                <>
                  <RiskHeatmapChart weightedRiskResults={riskHeatmapData} height={300} />
                  <></>
                </>
              ) : (
                <p>No risk assessment data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
