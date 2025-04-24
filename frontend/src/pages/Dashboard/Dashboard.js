import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import RiskAssessmentChart from '../RiskAssessment/RiskAssessmentChart';
import EnrollmentChart from '../StudentEnrollmentPrediction/EnrollmentChart';
import '../RiskAssessment/Risk-Assessment.css';
import './Dashboard.css';

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [teachers, setTeachers] = useState([]);
  const [viewMode, setViewMode] = useState('strand');

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/risk_assessment.php');
      if (!response.ok) throw new Error('Failed to fetch risk assessment data');
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching risk assessment data:', error);
      setTeachers([]);
    }
  }, []);

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
  }, [fetchTeachers]);

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
        <div className="main-content">
          <div className="content-header">
            <div className="Enrollment-Chart">
              <EnrollmentChart />
            </div>
          </div>
          <div className="Risk-Assessment">
            <div className="chart-section">
              <h2>
                Risk Heatmap
              </h2>
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
              <RiskAssessmentChart teachers={teachers} viewMode={viewMode} />
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


