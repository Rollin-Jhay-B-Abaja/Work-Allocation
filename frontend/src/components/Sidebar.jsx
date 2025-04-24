import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faChartPie, faUsers, faUserCog, faUser, faFileAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function Sidebar() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear any user session data if needed
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleMenuClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  // Determine active menu based on current path
  const getActiveMenu = () => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/analysis')) return 'analysis';
    if (path.startsWith('/workforce-allocation')) return 'workforce-allocation';
    if (path.startsWith('/employee')) return 'employee';
    // Add other paths as needed
    return '';
  };

  const activeMenu = getActiveMenu();

  return (
    <div className="sidebar">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title">LYCEUM OF ALABANG</h1>
      </header>
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
          <li
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleMenuClick('/dashboard')}
          >
            <FontAwesomeIcon icon={faChartLine} />
            <span>Dashboard</span>
          </li>
          <li
            className={`nav-item ${activeMenu === 'analysis' ? 'active' : ''}`}
            onClick={() => handleMenuClick('/analysis')}
          >
            <FontAwesomeIcon icon={faChartPie} />
            <span>Analysis</span>
          </li>
          <li className="nav-item">
            <FontAwesomeIcon icon={faUsers} />
            <span>Workforce Monitoring</span>
          </li>
          <li
            className={`nav-item ${activeMenu === 'workforce-allocation' ? 'active' : ''}`}
            onClick={() => handleMenuClick('/workforce-allocation')}
          >
            <FontAwesomeIcon icon={faUserCog} />
            <span>Workforce Allocation</span>
          </li>
          <li
            className={`nav-item ${activeMenu === 'employee' ? 'active' : ''}`}
            onClick={() => handleMenuClick('/employee/create')}
          >
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
  );
}

export default Sidebar;
