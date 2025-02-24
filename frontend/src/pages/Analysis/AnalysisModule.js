import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StudentEnrollmentPrediction from './Student-enrollment-Prediction';
import RiskAssessment from './Risk-Assessment';
import TrendIdentification from './Trend-Identification';
import './AnalysisModule.css';
import '../../styles/sidebar.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine,faChartPie,faUsers,faUserCog,faUser, faFileAlt,faSignOutAlt} from '@fortawesome/free-solid-svg-icons';

function AnalysisModule() {
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

      <div className="dashboard-content" style={{ marginTop: '80px' }}>
        <div className="sidebar">
          <div className="sidebar-header">
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
          </div>

          <nav className="navigation">
            <ul>
              <li className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => { 
                setActiveMenu('dashboard'); 
                navigate('/dashboard'); 
              }}>
                <FontAwesomeIcon icon={faChartLine} />
                <span>Dashboard</span>
              </li>
              <li className={`nav-item ${activeMenu === 'analysis' ? 'active' : ''}`} onClick={() => { 
                setActiveMenu('analysis'); 
                navigate('/analysis'); 
              }}>
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
                <span>Employee</span>
              </li>
              <li className="nav-item">
                <FontAwesomeIcon icon={faFileAlt} />
                <span>Report</span>
              </li>
              <li className="nav-item logout" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>Logout</span>
              </li>

              {showLogoutModal && (
                <>
                  <div className="logout-modal-overlay" />
                  <div className="logout-modal">
                    <p>Are you sure you want to logout?</p>
                    <div className="logout-modal-buttons">
                      <button 
                        className="logout-modal-button yes"
                        onClick={confirmLogout}
                      >
                        Yes
                      </button>
                      <button 
                        className="logout-modal-button no"
                        onClick={cancelLogout}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </>
              )}
            </ul>
          </nav>
        </div>

        <div className="main-content">
          <div className="content-header">
            <h1>Analytics Dashboard</h1>
            <div className="date-filter">
              <select>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>            
          </div>

          <div className="analysis-modules">
            <div className="module-card">
              <img src="/images/placeholder.png" alt="Student Enrollment Prediction" className="module-image" />
              <button 
                className="module-button"
                onClick={() => navigate('/analysis/student-enrollment-prediction')}
              >
                Start
              </button>
            </div>

            <div className="module-card">
              <img src="/images/placeholder.png" alt="Trend Identification" className="module-image" />
              <button 
                className="module-button"
                onClick={() => navigate('/analysis/trend-identification')}
              >
                Start
              </button>
            </div>

            <div className="module-card">
              <img src="/images/placeholder.png" alt="Risk Assessment" className="module-image" />
              <button 
                className="module-button"
                onClick={() => navigate('/analysis/risk-assessment')}
              >
                Start
              </button>
            </div>
          </div>

          <div className="recommendation-section">
            <div className="recommendation-placeholder">
              <h2>Recommendations</h2>
              <div className="placeholder-content">
                {/* Automation will populate this section */}
              </div>
            </div>
          </div>

          <footer>
            © [(2024)] [Lyceum of Alabang]
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AnalysisModule;
