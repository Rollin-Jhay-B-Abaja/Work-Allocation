import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faChartPie,
  faUsers,
  faUserCog,
  faUser,
  faFileAlt,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import './AnalysisPage.css';
import '../../styles/sidebar.css';

function AnalysisPage() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('analysis');
  const path = useLocation().pathname;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  useEffect(() => {
    if (path.includes('analysis')) {
      setActiveMenu('analysis');
    } else {
      setActiveMenu('dashboard');
    }
  }, [path]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title">LYCEUM OF ALABANG</h1>
      </header>

      <div className="dashboard-content" style={{ marginTop: '80px',}}>
        <div className="sidebar">
          <div className="profile-section">
            <img
              src="https://storage.googleapis.com/a1aa/image/sSoeRTDJiLWBct2HwIPm2jcMnDBqe2vrmr_nveDKPCA.jpg"
              alt="User profile"
              className="profile-picture"
            />
            <div className="profile-info">
              <p className="profile-name">Rollin</p>
              <p className="profile-role">HR Manager</p>
            </div>
          </div>
          <nav className="navigation">
            <ul>
              <li
                className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('dashboard');
                  navigate('/dashboard');
                }}
              >
                <FontAwesomeIcon icon={faChartLine} />
                <span>Dashboard</span>
              </li>
              <li
                className={`nav-item ${activeMenu === 'analysis' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu('analysis');
                  navigate('/analysis');
                }}
              >
                <FontAwesomeIcon icon={faChartPie} />
                <span>Analysis</span>
              </li>
              <li className="nav-item">
                <FontAwesomeIcon icon={faUsers} />
                <span>Workforce Monitoring</span>
              </li>
              <li className="nav-item">
                <FontAwesomeIcon icon={faUserCog} />
                <span>Workforce Allocation</span>
              </li>
              <li className="nav-item">
                <FontAwesomeIcon icon={faUser} />
                <span>Employees</span>
              </li>
              <li className="nav-item">
                <FontAwesomeIcon icon={faFileAlt} />
                <span>Report</span>
              </li>
              <li className="nav-item logout" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>Logout</span>
              </li>
            </ul>
          </nav>
        </div>

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

          <div className="recommendations-section">
            <h2>Recommendations</h2>
            <div className="analysis-modules">
              <div className="module-card" style={{ cursor: 'pointer' }}>
                <h2>Recommendation 1</h2>
                <div className="chart-placeholder">[Placeholder for recommendation]</div>
              </div>
              <div className="module-card" style={{ cursor: 'pointer' }}>
                <h2>Recommendation 2</h2>
                <div className="chart-placeholder">[Placeholder for recommendation]</div>
              </div>
              <div className="module-card" style={{ cursor: 'pointer' }}>
                <h2>Recommendation 3</h2>
                <div className="chart-placeholder">[Placeholder for recommendation]</div>
              </div>
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

          {/* New Scenario Simulation Section */}
          <footer>
            © [(2024)] [Lyceum of Alabang]
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;
