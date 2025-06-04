import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import './AnalysisPage.css';
import '../../styles/sidebar.css';

function AnalysisPage() {
  const navigate = useNavigate();
  const path = useLocation().pathname;

  useEffect(() => {
    // No need for activeMenu state here as Sidebar handles active menu
  }, [path]);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content" style={{ marginTop: '80px' }}>
        <div className="main-content">
          <div className="content-header">
            <h1>PREDICTION ANALYSIS</h1>
          </div>

          <div className="analysis-modules">
            <div className="module-card" onClick={() => navigate('/data-forecasting')} style={{ cursor: 'pointer' }}>
              <h2>Data Forecasting: Employee Prediction</h2>
            </div>

            <div className="module-card" onClick={() => navigate('/trend-identification')} style={{ cursor: 'pointer' }}>
              <h2>Trend Identification: Students Count vs Workload Per Teacher</h2>
            </div>

            <div className="module-card" onClick={() => navigate('/risk-assessment')} style={{ cursor: 'pointer' }}>
              <h2>Risk Assessment</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;
