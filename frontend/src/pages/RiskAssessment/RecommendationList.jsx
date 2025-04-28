import React from 'react';
import './Risk-Assessment.css';

const RecommendationList = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return <p>No recommendations available.</p>;
  }

  return (
    <div className="recommendation-list" style={{ maxHeight: '300px', overflowY: 'scroll', paddingRight: '10px' }}>
      <h2>Automated Recommendations</h2>
      <ul>
        {recommendations.map((rec, index) => (
          <li key={index} className="recommendation-item">
            <strong>{rec.type}:</strong> {rec.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendationList;
