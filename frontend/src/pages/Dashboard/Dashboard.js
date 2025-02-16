import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getCurrentRole, isAuthenticated } from '../../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt,
  faChartLine,
  faUserCheck,
  faUsers,
  faUser,
  faFileAlt,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    const role = getCurrentRole();
    setUserRole(role);
    
    if (!['admin', 'manager', 'user'].includes(role)) {
      navigate('/unauthorized');
    }
  }, [navigate]);

  return (
    <div className="bg-gray-900 text-white font-sans">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-1/5 bg-gray-800 h-screen p-4">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gray-500 rounded-full mr-4"></div>
            <div>
              <h1 className="text-xl font-bold">LYCEUM OF ALABANG</h1>
            </div>
          </div>
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gray-500 rounded-full mr-4"></div>
            <div>
              <h2 className="text-lg font-semibold">Rollin</h2>
              <p className="text-sm text-gray-400">{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Loading...'}</p>
            </div>
          </div>
          <nav>
            <ul>
              <li className="mb-4">
              <button className="flex items-center text-pink-500" onClick={() => navigate('/dashboard')}>
                <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
                Dashboard
              </button>

              </li>
              <li className="mb-4">
              {userRole === 'admin' && (
                <button className="flex items-center text-gray-400" onClick={() => navigate('/analytics')}>
                  <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                  Predictive &amp; Prescriptive Analysis
                </button>

              )}
              </li>
              <li className="mb-4">
              {['admin', 'manager'].includes(userRole) && (
                <button className="flex items-center text-gray-400" onClick={() => navigate('/monitoring')}>
                  <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
                  Workforce Monitoring
                </button>

              )}
              </li>
              <li className="mb-4">
                <button className="flex items-center text-gray-400" onClick={() => navigate('/allocation')}>
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Workforce Allocation
                </button>

              </li>
              <li className="mb-4">
                <button className="flex items-center text-gray-400" onClick={() => navigate('/employees')}>
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Employee
                </button>

              </li>
              <li className="mb-4">
                <button className="flex items-center text-gray-400" onClick={() => navigate('/reports')}>
                  <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                  Report
                </button>

              </li>
              <li>
                <button className="flex items-center text-gray-400" onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userRole');
                  navigate('/login');
                }}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Logout
                </button>

              </li>
            </ul>
          </nav>
        </div>
        {/* Main Content */}
        <div className="w-4/5 p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-4 rounded-lg">
              <h2 className="text-black text-lg font-semibold mb-4">
                Data Forecasting: Student Enrollment Prediction
              </h2>
              <Bar 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Student Enrollment Prediction',
                    },
                  },
                }}
                data={{
                  labels: ['2021', '2022', '2023', '2024', '2025'],
                  datasets: [
                    {
                      label: 'Students',
                      data: [120, 135, 150, 165, 180],
                      backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    },
                  ],
                }}
              />
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h2 className="text-black text-lg font-semibold mb-4">
                Goal Alignment - Bullet Chart
              </h2>
              <div className="w-full h-48 bg-gray-200"></div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h2 className="text-black text-lg font-semibold mb-4">
                Impact of Class Size on Teacher Performance
              </h2>
              <Bar 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Class Size Impact',
                    },
                  },
                }}
                data={{
                  labels: ['Small', 'Medium', 'Large'],
                  datasets: [
                    {
                      label: 'Teacher Performance',
                      data: [85, 75, 60],
                      backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    },
                  ],
                }}
              />
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h2 className="text-black text-lg font-semibold mb-4">
                Risk Assessment by Likelihood and Impact
              </h2>
              <Bar 
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Risk Assessment',
                    },
                  },
                }}
                data={{
                  labels: ['Low', 'Medium', 'High'],
                  datasets: [
                    {
                      label: 'Likelihood',
                      data: [20, 50, 80],
                      backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    },
                    {
                      label: 'Impact',
                      data: [30, 60, 90],
                      backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    },
                  ],
                }}
              />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">WORKFORCE MONITORING</h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white p-4 rounded-lg text-center">
                <h3 className="text-black text-2xl font-bold">45</h3>
                <p className="text-black">Active Teachers</p>
                <p className="text-green-500">+10.0%</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <h3 className="text-black text-2xl font-bold">3</h3>
                <p className="text-black">Teachers on leave</p>
                <p className="text-green-500">+3.0%</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <h3 className="text-black text-2xl font-bold">
                  Teacher Per Department
                </h3>
                <div className="w-24 h-24 bg-gray-200 mx-auto rounded-full"></div>
                <p className="text-black">48 Total Teachers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="text-center mt-8 text-gray-400">
        © [(2024)] [Lyceum of Alabang]
      </footer>
    </div>
  );
}

export default Dashboard;
