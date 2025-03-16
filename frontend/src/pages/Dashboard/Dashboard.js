import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine,faChartPie,faUsers,faUserCog,faUser, faFileAlt,faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import { Bar } from 'react-chartjs-2';

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

  // Dummy data for charts
  const chartData1 = {
    labels: ['January', 'February', 'March', 'April'],
    datasets: [
      {
        label: 'Data-Forecasting',
        data: [65, 59, 80, 81],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartData2 = {
    labels: ['May', 'June', 'July', 'August'],
    datasets: [
      {
        label: 'Trends',
        data: [45, 39, 60, 71],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartData3 = {
    labels: ['September', 'October', 'November', 'December'],
    datasets: [
      {
        label: 'Teachers Performance',
        data: [75, 49, 90, 61],
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartData4 = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
    datasets: [
      {
        label: 'Risk Assessment',
        data: [55, 69, 80, 91],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
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
              <div className="metric-card">
                <p>Data-Forecasting</p>
                <Bar data={chartData1} options={{ maintainAspectRatio: false }} width={100} height={290} />
              </div>
              <div className="metric-card">
                <p>Trends</p>
                <Bar data={chartData2} options={{ maintainAspectRatio: false }} width={400} height={290} />
              </div>
              <div className="metric-card">
                <p>Teachers Performance</p>
                <Bar data={chartData3} options={{ maintainAspectRatio: false }} width={400} height={290} />
              </div>
              <div className="metric-card">
                <p>Risk Assessment</p>
                <Bar data={chartData4} options={{ maintainAspectRatio: false }} width={400} height={290} />
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
