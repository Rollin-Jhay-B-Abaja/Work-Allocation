import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login'; // Import Login component
import Dashboard from './pages/Dashboard/Dashboard'; // Import Dashboard component
import AnalysisPage from './pages/Analysis/AnalysisPage'; // Import AnalysisPage component
import TeacherRetentionPredictionPage from './pages/TeachersRetentionPrediction/TeacherRetentionPredictionPage'; // Import Teachers Retention prediction component
import TrendIdentification from './pages/TrendIdentification/TrendIdentification';
import RiskAssessment from './pages/RiskAssessment/Risk-Assessment'; // Import RiskAssessment component
import PredictionChart from './pages/TeachersRetentionPrediction/PredictionChart'; // Import PredictionChart component
import Workforce_Allocation_Page from './pages/Workforce/Workforce_Allocation_Page'; // Import Workforce Allocation Page
import EmployeePage from './pages/Employee/EmployeePage'; // Import Employee Page

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Set Login as the default route */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Route for Dashboard page */}
        <Route path="/analysis" element={<AnalysisPage />} /> {/* Route for Analysis page */}
        <Route path="/data-forecasting" element={<TeacherRetentionPredictionPage />} /> {/* Route for data-forecasting page */}
        <Route path="/trend-identification" element={<TrendIdentification />} /> {/* Route for trend-identification page */}
        <Route path="/risk-assessment" element={<RiskAssessment />} /> {/* Route for risk-assessment page */}
        <Route path="/prediction-results" element={<PredictionChart />} /> {/* Route for prediction results */}
        <Route path="/workforce-allocation" element={<Workforce_Allocation_Page />} /> {/* Route for Workforce Allocation page */}
        <Route path="/employee/create" element={<EmployeePage />} /> {/* Route for Employee page */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
