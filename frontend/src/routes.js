import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import AnalysisPage from './pages/Analysis/AnalysisPage';
import TeacherRetentionPredictionPage from './pages/TeachersRetentionPrediction/TeacherRetentionPredictionPage';
import TrendIdentification from './pages/TrendIdentification/TrendIdentification';
import RiskAssessment from './pages/RiskAssessment/Risk-Assessment';
import PredictionChart from './pages/TeachersRetentionPrediction/PredictionChart';
import EmployeePage from './pages/Employee/EmployeePage';
import UnifiedWorkforceAllocation from './pages/Workforce/UnifiedWorkforceAllocation';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/data-forecasting" element={<TeacherRetentionPredictionPage />} />
        <Route path="/trend-identification" element={<TrendIdentification />} />
        <Route path="/risk-assessment" element={<RiskAssessment />} />
        <Route path="/prediction-results" element={<PredictionChart />} />
        <Route path="/workforce-allocation" element={<Navigate to="/workforce-allocation/unified" replace />} />
        <Route path="/workforce-allocation/unified" element={<UnifiedWorkforceAllocation />} />
        <Route path="/employee/create" element={<EmployeePage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
