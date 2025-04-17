import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine,faChartPie,faUsers,faUserCog,faUser, faFileAlt,faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import RiskAssessmentChart from '../RiskAssessment/RiskAssessmentChart';
import EnrollmentChart from '../StudentEnrollmentPrediction/EnrollmentChart';

function Dashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear any user session data if needed
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="logo"></div>
        <h1 className="title">LYCEUM OF ALABANG</h1>
      </header>

      <div className="dashboard-content" style={{ marginTop: '80px' }}>
        {/* Sidebar */}
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
              <li className="nav-item active">
                <FontAwesomeIcon icon={faChartLine} />
                <span>Dashboard</span>
              </li>
              <li className="nav-item" onClick={() => navigate('/analysis')}>
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

        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            <div className="grid-container">
              <div className="Enrollment-Chart">
                <EnrollmentChart />
              </div>
              <div className="Risk-Assessment">
                <RiskAssessmentChart/>
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
