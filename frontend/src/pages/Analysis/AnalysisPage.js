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
              <h2>Data Forecasting: Student Enrollment Prediction</h2>
            </div>

            <div className="module-card" onClick={() => navigate('/trend-identification')} style={{ cursor: 'pointer' }}>
              <h2>Trend Identification: Faculty Performance Distribution</h2>
            </div>

            <div className="module-card" onClick={() => navigate('/risk-assessment')} style={{ cursor: 'pointer' }}>
              <h2>Risk Assessment: Likelihood of Potential Risk</h2>
            </div>
          </div>

          <div className="scenario-simulation-section">
            <h2>Scenario Simulation</h2>
            <div className="analysis-modules">
              <div className="module-card" style={{ cursor: 'pointer' }}>
                <h2>Simulation Result 1</h2>
                <div className="chart-placeholder">[Placeholder for simulation chart]</div>
              </div>
              <div className="module-card" style={{ cursor: 'pointer' }}>
                <h2>Simulation Result 2</h2>
                <div className="chart-placeholder">[Placeholder for simulation chart]</div>
              </div>
              <div className="module-card" style={{ cursor: 'pointer' }}>
                <h2>Simulation Result 3</h2>
                <div className="chart-placeholder">[Placeholder for simulation chart]</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;
