import React from 'react';
import PropTypes from 'prop-types';
import './TeacherRetentionPredictionPage.css';

const RecommendationsPanel = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendations-panel no-recommendations">
        No recommendations available.
      </div>
    );
  }

  return (
    <div className="recommendations-panel">
      <h3 className="recommendations-title">Recommendations</h3>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-item">
            {rec.message}
          </div>
        ))}
      </div>
    </div>
  );
};

RecommendationsPanel.propTypes = {
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      message: PropTypes.string.isRequired,
    })
  ),
};

export default RecommendationsPanel;
