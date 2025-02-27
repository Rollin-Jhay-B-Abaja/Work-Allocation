import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login'; // Import Login component
import Dashboard from './pages/Dashboard/Dashboard'; // Import Dashboard component
import AnalysisPage from './pages/Analysis/AnalysisPage'; // Import AnalysisPage component



const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Set Login as the default route */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Route for Dashboard page */}
        <Route path="/analysis" element={<AnalysisPage />} /> {/* Route for Analysis page */}

      </Routes>
    </Router>
  );
};

export default AppRoutes;
