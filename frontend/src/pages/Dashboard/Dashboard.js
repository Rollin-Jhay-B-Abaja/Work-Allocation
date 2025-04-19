import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import RiskAssessmentChart from '../RiskAssessment/RiskAssessmentChart';
import EnrollmentChart from '../StudentEnrollmentPrediction/EnrollmentChart';

function Dashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

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
            <div className="grid-container">
              <div className="Enrollment-Chart">
                <EnrollmentChart />
              </div>
              <div className="Risk-Assessment">
                <RiskAssessmentChart />
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


