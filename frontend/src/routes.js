import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login'; // Import Login component
import Dashboard from './pages/Dashboard/Dashboard'; // Import Dashboard component
import AnalysisPage from './pages/Analysis/AnalysisPage'; // Import AnalysisPage component
import StudentEnrollmentPrediction from './pages/StudentEnrollmentPrediction/StudentEnrollmentPrediction'; // Import Student Enrollment Prediction component
import TrendIdentification from './pages/TrendIdentification/TrendIdentification';
import RiskAssessment from './pages/RiskAssessment/Risk-Assessment'; // Import RiskAssessment component
import PredictionChart from './pages/StudentEnrollmentPrediction/PredictionChart'; // Import PredictionChart component

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Set Login as the default route */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Route for Dashboard page */}
        <Route path="/analysis" element={<AnalysisPage />} /> {/* Route for Analysis page */}
        <Route path="/data-forecasting" element={<StudentEnrollmentPrediction />} /> {/* Route for data-forecasting page */}
        <Route path="/trend-identification" element={<TrendIdentification />} /> {/* Route for trend-identification page */}
        <Route path="/risk-assessment" element={<RiskAssessment />} /> {/* Route for risk-assessment page */}
        <Route path="/prediction-results" element={<PredictionChart />} /> {/* Route for prediction results */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
